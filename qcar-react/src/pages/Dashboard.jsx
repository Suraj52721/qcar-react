import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase'; // Added db import
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'; // Added Firestore imports
import {
    MessageSquare, FolderKanban, Clock,
    Send, LogOut, Video, CheckSquare, Book, Atom, Settings,
    Plus, ChevronDown, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Project State
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

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

    // Fetch Projects
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'projects'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort
            fetchedProjects.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            console.log("Fetched Projects:", fetchedProjects); // Debug Log

            // If no projects exist, create a default one locally or prompt (we'll auto-create for smoother UX)
            if (fetchedProjects.length === 0 && !snapshot.metadata.hasPendingWrites) {
                // Optional: Auto-create "Main Project" if desired, but for now we handle empty state
            }

            setProjects(fetchedProjects);

            // Set active project if none selected or current one deleted
            if (fetchedProjects.length > 0) {
                setActiveProject(prev => {
                    if (!prev) return fetchedProjects[0];
                    // Check if active project still exists
                    return fetchedProjects.find(p => p.id === prev.id) || fetchedProjects[0];
                });
            } else {
                setActiveProject(null);
            }
        });

        return () => unsubscribe();
    }, [user]);


    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim() || !user) return;

        try {
            const docRef = await addDoc(collection(db, 'projects'), {
                name: newProjectName,
                createdBy: user.uid,
                createdAt: serverTimestamp()
            });

            // Auto-switch to new project
            setActiveProject({
                id: docRef.id,
                name: newProjectName,
                createdBy: user.uid
            });

            setNewProjectName('');
            setIsNewProjectModalOpen(false);
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project");
        }
    };

    const handleDeleteProject = async (projectId, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this project? All associated data will optionally need to be cleaned up.")) return;

        try {
            await deleteDoc(doc(db, 'projects', projectId));
            // Data cleanup hooks would go here or via Cloud Functions
        } catch (error) {
            console.error("Error deleting project:", error);
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
                    {/* Project Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className="p-4 bg-[#0d0d0d] border border-zinc-800 rounded-3xl text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2 min-w-[200px]"
                            title="Switch Project"
                        >
                            <Folder size={20} className="text-emerald-500" />
                            <span className="text-sm font-bold truncate flex-1 text-left">
                                {activeProject ? activeProject.name : 'Select Project'}
                            </span>
                            <ChevronDown size={14} className={`transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProjectDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-[#0d0d0d] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                                    {projects.map(project => (
                                        <div
                                            key={project.id}
                                            onClick={() => { setActiveProject(project); setIsProjectDropdownOpen(false); }}
                                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${activeProject?.id === project.id ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-white/5 text-zinc-400'}`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Folder size={16} />
                                                <span className="text-sm font-medium truncate">{project.name}</span>
                                            </div>
                                            {project.createdBy === user.uid && activeProject?.id !== project.id && (
                                                <button
                                                    onClick={(e) => handleDeleteProject(project.id, e)}
                                                    className="p-1 hover:bg-red-500/20 text-zinc-600 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Delete Project"
                                                >
                                                    <LogOut size={12} className="rotate-180" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {projects.length === 0 && (
                                        <div className="p-4 text-center text-xs text-zinc-600">No projects yet.</div>
                                    )}
                                </div>
                                <div className="p-2 border-t border-zinc-800">
                                    <button
                                        onClick={() => { setIsNewProjectModalOpen(true); setIsProjectDropdownOpen(false); }}
                                        className="w-full p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Plus size={14} /> New Project
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

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

            {/* New Project Modal */}
            <AnimatePresence>
                {isNewProjectModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0d0d0d] border border-zinc-800 w-full max-w-md p-6 rounded-3xl shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
                            <form onSubmit={handleCreateProject}>
                                <input
                                    type="text"
                                    placeholder="Project Name"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white mb-4 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewProjectModalOpen(false)}
                                        className="px-4 py-2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl transition-colors"
                                    >
                                        Create Project
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ProfileSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* BENTO GRID */}
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[280px]">

                {activeProject ? (
                    <>
                        {/* 1. RESEARCH TIMELINE (Double Wide, Double Tall) */}
                        <AppBox title="Research Focus" icon={Atom} span="md:col-span-2 md:row-span-2">
                            <ResearchTimeline projectId={activeProject.id} />
                        </AppBox>

                        {/* 2. MESSENGER (Single Wide, Double Tall) - GLOBAL CHAT (No projectId) */}
                        <AppBox title="Messenger" icon={MessageSquare} span="md:col-span-1 md:row-span-2">
                            <Chat />
                        </AppBox>

                        {/* 3. TODO LIST (Single Wide, Double Tall) */}
                        <AppBox title="Task Force" icon={CheckSquare} span="md:col-span-1 md:row-span-2">
                            <KanbanBoard projectId={activeProject.id} />
                        </AppBox>

                        {/* 4. CLOCK (Single Wide, Single Tall) */}
                        <AppBox title="Chronometer" icon={Clock} className="flex flex-col items-center justify-center">
                            <ClockWidget />
                        </AppBox>

                        {/* 5. NOTES (Single Wide, Single Tall) */}
                        <AppBox title="Lab Notebook" icon={Book}>
                            <LabNotebook projectId={activeProject.id} />
                        </AppBox>

                        {/* 6. MEETING (Single Wide, Single Tall) */}
                        <AppBox title="Uplink" icon={Video}>
                            <button
                                onClick={() => window.open('https://meet.google.com/yqj-hjme-bau', '_blank')}
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
                            <DocumentRepo projectId={activeProject.id} />
                        </AppBox>
                    </>
                ) : (
                    <div className="col-span-1 md:col-span-4 row-span-2 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-[2.5rem] bg-[#0d0d0d]/50 p-10 text-center">
                        <Folder size={48} className="text-zinc-700 mb-4" />
                        <h2 className="text-2xl font-bold text-zinc-300">No Project Selected</h2>
                        <p className="text-zinc-500 mb-6">Create or select a project to view the dashboard.</p>
                        <button
                            onClick={() => setIsNewProjectModalOpen(true)}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} /> Create First Project
                        </button>
                    </div>
                )}


            </div>
        </div>
    );
};

export default Dashboard;
