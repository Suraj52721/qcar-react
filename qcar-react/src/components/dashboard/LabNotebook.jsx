import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore'; // Added where
import { Book, Maximize2, X, Plus, Save, FileText, Printer, Trash2 } from 'lucide-react';
import './DashboardWidgets.css';

const LabNotebook = ({ projectId }) => { // Accept projectId
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!projectId) return;

        const q = query(
            collection(db, 'research_notes'),
            where('projectId', '==', projectId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedNotes.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            setNotes(fetchedNotes);
        });
        return () => unsubscribe();
    }, [projectId]);

    const handleSave = async () => {
        if ((!currentNote.title && !currentNote.content) || !projectId) return;
        setIsSaving(true);
        try {
            const noteData = {
                title: currentNote.title || 'Untitled Note',
                content: currentNote.content,
                updatedAt: serverTimestamp()
            };

            if (currentNote.id) {
                await updateDoc(doc(db, 'research_notes', currentNote.id), noteData);
            } else {
                const docRef = await addDoc(collection(db, 'research_notes'), {
                    ...noteData,
                    projectId: projectId, // Save with project ID
                    createdAt: serverTimestamp()
                });
                setCurrentNote(prev => ({ ...prev, id: docRef.id }));
            }
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNew = () => {
        setCurrentNote({ title: '', content: '' });
    };

    const handleDelete = async () => {
        if (!currentNote.id) return;
        if (!window.confirm("Are you sure you want to delete this note? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'research_notes', currentNote.id));
            handleNew();
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    const handlePrint = () => {
        const printContent = `
            <html>
                <head>
                    <title>${currentNote.title}</title>
                    <style>
                        body { font-family: sans-serif; padding: 2rem; color: #000; }
                        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
                        pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <h1>${currentNote.title || 'Untitled Note'}</h1>
                    <p style="color: #666; font-size: 0.8rem;">${new Date().toLocaleString()}</p>
                    <div style="white-space: pre-wrap;">${currentNote.content}</div>
                </body>
            </html>
        `;
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    // Widget View (Collapsed)
    if (!isExpanded) {
        return (
            <div className="dashboard-widget-card notebook-widget-collapsed">
                <div className="h-full flex flex-col gap-2">
                    {notes.slice(0, 3).map(note => (
                        <div key={note.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-colors group" onClick={() => { setCurrentNote(note); setIsExpanded(true); }}>
                            <div className="flex items-center gap-2 mb-1">
                                <FileText size={12} className="text-emerald-500" />
                                <span className="text-xs font-bold text-zinc-300 truncate">{note.title || 'Untitled'}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 line-clamp-1">{note.content || 'Empty note...'}</p>
                        </div>
                    ))}
                    <button
                        onClick={() => { handleNew(); setIsExpanded(true); }}
                        className="mt-auto w-full py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> New Entry
                    </button>
                </div>
            </div>
        );
    }

    // Full Modal View
    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d0d] border border-zinc-800 w-full max-w-5xl h-[85vh] rounded-3xl flex overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">

                {/* Sidebar List */}
                <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <span className="text-sm font-bold tracking-wider text-zinc-400 uppercase">Entries</span>
                        <button onClick={handleNew} className="p-2 hover:bg-white/5 rounded-lg text-emerald-500 transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => setCurrentNote(note)}
                                className={`p-3 rounded-xl cursor-pointer transition-all ${currentNote.id === note.id ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-100' : 'hover:bg-white/5 text-zinc-400 border border-transparent'}`}
                            >
                                <div className="font-semibold text-sm truncate">{note.title || 'Untitled'}</div>
                                <div className="text-[10px] opacity-60 mt-1">{new Date(note.updatedAt?.seconds * 1000).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col bg-[#0d0d0d]">
                    {/* Toolbar */}
                    <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
                        <input
                            type="text"
                            value={currentNote.title}
                            onChange={(e) => setCurrentNote(curr => ({ ...curr, title: e.target.value }))}
                            placeholder="Experiment Title / Date..."
                            className="bg-transparent border-none outline-none text-xl font-bold text-white placeholder-zinc-700 w-full mr-4"
                        />
                        <div className="flex items-center gap-3">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white text-xs border border-zinc-800 transition-colors">
                                <Printer size={14} /> Export PDF
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={!currentNote.id}
                                className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Delete Note"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-black font-bold text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
                            >
                                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Notes'}
                            </button>
                            <div className="w-px h-6 bg-zinc-800 mx-2"></div>
                            <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-zinc-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Editor Pane (Simple Textarea for now, Markdown styling support implied via font) */}
                    <div className="flex-1 relative">
                        <textarea
                            value={currentNote.content}
                            onChange={(e) => setCurrentNote(curr => ({ ...curr, content: e.target.value }))}
                            placeholder="# Observation Log&#10;&#10;- Initial conditions set...&#10;- Beam stability confirmed at 98%..."
                            className="w-full h-full bg-transparent p-8 text-zinc-300 font-mono text-sm outline-none resize-none leading-relaxed selection:bg-emerald-500/30"
                            spellCheck={false}
                        />
                    </div>

                    {/* Status Bar */}
                    <div className="h-8 border-t border-zinc-800 flex items-center px-4 text-[10px] text-zinc-600 font-mono">
                        <span className="uppercase tracking-widest">Lab Notebook v1.0 • Connected to Secure Storage</span>
                        <div className="ml-auto flex gap-4">
                            <span>Ln {currentNote.content.split('\n').length}, Col {currentNote.content.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LabNotebook;
