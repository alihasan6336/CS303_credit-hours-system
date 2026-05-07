import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { photoApi } from "../../utils/api";
import { Camera, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { getStoredAdminUser } from "../../utils/adminAccess";

const AdminProfilePhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const user = getStoredAdminUser();

  useEffect(() => {
    fetchPhoto();
  }, []);

  const fetchPhoto = async () => {
    setLoading(true);
    try {
      const res = await photoApi.getMyPhoto();
      if (res.success) {
        setPhotoUrl(res.photoUrl);
        // Update localStorage so sidebar updates too
        if (res.photoUrl) {
          user.photoUrl = res.photoUrl;
          localStorage.setItem("adminUser", JSON.stringify(user));
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch photo", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await photoApi.upload(file);
      if (res.success) {
        setPhotoUrl(res.photoUrl);
        setSuccess("Photo uploaded successfully!");
        // Update localStorage so sidebar shows new photo
        user.photoUrl = res.photoUrl;
        localStorage.setItem("adminUser", JSON.stringify(user));
      } else {
        setError(res.message || "Upload failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?"))
      return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await photoApi.deletePhoto();
      if (res.success) {
        setPhotoUrl("");
        setSuccess("Photo removed successfully.");
        user.photoUrl = "";
        localStorage.setItem("adminUser", JSON.stringify(user));
      } else {
        setError(res.message || "Delete failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.fullName || "Admin";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Admin Profile Photo
            </h1>
          </div>

          {/* Photo Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center">
              {/* Avatar Preview */}
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-100 flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Camera button overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                  title="Upload new photo"
                >
                  {uploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {loading && (
                <p className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading
                  photo...
                </p>
              )}

              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {displayName}
              </h2>
              <p className="text-gray-500 mb-8">{user.email}</p>

              {/* Status Messages */}
              {error && (
                <div className="w-full mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="w-full mb-6 p-4 bg-green-50 text-green-600 border border-green-100 rounded-xl text-sm text-center">
                  {success}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  <Camera size={18} />
                  {photoUrl ? "Change Photo" : "Upload Photo"}
                </button>

                {photoUrl && (
                  <button
                    onClick={handleDelete}
                    disabled={loading || uploading}
                    className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePhotoPage;
