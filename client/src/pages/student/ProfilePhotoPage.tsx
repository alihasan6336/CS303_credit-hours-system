import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../layout/StudentLayout";
import { photoApi } from "../../utils/api";
import { alertSuccess, alertError, confirmDelete } from "../../utils/alerts";
import { Camera, Trash2, Upload, ArrowLeft, User, Loader2 } from "lucide-react";

const ProfilePhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem("student") || "{}");

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
          localStorage.setItem("student", JSON.stringify(user));
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
        alertSuccess("Photo uploaded successfully!");
        // Update localStorage so sidebar shows new photo
        user.photoUrl = res.photoUrl;
        localStorage.setItem("student", JSON.stringify(user));
      } else {
        alertError(res.message || "Upload failed");
      }
    } catch (err: any) {
      alertError(err.message || "An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete("your profile photo");
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await photoApi.deletePhoto();
      if (res.success) {
        setPhotoUrl("");
        alertSuccess("Photo removed successfully");
        user.photoUrl = "";
        localStorage.setItem("student", JSON.stringify(user));
      } else {
        alertError(res.message || "Delete failed");
      }
    } catch (err: any) {
      alertError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.fullName || "Student";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <StudentLayout user={user}>
      <div className="p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/home")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Profile Photo</h1>
        </div>

        {/* Photo Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
            </div>

            <p className="text-gray-600 text-sm mb-6 text-center max-w-xs">
              Upload a profile photo so your instructors and peers can recognize you.
            </p>

            {/* File input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Photo
                  </>
                )}
              </button>

              {photoUrl && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors border border-red-100 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm w-full max-w-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm w-full max-w-sm text-center">
                {success}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={16} className="text-indigo-500" />
              Photo Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Square photo works best (it will be cropped to a circle).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Maximum file size: 5 MB.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Supported formats: JPG, PNG, WEBP.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProfilePhotoPage;
