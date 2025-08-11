const express = require('express');
const { body, validationResult } = require('express-validator');
const { Payment, Appointment, Customer } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation middleware
const validatePayment = [
  body('appointmentId').isUUID(),
  body('customerId').isUUID(),
  body('amount').isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('tip').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('paymentMethod').isIn(['cash', 'card', 'bank_transfer', 'digital_wallet', 'gift_card', 'loyalty_points']),
  body('discount').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('discountType').optional().isIn(['percentage', 'fixed', 'loyalty', 'promo_code']),
  body('tax').optional().isDecimal({ decimal_digits: '0,2' }).toFloat()
];

// Get all payments
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all',
      paymentMethod,
      customerId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    // Filter by status
    if (status !== 'all') {
      where.status = status;
    }

    // Filter by payment method
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Filter by customer
    if (customerId) {
      where.customerId = customerId;
    }

    // Filter by date range
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const payments = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointmentDate', 'startTime'],
          include: [
            {
              model: Service,
              as: 'service',
              attributes: ['id', 'name']
            },
            {
              model: Staff,
              as: 'staff',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });

    res.json({
      payments: payments.rows,
      pagination: {
        total: payments.count,
        page: parseInt(page),
        pages: Math.ceil(payments.count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Appointment,
          as: 'appointment',
          include: ['service', 'staff']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create new payment
router.post('/', validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Calculate total amount
    const amount = parseFloat(req.body.amount);
    const tip = parseFloat(req.body.tip) || 0;
    const discount = parseFloat(req.body.discount) || 0;
    const tax = parseFloat(req.body.tax) || 0;
    
    const totalAmount = amount + tip + tax - discount;

    const paymentData = {
      ...req.body,
      tip,
      discount,
      tax,
      totalAmount,
      status: 'completed' // Default to completed for now
    };

    const payment = await Payment.create(paymentData);
    
    // Include related data in response
    const fullPayment = await Payment.findByPk(payment.id, {
      include: ['customer', 'appointment']
    });

    res.status(201).json(fullPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Recalculate total amount if amounts change
    if (req.body.amount || req.body.tip || req.body.discount || req.body.tax) {
      const currentPayment = await Payment.findByPk(req.params.id);
      if (!currentPayment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const amount = parseFloat(req.body.amount) || currentPayment.amount;
      const tip = parseFloat(req.body.tip) || currentPayment.tip;
      const discount = parseFloat(req.body.discount) || currentPayment.discount;
      const tax = parseFloat(req.body.tax) || currentPayment.tax;
      
      req.body.totalAmount = amount + tip + tax - discount;
    }

    const [updated] = await Payment.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = await Payment.findByPk(req.params.id, {
      include: ['customer', 'appointment']
    });

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Process refund
router.post('/:id/refund', async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ error: 'Valid refund amount is required' });
    }

    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    const totalRefunded = payment.refundAmount + parseFloat(refundAmount);
    if (totalRefunded > payment.totalAmount) {
      return res.status(400).json({ error: 'Refund amount exceeds payment total' });
    }

    const status = totalRefunded === payment.totalAmount ? 'refunded' : 'partially_refunded';

    const [updated] = await Payment.update({
      refundAmount: totalRefunded,
      refundReason,
      refundedAt: new Date(),
      status
    }, {
      where: { id: req.params.id }
    });

    const updatedPayment = await Payment.findByPk(req.params.id, {
      include: ['customer', 'appointment']
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get payment statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { status: 'completed' };

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const payments = await Payment.findAll({ where });

    const stats = {
      totalPayments: payments.length,
      totalRevenue: payments.reduce((sum, payment) => sum + parseFloat(payment.totalAmount), 0),
      totalTips: payments.reduce((sum, payment) => sum + parseFloat(payment.tip), 0),
      totalDiscounts: payments.reduce((sum, payment) => sum + parseFloat(payment.discount), 0),
      totalTax: payments.reduce((sum, payment) => sum + parseFloat(payment.tax), 0),
      averagePayment: 0,
      paymentMethodBreakdown: {}
    };

    if (stats.totalPayments > 0) {
      stats.averagePayment = stats.totalRevenue / stats.totalPayments;
    }

    // Payment method breakdown
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!stats.paymentMethodBreakdown[method]) {
        stats.paymentMethodBreakdown[method] = {
          count: 0,
          total: 0
        };
      }
      stats.paymentMethodBreakdown[method].count++;
      stats.paymentMethodBreakdown[method].total += parseFloat(payment.totalAmount);
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Payment.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;