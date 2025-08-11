const express = require('express');
const { body, validationResult } = require('express-validator');
const { Inventory } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const validateInventory = [
  body('name').isLength({ min: 2 }).trim().escape(),
  body('category').isIn(['shampoo', 'conditioner', 'hair_color', 'styling_products', 'tools', 'equipment', 'skincare', 'nail_products', 'supplies', 'other']),
  body('currentStock').isInt({ min: 0 }),
  body('minStockLevel').isInt({ min: 0 }),
  body('unit').isIn(['pieces', 'bottles', 'tubes', 'ml', 'grams', 'liters', 'boxes']),
  body('costPrice').isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('sellPrice').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('description').optional().trim().escape(),
  body('brand').optional().trim().escape(),
  body('supplier').optional().trim().escape()
];

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      lowStock = 'false',
      active = 'true',
      search = '',
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

    // Filter by low stock
    if (lowStock === 'true') {
      where[Op.and] = [
        { currentStock: { [Op.lte]: { [Op.col]: 'minStockLevel' } } }
      ];
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }

    const inventory = await Inventory.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    res.json({
      inventory: inventory.rows,
      pagination: {
        total: inventory.count,
        page: parseInt(page),
        pages: Math.ceil(inventory.count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create new inventory item
router.post('/', validateInventory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'SKU or barcode already exists' });
    }
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', validateInventory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const [updated] = await Inventory.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = await Inventory.findByPk(req.params.id);
    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Update stock level
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation = 'set', reason } = req.body;

    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Quantity must be a number' });
    }

    const item = await Inventory.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    let newStock;
    switch (operation) {
      case 'add':
        newStock = item.currentStock + quantity;
        break;
      case 'subtract':
        newStock = item.currentStock - quantity;
        break;
      case 'set':
      default:
        newStock = quantity;
        break;
    }

    if (newStock < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    const updateData = {
      currentStock: newStock,
      lastRestocked: operation === 'add' ? new Date() : item.lastRestocked,
      lowStockAlerted: newStock <= item.minStockLevel ? false : item.lowStockAlerted
    };

    await Inventory.update(updateData, {
      where: { id: req.params.id }
    });

    const updatedItem = await Inventory.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Delete inventory item (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Inventory.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deactivated successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const lowStockItems = await Inventory.findAll({
      where: {
        [Op.and]: [
          { currentStock: { [Op.lte]: { [Op.col]: 'minStockLevel' } } },
          { isActive: true }
        ]
      },
      order: [['currentStock', 'ASC']]
    });

    res.json({ lowStockItems });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Get inventory statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalItems = await Inventory.count({ where: { isActive: true } });
    const lowStockItems = await Inventory.count({
      where: {
        [Op.and]: [
          { currentStock: { [Op.lte]: { [Op.col]: 'minStockLevel' } } },
          { isActive: true }
        ]
      }
    });

    const totalValue = await Inventory.sum('costPrice', { where: { isActive: true } });

    const categoryBreakdown = await Inventory.findAll({
      attributes: [
        'category',
        [Inventory.sequelize.fn('COUNT', '*'), 'count'],
        [Inventory.sequelize.fn('SUM', Inventory.sequelize.col('costPrice')), 'totalValue']
      ],
      where: { isActive: true },
      group: ['category']
    });

    const stats = {
      totalItems,
      lowStockItems,
      totalValue: totalValue || 0,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category,
        count: parseInt(item.get('count')),
        totalValue: parseFloat(item.get('totalValue')) || 0
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory statistics' });
  }
});

// Get inventory categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      { value: 'shampoo', label: 'Shampoo' },
      { value: 'conditioner', label: 'Conditioner' },
      { value: 'hair_color', label: 'Hair Color' },
      { value: 'styling_products', label: 'Styling Products' },
      { value: 'tools', label: 'Tools' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'skincare', label: 'Skincare' },
      { value: 'nail_products', label: 'Nail Products' },
      { value: 'supplies', label: 'Supplies' },
      { value: 'other', label: 'Other' }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;