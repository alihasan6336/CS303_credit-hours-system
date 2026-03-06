import React, { useEffect, useState } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";
import { authApi, courseApi } from "../../utils/api";
import type { CourseFromApi, HomeStudentPayload } from "../../utils/api";


interface Course {
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
}


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

const MAX_HOURS = 120;



const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [student, setStudent] = useState<HomeStudentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [available, setAvailable] = useState<CourseFromApi[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [modalMsg, setModalMsg] = useState("");

  const courses: Course[] = student?.courses ?? [];
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
  const completedHours = student?.completedHours ?? 0;
  const progressPct = Math.min(100, Math.round((completedHours / MAX_HOURS) * 100));

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    authApi.logout();
    navigate("/login");
  };

  const loadHome = () => {
    setError(null);
    authApi
      .home()
      .then((res) => {
        if (!res.success || !res.student) {
          setError("Could not load dashboard data.");
          return;
        }
        setStudent(res.student);
      })
      .catch((err: Error) => {
        if (err.message?.toLowerCase().includes("unauthorized") ||
          err.message?.toLowerCase().includes("401")) {
          authApi.logout();
          navigate("/login");
        } else {
          setError(err.message || "Failed to load dashboard.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }
    loadHome();
  }, []);

  const handleOpenModal = () => {
    setModalMsg("");
    setShowModal(true);
    setLoadingModal(true);
    courseApi
      .list()
      .then((res) => { if (res.success) setAvailable(res.courses); })
      .catch(() => setModalMsg("Failed to load courses from server."))
      .finally(() => setLoadingModal(false));
  };

  const handleEnroll = (courseId: string) => {
    setEnrollingId(courseId);
    setModalMsg("");
    courseApi
      .enroll(courseId)
      .then((res) => {
        setModalMsg(res.message || "Successfully enrolled!");
        loadHome();
      })
      .catch((err: Error) => setModalMsg(err.message))
      .finally(() => setEnrollingId(null));
  };

  const handleDrop = (courseCode: string) => {
    const found = available.find((c) => c.code === courseCode);
    if (!found?._id) {
      courseApi.list().then((res) => {
        const target = res.courses.find((c) => c.code === courseCode);
        if (target?._id) {
          courseApi.drop(target._id).then(() => loadHome()).catch((e: Error) => alert(e.message));
        }
      });
      return;
    }
    courseApi
      .drop(found._id)
      .then(() => loadHome())
      .catch((err: Error) => alert(err.message));
  };


  return (
    <div className={styles.homeContainer}>
      <aside className={styles.blueSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.gradCapIcon}>🎓</div>
          <h2>Credit Hours<br />System</h2>
        </div>

        <div className={styles.studentCard}>
          <div className={styles.avatar}>
            {loading ? "…" : student ? initials(student.name) : "?"}
          </div>
          <div className={styles.studentInfo}>
            {loading ? (
              <>
                <p className={styles.studentName}>Loading...</p>
                <div style={{ marginTop: 6 }}><p className={styles.studentId}>...</p></div>
              </>
            ) : (
              <>
                <p className={styles.studentName}>{student?.name ?? "—"}</p>
                <p className={styles.studentId}>{student?.id ?? "—"}</p>
              </>
            )}
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`${styles.navItem} ${activeNav === item.label ? styles.navActive : ""}`}
              onClick={() => setActiveNav(item.label)}
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

      <main className={styles.mainContent}>
        {error && (
          <div>
            ⚠️ {error}
            <button onClick={loadHome}>Retry</button>
          </div>
        )}

        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            {loading ? "Loading..." : `${student?.semester ?? ""} — ${student?.major ?? ""}`}
          </div>
          <div className={styles.topBarRight}>
            {loading ? "Loading..." : (student?.semester ?? "—")}
            <div className={styles.notifBtn}>🔔</div>
          </div>
        </header>

        {/* Stats Row */}
        <section className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statIcon}>📖</div>
            <div>
              <p className={styles.statValue}>{loading ? "..." : courses.length}</p>
              <p className={styles.statLabel}>Enrolled Courses</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statPurple}`}>
            <div className={styles.statIcon}>⚡</div>
            <div>
              <p className={styles.statValue}>{loading ? "..." : totalCredits}</p>
              <p className={styles.statLabel}>Credit Hours</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statIcon}>🏆</div>
            <div>
              <p className={styles.statValue}>{loading ? "..." : (student?.gpa?.toFixed(2) ?? "—")}</p>
              <p className={styles.statLabel}>GPA</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statOrange}`}>
            <div className={styles.statIcon}>✅</div>
            <div>
              <p className={styles.statValue}>{loading ? "..." : completedHours}</p>
              <p className={styles.statLabel}>Completed Hours</p>
            </div>
          </div>
        </section>

        {/* Progress + Info */}
        <section className={styles.midRow}>
          <div className={styles.progressCard}>
            <h3 className={styles.cardTitle}>Degree Progress</h3>
            {loading ? (
              <><div style={{ marginTop: 8 }}>Loading progress...</div></>
            ) : (
              <>
                <div className={styles.progressInfo}>
                  <span>{completedHours} / {MAX_HOURS} hours</span>
                  <span className={styles.progressPct}>{progressPct}%</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${progressPct}%` }} />
                </div>
                <div className={styles.progressLabels}>
                  <span>Year {student?.level ?? "—"} — Level {student?.level ?? "—"}</span>
                  <span>{MAX_HOURS - completedHours} hrs remaining</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Student Info</h3>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p>Loading...</p>
              </div>
            ) : (
              <ul className={styles.infoList}>
                <li><span className={styles.infoKey}>Major</span>     <span className={styles.infoVal}>{student?.major ?? "—"}</span></li>
                <li><span className={styles.infoKey}>Level</span>     <span className={styles.infoVal}>Year {student?.level ?? "—"}</span></li>
                <li><span className={styles.infoKey}>GPA</span>       <span className={`${styles.infoVal} ${styles.gpaBadge}`}>{student?.gpa?.toFixed(2) ?? "—"}</span></li>
                <li><span className={styles.infoKey}>Semester</span>  <span className={styles.infoVal}>{student?.semester ?? "—"}</span></li>
                <li><span className={styles.infoKey}>Student ID</span><span className={styles.infoVal}>{student?.id ?? "—"}</span></li>
              </ul>
            )}
          </div>
        </section>

        {/* Course Table */}
        <section className={styles.coursesSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.cardTitle}>Registered Courses</h3>
            <button className={styles.addCourseBtn} onClick={handleOpenModal} disabled={loading}>
              + Add Course
            </button>
          </div>
          <div className={styles.tableWrapper}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
                <p>Loading...</p>
              </div>
            ) : (
              <table className={styles.coursesTable}>
                <thead>
                  <tr>
                    <th>Code</th><th>Course Name</th><th>Instructor</th>
                    <th>Day</th><th>Time</th><th>Room</th><th>Credits</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.emptyCoursesCell}>
                        No courses enrolled yet. Click <strong>+ Add Course</strong> to get started.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course.code}>
                        <td><span className={styles.courseCode}>{course.code}</span></td>
                        <td className={styles.courseName}>{course.name}</td>
                        <td className={styles.instructor}>{course.instructor}</td>
                        <td>
                          <span className={`${styles.dayBadge} ${dayColors[course.day] ?? ""}`}>
                            {course.day}
                          </span>
                        </td>
                        <td className={styles.timeCell}>{course.time}</td>
                        <td>{course.room}</td>
                        <td><span className={styles.creditsBadge}>{course.credits} cr</span></td>
                        <td>
                          <button
                            onClick={() => handleDrop(course.code)}
                            title="Drop this course"
                          >Drop</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* ── Add Course Modal ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Available Courses</h2>
              <button className={styles.modalCloseBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {modalMsg && (
              <p className={`${styles.modalMsg} ${modalMsg.toLowerCase().includes("fail") || modalMsg.toLowerCase().includes("already")
                ? styles.modalMsgError
                : styles.modalMsgSuccess
                }`}>
                {modalMsg}
              </p>
            )}

            {loadingModal ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p>Loading...</p>
              </div>
            ) : available.length === 0 ? (
              <p className={styles.modalEmpty}>
                No courses available yet.
              </p>
            ) : (
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    {["Code", "Name", "Instructor", "Day", "Time", "Room", "Cr", "Seats", ""].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {available.map((c) => {
                    const alreadyEnrolled = courses.some((sc) => sc.code === c.code);
                    const isFull = (c.capacity ?? 0) > 0 && (c.enrolledCount ?? 0) >= (c.capacity ?? 0);
                    return (
                      <tr key={c.code}>
                        <td className={styles.modalCourseCode}>{c.code}</td>
                        <td>{c.name}</td>
                        <td className={styles.modalInstructor}>{c.instructor}</td>
                        <td>{c.day}</td>
                        <td>{c.time}</td>
                        <td>{c.room}</td>
                        <td>{c.credits}</td>
                        <td className={isFull ? styles.modalSeatsFull : styles.modalSeatsOk}>
                          {c.enrolledCount ?? 0}/{c.capacity ?? "∞"}
                        </td>
                        <td>
                          {alreadyEnrolled ? (
                            <button className={styles.modalDropBtn} onClick={() => handleDrop(c.code)}>
                              Drop
                            </button>
                          ) : (
                            <button
                              className={styles.modalEnrollBtn}
                              disabled={isFull || enrollingId === c._id}
                              onClick={() => c._id && handleEnroll(c._id)}
                            >
                              {enrollingId === c._id ? "…" : isFull ? "Full" : "Enroll"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
