const { sequelize } = require('../config/database');

// Import models
const Customer = require('./Customer');
const Staff = require('./Staff');
const Service = require('./Service');
const Appointment = require('./Appointment');
const Payment = require('./Payment');
const Inventory = require('./Inventory');

// Define associations
// Customer associations
Customer.hasMany(Appointment, { foreignKey: 'customerId', as: 'appointments' });
Customer.hasMany(Payment, { foreignKey: 'customerId', as: 'payments' });

// Staff associations
Staff.hasMany(Appointment, { foreignKey: 'staffId', as: 'appointments' });

// Service associations
Service.hasMany(Appointment, { foreignKey: 'serviceId', as: 'appointments' });

// Appointment associations
Appointment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Appointment.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Appointment.hasOne(Payment, { foreignKey: 'appointmentId', as: 'payment' });

// Self-referencing appointment for recurring appointments
Appointment.hasMany(Appointment, { foreignKey: 'parentAppointmentId', as: 'recurringAppointments' });
Appointment.belongsTo(Appointment, { foreignKey: 'parentAppointmentId', as: 'parentAppointment' });

// Payment associations
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Payment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Many-to-many relationship: Staff can provide multiple services, Services can be provided by multiple staff
const StaffService = sequelize.define('StaffService', {
  staffId: {
    type: sequelize.Sequelize.UUID,
    references: {
      model: Staff,
      key: 'id'
    }
  },
  serviceId: {
    type: sequelize.Sequelize.UUID,
    references: {
      model: Service,
      key: 'id'
    }
  }
}, {
  timestamps: true
});

Staff.belongsToMany(Service, { through: StaffService, foreignKey: 'staffId', as: 'services' });
Service.belongsToMany(Staff, { through: StaffService, foreignKey: 'serviceId', as: 'staff' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  Customer,
  Staff,
  Service,
  Appointment,
  Payment,
  Inventory,
  StaffService
};