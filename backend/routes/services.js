const express = require('express');
const { body, validationResult } = require('express-validator');
const { Service, Appointment, Staff } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const validateService = [
  body('name').isLength({ min: 2 }).trim().escape(),
  body('category').isIn(['haircut', 'styling', 'coloring', 'treatment', 'facial', 'massage', 'manicure', 'pedicure', 'waxing', 'eyebrows', 'makeup', 'other']),
  body('duration').isInt({ min: 15, max: 480 }),
  body('price').isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('description').optional().trim().escape()
];

// Get all services
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      active = 'true',
      availableForOnlineBooking,
      sortBy = 'name',
      sortOrder = 'ASC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by active status
    if (active !== 'all') {
      where.isActive = active === 'true';
    }

    // Filter by online booking availability
    if (availableForOnlineBooking) {
      where.availableForOnlineBooking = availableForOnlineBooking === 'true';
    }

    const services = await Service.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Staff,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      services: services.rows,
      pagination: {
        total: services.count,
        page: parseInt(page),
        pages: Math.ceil(services.count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        {
          model: Staff,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName', 'specializations'],
          through: { attributes: [] }
        },
        {
          model: Appointment,
          as: 'appointments',
          limit: 10,
          order: [['appointmentDate', 'DESC']],
          include: ['customer']
        }
      ]
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create new service
router.post('/', validateService, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
router.put('/:id', validateService, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [updated] = await Service.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = await Service.findByPk(req.params.id);
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Service.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ message: 'Service deactivated successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get service categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      { value: 'haircut', label: 'Haircut' },
      { value: 'styling', label: 'Hair Styling' },
      { value: 'coloring', label: 'Hair Coloring' },
      { value: 'treatment', label: 'Hair Treatment' },
      { value: 'facial', label: 'Facial' },
      { value: 'massage', label: 'Massage' },
      { value: 'manicure', label: 'Manicure' },
      { value: 'pedicure', label: 'Pedicure' },
      { value: 'waxing', label: 'Waxing' },
      { value: 'eyebrows', label: 'Eyebrows' },
      { value: 'makeup', label: 'Makeup' },
      { value: 'other', label: 'Other' }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Assign staff to service
router.post('/:id/staff', async (req, res) => {
  try {
    const { staffIds } = req.body;
    
    if (!Array.isArray(staffIds)) {
      return res.status(400).json({ error: 'staffIds must be an array' });
    }

    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const staff = await Staff.findAll({
      where: { id: { [Op.in]: staffIds } }
    });

    await service.setStaff(staff);

    const updatedService = await Service.findByPk(req.params.id, {
      include: [
        {
          model: Staff,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });

    res.json(updatedService);
  } catch (error) {
    console.error('Error assigning staff to service:', error);
    res.status(500).json({ error: 'Failed to assign staff to service' });
  }
});

module.exports = router;