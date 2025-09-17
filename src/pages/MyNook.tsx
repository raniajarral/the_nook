import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bookmark, User2, BookOpen, Save, Plus } from "lucide-react";
// Navigation markup will be handled directly in this file
import { ArticleCard } from "@/components/ui/article-card";
import { db } from "../lib/firebase";
import { updateDoc, doc, collection, getDocs, getDoc, query, where, DocumentData, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../lib/firebase";
import { User } from "firebase/auth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type MyNookArticle = {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  tags: string[];
  url?: string;
  isPublic?: boolean;
  submissionRequested?: boolean;
};

const MyNook: React.FC = () => {
  const [activeTab, setActiveTab] = useState("saved");
  const [user, setUser] = useState<User | null>(null);
  type UserDetails = {
    email?: string;
    status?: string;
    createdAt?: string;
  };
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [savedArticles, setSavedArticles] = useState<MyNookArticle[]>([]);
  const [myArticles, setMyArticles] = useState<MyNookArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]); // articleIds with pending requests

  // Submission request handler (now in correct scope)
  const handleSubmitRequest = async (articleId: string) => {
    try {
      await addDoc(collection(db, "publicationRequests"), {
        articleId,
        requestedAt: serverTimestamp(),
        status: "pending"
      });
      setPendingRequests(prev => [...prev, articleId]);
      alert("Submission request sent to admin.");
    } catch (err) {
      alert("Failed to request submission.");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Fetch user details for admin check
        const userDoc = await getDoc(doc(db, "users", u.uid));
        setUserDetails(userDoc.exists() ? userDoc.data() : null);
      } else {
        setUserDetails(null);
      }
    });
    return () => unsubscribe();
  }, []);


const reloadSavedArticles = async (currentUser: User) => {
  console.log("Reloading saved articles for:", currentUser.uid);

  const savedQ = query(
    collection(db, "saved"),
    where("userId", "==", currentUser.uid)
  );
  const savedSnap = await getDocs(savedQ);

  const saved: MyNookArticle[] = savedSnap.docs.map((savedDoc) => {
    const data = savedDoc.data();
    return {
      id: savedDoc.id, // use the saved doc id
      title: data.title ?? "Untitled",
      author: data.author ?? "Unknown",
      description: data.description ?? "No description.",
      image: data.image ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      url: data.url ?? "",
      isPublic: data.isPublic ?? true,
    };
  });

  console.log("Final saved articles:", saved);
  setSavedArticles(saved);
};

  useEffect(() => {
  if (!user) return; // don’t fetch until user is ready

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch articles created by the user
      const q = query(
        collection(db, "articles"),
        where("createdBy", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);

      const mine: MyNookArticle[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title ?? "Untitled",
          author: data.originalAuthor ?? "Unknown",
          description: data.description ?? "No description.",
          image: data.image ?? "",
          tags: Array.isArray(data.tags) ? data.tags : [],
          url: data.url ?? "",
          isPublic: data.isPublic ?? false,
        };
      });

      setMyArticles(mine);

      // Fetch pending publication requests
      const reqQ = query(
        collection(db, "publicationRequests"),
        where("status", "==", "pending")
      );
      const reqSnap = await getDocs(reqQ);
      const pendingIds: string[] = [];
      reqSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (mine.some(a => a.id === data.articleId)) {
          pendingIds.push(data.articleId);
        }
      });
      setPendingRequests(pendingIds);

      // ✅ Fetch saved articles only after user is available
      await reloadSavedArticles(user);
    } catch (err) {
      console.error("Error fetching data:", err);
      setMyArticles([]);
      setSavedArticles([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [user, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#101014] relative">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between w-full px-8 py-4 bg-[#23272f] border-b border-[#23272f]">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 text-yellow-400 font-bold text-xl"><BookOpen className="w-5 h-5" />The Nook</a>
          <a href="/mynook" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition"><BookOpen className="w-4 h-4" />My Nook</a>
          <a href="/profile" className="flex items-center gap-1 text-white/80 hover:text-yellow-400 font-semibold transition"><User2 className="w-4 h-4" />Profile</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="/upload" className="flex items-center gap-1 bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 transition"><Plus className="w-4 h-4" />Add to Nook</a>
          {userDetails?.status === "admin" && (
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
          {userDetails?.status === "admin" && (
            <a href="/admin" className="flex items-center bg-[#18181b] text-yellow-400 font-bold px-2 py-1 rounded-md border border-yellow-400 hover:bg-yellow-400 hover:text-black transition text-base"><User2 className="w-6 h-6" /></a>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-10">
  {/* No title above tabs; tabs themselves will show icon and text with transition */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="flex gap-1 sm:gap-2 bg-[#23272f] rounded-2xl p-1 shadow-lg border border-[#23272f] mb-8 w-fit mx-auto">
            <TabsTrigger value="saved" className="flex items-center gap-2 px-4 sm:px-6 py-2 text-base sm:text-lg font-semibold rounded-xl transition-all data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-yellow-400/20 hover:text-yellow-400 focus-visible:ring-2 focus-visible:ring-yellow-400/60">
              <Bookmark className="w-5 h-5" />
              <span className={`transition-all duration-300 ml-1 ${activeTab === "saved" ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden'}`}>Saved Articles</span>
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex items-center gap-2 px-4 sm:px-6 py-2 text-base sm:text-lg font-semibold rounded-xl transition-all data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-yellow-400/20 hover:text-yellow-400 focus-visible:ring-2 focus-visible:ring-yellow-400/60">
              <User2 className="w-5 h-5" />
              <span className={`transition-all duration-300 ml-1 ${activeTab === "mine" ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden'}`}>My Nook</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="saved">
            {/* Mobile: list view, Desktop: grid */}
            <div className="block sm:hidden">
              {loading ? (
                <div className="text-center py-12 text-white/80 animate-pulse">Loading...</div>
              ) : savedArticles.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {savedArticles.map(article => (
                    <li key={article.id} className="bg-[#23272f] rounded-xl shadow-lg border border-[#23272f] flex items-stretch p-3 gap-3 animate-fade-in-slow">
                      <div className="flex-1 flex flex-col justify-between">
                        <span className="text-xs text-white/60 mb-1">{article.author}</span>
                        <span className="text-lg font-bold text-white mb-1 line-clamp-2">{article.title}</span>
                        <span className="text-sm text-white/80 line-clamp-3 mb-2">{article.description}</span>
                      </div>
                      <div className="flex flex-col items-end justify-between min-w-[90px] max-w-[120px]">
                        <button
                          className="bg-black/60 rounded-full p-1 mb-2 hover:bg-yellow-400/80 transition-colors flex items-center justify-center"
                          style={{ width: 28, height: 28 }}
                          onClick={e => {
                            e.preventDefault();
                            alert('Save/Unsave not implemented in list view.');
                          }}
                          aria-label="Save article"
                        >
                          <Bookmark className="w-4 h-4 text-white drop-shadow mx-auto my-auto" />
                        </button>
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded-lg border border-[#35373e]"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-white/70">No saved articles yet.</div>
              )}
            </div>
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                <div className="text-center py-12 text-white/80 animate-pulse">Loading...</div>
              ) : savedArticles.length > 0 ? (
                savedArticles.map(article => (
                  <ArticleCard key={article.id} {...article} />
                ))
              ) : (
                <div className="text-center py-12 text-white/70">No saved articles yet.</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="mine">
            {/* Mobile: list view, Desktop: grid */}
            <div className="block sm:hidden">
              {loading ? (
                <div className="text-center py-12 text-white/80 animate-pulse">Loading...</div>
              ) : myArticles.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {myArticles.map(article => {
                    const isPending = pendingRequests.includes(article.id);
                    return (
                      <li key={article.id} className="bg-[#23272f] rounded-xl shadow-lg border border-[#23272f] flex items-stretch p-3 gap-3 animate-fade-in-slow">
                        <div className="flex-1 flex flex-col justify-between">
                          <span className="text-xs text-white/60 mb-1">{article.author}</span>
                          <span className="text-lg font-bold text-white mb-1 line-clamp-2">{article.title}</span>
                          <span className="text-sm text-white/80 line-clamp-3 mb-2">{article.description}</span>
                        </div>
                        <div className="flex flex-col items-end justify-between min-w-[90px] max-w-[120px]">
                          <button
                            className="bg-black/60 rounded-full p-1 mb-2 hover:bg-yellow-400/80 transition-colors flex items-center justify-center"
                            style={{ width: 28, height: 28 }}
                            onClick={e => {
                              e.preventDefault();
                              alert('Save/Unsave not implemented in list view.');
                            }}
                            aria-label="Save article"
                          >
                            <Bookmark className="w-4 h-4 text-white drop-shadow mx-auto my-auto" />
                          </button>
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-20 h-20 object-cover rounded-lg border border-[#35373e]"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-12 text-white/70">No personal articles yet.</div>
              )}
            </div>
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                <div className="text-center py-12 text-white/80 animate-pulse">Loading...</div>
              ) : myArticles.length > 0 ? (
                myArticles.map(article => {
                  const isPending = pendingRequests.includes(article.id);
                  // Remove submission request for admin users
                  const isAdmin = userDetails?.status === "admin";
                  return (
                    <ArticleCard
                      key={article.id}
                      {...article}
                      isPublic={article.isPublic}
                      showSubmitButton={!isAdmin && !article.isPublic && !isPending}
                      pending={isPending}
                      onSubmitRequest={!isAdmin ? handleSubmitRequest : undefined}
                    />
                  );
                })
              ) : (
                <div className="text-center py-12 text-white/70">No personal articles yet.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        {/* Guest overlay */}
        {!user && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur-sm">
            <div className="bg-card p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">Sign in to access My Nook</h2>
              <p className="mb-4">You must be logged in to view and save articles to your Nook.</p>
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyNook;
