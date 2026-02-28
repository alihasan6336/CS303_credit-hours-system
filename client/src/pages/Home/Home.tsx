import React, { useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
interface Course {
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
}

interface HomeProps {
  student?: {
    name: string;
    id: string;
    level: number;
    gpa: number;
    completedHours: number;
    major: string;
    semester: string;
    courses: Course[];
  };
}

const defaultStudent = {
  name: 'Ahmed Al-Rashidi',
  id: '2021-CS-0342',
  level: 3,
  gpa: 3.75,
  completedHours: 87,
  major: 'Computer Science',
  semester: 'Spring 2025',
  courses: [
    { code: 'CS303', name: 'Software Engineering', day: 'Sunday', time: '08:00 – 09:30', room: 'B-201', credits: 3, instructor: 'Dr. Khalid Nasser' },
    { code: 'CS311', name: 'Database Systems', day: 'Monday', time: '10:00 – 11:30', room: 'A-104', credits: 3, instructor: 'Dr. Sara Ahmed' },
    { code: 'CS321', name: 'Computer Networks', day: 'Tuesday', time: '12:00 – 13:30', room: 'C-305', credits: 3, instructor: 'Dr. Omar Farouk' },
    { code: 'MATH301', name: 'Numerical Methods', day: 'Wednesday', time: '09:00 – 10:30', room: 'D-112', credits: 3, instructor: 'Dr. Laila Hassan' },
    { code: 'CS401', name: 'Artificial Intelligence', day: 'Thursday', time: '14:00 – 15:30', room: 'B-310', credits: 3, instructor: 'Dr. Yusuf Malik' },
  ],
};

const navItems = [
  { icon: '🏠', label: 'Dashboard', active: true },
  { icon: '📚', label: 'My Courses', active: false },
  { icon: '➕', label: 'Register Course', active: false },
  { icon: '📊', label: 'Academic Record', active: false },
  { icon: '🗓️', label: 'Schedule', active: false },
  { icon: '⚙️', label: 'Settings', active: false },
];

const dayColors: Record<string, string> = {
  Sunday: 'day-sunday',
  Monday: 'day-monday',
  Tuesday: 'day-tuesday',
  Wednesday: 'day-wednesday',
  Thursday: 'day-thursday',
};

const Home: React.FC<HomeProps> = ({ student = defaultStudent }) => {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const totalCredits = student.courses.reduce((sum, c) => sum + c.credits, 0);
  const maxHours = 120;
  const progressPct = Math.round((student.completedHours / maxHours) * 100);
const navigate = useNavigate();
  return (
    <div className="home-container">
      {/* ── Blue Sidebar ── */}
      <aside className="blue-sidebar">
        <div className="sidebar-header">
          <div className="grad-cap-icon">🎓</div>
          <h2>Credit Hours<br />System</h2>
        </div>

        <div className="student-card">
          <div className="avatar">{student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
          <div className="student-info">
            <p className="student-name">{student.name}</p>
            <p className="student-id">{student.id}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.label}
              className={`nav-item ${activeNav === item.label ? 'nav-active' : ''}`}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={()=>navigate('/login')} className="logout-btn">
          <span>🚪</span> Sign Out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">{student.semester} — {student.major}</p>
          </div>
          <div className="top-bar-right">
            <div className="semester-badge">{student.semester}</div>
            <div className="notif-btn">🔔</div>
          </div>
        </header>

        {/* Stats Row */}
        <section className="stats-row">
          <div className="stat-card stat-blue">
            <div className="stat-icon">📖</div>
            <div>
              <p className="stat-value">{student.courses.length}</p>
              <p className="stat-label">Enrolled Courses</p>
            </div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon">⚡</div>
            <div>
              <p className="stat-value">{totalCredits}</p>
              <p className="stat-label">Credit Hours</p>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon">🏆</div>
            <div>
              <p className="stat-value">{student.gpa.toFixed(2)}</p>
              <p className="stat-label">GPA</p>
            </div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">✅</div>
            <div>
              <p className="stat-value">{student.completedHours}</p>
              <p className="stat-label">Completed Hours</p>
            </div>
          </div>
        </section>

        {/* Progress + Info */}
        <section className="mid-row">
          <div className="progress-card">
            <h3 className="card-title">Degree Progress</h3>
            <div className="progress-info">
              <span>{student.completedHours} / {maxHours} hours</span>
              <span className="progress-pct">{progressPct}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="progress-labels">
              <span>Year {student.level} — Level {student.level}</span>
              <span>{maxHours - student.completedHours} hrs remaining</span>
            </div>
          </div>

          <div className="info-card">
            <h3 className="card-title">Student Info</h3>
            <ul className="info-list">
              <li><span className="info-key">Major</span><span className="info-val">{student.major}</span></li>
              <li><span className="info-key">Level</span><span className="info-val">Year {student.level}</span></li>
              <li><span className="info-key">GPA</span><span className="info-val gpa-badge">{student.gpa.toFixed(2)}</span></li>
              <li><span className="info-key">Semester</span><span className="info-val">{student.semester}</span></li>
              <li><span className="info-key">Student ID</span><span className="info-val">{student.id}</span></li>
            </ul>
          </div>
        </section>

        {/* Course Table */}
        <section className="courses-section">
          <div className="section-header">
            <h3 className="card-title">Registered Courses</h3>
            <button className="add-course-btn">+ Add Course</button>
          </div>
          <div className="table-wrapper">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Instructor</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                {student.courses.map(course => (
                  <tr key={course.code}>
                    <td><span className="course-code">{course.code}</span></td>
                    <td className="course-name">{course.name}</td>
                    <td className="instructor">{course.instructor}</td>
                    <td><span className={`day-badge ${dayColors[course.day] || ''}`}>{course.day}</span></td>
                    <td className="time-cell">{course.time}</td>
                    <td>{course.room}</td>
                    <td><span className="credits-badge">{course.credits} cr</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
