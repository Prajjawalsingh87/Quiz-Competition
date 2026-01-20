import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const Home = () => {
    return (
        <div className="space-y-12 pb-20">

            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto pt-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                    <Sparkles className="w-4 h-4" />
                    <span>New Generation of Quizzes</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent pb-2">
                    Master Any Topic with <br />
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Precision</span>
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Challenge yourself, complete quests, and track your progress with our intelligent quiz platform. Join friends and compete in real-time.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2">
                        Start Quiz <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-full font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-300">
                        View Leaderboard
                    </button>
                </div>
            </div>

            {/* Feature Grid / Dashboard Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Daily Challenges", desc: "Complete 3 quizzes today to keep your streak." },
                    { title: "Your Progress", desc: "You've mastered 4 topics this week." },
                    { title: "Social Hub", desc: "2 friends are currently online." }
                ].map((card, i) => (
                    <div key={i} className="p-8 bg-white/60 backdrop-blur-lg border border-white/40 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 dark:bg-gray-800/50 dark:border-gray-700 group">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{card.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
