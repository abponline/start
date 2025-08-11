const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Get all staff members
router.get('/', (req, res) => {
  const query = `
    SELECT id, first_name, last_name, email, phone, role, specialties, is_active, created_at, updated_at
    FROM staff 
    WHERE is_active = 1
    ORDER BY last_name, first_name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ staff: rows });
  });
});

// Get staff member by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT id, first_name, last_name, email, phone, role, specialties, is_active, created_at, updated_at
    FROM staff 
    WHERE id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    res.json({ staff_member: row });
  });
});

// Get staff schedule for a specific date
router.get('/:id/schedule/:date', (req, res) => {
  const query = `
    SELECT 
      a.id,
      a.appointment_date,
      a.status,
      c.first_name || ' ' || c.last_name as customer_name,
      sv.name as service_name,
      sv.duration as service_duration
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN services sv ON a.service_id = sv.id
    WHERE a.staff_id = ? AND DATE(a.appointment_date) = ?
    ORDER BY a.appointment_date
  `;
  
  db.all(query, [req.params.id, req.params.date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ schedule: rows });
  });
});

// Create new staff member
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, role, specialties } = req.body;
  
  if (!first_name || !last_name) {
    res.status(400).json({ error: 'First name and last name are required' });
    return;
  }

  const query = `
    INSERT INTO staff (first_name, last_name, email, phone, role, specialties)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [first_name, last_name, email, phone, role, specialties], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      message: 'Staff member created successfully',
      staff_id: this.lastID 
    });
  });
});

// Update staff member
router.put('/:id', (req, res) => {
  const { first_name, last_name, email, phone, role, specialties, is_active } = req.body;
  
  const query = `
    UPDATE staff 
    SET first_name = ?, last_name = ?, email = ?, phone = ?, 
        role = ?, specialties = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [first_name, last_name, email, phone, role, specialties, is_active, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    res.json({ message: 'Staff member updated successfully' });
  });
});

module.exports = router;