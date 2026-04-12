import React from "react";
import { groupCoursesBySemester } from "../../utils/gpa";

interface HistoryItem {
  code: string;
  name: string;
  credits: number;
  grade: number; // Percentage
  gradePoints: number; // 4.0 scale
  semester: string;
  academicYear: string;
}

interface Props {
  historyData: HistoryItem[];
}

const AcademicHistory: React.FC<Props> = ({ historyData }) => {
  const groupedHistory = groupCoursesBySemester(historyData);

  // Helper to map 4.0 scale to Letter Grade for UI
  const getLetterGrade = (points: number) => {
    if (points >= 4.0) return "A";
    if (points >= 3.7) return "A-";
    if (points >= 3.3) return "B+";
    if (points >= 3.0) return "B";
    if (points >= 2.7) return "B-";
    if (points >= 2.3) return "C+";
    if (points >= 2.0) return "C";
    if (points >= 1.7) return "C-";
    if (points >= 1.0) return "D";
    return "F";
  };

  if (!historyData || historyData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 mt-6 text-center text-gray-500">
        <p className="text-lg">No academic history found yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Academic History</h3>

      <div className="space-y-8">
        {groupedHistory.map((term, index) => {
          let termCredits = 0;
          let termPoints = 0;

          term.courses.forEach((c) => {
            termCredits += c.credits;
            termPoints += c.credits * c.gradePoints;
          });

          const termGpa = termCredits > 0 ? (termPoints / termCredits).toFixed(2) : "0.00";

          return (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-bold text-gray-800 text-lg">{term.semester} {term.academicYear}</h4>
                <div className="flex gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Credits: </span>
                    <span className="font-bold text-gray-800">{termCredits}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Term GPA: </span>
                    <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">{termGpa}</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead>
                    <tr className="bg-white border-b border-gray-100 text-gray-600 text-left">
                      <th className="px-6 py-4 font-bold">Course Code</th>
                      <th className="px-6 py-4 font-bold">Course Name</th>
                      <th className="px-6 py-4 font-bold">Credits</th>
                      <th className="px-6 py-4 font-bold">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {term.courses.map((course, idx) => {
                      const letterGrade = getLetterGrade(course.gradePoints);
                      return (
                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono text-indigo-600 font-black">{course.code}</td>
                          <td className="px-6 py-4 text-gray-800 font-bold">{course.name}</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{course.credits}</td>
                          <td className="px-6 py-4">
                            <span className={`font-black text-lg ${
                              letterGrade.startsWith('A') ? 'text-green-600' :
                              letterGrade.startsWith('B') ? 'text-blue-600' :
                              letterGrade.startsWith('C') ? 'text-orange-500' :
                              'text-red-600'
                            }`}>
                              {letterGrade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AcademicHistory;
