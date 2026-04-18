import React, { useEffect, useState } from "react";
import StudentLayout from "../../layout/StudentLayout";
import WhatIfGpaCalculator from "../../components/student/WhatIfGpaCalculator";

const GpaCalculatorPage: React.FC = () => {
  const [studentData, setStudentData] = useState<{ gpa: number; completedCreditHours: number } | null>(null);

  useEffect(() => {
    // Attempt to load from localStorage as in StudentDashboard
    const studentStr = localStorage.getItem("student");
    if (studentStr) {
      try {
        const student = JSON.parse(studentStr);
        setStudentData({
          gpa: student.gpa || 0,
          completedCreditHours: student.completedCreditHours || 0,
        });
      } catch (e) {
        console.error("Failed to parse student data", e);
      }
    } else {
      // Fallback dummy data if no local storage found
      setStudentData({
        gpa: 3.75,
        completedCreditHours: 87,
      });
    }
  }, []);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  return (
    <StudentLayout user={user}>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GPA Calculator</h1>
          <p className="text-gray-500 mt-2">
            Estimate your future GPA by adding expected grades.
          </p>
        </header>

        {studentData ? (
          <WhatIfGpaCalculator
            currentGpa={studentData.gpa}
            completedCredits={studentData.completedCreditHours}
          />
        ) : (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default GpaCalculatorPage;