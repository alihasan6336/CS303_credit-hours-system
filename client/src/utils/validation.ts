/**
 * Validation utility functions
 */

/**
 * Validates email format using regex
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password - Password string to validate
 * @param minLength - Minimum required length (default: 6)
 * @returns object with isValid boolean and error message
 */
export const validatePassword = (
  password: string,
  minLength: number = 6,
): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }
  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }
  return { isValid: true };
};

/**
 * Validates if two passwords match
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns object with isValid boolean and error message
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string,
): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }
  return { isValid: true };
};

/**
 * Validates if a required field is filled
 * @param value - Field value to validate
 * @param fieldName - Name of the field for error message
 * @returns object with isValid boolean and error message
 */
export const validateRequired = (
  value: string,
  fieldName: string,
): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
};

/**
 * Validates if a number is valid and non-negative
 * @param value - String to validate as number
 * @param fieldName - Name of the field for error message
 * @returns object with isValid boolean and error message
 */
export const validateNumber = (
  value: string,
  fieldName: string,
): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (isNaN(Number(value)) || Number(value) < 0) {
    return { isValid: false, error: "Please enter a valid number" };
  }
  return { isValid: true };
};
