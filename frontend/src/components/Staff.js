import React, { useState, useEffect } from 'react';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/staff');
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case 'senior stylist': return '💇‍♀️';
      case 'stylist': return '✂️';
      case 'nail technician': return '💅';
      case 'esthetician': return '🧴';
      case 'manager': return '👩‍💼';
      default: return '👤';
    }
  };

  if (loading) {
    return <div className="loading">Loading staff...</div>;
  }

  return (
    <div className="staff">
      <div className="page-header">
        <h2>👨‍💼 Staff Management</h2>
        <p>Manage staff members, roles, and schedules</p>
      </div>

      <div className="staff-stats">
        <div className="stat-card">
          <div className="stat-number">{staff.length}</div>
          <div className="stat-label">Total Staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {staff.filter(member => member.is_active).length}
          </div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {Array.from(new Set(staff.map(member => member.role))).length}
          </div>
          <div className="stat-label">Roles</div>
        </div>
      </div>

      <div className="staff-grid">
        {staff.length === 0 ? (
          <div className="empty-state">
            <p>No staff members found.</p>
            <button className="btn btn-primary">Add First Staff Member</button>
          </div>
        ) : (
          staff.map((member) => (
            <div key={member.id} className="staff-card">
              <div className="staff-avatar">
                {getRoleIcon(member.role)}
              </div>
              <div className="staff-info">
                <h3>{member.first_name} {member.last_name}</h3>
                <p className="staff-role">{member.role}</p>
                <div className="staff-contact">
                  <p>📧 {member.email}</p>
                  <p>📞 {member.phone}</p>
                </div>
                <div className="staff-specialties">
                  <strong>Specialties:</strong>
                  <p>{member.specialties}</p>
                </div>
                <div className="staff-status">
                  <span 
                    className={`status-indicator ${member.is_active ? 'active' : 'inactive'}`}
                  >
                    {member.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="staff-features">
        <h3>🛠️ Staff Management Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <h4>📅 Schedule Management</h4>
            <p>Manage staff schedules and availability</p>
          </div>
          <div className="feature-item">
            <h4>💼 Role Assignment</h4>
            <p>Assign roles and permissions to staff</p>
          </div>
          <div className="feature-item">
            <h4>📊 Performance Tracking</h4>
            <p>Track staff performance and productivity</p>
          </div>
          <div className="feature-item">
            <h4>💰 Commission Management</h4>
            <p>Calculate and manage staff commissions</p>
          </div>
        </div>
      </div>

      <div className="roles-overview">
        <h3>📋 Staff Roles</h3>
        <div className="roles-grid">
          {Array.from(new Set(staff.map(member => member.role))).map(role => {
            const roleStaff = staff.filter(member => member.role === role);
            return (
              <div key={role} className="role-summary">
                <div className="role-icon">{getRoleIcon(role)}</div>
                <h4>{role}</h4>
                <p>{roleStaff.length} staff member{roleStaff.length !== 1 ? 's' : ''}</p>
                <ul className="role-staff-list">
                  {roleStaff.map(member => (
                    <li key={member.id}>
                      {member.first_name} {member.last_name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Staff;