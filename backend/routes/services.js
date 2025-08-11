const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Get all services
router.get('/', (req, res) => {
  const query = `
    SELECT id, name, description, category, price, duration, is_active, created_at, updated_at
    FROM services 
    WHERE is_active = 1
    ORDER BY category, name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ services: rows });
  });
});

// Get service by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT id, name, description, category, price, duration, is_active, created_at, updated_at
    FROM services 
    WHERE id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ service: row });
  });
});

// Get services by category
router.get('/category/:category', (req, res) => {
  const query = `
    SELECT id, name, description, category, price, duration, is_active, created_at, updated_at
    FROM services 
    WHERE category = ? AND is_active = 1
    ORDER BY name
  `;
  
  db.all(query, [req.params.category], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ services: rows });
  });
});

// Create new service
router.post('/', (req, res) => {
  const { name, description, category, price, duration } = req.body;
  
  if (!name || !price || !duration) {
    res.status(400).json({ error: 'Name, price, and duration are required' });
    return;
  }

  const query = `
    INSERT INTO services (name, description, category, price, duration)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [name, description, category, price, duration], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      message: 'Service created successfully',
      service_id: this.lastID 
    });
  });
});

// Update service
router.put('/:id', (req, res) => {
  const { name, description, category, price, duration, is_active } = req.body;
  
  const query = `
    UPDATE services 
    SET name = ?, description = ?, category = ?, price = ?, 
        duration = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [name, description, category, price, duration, is_active, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ message: 'Service updated successfully' });
  });
});

module.exports = router;