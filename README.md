# Military Asset Management System

Enterprise-grade Military Asset Management System for tracking military assets across multiple bases.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Lucide React
- Recharts
- Axios
- React Router

### Backend

- Node.js
- Express.js
- JavaScript ES6+
- Prisma ORM

### Database

- PostgreSQL
- SQL

### Authentication

- JWT
- Bcrypt

## API Endpoints

### Authentication

POST /api/auth/login

### Assets

GET /api/assets
GET /api/assets/:id
POST /api/assets
PATCH /api/assets/:id
DELETE /api/assets/:id
GET /api/assets/dashboard

### Transfers

GET /api/transfers
GET /api/transfers/:id
POST /api/transfers

### Bases

GET /api/bases
GET /api/bases/:id
POST /api/bases
PATCH /api/bases/:id
DELETE /api/bases/:id

### Equipment Types

GET /api/equipment-types
GET /api/equipment-types/:id
POST /api/equipment-types
PATCH /api/equipment-types/:id
DELETE /api/equipment-types/:id

### Purchases

GET /api/purchases
GET /api/purchases/:id
POST /api/purchases

### Assignments

GET /api/assignments
GET /api/assignments/:id
POST /api/assignments
PATCH /api/assignments/:id
DELETE /api/assignments/:id

### Expenditures

GET /api/expenditures
GET /api/expenditures/:id
POST /api/expenditures

### Audit Logs

GET /api/audit-logs
GET /api/audit-logs/:id

### Reports

GET /api/reports
