const express = require('express');
const { body, validationResult } = require('express-validator');
const { Customer, Appointment, Payment } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const validateCustomer = [
  body('firstName').isLength({ min: 2 }).trim().escape(),
  body('lastName').isLength({ min: 2 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone().escape(),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('address').optional().trim().escape(),
  body('notes').optional().trim().escape(),
  body('allergies').optional().trim().escape()
];

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'lastName', sortOrder = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    const where = search ? {
      [Op.or]: [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const customers = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Appointment,
          as: 'appointments',
          limit: 5,
          order: [['appointmentDate', 'DESC']],
          include: ['service', 'staff']
        }
      ]
    });

    res.json({
      customers: customers.rows,
      pagination: {
        total: customers.count,
        page: parseInt(page),
        pages: Math.ceil(customers.count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: Appointment,
          as: 'appointments',
          include: ['service', 'staff', 'payment'],
          order: [['appointmentDate', 'DESC']]
        },
        {
          model: Payment,
          as: 'payments',
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', validateCustomer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', validateCustomer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [updated] = await Customer.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await Customer.findByPk(req.params.id);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Customer.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deactivated successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Get customer statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const appointments = await Appointment.findAll({
      where: { customerId: req.params.id },
      include: ['payment']
    });

    const stats = {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
      noShowAppointments: appointments.filter(a => a.status === 'no-show').length,
      totalSpent: customer.totalSpent,
      loyaltyPoints: customer.loyaltyPoints,
      lastVisit: customer.lastVisit,
      averageSpendPerVisit: appointments.length > 0 ? customer.totalSpent / appointments.filter(a => a.status === 'completed').length : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer statistics' });
  }
});

module.exports = router;