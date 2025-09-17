
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
// Navigation markup will be handled directly in this file
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, ExternalLink, BookOpen, Bookmark, BookmarkCheck, User2, Save } from "lucide-react";
import defaultCover from "../assets/defaultcover.jpg";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";

type Article = {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  tags?: string[];
  url?: string;
  publishedDate?: string;
  readTime?: string;
};

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        if (!id) throw new Error("No article id");
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setArticle({
            id: docSnap.id,
            title: data.title ?? "Untitled",
            author: data.author ?? "Unknown",
            description: data.description ?? "No description.",
            image: data.image ?? "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            url: data.url ?? "",
            publishedDate: data.publishedDate ?? undefined,
            readTime: data.readTime ?? undefined,
          });
        } else {
          setArticle(null);
        }
      } catch (e) {
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

useEffect(() => {
  if (!userId || !id) return;

  const savedRef = doc(db, "saved", `${userId}_${id}`);
  const unsubscribe = onSnapshot(savedRef, (docSnap) => {
    setSaved(docSnap.exists());
  });

  return () => unsubscribe();
}, [userId, id]);


  const handleSave = async () => {
  if (!userId || !article) {
    alert("Sign in to save articles.");
    return;
  }

  const savedRef = doc(db, "saved", `${userId}_${id}`);
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
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#101014] flex items-center justify-center">
        <span className="text-lg text-muted-foreground">Loading article...</span>
      </div>
    );
  }

  if (!article) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#101014]">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-between w-full px-8 py-4 bg-[#23272f] border-b border-[#23272f]">
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2 text-yellow-400 font-bold text-xl"><BookOpen className="w-5 h-5" />The Nook</a>
              <a href="/" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition"><BookOpen className="w-4 h-4" />Home</a>
              <a href="/mynook" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition"><Bookmark className="w-4 h-4" />My Nook</a>
              <a href="/profile" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition"><User2 className="w-4 h-4" />Profile</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/upload" className="flex items-center gap-1 bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition"><Save className="w-4 h-4" />Upload</a>
              <a href="/admin" className="flex items-center gap-1 bg-[#18181b] text-yellow-400 font-bold px-4 py-2 rounded-lg border border-yellow-400 hover:bg-yellow-400 hover:text-black transition"><User2 className="w-4 h-4" />Admin</a>
            </div>
          </nav>
          {/* Mobile Navigation */}
          <nav className="flex md:hidden items-center justify-between w-full px-4 py-3 bg-[#23272f] border-b border-[#23272f]">
            <a href="/" className="flex items-center gap-2 text-yellow-400 font-bold text-lg"><BookOpen className="w-5 h-5" />The Nook</a>
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition text-base"><BookOpen className="w-4 h-4" />Home</a>
              <a href="/mynook" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition text-base"><Bookmark className="w-4 h-4" />My Nook</a>
              <a href="/profile" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition text-base"><User2 className="w-4 h-4" />Profile</a>
              <a href="/upload" className="flex items-center gap-1 bg-yellow-400 text-black font-bold px-2 py-1 rounded-md hover:bg-yellow-500 transition text-base"><Save className="w-4 h-4" />Upload</a>
              <a href="/admin" className="flex items-center gap-1 bg-[#18181b] text-yellow-400 font-bold px-2 py-1 rounded-md border border-yellow-400 hover:bg-yellow-400 hover:text-black transition text-base"><User2 className="w-4 h-4" />Admin</a>
            </div>
          </nav>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Article not found
            </h1>
            <Button asChild>
              <Link to="/">Return to Library</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#101014] px-0">
  {/* Navigation markup is now handled directly above */}
      <main className="flex justify-center items-start pb-6 sm:pb-10">
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
          {/* Modern Mobile Hero Image and Save Button (image connected to card, no space above) */}
          <div className="w-full flex flex-col items-center relative">
            <img
              src={article.image && article.image.trim() !== "" ? article.image : defaultCover}
              alt={article.title}
              className="w-full object-cover"
              style={{ minHeight: '180px', maxHeight: '320px', objectPosition: 'center top', display: 'block', aspectRatio: '16/9', marginTop: 0, marginBottom: '0', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            />
            <button
              className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 bg-black/70 rounded-full p-3 hover:bg-yellow-400/20 transition-colors border border-border"
              onClick={handleSave}
              aria-label={saved ? "Unsave article" : "Save article"}
              style={{ zIndex: 30 }}
            >
              {saved ? (
                <span title="Unsave article"><BookmarkCheck className="w-7 h-7 text-yellow-400 drop-shadow" /></span>
              ) : (
                <span title="Save article"><Bookmark className="w-7 h-7 text-white drop-shadow" /></span>
              )}
            </button>
          </div>
          {/* Card Content - Modern Mobile Layout, flat on mobile, no yellow outline, image connected */}
          <div className="bg-white/5 dark:bg-white/10 border border-white/10 p-4 sm:p-6 flex flex-col gap-6 -mt-1 mb-0" style={{ zIndex: 1, position: 'relative', boxShadow: 'none', borderRadius: 0 }}>
            {/* Title & Author - title white, author below */}
            <div className="flex flex-col gap-1 mb-0 text-left">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
                {article.title}
              </h1>
              <div className="flex gap-3 flex-wrap items-center text-white mt-1">
                {article.publishedDate && <><span>•</span><span>{article.publishedDate}</span></>}
                {article.readTime && <><span>•</span><span className="flex items-center"><span title="Read time"><BookOpen className="w-4 h-4 mr-1" /></span>{article.readTime}</span></>}
              </div>
              <span className="text-base sm:text-lg font-semibold text-white/80 mt-0 mb-0">by {article.author}</span>
            </div>
            {/* Divider - slightly further up */}
            <div className="w-full border-t border-yellow-400/40 mt-2 mb-0" />
            {/* Description */}
            <div className="prose prose-invert max-w-none mb-1 text-left">
              <p className="text-base sm:text-lg text-white leading-relaxed">
                {article.description}
              </p>
            </div>
            {/* Divider - closer */}
            <div className="w-full border-t border-yellow-400/40 my-1" />
            {/* Tags - below description, modern pill style */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1 text-left">
                {article.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-semibold shadow">#{tag}</span>
                ))}
              </div>
            )}
            {/* Divider - closer */}
            <div className="w-full border-t border-yellow-400/40 my-1" />
            {/* Actions - modern button layout */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-2">
              {article.url && (
                <Button asChild className="flex-1 sm:flex-none">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <span title="Read original article"><ExternalLink className="w-4 h-4 mr-2" /></span>
                    Read Original Article
                  </a>
                </Button>
              )}
              <Button
                onClick={() => window.history.back()}
                variant="secondary"
                className="flex-1 sm:flex-none bg-[#23272f] text-white border-none shadow"
                type="button"
              >
                <span title="Back"><ArrowLeft className="w-4 h-4 mr-2" /></span>
                Back
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;