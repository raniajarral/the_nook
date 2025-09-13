
import { Link } from "react-router-dom";
import { Badge } from "./badge";
import { Button } from "./button";
import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";

interface ArticleCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  tags: string[];
  url?: string;
  isPublic?: boolean;
  showSubmitButton?: boolean;
  pending?: boolean;
  onSubmitRequest?: (id: string) => void;
}



export const ArticleCard = ({ id, title, author, description, image, tags, url, isPublic, showSubmitButton, pending, onSubmitRequest }: ArticleCardProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkSaved = async () => {
      if (!userId) return setSaved(false);
      const savedRef = doc(db, "saved", `${userId}_${id}`);
      const snap = await getDoc(savedRef);
      setSaved(snap.exists());
    };
    checkSaved();
  }, [userId, id]);

  const handleSave = async (e: React.MouseEvent) => {
  e.preventDefault();
  if (!userId) {
    alert("Sign in to save articles.");
    return;
  }

  const savedRef = doc(db, "saved", `${userId}_${id}`);
  try {
    if (saved) {
      await deleteDoc(savedRef);
      setSaved(false);
    } else {
      await setDoc(savedRef, {
        userId,
        articleId: id,
        savedAt: Date.now(),
      });
      setSaved(true);
    }
  } catch (err) {
    alert("Failed to save article. Check your permissions or network.");
  }
};

  return (
    <div className="relative group bg-gradient-to-br from-[#23272f] via-[#18181b] to-[#101014] rounded-2xl overflow-hidden shadow-2xl border border-[#23272f] hover:border-primary hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.03] flex flex-col h-full">
      {/* Save button */}
      <button
        className="absolute top-4 right-4 z-20 bg-black/60 rounded-full p-2 hover:bg-primary/80 transition-colors"
        onClick={handleSave}
        aria-label={saved ? "Unsave article" : "Save article"}
        style={{ zIndex: 30 }}
      >
        {saved ? (
          <span title="Unsave article"><BookmarkCheck className="w-6 h-6 text-primary drop-shadow" /></span>
        ) : (
          <span title="Save article"><Bookmark className="w-6 h-6 text-white drop-shadow" /></span>
        )}
      </button>
      <Link
        to={`/article/${id}`}
        className="block focus:outline-none"
        style={{ zIndex: 10 }}
      >
  <div className="aspect-[16/9] overflow-hidden relative w-full">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out brightness-90 group-hover:brightness-100"
            loading="lazy"
          />
          {/* Tags removed from card for cleaner look; now only in details view */}
          {pending && !isPublic && (
            <span className="absolute top-2 right-2 z-20 bg-yellow-400/90 text-black px-3 py-1 rounded text-xs font-semibold shadow-lg animate-pulse">
              Pending
            </span>
          )}
        </div>
  <div className="p-5 flex flex-col gap-2 flex-1">
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          <p className="text-sm text-[#b3b3b3] mb-2 line-clamp-3 group-hover:text-foreground transition-colors duration-200">
            {description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/80 font-medium tracking-wide">
              by {author}
            </span>
            {/* Removed 'External' text for cleaner card UI */}
          </div>
        </div>
      </Link>
      {/* Submission Request Button for private articles in My Nook */}
      {showSubmitButton && !isPublic && onSubmitRequest && (
        <Button
          className="absolute top-4 left-4 z-20 animate-fade-in"
          size="sm"
          disabled={submitting}
          onClick={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            await onSubmitRequest(id);
            setSubmitting(false);
          }}
        >
          {submitting ? "Submitting..." : "Request Submission"}
        </Button>
      )}
    </div>
  );
};