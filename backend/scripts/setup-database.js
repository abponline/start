const { sequelize, Customer, Staff, Service, Appointment, Payment, Inventory } = require('../models');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    console.log('✅ Database tables created successfully');

    // Create default admin user if none exists
    const adminExists = await Staff.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await Staff.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@salon.com',
        phone: '+1-555-000-0000',
        role: 'admin',
        specializations: ['management'],
        isActive: true
      });
      console.log('✅ Default admin user created');
    }

    // Create sample services if none exist
    const serviceCount = await Service.count();
    if (serviceCount === 0) {
      const sampleServices = [
        {
          name: 'Basic Haircut',
          description: 'Classic haircut and styling',
          category: 'haircut',
          duration: 60,
          price: 45.00,
          availableForOnlineBooking: true
        },
        {
          name: 'Hair Color Full',
          description: 'Complete hair coloring service',
          category: 'coloring',
          duration: 180,
          price: 120.00,
          requiresConsultation: true
        },
        {
          name: 'Facial Treatment',
          description: 'Relaxing facial with cleansing and moisturizing',
          category: 'facial',
          duration: 90,
          price: 75.00
        },
        {
          name: 'Manicure',
          description: 'Professional nail care and polish',
          category: 'manicure',
          duration: 45,
          price: 35.00
        },
        {
          name: 'Deep Conditioning Treatment',
          description: 'Intensive hair treatment for damaged hair',
          category: 'treatment',
          duration: 45,
          price: 50.00
        }
      ];

      await Service.bulkCreate(sampleServices);
      console.log('✅ Sample services created');
    }

    // Create sample inventory items if none exist
    const inventoryCount = await Inventory.count();
    if (inventoryCount === 0) {
      const sampleInventory = [
        {
          name: 'Professional Shampoo',
          category: 'shampoo',
          brand: 'SalonPro',
          currentStock: 20,
          minStockLevel: 5,
          unit: 'bottles',
          costPrice: 12.50,
          sellPrice: 25.00,
          supplier: 'Beauty Supply Co.'
        },
        {
          name: 'Hair Color - Blonde',
          category: 'hair_color',
          brand: 'ColorMaster',
          currentStock: 15,
          minStockLevel: 3,
          unit: 'tubes',
          costPrice: 8.00,
          sellPrice: 16.00,
          supplier: 'Color Wholesale'
        },
        {
          name: 'Professional Scissors',
          category: 'tools',
          brand: 'CutPro',
          currentStock: 5,
          minStockLevel: 2,
          unit: 'pieces',
          costPrice: 150.00,
          supplier: 'Tool Supplies Inc.'
        }
      ];

      await Inventory.bulkCreate(sampleInventory);
      console.log('✅ Sample inventory created');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = setupDatabase;