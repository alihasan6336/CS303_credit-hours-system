import React, { useEffect, useState } from "react";
import StudentLayout from "../../layout/StudentLayout";
import WhatIfGpaCalculator from "../../components/student/WhatIfGpaCalculator";
import { gpaApi } from "../../utils/api";

const GpaCalculatorPage: React.FC = () => {
  const [studentData, setStudentData] = useState<{ gpa: number; completedCreditHours: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGpaData = async () => {
      try {
        const response = await gpaApi.getBreakdown();
        if (response.success) {
          setStudentData({
            gpa: response.gpa || 0,
            completedCreditHours: response.totalCredits || 0,
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch GPA data:", err);
        setError(err.message || "Failed to load GPA data");
      } finally {
        setLoading(false);
      }
    };

    fetchGpaData();
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : studentData ? (
          <WhatIfGpaCalculator
            currentGpa={studentData.gpa}
            completedCredits={studentData.completedCreditHours}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No GPA data available
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default GpaCalculatorPage;