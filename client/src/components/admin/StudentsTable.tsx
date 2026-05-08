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
  photoUrl?: string;
}

interface StudentsTableProps {
  students: StudentAccount[];
  onDelete?: (id: string, name: string) => void;
  onEdit?: (student: StudentAccount) => void;
  onManageEnrollments?: (studentId: string, studentName: string) => void;
  showActions?: boolean;
  isLoading?: boolean;
  currentUserRole?: string;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  onDelete,
  onEdit,
  onManageEnrollments,
  showActions = true,
  isLoading = false,
  currentUserRole = "admin",
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              {showActions && (onEdit || onManageEnrollments) && (
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Manage
                </th>
              )}
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Student
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Email
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                ID
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Major
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Academic Info
              </th>
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
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const isTargetSuper = (student.role || "").toLowerCase() === 'superadmin';
                const canModify = currentUserRole?.toLowerCase() === 'superadmin' || !isTargetSuper;

                return (
                  <tr
                    key={student.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        {onManageEnrollments && (student.role || "").toLowerCase() === 'student' && (
                          <button
                            onClick={() => {
                              console.log("Manage Enrollments clicked for:", student);
                              const studentId = student.id || (student as any)._id;
                              onManageEnrollments(studentId, student.fullName);
                            }}
                            className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            Courses
                          </button>
                        )}
                        {onEdit && (
                          canModify ? (
                            <button
                              onClick={() => {
                                console.log("Edit clicked for:", student);
                                onEdit(student);
                              }}
                              className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                              Edit
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Restricted</span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                            {student.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {student.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {student.universityId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.major}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Level {student.level} • GPA {student.gpa?.toFixed(2) || "0.00"}
                    </td>
                    {showActions && onDelete && (
                      <td className="px-6 py-4 text-right">
                        {canModify ? (
                          <button
                            onClick={() => onDelete(student.id, student.fullName)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Restricted</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
