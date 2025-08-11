import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p>Welcome to your salon management system</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Customers</h3>
            <p>Manage customer profiles and contact information</p>
            <div className="card-stats">Total: 0</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Appointments</h3>
            <p>Schedule and manage appointments</p>
            <div className="card-stats">Today: 0</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">✨</div>
          <div className="card-content">
            <h3>Services</h3>
            <p>Manage salon services and pricing</p>
            <div className="card-stats">Active: 6</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👨‍💼</div>
          <div className="card-content">
            <h3>Staff</h3>
            <p>Manage staff members and schedules</p>
            <div className="card-stats">Active: 4</div>
          </div>
        </div>
      </div>

      <div className="dashboard-features">
        <h3>🌟 Key Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <h4>📱 Online Booking</h4>
            <p>Allow customers to book appointments online 24/7</p>
          </div>
          <div className="feature-item">
            <h4>💳 Payment Processing</h4>
            <p>Integrated billing and payment management</p>
          </div>
          <div className="feature-item">
            <h4>📊 Analytics</h4>
            <p>Track business performance and customer insights</p>
          </div>
          <div className="feature-item">
            <h4>📧 Notifications</h4>
            <p>Automated appointment reminders and confirmations</p>
          </div>
          <div className="feature-item">
            <h4>📦 Inventory</h4>
            <p>Manage salon products and supplies</p>
          </div>
          <div className="feature-item">
            <h4>🔒 Security</h4>
            <p>Secure customer data and staff access control</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;