export const questions = [
  { topic: "Web", question: "Which HTML element represents the main page content?", choices: ["<main>", "<span>", "<aside>", "<footer>"], answer: 0, explanation: "<main> identifies the dominant content of the document." },
  { topic: "Web", question: "Which HTTP method is intended to retrieve a resource?", choices: ["POST", "GET", "DELETE", "PATCH"], answer: 1, explanation: "GET retrieves a representation without requesting a state change." },
  { topic: "Web", question: "What does CSS Flexbox primarily control?", choices: ["Database joins", "Network requests", "One-dimensional layout", "HTML parsing"], answer: 2, explanation: "Flexbox lays out items along a main axis, with cross-axis alignment." },
  { topic: "Web", question: "Which hook stores local state in a React component?", choices: ["useEffect", "useRef", "useMemo", "useState"], answer: 3, explanation: "useState returns the current state and a function to update it." },
  { topic: "Web", question: "What makes a form control accessible by name?", choices: ["A linked label", "A larger font", "A CSS class", "A border"], answer: 0, explanation: "A label associated using htmlFor/id gives the control an accessible name." },
  { topic: "Systems", question: "Which data structure processes items first in, first out?", choices: ["Stack", "Queue", "Set", "Heap"], answer: 1, explanation: "A queue removes items in insertion order: FIFO." },
  { topic: "Systems", question: "What is the typical time complexity of binary search on a sorted array?", choices: ["O(n²)", "O(n)", "O(log n)", "O(n log n)"], answer: 2, explanation: "Each comparison halves the remaining search interval." },
  { topic: "Systems", question: "What is the purpose of a database index?", choices: ["Encrypt every row", "Replace backups", "Remove transactions", "Accelerate certain lookups"], answer: 3, explanation: "An index can speed up reads, at a cost in storage and write performance." },
  { topic: "Systems", question: "Which service commonly caches frequently accessed data?", choices: ["Redis", "Git", "Nginx configuration file", "CSS"], answer: 0, explanation: "Redis is an in-memory data store frequently used as a cache." },
  { topic: "Systems", question: "What does an HTTP 503 response indicate?", choices: ["Created resource", "Service unavailable", "Permanent redirect", "Successful request"], answer: 1, explanation: "503 indicates temporary inability to handle a request." },
];
export function readHistory() {
  try {
    const data = JSON.parse(localStorage.getItem("quiz:history"));
    return Array.isArray(data) ? data.filter(r => r && typeof r.id === "string" && typeof r.topic === "string" && Number.isFinite(r.score) && Number.isFinite(r.total) && r.total > 0 && Number.isFinite(Date.parse(r.date))).slice(0, 50) : [];
  } catch { return []; }
}
