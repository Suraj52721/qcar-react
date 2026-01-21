import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckSquare, Plus, Trash2, Maximize2, X, MoreHorizontal } from 'lucide-react';
import './DashboardWidgets.css';

const COLUMNS = {
    pending: { title: 'To Do', color: '#8892b0' },
    in_progress: { title: 'In Progress', color: '#64ffda' },
    review: { title: 'Review', color: '#e6f1ff' },
    done: { title: 'Done', color: '#a8b2d1' }
};

const KanbanBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        // Migrating old todos to 'pending' status if missing
        const q = query(collection(db, 'users', currentUser.uid, 'todos'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTasks(snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Default to pending if no status, or done if completed was true
                    status: data.status || (data.completed ? 'done' : 'pending')
                };
            }));
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim() || !currentUser) return;

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'todos'), {
                text: newTask,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setNewTask('');
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'users', currentUser.uid, 'todos', id));
    };

    const handleDragStart = (e, task) => {
        setDraggedItem(task);
        e.dataTransfer.effectAllowed = 'move';
        // Make element transparent but keep ghost
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.status === targetStatus) return;

        // Optimistic update locally could be done here, but Firestore is fast enough usually
        if (!currentUser) return;

        try {
            const taskRef = doc(db, 'users', currentUser.uid, 'todos', draggedItem.id);
            await updateDoc(taskRef, { status: targetStatus });
        } catch (error) {
            console.error("Error moving task:", error);
        }
    };

    // Group tasks by status
    const tasksByStatus = tasks.reduce((acc, task) => {
        const s = task.status || 'pending';
        if (!acc[s]) acc[s] = [];
        acc[s].push(task);
        return acc;
    }, { pending: [], in_progress: [], review: [], done: [] });

    // Widget View (Collapsed)
    if (!isExpanded) {
        return (
            <div className="dashboard-widget-card kanban-widget-collapsed">
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {tasks.slice(0, 4).map(task => (
                            <div key={task.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5 text-[10px] text-zinc-300">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0`} style={{ background: COLUMNS[task.status]?.color || '#fff' }}></div>
                                <span className={`truncate flex-1 ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.text}</span>
                            </div>
                        ))}
                        {tasks.length === 0 && <p className="text-zinc-600 text-xs text-center mt-4">No active tasks.</p>}
                    </div>

                    <div className="mt-auto pt-3 border-t border-white/5 flex gap-2">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Maximize2 size={12} /> View Board
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Modal Full View
    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b0b0b] border border-zinc-800 w-full max-w-7xl h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="text-emerald-500" />
                        <h2 className="text-xl font-bold tracking-tight text-white">Task Force // Kanban</h2>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-zinc-800 flex items-center gap-4 bg-[#0b0b0b]">
                    <form onSubmit={handleAddTask} className="flex-1 max-w-lg relative flex items-center">
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-4 pr-12 text-sm text-zinc-200 focus:border-emerald-500/50 focus:bg-zinc-900 outline-none transition-all"
                        />
                        <button type="submit" className="absolute right-2 p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-black transition-colors">
                            <Plus size={16} />
                        </button>
                    </form>
                    <div className="flex gap-4 text-xs text-zinc-500 font-mono">
                        <span>Pending: {tasksByStatus.pending.length}</span>
                        <span>In Progress: {tasksByStatus.in_progress.length}</span>
                        <span>Done: {tasksByStatus.done.length}</span>
                    </div>
                </div>

                {/* Columns */}
                <div className="flex-1 overflow-x-auto p-6">
                    <div className="flex gap-6 h-full min-w-max">
                        {Object.entries(COLUMNS).map(([key, col]) => (
                            <div
                                key={key}
                                className="w-80 flex flex-col bg-zinc-900/30 rounded-2xl border border-zinc-800/50"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, key)}
                            >
                                {/* Column Header */}
                                <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: col.color }}></div>
                                        <h3 className="font-bold text-sm text-zinc-300">{col.title}</h3>
                                        <span className="bg-zinc-800 text-zinc-500 text-[10px] px-2 py-0.5 rounded-full font-mono">
                                            {tasksByStatus[key]?.length || 0}
                                        </span>
                                    </div>
                                    <button className="text-zinc-600 hover:text-zinc-400"><MoreHorizontal size={14} /></button>
                                </div>

                                {/* Task List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
                                    {tasksByStatus[key]?.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task)}
                                            onDragEnd={handleDragEnd}
                                            className="bg-[#111] p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 cursor-grab active:cursor-grabbing shadow-sm group relative"
                                        >
                                            <p className="text-sm text-zinc-300 mb-2 leading-relaxed">{task.text}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-zinc-600 font-mono">
                                                    {task.createdAt?.seconds ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-900 hover:text-red-500 transition-all p-1"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {tasksByStatus[key]?.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-700 text-xs">
                                            Drop here
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default KanbanBoard;
