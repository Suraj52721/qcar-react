import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, X, Folder, CheckSquare, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalSearch = ({ isOpen, onClose, user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState({ projects: [], tasks: [], docs: [] });
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        } else {
            setSearchQuery('');
            setResults({ projects: [], tasks: [], docs: [] });
        }
    }, [isOpen]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                performSearch(searchQuery.trim().toLowerCase());
            } else {
                setResults({ projects: [], tasks: [], docs: [] });
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const performSearch = async (term) => {
        if (!user) return;
        setLoading(true);
        try {
            // First get projects user is part of
            const projQ = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));
            const projSnap = await getDocs(projQ);
            const myProjects = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Next get ALL tasks and docs to filter client-side (acceptable for prototype scale)
            const taskQ = query(collection(db, 'project_tasks'));
            const taskSnap = await getDocs(taskQ);
            const allTasks = taskSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const docQ = query(collection(db, 'documents'));
            const docSnap = await getDocs(docQ);
            const allDocs = docSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const myProjectIds = myProjects.map(p => p.id);

            const filteredProjects = myProjects.filter(p => p.name.toLowerCase().includes(term));
            const filteredTasks = allTasks.filter(t => myProjectIds.includes(t.projectId) && (t.text?.toLowerCase().includes(term) || t.assignedToName?.toLowerCase().includes(term)));
            const filteredDocs = allDocs.filter(d => myProjectIds.includes(d.projectId) && d.name?.toLowerCase().includes(term));

            setResults({
                projects: filteredProjects,
                tasks: filteredTasks,
                docs: filteredDocs
            });

        } catch (e) {
            console.error("Search error", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-start justify-center pt-[10vh] px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-[#0d0d0d] border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/50">
                        <Search className="text-zinc-500 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects, tasks, documents..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 font-space text-lg"
                        />
                        <button onClick={onClose} className="p-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 rounded transition font-mono border border-zinc-700">ESC</button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar font-space p-2">
                        {loading && <div className="p-8 text-center text-zinc-500 animate-pulse">Searching the matrix...</div>}

                        {!loading && searchQuery.trim().length > 1 && results.projects.length === 0 && results.tasks.length === 0 && results.docs.length === 0 && (
                            <div className="p-8 text-center text-zinc-500">No results found for "{searchQuery}"</div>
                        )}

                        {!loading && searchQuery.trim().length <= 1 && (
                            <div className="p-8 text-center text-zinc-600 text-sm">Type at least 2 characters to search across your workspace.</div>
                        )}

                        {!loading && (results.projects.length > 0 || results.tasks.length > 0 || results.docs.length > 0) && (
                            <div className="p-2 space-y-6 pb-8">
                                {results.projects.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">Projects</h3>
                                        <div className="space-y-1">
                                            {results.projects.map(p => (
                                                <div key={p.id} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-zinc-900/80 rounded-xl cursor-pointer transition border border-transparent hover:border-zinc-800 group">
                                                    <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-zinc-400 transition">
                                                        <Folder size={16} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition">{p.name}</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.tasks.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">Task Force</h3>
                                        <div className="space-y-1">
                                            {results.tasks.map(t => (
                                                <div key={t.id} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-zinc-900/80 rounded-xl cursor-pointer transition border border-transparent hover:border-zinc-800 group">
                                                    <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-zinc-400 transition">
                                                        <CheckSquare size={16} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-zinc-200 group-hover:text-emerald-400 transition">{t.text}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${t.status === 'done' ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                                {t.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                            {t.assignedToName && <span className="text-[9px] text-zinc-500">To: {t.assignedToName}</span>}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.docs.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">Documents</h3>
                                        <div className="space-y-1">
                                            {results.docs.map(d => (
                                                <div key={d.id} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-zinc-900/80 rounded-xl cursor-pointer transition border border-transparent hover:border-zinc-800 group">
                                                    <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-zinc-400 transition">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition">{d.name}</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default GlobalSearch;
