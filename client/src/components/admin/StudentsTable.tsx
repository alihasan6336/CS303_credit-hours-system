import React from "react";

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

interface StudentsTableProps {
  students: StudentAccount[];
  onDelete?: (id: string, name: string) => void;
  showActions?: boolean;
  isLoading?: boolean;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  onDelete,
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
        <h2 className="text-xl font-bold text-gray-800">Student Accounts</h2>
        <p className="text-sm text-gray-600 mt-1">
          Total Students: {students.length}
        </p>
      </div>

      <div className="overflow-x-auto">
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
                University ID
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Major
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Level
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                GPA
              </th>
              {showActions && onDelete && (
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={showActions ? 7 : 6}
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
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm">
                      Register a new student using the form
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
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.currentSemester} - {student.academicYear}
                        </div>
                      </div>
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
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Level {student.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.gpa >= 3.5
                          ? "bg-green-100 text-green-700"
                          : student.gpa >= 2.5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {student.gpa.toFixed(2)}
                    </span>
                  </td>
                  {showActions && onDelete && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onDelete(student.id, student.fullName)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
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
