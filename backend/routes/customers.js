const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Get all customers
router.get('/', (req, res) => {
  const query = `
    SELECT id, first_name, last_name, email, phone, address, 
           date_of_birth, notes, created_at, updated_at 
    FROM customers 
    ORDER BY last_name, first_name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ customers: rows });
  });
});

// Get customer by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT id, first_name, last_name, email, phone, address, 
           date_of_birth, notes, created_at, updated_at 
    FROM customers 
    WHERE id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json({ customer: row });
  });
});

// Create new customer
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, address, date_of_birth, notes } = req.body;
  
  if (!first_name || !last_name) {
    res.status(400).json({ error: 'First name and last name are required' });
    return;
  }

  const query = `
    INSERT INTO customers (first_name, last_name, email, phone, address, date_of_birth, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [first_name, last_name, email, phone, address, date_of_birth, notes], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      message: 'Customer created successfully',
      customer_id: this.lastID 
    });
  });
});

// Update customer
router.put('/:id', (req, res) => {
  const { first_name, last_name, email, phone, address, date_of_birth, notes } = req.body;
  
  const query = `
    UPDATE customers 
    SET first_name = ?, last_name = ?, email = ?, phone = ?, 
        address = ?, date_of_birth = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [first_name, last_name, email, phone, address, date_of_birth, notes, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json({ message: 'Customer updated successfully' });
  });
});

// Delete customer
router.delete('/:id', (req, res) => {
  const query = 'DELETE FROM customers WHERE id = ?';
  
  db.run(query, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

module.exports = router;