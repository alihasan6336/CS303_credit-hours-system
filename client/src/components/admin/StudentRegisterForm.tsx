import React, { useState } from "react";

interface StudentFormData {
  fullName: string;
  email: string;
  password: string;
  universityId: string;
  major: string;
  academicYear: string;
  currentSemester: string;
  completedCreditHours: number;
}

interface StudentRegisterFormProps {
  onSubmit: (data: StudentFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

const StudentRegisterForm: React.FC<StudentRegisterFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: "",
    email: "",
    password: "",
    universityId: "",
    major: "Computer Science",
    academicYear: "1st Year",
    currentSemester: "Fall",
    completedCreditHours: 0,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onClearError) onClearError();
    await onSubmit(formData);
    // Reset form on success
    setFormData({
      fullName: "",
      email: "",
      password: "",
      universityId: "",
      major: "Computer Science",
      academicYear: "1st Year",
      currentSemester: "Fall",
      completedCreditHours: 0,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "completedCreditHours" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Register New Student
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Add a new student account to the system
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="e.g., Ahmed Al-Rashidi"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="student@university.edu"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />
        </div>

        {/* University ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            University ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="universityId"
            value={formData.universityId}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="e.g., 2021-CS-0342"
            required
          />
        </div>

        {/* Major */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Major <span className="text-red-500">*</span>
          </label>
          <select
            name="major"
            value={formData.major}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            required
          >
            {majors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year and Semester Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Semester <span className="text-red-500">*</span>
            </label>
            <select
              name="currentSemester"
              value={formData.currentSemester}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
            >
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
        </div>

        {/* Completed Credit Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Completed Credit Hours
          </label>
          <input
            type="number"
            name="completedCreditHours"
            value={formData.completedCreditHours}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="0"
            min="0"
            max="200"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? "Creating Account..." : "Create Student Account"}
        </button>
      </form>
    </div>
  );
};

export default StudentRegisterForm;
