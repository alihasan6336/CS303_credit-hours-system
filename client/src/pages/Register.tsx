import React, { useState, useMemo } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  BookOpen,
  Phone,
} from "lucide-react";
import CompactAuthLayout from "../components/auth/CompactAuthLayout";
import FormInput from "../components/auth/FormInput";
import PasswordInput from "../components/auth/PasswordInput";
import SelectInput from "../components/auth/SelectInput";
import SubmitButton from "../components/auth/SubmitButton";
import { validateEmail } from "../utils/validation";
import { authApi } from "../utils/api";

interface FormData {
  fullName: string;
  universityId: string;
  email: string;
  password: string;
  confirmPassword: string;
  major: string;
  academicYear: string;
  currentSemester: string;
  completedCreditHours: string;
  phoneNumber: string;
  acceptTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  universityId?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  major?: string;
  academicYear?: string;
  currentSemester?: string;
  completedCreditHours?: string;
  acceptTerms?: string;
  form?: string;
}

const Register: React.FC = () => {
  // Redirect already logged-in users to home
  if (localStorage.getItem("authToken")) {
    return <Navigate to="/home" replace />;
  }

  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    universityId: "",
    email: "",
    password: "",
    confirmPassword: "",
    major: "",
    academicYear: "",
    currentSemester: "",
    completedCreditHours: "",
    phoneNumber: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const academicYears = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const semesters = ["Fall", "Spring", "Summer"];

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.universityId.trim()) {
      newErrors.universityId = "University ID is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.major) {
      newErrors.major = "Please select your major";
    }

    if (!formData.academicYear) {
      newErrors.academicYear = "Please select your academic year";
    }

    if (!formData.currentSemester) {
      newErrors.currentSemester = "Please select the current semester";
    }

    if (!formData.completedCreditHours.trim()) {
      newErrors.completedCreditHours = "Completed credit hours is required";
    } else if (
      isNaN(Number(formData.completedCreditHours)) ||
      Number(formData.completedCreditHours) < 0
    ) {
      newErrors.completedCreditHours = "Please enter a valid number";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur
    const newErrors = validateForm();
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => {
        acc[key] = true;
        return acc;
      },
      {} as { [key: string]: boolean },
    );
    setTouched(allTouched);

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await authApi.register({
        fullName: formData.fullName,
        universityId: formData.universityId,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        major: formData.major,
        academicYear: formData.academicYear,
        currentSemester: formData.currentSemester,
        completedCreditHours: formData.completedCreditHours,
        phoneNumber: formData.phoneNumber || undefined,
        acceptTerms: formData.acceptTerms,
      });

      // Option 1: auto-login after registration
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("student", JSON.stringify(response.student));

      navigate("/home");
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        form: error?.message || "Failed to create account. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = useMemo(() => {
    return (
      Object.keys(errors).length === 0 &&
      formData.fullName &&
      formData.universityId &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.major &&
      formData.academicYear &&
      formData.currentSemester &&
      formData.completedCreditHours &&
      formData.acceptTerms
    );
  }, [errors, formData]);

  return (
    <CompactAuthLayout
      title={
        <>
          Credit Hours
          <br />
          Registration System
        </>
      }
      subtitle="Manage your academic journey efficiently and plan your courses with ease."
      features={[
        "Easy course registration",
        "Track your academic progress",
        "Secure and reliable platform",
      ]}
      mobileTitle="Credit Hours Registration"
      formTitle="Create Student Account"
      formSubtitle="Join thousands of students managing their academic journey"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {errors.form && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {errors.form}
          </p>
        )}
        {/* Full Name & University ID - Two Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            label="Full Name"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.fullName}
            touched={touched.fullName}
            required
            placeholder="Full name"
            icon={User}
            compact
          />

          <FormInput
            label="University ID"
            name="universityId"
            type="text"
            value={formData.universityId}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.universityId}
            touched={touched.universityId}
            required
            placeholder="University ID"
            icon={BookOpen}
            compact
          />
        </div>

        {/* Email */}
        <FormInput
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          touched={touched.email}
          required
          placeholder="your.email@university.edu"
          icon={Mail}
          compact
        />

        {/* Password & Confirm Password - Two Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            touched={touched.password}
            required
            placeholder="6+ chars"
            compact
          />

          <PasswordInput
            label="Confirm"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirmPassword}
            touched={touched.confirmPassword}
            required
            placeholder="Re-enter"
            compact
          />
        </div>

        {/* Two Column Layout for Major and Academic Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectInput
            label="Major"
            name="major"
            value={formData.major}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.major}
            touched={touched.major}
            required
            placeholder="Select major"
            options={majors}
            icon={GraduationCap}
            compact
          />

          <SelectInput
            label="Year"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.academicYear}
            touched={touched.academicYear}
            required
            placeholder="Select year"
            options={academicYears}
            icon={Calendar}
            compact
          />
        </div>

        {/* Three Column Layout for Semester, Credit Hours, Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectInput
            label="Semester"
            name="currentSemester"
            value={formData.currentSemester}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.currentSemester}
            touched={touched.currentSemester}
            required
            placeholder="Semester"
            options={semesters}
            compact
          />

          <FormInput
            label="Credits"
            name="completedCreditHours"
            type="number"
            value={formData.completedCreditHours}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.completedCreditHours}
            touched={touched.completedCreditHours}
            required
            placeholder="0"
            compact
          />

          <FormInput
            label={
              <>
                Phone <span className="text-gray-400 text-xs">(Opt)</span>
              </>
            }
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Phone"
            icon={Phone}
            compact
          />
        </div>

        {/* Accept Terms */}
        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <label
              htmlFor="acceptTerms"
              className="ml-2 block text-xs text-gray-700"
            >
              I accept the{" "}
              <a
                href="#"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Terms and Conditions
              </a>{" "}
              <span className="text-red-500">*</span>
            </label>
          </div>
          {touched.acceptTerms && errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-600">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <SubmitButton disabled={!isFormValid || isSubmitting} compact>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </SubmitButton>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </CompactAuthLayout>
  );
};

export default Register;
