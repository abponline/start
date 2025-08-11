const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salon.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Customers table
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      date_of_birth DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Staff table
  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      role TEXT DEFAULT 'stylist',
      specialties TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Services table
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price DECIMAL(10,2) NOT NULL,
      duration INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Appointments table
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      appointment_date DATETIME NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      total_price DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (staff_id) REFERENCES staff (id),
      FOREIGN KEY (service_id) REFERENCES services (id)
    )
  `);

  // Insert sample data
  // Sample services
  const services = [
    ['Haircut & Style', 'Professional haircut with styling', 'Hair', 45.00, 60],
    ['Hair Color', 'Full hair coloring service', 'Hair', 85.00, 120],
    ['Manicure', 'Classic manicure with polish', 'Nails', 25.00, 45],
    ['Pedicure', 'Relaxing pedicure service', 'Nails', 35.00, 60],
    ['Facial Treatment', 'Deep cleansing facial', 'Skincare', 65.00, 75],
    ['Eyebrow Shaping', 'Professional eyebrow shaping', 'Beauty', 20.00, 30]
  ];

  const insertService = db.prepare(`
    INSERT OR IGNORE INTO services (name, description, category, price, duration)
    VALUES (?, ?, ?, ?, ?)
  `);

  services.forEach(service => {
    insertService.run(service);
  });
  insertService.finalize();

  // Sample staff
  const staff = [
    ['Sarah', 'Johnson', 'sarah@salon.com', '555-0101', 'Senior Stylist', 'Hair cutting, coloring'],
    ['Mike', 'Davis', 'mike@salon.com', '555-0102', 'Nail Technician', 'Manicures, pedicures'],
    ['Emma', 'Wilson', 'emma@salon.com', '555-0103', 'Esthetician', 'Facials, skincare'],
    ['Alex', 'Brown', 'alex@salon.com', '555-0104', 'Stylist', 'Hair styling, treatments']
  ];

  const insertStaff = db.prepare(`
    INSERT OR IGNORE INTO staff (first_name, last_name, email, phone, role, specialties)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  staff.forEach(member => {
    insertStaff.run(member);
  });
  insertStaff.finalize();

  console.log('✅ Database initialized with sample data');
});

module.exports = db;