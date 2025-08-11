const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Get all appointments
router.get('/', (req, res) => {
  const query = `
    SELECT 
      a.id,
      a.appointment_date,
      a.status,
      a.notes,
      a.total_price,
      a.created_at,
      c.first_name || ' ' || c.last_name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      s.first_name || ' ' || s.last_name as staff_name,
      sv.name as service_name,
      sv.duration as service_duration
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    ORDER BY a.appointment_date DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ appointments: rows });
  });
});

// Get appointment by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT 
      a.*,
      c.first_name || ' ' || c.last_name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      s.first_name || ' ' || s.last_name as staff_name,
      sv.name as service_name,
      sv.duration as service_duration,
      sv.price as service_price
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    WHERE a.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json({ appointment: row });
  });
});

// Get appointments by date range
router.get('/date/:start/:end', (req, res) => {
  const query = `
    SELECT 
      a.id,
      a.appointment_date,
      a.status,
      a.notes,
      a.total_price,
      c.first_name || ' ' || c.last_name as customer_name,
      s.first_name || ' ' || s.last_name as staff_name,
      sv.name as service_name,
      sv.duration as service_duration
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    WHERE DATE(a.appointment_date) BETWEEN ? AND ?
    ORDER BY a.appointment_date
  `;
  
  db.all(query, [req.params.start, req.params.end], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ appointments: rows });
  });
});

// Create new appointment
router.post('/', (req, res) => {
  const { customer_id, staff_id, service_id, appointment_date, notes } = req.body;
  
  if (!customer_id || !staff_id || !service_id || !appointment_date) {
    res.status(400).json({ error: 'Customer ID, staff ID, service ID, and appointment date are required' });
    return;
  }

  // Get service price
  db.get('SELECT price FROM services WHERE id = ?', [service_id], (err, service) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const query = `
      INSERT INTO appointments (customer_id, staff_id, service_id, appointment_date, notes, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [customer_id, staff_id, service_id, appointment_date, notes, service.price], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ 
        message: 'Appointment created successfully',
        appointment_id: this.lastID 
      });
    });
  });
});

// Update appointment
router.put('/:id', (req, res) => {
  const { customer_id, staff_id, service_id, appointment_date, status, notes, total_price } = req.body;
  
  const query = `
    UPDATE appointments 
    SET customer_id = ?, staff_id = ?, service_id = ?, appointment_date = ?, 
        status = ?, notes = ?, total_price = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [customer_id, staff_id, service_id, appointment_date, status, notes, total_price, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json({ message: 'Appointment updated successfully' });
  });
});

// Cancel appointment
router.patch('/:id/cancel', (req, res) => {
  const query = `
    UPDATE appointments 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json({ message: 'Appointment cancelled successfully' });
  });
});

module.exports = router;