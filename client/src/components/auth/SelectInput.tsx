import React from "react";
import type { LucideIcon } from "lucide-react";

interface SelectInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  options: string[];
  icon?: LucideIcon;
  compact?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  options,
  icon: Icon,
  compact = false,
}) => {
  const labelClass = compact
    ? "block text-xs font-medium text-gray-700 mb-1"
    : "block text-sm font-medium text-gray-700 mb-1.5";

  const selectClass = compact
    ? Icon
      ? "w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
      : "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
    : "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white";

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
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={selectClass}
        >
          <option value="">
            {placeholder || `Select ${label.toLowerCase()}`}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {touched && error && <p className={errorClass}>{error}</p>}
    </div>
  );
};

export default SelectInput;
