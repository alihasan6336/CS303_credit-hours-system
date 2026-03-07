import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, authApi } from "../../utils/api";

interface StudentAccount {
  id: string;
  fullName: string;
  email: string;
  universityId: string;
  major: string;
  academicYear: string;
  level: number;
  role: string;
  gpa: number;
  completedCreditHours: number;
  currentSemester: string;
}

const AccountManagement: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "student" | "admin" | "superadmin"
  >("student");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("student") || "{}");
  const isSuperAdmin = user.role === "superadmin";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    universityId: "",
    major: "Computer Science",
    academicYear: "1st Year",
    currentSemester: "Fall",
    completedCreditHours: 0,
    role: "student" as "student" | "admin" | "superadmin",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await adminApi.getStudents();
      if (response.success) {
        setStudents(response.students);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate("/login");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const response = await adminApi.createAccount({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        universityId: formData.universityId || undefined,
        major: formData.role === "student" ? formData.major : undefined,
        academicYear:
          formData.role === "student" ? formData.academicYear : undefined,
        currentSemester:
          formData.role === "student" ? formData.currentSemester : undefined,
        completedCreditHours:
          formData.role === "student"
            ? formData.completedCreditHours
            : undefined,
        role: formData.role,
      });

      if (response.success) {
        setShowModal(false);
        setFormData({
          fullName: "",
          email: "",
          password: "",
          universityId: "",
          major: "Computer Science",
          academicYear: "1st Year",
          currentSemester: "Fall",
          completedCreditHours: 0,
          role: "student",
        });
        fetchStudents();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}'s account?`)) {
      return;
    }

    try {
      await adminApi.deleteAccount(id);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
    }
  };

  const filteredStudents = students.filter((s) => s.role === activeTab);

  const majors = [
    "Computer Science",
    "Software Engineering",
    "Information Technology",
    "Computer Engineering",
    "Cybersecurity",
    "Data Science",
    "Business Administration",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white">
        <div className="p-6">
          <div className="text-2xl font-bold mb-2">🎓 Admin Panel</div>
          <p className="text-indigo-200 text-sm">Credit Hours System</p>
        </div>

        <div className="px-4 py-3 mx-4 bg-indigo-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
              {user.fullName
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-xs text-indigo-200 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-left transition-colors"
            onClick={() => navigate("/admin")}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg text-left"
            onClick={() => navigate("/admin/accounts")}
          >
            <span>👥</span> Manage Accounts
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-left transition-colors"
            onClick={() => navigate("/admin/manage-courses")}
          >
            <span>📚</span> Manage Courses
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-left transition-colors"
            onClick={() => navigate("/admin/courses")}
          >
            <span>📋</span> Course Assignments
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-200 transition-colors"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Manage Accounts
            </h1>
            <p className="text-gray-500 mt-1">
              Create and manage user accounts
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <span>+</span> Create Account
            </button>
          )}
        </header>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["student", "admin", "superadmin"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}s ({students.filter((s) => s.role === tab).length})
            </button>
          ))}
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Name
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  ID
                </th>
                {activeTab === "student" && (
                  <>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Major
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Level
                    </th>
                  </>
                )}
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Role
                </th>
                {isSuperAdmin && (
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No {activeTab}s found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                          {student.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {student.universityId}
                    </td>
                    {activeTab === "student" && (
                      <>
                        <td className="px-6 py-4 text-gray-600">
                          {student.major}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            Level {student.level}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-sm capitalize ${
                          student.role === "superadmin"
                            ? "bg-purple-100 text-purple-700"
                            : student.role === "admin"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {student.role}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleDeleteAccount(student.id, student.fullName)
                          }
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Create New Account
            </h2>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {formData.role === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University ID
                    </label>
                    <input
                      type="text"
                      value={formData.universityId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          universityId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Major
                    </label>
                    <select
                      value={formData.major}
                      onChange={(e) =>
                        setFormData({ ...formData, major: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {majors.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academicYear: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Semester
                    </label>
                    <select
                      value={formData.currentSemester}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentSemester: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
