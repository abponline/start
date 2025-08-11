const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  staffId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Staff',
      key: 'id'
    }
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Services',
      key: 'id'
    }
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'scheduled', 'confirmed', 'in-progress', 
      'completed', 'cancelled', 'no-show'
    ),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  deposit: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  actualStartTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  actualEndTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  confirmationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cancellationReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rescheduleCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.JSON,
    allowNull: true
  },
  parentAppointmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['customerId']
    },
    {
      fields: ['staffId']
    },
    {
      fields: ['serviceId']
    },
    {
      fields: ['appointmentDate', 'startTime']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['staffId', 'appointmentDate', 'startTime']
    }
  ]
});

module.exports = Appointment;