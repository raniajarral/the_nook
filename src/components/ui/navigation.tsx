import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus, User, User2, Book, Pencil } from "lucide-react";
import { Button } from "./button";

import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type UserDetails = {
  email: string;
  status?: string;
  createdAt?: string;
};


export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserDetails({
            email: data.email ?? "",
            status: data.status ?? "user",
            createdAt: data.createdAt ?? undefined,
          });
        } else {
          setUserDetails(null);
        }
      } else {
        setUserDetails(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserDetails(null);
    navigate("/login");
  };

  return (
    <nav className="backdrop-blur-md border-b border-[#23272f]/80 bg-gradient-to-r from-[#18181b] via-[#23272f] to-[#101014] shadow-xl sticky top-0 z-50 animate-fade-in w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group transition-all duration-300">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 animate-fade-in-slow">
              <span className="text-primary-foreground font-extrabold text-2xl md:text-3xl tracking-tight drop-shadow-lg">N</span>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight group-hover:text-primary transition-colors duration-300 animate-fade-in-slow drop-shadow-lg">The Nook</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative group bg-[#23272f] hover:bg-blue-500/10 border border-blue-400/30 shadow-lg focus:ring-2 focus:ring-blue-400/60 transition-all duration-200"
            >
              <Link to="/upload" className="flex items-center justify-center">
                <span title="Add Article" className="flex items-center">
                  <Plus className="w-6 h-6 text-blue-300 group-hover:text-blue-400 transition-colors duration-200" />
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black/90 text-blue-100 text-xs font-semibold opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl border border-blue-400/30">
                  Add Article
                </span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              onClick={() => {
                if (!user) navigate("/login");
                else navigate("/mynook");
              }}
              className="relative group bg-[#23272f] hover:bg-yellow-400/10 border border-yellow-400/30 shadow-lg focus:ring-2 focus:ring-yellow-400/60 transition-all duration-200"
            >
              <span className="flex items-center justify-center">
                <span title="Go to My Nook" className="flex items-center">
                  <Book className="w-6 h-6 text-yellow-300 group-hover:text-yellow-400 transition-colors duration-200" />
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black/90 text-yellow-100 text-xs font-semibold opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl border border-yellow-400/30">
                  My Nook
                </span>
              </span>
            </Button>
            {user && userDetails ? (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative group bg-[#23272f] hover:bg-purple-500/10 border border-purple-400/30 shadow-lg focus:ring-2 focus:ring-purple-400/60 transition-all duration-200"
              >
                <Link to="/profile" className="flex items-center justify-center">
                  <span title="Go to your profile" className="flex items-center">
                    <User2 className="w-7 h-7 text-purple-300 group-hover:text-purple-400 transition-colors duration-200" />
                  </span>
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black/90 text-purple-100 text-xs font-semibold opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl border border-purple-400/30">
                    Profile
                  </span>
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative group bg-[#23272f] hover:bg-pink-500/10 border border-pink-400/30 shadow-lg focus:ring-2 focus:ring-pink-400/60 transition-all duration-200"
              >
                <Link to="/login">
                  <span title="Go to your profile" className="flex items-center">
                    <User2 className="w-7 h-7 text-pink-300 group-hover:text-pink-400 transition-colors duration-200" />
                  </span>
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black/90 text-pink-100 text-xs font-semibold opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl border border-pink-400/30">
                    Login
                  </span>
                </Link>
              </Button>
            )}
              {userDetails && userDetails.status === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="relative group bg-[#23272f] hover:bg-yellow-400/10 border border-yellow-400/30 shadow-lg focus:ring-2 focus:ring-yellow-400/60 transition-all duration-200"
                >
                  <Link to="/admin" className="flex items-center justify-center">
                    <span title="Admin Panel" className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-300 group-hover:text-yellow-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636" />
                      </svg>
                    </span>
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black/90 text-yellow-100 text-xs font-semibold opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl border border-yellow-400/30">
                      Admin Panel
                    </span>
                  </Link>
                </Button>
              )}
          </div>

          {/* Mobile Nav: Modern bar with icons, fully responsive, no menu */}
          <div className="md:hidden flex items-center w-full">
            <div className="flex items-center justify-end w-full gap-1 xs:gap-2 px-1 sm:px-2 overflow-hidden h-14 xs:h-16">
              <Button variant="ghost" size="icon" asChild className="bg-[#23272f] hover:bg-primary/20 transition-all duration-200 shadow-lg animate-fade-in-slow focus:ring-2 focus:ring-primary/60 min-w-10 min-h-10 xs:min-w-12 xs:min-h-12">
                <Link to="/upload">
                  <span title="Add Article"><Plus className="w-5 h-5 xs:w-6 xs:h-6 text-white" /></span>
                  <span className="sr-only">Add Article</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild onClick={() => {
                if (!user) navigate("/login");
                else navigate("/mynook");
              }} className="bg-[#23272f] hover:bg-yellow-400/10 border border-yellow-400/30 shadow-lg focus:ring-2 focus:ring-yellow-400/60 min-w-10 min-h-10 xs:min-w-12 xs:min-h-12 transition-all duration-200">
                <span className="flex items-center justify-center">
                  <span title="Go to My Nook"><Book className="w-5 h-5 xs:w-6 xs:h-6 text-yellow-300 group-hover:text-yellow-400 transition-colors duration-200" /></span>
                  <span className="sr-only">My Nook</span>
                </span>
              </Button>
              {user && userDetails ? (
                <Button variant="ghost" size="icon" asChild className="bg-[#23272f] hover:bg-primary/20 transition-all duration-200 shadow-lg animate-fade-in-slow focus:ring-2 focus:ring-primary/60 min-w-10 min-h-10 xs:min-w-12 xs:min-h-12" title="Go to your profile">
                  <Link to="/profile">
                    <span title="Go to your profile"><User2 className="w-6 h-6 xs:w-7 xs:h-7 text-white" /></span>
                    <span className="sr-only">Profile</span>
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="icon" asChild className="bg-[#23272f] hover:bg-primary/20 transition-all duration-200 shadow-lg animate-fade-in-slow focus:ring-2 focus:ring-primary/60 min-w-10 min-h-10 xs:min-w-12 xs:min-h-12">
                  <Link to="/login">
                    <span title="Go to your profile"><User2 className="w-6 h-6 xs:w-7 xs:h-7 text-white" /></span>
                    <span className="sr-only">Login</span>
                  </Link>
                </Button>
              )}
              {/* No menu button, all nav actions are visible */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};