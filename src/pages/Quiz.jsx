import React, { useState } from 'react';
import { Plus, Users, Link as LinkIcon, ArrowRight, Play } from 'lucide-react';

const Quiz = () => {
    const [roomId, setRoomId] = useState('');

    const handleCreateRoom = () => {
        // Generate random room ID logic or API call would go here
        alert("Room created! (Mock action)");
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (roomId.trim()) {
            // Logic to validate and join room
            alert(`Joining room: ${roomId} (Mock action)`);
        }
    };

    return (
        <div className="pt-24 px-4 pb-12 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    Ready to Compete?
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Create your own quiz room or join a friend's challenge.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                {/* Card 1: Create Quiz */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Create a Room</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Host a new quiz game. Choose your topics, set the rules, and invite your friends to compete in real-time.
                    </p>
                    <button
                        onClick={handleCreateRoom}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        Create New Quiz <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Card 2: Join Quiz */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                        <Users className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Join a Room</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Have a room ID or invite link? Enter it below to jump straight into the action.
                    </p>

                    <form onSubmit={handleJoinRoom} className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <LinkIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                placeholder="Enter Room ID or Link"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            Join Game <Play className="w-4 h-4 fill-current" />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Quiz;
