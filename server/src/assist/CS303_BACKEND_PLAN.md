# CS303 Credit Hours System — Backend Implementation Plan
> **For the IDE / developer:** Read this file top to bottom before touching any code.
> Every section tells you exactly what file to open, what already exists in it, and what to add or change.
> Do **not** create a new file if the section says EDIT. Do **not** edit a file if the section says CREATE NEW.

---

## Table of Contents

1. [Project Structure — Final State](#1-project-structure--final-state)
2. [npm Packages to Install](#2-npm-packages-to-install)
3. [Environment Variables](#3-environment-variables)
4. [Step 1 — CREATE: `models/AdminPermission.ts`](#step-1--create-modelsadminpermissionts)
5. [Step 2 — CREATE: `models/AuditLog.ts`](#step-2--create-modelsauditlogts)
6. [Step 3 — EDIT: `models/AdminUser.ts`](#step-3--edit-modelsadminuserts)
7. [Step 4 — CREATE: `middleware/rateLimiter.ts`](#step-4--create-middlewareratelimiterts)
8. [Step 5 — CREATE: `middleware/errorHandler.ts`](#step-5--create-middlewareerrorhandlerts)
9. [Step 6 — EDIT: `middleware/adminProtect.ts`](#step-6--edit-middlewareadminprotectts)
10. [Step 7 — EDIT: `controllers/adminUsersController.ts`](#step-7--edit-controllersadminuserscontrollerts)
11. [Step 8 — EDIT: `controllers/courseController.ts`](#step-8--edit-controllerscourseccontrollerts)
12. [Step 9 — CREATE: `controllers/permissionController.ts`](#step-9--create-controllerspermissioncontrollerts)
13. [Step 10 — CREATE: `controllers/auditController.ts`](#step-10--create-controllersauditcontrollerts)
14. [Step 11 — EDIT: `routes/adminUsersRoutes.ts`](#step-11--edit-routesadminusersroutests)
15. [Step 12 — EDIT: `routes/courseRoutes.ts`](#step-12--edit-routescourseroutests)
16. [Step 13 — CREATE: `routes/permissionRoutes.ts`](#step-13--create-routespermissionroutests)
17. [Step 14 — CREATE: `routes/auditRoutes.ts`](#step-14--create-routesauditroutests)
18. [Step 15 — EDIT: `server.ts`](#step-15--edit-serverts)
19. [All Endpoints — Final Reference Table](#all-endpoints--final-reference-table)
20. [Error Response Convention](#error-response-convention)
21. [Concurrency — How Requests Are Handled](#concurrency--how-requests-are-handled)
22. [Permission Key Reference](#permission-key-reference)
23. [Checklist](#checklist)

---

## 1. Project Structure — Final State

```
server/src/
│
├── config/
│   └── db.ts                          ← EXISTS, no changes needed
│
├── types/
│   └── express.d.ts                   ← EXISTS, no changes needed
│
├── utils/
│   └── jwt.ts                         ← EXISTS, no changes needed
│
├── models/
│   ├── Student.ts                     ← EXISTS, no changes needed
│   ├── Course.ts                      ← EXISTS, no changes needed
│   ├── Enrollment.ts                  ← EXISTS, no changes needed
│   ├── AdminUser.ts                   ← EXISTS → EDIT (Step 3)
│   ├── AdminPermission.ts             ← CREATE NEW (Step 1)
│   └── AuditLog.ts                    ← CREATE NEW (Step 2)
│
├── middleware/
│   ├── protect.ts                     ← EXISTS, no changes needed
│   ├── validateRequest.ts             ← EXISTS, no changes needed
│   ├── adminProtect.ts                ← EXISTS → EDIT (Step 6)
│   ├── rateLimiter.ts                 ← CREATE NEW (Step 4)
│   └── errorHandler.ts                ← CREATE NEW (Step 5)
│
├── controllers/
│   ├── authController.ts              ← EXISTS, no changes needed
│   ├── homeController.ts              ← EXISTS, no changes needed
│   ├── courseController.ts            ← EXISTS → EDIT (Step 8)
│   ├── adminAuthController.ts         ← EXISTS, no changes needed
│   ├── adminUsersController.ts        ← EXISTS → EDIT (Step 7)
│   ├── permissionController.ts        ← CREATE NEW (Step 9)
│   └── auditController.ts             ← CREATE NEW (Step 10)
│
├── routes/
│   ├── authRoutes.ts                  ← EXISTS, no changes needed
│   ├── homeRoutes.ts                  ← EXISTS, no changes needed
│   ├── courseRoutes.ts                ← EXISTS → EDIT (Step 12)
│   ├── adminAuthRoutes.ts             ← EXISTS, no changes needed
│   ├── adminUsersRoutes.ts            ← EXISTS → EDIT (Step 11)
│   ├── permissionRoutes.ts            ← CREATE NEW (Step 13)
│   └── auditRoutes.ts                 ← CREATE NEW (Step 14)
│
├── scripts/
│   └── seedSuperAdmin.ts              ← EXISTS, no changes needed
│
└── server.ts                          ← EXISTS → EDIT (Step 15)
```

---

## 2. npm Packages to Install

Open a terminal inside the `server/` directory and run:

```bash
npm install helmet express-mongo-sanitize express-rate-limit
npm install -D @types/express-rate-limit
```

**Verify** these appear in `server/package.json` dependencies before continuing.

---

## 3. Environment Variables

Add these to `server/.env` if they are not already there:

```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/cs303db
JWT_SECRET=your_very_long_random_secret_here
JWT_ADMIN_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SUPER_ADMIN_EMAIL=superadmin@cs303.edu
SUPER_ADMIN_PASSWORD=YourSecurePassword123
TRUSTED_IPS=                        # optional: comma-separated IPs to skip rate limiting
```

---

## Step 1 — CREATE: `models/AdminPermission.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/models/AdminPermission.ts`

### What this file does
Stores one document per admin user containing the exact set of actions that admin is allowed to perform. `super_admin` writes these documents using the permission controller. `adminProtect` middleware reads them on every request.

### Fields to implement

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `admin` | `ObjectId → AdminUser` | Yes | `unique: true` — one doc per admin |
| `permissions` | `String[]` | No | Must be enum of `ALL_PERMISSIONS`. Auto-dedup + sort via `set()` |
| `grantedBy` | `ObjectId → AdminUser` | Yes | Always the super_admin who made the change |
| `note` | `String` | No | Optional memo. Default `''` |
| `createdAt` | `Date` | Auto | Via `timestamps: true` |
| `updatedAt` | `Date` | Auto | Via `timestamps: true` — updates on every permission change |

### Constants to export

```typescript
export const ALL_PERMISSIONS = [
  'users:list', 'users:view', 'users:create', 'users:update',
  'users:delete', 'users:toggle', 'users:stats',
  'courses:list', 'courses:view', 'courses:create',
  'courses:update', 'courses:delete', 'courses:enrollments',
  'enrollments:list',
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number];
```

### Index to add
```typescript
AdminPermissionSchema.index({ admin: 1 });
// This index is read on EVERY admin request — must be fast
```

### Edge cases to handle
- `set()` function on the `permissions` field: `(arr) => [...new Set(arr)].sort()` — prevents duplicates stored in DB
- `enum: ALL_PERMISSIONS` on the permissions field — Mongoose rejects unknown keys at DB level

### Source file
Copy the complete implementation from: `outputs/new_backend/models/AdminPermission.ts`

---

## Step 2 — CREATE: `models/AuditLog.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/models/AuditLog.ts`

### What this file does
Append-only log of every significant action in the system. Never updated after creation. super_admin reads it from the admin panel audit view.

### Fields to implement

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `actor` | `ObjectId → AdminUser` | Yes | Who performed the action |
| `action` | `String` | Yes | Key string, e.g. `"user:create"`, `"enroll"` |
| `targetUser` | `ObjectId → AdminUser` | No | User affected (create/update/delete/toggle) |
| `targetCourse` | `ObjectId → Course` | No | Course affected (create/update/enroll/drop) |
| `details` | `Mixed` | No | Free-form object: `{ role, email, permissions }` etc. |
| `ipAddress` | `String` | No | Request IP for security auditing |
| `createdAt` | `Date` | Auto | Indexed for fast date-range queries |

### Timestamps config — important
```typescript
// updatedAt must be DISABLED — logs are never modified
timestamps: { createdAt: true, updatedAt: false }
versionKey: false   // removes __v field from documents
```

### Indexes to add
```typescript
AuditLogSchema.index({ actor:      1, createdAt: -1 });
AuditLogSchema.index({ targetUser: 1, createdAt: -1 });
AuditLogSchema.index({ action:     1, createdAt: -1 });
AuditLogSchema.index({ createdAt:  -1 });                  // most recent first
// TTL index — auto-deletes logs older than 1 year:
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
```

### Action keys that must be logged (reference)
```
permissions:set       permissions:grant     permissions:revoke    permissions:clear
user:create           user:update           user:delete           user:toggle
course:create         course:update         course:delete
enroll                drop
```

### Source file
Copy the complete implementation from: `outputs/new_backend/models/AuditLog.ts`

---

## Step 3 — EDIT: `models/AdminUser.ts`

**Action:** Open the existing file and add the items below. Do not remove anything.
**Path:** `server/src/models/AdminUser.ts`

### What already exists (do not touch)
- All 7 schema fields: `fullName`, `email`, `password`, `role`, `isActive`, `createdBy`, `lastLogin`
- `email` unique index
- `role` enum
- Pre-save bcrypt hook
- `comparePassword()` instance method

### Changes to make

**Change 1 — Increase bcrypt rounds from 10 to 12**

Find this line in the pre-save hook:
```typescript
const salt = await bcrypt.genSalt(10);
```
Change it to:
```typescript
const salt = await bcrypt.genSalt(12);   // stronger for admin accounts
```

**Change 2 — Add `toJSON` and `toObject` options to Schema**

Find the Schema constructor call. The options object currently only has `{ timestamps: true }`.
Add `toJSON` and `toObject`:
```typescript
{
  timestamps: true,
  toJSON:   { virtuals: true },   // ADD THIS
  toObject: { virtuals: true },   // ADD THIS
}
```

**Change 3 — Add the `permissionsDoc` virtual (insert after schema definition)**

Add this block after `AdminUserSchema` is defined and before the indexes:
```typescript
// Virtual: populate the AdminPermission document for this user
// Usage: AdminUser.findById(id).populate('permissionsDoc')
AdminUserSchema.virtual('permissionsDoc', {
  ref:          'AdminPermission',
  localField:   '_id',
  foreignField: 'admin',
  justOne:      true,
});
```

**Change 4 — Add two more indexes (in addition to the email index already there)**

```typescript
AdminUserSchema.index({ role: 1, isActive: 1 });   // used by listUsers filter
AdminUserSchema.index({ createdBy: 1 });             // used by audit chain queries
```

### What NOT to change
- The `IAdminUser` interface — leave it exactly as is
- The `AdminRole` type — leave it as is
- All schema field definitions — leave them as is
- The export line — leave it as is

---

## Step 4 — CREATE: `middleware/rateLimiter.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/middleware/rateLimiter.ts`

### What this file does
Four rate limiters that protect the API from flooding, brute force, and concurrent request abuse. All import from `express-rate-limit`.

### Four exports to implement

#### `authLimiter`
```
windowMs: 15 minutes
max: 15 attempts
skipSuccessfulRequests: true   ← only failed logins count toward limit
Applied to: /api/auth/* and /api/admin/auth/*
Purpose: stops brute-force password guessing
```

#### `apiLimiter`
```
windowMs: 15 minutes
max: 300 requests per IP
skip function: reads TRUSTED_IPS from env, skips those IPs
Applied to: all /api/* routes globally in server.ts
Purpose: general flood protection
```

#### `enrollmentLimiter`
```
windowMs: 1 minute
max: 10 requests
keyGenerator: uses IP + student._id from req.student (set by protect middleware)
Applied to: POST /api/courses/:id/enroll only
Purpose: prevents spam-clicking enroll during high-traffic registration windows
```

#### `adminActionLimiter`
```
windowMs: 1 minute
max: 30 requests per IP
Applied to: all admin write endpoints (POST, PUT, DELETE, PATCH)
Purpose: slows down scripts trying to batch-create or batch-delete users
```

### Shared error response for all limiters
```typescript
const limitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success:    false,
    message:    'Too many requests. Please wait a moment and try again.',
    retryAfter: res.getHeader('Retry-After'),
  });
};
```

### Edge case: `standardHeaders: true, legacyHeaders: false`
Always set both on every limiter. `standardHeaders` sends `RateLimit-*` headers per RFC. `legacyHeaders: false` removes the old `X-RateLimit-*` headers.

### Source file
Copy the complete implementation from: `outputs/new_backend/middleware/rateLimiter.ts`

---

## Step 5 — CREATE: `middleware/errorHandler.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/middleware/errorHandler.ts`

### What this file does
Two exports that together eliminate all try/catch repetition in controllers:
- `asyncWrap(fn)` — wraps any async controller so thrown errors reach `errorHandler`
- `AppError` class — typed error for business rule violations
- `errorHandler` — 4-argument Express error middleware, registered last in `server.ts`

### `asyncWrap` pattern
```typescript
// Controllers go from this:
export const fn = async (req, res) => {
  try { ... } catch(err) { res.status(500).json(...) }
}

// To this (error goes to errorHandler automatically):
export const fn = asyncWrap(async (req, res) => {
  ...  // throw AppError here, no try/catch needed
});
```

### `AppError` class
```typescript
export class AppError extends Error {
  statusCode:    number;
  isOperational: boolean;   // true = expected business error, not a crash

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### `errorHandler` — 7 error types to handle

| Error type | Status | How to detect | Response |
|-----------|--------|---------------|----------|
| `mongoose.Error.ValidationError` | 400 | `instanceof mongoose.Error.ValidationError` | `{ success:false, message:"Validation failed", errors:{field:"msg"} }` |
| MongoDB duplicate key | 409 | `err.code === 11000` | Extract field from `err.keyValue`, readable message |
| `mongoose.Error.CastError` | 400 | `instanceof mongoose.Error.CastError` | `"Invalid value for path: value"` |
| `TokenExpiredError` | 401 | `err.name === 'TokenExpiredError'` | `"Your session has expired."` |
| `JsonWebTokenError` | 401 | `err.name === 'JsonWebTokenError'` | `"Invalid token."` |
| `AppError` (operational) | varies | `err.isOperational === true` | Pass through `err.statusCode` and `err.message` |
| Unknown error | 500 | Fallback | In production: generic message. In dev: include `err.stack` |

### Critical rule for `errorHandler` position
Must be registered as the **very last** `app.use()` in `server.ts`, after the 404 handler.

### Source file
Copy the complete implementation from: `outputs/new_backend/middleware/errorHandler.ts`

---

## Step 6 — EDIT: `middleware/adminProtect.ts`

**Action:** Open the existing file and make the changes below.
**Path:** `server/src/middleware/adminProtect.ts`

### What already exists (do not touch)
- The `adminProtect` function that reads Bearer token and loads `AdminUser`
- The `requireRole(...roles)` middleware factory
- The `JwtPayload` interface
- The global `Request` extension for `req.adminUser`

### Changes to make

**Change 1 — Add `req.adminPermissions` to the Express Request extension**

Find this block:
```typescript
declare global {
  namespace Express {
    interface Request {
      adminUser?: IAdminUser;
    }
  }
}
```
Add one line inside the interface:
```typescript
declare global {
  namespace Express {
    interface Request {
      adminUser?:        IAdminUser;
      adminPermissions?: PermissionKey[];   // ADD THIS LINE
    }
  }
}
```

**Change 2 — Add import for `AdminPermission` and `PermissionKey`**

At the top of the file, add this import:
```typescript
import AdminPermission, { PermissionKey } from '../models/AdminPermission';
```

**Change 3 — Inside `adminProtect`, after the `isActive` check, add permission loading**

Find the line where `req.adminUser = user` is set and `next()` is called.
Insert this block BEFORE `next()`:
```typescript
// Load permissions from DB
if (user.role === 'super_admin') {
  // super_admin always has all permissions — no DB lookup needed
  req.adminPermissions = [
    'users:list', 'users:view', 'users:create', 'users:update',
    'users:delete', 'users:toggle', 'users:stats',
    'courses:list', 'courses:view', 'courses:create',
    'courses:update', 'courses:delete', 'courses:enrollments',
    'enrollments:list',
  ];
} else if (user.role === 'admin') {
  const permDoc = await AdminPermission
    .findOne({ admin: user._id })
    .select('permissions')
    .lean();
  req.adminPermissions = (permDoc?.permissions ?? []) as PermissionKey[];
} else {
  req.adminPermissions = [];   // student — no admin permissions
}
```

**Change 4 — Add the `requirePermission` export at the bottom of the file**

After the existing `requireRole` export, add:
```typescript
// requirePermission — soft configurable gate
// super_admin always passes (their permissions array has all 14 keys).
// admin passes only if super_admin explicitly granted the key.
// student always fails (empty permissions array).
export const requirePermission = (key: PermissionKey) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminPermissions || !req.adminPermissions.includes(key)) {
      res.status(403).json({
        success:            false,
        message:            `Access denied. You do not have the "${key}" permission.`,
        requiredPermission: key,
      });
      return;
    }
    next();
  };
```

**Change 5 — Wrap the outer try/catch to use lean() for performance**

Find this line inside `adminProtect`:
```typescript
const user = await AdminUser.findById(decoded.id);
```
Change it to:
```typescript
const user = await AdminUser.findById(decoded.id).lean();
```
Then change the line that assigns `req.adminUser`:
```typescript
req.adminUser = user as unknown as IAdminUser;
```

### What NOT to change
- `requireRole` function — leave exactly as is
- The JWT verification block — leave as is
- The 401 responses — leave as is

### Source file
See complete updated version at: `outputs/new_backend/middleware/adminProtect.ts`

---

## Step 7 — EDIT: `controllers/adminUsersController.ts`

**Action:** Open the existing file and add to / modify the functions below.
**Path:** `server/src/controllers/adminUsersController.ts`

### What already exists (do not touch)
- `listUsers` — exists, needs additions
- `getUserStats` — exists, needs one addition
- `getUser` — exists, needs one addition
- `createUser` — exists, needs AuditLog call added
- `updateUser` — exists, needs AuditLog call added
- `deleteUser` — exists, needs AuditLog call added
- `toggleUserStatus` — exists, needs AuditLog call added
- `safeUser()` helper — exists, leave as is

### Changes per function

#### `listUsers` — add pagination and search
At the top of the function, before the filter object, add:
```typescript
const page   = Math.max(1, parseInt(req.query.page   as string) || 1);
const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
const skip   = (page - 1) * limit;
const search = (req.query.search as string)?.trim();
```

Add to the `find()` call:
```typescript
// If search query provided, filter by name or email
if (search) {
  filter.$or = [
    { fullName: { $regex: search, $options: 'i' } },
    { email:    { $regex: search, $options: 'i' } },
  ];
}
```

Add `skip`, `limit`, and total count to the query:
```typescript
const [users, total] = await Promise.all([
  AdminUser.find(filter)
    .populate('createdBy', 'fullName email role')
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(),
  AdminUser.countDocuments(filter),
]);
```

Update the response to include pagination:
```typescript
res.status(200).json({
  success: true,
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  count: users.length,
  users: users.map(safeUser),
});
```

#### `getUserStats` — add `recentLogins`
After the existing `Promise.all`, add `recentLogins` count:
```typescript
const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
// Add to the Promise.all array:
AdminUser.countDocuments({ lastLogin: { $gte: last24h } }),
```
Add it to the response:
```typescript
stats: {
  totalAdmins, totalStudents, activeAdmins, activeStudents, totalUsers,
  recentLogins,   // ADD THIS
}
```

#### `getUser` — add `permissionsDoc` virtual populate
Add `.populate('permissionsDoc', 'permissions grantedBy note updatedAt')` to the find chain:
```typescript
const user = await AdminUser.findById(req.params.id)
  .populate('createdBy',      'fullName email role')
  .populate('permissionsDoc', 'permissions grantedBy note updatedAt')  // ADD THIS
  .lean();
```

#### `createUser` — add AuditLog after successful creation
After `AdminUser.create(...)`, add:
```typescript
await AuditLog.create({
  actor:      creator._id,
  action:     'user:create',
  targetUser: newUser._id,
  details:    { role, email: newUser.email },
  ipAddress:  req.ip,
});
```

#### `updateUser` — add AuditLog after save
After `user.save()`, add:
```typescript
await AuditLog.create({
  actor:      caller._id,
  action:     'user:update',
  targetUser: user._id,
  details:    { fullName, email, isActive },
  ipAddress:  req.ip,
});
```

#### `deleteUser` — add AuditLog before deleteOne
Before `user.deleteOne()`, add:
```typescript
await AuditLog.create({
  actor:      req.adminUser!._id,
  action:     'user:delete',
  targetUser: user._id,
  details:    { email: user.email, role: user.role },
  ipAddress:  req.ip,
});
```

#### `toggleUserStatus` — add AuditLog after save
After `user.save()`, add:
```typescript
await AuditLog.create({
  actor:      req.adminUser!._id,
  action:     'user:toggle',
  targetUser: user._id,
  details:    { isActive: user.isActive },
  ipAddress:  req.ip,
});
```

### New import to add at top of file
```typescript
import AuditLog from '../models/AuditLog';
```

### Source file
See complete updated version at: `outputs/new_backend/controllers/adminUsersController.ts`

---

## Step 8 — EDIT: `controllers/courseController.ts`

**Action:** Open the existing file and make the changes below.
**Path:** `server/src/controllers/courseController.ts`

### What already exists (do not touch)
- `getCourses()` — exists, add `.lean()` for performance
- `getCourse()` — exists, add ObjectId validation
- `createCourse()` — exists, add AuditLog
- `enrollCourse()` — EXISTS BUT MUST BE REWRITTEN (race condition)
- `dropCourse()` — exists, add AuditLog

### New functions to ADD (do not exist yet)
- `updateCourse()` — new
- `deleteCourse()` — new (soft delete)
- `getCourseEnrollments()` — new

### Changes per function

#### `enrollCourse` — REWRITE completely (race condition fix)

**The problem with the current version:**
```typescript
// CURRENT CODE IS BROKEN UNDER CONCURRENCY:
const course = await Course.findById(courseId);
if (course.enrolledCount >= course.capacity) { ... }  // race: two students pass this check
// ... both create Enrollment docs
course.enrolledCount += 1;
await course.save();   // enrolledCount wrong — one seat oversold
```

**Replace the entire `enrollCourse` function body with:**
```typescript
export const enrollCourse = async (req, res) => {
  const student  = req.student!;
  const courseId = req.params.id;

  // Validate ObjectId first
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new AppError('Invalid course ID format.', 400);
  }

  // ATOMIC: increment enrolledCount ONLY IF a seat is available
  // The $expr filter compares two fields atomically — MongoDB document-level
  // lock means only ONE request can succeed when the last seat is taken
  const updatedCourse = await Course.findOneAndUpdate(
    {
      _id:      courseId,
      isActive: true,
      $expr: { $lt: ['$enrolledCount', '$capacity'] },  // filter: seat available
    },
    { $inc: { enrolledCount: 1 } },
    { new: true, runValidators: false }
  );

  if (!updatedCourse) {
    // null means: course not found OR course was full
    const course = await Course.findById(courseId).select('isActive enrolledCount capacity').lean();
    if (!course)          throw new AppError('Course not found.', 404);
    if (!course.isActive) throw new AppError('This course is no longer available.', 400);
    throw new AppError('This course is full. No seats are available.', 400);
  }

  // Create Enrollment document
  const year = new Date().getFullYear();
  try {
    await Enrollment.create({
      student:      student._id,
      course:       courseId,
      semester:     student.currentSemester,
      academicYear: `${year}-${year + 1}`,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      // Duplicate: rollback the increment
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } });
      throw new AppError('You are already enrolled in this course this semester.', 409);
    }
    // Unknown error: rollback and rethrow
    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: -1 } });
    throw err;
  }

  await AuditLog.create({
    actor:        student._id,
    action:       'enroll',
    targetCourse: courseId,
    details:      { semester: student.currentSemester, academicYear: `${year}-${year + 1}` },
    ipAddress:    req.ip,
  });

  res.status(201).json({
    success:        true,
    message:        `Successfully enrolled in ${updatedCourse.code}.`,
    seatsRemaining: updatedCourse.capacity - updatedCourse.enrolledCount,
  });
};
```

#### `dropCourse` — add AuditLog
After the `$inc` update, add:
```typescript
await AuditLog.create({
  actor:        student._id,
  action:       'drop',
  targetCourse: courseId,
  details:      { semester: student.currentSemester },
  ipAddress:    req.ip,
});
```

#### `getCourses` — add `.lean()` for read performance
```typescript
const courses = await Course.find({ isActive: true })
  .select('code name day time room credits instructor capacity enrolledCount')
  .lean()   // returns plain JS objects — ~30% faster under load
  .exec();

res.status(200).json({ success: true, count: courses.length, courses });
```

#### ADD: `updateCourse` — new function
```typescript
export const updateCourse = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid course ID format.', 400);
  }

  const allowed = ['name','day','time','room','credits','instructor','capacity','isActive'];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // Guard: cannot reduce capacity below current enrollment
  if (updates.capacity !== undefined) {
    const course = await Course.findById(req.params.id).select('enrolledCount').lean();
    if (!course) throw new AppError('Course not found.', 404);
    if (updates.capacity < course.enrolledCount) {
      throw new AppError(
        `Cannot set capacity to ${updates.capacity} — ${course.enrolledCount} students are enrolled.`,
        400
      );
    }
  }

  const updated = await Course.findByIdAndUpdate(
    req.params.id, { $set: updates }, { new: true, runValidators: true }
  );
  if (!updated) throw new AppError('Course not found.', 404);

  if (req.adminUser) {
    await AuditLog.create({
      actor:        req.adminUser._id,
      action:       'course:update',
      targetCourse: updated._id,
      details:      updates,
      ipAddress:    req.ip,
    });
  }

  res.status(200).json({ success: true, course: updated });
};
```

#### ADD: `deleteCourse` — soft delete, new function
```typescript
export const deleteCourse = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid course ID format.', 400);
  }

  // SOFT DELETE — sets isActive:false, preserves enrollment history
  const course = await Course.findByIdAndUpdate(
    req.params.id, { $set: { isActive: false } }, { new: true }
  );
  if (!course) throw new AppError('Course not found.', 404);

  if (req.adminUser) {
    await AuditLog.create({
      actor:        req.adminUser._id,
      action:       'course:delete',
      targetCourse: course._id,
      details:      { code: course.code, softDelete: true },
      ipAddress:    req.ip,
    });
  }

  res.status(200).json({
    success: true,
    message: `Course "${course.code}" deactivated (soft delete). Enrollment history preserved.`,
  });
};
```

#### ADD: `getCourseEnrollments` — new function
```typescript
export const getCourseEnrollments = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid course ID format.', 400);
  }

  const enrollments = await Enrollment.find({ course: req.params.id })
    .populate('student', 'fullName universityId email major academicYear')
    .sort({ enrolledAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: enrollments.length, enrollments });
};
```

### New imports to add at top of file
```typescript
import mongoose   from 'mongoose';
import AuditLog   from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
```

### Source file
See complete updated version at: `outputs/new_backend/controllers/courseController.ts`

---

## Step 9 — CREATE: `controllers/permissionController.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/controllers/permissionController.ts`

### Six functions to implement

#### `listAllPermissions` — `GET /api/admin/permissions`
- Find all `role:'admin'` users
- Find all their `AdminPermission` docs in one query
- Merge: every admin appears in the list even if they have no permission doc (shows `permissions:[]`)
- Return `allKeys: ALL_PERMISSIONS` so frontend can render checkboxes

#### `getAdminPermissions` — `GET /api/admin/permissions/:adminId`
- If target is `super_admin` → return all 14 keys with note explaining super_admin always has full access
- Otherwise → find their `AdminPermission` doc, return it
- If no doc exists yet → return `permissions:[]`

#### `setPermissions` — `POST /api/admin/permissions/:adminId`
- Validate all keys in body against `ALL_PERMISSIONS` → 400 if unknown key found
- Cannot modify `super_admin` → 403
- Cannot modify non-admin role → 400
- Use `findOneAndUpdate` with `upsert:true` → creates doc if not exists
- Call `AuditLog.create()` with `action:'permissions:set'`
- Return updated permissions doc

#### `grantPermissions` — `PATCH /api/admin/permissions/:adminId/grant`
- Validate keys
- Use `$addToSet` with `$each` → idempotent, safe to call multiple times
- Call `AuditLog.create()` with `action:'permissions:grant'`

#### `revokePermissions` — `PATCH /api/admin/permissions/:adminId/revoke`
- Validate target exists and is not super_admin
- Use `$pull` with `$in` → removes matching elements
- Call `AuditLog.create()` with `action:'permissions:revoke'`

#### `clearPermissions` — `DELETE /api/admin/permissions/:adminId`
- Set `permissions:[]` using `findOneAndUpdate` with `upsert:true`
- Call `AuditLog.create()` with `action:'permissions:clear'`

### Edge cases every function must handle
- Target user not found → 404
- Target is `super_admin` → 403
- Empty `permissions` array in body → 400
- Unknown permission key in array → 400 with the invalid keys listed
- No existing `AdminPermission` doc → upsert creates it (never throw 404 for this)

### Source file
Copy the complete implementation from: `outputs/new_backend/controllers/permissionController.ts`

---

## Step 10 — CREATE: `controllers/auditController.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/controllers/auditController.ts`

### Three functions to implement

#### `listAuditLogs` — `GET /api/admin/audit`
- Pagination: `page`, `limit` from query. Max 100 per page
- Filter by `?action=` and `?actorId=` query params
- Populate: `actor (fullName,email,role)`, `targetUser (fullName,email,role)`, `targetCourse (code,name)`
- Sort by `createdAt: -1`
- Return `total`, `pages`, `page`, `limit`, `logs`

#### `myAuditLogs` — `GET /api/admin/audit/mine`
- Same as above but filter is `{ actor: req.adminUser._id }`
- Available to all admin roles (not just super_admin)

#### `userAuditLogs` — `GET /api/admin/audit/user/:id`
- Filter is `{ $or: [{ actor: id }, { targetUser: id }] }`
- Returns logs where the user was either the actor OR the target

### Source file
Copy the complete implementation from: `outputs/new_backend/controllers/auditController.ts`

---

## Step 11 — EDIT: `routes/adminUsersRoutes.ts`

**Action:** Open the existing file and make the changes below.
**Path:** `server/src/routes/adminUsersRoutes.ts`

### What already exists (do not touch)
- All 7 route definitions with `requireRole()` guards
- `router.use(adminProtect)`
- All imports

### Changes to make

**Change 1 — Add new imports**
```typescript
import { requirePermission }   from '../middleware/adminProtect';   // ADD
import { asyncWrap }           from '../middleware/errorHandler';    // ADD
import { adminActionLimiter }  from '../middleware/rateLimiter';     // ADD
```

**Change 2 — Wrap every handler with `asyncWrap()`**

Find each route definition and add `asyncWrap()`:
```typescript
// BEFORE:
router.get('/stats', requireRole('super_admin'), getUserStats);

// AFTER:
router.get('/stats', requireRole('super_admin'), requirePermission('users:stats'), asyncWrap(getUserStats));
```

Apply the same pattern to every route, adding the correct `requirePermission(key)`:

| Route | Existing `requireRole` | Add `requirePermission` |
|-------|----------------------|------------------------|
| `GET /stats` | `super_admin` | `users:stats` |
| `GET /` | `super_admin, admin` | `users:list` |
| `GET /:id` | `super_admin, admin` | `users:view` |
| `POST /` | `super_admin, admin` | `users:create` |
| `PUT /:id` | `super_admin, admin` | `users:update` |
| `DELETE /:id` | `super_admin` | `users:delete` |
| `PATCH /:id/toggle` | `super_admin, admin` | `users:toggle` |

**Change 3 — Add `adminActionLimiter` to write routes**

Add `adminActionLimiter` before `requirePermission` on POST, PUT, DELETE, PATCH:
```typescript
router.post('/', adminActionLimiter, requirePermission('users:create'), asyncWrap(createUser));
```

### Source file
See complete updated version at: `outputs/new_backend/routes/adminUsersRoutes.ts`

---

## Step 12 — EDIT: `routes/courseRoutes.ts`

**Action:** Open the existing file and make the changes below.
**Path:** `server/src/routes/courseRoutes.ts`

### What already exists (do not touch)
- `GET /` → `getCourses`
- `GET /:id` → `getCourse`
- `POST /` → `createCourse`
- `POST /:id/enroll` → `enrollCourse`
- `DELETE /:id/enroll` → `dropCourse`

### Changes to make

**Change 1 — Add new imports**
```typescript
import { updateCourse, deleteCourse, getCourseEnrollments } from '../controllers/courseController';
import { adminProtect, requireRole, requirePermission }      from '../middleware/adminProtect';
import { asyncWrap }                                         from '../middleware/errorHandler';
import { enrollmentLimiter, adminActionLimiter }             from '../middleware/rateLimiter';
```

**Change 2 — Wrap existing routes with `asyncWrap()`**
```typescript
// Change all existing routes to use asyncWrap:
router.get('/',    protect, asyncWrap(getCourses));
router.get('/:id', protect, asyncWrap(getCourse));
router.post('/:id/enroll', protect, enrollmentLimiter, asyncWrap(enrollCourse));
router.delete('/:id/enroll', protect, asyncWrap(dropCourse));
```

**Change 3 — Move `createCourse` to admin-protected**

The existing `POST /` uses `protect` (student JWT). Change it to use `adminProtect` + permission:
```typescript
// BEFORE (student JWT):
router.post('/', protect, createCourse);

// AFTER (admin JWT + permission):
router.post('/', adminProtect, requirePermission('courses:create'), adminActionLimiter, asyncWrap(createCourse));
```

**Change 4 — Add three new admin routes**
```typescript
// Update course
router.put('/:id',
  adminProtect, requirePermission('courses:update'), adminActionLimiter,
  asyncWrap(updateCourse)
);

// Soft-delete course (super_admin only)
router.delete('/:id',
  adminProtect, requireRole('super_admin'), requirePermission('courses:delete'), adminActionLimiter,
  asyncWrap(deleteCourse)
);

// View students enrolled in a course
router.get('/:id/enrollments',
  adminProtect, requirePermission('courses:enrollments'),
  asyncWrap(getCourseEnrollments)
);
```

### Source file
See complete updated version at: `outputs/new_backend/routes/courseRoutes.ts`

---

## Step 13 — CREATE: `routes/permissionRoutes.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/routes/permissionRoutes.ts`

### What to implement
Mount all 6 permission endpoints. Every route uses `router.use(adminProtect)` + `router.use(requireRole('super_admin'))` at the router level — no need to repeat per route.

```
GET    /               → listAllPermissions
GET    /:adminId       → getAdminPermissions
POST   /:adminId       → setPermissions
PATCH  /:adminId/grant → grantPermissions
PATCH  /:adminId/revoke → revokePermissions
DELETE /:adminId       → clearPermissions
```

All handlers wrapped in `asyncWrap()`. `adminActionLimiter` applied at router level.

### Source file
Copy the complete implementation from: `outputs/new_backend/routes/permissionRoutes.ts`

---

## Step 14 — CREATE: `routes/auditRoutes.ts`

**Action:** Create this file. It does not exist yet.
**Path:** `server/src/routes/auditRoutes.ts`

### What to implement
```
GET /mine      → myAuditLogs       (all admin roles — no requireRole needed)
GET /          → listAuditLogs     (requireRole('super_admin'))
GET /user/:id  → userAuditLogs     (requireRole('super_admin'))
```

All routes use `router.use(adminProtect)`. All handlers wrapped in `asyncWrap()`.

### Source file
Copy the complete implementation from: `outputs/new_backend/routes/auditRoutes.ts`

---

## Step 15 — EDIT: `server.ts`

**Action:** Open the existing file and make the changes below. Do not remove existing routes.
**Path:** `server/src/server.ts`

### What already exists (do not touch)
- All existing `import` statements
- `dotenv.config()` and `connectDB()`
- `cors()`, `express.json()` setup
- All existing route mounts: `/api/auth`, `/api/home`, `/api/courses`, `/api/admin/auth`, `/api/admin/users`
- `app.listen()`

### Changes to make

**Change 1 — Add new imports at top**
```typescript
import helmet          from 'helmet';
import mongoSanitize   from 'express-mongo-sanitize';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler }            from './middleware/errorHandler';
import permissionRoutes  from './routes/permissionRoutes';
import auditRoutes       from './routes/auditRoutes';
```

**Change 2 — Add security middleware BEFORE existing middleware**

After `const app = express();` and before `app.use(cors(...))`, add:
```typescript
app.use(helmet());   // 15 security headers
```

After `app.use(express.json(...))`, add:
```typescript
app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize());   // NoSQL injection prevention
```

**Change 3 — Change `express.json()` to add body size limit**
```typescript
// BEFORE:
app.use(express.json());

// AFTER:
app.use(express.json({ limit: '10kb' }));
```

**Change 4 — Add global rate limiter**

After `app.use(mongoSanitize())`, add:
```typescript
app.use('/api', apiLimiter);
```

**Change 5 — Add `authLimiter` to auth routes**
```typescript
// BEFORE:
app.use('/api/auth',        authRoutes);
app.use('/api/admin/auth',  adminAuthRoutes);

// AFTER:
app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/admin/auth',  authLimiter, adminAuthRoutes);
```

**Change 6 — Mount the two new route groups**

After the existing `app.use('/api/admin/users', ...)` line, add:
```typescript
app.use('/api/admin/permissions', permissionRoutes);
app.use('/api/admin/audit',       auditRoutes);
```

**Change 7 — Add 404 handler BEFORE error handler (both must come after all routes)**
```typescript
// 404 — unknown routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler — MUST BE LAST
app.use(errorHandler);
```

**Change 8 — Add graceful shutdown**

After `const server = app.listen(...)`, add:
```typescript
const shutdown = (signal: string) => {
  console.log(`\n${signal} received — shutting down...`);
  server.close(() => { process.exit(0); });
  setTimeout(() => process.exit(1), 10_000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
```

### Source file
See complete updated version at: `outputs/new_backend/server.ts`

---

## All Endpoints — Final Reference Table

### Student-Facing (`/api/auth`, `/api/home`, `/api/courses`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register new student |
| POST | `/api/auth/login` | Public | Student login |
| POST | `/api/auth/forgot-password` | Public | Request password reset |
| POST | `/api/auth/reset-password/:token` | Public | Complete password reset |
| GET | `/api/auth/me` | JWT | Get current student profile |
| GET | `/api/home` | JWT | Dashboard data + enrolled courses |
| GET | `/api/courses` | JWT | List all active courses |
| GET | `/api/courses/:id` | JWT | Single course detail |
| POST | `/api/courses/:id/enroll` | JWT + enrollmentLimiter | Enroll in course (atomic) |
| DELETE | `/api/courses/:id/enroll` | JWT | Drop a course |

### Admin-Facing (`/api/admin/*`)

| Method | Path | Required Role | Required Permission | Description |
|--------|------|--------------|--------------------:|-------------|
| POST | `/api/admin/auth/login` | Public | — | Admin login (all roles) |
| GET | `/api/admin/auth/me` | Admin JWT | — | Current admin profile |
| GET | `/api/admin/users/stats` | super_admin | `users:stats` | User count stats |
| GET | `/api/admin/users` | admin+ | `users:list` | List users (paginated, searchable) |
| GET | `/api/admin/users/:id` | admin+ | `users:view` | Single user + permissions |
| POST | `/api/admin/users` | admin+ | `users:create` | Create admin or student |
| PUT | `/api/admin/users/:id` | admin+ | `users:update` | Update user fields |
| DELETE | `/api/admin/users/:id` | super_admin | `users:delete` | Delete user |
| PATCH | `/api/admin/users/:id/toggle` | admin+ | `users:toggle` | Toggle isActive |
| GET | `/api/admin/permissions` | super_admin | — | All admins + permissions |
| GET | `/api/admin/permissions/:adminId` | super_admin | — | One admin's permissions |
| POST | `/api/admin/permissions/:adminId` | super_admin | — | Set full permission list |
| PATCH | `/api/admin/permissions/:adminId/grant` | super_admin | — | Add specific permissions |
| PATCH | `/api/admin/permissions/:adminId/revoke` | super_admin | — | Remove specific permissions |
| DELETE | `/api/admin/permissions/:adminId` | super_admin | — | Clear all permissions |
| GET | `/api/admin/audit` | super_admin | — | Full paginated audit log |
| GET | `/api/admin/audit/mine` | admin+ | — | Own action history |
| GET | `/api/admin/audit/user/:id` | super_admin | — | All logs for a user |

### Admin-Managed Course Endpoints

| Method | Path | Required Role | Required Permission | Description |
|--------|------|--------------|--------------------:|-------------|
| POST | `/api/courses` | admin+ | `courses:create` | Create a course |
| PUT | `/api/courses/:id` | admin+ | `courses:update` | Update course |
| DELETE | `/api/courses/:id` | super_admin | `courses:delete` | Soft-delete course |
| GET | `/api/courses/:id/enrollments` | admin+ | `courses:enrollments` | Students in course |

---

## Error Response Convention

Every error from every endpoint follows this shape:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors":  { "fieldName": "validation message" },   // only on 400 validation errors
  "requiredPermission": "users:create",               // only on 403 from requirePermission
  "retryAfter": 900,                                  // only on 429 from rate limiter
  "stack": "..."                                      // only in development environment
}
```

| HTTP Code | Meaning | When |
|-----------|---------|------|
| 400 | Bad request | Missing required fields, invalid ObjectId, capacity < enrolled |
| 401 | Unauthenticated | No token, expired token, invalid token |
| 403 | Forbidden | Wrong role, missing permission, account deactivated |
| 404 | Not found | Document doesn't exist, unknown route |
| 409 | Conflict | Duplicate email/universityId, already enrolled |
| 429 | Too many requests | Rate limiter triggered |
| 500 | Server error | Unhandled exception (logged, details hidden in production) |

---

## Concurrency — How Requests Are Handled

When many students open the app simultaneously (registration periods):

```
500 students hit POST /api/courses/:id/enroll at the same time
│
├── 1. Node.js event loop queues all 500 TCP connections
├── 2. Express parses each request (fast, synchronous)
├── 3. protect middleware: 500 JWT verifications run in parallel (CPU-bound crypto)
├── 4. enrollmentLimiter: blocks if same user/IP exceeds 10/min
├── 5. 500 findOneAndUpdate calls sent to MongoDB simultaneously
│   │
│   └── MongoDB document-level lock on each Course document:
│       • Only ONE update succeeds at a time per course
│       • $expr filter: { $lt: ['$enrolledCount', '$capacity'] }
│       • If course has 1 seat left: first request gets it, rest get null → 400
│       • No overselling is mathematically possible
│
└── 6. Enrollment.create() for successful requests
    └── Unique compound index prevents duplicate enrollment even if retried
```

**Mongoose connection pool:** Default is 100 MongoDB connections. If you expect >100 simultaneous DB operations, increase it:
```typescript
// In config/db.ts, change:
await mongoose.connect(uri);
// To:
await mongoose.connect(uri, { maxPoolSize: 200 });
```

---

## Permission Key Reference

All 14 permission keys. super_admin has all by default. admin has only what super_admin grants:

| Key | Controls | Endpoint |
|-----|----------|----------|
| `users:list` | See all users in panel | `GET /api/admin/users` |
| `users:view` | Open single user detail | `GET /api/admin/users/:id` |
| `users:create` | Create admin or student | `POST /api/admin/users` |
| `users:update` | Edit name/email/password | `PUT /api/admin/users/:id` |
| `users:delete` | Delete user permanently | `DELETE /api/admin/users/:id` |
| `users:toggle` | Activate / deactivate | `PATCH /api/admin/users/:id/toggle` |
| `users:stats` | See dashboard stat cards | `GET /api/admin/users/stats` |
| `courses:list` | Browse all courses | `GET /api/courses` |
| `courses:view` | Open single course | `GET /api/courses/:id` |
| `courses:create` | Create a new course | `POST /api/courses` |
| `courses:update` | Edit course fields | `PUT /api/courses/:id` |
| `courses:delete` | Soft-delete a course | `DELETE /api/courses/:id` |
| `courses:enrollments` | See enrolled students | `GET /api/courses/:id/enrollments` |
| `enrollments:list` | List all enrollments | `GET /api/admin/enrollments` |

---

## Checklist

Work through this in order. Check each box as you complete it.

### Dependencies
- [ ] `npm install helmet express-mongo-sanitize express-rate-limit`
- [ ] `npm install -D @types/express-rate-limit`
- [ ] Verify all 4 packages appear in `package.json`

### New Files — Create
- [ ] `models/AdminPermission.ts` — Schema, ALL_PERMISSIONS, PermissionKey type
- [ ] `models/AuditLog.ts` — Schema, 4 indexes, TTL index
- [ ] `middleware/rateLimiter.ts` — 4 limiters exported
- [ ] `middleware/errorHandler.ts` — asyncWrap, AppError, errorHandler
- [ ] `controllers/permissionController.ts` — 6 functions
- [ ] `controllers/auditController.ts` — 3 functions
- [ ] `routes/permissionRoutes.ts` — 6 routes
- [ ] `routes/auditRoutes.ts` — 3 routes

### Existing Files — Edit
- [ ] `models/AdminUser.ts` — bcrypt 12, virtual, toJSON/toObject, 2 new indexes
- [ ] `middleware/adminProtect.ts` — req.adminPermissions, permission loading, requirePermission()
- [ ] `controllers/adminUsersController.ts` — pagination, search, recentLogins, AuditLog on all writes, permissionsDoc populate
- [ ] `controllers/courseController.ts` — atomic enrollCourse, 3 new functions, AuditLog, lean()
- [ ] `routes/adminUsersRoutes.ts` — requirePermission() + asyncWrap() on all 7 routes
- [ ] `routes/courseRoutes.ts` — asyncWrap(), enrollmentLimiter, 3 new admin routes
- [ ] `server.ts` — helmet, mongoSanitize, 10kb limit, rate limiters, 2 new route mounts, 404 handler, errorHandler, graceful shutdown

### Verification
- [ ] Run `npx ts-node src/scripts/seedSuperAdmin.ts` — see "Super admin created"
- [ ] Login as super_admin at `POST /api/admin/auth/login` — get token
- [ ] Create admin: `POST /api/admin/users`
- [ ] Try admin action without permission → expect 403
- [ ] Grant permission: `PATCH /api/admin/permissions/:id/grant`
- [ ] Try same action again → expect 200
- [ ] Check audit log: `GET /api/admin/audit` → see the grant action
- [ ] Enroll in course: `POST /api/courses/:id/enroll` → check `seatsRemaining` in response
- [ ] Enroll 11+ times in 1 minute → expect 429 from enrollmentLimiter
- [ ] Send `{ "email": { "$gt": "" } }` to login → mongoSanitize strips the operator
- [ ] Unknown route → expect 404 with `{ success:false, message:"Route not found." }`
