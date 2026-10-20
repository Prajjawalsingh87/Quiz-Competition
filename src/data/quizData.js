// Local question bank. Swap this for an API call once the quiz service exists.
export const TOPICS = [
    {
        id: 'general',
        name: 'General Knowledge',
        description: 'A little bit of everything to warm up your brain.',
        color: '#5b4cf0',
        icon: 'globe',
        questions: [
            { q: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], answer: 2, explain: 'Africa, Antarctica, Asia, Australia (Oceania), Europe, North America and South America.' },
            { q: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3, explain: 'The Pacific covers roughly a third of the planet’s surface.' },
            { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], answer: 1, explain: 'Iron oxide (rust) on its surface gives Mars its reddish colour.' },
            { q: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Vincent van Gogh'], answer: 2, explain: 'Leonardo da Vinci painted it in the early 1500s.' },
            { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1, explain: '“Hex” comes from the Greek word for six.' },
        ],
    },
    {
        id: 'science',
        name: 'Science',
        description: 'Atoms, cells and the laws that run the universe.',
        color: '#0ea5e9',
        icon: 'flask',
        questions: [
            { q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2, explain: 'Au comes from the Latin word “aurum”.' },
            { q: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'], answer: 1, explain: 'Mitochondria produce most of the cell’s ATP.' },
            { q: 'Which gas do plants absorb from the air for photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answer: 2, explain: 'Plants turn CO₂ and water into glucose using sunlight.' },
            { q: 'Roughly how fast does light travel in a vacuum?', options: ['300,000 km/s', '30,000 km/s', '3,000 km/s', '3,000,000 km/s'], answer: 0, explain: 'About 299,792 km per second.' },
            { q: 'What is the hardest naturally occurring substance?', options: ['Quartz', 'Granite', 'Diamond', 'Titanium'], answer: 2, explain: 'Diamond scores 10 on the Mohs hardness scale.' },
        ],
    },
    {
        id: 'tech',
        name: 'Technology',
        description: 'Code, the web and the companies that built it.',
        color: '#10b981',
        icon: 'code',
        questions: [
            { q: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Transfer Machine Language', 'Hyperlink Text Management Language', 'Home Tool Markup Language'], answer: 0, explain: 'HTML is the markup language that structures web pages.' },
            { q: 'Which React hook adds local state to a function component?', options: ['useEffect', 'useMemo', 'useState', 'useRef'], answer: 2, explain: 'useState returns the current value and a setter.' },
            { q: 'What does an HTTP 404 status code mean?', options: ['Server error', 'Not found', 'Unauthorized', 'Moved permanently'], answer: 1, explain: 'The server could not find the requested resource.' },
            { q: 'Which company first created JavaScript?', options: ['Microsoft', 'Sun Microsystems', 'Netscape', 'Google'], answer: 2, explain: 'Brendan Eich created it at Netscape in 1995.' },
            { q: 'Which CSS declaration turns an element into a flex container?', options: ['position: flex', 'display: flex', 'flex: container', 'layout: flex'], answer: 1, explain: 'display: flex enables the flexbox layout model.' },
        ],
    },
    {
        id: 'history',
        name: 'History',
        description: 'Empires, revolutions and turning points.',
        color: '#f59e0b',
        icon: 'landmark',
        questions: [
            { q: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'], answer: 2, explain: 'Neil Armstrong stepped onto the Moon on 20 July 1969.' },
            { q: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], answer: 2, explain: 'It ended in 1945 with the surrender of Germany and then Japan.' },
            { q: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Abraham Lincoln'], answer: 1, explain: 'George Washington served from 1789 to 1797.' },
            { q: 'In which year did the Berlin Wall fall?', options: ['1987', '1989', '1991', '1993'], answer: 1, explain: 'The wall fell on 9 November 1989.' },
            { q: 'Which ancient wonder is still standing today?', options: ['Colossus of Rhodes', 'Hanging Gardens of Babylon', 'Lighthouse of Alexandria', 'Great Pyramid of Giza'], answer: 3, explain: 'It is the only one of the Seven Wonders of the Ancient World that survives.' },
        ],
    },
    {
        id: 'geography',
        name: 'Geography',
        description: 'Capitals, mountains, deserts and rivers.',
        color: '#ec4899',
        icon: 'map',
        questions: [
            { q: 'What is the capital city of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 2, explain: 'Canberra was purpose-built as the capital as a compromise between Sydney and Melbourne.' },
            { q: 'Mount Everest is part of which mountain range?', options: ['Andes', 'Himalayas', 'Alps', 'Rockies'], answer: 1, explain: 'Everest sits on the border of Nepal and China in the Himalayas.' },
            { q: 'What is the largest hot desert in the world?', options: ['Sahara', 'Gobi', 'Kalahari', 'Arabian'], answer: 0, explain: 'The Sahara covers about 9 million km² of North Africa.' },
            { q: 'Which country holds the largest share of the Amazon rainforest?', options: ['Peru', 'Colombia', 'Brazil', 'Venezuela'], answer: 2, explain: 'Around 60% of the Amazon lies within Brazil.' },
            { q: 'What is the capital city of Japan?', options: ['Kyoto', 'Osaka', 'Tokyo', 'Hiroshima'], answer: 2, explain: 'Tokyo has been the capital since 1868.' },
        ],
    },
];

export const SECONDS_PER_QUESTION = 20;

export const getTopic = (id) => TOPICS.find((t) => t.id === id);

// Stable topic for a room code, so everyone joining the same room gets the same set.
export const topicForRoom = (code) => {
    const sum = [...code].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return TOPICS[sum % TOPICS.length];
};

export const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};
