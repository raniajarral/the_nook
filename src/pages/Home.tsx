import { Navigation } from "@/components/ui/navigation";
import { ArticleCard } from "@/components/ui/article-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import defaultCover from "../assets/defaultcover.jpg";

type ArticleCardProps = {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  tags: string[];
  url?: string;
};
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { getDocs, collection, query, where } from "firebase/firestore";

const Home = () => {
  const [articles, setArticles] = useState<ArticleCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Fetch all public articles (remove isApproved filter for debugging)
        const q = query(
          collection(db, "articles"),
          where("isPublic", "==", true)
          // where("isApproved", "==", true) // <-- comment out for now
        );
        const querySnapshot = await getDocs(q);
        const articlesData: ArticleCardProps[] = [];
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          articlesData.push({
            id: docSnap.id,
            title: data.title ?? "Untitled",
            author: data.author ?? "Unknown",
            description: data.description ?? "No description.",
            image: data.image ?? "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            url: data.url ?? ""
          });
        });
        setArticles(articlesData);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Filter articles by search query (title, author, description)
  const filteredArticles = articles.filter(article => {
    const q = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      article.author.toLowerCase().includes(q) ||
      article.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#18181b] overflow-x-hidden">
      <Navigation />
      {/* Hero Section - Responsive */}
      <section className="w-full flex flex-col items-center justify-center bg-[#18181b] border-b border-[#23272f] animate-fade-in px-2 sm:px-4 py-10 sm:py-16 md:py-20 min-h-[220px] sm:min-h-[280px] md:min-h-[340px]">
        <h1 className="text-3xl xs:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 animate-fade-in-slow text-center leading-tight break-words max-w-2xl">Welcome to The Nook</h1>
        <p className="text-base xs:text-lg md:text-xl text-white/80 font-medium mb-2 sm:mb-3 animate-fade-in-slow text-center max-w-xl">Discover, save, and organize your favorite articles in one beautiful place.</p>
      </section>
      {/* Search Bar - Responsive */}
      <div className="w-full flex justify-center py-5 sm:py-8 bg-[#18181b] animate-fade-in px-2 sm:px-0">
        <div className="relative w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
            <Search className="absolute left-4 xs:left-5 top-1/2 -translate-y-1/2 text-yellow-400 w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-focus-within:text-yellow-400" />
          <Input
            type="text"
            placeholder="Search articles by title, author, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 xs:pl-14 pr-4 xs:pr-6 py-3 xs:py-4 sm:py-5 rounded-xl xs:rounded-2xl bg-[#23272f] text-white text-base xs:text-lg sm:text-xl border border-[#23272f] focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-2xl transition-all font-semibold hover:scale-[1.015] focus:scale-[1.03]"
            autoFocus
          />
        </div>
      </div>
  <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-12 animate-fade-in">
        <div className="mb-12 text-center">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white/80 mb-2 sm:mb-3 tracking-tight animate-fade-in">Explore</h1>
          <p className="hidden sm:block text-lg text-white/60 animate-fade-in-slow">Discover and organize your favorite articles in one place.</p>
        </div>
        {loading ? (
          <div className="text-center py-16 text-white/80 animate-pulse">Loading articles...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full overflow-x-hidden">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  author={article.author}
                  description={article.description}
                  image={article.image}
                  tags={article.tags}
                  url={article.url}
                />
              ))}
            </div>
            {filteredArticles.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-white mb-2">No articles found</h3>
                <p className="text-lg text-white/70 mb-6">Try a different search or add your first article.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Home;