import React, { useState } from "react";

interface StudentFormData {
  fullName: string;
  email: string;
  password: string;
  repeatPassword?: string;
  universityId?: string;
  major?: string;
  level?: number;
  currentSemester?: string;
  completedCreditHours?: number;
  gpa?: number;
  phoneNumber?: string;
}

interface StudentRegisterFormProps {
  onSubmit: (data: StudentFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
  role?: "student" | "admin" | "superadmin";
}

const StudentRegisterForm: React.FC<StudentRegisterFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  onClearError,
  role = "student",
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: "",
    email: "",
    password: "",
    repeatPassword: "",
    universityId: "",
    major: "Computer Science",
    level: 1,
    currentSemester: "Fall",
    completedCreditHours: 0,
    phoneNumber: "",
  });

  // Calculate GPA based on completed credit hours (simulated based on academic progress)
  const calculateGPA = (creditHours: number): number => {
    if (creditHours === 0) return 0;
    // Simulate GPA based on progress: more credits = higher assumed GPA (max 4.0)
    // Formula: Base 2.0 + (creditHours / 150) * 2.0, capped at 4.0
    const calculatedGPA = 2.0 + (creditHours / 150) * 2.0;
    return Math.min(4.0, Math.max(0, Number(calculatedGPA.toFixed(2))));
  };

  const gpa = calculateGPA(formData.completedCreditHours || 0);

  const [passwordError, setPasswordError] = useState("");

  const majors = [
    "Computer Science",
    "Software Engineering",
    "Information Technology",
    "Computer Engineering",
    "Cybersecurity",
    "Data Science",
  ];

  const getTitleAndLabel = () => {
    switch (role) {
      case "admin":
        return { title: "Create Admin Account", buttonText: "Create Admin" };
      case "superadmin":
        return {
          title: "Create Super Admin Account",
          buttonText: "Create Super Admin",
        };
      default:
        return {
          title: "Register New Student",
          buttonText: "Register Student",
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (formData.password !== formData.repeatPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (onClearError) onClearError();

    await onSubmit({ ...formData, gpa });

    setFormData({
      fullName: "",
      email: "",
      password: "",
      repeatPassword: "",
      universityId: "",
      major: "Computer Science",
      level: 1,
      currentSemester: "Fall",
      completedCreditHours: 0,
      phoneNumber: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "completedCreditHours" || name === "level" ? parseInt(value) || 0 : value,
    }));
  };

  const { title, buttonText } = getTitleAndLabel();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name and Email Row */}
        {role !== "superadmin" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ahmed"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="user@uni.edu"
                required
              />
            </div>
          </div>
        )}

        {role === "superadmin" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ahmed"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="user@uni.edu"
                required
              />
            </div>
          </>
        )}

        {/* Password and Repeat Password Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repeat Password
            </label>
            <input
              type="password"
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                passwordError ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="Confirm password"
              required
              minLength={6}
            />
            {passwordError && (
              <p className="text-sm text-red-600 mt-1">{passwordError}</p>
            )}
          </div>
        </div>

        {/* Student-specific fields */}
        {role === "student" && (
          <>
            {/* University ID and Major Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University ID
                </label>
                <input
                  type="text"
                  name="universityId"
                  value={formData.universityId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="2021-CS-0342"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Major
                </label>
                <select
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {majors.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year, Semester, Credit Hours, GPA Row */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  name="currentSemester"
                  value={formData.currentSemester}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Hours
                </label>
                <input
                  type="number"
                  name="completedCreditHours"
                  value={formData.completedCreditHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max="200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GPA (Auto)
                </label>
                <div className="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-lg text-gray-700">
                  {gpa.toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Admin specific fields */}
        {(role === "admin" || role === "superadmin") && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                University ID
              </label>
              <input
                type="text"
                name="universityId"
                value={formData.universityId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ADMIN-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Major
              </label>
              <select
                name="major"
                value={formData.major}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {majors.map((major) => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+1234567890"
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-5 py-2.5 bg-indigo-600 text-white text-base font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
};

export default StudentRegisterForm;
