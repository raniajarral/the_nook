// Navigation markup will be handled directly in this file
import { BookOpen, Bookmark, User2, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Link as LinkIcon, X } from "lucide-react";
import fallbackImg from "../assets/article-placeholder-1.jpg";
import { Link, useNavigate } from "react-router-dom";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "../lib/categories";
import { Switch } from "@/components/ui/switch";
import { auth, db } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const Upload = () => {
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: "",
    originalAuthor: "",
    tags: [] as string[],
    image: "",
    categories: [] as string[],
    isPublic: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState(""); // for tag input field
  const [categoryInput, setCategoryInput] = useState(""); // for category input field
  const navigate = useNavigate();

  const FALLBACK_IMAGE = fallbackImg;

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const { doc, getDoc } = await import("firebase/firestore");
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role === "admin" ? "admin" : "user");
      }
    };
    fetchUserRole();
  }, []);

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Cloudinary upload logic
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
        setFormData(prev => ({ ...prev, image: data.secure_url }));
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch (err) {
      alert("Image upload failed. Please try again.");
    }
    setUploadingImage(false);
  };

  // Add category if not duplicate and max 5
  const addCategory = (cat: string) => {
    const cleanCat = cat.trim();
    if (
      cleanCat &&
      !formData.categories.some(c => c.toLowerCase() === cleanCat.toLowerCase()) &&
      formData.categories.length < 5
    ) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, cleanCat],
      }));
    }
  };

  // Remove category by index
  const removeCategory = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== idx),
    }));
  };

  // Add tag if not empty, not duplicate, and max 5
  const addTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (
      cleanTag &&
      !formData.tags.some(t => t.toLowerCase() === cleanTag.toLowerCase()) &&
      formData.tags.length < 5
    ) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, cleanTag],
      }));
    }
  };

  // Remove tag by index
  const removeTag = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      // Ensure categories and tags are arrays of strings, max 5
      const tags = Array.isArray(formData.tags) ? formData.tags.slice(0, 5).map(t => t.trim()) : [];
      const categories = Array.isArray(formData.categories) ? formData.categories.slice(0, 5).map(c => c.trim()) : [];
  const imageUrl = formData.image?.trim() ? formData.image : FALLBACK_IMAGE;
      const articleData = {
        ...formData,
        tags,
        categories,
        image: imageUrl,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: userRole === "admin" ? formData.isPublic : false,
        viewCount: 0,
        saveCount: 0,
      };
      await addDoc(collection(db, "articles"), articleData);
  // setImageFile(null);
      setLoading(false);
      navigate("/mynook");
    } catch (err) {
      setLoading(false);
      alert("Failed to upload article. " + (err instanceof Error ? err.message : ""));
    }
  };

  return (
    <div className="min-h-screen bg-[#18181b]">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between w-full px-8 py-4 bg-[#23272f] border-b border-[#23272f]">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 text-yellow-400 font-bold text-xl"><BookOpen className="w-5 h-5" />The Nook</a>
          <a href="/mynook" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition"><BookOpen className="w-4 h-4" />My Nook</a>
          <a href="/profile" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition"><User2 className="w-4 h-4" />Profile</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="/upload" className="flex items-center gap-1 bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition"><Plus className="w-4 h-4" />Add to Nook</a>
          {userRole === "admin" && (
            <a href="/admin" className="flex items-center gap-1 bg-[#18181b] text-yellow-400 font-bold px-4 py-2 rounded-lg border border-yellow-400 hover:bg-yellow-400 hover:text-black transition"><User2 className="w-4 h-4" />Admin</a>
          )}
        </div>
      </nav>
      {/* Mobile Navigation - Icons only */}
      <nav className="flex md:hidden items-center justify-between w-full px-4 py-3 bg-[#23272f] border-b border-[#23272f]">
        <a href="/" className="flex items-center gap-2 text-yellow-400 font-bold text-lg"><BookOpen className="w-5 h-5" /></a>
        <div className="flex items-center gap-3">
          <a href="/mynook" className="flex items-center text-white/80 hover:text-yellow-400 transition text-base"><BookOpen className="w-6 h-6" /></a>
          <a href="/profile" className="flex items-center text-white/80 hover:text-yellow-400 transition text-base"><User2 className="w-6 h-6" /></a>
          <a href="/upload" className="flex items-center bg-yellow-400 text-black font-bold px-2 py-1 rounded-md hover:bg-yellow-500 transition text-base"><Plus className="w-6 h-6" /></a>
          {userRole === "admin" && (
            <a href="/admin" className="flex items-center bg-[#18181b] text-yellow-400 font-bold px-2 py-1 rounded-md border border-yellow-400 hover:bg-yellow-400 hover:text-black transition text-base"><User2 className="w-6 h-6" /></a>
          )}
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
  <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-8 text-center tracking-tight animate-fade-in">Add to your nook</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#23272f] rounded-2xl shadow-2xl p-4 sm:p-8 border border-[#23272f] mt-6">
          {/* Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter article title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="bg-[#18181b] text-white border border-[#35373e] focus:border-yellow-400 focus:ring-yellow-400/30 placeholder:text-white/40"
            />
          </div>

          {/* URL */}
          <div className="space-y-3">
            <Label htmlFor="url" className="text-white">Article URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              className="bg-[#18181b] text-white border border-[#35373e] focus:border-primary focus:ring-primary/30 placeholder:text-white/40"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the article..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="bg-[#18181b] text-white border border-[#35373e] focus:border-primary focus:ring-primary/30 placeholder:text-white/40 min-h-[100px]"
            />
          </div>

          {/* Original Author */}
          <div className="space-y-3">
            <Label htmlFor="originalAuthor" className="text-white">Original Author</Label>
            <Input
              id="originalAuthor"
              type="text"
              placeholder="Author's name"
              value={formData.originalAuthor}
              onChange={(e) => handleInputChange("originalAuthor", e.target.value)}
              className="bg-[#18181b] text-white border border-[#35373e] focus:border-primary focus:ring-primary/30 placeholder:text-white/40"
            />
          </div>

          {/* Categories (multi-input, max 5, with suggestions) */}
          <div className="space-y-3">
            <Label className="text-white">Categories <span className="text-xs text-white/40">(up to 5)</span></Label>
            <Input
              id="categories"
              type="text"
              placeholder="Type a category and press Enter or comma..."
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === "Enter" || e.key === ",") && formData.categories.length < 5) {
                  e.preventDefault();
                  if (categoryInput.trim()) {
                    addCategory(categoryInput);
                    setCategoryInput("");
                  }
                }
              }}
              onBlur={() => {
                if (categoryInput.trim() && formData.categories.length < 5) {
                  addCategory(categoryInput);
                  setCategoryInput("");
                }
              }}
              disabled={formData.categories.length >= 5}
              className="bg-[#18181b] text-white border border-[#35373e] focus:border-primary focus:ring-primary/30 placeholder:text-white/40"
            />
            {/* Suggestions dropdown */}
            {categoryInput && formData.categories.length < 5 && (
              <div className="bg-[#23272f] border border-[#35373e] rounded mt-1 max-h-40 overflow-y-auto shadow-xl z-10 relative">
                {CATEGORIES.filter(cat =>
                  cat.toLowerCase().includes(categoryInput.toLowerCase()) &&
                  !formData.categories.some(c => c.toLowerCase() === cat.toLowerCase())
                ).slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className="block w-full text-left px-3 py-2 text-white hover:bg-yellow-400/20 transition-colors"
                    onMouseDown={() => {
                      addCategory(cat);
                      setCategoryInput("");
                    }}
                  >
                    {cat}
                  </button>
                ))}
                {CATEGORIES.filter(cat =>
                  cat.toLowerCase().includes(categoryInput.toLowerCase()) &&
                  !formData.categories.some(c => c.toLowerCase() === cat.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-white/60">No suggestions</div>
                )}
              </div>
            )}
            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.categories.map((cat, idx) => (
                <span key={cat + idx} className="inline-flex items-center px-2 py-1 bg-[#35373e] text-white rounded text-sm">
                  {cat}
                  <button
                    type="button"
                    className="ml-1 text-white/60 hover:text-destructive"
                    onClick={() => removeCategory(idx)}
                    aria-label={`Remove category ${cat}`}
                  >
                    <span title="Remove category"><X className="w-3 h-3" /></span>
                  </button>
                </span>
              ))}
            </div>
            <p className="text-sm text-white/50">Type a category and press Enter or comma. Click × to remove. Max 5 categories. Suggestions are shown as you type, but you can add your own.</p>
          </div>

          {/* Tags (max 5) */}
          <div className="space-y-3">
            <Label htmlFor="tags" className="text-white">Tags <span className="text-xs text-white/40">(up to 5)</span></Label>
            <Input
              id="tags"
              type="text"
              placeholder="web dev, javascript, react"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              className="bg-[#18181b] text-white border border-[#35373e] focus:border-primary focus:ring-primary/30 placeholder:text-white/40"
              onKeyDown={e => {
                if ((e.key === "Enter" || e.key === ",") && formData.tags.length < 5) {
                  e.preventDefault();
                  if (tagInput.trim()) {
                    addTag(tagInput);
                    setTagInput("");
                  }
                }
              }}
              onBlur={() => {
                if (tagInput.trim() && formData.tags.length < 5) {
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
              disabled={formData.tags.length >= 5}
            />
            {/* Tag chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, idx) => (
                <span
                  key={tag + idx}
                  className="inline-flex items-center px-2 py-1 bg-[#35373e] text-white rounded text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-white/60 hover:text-destructive"
                    onClick={() => removeTag(idx)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <span title="Remove tag"><X className="w-3 h-3" /></span>
                  </button>
                </span>
              ))}
            </div>
            <p className="text-sm text-white/50 mt-1">
              Type a tag and press Enter or comma. Click × to remove. Max 5 tags.
            </p>
          </div>

          {/* Image Upload (Cloudinary) - Improved UI, no URL field */}
          <div className="space-y-3">
            <Label htmlFor="image-upload" className="text-white font-semibold">Article Image</Label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center px-6 py-3 bg-[#23272f] text-white font-bold rounded-xl shadow-lg border-2 border-yellow-400/40 hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <span className="flex items-center gap-2"><svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Uploading...</span>
                ) : (
                  <span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>Upload Image</span>
                )}
              </button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                className="hidden"
                disabled={uploadingImage}
              />
              {formData.image && (
                <div className="w-full sm:w-48 mt-4 sm:mt-0 flex-shrink-0">
                  <img src={formData.image} alt="Preview" className="w-full max-h-48 object-contain rounded-lg border-2 border-yellow-400/40 shadow-md" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
            <p className="text-xs text-white/50 mt-1">Upload a cover image for your article (JPG, PNG, GIF, etc.).</p>
          </div>

          {/* Category removed, replaced by multi-select above */}

          {/* Public/Approved Switches */}
          {userRole === "admin" && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={val => handleInputChange("isPublic", val)}
                  id="isPublic"
                />
                <Label htmlFor="isPublic" className="text-white">Public</Label>
              </div>
            </div>
          )}

          {/* Submit/Cancel Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button type="submit" className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300" disabled={loading}>
              <span title="Save article"><Save className="w-4 h-4 mr-2" /></span>
              {loading ? "Saving..." : "Save Article"}
            </Button>
            <Button type="button" variant="secondary" asChild className="bg-gray-700 text-white hover:bg-gray-500 border-0" disabled={loading}>
              <Link to="/">Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Upload;