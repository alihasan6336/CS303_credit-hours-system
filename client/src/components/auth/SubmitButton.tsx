import React from "react";

interface SubmitButtonProps {
  disabled: boolean;
  children: React.ReactNode;
  compact?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  disabled,
  children,
  compact = false,
}) => {
  const buttonClass = compact
    ? "w-full py-2.5 px-4 rounded-lg font-semibold text-white shadow-md transition-all duration-200"
    : "w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md transition-all duration-200";

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`${buttonClass} ${
        !disabled
          ? "bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          : "bg-gray-400 cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  );
};

export default SubmitButton;
