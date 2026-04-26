import React from "react";

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

interface StudentsTableProps {
  students: StudentAccount[];
  onDelete?: (id: string, name: string) => void;
  onEdit?: (student: StudentAccount) => void;
  onManageEnrollments?: (studentId: string, studentName: string) => void;
  showActions?: boolean;
  isLoading?: boolean;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  onDelete,
  onEdit,
  onManageEnrollments,
  showActions = true,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          {students.some(s => s.role === 'admin' || s.role === 'superadmin') ? 'Admin Accounts' : 'Student Accounts'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Total {students.some(s => s.role === 'admin' || s.role === 'superadmin') ? 'Admins' : 'Students'}: {students.length}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              {showActions && (onEdit || onManageEnrollments) && (
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-48">
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
                University ID
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Major
              </th>
              {students.some(s => s.role === 'student') && (
                <>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Level
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    GPA
                  </th>
                </>
              )}
              {students.some(s => s.role === 'admin' || s.role === 'superadmin') && (
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Status
                </th>
              )}
              {showActions && onDelete && (
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
                  colSpan={10}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="w-16 h-16 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium">
                      {students.some(s => s.role === 'admin' || s.role === 'superadmin') ? 'No admins found' : 'No students found'}
                    </p>
                    <p className="text-sm">
                      Register a new {students.some(s => s.role === 'admin' || s.role === 'superadmin') ? 'admin' : 'student'} using the form
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {showActions && (onEdit || onManageEnrollments) && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        {onManageEnrollments && student.role === 'student' && (
                          <button
                            onClick={() => onManageEnrollments(student.id, student.fullName)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            Courses
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(student)}
                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        student.role === 'admin' || student.role === 'superadmin'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {student.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.role === 'admin' || student.role === 'superadmin'
                            ? `${student.role} ${student.createdBy ? `• Created by ${student.createdBy.fullName || 'Unknown'}` : ''}`
                            : `${student.currentSemester} - Level ${student.level}`
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-mono text-gray-700">
                    {student.universityId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.major}
                  </td>
                  {student.role === 'student' && (
                    <>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Level {student.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            student.gpa && student.gpa >= 3.5
                              ? "bg-green-100 text-green-700"
                              : student.gpa && student.gpa >= 2.5
                                ? "bg-yellow-100 text-yellow-700"
                                : student.gpa && student.gpa > 0
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {student.gpa !== undefined && student.gpa !== null ? student.gpa.toFixed(2) : 'N/A'}
                        </span>
                      </td>
                    </>
                  )}
                  {(student.role === 'admin' || student.role === 'superadmin') && (
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  )}
                  {showActions && onDelete && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDelete(student.id, student.fullName)}
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

      {students.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {students.length} student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentsTable;
