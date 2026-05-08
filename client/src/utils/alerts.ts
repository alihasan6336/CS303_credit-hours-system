import Swal, { type SweetAlertOptions, type SweetAlertResult } from "sweetalert2";

// System color palette matching the app's design
const COLORS = {
  primary: "#4f46e5", // Indigo-600
  success: "#22c55e", // Green-500
  error: "#ef4444", // Red-500
  warning: "#f97316", // Orange-500
  info: "#3b82f6", // Blue-500
  background: "#ffffff",
  text: "#1f2937", // Gray-800
};

// Common styling for toast alerts (no backdrop)
const toastOptions: Partial<SweetAlertOptions> = {
  customClass: {
    popup: "rounded-2xl shadow-2xl",
    title: "text-xl font-bold text-gray-800",
    htmlContainer: "text-gray-600 text-sm",
    confirmButton:
      "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95",
    cancelButton:
      "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95",
    denyButton:
      "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95",
  },
  buttonsStyling: false,
  allowOutsideClick: false,
  allowEscapeKey: true,
  backdrop: false,
};

// Common styling for modal alerts (no backdrop shadow)
const modalOptions: Partial<SweetAlertOptions> = {
  customClass: {
    popup: "rounded-2xl shadow-2xl",
    title: "text-xl font-bold text-gray-800",
    htmlContainer: "text-gray-600 text-sm",
    confirmButton:
      "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95",
    cancelButton:
      "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95",
    denyButton:
      "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95",
  },
  buttonsStyling: false,
  allowOutsideClick: false,
  allowEscapeKey: true,
  backdrop: false,
};

// Alert Types
type AlertType = "success" | "error" | "warning" | "info" | "done";

interface AlertConfig {
  title: string;
  message: string;
  type: AlertType;
  timer?: number;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Show a toast notification (bottom positioned, auto-dismiss)
 * Used for: success confirmations, completion messages
 */
const showToast = (
  title: string,
  message: string,
  icon: "success" | "error" | "warning" | "info",
  timer: number = 3000
): void => {
  Swal.fire({
    ...toastOptions,
    title,
    text: message,
    icon,
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    showCloseButton: true,
    background: COLORS.background,
    iconColor:
      icon === "success"
        ? COLORS.success
        : icon === "error"
        ? COLORS.error
        : icon === "warning"
        ? COLORS.warning
        : COLORS.info,
    didOpen: (toast: HTMLElement) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  } as SweetAlertOptions);
};

/**
 * Show a centered modal alert
 * Used for: errors, warnings, important confirmations, delete actions
 */
const showModal = (config: AlertConfig): Promise<SweetAlertResult> => {
  const {
    title,
    message,
    type,
    showCancel = false,
    confirmText = showCancel ? "Yes, proceed" : "OK",
    cancelText = "Cancel",
  } = config;

  const isDanger = type === "error" || type === "warning";

  return Swal.fire({
    ...modalOptions,
    title,
    text: message,
    icon:
      type === "done"
        ? "success"
        : type === "error"
        ? "error"
        : type === "warning"
        ? "warning"
        : type === "info"
        ? "info"
        : "success",
    position: "center",
    showCancelButton: showCancel,
    showConfirmButton: true,
    showDenyButton: false,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: isDanger ? COLORS.error : COLORS.primary,
    cancelButtonColor: "#6b7280", // Gray-500
    background: COLORS.background,
    iconColor: isDanger ? COLORS.error : type === "success" || type === "done" ? COLORS.success : COLORS.info,
    reverseButtons: true,
    focusConfirm: !showCancel,
    focusCancel: showCancel && isDanger,
  } as SweetAlertOptions);
};

/**
 * Success Alert - Bottom toast, auto-dismiss (3 seconds)
 * For: Actions completed successfully
 */
export const alertSuccess = (message: string, title: string = "Success"): void => {
  showToast(title, message, "success", 3000);
};

/**
 * Done/Complete Alert - Bottom toast, auto-dismiss (3 seconds)
 * For: Operations completed (similar to success)
 */
export const alertDone = (message: string, title: string = "Completed"): void => {
  showToast(title, message, "success", 3000);
};

/**
 * Error Alert - Center popup, requires dismissal
 * For: Errors, failures, something went wrong
 */
export const alertError = (message: string, title: string = "Error"): Promise<SweetAlertResult> => {
  return showModal({
    title,
    message,
    type: "error",
    showCancel: false,
    confirmText: "OK",
  });
};

/**
 * Warning Alert - Center popup, requires dismissal
 * For: Warnings that need attention but not confirmation
 */
export const alertWarning = (message: string, title: string = "Warning"): Promise<SweetAlertResult> => {
  return showModal({
    title,
    message,
    type: "warning",
    showCancel: false,
    confirmText: "OK",
  });
};

/**
 * Info Alert - Center popup, requires dismissal
 * For: Informational messages
 */
export const alertInfo = (message: string, title: string = "Information"): Promise<SweetAlertResult> => {
  return showModal({
    title,
    message,
    type: "info",
    showCancel: false,
    confirmText: "OK",
  });
};

/**
 * Confirm Action - Center popup with OK/Cancel
 * For: Actions that need confirmation (non-destructive)
 */
export const alertConfirm = (
  message: string,
  title: string = "Confirm Action",
  confirmText: string = "Yes, proceed",
  cancelText: string = "Cancel"
): Promise<boolean> => {
  return showModal({
    title,
    message,
    type: "info",
    showCancel: true,
    confirmText,
    cancelText,
  }).then((result) => result.isConfirmed);
};

/**
 * Danger Confirm - Center popup with OK/Cancel (red styling)
 * For: Delete actions, destructive operations
 */
export const alertDangerConfirm = (
  message: string,
  title: string = "Are you sure?",
  confirmText: string = "Yes, delete",
  cancelText: string = "Cancel"
): Promise<boolean> => {
  return showModal({
    title,
    message,
    type: "error",
    showCancel: true,
    confirmText,
    cancelText,
  }).then((result) => result.isConfirmed);
};

/**
 * API Error Handler - Auto-detect error type and show appropriate alert
 */
export const alertApiError = (error: any, defaultMessage: string = "An error occurred"): void => {
  const message = error?.message || error?.response?.data?.message || defaultMessage;
  alertError(message);
};

/**
 * Quick confirmation for delete operations
 * Returns true if confirmed, false otherwise
 */
export const confirmDelete = (
  itemName: string = "this item",
  extraWarning?: string
): Promise<boolean> => {
  const message = extraWarning
    ? `You are about to delete ${itemName}. ${extraWarning} This action cannot be undone.`
    : `You are about to delete ${itemName}. This action cannot be undone.`;

  return alertDangerConfirm(
    message,
    "Delete Confirmation",
    "Yes, delete",
    "Cancel"
  );
};

// Default export for convenience
export default {
  success: alertSuccess,
  done: alertDone,
  error: alertError,
  warning: alertWarning,
  info: alertInfo,
  confirm: alertConfirm,
  dangerConfirm: alertDangerConfirm,
  confirmDelete,
  apiError: alertApiError,
};
