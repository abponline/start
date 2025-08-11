const express = require('express');
const { body, validationResult } = require('express-validator');
const { Staff, Appointment, Service } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const validateStaff = [
  body('firstName').isLength({ min: 2 }).trim().escape(),
  body('lastName').isLength({ min: 2 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone().escape(),
  body('role').isIn(['admin', 'manager', 'stylist', 'receptionist']),
  body('specializations').optional().isArray(),
  body('hireDate').optional().isISO8601().toDate(),
  body('workingHours').optional().isObject(),
  body('commissionRate').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('hourlyRate').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('bio').optional().trim().escape()
];

// Get all staff
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      active = 'true',
      sortBy = 'lastName',
      sortOrder = 'ASC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by active status
    if (active !== 'all') {
      where.isActive = active === 'true';
    }

    const staff = await Staff.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'name', 'category'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      staff: staff.rows,
      pagination: {
        total: staff.count,
        page: parseInt(page),
        pages: Math.ceil(staff.count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Get staff member by ID
router.get('/:id', async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id, {
      include: [
        {
          model: Service,
          as: 'services',
          through: { attributes: [] }
        },
        {
          model: Appointment,
          as: 'appointments',
          limit: 10,
          order: [['appointmentDate', 'DESC']],
          include: ['customer', 'service']
        }
      ]
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

// Create new staff member
router.post('/', validateStaff, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const staff = await Staff.create(req.body);
    res.status(201).json(staff);
  } catch (error) {
    console.error('Error creating staff member:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// Update staff member
router.put('/:id', validateStaff, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [updated] = await Staff.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staff = await Staff.findByPk(req.params.id);
    res.json(staff);
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff member (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Staff.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deactivated successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// Get staff schedule for a specific date range
router.get('/:id/schedule', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const appointments = await Appointment.findAll({
      where: {
        staffId: req.params.id,
        appointmentDate: {
          [Op.between]: [startDate, endDate]
        },
        status: { [Op.notIn]: ['cancelled', 'no-show'] }
      },
      order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']],
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'category', 'duration']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching staff schedule:', error);
    res.status(500).json({ error: 'Failed to fetch staff schedule' });
  }
});

// Get staff performance statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { staffId: req.params.id };

    if (startDate && endDate) {
      where.appointmentDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const appointments = await Appointment.findAll({
      where,
      include: ['payment']
    });

    const stats = {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
      noShowAppointments: appointments.filter(a => a.status === 'no-show').length,
      totalRevenue: appointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + parseFloat(a.price), 0),
      averageAppointmentValue: 0
    };

    if (stats.completedAppointments > 0) {
      stats.averageAppointmentValue = stats.totalRevenue / stats.completedAppointments;
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({ error: 'Failed to fetch staff statistics' });
  }
});

// Update staff working hours
router.put('/:id/working-hours', async (req, res) => {
  try {
    const { workingHours } = req.body;

    if (!workingHours || typeof workingHours !== 'object') {
      return res.status(400).json({ error: 'Valid workingHours object is required' });
    }

    const [updated] = await Staff.update(
      { workingHours },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staff = await Staff.findByPk(req.params.id);
    res.json({ workingHours: staff.workingHours });
  } catch (error) {
    console.error('Error updating working hours:', error);
    res.status(500).json({ error: 'Failed to update working hours' });
  }
});

module.exports = router;