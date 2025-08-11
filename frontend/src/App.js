import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Appointments from './components/Appointments';
import Services from './components/Services';
import Staff from './components/Staff';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>💄 Salon Management</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/customers" className="nav-link">Customers</Link>
            <Link to="/appointments" className="nav-link">Appointments</Link>
            <Link to="/services" className="nav-link">Services</Link>
            <Link to="/staff" className="nav-link">Staff</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/services" element={<Services />} />
            <Route path="/staff" element={<Staff />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
