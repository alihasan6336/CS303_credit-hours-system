import React, { useState } from "react";
import { getGradePoints } from "../../utils/gpa";

interface Props {
  currentGpa: number;
  completedCredits: number;
}

interface ExpectedCourse {
  id: string;
  name: string;
  credits: number;
  expectedGrade: string;
}

const WhatIfGpaCalculator: React.FC<Props> = ({
  currentGpa,
  completedCredits,
}) => {
  const [courses, setCourses] = useState<ExpectedCourse[]>([
    { id: "1", name: "Course 1", credits: 3, expectedGrade: "A" },
  ]);

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        id: Math.random().toString(),
        name: `Course ${courses.length + 1}`,
        credits: 3,
        expectedGrade: "A",
      },
    ]);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof ExpectedCourse, value: any) => {
    setCourses(
      courses.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const calculateNewGpa = () => {
    const currentTotalPoints = currentGpa * completedCredits;
    let expectedTotalPoints = 0;
    let expectedNewCredits = 0;

    courses.forEach((c) => {
      expectedNewCredits += c.credits;
      expectedTotalPoints += c.credits * getGradePoints(c.expectedGrade);
    });

    const newTotalCredits = completedCredits + expectedNewCredits;
    if (newTotalCredits === 0) return "0.00";

    const newGpa =
      (currentTotalPoints + expectedTotalPoints) / newTotalCredits;
    return newGpa.toFixed(2);
  };

  const newGpaVal = calculateNewGpa();
  const diff = parseFloat(newGpaVal) - currentGpa;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">What-If GPA Calculator</h3>
      <p className="text-gray-500 mb-6 font-medium">
        Enter expected grades for your current or future courses to see how they affect your GPA.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <input
                  type="text"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                  className="px-3 py-2 border rounded-md flex-1 text-sm bg-white font-medium"
                  placeholder="Course Name"
                />
                <input
                  type="number"
                  value={course.credits}
                  onChange={(e) => updateCourse(course.id, "credits", Number(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-md text-sm bg-white font-bold"
                  min="1"
                  max="6"
                  placeholder="Credits"
                />
                <select
                  value={course.expectedGrade}
                  onChange={(e) => updateCourse(course.id, "expectedGrade", e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-white font-bold text-indigo-600"
                >
                  <option value="A+">A+ (4.0)</option>
                  <option value="A">A (4.0)</option>
                  <option value="A-">A- (3.7)</option>
                  <option value="B+">B+ (3.3)</option>
                  <option value="B">B (3.0)</option>
                  <option value="B-">B- (2.7)</option>
                  <option value="C+">C+ (2.3)</option>
                  <option value="C">C (2.0)</option>
                  <option value="C-">C- (1.7)</option>
                  <option value="D+">D+ (1.3)</option>
                  <option value="D">D (1.0)</option>
                  <option value="F">F (0.0)</option>
                </select>
                <button
                  onClick={() => removeCourse(course.id)}
                  className="text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addCourse}
            className="mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 w-full rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors font-semibold"
          >
            + Add Another Course
          </button>
        </div>

        <div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 h-full flex flex-col justify-center items-center text-center">
            <p className="text-gray-600 font-bold mb-1">Your Projected GPA</p>
            <h2 className="text-5xl font-black text-indigo-900 mb-2">
              {newGpaVal}
            </h2>
            <div className={`px-3 py-1 rounded-full text-base font-black flex items-center gap-1 ${
              diff > 0 ? "bg-green-100 text-green-700" : diff < 0 ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
            }`}>
              {diff > 0 ? "↑" : diff < 0 ? "↓" : "−"} {Math.abs(diff).toFixed(2)} Change
            </div>
            
            <div className="w-full h-px bg-indigo-200 my-6"></div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Current GPA</p>
                <p className="font-black text-gray-800 text-lg">{currentGpa.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Total Credits</p>
                <p className="font-black text-gray-800 text-lg">
                  {completedCredits} + {courses.reduce((sum, c) => sum + c.credits, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfGpaCalculator;
