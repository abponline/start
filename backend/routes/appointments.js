const express = require('express');
const { body, validationResult } = require('express-validator');
const { Appointment, Customer, Staff, Service, Payment } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const router = express.Router();

// Validation middleware
const validateAppointment = [
  body('customerId').isUUID(),
  body('staffId').isUUID(),
  body('serviceId').isUUID(),
  body('appointmentDate').isISO8601().toDate(),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('price').isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('notes').optional().trim().escape()
];

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      date, 
      staffId, 
      customerId, 
      status = 'all',
      sortBy = 'appointmentDate',
      sortOrder = 'ASC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    // Filter by date
    if (date) {
      where.appointmentDate = date;
    }

    // Filter by staff
    if (staffId) {
      where.staffId = staffId;
    }

    // Filter by customer
    if (customerId) {
      where.customerId = customerId;
    }

    // Filter by status
    if (status !== 'all') {
      where.status = status;
    }

    const appointments = await Appointment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Staff,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'category', 'duration', 'price']
        },
        {
          model: Payment,
          as: 'payment',
          required: false
        }
      ]
    });

    res.json({
      appointments: appointments.rows,
      pagination: {
        total: appointments.count,
        page: parseInt(page),
        pages: Math.ceil(appointments.count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get available time slots for a specific date and staff member
router.get('/available-slots', async (req, res) => {
  try {
    const { date, staffId, serviceId } = req.query;

    if (!date || !staffId || !serviceId) {
      return res.status(400).json({ error: 'Date, staffId, and serviceId are required' });
    }

    // Get service details
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Get staff working hours for the day
    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const dayOfWeek = moment(date).format('dddd').toLowerCase();
    const workingHours = staff.workingHours[dayOfWeek];

    if (!workingHours || !workingHours.working) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for the date and staff
    const existingAppointments = await Appointment.findAll({
      where: {
        staffId,
        appointmentDate: date,
        status: { [Op.notIn]: ['cancelled', 'no-show'] }
      },
      order: [['startTime', 'ASC']]
    });

    // Generate available time slots
    const availableSlots = [];
    const startTime = moment(workingHours.start, 'HH:mm');
    const endTime = moment(workingHours.end, 'HH:mm');
    const serviceDuration = service.duration;

    let currentTime = startTime.clone();

    while (currentTime.clone().add(serviceDuration, 'minutes').isSameOrBefore(endTime)) {
      const slotStart = currentTime.format('HH:mm');
      const slotEnd = currentTime.clone().add(serviceDuration, 'minutes').format('HH:mm');

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = moment(appointment.startTime, 'HH:mm:ss');
        const appointmentEnd = moment(appointment.endTime, 'HH:mm:ss');
        const slotStartMoment = moment(slotStart, 'HH:mm');
        const slotEndMoment = moment(slotEnd, 'HH:mm');

        return slotStartMoment.isBefore(appointmentEnd) && slotEndMoment.isAfter(appointmentStart);
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: slotStart,
          endTime: slotEnd
        });
      }

      currentTime.add(30, 'minutes'); // 30-minute intervals
    }

    res.json({ availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Staff,
          as: 'staff'
        },
        {
          model: Service,
          as: 'service'
        },
        {
          model: Payment,
          as: 'payment'
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create new appointment
router.post('/', validateAppointment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get service details to calculate end time
    const service = await Service.findByPk(req.body.serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Calculate end time
    const startTime = moment(req.body.startTime, 'HH:mm');
    const endTime = startTime.clone().add(service.duration, 'minutes').format('HH:mm');

    // Check for conflicts
    const conflictingAppointment = await Appointment.findOne({
      where: {
        staffId: req.body.staffId,
        appointmentDate: req.body.appointmentDate,
        status: { [Op.notIn]: ['cancelled', 'no-show'] },
        [Op.or]: [
          {
            startTime: { [Op.between]: [req.body.startTime, endTime] }
          },
          {
            endTime: { [Op.between]: [req.body.startTime, endTime] }
          },
          {
            [Op.and]: [
              { startTime: { [Op.lte]: req.body.startTime } },
              { endTime: { [Op.gte]: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot not available' });
    }

    const appointmentData = {
      ...req.body,
      endTime,
      price: req.body.price || service.price
    };

    const appointment = await Appointment.create(appointmentData);
    
    // Include related data in response
    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: ['customer', 'staff', 'service']
    });

    res.status(201).json(fullAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/:id', validateAppointment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [updated] = await Appointment.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = await Appointment.findByPk(req.params.id, {
      include: ['customer', 'staff', 'service', 'payment']
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Cancel appointment
router.put('/:id/cancel', async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const [updated] = await Appointment.update({
      status: 'cancelled',
      cancellationReason,
      cancelledAt: new Date()
    }, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = await Appointment.findByPk(req.params.id, {
      include: ['customer', 'staff', 'service']
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Complete appointment
router.put('/:id/complete', async (req, res) => {
  try {
    const { actualStartTime, actualEndTime, notes } = req.body;

    const [updated] = await Appointment.update({
      status: 'completed',
      actualStartTime,
      actualEndTime,
      notes
    }, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update customer's last visit and total spent
    const appointment = await Appointment.findByPk(req.params.id, {
      include: ['customer']
    });

    await Customer.update({
      lastVisit: new Date(),
      totalSpent: appointment.customer.totalSpent + parseFloat(appointment.price),
      loyaltyPoints: appointment.customer.loyaltyPoints + Math.floor(appointment.price / 10)
    }, {
      where: { id: appointment.customerId }
    });

    const fullAppointment = await Appointment.findByPk(req.params.id, {
      include: ['customer', 'staff', 'service', 'payment']
    });

    res.json(fullAppointment);
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ error: 'Failed to complete appointment' });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Appointment.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;