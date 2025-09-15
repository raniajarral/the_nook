// Firestore Timestamp type guard
function isFirestoreTimestamp(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, User2 } from "lucide-react";
import { Link } from "react-router-dom";

type UserDetails = {
  displayName: string;
  email: string;
  username: string;
  createdAt: string | number | Date;
  photoURL?: string;
};

const Profile: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const handleEditClick = () => {
    setEditForm(userDetails);
    setEditing(true);
    setSaveError(null);
  };

  const handleEditChange = (field: keyof UserDetails, value: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditForm(userDetails);
    setSaveError(null);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setUploadingImage(true);
    try {
      const url = `https://api.cloudinary.com/v1_1/dtock2ymw/image/upload`;
      const formDataCloud = new FormData();
      formDataCloud.append("file", file);
      formDataCloud.append("upload_preset", "unsigned_test");
      const res = await fetch(url, {
        method: "POST",
        body: formDataCloud,
      });
      const data = await res.json();
      if (data.secure_url) {
        setEditForm(prev => prev ? { ...prev, photoURL: data.secure_url } : prev);
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch (err) {
      alert("Image upload failed. Please try again.");
    }
    setUploadingImage(false);
  };

  const handleEditSave = async () => {
    if (!user || !editForm) return;
    setSaving(true);
    setSaveError(null);
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...editForm,
        createdAt: userDetails?.createdAt // preserve original join date
      });
      setUserDetails(editForm);
      setEditing(false);
    } catch (err) {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserDetails({
            displayName: data.displayName ?? "-",
            email: data.email ?? "-",
            username: data.username ?? "-",
            createdAt: data.createdAt ?? "-",
            photoURL: data.photoURL ?? undefined,
          });
        } else {
          setUserDetails(null);
        }
      } else {
        setUserDetails(null);
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserDetails(null);
    navigate("/login");
  };

  if (!user || !userDetails) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#18181b] via-[#23232a] to-[#101014] dark px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative flex flex-col items-center justify-center mb-8">
          {/* Back Button */}
          <Link to="/" className="absolute left-0 top-0 flex items-center gap-1 text-white/60 hover:text-primary transition-colors">
            <span title="Back"><ArrowLeft className="w-5 h-5" /></span>
            <span className="text-sm font-medium">Back</span>
          </Link>
          {/* Edit Button */}
          <Button
            variant={editing ? "outline" : "ghost"}
            size="icon"
            className="absolute right-0 top-0 bg-white/90 hover:bg-white text-primary shadow-lg border border-gray-300"
            title={editing ? "Cancel" : "Edit Profile"}
            onClick={editing ? handleEditCancel : handleEditClick}
            style={{ transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
          >
            <span title="Edit profile"><Pencil className="w-6 h-6" strokeWidth={2.5} /></span>
          </Button>
        </div>
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex flex-col items-center w-fit mx-auto">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-4xl font-bold text-primary-foreground mb-2 shadow-xl border-4 border-[#18181b] overflow-visible relative">
              {((editing ? editForm?.photoURL : userDetails.photoURL)) ? (
                <img
                  src={editing ? editForm?.photoURL : userDetails.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <span>{(editing ? editForm?.displayName : userDetails.displayName)?.[0]?.toUpperCase() || "U"}</span>
              )}
              {editing && (
                <button
                  type="button"
                  className="absolute -bottom-3 -right-3 z-30 bg-white/90 text-primary rounded-full p-2 shadow-lg border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  title="Upload profile picture"
                  style={{ transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                >
                  {uploadingImage ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  ) : (
                    <Pencil className="w-5 h-5" strokeWidth={2.5} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </button>
              )}
            </div>
          </div>
          {editing ? (
            <>
              <Input className="text-3xl font-extrabold text-center mb-1 tracking-tight bg-[#18181b] text-white border border-[#35373e]" value={editForm?.displayName ?? ""} onChange={e => handleEditChange("displayName", e.target.value)} />
              <Input className="text-base text-center mb-1 bg-[#18181b] text-white border border-[#35373e]" value={editForm?.username ?? ""} onChange={e => handleEditChange("username", e.target.value)} />
            </>
          ) : (
            <>
              <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight drop-shadow">{userDetails.displayName}</h2>
              <span className="text-white/60 text-base">@{userDetails.username}</span>
            </>
          )}
        </div>
        <div className="divide-y divide-[#35373e] bg-transparent p-0">
          <div className="py-4">
            <span className="block text-xs text-white/40 uppercase font-semibold mb-1">Email</span>
            {editing ? (
              <Input value={editForm?.email ?? ""} disabled className="bg-[#18181b] text-white border border-[#35373e]" />
            ) : (
              <span className="block text-lg font-medium text-white break-all">{userDetails.email}</span>
            )}
          </div>
          <div className="py-4">
            <span className="block text-xs text-white/40 uppercase font-semibold mb-1">Joined</span>
            <span className="block text-lg font-medium text-white">
              {userDetails.createdAt && isFirestoreTimestamp(userDetails.createdAt)
                ? userDetails.createdAt.toDate().toLocaleDateString()
                : new Date(userDetails.createdAt).toLocaleDateString()}
            </span>
          </div>
          {editing && (
            <div className="flex flex-col gap-2 mb-2 pt-4">
              <Button onClick={handleEditSave} disabled={saving} className="w-full py-3 text-lg font-semibold rounded-xl shadow-md transition-all hover:scale-105 bg-primary text-white">
                {saving ? "Saving..." : "Save"}
              </Button>
              {saveError && <span className="text-red-500 text-sm text-center">{saveError}</span>}
            </div>
          )}
          <Button onClick={handleLogout} className="w-full py-3 text-lg font-semibold rounded-xl shadow-md transition-all hover:scale-105 bg-gray-700 text-white mt-4 border-0 hover:bg-gray-500">Logout</Button>
        </div>
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 1s ease; }
        .animate-slide-down { animation: slideDown 1s cubic-bezier(.4,2,.6,1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Profile;
