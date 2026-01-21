import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
    MessageSquare, FolderKanban, Clock,
    Send, LogOut, Video, CheckSquare, Book, Atom, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import existing widgets
import Chat from '../components/dashboard/Chat';
import ClockWidget from '../components/dashboard/Clock';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import ResearchTimeline from '../components/dashboard/ResearchTimeline';
import LabNotebook from '../components/dashboard/LabNotebook';
import DocumentRepo from '../components/dashboard/DocumentRepo';
import TeamPresence from '../components/dashboard/TeamPresence';

import ProfileSettings from '../components/dashboard/ProfileSettings';

// Import CSS for inner widget resets
import './Dashboard.css';

// --- AppBox Component ---
const AppBox = ({ children, title, icon: Icon, span = "col-span-1", className = "" }) => (
    <div className={`${span} bg-[#0d0d0d] border border-zinc-800/60 rounded-[2.5rem] p-6 flex flex-col hover:border-zinc-700/50 transition-all group relative overflow-hidden ${className}`}>
        <div className="flex items-center gap-2 mb-4 z-10 relative">
            <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-zinc-800 transition-colors text-zinc-400 group-hover:text-white">
                {Icon && <Icon size={14} />}
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">{title}</h3>
        </div>
        <div className="flex-1 overflow-hidden relative z-0">{children}</div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [time, setTime] = useState(new Date());
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/login');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const welcomeMessage = useMemo(() => {
        const hr = new Date().getHours();
        const greets = [
            ["Night shift.", "System Active."], ["Morning.", "Systems Online."],
            ["Deep work.", "Focus Mode."], ["Afternoon.", "Processing."],
            ["Evening.", "Data Sync."], ["Night.", "Standby."]
        ];
        const greet = greets[Math.floor(hr / 4)][0];
        const name = user?.displayName || user?.email?.split('@')[0] || "Researcher";
        return `${greet} Welcome back, ${name}.`;
    }, [user]);

    if (!user) return null; // Or loading spinner

    return (
        <div className="min-h-screen bg-black text-zinc-300 p-6 md:p-10 font-space">
            {/* HEADER */}
            <div className="max-w-[1600px] mx-auto mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-white text-4xl font-light tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {welcomeMessage}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]">
                                System: Nominal
                            </p>
                        </div>
                        <div className="h-4 w-px bg-zinc-800"></div>
                        <TeamPresence />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-4 bg-[#0d0d0d] border border-zinc-800 rounded-3xl text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2"
                        title="Profile Settings"
                    >
                        <span className="text-xs font-bold uppercase hidden md:block">Settings</span>
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-4 bg-[#0d0d0d] border border-zinc-800 rounded-3xl text-zinc-600 hover:text-red-400 hover:border-red-900 transition flex items-center gap-2"
                        title="Disconnect"
                    >
                        <span className="text-xs font-bold uppercase hidden md:block">Disconnect</span>
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            <ProfileSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* BENTO GRID */}
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[280px]">

                {/* 1. RESEARCH TIMELINE (Double Wide, Double Tall) */}
                <AppBox title="Research Focus" icon={Atom} span="md:col-span-2 md:row-span-2">
                    {/* ResearchTimeline handles its own layout, we just provide the space */}
                    <ResearchTimeline />
                </AppBox>

                {/* 2. MESSENGER (Single Wide, Double Tall) */}
                <AppBox title="Messenger" icon={MessageSquare} span="md:col-span-1 md:row-span-2">
                    <Chat />
                </AppBox>

                {/* 3. TODO LIST (Single Wide, Double Tall) */}
                <AppBox title="Task Force" icon={CheckSquare} span="md:col-span-1 md:row-span-2">
                    <KanbanBoard />
                </AppBox>

                {/* 4. CLOCK (Single Wide, Single Tall) */}
                <AppBox title="Chronometer" icon={Clock} className="flex flex-col items-center justify-center">
                    <ClockWidget />
                </AppBox>

                {/* 5. NOTES (Single Wide, Single Tall) */}
                <AppBox title="Lab Notebook" icon={Book}>
                    <LabNotebook />
                </AppBox>

                {/* 6. MEETING (Single Wide, Single Tall) */}
                <AppBox title="Uplink" icon={Video}>
                    <button
                        onClick={() => window.open('https://meet.new', '_blank')}
                        className="w-full h-full bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-400 transition group/btn"
                    >
                        <div className="p-3 bg-zinc-800 rounded-full group-hover/btn:bg-emerald-500 group-hover/btn:text-black transition-colors">
                            <Video size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Start Meeting</span>
                    </button>
                </AppBox>


                {/* 7. DOCUMENT REPO (Double Wide, Single Tall) */}
                <AppBox title="Documents" icon={FolderKanban} span="md:col-span-1">
                    <DocumentRepo />
                </AppBox>


            </div>
        </div>
    );
};

export default Dashboard;
