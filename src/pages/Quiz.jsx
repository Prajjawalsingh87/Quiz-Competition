import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { questions, readHistory } from "../data/questions";

export default function Quiz() {
  const [topic, setTopic] = useState("Mixed");
  const [round, setRound] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [seconds, setSeconds] = useState(60);
  const [saved, setSaved] = useState("");
  const deadline = useRef(0);
  const answered = useRef(false);
  const index = answers.length;
  const finished = round && index === round.length;
  const score = round ? answers.filter((a, i) => a === round[i].answer).length : 0;

  useEffect(() => {
    if (!round || finished) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (!remaining && !answered.current) {
        answered.current = true;
        setAnswers(prev => [...prev, null]);
        setSelected(null);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [round, finished, index]);

  useEffect(() => {
    if (!round || finished) return;
    deadline.current = Date.now() + 60000;
    answered.current = false;
  }, [round, finished, index]);

  const start = () => {
    const pool = questions.filter(q => topic === "Mixed" || q.topic === topic).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setAnswers([]); setSelected(null); setSeconds(60); setSaved("");
    setRound(pool.slice(0, 5));
  };
  const next = () => {
    if (answered.current || selected === null) return;
    answered.current = true;
    setAnswers(prev => [...prev, selected]);
    setSelected(null); setSeconds(60);
  };
  const save = () => {
    if (saved) return;
    const result = { id: crypto.randomUUID(), date: new Date().toISOString(), topic, score, total: round.length };
    try {
      localStorage.setItem("quiz:history", JSON.stringify([result, ...readHistory()].slice(0, 50)));
      setSaved("Result saved on this device.");
    } catch { setSaved("Browser storage is unavailable. Your result is shown below but could not be saved."); }
  };

  if (!round) return <section className="quiz-card quiz-focus">
    <p className="quiz-eyebrow">Your next five minutes</p><h1>Choose your challenge.</h1>
    <p>Five questions. One minute each. No sign-in needed.</p>
    <label htmlFor="topic">Topic</label>
    <select id="topic" className="studio-input" value={topic} onChange={e => setTopic(e.target.value)}>{["Mixed", "Web", "Systems"].map(t => <option key={t}>{t}</option>)}</select>
    <button className="studio-button studio-primary" onClick={start}>Start quiz →</button>
  </section>;
  if (finished) return <section className="quiz-card quiz-focus">
    <p className="quiz-eyebrow">Round complete</p><h1>{score} / {round.length}</h1><p>Every answer is a chance to learn.</p>
    <div className="studio-toolbar"><button className="studio-button studio-primary" onClick={save} disabled={!!saved}>Save result</button><button className="studio-button" onClick={() => setRound(null)}>Practice again</button><Link className="studio-button" to="/history">History</Link></div>
    <p role="status" className="studio-note">{saved}</p>
    {round.map((q, i) => <article className="quiz-review" key={q.question}><h2>{i + 1}. {q.question}</h2><p className={answers[i] === q.answer ? "quiz-correct" : "quiz-incorrect"}>Your answer: {answers[i] === null ? "Time expired" : q.choices[answers[i]]}</p><p><strong>Correct:</strong> {q.choices[q.answer]}</p><p>{q.explanation}</p></article>)}
  </section>;
  const q = round[index];
  return <section className="quiz-card quiz-focus">
    <div className="quiz-meta"><span>Question {index + 1} of {round.length}</span><span role="timer" aria-label="Seconds remaining">{seconds}s</span></div>
    <progress aria-label="Quiz progress" value={index} max={round.length} />
    <h1>{q.question}</h1>
    <div className="quiz-answers">{q.choices.map((choice, i) => <button key={choice} className="studio-button" aria-pressed={selected === i} onClick={() => setSelected(i)}>{String.fromCharCode(65 + i)}. {choice}</button>)}</div>
    <button className="studio-button studio-primary" disabled={selected === null} onClick={next}>{index === round.length - 1 ? "See results" : "Next question →"}</button>
  </section>;
}
