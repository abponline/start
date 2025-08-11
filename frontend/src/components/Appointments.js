import React, { useState, useEffect } from 'react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/appointments');
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return '#007bff';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      case 'no-show': return '#6c757d';
      default: return '#ffc107';
    }
  };

  const todayAppointments = appointments.filter(apt => 
    apt.appointment_date.split('T')[0] === selectedDate
  );

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments">
      <div className="page-header">
        <h2>📅 Appointment Management</h2>
        <p>Schedule and manage customer appointments</p>
      </div>

      <div className="appointments-controls">
        <div className="date-selector">
          <label>View appointments for:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>
        <button className="btn btn-primary">
          📞 New Appointment
        </button>
      </div>

      <div className="appointments-stats">
        <div className="stat-card">
          <div className="stat-number">{todayAppointments.length}</div>
          <div className="stat-label">Today's Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {todayAppointments.filter(apt => apt.status === 'scheduled').length}
          </div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {todayAppointments.filter(apt => apt.status === 'completed').length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            ${todayAppointments.reduce((sum, apt) => sum + (apt.total_price || 0), 0).toFixed(2)}
          </div>
          <div className="stat-label">Revenue</div>
        </div>
      </div>

      <div className="appointments-list">
        <h3>Appointments for {new Date(selectedDate).toLocaleDateString()}</h3>
        {todayAppointments.length === 0 ? (
          <div className="empty-state">
            <p>No appointments scheduled for this date.</p>
            <button className="btn btn-outline">Schedule First Appointment</button>
          </div>
        ) : (
          <div className="table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Staff</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments
                  .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
                  .map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="appointment-time">
                        {new Date(appointment.appointment_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>{appointment.customer_name}</td>
                      <td>{appointment.service_name}</td>
                      <td>{appointment.staff_name}</td>
                      <td>{appointment.service_duration} min</td>
                      <td>${appointment.total_price?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(appointment.status) }}
                        >
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;