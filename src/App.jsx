import { useState } from 'react';
import Navbar from './components/Navbar';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Quiz from './pages/Quiz';
import History from './pages/History';
import Login from './pages/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/'); // Optional: redirect to home on logout
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Quiz', path: '/quiz' },
    { name: 'History', path: '/history' },
    { name: 'Profile', path: '/profile' },
    { name: 'Friends', path: '/friends' },
    { name: 'Chat', path: '/chat' },
    { name: 'Search', path: '/search' },
  ];

  return (
    <div className="min-h-screen text-gray-900 dark:text-white font-sans selection:bg-purple-500 selection:text-white">
      <Navbar links={navLinks} isLoggedIn={isLoggedIn} onLogout={handleLogout} />

      <div className="pt-4 px-4 max-w-screen-xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
