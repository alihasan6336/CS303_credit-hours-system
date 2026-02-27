import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  compact?: boolean;
  rightElement?: React.ReactNode;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  compact = false,
  rightElement,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const labelClass = compact
    ? "block text-xs font-medium text-gray-700 mb-1"
    : "block text-sm font-medium text-gray-700 mb-1.5";

  const inputClass = compact
    ? "w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
    : "w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200";

  const iconClass = compact
    ? "absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
    : "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400";

  const toggleClass = compact
    ? "absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    : "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors";

  const errorClass = compact
    ? "mt-1 text-xs text-red-600"
    : "mt-1.5 text-sm text-red-600";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={name} className={labelClass}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {rightElement}
      </div>
      <div className="relative">
        <Lock className={iconClass} />
        <input
          type={showPassword ? "text" : "password"}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={inputClass}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={toggleClass}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className={compact ? "w-4 h-4" : "w-5 h-5"} />
          ) : (
            <Eye className={compact ? "w-4 h-4" : "w-5 h-5"} />
          )}
        </button>
      </div>
      {touched && error && <p className={errorClass}>{error}</p>}
    </div>
  );
};

export default PasswordInput;
