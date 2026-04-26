# 🎓 Credit Hours System (CS303)

> **A comprehensive academic management platform for universities to streamline course enrollment, track student progress, and manage academic records.**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?logo=mongodb)](https://mongodb.com)
[![Expo](https://img.shields.io/badge/Expo-Mobile-000020?logo=expo)](https://expo.dev)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Goal & Objectives](#-goal--objectives)
- [Business Value](#-business-value)
- [System Architecture](#-system-architecture)
- [User Flows](#-user-flows)
- [Technical Stack](#-technical-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Scripts & Utilities](#-scripts--utilities)

---

## 🎯 Problem Statement

Traditional university academic management systems face several critical challenges:

- **Manual Course Registration**: Students struggle with paper-based or outdated digital systems for course enrollment
- **Credit Hour Tracking**: No real-time visibility into completed credits vs. graduation requirements
- **GPA Calculation**: Manual grade calculation leads to errors and delays in academic standing assessment
- **Prerequisite Management**: Complex course prerequisite chains are difficult to track and enforce
- **Administrative Overhead**: Staff spend excessive time on enrollment management, grade entry, and reporting
- **Multi-Platform Accessibility**: Lack of mobile-friendly interfaces for students and faculty

---

## 🚀 Goal & Objectives

### Primary Goal
Build a modern, scalable academic management system that automates course enrollment, tracks student academic progress, and provides real-time GPA/credit calculations.

### Key Objectives

| Objective | Description | Status |
|-----------|-------------|--------|
| **Automated Enrollment** | Students can self-enroll in courses with prerequisite validation | ✅ Implemented |
| **Real-time GPA Tracking** | Automatic GPA calculation based on course grades | ✅ Implemented |
| **Credit Hour Management** | Track completed vs. required credits per major | ✅ Implemented |
| **Multi-Platform Access** | Web + Mobile applications for seamless access | ✅ Implemented |
| **Administrative Dashboard** | Comprehensive tools for admins and faculty | ✅ Implemented |
| **Audit & Reporting** | Complete audit trails and analytics | ✅ Implemented |

---

## 💼 Business Value

### For Students
- **24/7 Course Access**: Enroll in courses anytime, anywhere
- **Academic Visibility**: Real-time GPA, credits, and standing
- **Prerequisite Guidance**: Clear path to graduation with prerequisite tracking
- **Mobile Convenience**: Manage academics on-the-go

### For Administrators
- **Operational Efficiency**: Reduce manual enrollment processing by 80%
- **Error Reduction**: Automated validation prevents scheduling conflicts
- **Data-Driven Decisions**: Analytics on enrollment trends and performance
- **Audit Compliance**: Complete audit trails for accreditation

### For Faculty
- **Grade Management**: Streamlined grade entry and modification
- **Class Oversight**: Real-time enrollment numbers and student lists
- **Performance Analytics**: Track class performance metrics

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CREDIT HOURS SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐   │
│  │   Web App    │    │  Mobile App  │    │      Admin Dashboard         │   │
│  │   (React)    │◄──►│   (Expo)     │    │       (React)                │   │
│  │   client/      │    │   client2/     │    │       client/                │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┬───────────────┘   │
│         │                    │                            │                   │
│         └────────────────────┼────────────────────────────┘                   │
│                              │                                             │
│                              ▼                                             │
│                    ┌─────────────────────┐                                  │
│                    │   REST API Server   │                                  │
│                    │    (Express.js)     │                                  │
│                    │     server/         │                                  │
│                    └──────────┬──────────┘                                  │
│                               │                                            │
│                               ▼                                            │
│                    ┌─────────────────────┐                                  │
│                    │    MongoDB Atlas   │                                  │
│                    │   (Cloud Database)  │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Technical Stack

### 🖥️ Frontend (Web) - `client/`

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI library with hooks and context |
| **TypeScript** | 5.9.3 | Type-safe development |
| **Vite** | 7.3.1 | Fast build tool and dev server |
| **React Router** | 7.x | Client-side routing |
| **TailwindCSS** | 4.x | Utility-first styling |
| **Lucide React** | Latest | Modern icon library |
| **Axios** | 1.15.x | HTTP client for API calls |

**Key Features:**
- ⚡ Hot Module Replacement (HMR)
- 📱 Responsive design with TailwindCSS
- 🔒 Protected routes with role-based access
- 📊 Recharts for data visualization
- 🎨 Modern UI with shadcn/ui components

### 📱 Mobile App - `client2/`

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo** | ~54.0.33 | Development platform and tooling |
| **Expo Router** | ~6.0.23 | File-based routing for mobile |
| **TypeScript** | ~5.9.2 | Type-safe mobile development |

**Key Features:**
- 🔄 Shared codebase with web (React)
- 📲 Native iOS/Android navigation
- 💾 AsyncStorage for local persistence
- 🎯 File-based routing (`app/` directory)

### ⚙️ Backend - `server/`

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 5.2.1 | Web framework and API server |
| **TypeScript** | 5.9.3 | Type-safe backend development |
| **MongoDB** | 9.2.3 | NoSQL document database |
| **Mongoose** | 9.2.3 | ODM for MongoDB |
| **JWT** | 9.0.3 | Authentication tokens |
| **bcryptjs** | 3.0.3 | Password hashing |
| **Helmet** | 8.1.0 | Security headers |
| **Rate Limit** | 8.3.1 | API rate limiting |

**Key Features:**
- 🔐 JWT-based authentication with role-based access
- 📊 MongoDB aggregation pipelines for analytics
- 🛡️ Rate limiting and security middleware
- 📝 Comprehensive audit logging
- 🧪 Data seeding scripts for testing

---

## 👤 User Flows

### 1️⃣ Student Registration Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Visit   │───►│  Select  │───►│  Enter   │───►│  Verify  │
│  Portal  │    │  Major   │    │  Details │    │  Email   │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                       │
                        ┌──────────────────────────────┘
                        ▼
                 ┌────────────┐
                 │   Login    │
                 │  Dashboard │
                 └────────────┘
```

### 2️⃣ Course Enrollment Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───►│  View    │───►│  Check   │───►│  Enroll  │
│          │    │  Courses │    │  PreReqs │    │          │
└──────────┘    └──────────┘    └────┬─────┘    └────┬─────┘
                                     │               │
                              ┌──────┘               │
                              ▼                      ▼
                        ┌─────────┐           ┌──────────┐
                        │  Block  │           │  Success │
                        │  Course │           │  Confirm │
                        └─────────┘           └──────────┘
```

### 3️⃣ Grade Entry Flow (Admin)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Admin   │───►│  Select  │───►│  Enter   │───►│  Auto    │
│  Login   │    │  Course  │    │  Grades  │    │  Calc    │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │
                                                     ▼
                                              ┌──────────┐
                                              │  Update  │
                                              │  Student │
                                              │   GPA    │
                                              └──────────┘
```

### 4️⃣ Academic Progress Tracking

```
Student Dashboard
├── 📊 GPA Overview (Current & Cumulative)
├── 📚 Completed Courses (with grades)
├── 📖 Current Enrollments (in-progress)
├── 🎯 Credit Hours (completed/required)
└── 📈 Academic History (semester-wise)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20.12.2 or higher
- **npm**: 10.5.0 or higher
- **MongoDB**: Local instance or MongoDB Atlas account

### Installation

#### 1. Clone and Setup

```bash
git clone <repository-url>
cd CS303_credit-hours-system
```

#### 2. Server Setup (`server/`)

```bash
cd server
npm install
```

Create `.env` file:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/credit-hours
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@credit-hours.com
ADMIN_PASSWORD=admin123
```

Start server:
```bash
npm run dev          # Development mode (ts-node)
npm start            # Production mode (requires build)
```

#### 3. Web Client Setup (`client/`)

```bash
cd client
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5001
```

Start client:
```bash
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

#### 4. Mobile App Setup (`client2/`)

```bash
cd client2
npm install
```

Start Expo development server:
```bash
npx expo start       # Opens Expo dev tools
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app for physical device
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | Student login | Public |
| POST | `/api/auth/register` | Student registration | Public |
| POST | `/api/auth/forgot-password` | Password reset request | Public |
| POST | `/api/admin/auth/login` | Admin login | Public |

### Student Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/students/me` | Get current student profile | Student |
| PATCH | `/api/students/me` | Update student profile | Student |
| GET | `/api/gpa/me` | Get GPA breakdown | Student |

### Course Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/courses` | List all courses | Public |
| GET | `/api/courses?level=1&major=CS` | Filter courses | Public |
| GET | `/api/course-assignments/by-level` | Get assignments by level | Student |

### Enrollment Endpoints (Admin)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/enrollments` | List enrollments | Admin |
| POST | `/api/admin/enrollments` | Create enrollment | Admin |
| PATCH | `/api/admin/enrollments/:id/grade` | Update grade | Admin |
| DELETE | `/api/admin/enrollments/:id` | Delete enrollment | Admin |

### Admin Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/students` | List all students | Admin |
| POST | `/api/admin/students` | Create student account | Admin |
| GET | `/api/admin/stats` | Get dashboard stats | Admin |

---

## 🛠️ Scripts & Utilities

### Data Seeding Scripts (`server/src/scripts/`)

| Script | Command | Purpose |
|--------|---------|---------|
| `createData.ts` | `npm run create-data` | Create sample courses and assignments |
| `createStudentsWithAPI.ts` | `npm run create-students-api` | Bulk create students with enrollments |
| `enrollExistingStudents.ts` | `npm run enroll-existing-students` | Enroll existing students in courses |
| `seedCourses.ts` | - | Seed course catalog |

### Example: Create Test Data

```bash
cd server

# Create courses and assignments
npm run create-data

# Create 21 students across all majors/levels
npm run create-students-api

# Enroll existing students in their courses
npm run enroll-existing-students
```

---

## 📊 Project Structure

```
CS303_credit-hours-system/
│
├── 📁 client/                    # Web Frontend (React + Vite)
│   ├── 📁 src/
│   │   ├── 📁 components/          # Reusable UI components
│   │   │   ├── 📁 auth/            # Login, Register forms
│   │   │   ├── 📁 student/         # Student dashboard components
│   │   │   ├── 📁 admin/           # Admin panel components
│   │   │   └── 📁 layout/          # Layout, Navbar, Footer
│   │   ├── 📁 pages/               # Page components
│   │   │   ├── 📁 auth/            # Login, Register pages
│   │   │   ├── 📁 student/         # Student dashboard, Profile
│   │   │   └── 📁 admin/           # Admin dashboard, Management
│   │   ├── 📁 utils/               # API utilities, helpers
│   │   ├── 📁 types/               # TypeScript type definitions
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   ├── .env                        # Environment variables
│   └── package.json
│
├── 📁 client2/                     # Mobile App (React Native + Expo)
│   ├── 📁 app/                     # Expo Router pages
│   ├── 📁 components/              # Mobile UI components
│   ├── 📁 constants/               # App constants
│   ├── 📁 hooks/                   # Custom React hooks
│   ├── 📁 utils/                   # Utility functions
│   ├── app.json                    # Expo configuration
│   └── package.json
│
├── 📁 server/                      # Backend API (Express + MongoDB)
│   ├── 📁 src/
│   │   ├── 📁 controllers/         # Route controllers
│   │   │   ├── authController.ts   # Authentication logic
│   │   │   ├── enrollmentController.ts
│   │   │   ├── courseController.ts
│   │   │   ├── gpaController.ts
│   │   │   └── adminController.ts
│   │   ├── 📁 models/              # Database models
│   │   │   ├── student.ts          # Student schema
│   │   │   ├── course.ts           # Course schema
│   │   │   ├── Enrollment.ts       # Enrollment schema
│   │   │   └── AdminUser.ts        # Admin schema
│   │   ├── 📁 routes/              # API routes
│   │   ├── 📁 middleware/          # Auth, validation, rate limiting
│   │   ├── 📁 scripts/             # Data seeding scripts
│   │   ├── 📁 utils/               # Helper utilities
│   │   └── server.ts               # Express app entry
│   ├── .env                        # Server environment variables
│   └── package.json
│
└── 📄 README.md                    # This file
```

---

## 🔐 Security Features

- ✅ **JWT Authentication**: Secure token-based auth with expiration
- ✅ **Role-Based Access**: Student, Admin, SuperAdmin permissions
- ✅ **Rate Limiting**: API protection against abuse
- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **Helmet Headers**: Security HTTP headers
- ✅ **Input Sanitization**: MongoDB injection protection
- ✅ **CORS Protection**: Configured cross-origin policies

---

## 📈 Future Enhancements

- [ ] **Real-time Notifications**: WebSocket for enrollment updates
- [ ] **Payment Integration**: Course fee payment processing
- [ ] **Document Upload**: Transcript and ID verification
- [ ] **AI Advisor**: Course recommendation engine
- [ ] **Multi-language Support**: Arabic and English localization
- [ ] **Offline Mode**: Mobile app offline capability

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👥 Team

**CS303 Course Project** - University Academic Management System

Built the development team.

- Youssef bassiony 
- Hassan Khaled 
- Mohamed Ashraf
- Ali Hassan 
- Mostafa 
- Hazem 


