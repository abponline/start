import React, { useState, useEffect } from 'react';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(services.map(service => service.category)))];
  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  if (loading) {
    return <div className="loading">Loading services...</div>;
  }

  return (
    <div className="services">
      <div className="page-header">
        <h2>✨ Service Catalog</h2>
        <p>Manage salon services, pricing, and categories</p>
      </div>

      <div className="services-filters">
        <label>Filter by Category:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="services-grid">
        {filteredServices.length === 0 ? (
          <div className="empty-state">
            <p>No services found in this category.</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-header">
                <h3>{service.name}</h3>
                <span className="service-category">{service.category}</span>
              </div>
              <p className="service-description">{service.description}</p>
              <div className="service-details">
                <div className="service-price">
                  <strong>${service.price.toFixed(2)}</strong>
                </div>
                <div className="service-duration">
                  <span>⏱️ {service.duration} min</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="service-categories">
        <h3>Service Categories</h3>
        <div className="categories-overview">
          {categories.filter(cat => cat !== 'All').map(category => {
            const categoryServices = services.filter(s => s.category === category);
            const avgPrice = categoryServices.reduce((sum, s) => sum + s.price, 0) / categoryServices.length;
            
            return (
              <div key={category} className="category-summary">
                <h4>{category}</h4>
                <p>{categoryServices.length} services</p>
                <p>Avg. price: ${avgPrice.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Services;