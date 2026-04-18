import React from "react";
import { GraduationCap, CheckCircle2 } from "lucide-react";

interface AuthLayoutProps {
  title: React.ReactNode;
  subtitle: string;
  features: string[];
  children: React.ReactNode;
  mobileTitle?: string;
  formTitle: string;
  formSubtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  features,
  children,
  mobileTitle,
  formTitle,
  formSubtitle,
}) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-600 via-blue-600 to-blue-500 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start px-16 py-12 text-white">
          <div className="mb-8">
            <GraduationCap className="w-16 h-16 mb-6" />
            <h1 className="text-5xl font-bold mb-4 leading-tight">{title}</h1>
            <p className="text-xl text-blue-100 max-w-md">{subtitle}</p>
          </div>

          <div className="space-y-4 mt-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <GraduationCap className="w-10 h-10 mx-auto text-indigo-600 mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              {mobileTitle || "Credit Hours System"}
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{formTitle}</h2>
              <p className="mt-2 text-sm text-gray-600">{formSubtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
