# 🏢 Attendance & Employee Management System

A production-ready, multi-tenant REST API built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**. Features JWT authentication, role-based access control, salary calculation engine, PDF/CSV exports, and Swagger documentation.

---

## 📁 Project Structure

```
attendance-system/
│
├── prisma/
│   ├── schema.prisma          # Database schema (all models + enums)
│   └── seed.js                # Demo data seeder
│
├── src/
│   ├── server.js              # Entry point — starts HTTP server + graceful shutdown
│   ├── app.js                 # Express app — middleware, routes, Swagger
│   │
│   ├── config/
│   │   ├── database.js        # Prisma client singleton + connect/disconnect
│   │   └── swagger.js         # OpenAPI 3.0 spec configuration
│   │
│   ├── controllers/           # Thin layer — parse request, call service, send response
│   │   ├── auth.controller.js
│   │   ├── employee.controller.js
│   │   ├── attendance.controller.js
│   │   ├── salary.controller.js
│   │   ├── leave.controller.js
│   │   ├── holiday.controller.js
│   │   ├── dashboard.controller.js
│   │   └── settings.controller.js
│   │
│   ├── services/              # Business logic layer — all heavy lifting goes here
│   │   ├── auth.service.js          # Register, login, JWT, password change
│   │   ├── employee.service.js      # CRUD + tenant isolation + soft delete
│   │   ├── attendance.service.js    # Mark, bulk-mark, history, daily/monthly views
│   │   ├── salary.service.js        # Salary calculation engine + payroll report
│   │   ├── leave.service.js         # Leave requests + approval workflow
│   │   ├── holiday.service.js       # Holiday calendar + bulk attendance marking
│   │   ├── dashboard.service.js     # Analytics, overview, trend data
│   │   └── export.service.js        # CSV and PDF report generation
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js  # authenticate (JWT), authorize (roles), validate
│   │   └── errorHandler.js     # AppError class, global error handler, 404 handler
│   │
│   ├── routes/                # Express routers with Swagger JSDoc annotations
│   │   ├── auth.routes.js
│   │   ├── employee.routes.js
│   │   ├── attendance.routes.js
│   │   ├── salary.routes.js
│   │   ├── leave.routes.js
│   │   ├── holiday.routes.js
│   │   ├── dashboard.routes.js
│   │   └── settings.routes.js
│   │
│   └── utils/
│       ├── logger.js       # Winston logger + Morgan stream adapter
│       ├── response.js     # sendSuccess, sendError, pagination helpers
│       ├── dateUtils.js    # Month ranges, working day counts, date parsing
│       └── jwt.js          # Token sign/verify, payload builder
│
├── .env.example            # Environment variable template
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Install Dependencies
```bash
cd attendance-system
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
```

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/attendance_db"
JWT_SECRET=your-minimum-32-character-secret-key-here
JWT_REFRESH_SECRET=another-minimum-32-character-secret-key
```

### 3. Run Database Migrations
```bash
npm run db:migrate     # Applies schema to PostgreSQL
npm run db:generate    # Generates Prisma Client
```

### 4. Seed Demo Data (optional)
```bash
npm run db:seed
# Creates: demo@company.com / Demo@1234 with 3 sample employees
```

### 5. Start the Server
```bash
npm run dev            # Development with hot reload
npm start              # Production
```

---

## 🌐 API Overview

| Base URL | Description |
|---|---|
| `http://localhost:5000/api/v1` | REST API |
| `http://localhost:5000/api/docs` | Swagger UI |
| `http://localhost:5000/api/health` | Health check |

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <accessToken>
```

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@corp.com",
    "password": "Secret@123",
    "organization": "Acme Corp"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@corp.com", "password": "Secret@123" }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Jane Doe", "organization": "Acme Corp" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 👥 Employee API

```bash
# Create employee
curl -X POST http://localhost:5000/api/v1/employees \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "age": 28,
    "salary": 5000,
    "role": "Software Engineer",
    "department": "Engineering",
    "joiningDate": "2024-01-15",
    "email": "alice@corp.com"
  }'

# List employees (paginated)
curl "http://localhost:5000/api/v1/employees?page=1&limit=10&search=alice" \
  -H "Authorization: Bearer TOKEN"

# Update employee
curl -X PATCH http://localhost:5000/api/v1/employees/EMPLOYEE_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "salary": 5500 }'

# Soft-delete employee
curl -X DELETE http://localhost:5000/api/v1/employees/EMPLOYEE_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## 📅 Attendance API

```bash
# Mark single attendance
curl -X POST http://localhost:5000/api/v1/attendance/mark \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "date": "2024-06-15",
    "status": "PRESENT",
    "checkIn": "2024-06-15T09:00:00Z",
    "checkOut": "2024-06-15T18:00:00Z"
  }'

# Bulk mark attendance (all employees in one request)
curl -X POST http://localhost:5000/api/v1/attendance/bulk-mark \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-06-15",
    "records": [
      { "employeeId": "ID_1", "status": "PRESENT" },
      { "employeeId": "ID_2", "status": "ABSENT" },
      { "employeeId": "ID_3", "status": "LEAVE", "note": "Sick leave" }
    ]
  }'

# Get attendance for all employees on a date
curl "http://localhost:5000/api/v1/attendance/daily/2024-06-15" \
  -H "Authorization: Bearer TOKEN"

# Get employee attendance history (with month filter)
curl "http://localhost:5000/api/v1/attendance/employee/EMPLOYEE_ID?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN"

# Monthly summary for all employees
curl "http://localhost:5000/api/v1/attendance/summary?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN"

# Export attendance as CSV
curl "http://localhost:5000/api/v1/attendance/employee/EMPLOYEE_ID/export?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN" \
  -o attendance_june.csv
```

---

## 💰 Salary API

```bash
# Calculate payroll for all employees
curl "http://localhost:5000/api/v1/salary/payroll?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN"

# Response example:
# {
#   "totalPayroll": 42750.00,
#   "payroll": [
#     {
#       "name": "Alice Johnson",
#       "monthlySalary": 5000,
#       "salaryPerDay": 192.3077,
#       "attendance": { "PRESENT": 22, "ABSENT": 2, "LEAVE": 2 },
#       "effectiveDays": 22,
#       "finalSalary": 4230.77
#     }
#   ]
# }

# Single employee salary
curl "http://localhost:5000/api/v1/salary/employee/EMPLOYEE_ID?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN"

# Export payroll as CSV
curl "http://localhost:5000/api/v1/salary/payroll/export/csv?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN" -o payroll.csv

# Export payroll as PDF
curl "http://localhost:5000/api/v1/salary/payroll/export/pdf?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN" -o payroll.pdf
```

---

## 🏖️ Leave Management API

```bash
# Submit leave request
curl -X POST http://localhost:5000/api/v1/leaves \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "startDate": "2024-06-20",
    "endDate": "2024-06-22",
    "type": "SICK",
    "reason": "Fever and rest"
  }'

# List leaves (filter by status)
curl "http://localhost:5000/api/v1/leaves?status=PENDING" \
  -H "Authorization: Bearer TOKEN"

# Approve / Reject leave
curl -X PATCH http://localhost:5000/api/v1/leaves/LEAVE_ID/review \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "APPROVED" }'
# → Auto-marks attendance as LEAVE for each day in the range
```

---

## 📊 Dashboard API

```bash
# Full dashboard overview
curl http://localhost:5000/api/v1/dashboard \
  -H "Authorization: Bearer TOKEN"

# Monthly attendance trend (for charts)
curl "http://localhost:5000/api/v1/dashboard/trend?month=6&year=2024" \
  -H "Authorization: Bearer TOKEN"
```

---

## ⚙️ Settings API

```bash
# Get org settings
curl http://localhost:5000/api/v1/settings \
  -H "Authorization: Bearer TOKEN"

# Update working days (used in salary calculation)
curl -X PUT http://localhost:5000/api/v1/settings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "workingDays": 26, "currency": "INR" }'
```

---

## 🗃️ Database Schema

```
users ──────────────────────────────────────────────────────────────
  id, name, email (unique), password (bcrypt), organization,
  role (ADMIN/MANAGER/SUPER_ADMIN), isActive, createdAt

org_settings ───────────────────────────────────────────────────────
  id, userId (1:1 → users), workingDays (default 26), 
  currency, timezone, weeklyOff

employees ──────────────────────────────────────────────────────────
  id, userId (FK → users), name, age, salary, role, department,
  joiningDate, email?, phone?, address?, isActive, createdAt
  INDEX: (userId, isActive), (userId, name)

attendance ─────────────────────────────────────────────────────────
  id, employeeId (FK), userId (denormalized), date (Date only),
  status (PRESENT/ABSENT/LEAVE/HALF_DAY/HOLIDAY),
  note?, checkIn?, checkOut?
  UNIQUE: (employeeId, date)         ← prevents duplicates
  INDEX: (userId, date), (employeeId, date)

leave_requests ─────────────────────────────────────────────────────
  id, employeeId (FK), userId, startDate, endDate,
  type (SICK/CASUAL/ANNUAL/UNPAID/OTHER),
  status (PENDING/APPROVED/REJECTED), reason, reviewedAt?

holidays ───────────────────────────────────────────────────────────
  id, userId, name, date (Date only), description?
  UNIQUE: (userId, date)
```

---

## 🛡️ Security Architecture

| Concern | Implementation |
|---|---|
| Password storage | bcrypt (12 rounds) |
| Authentication | JWT access token (7d) + refresh token (30d) |
| Tenant isolation | `userId` filter on every DB query |
| Route protection | `authenticate` middleware on all private routes |
| Role-based access | `authorize(...roles)` middleware |
| Input validation | express-validator on all write endpoints |
| Rate limiting | 100 req/15min general; 10 req/15min auth |
| Security headers | helmet.js |
| Error leakage | Generic messages for auth errors |
| SQL injection | Prisma ORM parameterized queries |

---

## 💰 Salary Calculation Formula

```
Working Days Config:  26 (default, configurable per org)

salary_per_day  = monthly_salary / working_days
effective_days  = present_days + (half_day_count × 0.5)
deduction_days  = absent_days
deduction_amt   = deduction_days × salary_per_day
final_salary    = effective_days × salary_per_day

Example:
  Monthly Salary: $5,000
  Working Days:   26
  Present:        20, Half Days: 2, Absent: 4

  salary_per_day  = 5000 / 26 = $192.31
  effective_days  = 20 + (2 × 0.5) = 21
  final_salary    = 21 × $192.31 = $4,038.46
```

---

## 🚀 Production Deployment

```bash
# Build step (generate Prisma client)
npm run db:generate

# Run migrations against production DB
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name "attendance-api" --instances max

# Or with Docker
docker build -t attendance-api .
docker run -p 5000:5000 --env-file .env attendance-api
```

### Production Checklist
- [ ] Strong `JWT_SECRET` (32+ random characters)
- [ ] PostgreSQL connection pooling (PgBouncer)
- [ ] HTTPS with reverse proxy (nginx/caddy)
- [ ] Replace `ALLOWED_ORIGINS=*` with actual domains
- [ ] Set up log rotation for Winston file transports
- [ ] Enable PostgreSQL connection SSL
- [ ] Set up database backups
