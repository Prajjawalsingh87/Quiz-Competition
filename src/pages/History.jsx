import { useState } from "react";
import { Link } from "react-router-dom";
import { readHistory } from "../data/questions";
export default function History() {
  const [history, setHistory] = useState(readHistory);
  const [message, setMessage] = useState("");
  const clear = () => {
    if (!window.confirm("Clear all quiz results saved in this browser?")) return;
    try { localStorage.removeItem("quiz:history"); setHistory([]); setMessage("History cleared."); }
    catch { setMessage("Could not clear browser storage."); }
  };
  return <section className="quiz-card">
    <p className="quiz-eyebrow">Your learning journal</p><h1>Small steps, visible progress.</h1>
    <div className="studio-toolbar"><Link to="/quiz" className="studio-button studio-primary">Practice again</Link><button className="studio-button" disabled={!history.length} onClick={clear}>Clear history</button></div>
    <p className="studio-note" role="status">{message}</p>
    {!history.length ? <p>No saved results yet. Finish a round and choose Save result.</p> : <div className="quiz-history">{history.map(r => <article key={r.id}><div><strong>{r.topic}</strong><p>{new Date(r.date).toLocaleString()}</p></div><strong>{r.score} / {r.total}</strong></article>)}</div>}
  </section>;
}
