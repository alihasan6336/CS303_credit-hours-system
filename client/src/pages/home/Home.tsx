import React, { useEffect, useState } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../utils/api";

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
  name: "Ahmed Al-Rashidi",
  id: "2021-CS-0342",
  level: 3,
  gpa: 3.75,
  completedHours: 87,
  major: "Computer Science",
  semester: "Spring 2025",
  courses: [
    {
      code: "CS303",
      name: "Software Engineering",
      day: "Sunday",
      time: "08:00 – 09:30",
      room: "B-201",
      credits: 3,
      instructor: "Dr. Khalid Nasser",
    },
    {
      code: "CS311",
      name: "Database Systems",
      day: "Monday",
      time: "10:00 – 11:30",
      room: "A-104",
      credits: 3,
      instructor: "Dr. Sara Ahmed",
    },
    {
      code: "CS321",
      name: "Computer Networks",
      day: "Tuesday",
      time: "12:00 – 13:30",
      room: "C-305",
      credits: 3,
      instructor: "Dr. Omar Farouk",
    },
    {
      code: "MATH301",
      name: "Numerical Methods",
      day: "Wednesday",
      time: "09:00 – 10:30",
      room: "D-112",
      credits: 3,
      instructor: "Dr. Laila Hassan",
    },
    {
      code: "CS401",
      name: "Artificial Intelligence",
      day: "Thursday",
      time: "14:00 – 15:30",
      room: "B-310",
      credits: 3,
      instructor: "Dr. Yusuf Malik",
    },
  ],
};

const navItems = [
  { icon: "🏠", label: "Dashboard", active: true },
  { icon: "📚", label: "My Courses", active: false },
  { icon: "➕", label: "Register Course", active: false },
  { icon: "📊", label: "Academic Record", active: false },
  { icon: "🗓️", label: "Schedule", active: false },
  { icon: "⚙️", label: "Settings", active: false },
];

const dayColors: Record<string, string> = {
  Sunday: styles.daySunday,
  Monday: styles.dayMonday,
  Tuesday: styles.dayTuesday,
  Wednesday: styles.dayWednesday,
  Thursday: styles.dayThursday,
};

const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [currentStudent, setCurrentStudent] = useState(defaultStudent);

  // Check if user is admin
  const user = JSON.parse(localStorage.getItem("student") || "{}");
  const isAdmin = user.role === "admin" || user.role === "superadmin";

  const handleSignOut = () => {
    authApi.logout();
    navigate("/login");
  };

  const totalCredits = currentStudent.courses.reduce(
    (sum, c) => sum + c.credits,
    0,
  );
  const maxHours = 120;
  const progressPct = Math.round(
    (currentStudent.completedHours / maxHours) * 100,
  );

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    authApi
      .home()
      .then((response) => {
        if (!response.success || !response.student) return;

        const s = response.student;
        const courses: Course[] = response.courses || [];

        setCurrentStudent((prev) => ({
          ...prev,
          name: s.fullName,
          id: s.universityId,
          level: s.level,
          gpa: s.gpa,
          completedHours: s.completedCreditHours,
          major: s.major,
          semester: `${s.currentSemester} ${s.academicYear}`,
          courses,
        }));
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div className={styles.homeContainer}>
      {/* ── Blue Sidebar ── */}
      <aside className={styles.blueSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.gradCapIcon}>🎓</div>
          <h2>
            Credit Hours
            <br />
            System
          </h2>
        </div>

        <div className={styles.studentCard}>
          <div className={styles.avatar}>
            {currentStudent.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className={styles.studentInfo}>
            <p className={styles.studentName}>{currentStudent.name}</p>
            <p className={styles.studentId}>{currentStudent.id}</p>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`${styles.navItem} ${activeNav === item.label ? styles.navActive : ""}`}
              onClick={() => {
                if (item.label === "Register Course") {
                  navigate("/courses");
                } else {
                  setActiveNav(item.label);
                }
              }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleSignOut}>
          <span>🚪</span> Sign Out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className={styles.mainContent}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              {currentStudent.semester} — {currentStudent.major}
            </p>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.semesterBadge}>
              {currentStudent.semester}
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate("/admin/manage-courses")}
                className={styles.adminBtn}
                title="Manage Courses"
              >
                📚 Admin Panel
              </button>
            )}
            <div className={styles.notifBtn}>🔔</div>
          </div>
        </header>

        {/* Stats Row */}
        <section className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statIcon}>📖</div>
            <div>
              <p className={styles.statValue}>
                {currentStudent.courses.length}
              </p>
              <p className={styles.statLabel}>Enrolled Courses</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statPurple}`}>
            <div className={styles.statIcon}>⚡</div>
            <div>
              <p className={styles.statValue}>{totalCredits}</p>
              <p className={styles.statLabel}>Credit Hours</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statIcon}>🏆</div>
            <div>
              <p className={styles.statValue}>
                {currentStudent.gpa.toFixed(2)}
              </p>
              <p className={styles.statLabel}>GPA</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statOrange}`}>
            <div className={styles.statIcon}>✅</div>
            <div>
              <p className={styles.statValue}>
                {currentStudent.completedHours}
              </p>
              <p className={styles.statLabel}>Completed Hours</p>
            </div>
          </div>
        </section>

        {/* Progress + Info */}
        <section className={styles.midRow}>
          <div className={styles.progressCard}>
            <h3 className={styles.cardTitle}>Degree Progress</h3>
            <div className={styles.progressInfo}>
              <span>
                {currentStudent.completedHours} / {maxHours} hours
              </span>
              <span className={styles.progressPct}>{progressPct}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className={styles.progressLabels}>
              <span>
                Year {currentStudent.level} — Level {currentStudent.level}
              </span>
              <span>
                {maxHours - currentStudent.completedHours} hrs remaining
              </span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Student Info</h3>
            <ul className={styles.infoList}>
              <li>
                <span className={styles.infoKey}>Major</span>
                <span className={styles.infoVal}>{currentStudent.major}</span>
              </li>
              <li>
                <span className={styles.infoKey}>Level</span>
                <span className={styles.infoVal}>
                  Year {currentStudent.level}
                </span>
              </li>
              <li>
                <span className={styles.infoKey}>GPA</span>
                <span className={`${styles.infoVal} ${styles.gpaBadge}`}>
                  {currentStudent.gpa.toFixed(2)}
                </span>
              </li>
              <li>
                <span className={styles.infoKey}>Semester</span>
                <span className={styles.infoVal}>
                  {currentStudent.semester}
                </span>
              </li>
              <li>
                <span className={styles.infoKey}>Student ID</span>
                <span className={styles.infoVal}>{currentStudent.id}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Course Table */}
        <section className={styles.coursesSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.cardTitle}>Registered Courses</h3>
            <button className={styles.addCourseBtn}>+ Add Course</button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.coursesTable}>
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
                {currentStudent.courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No courses enrolled yet.
                    </td>
                  </tr>
                ) : (
                  currentStudent.courses.map((course) => (
                    <tr key={course.code}>
                      <td>
                        <span className={styles.courseCode}>{course.code}</span>
                      </td>
                      <td className={styles.courseName}>{course.name}</td>
                      <td className={styles.instructor}>{course.instructor}</td>
                      <td>
                        <span
                          className={`${styles.dayBadge} ${dayColors[course.day] || ""}`}
                        >
                          {course.day}
                        </span>
                      </td>
                      <td className={styles.timeCell}>{course.time}</td>
                      <td>{course.room}</td>
                      <td>
                        <span className={styles.creditsBadge}>
                          {course.credits} cr
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
