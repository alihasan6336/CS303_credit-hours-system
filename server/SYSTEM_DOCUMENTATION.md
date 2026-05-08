# CS303 Credit Hours System - Backend Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [User Flows](#user-flows)
7. [Validation](#validation)
8. [Database Models](#database-models)
9. [Middleware](#middleware)
10. [Security](#security)
11. [Workflows](#workflows)

---

## System Overview

The Credit Hours System is a comprehensive academic management platform built with:
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Frontend**: React + TypeScript + TailwindCSS
- **External Services**: Cloudinary (photo storage), MongoDB Atlas (database)

### Core Modules
1. **Authentication** - JWT-based auth for students and admins
2. **Course Management** - CRUD operations for courses
3. **Enrollment System** - Student enrollment with prerequisite validation
4. **GPA Calculation** - Real-time GPA tracking
5. **Admin Dashboard** - User management and analytics
6. **Photo Upload** - Cloudinary integration for profile photos
7. **AI Schedule** - Smart course scheduling algorithm

---

## Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        React Frontend                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │  │
│  │  │   Student    │  │    Admin     │  │   Photo Upload             │  │  │
│  │  │   Portal     │  │   Dashboard  │  │   SweetAlert2              │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                            BUSINESS LOGIC LAYER                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Express.js Server                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │  │
│  │  │ Controllers  │  │  Middleware  │  │  Utilities                │  │  │
│  │  │ - Auth       │  │ - Protect    │  │  - JWT                   │  │  │
│  │  │ - Courses    │  │ - Validation │  │  - GPA Calc              │  │  │
│  │  │ - Admin      │  │ - Rate Limit │  │  - Email                 │  │  │
│  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                            DATA ACCESS LAYER                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       MongoDB + Cloudinary                           │  │
│  │  ┌──────────────────────┐        ┌────────────────────────────┐     │  │
│  │  │   MongoDB Atlas    │        │   Cloudinary CDN           │     │  │
│  │  │   - Students       │        │   - Profile Photos         │     │  │
│  │  │   - Courses        │        │   - Image Transform        │     │  │
│  │  │   - Enrollments    │        │                            │     │  │
│  │  └──────────────────────┘        └────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
server/
├── src/
│   ├── controllers/          # Business logic handlers
│   │   ├── authController.ts
│   │   ├── adminController.ts
│   │   ├── courseController.ts
│   │   ├── enrollmentController.ts
│   │   ├── gpaController.ts
│   │   ├── photoController.ts
│   │   └── scheduleController.ts
│   ├── routes/             # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── adminRoutes.ts
│   │   ├── courseRoutes.ts
│   │   ├── enrollmentRoutes.ts
│   │   ├── photoRoutes.ts
│   │   └── scheduleRoutes.ts
│   ├── models/             # Mongoose schemas
│   │   ├── Student.ts
│   │   ├── AdminUser.ts
│   │   ├── Course.ts
│   │   ├── Enrollment.ts
│   │   └── AuditLog.ts
│   ├── middleware/         # Express middleware
│   │   ├── protect.ts      # JWT authentication
│   │   ├── adminProtect.ts # Admin role verification
│   │   ├── validateRequest.ts # Input validation
│   │   ├── rateLimiter.ts # Rate limiting
│   │   └── errorHandler.ts # Global error handling
│   ├── utils/              # Helper utilities
│   │   ├── jwt.ts          # Token generation/verification
│   │   ├── gpaCalculator.ts # GPA calculation logic
│   │   ├── studentProgress.ts # Semester completion
│   │   └── mailer.ts       # Email sending
│   └── config/             # Configuration files
│       └── cloudinary.ts   # Cloudinary setup
└── scripts/                # Database seeding scripts
```

---

## User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                            │
│                    (Highest Authority)                        │
│  - Manage all users (students + admins)                       │
│  - Create/delete admin accounts                             │
│  - System configuration                                     │
│  - Full access to all endpoints                             │
└────────────────────────────┬────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   IT ADMIN      │ │ ENROLLMENT ADMIN│ │ SPECIALIZED     │
│                 │ │                 │ │ ADMINS          │
│ - User CRUD     │ │ - Manage        │ │ - courses_admin │
│ - Reset passwords│ │   enrollments   │ │ - table_admin   │
│ - Credit limits │ │ - View schedules  │ │ - Various       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    STUDENT      │
│                   │  (Self-service) │
│                   │                 │
│                   │ - Enroll/drop   │
│                   │ - View GPA      │
│                   │ - Upload photo  │
│                   └─────────────────┘
```

### Permission System

| Permission | Description | Roles |
|------------|-------------|-------|
| `users:stats` | View dashboard statistics | All admins |
| `users:list` | View user list | All admins |
| `users:view` | View user details | All admins |
| `users:create` | Create new users | All admins (superadmin for admin accounts) |
| `users:update` | Edit user profiles | superadmin, it_admin |
| `users:delete` | Delete accounts | superadmin, it_admin |
| `users:toggle` | Activate/deactivate accounts | superadmin, it_admin |
| `users:password_reset` | Reset passwords | superadmin, it_admin |
| `enrollments:list` | View all enrollments | All admins |
| `enrollments:create` | Enroll students | All admins |
| `enrollments:delete` | Remove enrollments | All admins |
| `enrollments:update` | Update grades, complete semester | All admins |

### Admin Role Types

| Role | Description | Permissions |
|------|-------------|-------------|
| `superadmin` | System owner | All permissions |
| `admin` | General admin | Standard admin permissions |
| `it_admin` | IT support | User management, password resets |
| `enrollment_admin` | Enrollment manager | Enrollment operations, semester completion |
| `courses_admin` | Course coordinator | Course management |
| `table_admin` | Schedule manager | Enrollment table visibility |

---

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access | Validation |
|--------|----------|-------------|--------|------------|
| POST | `/register` | Student registration | Public | Full name, email, password, university ID, major |
| POST | `/login` | Student/Admin login | Public | Email, password |
| POST | `/forgot-password` | Request password reset | Public | Email |
| POST | `/reset-password/:token` | Reset password with token | Public | New password (min 6 chars) |
| GET | `/me` | Get current user | Protected | JWT token |
| POST | `/refresh` | Refresh access token | Public | Valid refresh token |
| PATCH | `/change-password` | Change password | Protected | Current + new password |
| PUT | `/profile` | Update profile | Protected | Valid fields |

### Admin Routes (`/api/admin`)

#### Statistics & Dashboard
| Method | Endpoint | Description | Required Role | Middleware |
|--------|----------|-------------|---------------|------------|
| GET | `/stats` | Dashboard statistics | Any admin | adminProtect, requirePermission('users:stats') |

#### User Management
| Method | Endpoint | Description | Required Role | Rate Limited |
|--------|----------|-------------|---------------|----------------|
| GET | `/users` | List users with pagination | Any admin | No |
| GET | `/users/:id` | Get single user details | Any admin | No |
| POST | `/accounts` | Create any account type | Any admin | Yes |
| POST | `/users/students` | Create student account | Any admin | Yes |
| POST | `/users/admins` | Create admin account | superadmin only | Yes |
| PUT | `/users/:id` | Update user account | superadmin, it_admin | Yes |
| DELETE | `/users/:id` | Delete user account | superadmin, it_admin | Yes |
| PATCH | `/users/:id/toggle` | Toggle account status | superadmin, it_admin | Yes |
| POST | `/users/:id/reset-password` | Reset user password | superadmin, it_admin | Yes |
| GET | `/users/:id/record` | Get academic record | superadmin, it_admin | No |
| PATCH | `/users/:id/credit-override` | Set credit limits | admin, superadmin | Yes |
| GET | `/users/:id/credit-limit` | Get effective credit limit | Any admin | No |

#### Enrollment Management
| Method | Endpoint | Description | Required Role | Rate Limited |
|--------|----------|-------------|---------------|----------------|
| GET | `/enrollments` | List all enrollments | Any admin | No |
| POST | `/enrollments` | Admin enroll student | Any admin | Yes |
| DELETE | `/enrollments/:id` | Remove enrollment | Any admin | Yes |
| PATCH | `/enrollments/:id/grade` | Update grade | Any admin | Yes |

#### Student Progress
| Method | Endpoint | Description | Required Role | Middleware |
|--------|----------|-------------|---------------|------------|
| POST | `/students/:id/complete-semester` | Mark semester complete | superadmin, enrollment_admin | adminActionLimiter |
| POST | `/students/:id/check-promotion` | Check level promotion | superadmin, enrollment_admin | - |
| GET | `/students/:id/academic-summary` | Get academic summary | Any admin | requirePermission('users:view') |

### Course Routes (`/api/courses`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all courses | Public |
| GET | `/:id` | Get course details | Public |
| POST | `/` | Create course | Admin |
| PUT | `/:id` | Update course | Admin |
| DELETE | `/:id` | Delete course | Admin |
| PATCH | `/bulk-update` | Bulk update courses | Admin |
| GET | `/available/:studentId` | Get courses for student | Student |

### Enrollment Routes (`/api/enrollments`)

| Method | Endpoint | Description | Access | Validation |
|--------|----------|-------------|--------|------------|
| POST | `/` | Enroll in course | Student | Prerequisites, credit limits, enrollment open |
| GET | `/my` | Get my enrollments | Student | - |
| DELETE | `/:id` | Drop course | Student | Enrollment period open |
| POST | `/bulk` | Bulk enroll | Student | Multiple courses |
| POST | `/replace` | Replace enrollments | Student | For AI schedule |

### GPA Routes (`/api/gpa`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/me` | Get my GPA breakdown | Student |
| GET | `/summary` | GPA summary | Student |

### Photo Routes (`/api/photos`)

| Method | Endpoint | Description | Access | File Limit |
|--------|----------|-------------|--------|------------|
| POST | `/upload` | Upload profile photo | Student/Admin | 5MB, image only |
| GET | `/me` | Get my photo URL | Student/Admin | - |
| DELETE | `/me` | Delete profile photo | Student/Admin | - |

### Schedule Routes (`/api/schedule`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/recommend` | Get AI-optimized schedule | Student |
| POST | `/bulk-enroll` | Bulk enroll recommended | Student |

### Settings Routes (`/api/settings`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get system settings | Public |
| POST | `/open-registration` | Open enrollment | Admin |
| POST | `/close-registration` | Close enrollment | Admin |
| POST | `/show-table` | Show enrollment table | Admin |
| POST | `/hide-table` | Hide enrollment table | Admin |

---

## Authentication & Authorization

### JWT Authentication Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│    Client   │                    │   Server    │                    │   MongoDB   │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │  POST /api/auth/login            │                                  │
       │  {email, password}               │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │  Find user by email              │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │                                  │  Compare password with bcrypt    │
       │                                  │                                  │
       │                                  │  Generate JWT + Refresh tokens │
       │                                  │                                  │
       │  {accessToken, refreshToken}     │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
       │  Store tokens (localStorage)   │                                  │
       │                                  │                                  │
       ├───────────────────────────────────────────────────────────────────────┐
       │                           SUBSEQUENT REQUESTS                        │
       ├───────────────────────────────────────────────────────────────────────┤
       │                                  │                                  │
       │  GET /api/protected              │                                  │
       │  Authorization: Bearer {token}   │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │  Verify JWT signature            │
       │                                  │  Check expiration                │
       │                                  │  Find user by decoded.id         │
       │                                  │                                  │
       │  {data}                          │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
```

### Middleware Pipeline

```
Request ──> [Route Handler] ──> [Middleware 1] ──> [Middleware 2] ──> [Controller]
                │                  │                  │
                │                  │                  └─► Controller execution
                │                  │
                │                  └─► validateRequest (input validation)
                │                      OR protect (JWT verification)
                │                      OR adminProtect (role check)
                │                      OR rateLimiter (throttling)
                │
                └─► Async error handling via asyncWrap
```

---

## User Flows

### 1. Student Registration Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Visit      │───>│   Fill Form  │───>│   Validate   │───>│   Create     │
│   Site       │    │   (Name, ID,  │    │   - Email    │    │   Account    │
│              │    │   Major, etc)│    │   - ID unique│    │              │
└──────────────┘    └──────────────┘    │   - Password │    └──────────────┘
                                        │   strength   │           │
                                        └──────────────┘           │
                                                                   ▼
                                                          ┌──────────────┐
                                                          │   Redirect   │
                                                          │   to Login   │
                                                          └──────────────┘
```

### 2. Course Enrollment Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Login      │───>│   View       │───>│   Click      │───>│   Validate   │
│              │    │   Available  │    │   Enroll     │    │   Enrollment │
│              │    │   Courses    │    │              │    │   - Open?    │
└──────────────┘    └──────────────┘    └──────────────┘    │   - Credits  │
                                                            │   - Prereqs  │
                                                            └──────────────┘
                                                                     │
                        ┌────────────────────────────────────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │   SUCCESS            │
            │   - Create Enrollment│
            │   - Update Course    │
            │     enrolledCount    │
            └──────────────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │   Show Success Alert │
            └──────────────────────┘
```

### 3. Admin User Management Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Admin      │───>│   Search/    │───>│   Select     │───>│   Choose     │
│   Login      │    │   Browse     │    │   User       │    │   Action     │
│              │    │   Users      │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                   │
            ┌──────────────────────┬──────────────────────┬─────────┴──────────┐
            │                      │                      │                    │
            ▼                      ▼                      ▼                    ▼
   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐   ┌───────────────┐
   │   Edit User    │   │   Toggle       │   │   Reset        │   │   Delete      │
   │   - Update     │   │   Status       │   │   Password     │   │   - Confirm   │
   │     details    │   │   - Active/    │   │   - Generate   │   │   - Remove    │
   │   - Change     │   │     Inactive   │   │     token      │   │               │
   │     role       │   │                │   │   - Email link │   │               │
   └────────────────┘   └────────────────┘   └────────────────┘   └───────────────┘
```

### 4. GPA Calculation Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Student    │───>│   Grades     │───>│   Calculate  │───>│   Update     │
│   Receives   │    │   Entered    │    │   GPA        │    │   Student    │
│   Grades     │    │   by Admin   │    │   - Grade    │    │   Record     │
│              │    │              │    │     points   │    │              │
└──────────────┘    └──────────────┘    │   - Credits  │    └──────────────┘
                                        │   - Formula  │
                                        └──────────────┘
```

### 5. Photo Upload Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Select     │───>│   Validate   │───>│   Upload to  │───>│   Save URL   │
│   Photo      │    │   - Size <5MB│    │   Cloudinary │    │   to MongoDB │
│   (File)     │    │   - Image    │    │   - Transform│    │              │
└──────────────┘    │     type     │    │   - 500x500  │    └──────────────┘
                    └──────────────┘    └──────────────┘
```

### 6. AI Schedule Generation Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Click      │───>│   Fetch      │───>│   Algorithm  │───>│   Display    │
│   "Generate  │    │   Available  │    │   Optimize:  │    │   Schedule   │
│   Schedule"  │    │   Courses    │    │   - No       │    │   - Credits  │
│              │    │   By Major   │    │     conflicts│    │   - Days     │
└──────────────┘    └──────────────┘    │   - Min days │    │   - Courses  │
                                        │   - 14+ cr   │    │              │
                                        └──────────────┘    └──────────────┘
                                                                     │
                                                                     ▼
                                                          ┌──────────────┐
                                                          │   Bulk       │
                                                          │   Enroll     │
                                                          └──────────────┘
```

---

## Validation

### Request Validation Schema

| Endpoint | Validation Rules |
|----------|-----------------|
| POST /auth/register | Full name: required, trim<br>Email: required, valid format, unique<br>Password: min 6 chars<br>University ID: required, unique<br>Major: required, enum value |
| POST /auth/login | Email: required, valid format<br>Password: required |
| POST /auth/forgot-password | Email: required, valid format |
| POST /courses | Name: required<br>Code: required, unique<br>Credits: required, 1-6<br>Level: 1-4<br>Day: enum (Sunday-Thursday)<br>Time: valid time format |
| POST /enrollments | Course ID: valid MongoDB ID<br>Student ID: valid MongoDB ID<br>Prerequisites: all completed |
| POST /admin/users | Full name: required<br>Email: valid, unique<br>Role: enum value<br>Major: required for students |

### Validation Middleware

```typescript
// validateRequest.ts
export const validateRegister = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('universityId').trim().notEmpty().withMessage('University ID is required'),
  body('major').isIn(MAJORS).withMessage('Valid major required'),
  validateResult  // Check for errors
];
```

---

## Database Models

### Student Model

```typescript
interface IStudent {
  fullName: string;           // Required, trimmed
  universityId: string;       // Required, unique
  email: string;              // Required, unique, lowercase
  password: string;           // Required, min 6 chars, hashed
  major: string;              // Required, enum
  currentSemester: 'Fall' | 'Spring' | 'Summer';
  completedCreditHours: number;  // Default 0
  gpa: number;                // Default 0
  level: number;               // 1-4
  isActive: boolean;           // Default true
  role: 'student' | 'admin' | 'superadmin';  // Default 'student'
  creditLimitOverride: {
    min: number;      // Default 14
    max: number;      // Default 19
    isActive: boolean;
    reason: string;
  };
  photoUrl?: string;           // Cloudinary URL
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### AdminUser Model

```typescript
interface IAdminUser {
  fullName: string;           // Required
  universityId?: string;     // Optional
  email: string;              // Required, unique
  password: string;           // Required, hashed
  major?: string;              // Optional
  phoneNumber?: string;
  role: 'admin' | 'superadmin' | 'it_admin' | 'table_admin' | 'courses_admin' | 'enrollment_admin';
  isActive: boolean;           // Default true
  permissions?: string[];      // Array of permission strings
  createdBy?: ObjectId;        // Reference to AdminUser
  lastLogin?: Date;
  photoUrl?: string;           // Cloudinary URL
  createdAt: Date;
  updatedAt: Date;
}
```

### Course Model

```typescript
interface ICourse {
  code: string;               // Unique (e.g., "CS101")
  name: string;               // Required
  major: string;              // Enum
  level: number;              // 1-4
  day: string;                // Sunday-Thursday
  time: string;               // "09:00 - 10:30"
  room?: string;
  credits: number;            // 1-6
  instructor: string;
  group: string;              // A, B, C
  type: 'Lecture' | 'Lab' | 'Tutorial';
  capacity: number;           // Default 30
  enrolledCount: number;      // Default 0
  prerequisites: string[];    // Array of course codes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Enrollment Model

```typescript
interface IEnrollment {
  student: ObjectId;          // Reference to Student
  course: ObjectId;           // Reference to Course
  semester: string;           // Fall, Spring, Summer
  academicYear: string;       // "2025-2026"
  status: 'active' | 'completed' | 'dropped';
  grade?: number;             // 0-100
  gradeLetter?: string;       // A, B, C, etc.
  enrolledAt: Date;
  completedAt?: Date;
}
```

---

## Middleware

### Authentication Middleware (`protect.ts`)

```typescript
// Verifies JWT token and attaches user to request
// Flow:
1. Extract Bearer token from Authorization header
2. Verify JWT signature
3. Find user by decoded.id in Student or AdminUser collection
4. Check if account is active
5. Attach user to req.student or req.adminUser
6. Call next() or return 401/403 error
```

### Admin Protection Middleware (`adminProtect.ts`)

```typescript
// Role-based access control
// Functions:
- adminProtect: Ensure user is an admin (not student)
- requireRole(...roles): Check if admin has one of the required roles
- requirePermission(permission): Check if admin has specific permission
```

### Rate Limiting (`rateLimiter.ts`)

```typescript
// Admin action rate limiter
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 100,                   // 100 requests per window
// Purpose: Prevent brute force attacks on admin endpoints
```

### Error Handler (`errorHandler.ts`)

```typescript
// Global error handling
// Features:
- Catches all unhandled errors
- Returns standardized error response
- Logs errors in development
- Hides stack traces in production
```

---

## Security

### Security Measures

| Measure | Implementation | Purpose |
|---------|---------------|---------|
| JWT Tokens | jsonwebtoken library | Stateless authentication |
| Password Hashing | bcryptjs (salt rounds: 10) | Secure password storage |
| Rate Limiting | express-rate-limit | Prevent brute force |
| Input Validation | express-validator | Prevent injection attacks |
| CORS | cors middleware | Cross-origin policy control |
| Helmet | helmet middleware | Security headers |
| File Upload | multer + file filter | Limit file types and size |
| Cloudinary | Signed URLs | Secure image storage |

### Password Security Flow

```
Registration:                    Login:
┌─────────────┐                 ┌─────────────┐
│   Raw       │                 │   Raw       │
│   Password  │                 │   Password  │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       ▼                               ▼
┌─────────────┐                 ┌─────────────┐
│   bcrypt    │                 │   bcrypt    │
│   .hash()   │                 │   .compare()│
│   (10 salt) │                 │             │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       ▼                               ▼
┌─────────────┐                 ┌─────────────┐
│   Store     │                 │   Match?    │
│   in DB     │                 │   Yes/No    │
└─────────────┘                 └─────────────┘
```

---

## Workflows

### Semester Completion Workflow

```
Trigger: Admin clicks "Complete Semester" for student

┌─────────────────────────────────────────────────────────────────────────┐
│  1. VALIDATE                                                            │
│     - Check student exists                                                │
│     - Verify admin has permission                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. COMPLETE ACTIVE ENROLLMENTS                                         │
│     - Find all 'active' enrollments for current semester                  │
│     - Update status to 'completed'                                        │
│     - Set completion date                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. RECALCULATE GPA                                                     │
│     - Aggregate all completed enrollments                                 │
│     - Calculate weighted GPA                                            │
│     - Update student.gpa                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. UPDATE CREDITS                                                      │
│     - Sum credits from completed courses                                  │
│     - Update student.completedCreditHours                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. ADVANCE SEMESTER                                                      │
│     - Determine next semester (Fall→Spring→Summer→Fall)                   │
│     - Update student.currentSemester                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. CHECK LEVEL PROMOTION                                               │
│     - If credits >= level * 33, increment student.level                   │
│     - Level 1: 0-33 credits, Level 2: 34-66, etc.                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  7. AUDIT LOG                                                           │
│     - Record action in AuditLog collection                                │
│     - Store: admin ID, student ID, old/new semester, old/new level        │
└─────────────────────────────────────────────────────────────────────────┘
```

### GPA Calculation Formula

```
Grade Points:
A  = 4.0
A- = 3.7
B+ = 3.3
B  = 3.0
B- = 2.7
C+ = 2.3
C  = 2.0
C- = 1.7
D+ = 1.3
D  = 1.0
F  = 0.0

Formula:
GPA = Σ(Grade Points × Credits) / Σ(Credits)

Example:
Course 1: A (4.0) × 3 credits = 12.0
Course 2: B (3.0) × 3 credits = 9.0
Course 3: A- (3.7) × 4 credits = 14.8

Total Points = 35.8
Total Credits = 10
GPA = 35.8 / 10 = 3.58
```

### Credit Limit System

```
Default Limits:
- Minimum: 14 credits
- Maximum: 19 credits

Override System:
┌─────────────────────────────────────────────────────────────────────────┐
│   Student has override?                                                 │
│        │                                                                │
│   YES ─┼─► Use override.min and override.max                            │
│        │                                                                │
│   NO  ─┼─► Use default limits (14-19)                                   │
│        │                                                                │
│        ▼                                                                │
│   Check enrollment request against limits                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Prerequisite Validation

```
Enrollment Request:
┌─────────────────────────────────────────────────────────────────────────┐
│   Course: CS303 (Advanced Programming)                                  │
│   Prerequisites: ["CS101", "CS201"]                                     │
│        │                                                                │
│        ▼                                                                │
│   Check Student's Completed Courses                                     │
│        │                                                                │
│   CS101 completed? ──► YES                                              │
│   CS201 completed? ──► YES                                              │
│        │                                                                │
│        ▼                                                                │
│   ALL PREREQUISITES MET ──► ALLOW ENROLLMENT                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (dev only)"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, PUT |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |

---

*Document Version: 1.0*
*Last Updated: May 2026*
