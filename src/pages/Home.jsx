import { Link } from "react-router-dom";
import { readHistory } from "../data/questions";
export default function Home() {
  const history = readHistory();
  const best = history.length ? Math.max(...history.map(r => Math.round(r.score / r.total * 100))) : null;
  return <>
    <section className="quiz-hero">
      <p className="quiz-eyebrow">A little practice. A sharper mind.</p>
      <h1>Make curiosity<br /><span>a daily habit.</span></h1>
      <p>Short quizzes in web development and computer systems. Test what you know, learn from every answer, and see your progress.</p>
      <div className="studio-toolbar"><Link className="studio-button studio-primary" to="/quiz">Start practicing →</Link><Link className="studio-button" to="/history">View your history</Link></div>
    </section>
    <div className="quiz-grid">
      <section className="quiz-card"><span className="quiz-eyebrow">01 / Focus</span><h2>Five questions</h2><p>A focused round with 60 seconds per question. Choose a topic or mix things up.</p></section>
      <section className="quiz-card"><span className="quiz-eyebrow">02 / Learn</span><h2>Understand the why</h2><p>Review every answer and its explanation after each round.</p></section>
      <section className="quiz-card"><span className="quiz-eyebrow">03 / Grow</span><h2>{history.length} rounds completed</h2><p>{best === null ? "Your first result starts your personal history." : `Your best result is ${best}%. Keep building on it.`}</p></section>
    </div>
  </>;
}
