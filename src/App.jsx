import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Swords, History as HistoryIcon, UserRound, Users, MessageCircle, Search as SearchIcon } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Quiz from './pages/Quiz';
import History from './pages/History';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { loadUser, saveUser } from './utils/storage';

const navLinks = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Quiz', path: '/quiz', icon: Swords },
  { name: 'History', path: '/history', icon: HistoryIcon },
  { name: 'Profile', path: '/profile', icon: UserRound },
  { name: 'Friends', path: '/friends', icon: Users },
  { name: 'Chat', path: '/chat', icon: MessageCircle },
  { name: 'Search', path: '/search', icon: SearchIcon },
];

function App() {
  const [user, setUser] = useState(() => loadUser());
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Start every page at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  const handleLogin = (email) => {
    const nextUser = { email, name: email.split('@')[0], joinedAt: new Date().toISOString() };
    setUser(nextUser);
    saveUser(nextUser);
  };

  const handleLogout = () => {
    setUser(null);
    saveUser(null);
    navigate('/');
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift">
        Skip to content
      </a>
      <Navbar links={navLinks} user={user} onLogout={handleLogout} />

      <main id="main" className="container-page flex-1 pt-24 pb-8 sm:pt-28">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
