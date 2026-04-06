# Finance Backend API

A backend system for managing financial records with role-based access control. Built as part of an internship assignment - the goal was to design something that could actually work in a real dashboard, not just pass a checklist.

The API handles users, financial records, and a set of dashboard endpoints that aggregate data for reporting. Access is controlled at the route level based on three roles: viewer, analyst, and admin.
live at - https://zorvyn-finance-api-y298.onrender.com/api

---

## What's inside

```
src/
├── config/
│   ├── db.js               connects to MongoDB
│   └── seed.js             loads sample users and records
├── middleware/
│   ├── auth.js             JWT verification + role enforcement
│   └── validate.js         Zod request body validation
├── models/
│   ├── user.model.js
│   └── record.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── record.routes.js
│   └── dashboard.routes.js
├── services/
│   ├── auth.service.js
│   ├── user.service.js
│   ├── record.service.js
│   └── dashboard.service.js
├── validators/
│   ├── auth.validator.js
│   ├── record.validator.js
│   └── user.validator.js
└── app.js
```

---

## Getting started

You'll need Node.js 18+ and a running MongoDB instance (local or Atlas).

```bash
git clone <your-repo-url>
cd finance-backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_db
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
```

Start the server:

```bash
npm run dev     # with nodemon
npm start       # without
```

If you want some data to work with right away:

```bash
npm run seed
```

This creates three users and ten records spread across two months. Credentials are at the bottom of this file.

---

## Roles

There are three roles and they form a simple hierarchy - admin can do everything an analyst can, analyst can do everything a viewer can.

| Action | viewer | analyst | admin |
|---|:---:|:---:|:---:|
| View records and dashboard summary | ✓ | ✓ | ✓ |
| Create and update records | | ✓ | ✓ |
| View category breakdown and trends | | ✓ | ✓ |
| Delete records | | | ✓ |
| Manage users | | | ✓ |

Roles are enforced in middleware before the route handler ever runs, so there's no risk of forgetting a check inside a service.

---

## API

Base URL: `http://localhost:5000/api`

Every response uses the same shape:

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "message": "something went wrong" }
```

Protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth

#### `POST /auth/register`

```json
{
  "name": "Arjun Mehta",
  "email": "arjun@example.com",
  "password": "yourpassword",
  "role": "analyst"
}
```

`role` defaults to `viewer` if you leave it out. Returns a token on success.

#### `POST /auth/login`

```json
{
  "email": "arjun@example.com",
  "password": "yourpassword"
}
```

Returns the same token + user object as register.

---

### Users - admin only

#### `GET /users`

Returns all users. Passwords are never included.

#### `GET /users/:id`

#### `PATCH /users/:id/role`

```json
{ "role": "analyst" }
```

#### `PATCH /users/:id/status`

```json
{ "active": false }
```

Deactivated users can't log in.

---

### Records

#### `GET /records` - viewer+

Supports filtering and pagination via query params:

| Param | Example | What it does |
|---|---|---|
| `type` | `?type=expense` | filter by income or expense |
| `category` | `?category=rent` | partial match, case-insensitive |
| `from` | `?from=2024-05-01` | records on or after this date |
| `to` | `?to=2024-05-31` | records on or before this date |
| `page` | `?page=2` | default 1 |
| `limit` | `?limit=10` | default 20, max 100 |

Response includes `total`, `page`, and `pages` for the frontend to build pagination.

#### `GET /records/:id` - viewer+

#### `POST /records` - analyst+

```json
{
  "amount": 45000,
  "type": "income",
  "category": "Freelance",
  "date": "2024-06-15",
  "notes": "Project payment"
}
```

`amount` must be a positive number. `notes` is optional.

#### `PUT /records/:id` - analyst+

Same fields as create, all optional. Only send what you want to change.

#### `DELETE /records/:id` - admin only

Soft delete. Sets a `deletedAt` timestamp - the record stays in the database but disappears from all queries. This keeps the history intact for auditing.

---

### Dashboard

#### `GET /dashboard/summary` - viewer+

```json
{
  "totalIncome": 197000,
  "totalExpenses": 36500,
  "netBalance": 160500,
  "totalRecords": 9
}
```

#### `GET /dashboard/recent` - viewer+

Returns the most recently created records. Add `?limit=5` to control how many (max 50).

#### `GET /dashboard/categories` - analyst+

Totals grouped by category and type, sorted by total descending. Useful for a breakdown chart.

```json
[
  { "category": "Salary", "type": "income",  "total": 145000, "count": 2 },
  { "category": "Rent",   "type": "expense", "total": 14000,  "count": 1 }
]
```

#### `GET /dashboard/trends` - analyst+

Monthly totals split by type, sorted by year and month. Feed this directly into a line chart.

```json
[
  { "year": 2024, "month": 5, "type": "income",  "total": 107000, "count": 2 },
  { "year": 2024, "month": 5, "type": "expense", "total": 19500,  "count": 3 }
]
```

---

## Running the test suite

Make sure the server is running first, then:

```bash
chmod +x test-api.sh && ./test-api.sh
```

Covers 53 cases across all endpoints - auth, role enforcement, validation, soft delete, pagination, and edge cases like double-deleting a record or hitting a route with an invalid token.

---

## A few decisions worth explaining

**Why soft delete instead of hard delete**

Financial records shouldn't disappear. If someone deletes a record by mistake, or if you need to reconcile numbers from a past period, a hard delete makes that impossible. Setting `deletedAt` keeps the data around while keeping it out of normal queries. It also makes the dashboard totals trustworthy - they only count active records.

**Why the dashboard runs in MongoDB**

The summary, trend, and category endpoints all use MongoDB aggregation pipelines rather than fetching records into Node and summing them in JavaScript. This is the right call - the database is built for this kind of grouped computation and it stays fast regardless of how many records accumulate.

**Why Zod for validation**

Zod schemas are defined once and shared between create and update routes (the update schema is just `.partial()` of the create schema). Validation runs in middleware before the handler, so the handler always receives clean typed data. Error messages come back as field-level objects, which is easier for a frontend to use than a single generic message.

**Why roles use a numeric hierarchy**

Instead of checking role names with a list like `["admin", "analyst"]`, each role maps to a number (`viewer=1, analyst=2, admin=3`). The middleware checks if the user's weight meets the minimum required for that route. Adding a new role later means changing one object, and the behavior cascades naturally - an admin always passes a check that requires analyst because 3 ≥ 2.

---

## Seed credentials

After running `npm run seed`:

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| admin   | admin@finance.dev      | password123 |
| analyst | analyst@finance.dev    | password123 |
| viewer  | viewer@finance.dev     | password123 |
