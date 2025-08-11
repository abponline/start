import React, { useState, useEffect } from 'react';
import './App.css';

// API service
const api = {
  get: async (endpoint) => {
    const response = await fetch(`/api${endpoint}`);
    return response.json();
  },
  post: async (endpoint, data) => {
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// Components
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [services, customers, appointments] = await Promise.all([
          api.get('/services'),
          api.get('/customers'),
          api.get('/appointments')
        ]);
        
        setStats({
          totalServices: services.pagination?.total || 0,
          totalCustomers: customers.pagination?.total || 0,
          totalAppointments: appointments.pagination?.total || 0,
          recentServices: services.services?.slice(0, 3) || []
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalServices || 0}</div>
          <div className="stat-label">Services Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalCustomers || 0}</div>
          <div className="stat-label">Registered Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalAppointments || 0}</div>
          <div className="stat-label">Total Appointments</div>
        </div>
      </div>

      <div className="dashboard">
        <div className="card">
          <h3>🗓️ Appointment Management</h3>
          <p>Schedule, manage, and track customer appointments with our intuitive booking system.</p>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>Online booking calendar</li>
            <li>Staff availability tracking</li>
            <li>Automatic reminders</li>
            <li>Recurring appointments</li>
          </ul>
        </div>

        <div className="card">
          <h3>👥 Customer Management</h3>
          <p>Maintain detailed customer profiles with service history and preferences.</p>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>Customer profiles & contact info</li>
            <li>Service history tracking</li>
            <li>Allergies & preferences</li>
            <li>Loyalty points system</li>
          </ul>
        </div>

        <div className="card">
          <h3>✂️ Service Catalog</h3>
          <p>Comprehensive service management with pricing and duration tracking.</p>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>Service categories & pricing</li>
            <li>Duration & preparation time</li>
            <li>Staff specializations</li>
            <li>Online booking availability</li>
          </ul>
        </div>

        <div className="card">
          <h3>👨‍💼 Staff Management</h3>
          <p>Manage staff schedules, specializations, and performance tracking.</p>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>Staff profiles & roles</li>
            <li>Working hours & schedules</li>
            <li>Service specializations</li>
            <li>Performance analytics</li>
          </ul>
        </div>

        <div className="card">
          <h3>💳 Payment Processing</h3>
          <p>Handle payments, tips, discounts, and generate invoices seamlessly.</p>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>Multiple payment methods</li>
            <li>Tip & discount management</li>
            <li>Refund processing</li>
            <li>Revenue reporting</li>
          </ul>
        </div>

        <div className="card">
          <h3>📦 Inventory Management</h3>
          <p>Track products, supplies, and equipment with low stock alerts.</p>
          <ul style={{ marginLeft: '20px', color: '#666' }}>
            <li>Product catalog & categories</li>
            <li>Stock level monitoring</li>
            <li>Low stock alerts</li>
            <li>Supplier management</li>
          </ul>
        </div>
      </div>

      {stats?.recentServices && stats.recentServices.length > 0 && (
        <div className="card">
          <h3>Recent Services</h3>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentServices.map(service => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{service.category}</td>
                    <td>{service.duration} min</td>
                    <td>${service.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await api.get('/services');
        setServices(data.services || []);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadServices();
  }, []);

  if (loading) return <div className="loading">Loading services...</div>;

  return (
    <div>
      <h2>Service Catalog</h2>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Online Booking</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id}>
                <td>
                  <strong>{service.name}</strong>
                  {service.description && <div style={{ fontSize: '12px', color: '#666' }}>{service.description}</div>}
                </td>
                <td style={{ textTransform: 'capitalize' }}>{service.category.replace('_', ' ')}</td>
                <td>{service.duration} min</td>
                <td>${service.price}</td>
                <td>
                  <span className={`status ${service.availableForOnlineBooking ? 'completed' : 'cancelled'}`}>
                    {service.availableForOnlineBooking ? 'Available' : 'Not Available'}
                  </span>
                </td>
                <td>
                  <span className={`status ${service.isActive ? 'completed' : 'cancelled'}`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await api.get('/customers');
        setCustomers(data.customers || []);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomers();
  }, []);

  if (loading) return <div className="loading">Loading customers...</div>;

  return (
    <div>
      <h2>Customer Directory</h2>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Total Spent</th>
              <th>Loyalty Points</th>
              <th>Last Visit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.firstName} {customer.lastName}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>${customer.totalSpent}</td>
                <td>{customer.loyaltyPoints}</td>
                <td>{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}</td>
                <td>
                  <span className={`status ${customer.isActive ? 'completed' : 'cancelled'}`}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await api.get('/appointments');
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAppointments();
  }, []);

  if (loading) return <div className="loading">Loading appointments...</div>;

  return (
    <div>
      <h2>Appointment Schedule</h2>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Staff</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appointment => (
              <tr key={appointment.id}>
                <td>
                  <div>{new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {appointment.startTime} - {appointment.endTime}
                  </div>
                </td>
                <td>
                  {appointment.customer ? 
                    `${appointment.customer.firstName} ${appointment.customer.lastName}` : 
                    'Loading...'
                  }
                </td>
                <td>
                  {appointment.service ? appointment.service.name : 'Loading...'}
                </td>
                <td>
                  {appointment.staff ? 
                    `${appointment.staff.firstName} ${appointment.staff.lastName}` : 
                    'Loading...'
                  }
                </td>
                <td>${appointment.price}</td>
                <td>
                  <span className={`status ${appointment.status}`}>
                    {appointment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const APIStatus = () => {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await api.get('/health');
        setStatus(data);
      } catch (error) {
        setStatus({ status: 'ERROR', message: 'API not responding' });
      }
    };
    
    checkStatus();
  }, []);

  return (
    <div>
      <h2>System Status</h2>
      <div className="card">
        <h3>API Health Check</h3>
        {status ? (
          <div>
            <p><strong>Status:</strong> <span className={status.status === 'OK' ? 'success' : 'error'}>{status.status}</span></p>
            <p><strong>Message:</strong> {status.message}</p>
            {status.timestamp && <p><strong>Timestamp:</strong> {new Date(status.timestamp).toLocaleString()}</p>}
            {status.version && <p><strong>Version:</strong> {status.version}</p>}
          </div>
        ) : (
          <p>Checking API status...</p>
        )}
      </div>
      
      <div className="card">
        <h3>Available API Endpoints</h3>
        <ul>
          <li><code>GET /api/health</code> - System health check</li>
          <li><code>GET /api/services</code> - List all services</li>
          <li><code>GET /api/customers</code> - List all customers</li>
          <li><code>GET /api/appointments</code> - List all appointments</li>
          <li><code>GET /api/staff</code> - List all staff members</li>
          <li><code>GET /api/payments</code> - List all payments</li>
          <li><code>GET /api/inventory</code> - List inventory items</li>
        </ul>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'services', label: '✂️ Services' },
    { id: 'customers', label: '👥 Customers' },
    { id: 'appointments', label: '📅 Appointments' },
    { id: 'status', label: '⚙️ System Status' }
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'services': return <Services />;
      case 'customers': return <Customers />;
      case 'appointments': return <Appointments />;
      case 'status': return <APIStatus />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>💄 Salon Management System</h1>
          <p>Comprehensive business management solution for modern salons</p>
        </div>
      </header>

      <nav className="nav">
        <div className="container">
          <div className="nav-list">
            {navigation.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container">
        {renderPage()}
      </main>

      <footer style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <p>© 2024 Salon Management System. Built with React.js and Node.js.</p>
      </footer>
    </div>
  );
}

export default App;