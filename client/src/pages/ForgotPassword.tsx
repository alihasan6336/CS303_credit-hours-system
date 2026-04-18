import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import FormInput from "../components/auth/FormInput";
import SubmitButton from "../components/auth/SubmitButton";
import { validateEmail } from "../utils/validation";
import { authApi } from "../utils/api";

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  form?: string;
}

const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
      await authApi.forgotPassword({ email: formData.email });
      setIsSubmitted(true);
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        form:
          error?.message ||
          "Failed to request password reset. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = useMemo(() => {
    return Object.keys(errors).length === 0 && formData.email;
  }, [errors, formData.email]);

  return (
    <AuthLayout
      title={
        <>
          Reset Your
          <br />
          Password
        </>
      }
      subtitle="Don't worry! It happens to the best of us. Enter your email and we'll send you reset instructions."
      features={[
        "Quick and secure process",
        "Email verification required",
        "Back in your account in minutes",
      ]}
      mobileTitle="Credit Hours System"
      formTitle={!isSubmitted ? "Forgot Password?" : "Check Your Email"}
      formSubtitle={
        !isSubmitted ? "No worries, we'll send you reset instructions" : ""
      }
    >
      {!isSubmitted ? (
        <>
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.form && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {errors.form}
              </p>
            )}
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
              placeholder="your.email@university.edu"
              icon={Mail}
            />

            {/* Submit Button */}
            <SubmitButton disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </SubmitButton>
          </form>

          <div className="mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Success State */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-6">
              We've sent password reset instructions to
              <span className="block font-medium text-gray-900 mt-1">
                {formData.email}
              </span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="font-semibold underline hover:text-blue-900"
                >
                  try another email address
                </button>
              </p>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </>
      )}

      {/* Help Text */}
      {!isSubmitted && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
