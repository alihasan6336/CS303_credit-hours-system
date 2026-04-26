import React, { useEffect, useState } from "react";
import StudentLayout from "../../layout/StudentLayout";
import AcademicHistory from "../../components/student/AcademicHistory";
import { gpaApi } from "../../utils/api";

const AcademicHistoryPage: React.FC = () => {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await gpaApi.getBreakdown();
        if (response.success && response.breakdown) {
          const formattedData = response.breakdown.map((item: any) => ({
            code: item.code,
            name: item.name,
            credits: item.credits,
            grade: item.grade || 0,
            gradePoints: item.gradePoints || 0,
            semester: item.semester || "Unknown",
            academicYear: item.level ? `Year ${item.level}` : "N/A",
          }));
          setHistoryData(formattedData);
        }
      } catch (error) {
        console.error("Failed to load academic history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <StudentLayout user={user}>
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Academic History</h1>
          <p className="text-gray-500 mt-1">View your complete academic transcript and past courses</p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <AcademicHistory historyData={historyData} />
        )}
      </main>
    </StudentLayout>
  );
};

export default AcademicHistoryPage;
