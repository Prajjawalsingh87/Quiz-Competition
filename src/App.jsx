import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import History from "./pages/History";

export default function App() {
  return <div className="studio-page">
    <a href="#main" className="skip">Skip to content</a>
    <header className="quiz-header">
      <NavLink className="quiz-brand" to="/">Q<span>Quiz Studio</span></NavLink>
      <nav aria-label="Main"><NavLink to="/" end>Overview</NavLink><NavLink to="/quiz">Practice</NavLink><NavLink to="/history">History</NavLink></nav>
    </header>
    <main id="main" className="quiz-main"><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<section className="quiz-card"><h1>Practice at your pace</h1><p>Accounts, multiplayer rooms and chat are not available in this version. Solo quizzes work without signing in.</p><NavLink className="studio-button studio-primary" to="/quiz">Start a quiz</NavLink></section>} />
    </Routes></main>
    <footer className="quiz-footer">Built by Prajjawal · Progress stays in this browser</footer>
  </div>;
}
