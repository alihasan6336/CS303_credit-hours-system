import React, { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../utils/api";
import StudentRegisterForm from "../../components/admin/StudentRegisterForm";
import StudentsTable from "../../components/admin/StudentsTable";
import AccountEditModal from "../../components/admin/AccountEditModal";
import StudentEnrollmentModal from "../../components/admin/StudentEnrollmentModal";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getStoredAdminUser } from "../../utils/adminAccess";

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

  // Actual total counts for KPI
  const [kpiStats, setKpiStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalSuperAdmins: 0,
  });
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerRole, setRegisterRole] = useState<
    "student" | "admin" | "superadmin"
  >("student");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingAccount, setEditingAccount] = useState<StudentAccount | null>(
    null,
  );
  const [showEditModal, setShowEditModal] = useState(false);

  const [managingEnrollmentStudent, setManagingEnrollmentStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const user = getStoredAdminUser();
  const userRole = (user.role || "").toLowerCase();
  const userEmail = (user.email || "").toLowerCase();

  // High-level logic for superadmin access
  const isSuperAdmin =
    userRole === "superadmin" || userEmail === "admin@admin.com";
  const role = isSuperAdmin ? "superadmin" : userRole;

  const isItAdmin = role === "it_admin";
  const isEnrollmentAdmin = role === "enrollment_admin";

  const canManageUsers = isSuperAdmin || isItAdmin || isEnrollmentAdmin;

  const getPermissionMessage = () => {
    if (isSuperAdmin) {
      return {
        text: "✅ Full authority granted (Super Admin).",
        color: "bg-green-50 border-green-200 text-green-700",
      };
    } else if (isItAdmin || isEnrollmentAdmin) {
      return {
        text: "✅ Management authority granted (Students only).",
        color: "bg-green-50 border-green-200 text-green-700",
      };
    } else {
      return {
        text: "⚠️ View-only authority.",
        color: "bg-blue-50 border-blue-200 text-blue-700",
      };
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStudents(
        activeTab,
        page,
        limit,
        searchQuery,
      );
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

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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

  const handleRegister = async (data: any) => {
    try {
      setFormLoading(true);
      setError("");

      // Use createAccount which exists in api.ts
      const response = await adminApi.createAccount({
        ...data,
        role: registerRole,
      });

      if (response.success) {
        setShowRegisterForm(false);
        fetchStudents();
        fetchKpiStats();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete account: ${name}?`)) {
      try {
        const response = await adminApi.deleteAccount(id);
        if (response.success) {
          fetchStudents();
          fetchKpiStats();
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete account");
      }
    }
  };

  const handleEditClick = (account: StudentAccount) => {
    if (!isSuperAdmin && (account.role || "").toLowerCase() === "superadmin") {
      alert("You do not have permission to edit a Superadmin account.");
      return;
    }
    setEditingAccount(account);
    setShowEditModal(true);
  };

  const handleUpdateAccount = async (id: string, data: any) => {
    try {
      setFormLoading(true);
      const response = await adminApi.updateAccount(id, data);
      if (response.success) {
        setShowEditModal(false);
        setEditingAccount(null);
        fetchStudents();
        fetchKpiStats();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update account");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Manage Accounts
            </h1>
            <p className="text-gray-500 mt-1">
              {showRegisterForm
                ? `Register new ${registerRole}s`
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
          {(["student", "admin", "superadmin"] as const).map((tab) => {
            if ((tab === "superadmin" || tab === "admin") && !isSuperAdmin) return null;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setShowRegisterForm(false);
                }}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}s (
                {tab === "student"
                  ? kpiStats.totalStudents
                  : tab === "admin"
                    ? kpiStats.totalAdmins
                    : kpiStats.totalSuperAdmins}
                )
              </button>
            );
          })}
        </div>

        {!showRegisterForm ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              {canManageUsers ? (
                <button
                  onClick={() => {
                    setShowRegisterForm(true);
                    setRegisterRole(activeTab);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <span>+</span> Register New{" "}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </button>
              ) : (
                <div />
              )}

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

            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
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
              </div>
            </div>

            {activeTab === "student" ? (
              <StudentsTable
                students={students}
                onDelete={canManageUsers ? handleDeleteAccount : undefined}
                onEdit={canManageUsers ? handleEditClick : undefined}
                onManageEnrollments={(id, name) => {
                  setManagingEnrollmentStudent({ id, name });
                  setShowEnrollmentModal(true);
                }}
                showActions={true}
                currentUserRole={role}
                isLoading={loading}
              />
            ) : (
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
                    {students.map((student) => {
                      const isTargetSuper =
                        (student.role || "").toLowerCase() === "superadmin";
                      const canModifyThis = isSuperAdmin || !isTargetSuper;

                      return (
                        <tr
                          key={student.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          {canManageUsers && (
                            <td className="px-6 py-4">
                              {canModifyThis ? (
                                <button
                                  onClick={() => handleEditClick(student)}
                                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-semibold"
                                >
                                  Edit
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs italic">
                                  Restricted
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">
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
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {student.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                isTargetSuper
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {student.role}
                            </span>
                          </td>
                          {canManageUsers && (
                            <td className="px-6 py-4 text-right">
                              {canModifyThis ? (
                                <button
                                  onClick={() =>
                                    handleDeleteAccount(
                                      student.id,
                                      student.fullName,
                                    )
                                  }
                                  className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold"
                                >
                                  Delete
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs italic">
                                  Restricted
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded text-sm ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"}`}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded text-sm ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"}`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Register New {registerRole}
              </h2>
              <button
                onClick={() => setShowRegisterForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <StudentRegisterForm
              onSubmit={handleRegister}
              onCancel={() => setShowRegisterForm(false)}
              isLoading={formLoading}
              role={registerRole}
              error={error}
              onClearError={() => setError("")}
            />
          </div>
        )}
      </main>

      {editingAccount && (
        <AccountEditModal
          account={editingAccount}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAccount(null);
          }}
          onSave={handleUpdateAccount}
          isLoading={formLoading}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {managingEnrollmentStudent && (
        <StudentEnrollmentModal
          studentId={managingEnrollmentStudent.id}
          studentName={managingEnrollmentStudent.name}
          isOpen={showEnrollmentModal}
          onClose={() => {
            setShowEnrollmentModal(false);
            setManagingEnrollmentStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default AccountManagement;
