import React, { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../utils/api";
import StudentRegisterForm from "../../components/admin/StudentRegisterForm";
import StudentsTable from "../../components/admin/StudentsTable";
import AccountEditModal from "../../components/admin/AccountEditModal";
import StudentEnrollmentModal from "../../components/admin/StudentEnrollmentModal";
import AdminSidebar from "../../components/admin/AdminSidebar";

interface StudentAccount {
  id: string;
  fullName: string;
  email: string;
  universityId: string;
  major: string;
  level?: number;
  role: string;
  gpa?: number;
  completedCreditHours?: number;
  currentSemester?: string;
  isActive?: boolean;
  createdAt?: string;
  createdBy?: any;
}

const AccountManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "student" | "admin" | "superadmin"
  >("student");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Actual total counts for KPI (from stats API, not paginated)
  const [kpiStats, setKpiStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalSuperAdmins: 0,
  });
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerRole, setRegisterRole] = useState<
    "student" | "admin" | "superadmin"
  >("student");
  const [authorizationMessage, setAuthorizationMessage] = useState<
    string | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [editingAccount, setEditingAccount] = useState<StudentAccount | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [managingEnrollmentStudent, setManagingEnrollmentStudent] = useState<{id: string, name: string} | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const isSuperAdmin = user.role === "superadmin";
  const isAdmin = user.role === "admin";
  
  // canManageUsers is now strictly superadmin since we removed hardcoded whitelist
  const canManageUsers = isSuperAdmin;

  const getPermissionMessage = () => {
    if (isSuperAdmin) {
      return {
        text: "✅ Full authority granted (Super Admin).",
        color: "bg-green-50 border-green-200 text-green-700",
      };
    } else if (isAdmin) {
      return {
        text: "⚠️ View-only authority (students & admins).",
        color: "bg-blue-50 border-blue-200 text-blue-700",
      };
    } else {
      return {
        text: "❌ No authority to access.",
        color: "bg-red-50 border-red-200 text-red-700",
      };
    }
  };

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    universityId: "",
    major: "Computer Science",
    level: 1,
    currentSemester: "Fall",
    completedCreditHours: 0,
    role: "student" as "student" | "admin" | "superadmin",
  });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStudents(activeTab, page, limit, searchQuery);
      if (response.success) {
        setStudents(response.students);
        setTotalPages(response.pages);
        setTotalStudents(response.total);
      }
    } catch (err: any) {
      console.warn("Failed to load students:", err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, searchQuery]);
  
  // Fetch KPI stats (actual totals, not paginated)
  const fetchKpiStats = useCallback(async () => {
    try {
      const response = await adminApi.getStats();
      if (response.success) {
        setKpiStats({
          totalStudents: response.stats.totalStudents || 0,
          totalAdmins: response.stats.totalAdmins || 0,
          totalSuperAdmins: response.stats.totalSuperAdmins || 0,
        });
      }
    } catch (err: any) {
      console.warn("Failed to load KPI stats:", err.message);
    }
  }, []);
  
  // Reset page when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  // Load KPI stats on mount and when tab changes
  useEffect(() => {
    fetchKpiStats();
  }, [fetchKpiStats, activeTab]);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
        level:
          formData.role === "student" ? formData.level : undefined,
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
          level: 1,
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
      await fetchStudents();
      await fetchKpiStats(); // Refresh totals for KPI
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
    }
  };

  const handleEditClick = (account: StudentAccount) => {
    setEditingAccount(account);
    setShowEditModal(true);
  };

  const handleUpdateAccount = async (id: string, data: Partial<StudentAccount>) => {
    try {
      const response = await adminApi.updateAccount(id, data);
      if (response.success) {
        setShowEditModal(false);
        setEditingAccount(null);
        await fetchStudents();
        await fetchKpiStats();
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to update account");
    }
  };

  const handleStudentFormSubmit = async (studentData: any) => {
    setFormLoading(true);
    setError("");
    setAuthorizationMessage(null);

    try {
      const response = registerRole === "student"
        ? await adminApi.createStudentAccount({
            fullName: studentData.fullName,
            email: studentData.email,
            password: studentData.password,
            universityId: studentData.universityId,
            major: studentData.major,
            level: studentData.level,
            currentSemester: studentData.currentSemester,
            completedCreditHours: studentData.completedCreditHours,
            gpa: studentData.gpa,
          })
        : await adminApi.createAdminAccount({
            fullName: studentData.fullName,
            email: studentData.email,
            password: studentData.password,
            universityId: studentData.universityId,
            major: studentData.major,
            phoneNumber: studentData.phoneNumber,
          });

      if (response.success) {
        setAuthorizationMessage(null);
        await fetchStudents();
        await fetchKpiStats(); // Refresh totals for KPI
        setError("");
        setShowRegisterForm(false);
      }
    } catch (err: any) {
      setAuthorizationMessage(
        `❌ Error: ${err.message || "Failed to create user account"}`,
      );
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

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
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Manage Accounts
            </h1>
            <p className="text-gray-500 mt-1">
              {showRegisterForm
                ? `Register new ${registerRole}s to the system`
                : `Manage ${activeTab} accounts`}
            </p>
          </div>
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
              onClick={() => {
                setActiveTab(tab);
                setShowRegisterForm(false);
                setAuthorizationMessage(null);
              }}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}s ({tab === "student" ? kpiStats.totalStudents : tab === "admin" ? kpiStats.totalAdmins : kpiStats.totalSuperAdmins})
            </button>
          ))}
        </div>

        {/* Panel Content */}
        {!showRegisterForm ? (
          /* View Accounts List */
          <div>
            <div className="flex items-center justify-between mb-4">
              {canManageUsers ? (
                <button
                  onClick={() => {
                    setShowRegisterForm(true);
                    setRegisterRole(activeTab);
                    setAuthorizationMessage(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <span>+</span> Register New{" "}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </button>
              ) : (
                <div></div>
              )}

              {/* Permission Message */}
              {(() => {
                const { text, color } = getPermissionMessage();
                return (
                  <div
                    className={`text-xs px-3 py-1.5 rounded border ${color} max-w-xs`}
                  >
                    {text}
                  </div>
                );
              })()}
            </div>

            {/* Search and Pagination Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-gray-600">
                Showing {students.length} of {totalStudents} {activeTab}s
                {searchQuery && ` (filtered by "${searchQuery}")`}
              </div>
            </div>

            {/* Admin/SuperAdmin/Student Accounts Table */}
            {activeTab === "student" ? (
              <StudentsTable
                students={students}
                onDelete={canManageUsers ? handleDeleteAccount : undefined}
                onEdit={canManageUsers ? handleEditClick : undefined}
                onManageEnrollments={(id, name) => {
                  setManagingEnrollmentStudent({id, name});
                  setShowEnrollmentModal(true);
                }}
                showActions={true}
                isLoading={loading}
              />
            ) : (
              /* Admin and SuperAdmin generic table */
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {canManageUsers && (
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-32">
                          Manage
                        </th>
                      )}
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Name
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                        Role
                      </th>
                      {canManageUsers && (
                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                          Delete
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManageUsers ? 5 : 3}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No {activeTab} accounts found
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          {canManageUsers && (
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleEditClick(student)}
                                className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                              >
                                Edit
                              </button>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                                {student.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">
                                {student.fullName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {student.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm capitalize font-medium ${
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
                          {canManageUsers && (
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() =>
                                  handleDeleteAccount(
                                    student.id,
                                    student.fullName,
                                  )
                                }
                                className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
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
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded text-sm ${
                      page === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                    }`}
                  >
                    ← Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded text-sm ${
                            page === pageNum
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded text-sm ${
                      page === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Register New User Form */
          <>
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowRegisterForm(false);
                  setAuthorizationMessage(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2"
              >
                ← Back to{" "}
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} List
              </button>
            </div>

            <div className="flex flex-col items-center w-full">
              {/* Authorization Message */}
              {authorizationMessage && (
                <div
                  className={`mb-6 p-4 rounded-lg border max-w-2xl w-full ${
                    authorizationMessage.startsWith("✅")
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {authorizationMessage}
                </div>
              )}

              {/* Registration Form */}
              <div className="max-w-2xl w-full">
                <StudentRegisterForm
                  role={registerRole}
                  onSubmit={handleStudentFormSubmit}
                  isLoading={formLoading}
                  error={error}
                  onClearError={() => setError("")}
                />
              </div>
            </div>
          </>
        )}
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
                      Level
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
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

      {/* Edit Account Modal */}
      <AccountEditModal
        account={editingAccount}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAccount(null);
        }}
        onSave={handleUpdateAccount}
        isLoading={formLoading}
      />

      {/* Manage Enrollments Modal */}
      <StudentEnrollmentModal
        studentId={managingEnrollmentStudent?.id || ""}
        studentName={managingEnrollmentStudent?.name || ""}
        isOpen={showEnrollmentModal}
        onClose={() => {
          setShowEnrollmentModal(false);
          setManagingEnrollmentStudent(null);
        }}
      />
    </div>
  );
};

export default AccountManagement;
