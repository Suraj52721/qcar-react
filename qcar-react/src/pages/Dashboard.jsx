import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase'; // Added db import
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    MessageSquare, FolderKanban, Clock,
    Send, LogOut, Video, CheckSquare, Book, Atom, Settings,
    Plus, ChevronDown, Folder, Users, UserPlus, UserMinus, Check, Home, Search, GripHorizontal, Sun, Moon
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

import MyTasks from '../components/dashboard/MyTasks';
import GlobalSearch from '../components/dashboard/GlobalSearch';

// Import CSS for inner widget resets
import './Dashboard.css';

// --- AppBox Component ---
const AppBox = ({ children, title, icon: Icon, span = "col-span-1", className = "", draggable, onDragStart, onDragEnd, onDragOver, onDrop, widgetKey }) => {
    const [isDragHandleActive, setIsDragHandleActive] = useState(false);

    return (
        <div
            className={`${span} bg-[#0d0d0d] border border-zinc-800/60 rounded-[2.5rem] p-6 flex flex-col hover:border-zinc-700/50 transition-all group relative overflow-hidden ${className} ${isDragHandleActive ? 'cursor-grabbing' : ''}`}
            draggable={draggable && isDragHandleActive}
            onDragStart={(e) => draggable && isDragHandleActive && onDragStart(e, widgetKey)}
            onDragEnd={(e) => {
                setIsDragHandleActive(false);
                if (onDragEnd) onDragEnd(e);
            }}
            onDragOver={onDragOver}
            onDrop={(e) => draggable && onDrop(e, widgetKey)}
        >
            <div className="flex items-center gap-2 mb-4 z-10 relative">
                <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-zinc-800 transition-colors text-zinc-400 group-hover:text-white shrink-0">
                    {Icon && <Icon size={14} />}
                </div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 truncate">{title}</h3>

                {draggable && (
                    <div
                        className="ml-auto p-1.5 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-xl transition-colors shrink-0"
                        onMouseEnter={() => setIsDragHandleActive(true)}
                        onMouseLeave={() => setIsDragHandleActive(false)}
                        onTouchStart={() => setIsDragHandleActive(true)}
                        onTouchEnd={() => setIsDragHandleActive(false)}
                        title="Drag to reposition widget"
                    >
                        <GripHorizontal size={16} />
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-hidden relative z-0">{children}</div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Theme Management
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('qcar_theme') || 'dark';
        if (stored === 'light') document.body.classList.add('light-theme');
        return stored;
    });

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('qcar_theme', newTheme);
        if (newTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    };

    // Project State
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // Member management state
    const [allUsers, setAllUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [managingProject, setManagingProject] = useState(null);
    const [managingMembers, setManagingMembers] = useState([]);

    // Widget Configuration mapping
    const WIDGET_CONFIG = {
        research: { title: "Research Focus", icon: Atom, span: "col-span-1 md:col-span-2 row-span-2", component: ({ projectId }) => <ResearchTimeline projectId={projectId} /> },
        chat: { title: "Messenger", icon: MessageSquare, span: "col-span-1 row-span-2", component: () => <Chat /> },
        kanban: { title: "Task Force", icon: CheckSquare, span: "col-span-1 row-span-2", component: ({ projectId }) => <KanbanBoard projectId={projectId} /> },
        mytasks: { title: "Assigned to Me", icon: Check, span: "col-span-1", component: () => <MyTasks /> },
        clock: { title: "Chronometer", icon: Clock, span: "col-span-1", className: "flex flex-col items-center justify-center", component: () => <ClockWidget /> },
        notes: { title: "Lab Notebook", icon: Book, span: "col-span-1", component: ({ projectId }) => <LabNotebook projectId={projectId} /> },
        meeting: {
            title: "Uplink", icon: Video, span: "col-span-1", component: () => (
                <button
                    onClick={() => window.open('https://meet.google.com/yqj-hjme-bau', '_blank')}
                    className="w-full h-full bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-400 transition group/btn"
                >
                    <div className="p-3 bg-zinc-800 rounded-full group-hover/btn:bg-emerald-500 group-hover/btn:text-black transition-colors">
                        <Video size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Start Meeting</span>
                </button>
            )
        },
        docs: { title: "Documents", icon: FolderKanban, span: "col-span-1 md:col-span-2", component: ({ projectId }) => <DocumentRepo projectId={projectId} /> }
    };

    const DEFAULT_LAYOUT = ['research', 'chat', 'kanban', 'mytasks', 'clock', 'notes', 'meeting', 'docs'];

    // Manage layout state
    const [layout, setLayout] = useState(() => {
        const saved = localStorage.getItem('dashboard_layout');
        if (saved) {
            try { return JSON.parse(saved); } catch { return DEFAULT_LAYOUT; }
        }
        return DEFAULT_LAYOUT;
    });

    useEffect(() => {
        localStorage.setItem('dashboard_layout', JSON.stringify(layout));
    }, [layout]);

    const handleDragStart = (e, key) => { e.dataTransfer.setData('widgetKey', key); };
    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDrop = (e, targetKey) => {
        e.preventDefault();
        const sourceKey = e.dataTransfer.getData('widgetKey');
        if (sourceKey === targetKey) return;

        setLayout(prev => {
            const newLayout = [...prev];
            const sourceIdx = newLayout.indexOf(sourceKey);
            const targetIdx = newLayout.indexOf(targetKey);
            // Swap
            newLayout[sourceIdx] = targetKey;
            newLayout[targetIdx] = sourceKey;
            return newLayout;
        });
    };
    const handleDragEnd = () => { };

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

    // Fetch all users for the member picker
    useEffect(() => {
        if (!user) return;

        const fetchUsers = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const usersList = usersSnap.docs.map(d => ({
                    uid: d.id,
                    name: d.data().name || d.data().email || d.id,
                    role: d.data().role || '',
                    photoURL: d.data().photoURL || ''
                }));
                setAllUsers(usersList);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        fetchUsers();
    }, [user]);

    // Fetch Projects (filtered to only show projects where user is a member)
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));

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


    const logActivity = async (action, details, projectId) => {
        if (!user || !projectId) return;
        try {
            await addDoc(collection(db, 'project_activity_logs'), {
                projectId,
                action,
                details,
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || 'Unknown',
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Activity logging failed", e);
        }
    };

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

        // Always include creator in the members list
        const members = [...new Set([user.uid, ...selectedMembers])];

        try {
            const docRef = await addDoc(collection(db, 'projects'), {
                name: newProjectName,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                members: members
            });

            // Auto-switch to new project
            setActiveProject({
                id: docRef.id,
                name: newProjectName,
                createdBy: user.uid,
                members: members
            });

            logActivity('PROJECT_CREATED', `created project "${newProjectName}"`, docRef.id);

            setNewProjectName('');
            setSelectedMembers([]);
            setIsNewProjectModalOpen(false);
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project");
        }
    };

    const toggleMemberSelection = (uid) => {
        setSelectedMembers(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const openManageMembers = (project, e) => {
        e.stopPropagation();
        setManagingProject(project);
        setManagingMembers(project.members || []);
        setIsMembersModalOpen(true);
        setIsProjectDropdownOpen(false);
    };

    const handleUpdateMembers = async () => {
        if (!managingProject) return;
        // Always keep the creator
        const finalMembers = [...new Set([managingProject.createdBy, ...managingMembers])];
        try {
            await updateDoc(doc(db, 'projects', managingProject.id), {
                members: finalMembers
            });

            const addedCount = finalMembers.length - managingProject.members.length;
            if (addedCount > 0) logActivity('MEMBER_ADDED', `added ${addedCount} member(s)`, managingProject.id);
            else if (addedCount < 0) logActivity('MEMBER_REMOVED', `removed ${Math.abs(addedCount)} member(s)`, managingProject.id);

            setIsMembersModalOpen(false);
            setManagingProject(null);
        } catch (error) {
            console.error('Error updating members:', error);
            alert('Failed to update members');
        }
    };

    const toggleManagingMember = (uid) => {
        setManagingMembers(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
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
            <div className="max-w-[1600px] mx-auto mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
                <div className="w-full md:w-auto">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {welcomeMessage}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]">
                                System: Nominal
                            </p>
                        </div>
                        <div className="h-4 w-px bg-zinc-800 hidden md:block"></div>
                        <TeamPresence />
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 md:gap-3 w-full md:w-auto">
                    {/* Project Switcher */}
                    <div className="relative w-full sm:w-auto">
                        <button
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className="p-3 md:p-4 w-full sm:w-auto bg-[#0d0d0d] border border-zinc-800 rounded-2xl md:rounded-3xl text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2 min-w-[200px]"
                            title="Switch Project"
                        >
                            <Folder size={20} className="text-emerald-500 flex-shrink-0" />
                            <span className="text-sm font-bold truncate flex-1 text-left">
                                {activeProject ? activeProject.name : 'Select Project'}
                            </span>
                            <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProjectDropdownOpen && (
                            <div className="absolute top-full right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 bg-[#0d0d0d] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
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
                                            {project.createdBy === user.uid && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => openManageMembers(project, e)}
                                                        className="p-1 hover:bg-emerald-500/20 text-zinc-600 hover:text-emerald-400 rounded-lg transition-colors"
                                                        title="Manage Members"
                                                    >
                                                        <Users size={12} />
                                                    </button>
                                                    {activeProject?.id !== project.id && (
                                                        <button
                                                            onClick={(e) => handleDeleteProject(project.id, e)}
                                                            className="p-1 hover:bg-red-500/20 text-zinc-600 hover:text-red-500 rounded-lg transition-colors"
                                                            title="Delete Project"
                                                        >
                                                            <LogOut size={12} className="rotate-180" />
                                                        </button>
                                                    )}
                                                </div>
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
                        onClick={() => navigate('/')}
                        className="p-3 md:p-4 flex-1 sm:flex-none justify-center bg-[#0d0d0d] border border-zinc-800 rounded-2xl md:rounded-3xl text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2"
                        title="Home"
                    >
                        <span className="text-[10px] md:text-xs font-bold uppercase hidden sm:block">Home</span>
                        <Home size={20} className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => navigate('/chat')}
                        className="p-3 md:p-4 flex-1 sm:flex-none justify-center bg-[#0d0d0d] border border-zinc-800 rounded-2xl md:rounded-3xl text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2"
                        title="Chat"
                    >
                        <span className="text-[10px] md:text-xs font-bold uppercase hidden sm:block">Chat</span>
                        <MessageSquare size={20} className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-3 md:p-4 flex-1 sm:flex-none justify-center bg-[#0d0d0d] border border-zinc-800 rounded-2xl md:rounded-3xl text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2"
                        title="Search"
                    >
                        <span className="text-[10px] md:text-xs font-bold uppercase hidden sm:block">Search</span>
                        <Search size={20} className="w-5 h-5" />
                    </button>

                    {/* Theme Toggle Button added next to search */}
                    <button
                        onClick={toggleTheme}
                        className="p-3 md:p-4 flex-1 sm:flex-none justify-center bg-[#0d0d0d] border border-zinc-800 rounded-2xl md:rounded-3xl text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2"
                        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        <span className="text-[10px] md:text-xs font-bold uppercase hidden sm:block">
                            {theme === 'dark' ? 'Light' : 'Dark'}
                        </span>
                        {theme === 'dark' ? <Sun size={20} className="w-5 h-5" /> : <Moon size={20} className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-3 md:p-4 flex-1 sm:flex-none justify-center bg-[#0d0d0d] border border-zinc-800 rounded-2xl md:rounded-3xl text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition flex items-center gap-2"
                        title="Profile Settings"
                    >
                        <span className="text-[10px] md:text-xs font-bold uppercase hidden sm:block">Settings</span>
                        <Settings size={20} className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-3 md:p-4 flex-1 sm:flex-none justify-center bg-[#0d0d0d] border border-zinc-800 rounded-2xl md:rounded-3xl text-zinc-600 hover:text-red-400 hover:border-red-900 transition flex items-center gap-2"
                        title="Disconnect"
                    >
                        <span className="text-[10px] md:text-xs font-bold uppercase hidden sm:block">Disconnect</span>
                        <LogOut size={20} className="w-5 h-5" />
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

                                {/* Member Picker */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                                        <UserPlus size={14} className="inline mr-1" /> Add Members
                                    </label>
                                    <div className="max-h-48 overflow-y-auto space-y-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2">
                                        {allUsers.filter(u => u.uid !== user?.uid).length === 0 && (
                                            <div className="text-xs text-zinc-600 text-center py-3">No other users found</div>
                                        )}
                                        {allUsers.filter(u => u.uid !== user?.uid).map(u => (
                                            <div
                                                key={u.uid}
                                                onClick={() => toggleMemberSelection(u.uid)}
                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(u.uid)
                                                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                                                    : 'hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {u.photoURL ? (
                                                        <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-zinc-500">{u.name?.charAt(0) || '?'}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white truncate">{u.name}</div>
                                                    {u.role && <div className="text-[10px] text-zinc-500 truncate">{u.role}</div>}
                                                </div>
                                                {selectedMembers.includes(u.uid) && (
                                                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {selectedMembers.length > 0 && (
                                        <div className="text-xs text-emerald-500 mt-2">
                                            {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected + you
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setIsNewProjectModalOpen(false); setSelectedMembers([]); }}
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

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} user={user} />

            {/* Manage Members Modal */}
            <AnimatePresence>
                {isMembersModalOpen && managingProject && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => { setIsMembersModalOpen(false); setManagingProject(null); }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0d0d0d] border border-zinc-800 w-full max-w-md p-6 rounded-3xl shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <Users size={20} className="text-emerald-500" /> Manage Members
                            </h2>
                            <p className="text-xs text-zinc-500 mb-4">Project: {managingProject.name}</p>

                            <div className="max-h-64 overflow-y-auto space-y-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 mb-4">
                                {allUsers.map(u => {
                                    const isCreator = u.uid === managingProject.createdBy;
                                    const isMember = managingMembers.includes(u.uid);
                                    return (
                                        <div
                                            key={u.uid}
                                            onClick={() => !isCreator && toggleManagingMember(u.uid)}
                                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isCreator
                                                ? 'bg-emerald-500/10 border border-emerald-500/20 cursor-default'
                                                : isMember
                                                    ? 'bg-emerald-500/15 border border-emerald-500/30 cursor-pointer'
                                                    : 'hover:bg-white/5 border border-transparent cursor-pointer'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {u.photoURL ? (
                                                    <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-500">{u.name?.charAt(0) || '?'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-white truncate">
                                                    {u.name} {isCreator && <span className="text-[10px] text-emerald-400 ml-1">(Owner)</span>}
                                                </div>
                                                {u.role && <div className="text-[10px] text-zinc-500 truncate">{u.role}</div>}
                                            </div>
                                            {(isMember || isCreator) && (
                                                <Check size={16} className={`flex-shrink-0 ${isCreator ? 'text-emerald-500' : 'text-emerald-400'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-xs text-zinc-500 mb-4">
                                {managingMembers.length} member{managingMembers.length !== 1 ? 's' : ''} in project
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setIsMembersModalOpen(false); setManagingProject(null); }}
                                    className="px-4 py-2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateMembers}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <Check size={16} /> Save
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ProfileSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* BENTO GRID */}
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[280px]">

                {activeProject ? (
                    <>
                        {layout.map(key => {
                            const conf = WIDGET_CONFIG[key];
                            if (!conf) return null;
                            return (
                                <AppBox
                                    key={key}
                                    widgetKey={key}
                                    title={conf.title}
                                    icon={conf.icon}
                                    span={conf.span}
                                    className={conf.className}
                                    draggable={true}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    {conf.component({ projectId: activeProject.id })}
                                </AppBox>
                            );
                        })}
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
