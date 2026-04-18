import React from "react";
import type { LucideIcon } from "lucide-react";

interface FormInputProps {
  label: React.ReactNode;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
  compact?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  icon: Icon,
  compact = false,
}) => {
  const labelClass = compact
    ? "block text-xs font-medium text-gray-700 mb-1"
    : "block text-sm font-medium text-gray-700 mb-1.5";

  const inputClass = compact
    ? "w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
    : "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200";

  const iconClass = compact
    ? "absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
    : "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400";

  const errorClass = compact
    ? "mt-1 text-xs text-red-600"
    : "mt-1.5 text-sm text-red-600";

  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className={iconClass} />}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={
            Icon
              ? inputClass
              : inputClass.replace("pl-10", "pl-4").replace("pl-9", "pl-3")
          }
          placeholder={placeholder}
        />
      </div>
      {touched && error && <p className={errorClass}>{error}</p>}
    </div>
  );
};

export default FormInput;
