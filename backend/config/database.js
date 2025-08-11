const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // Production database (PostgreSQL)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Development database (SQLite)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/salon.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });
}

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

module.exports = { sequelize, testConnection };