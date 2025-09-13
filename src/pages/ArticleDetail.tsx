
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigation } from "../components/ui/navigation";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, ExternalLink, BookOpen, Bookmark, BookmarkCheck } from "lucide-react";
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
        <Navigation />
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#101014] px-2 sm:px-0">
      <Navigation />
      <main className="flex justify-center items-start pt-2 sm:pt-4 pb-6 sm:pb-10">
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
          {/* Hero Image with Save Button - sits above the card */}
          <div className="relative w-full" style={{ aspectRatio: '2.2/1', marginBottom: '-1.5rem', zIndex: 2 }}>
            <img
              src={article.image && article.image.trim() !== "" ? article.image : defaultCover}
              alt={article.title}
              className="w-full h-full object-cover brightness-90 rounded-t-2xl"
              style={{ minHeight: '220px', maxHeight: '340px', objectPosition: 'center top', display: 'block' }}
            />
            <button
              className={`absolute top-3 right-3 z-20 bg-black/60 rounded-full p-2 hover:bg-primary/80 transition-colors border border-border shadow-lg`}
              onClick={handleSave}
              aria-label={saved ? "Unsave article" : "Save article"}
              style={{ zIndex: 30 }}
            >
              {saved ? (
                <span title="Unsave article"><BookmarkCheck className="w-7 h-7 text-primary drop-shadow" /></span>
              ) : (
                <span title="Save article"><Bookmark className="w-7 h-7 text-white drop-shadow" /></span>
              )}
            </button>
          </div>
          {/* Card Content */}
    <div className="bg-white/5 dark:bg-white/10 rounded-b-2xl shadow-2xl border border-white/10 p-2 sm:p-6 flex flex-col gap-6" style={{ marginTop: 0, zIndex: 1, position: 'relative' }}>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-sm text-foreground/70 hover:text-primary px-2 py-1 rounded transition-colors focus:outline-none focus:underline underline underline-offset-2 mb-4"
              type="button"
              style={{ background: 'none', border: 'none' }}
            >
              <span title="Back"><ArrowLeft className="w-4 h-4 mr-2" /></span>
              Back
            </button>
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight text-left">
            {article.title}
          </h1>
          {/* Author, Date, Read Time */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 text-white text-base text-left">
            <span>by <span className="text-primary font-semibold">{article.author}</span></span>
            <div className="flex gap-3 flex-wrap items-center">
              {article.publishedDate && <><span>•</span><span>{article.publishedDate}</span></>}
              {article.readTime && <><span>•</span><span className="flex items-center"><span title="Read time"><BookOpen className="w-4 h-4 mr-1" /></span>{article.readTime}</span></>}
            </div>
          </div>
          <div className="border-t border-border my-2"></div>
          {/* Description */}
          <div className="prose prose-invert max-w-none mb-2 text-left">
            <p className="text-base sm:text-lg text-white leading-relaxed">
              {article.description}
            </p>
          </div>
          <div className="border-t border-border my-2"></div>
          {/* Tags - now below description */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 text-left">
              {article.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-gradient-to-r from-primary/80 to-secondary/80 text-white border-none shadow px-3 py-1 rounded-full text-xs font-semibold tracking-wide hover:scale-105 hover:shadow-lg transition-transform transition-shadow duration-200">
                  <span className="inline-block align-middle mr-1 w-2 h-2 rounded-full bg-primary/80"></span>#{tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="border-t border-border my-2"></div>
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
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
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link to="/">
                Browse More Articles
              </Link>
            </Button>
          </div>
        </div>
        </div>
      </main>
  </div>

  );
};

export default ArticleDetail;