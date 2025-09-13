import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, updateDoc, doc, query, where, getDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
// ...existing code...
import { Badge } from "@/components/ui/badge";
import { ArticleCard } from "@/components/ui/article-card";
import { useNavigate } from "react-router-dom";

const Admin: React.FC = () => {
  type Article = {
    id: string;
    title: string;
    description: string;
    originalAuthor: string;
    image: string;
    isPublic: boolean;
    denied?: boolean;
    tags?: string[];
    categories?: string[];
    url?: string;
  };
  type User = {
    id: string;
    email: string;
    status: string;
    banned?: boolean;
  };
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  type PublicationRequest = {
    requestId: string;
    articleId: string;
    requestedAt: Timestamp | null;
    status: string;
    article: Article;
  };
  const [publicationRequests, setPublicationRequests] = useState<PublicationRequest[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublicationRequests = async () => {
      setLoading(true);
      const q = query(collection(db, "publicationRequests"), where("status", "==", "pending"));
      const snapshot = await getDocs(q);
  const requests: PublicationRequest[] = [];
      for (const reqDoc of snapshot.docs) {
        const reqData = reqDoc.data();
        // Fetch the referenced article
        const articleRef = reqData.articleId;
        const articleSnap = await getDoc(doc(db, "articles", articleRef));
        if (articleSnap.exists()) {
          const data = articleSnap.data();
          requests.push({
            requestId: reqDoc.id,
            articleId: articleRef,
            requestedAt: reqData.requestedAt,
            status: reqData.status,
            article: {
              id: articleSnap.id,
              title: data.title ?? "Untitled",
              description: data.description ?? "No description.",
              originalAuthor: data.originalAuthor ?? "Unknown",
              image: data.image ?? "",
              isPublic: data.isPublic ?? false,
              denied: data.denied ?? false,
              tags: Array.isArray(data.tags) ? data.tags : [],
              categories: Array.isArray(data.categories) ? data.categories : [],
              url: data.url ?? "",
            }
          });
        }
      }
      setPublicationRequests(requests);
      setLoading(false);
    };
    fetchPublicationRequests();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email ?? "",
          status: data.status ?? "user",
          banned: data.banned ?? false,
        };
      }));
    };
    fetchUsers();
  }, []);

  // Remove publication request after approval/denial
  const removePublicationRequest = async (articleId: string) => {
    // Find the request for this article
    const req = publicationRequests.find(r => r.articleId === articleId);
    if (req) {
      await deleteDoc(doc(db, "publicationRequests", req.requestId));
      setPublicationRequests(prev => prev.filter(r => r.articleId !== articleId));
    }
  };

  const handleApprove = async (articleId: string) => {
    await updateDoc(doc(db, "articles", articleId), { isPublic: true });
    await removePublicationRequest(articleId);
    setSelectedArticle(null);
  };

  const handleDeny = async (articleId: string) => {
    await updateDoc(doc(db, "articles", articleId), { denied: true });
    await removePublicationRequest(articleId);
    setSelectedArticle(null);
  };

  const handleBanUser = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { banned: true });
    setUsers(users.map(u => u.id === userId ? { ...u, banned: true } : u));
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#101014]">
      <Navigation />
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight animate-fade-in">Admin Panel</h1>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Pending Article Submissions</h2>
          {loading ? <div className="text-white/80 animate-pulse">Loading...</div> : (
            <>
              {/* Desktop: grid view using ArticleCard */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {publicationRequests.map(req => (
                  <div key={req.requestId} className="relative group bg-gradient-to-br from-[#23272f] via-[#18181b] to-[#101014] rounded-2xl overflow-hidden shadow-2xl border border-[#23272f] flex flex-col h-full p-2">
                    <ArticleCard
                      id={req.article.id}
                      title={req.article.title}
                      author={req.article.originalAuthor}
                      description={req.article.description}
                      image={req.article.image}
                      tags={req.article.tags || []}
                      isPublic={req.article.isPublic}
                      url={req.article.url}
                    />
                    {/* Categories as badges below card */}
                    {req.article.categories && req.article.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-2">
                        {req.article.categories.map((cat: string) => (
                          <Badge key={cat} variant="secondary" className="bg-gradient-to-r from-secondary/80 to-primary/80 text-white border-none shadow px-3 py-1 rounded-full text-xs font-semibold tracking-wide hover:scale-105 hover:shadow-lg transition-transform transition-shadow duration-200">
                            <span className="inline-block align-middle mr-1 w-2 h-2 rounded-full bg-secondary/80"></span>{cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* Approve/Deny buttons always visible */}
                    <div className="flex flex-row gap-2 mt-4 px-2">
                      <Button onClick={() => handleApprove(req.article.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow">Approve</Button>
                      <Button onClick={() => handleDeny(req.article.id)} variant="destructive" className="flex-1">Deny</Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Mobile: list view like MyNook */}
              <div className="block sm:hidden">
                <ul className="flex flex-col gap-4">
                  {publicationRequests.map(req => (
                    <li
                      key={req.requestId}
                      className="bg-[#23272f] rounded-xl shadow-lg border border-[#23272f] flex items-stretch p-3 gap-3 animate-fade-in-slow"
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <span className="text-xs text-white/60 mb-1">{req.article.originalAuthor}</span>
                        <span className="text-lg font-bold text-white mb-1 line-clamp-2">{req.article.title}</span>
                        <span className="text-sm text-white/80 line-clamp-3 mb-2">{req.article.description}</span>
                        {/* Categories as badges below info */}
                        {req.article.categories && req.article.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {req.article.categories.map((cat: string) => (
                              <Badge key={cat} variant="secondary" className="bg-gradient-to-r from-secondary/80 to-primary/80 text-white border-none shadow px-3 py-1 rounded-full text-xs font-semibold tracking-wide hover:scale-105 hover:shadow-lg transition-transform transition-shadow duration-200">
                                <span className="inline-block align-middle mr-1 w-2 h-2 rounded-full bg-secondary/80"></span>{cat}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* Approve/Deny buttons always visible */}
                        <div className="flex flex-row gap-2 mt-4">
                          <Button onClick={() => handleApprove(req.article.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow">Approve</Button>
                          <Button onClick={() => handleDeny(req.article.id)} variant="destructive" className="flex-1">Deny</Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between min-w-[90px] max-w-[120px]">
                        {/* No status badge */}
                      </div>
                      <img
                        src={req.article.image}
                        alt={req.article.title}
                        className="w-20 h-20 object-cover rounded-lg border border-[#35373e] ml-2"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {selectedArticle && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="w-full max-w-2xl mx-auto animate-fade-in">
                {/* Hero Image */}
                <div className="relative w-full" style={{ aspectRatio: '2.2/1', marginBottom: '-1.5rem', zIndex: 2 }}>
                  <img
                    src={selectedArticle.image && selectedArticle.image.trim() !== "" ? selectedArticle.image : '/assets/defaultcover.jpg'}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover brightness-90 rounded-t-2xl"
                    style={{ minHeight: '220px', maxHeight: '340px', objectPosition: 'center top', display: 'block' }}
                  />
                </div>
                {/* Card Content */}
                <div className="bg-white/5 dark:bg-white/10 rounded-b-2xl shadow-2xl border border-white/10 p-2 sm:p-6 flex flex-col gap-6" style={{ marginTop: 0, zIndex: 1, position: 'relative' }}>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="inline-flex items-center text-sm text-foreground/70 hover:text-primary px-2 py-1 rounded transition-colors focus:outline-none focus:underline underline underline-offset-2 mb-4 self-start"
                    type="button"
                    style={{ background: 'none', border: 'none' }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                  {/* Title */}
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 leading-tight tracking-tight text-left">
                    {selectedArticle.title}
                  </h1>
                  {/* Author */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 text-white text-base text-left">
                    <span>by <span className="text-primary font-semibold">{selectedArticle.originalAuthor}</span></span>
                  </div>
                  <div className="border-t border-border my-2"></div>
                  {/* Description */}
                  <div className="prose prose-invert max-w-none mb-2 text-left">
                    <p className="text-base sm:text-lg text-white leading-relaxed">
                      {selectedArticle.description}
                    </p>
                  </div>
                  <div className="border-t border-border my-2"></div>
                  {/* Tags */}
                  {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 text-left">
                      {selectedArticle.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-gradient-to-r from-primary/80 to-secondary/80 text-white border-none shadow px-3 py-1 rounded-full text-xs font-semibold tracking-wide hover:scale-105 hover:shadow-lg transition-transform transition-shadow duration-200">
                          <span className="inline-block align-middle mr-1 w-2 h-2 rounded-full bg-primary/80"></span>#{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Categories */}
                  {selectedArticle.categories && selectedArticle.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 text-left">
                      {selectedArticle.categories.map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="bg-gradient-to-r from-secondary/80 to-primary/80 text-white border-none shadow px-3 py-1 rounded-full text-xs font-semibold tracking-wide hover:scale-105 hover:shadow-lg transition-transform transition-shadow duration-200">
                          <span className="inline-block align-middle mr-1 w-2 h-2 rounded-full bg-secondary/80"></span>{cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-border my-2"></div>
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <Button onClick={() => handleApprove(selectedArticle.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow">Approve</Button>
                    <Button onClick={() => handleDeny(selectedArticle.id)} variant="destructive" className="flex-1">Deny</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
