const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'haircut', 'styling', 'coloring', 'treatment', 
      'facial', 'massage', 'manicure', 'pedicure', 
      'waxing', 'eyebrows', 'makeup', 'other'
    ),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 15,
      max: 480
    },
    comment: 'Duration in minutes'
  },
  price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiresConsultation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preparationTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Preparation time in minutes before service'
  },
  cleanupTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Cleanup time in minutes after service'
  },
  maxAdvanceBooking: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Maximum days in advance that this service can be booked'
  },
  minCancellationNotice: {
    type: DataTypes.INTEGER,
    defaultValue: 24,
    comment: 'Minimum hours notice required for cancellation'
  },
  availableForOnlineBooking: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiredProducts: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['availableForOnlineBooking']
    }
  ]
});

module.exports = Service;