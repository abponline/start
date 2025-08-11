# Salon Management Software

A comprehensive salon management system that helps salon owners manage customers, appointments, services, staff, and business operations.

## Features

- **Customer Management**: Registration, profiles, contact information, service history
- **Appointment Scheduling**: Online booking, calendar management, time slot allocation
- **Service Management**: Service catalog, pricing, treatment categories
- **Staff Management**: Employee profiles, schedules, service assignments
- **Payment Processing**: Billing, invoicing, payment tracking
- **Inventory Management**: Product tracking, supply management
- **Reporting & Analytics**: Business insights, revenue tracking, customer analytics
- **Notifications**: Automated appointment reminders and confirmations

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React.js
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT-based authentication
- **Styling**: CSS3 with responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/abponline/start.git
cd start
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
```bash
npm run setup-db
```

4. Start the development server
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
salon-software/
├── backend/              # Express.js API server
│   ├── controllers/      # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── config/          # Configuration files
├── frontend/            # React.js application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service calls
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
├── database/            # Database schema and migrations
└── docs/               # Documentation
```

## API Documentation

The API provides RESTful endpoints for:
- `/api/customers` - Customer management
- `/api/appointments` - Appointment scheduling
- `/api/services` - Service management
- `/api/staff` - Staff management
- `/api/payments` - Payment processing
- `/api/inventory` - Inventory management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.