import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckSquare, Plus, Trash2, Maximize2, X, MoreHorizontal, User, UserPlus, Calendar } from 'lucide-react';
import './DashboardWidgets.css';

const COLUMNS = {
    pending: { title: 'To Do', color: '#8892b0' },
    in_progress: { title: 'In Progress', color: '#64ffda' },
    review: { title: 'Review', color: '#e6f1ff' },
    done: { title: 'Done', color: '#a8b2d1' }
};

const KanbanBoard = ({ projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]); // All users for lookup
    const [currentUser, setCurrentUser] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [newTask, setNewTask] = useState('');
    const [mentionQuery, setMentionQuery] = useState(null); // Query string after '@'
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Fetch All Users for mentions
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, 'users'));
                const snapshot = await getDocs(q);
                // Map to simple objects: { name: '...', uid: '...' }
                const userList = snapshot.docs.map(doc => {
                    const d = doc.data();
                    // Fallback name logic
                    let name = d.name || d.displayName || d.email?.split('@')[0] || 'Unknown';
                    return { uid: doc.id, name: name, photoURL: d.photoURL };
                });
                setUsers(userList);
            } catch (err) {
                console.error("Error fetching users for mentions:", err);
            }
        };
        fetchUsers();
    }, []);

    // Fetch Project Tasks
    useEffect(() => {
        if (!projectId) return;

        // Query SHARED project_tasks instead of personal
        const q = query(
            collection(db, 'project_tasks'),
            where('projectId', '==', projectId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`KanbanBoard: Listen for projectId=${projectId}, docs found=${snapshot.docs.length}`);
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side Sort
            fetchedTasks.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setTasks(fetchedTasks);
        });

        return () => unsubscribe();
    }, [projectId]);


    const logActivity = async (action, details) => {
        if (!currentUser || !projectId) return;
        try {
            await addDoc(collection(db, 'project_activity_logs'), {
                projectId,
                action,
                details,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown',
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Activity logging failed", e);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim() || !currentUser || !projectId) return;

        // Parse mentions Logic
        // Simple parser: check if text ends with " @username" or contains it.
        // For robustness, we'll assume the USER selected from the dropdown which inserted the name, 
        // OR we parse the whole string to find known usernames.
        // Logic: Find the LAST mentioned user in the string to assign to, or default to unassigned.

        let assignedTo = null;
        let assignedToName = null;
        let taskText = newTask;

        // Find mentioned user
        // We look for patterns like "@Some Name"
        // Iterate users and see if their name is in the string.
        // This is naive but works for simple cases.
        for (const user of users) {
            if (taskText.includes(`@${user.name}`)) {
                assignedTo = user.uid;
                assignedToName = user.name;
                // cleaner text? Optional.
                break;
            }
        }

        try {
            await addDoc(collection(db, 'project_tasks'), {
                text: taskText,
                status: 'pending',
                projectId: projectId,
                createdBy: currentUser.uid,
                createdByName: currentUser.displayName || currentUser.email?.split('@')[0],
                assignedTo: assignedTo,
                assignedToName: assignedToName,
                dueDate: dueDate || null,
                createdAt: serverTimestamp()
            });

            logActivity('TASK_CREATED', `created task "${taskText.substring(0, 30)}${taskText.length > 30 ? '...' : ''}"`);

            setNewTask('');
            setDueDate('');
            setMentionQuery(null);
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Error adding task: " + error.message);
        }
    };

    const handleDelete = async (task) => {
        await deleteDoc(doc(db, 'project_tasks', task.id));
        logActivity('TASK_DELETED', `deleted task "${task.text.substring(0, 30)}${task.text.length > 30 ? '...' : ''}"`);
    };

    const handleDragStart = (e, task) => {
        setDraggedItem(task);
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.status === targetStatus) return;

        try {
            const taskRef = doc(db, 'project_tasks', draggedItem.id);
            await updateDoc(taskRef, { status: targetStatus });
            logActivity('TASK_UPDATED', `moved task to ${targetStatus.replace('_', ' ')}`);
        } catch (error) {
            console.error("Error moving task:", error);
        }
    };

    // Text Input Handler for Mentions
    const handleInputChange = (e) => {
        const val = e.target.value;
        setNewTask(val);

        // Check for '@' trigger
        const lastAt = val.lastIndexOf('@');
        if (lastAt !== -1) {
            const queryRaw = val.slice(lastAt + 1);
            // Only show menu if no space after @ yet
            if (!queryRaw.includes(' ')) {
                setMentionQuery(queryRaw.toLowerCase());
            } else {
                setMentionQuery(null);
            }
        } else {
            setMentionQuery(null);
        }
    };

    const insertMention = (user) => {
        const lastAt = newTask.lastIndexOf('@');
        const prefix = newTask.slice(0, lastAt);
        setNewTask(`${prefix}@${user.name} `);
        setMentionQuery(null);
        // keep focus? simplify for now
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
                            <div key={task.id} className="flex flex-col gap-1 p-2 bg-white/5 rounded-lg border border-white/5 text-[10px] text-zinc-300">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0`} style={{ background: COLUMNS[task.status]?.color || '#fff' }}></div>
                                    <span className={`truncate flex-1 font-semibold ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.text}</span>
                                </div>
                                <div className="flex items-center justify-between pl-3.5 mt-0.5">
                                    {task.assignedToName ? (
                                        <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                                            <User size={8} /> {task.assignedToName}
                                        </div>
                                    ) : <div />}
                                    {task.dueDate && (
                                        <div className="text-[9px] text-orange-400/90 flex items-center gap-1 font-mono font-bold">
                                            <Calendar size={8} /> {task.dueDate.split('-').slice(1).join('/')}
                                        </div>
                                    )}
                                </div>
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
    const filteredUsers = mentionQuery
        ? users.filter(u => u.name.toLowerCase().includes(mentionQuery))
        : [];

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b0b0b] border border-zinc-800 w-full max-w-7xl h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="text-emerald-500" />
                        <h2 className="text-xl font-bold tracking-tight text-white">Task Force // Shared</h2>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-zinc-800 flex items-center gap-4 bg-[#0b0b0b] relative">
                    <form onSubmit={handleAddTask} className="flex-1 max-w-xl relative flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newTask}
                                onChange={handleInputChange}
                                placeholder="Add a task (type @name to assign)..."
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-4 pr-12 text-sm text-zinc-200 focus:border-emerald-500/50 focus:bg-zinc-900 outline-none transition-all"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-black transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-400 focus:border-emerald-500/50 outline-none transition-all cursor-pointer h-[42px]"
                            title="Set Due Date"
                        />

                        {/* Mention Dropdown */}
                        {mentionQuery !== null && filteredUsers.length > 0 && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[60]">
                                {filteredUsers.map(u => (
                                    <div
                                        key={u.uid}
                                        onClick={() => insertMention(u)}
                                        className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer flex items-center gap-2 text-sm text-zinc-300"
                                    >
                                        <User size={14} />
                                        {u.name}
                                    </div>
                                ))}
                            </div>
                        )}
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

                                            {/* Metadata Row */}
                                            <div className="flex flex-col gap-1.5 mt-2 border-t border-white/5 pt-2">
                                                {/* Assigned To & Due Date */}
                                                <div className="flex items-center justify-between">
                                                    {task.assignedToName ? (
                                                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                                                            <User size={10} />
                                                            <span>To: {task.assignedToName}</span>
                                                        </div>
                                                    ) : <div />}
                                                    {task.dueDate && (
                                                        <div className="flex items-center gap-1 text-orange-400/90 text-[10px] font-mono font-bold bg-orange-500/10 px-1.5 py-0.5 rounded">
                                                            <Calendar size={10} />
                                                            <span>{task.dueDate}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Assigned By (if not same as creator, or just creator) */}
                                                {task.createdByName && task.createdBy !== currentUser?.uid && (
                                                    <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                        <span>From: {task.createdByName}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[10px] text-zinc-600 font-mono">
                                                        {task.createdAt?.seconds ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(task)}
                                                        className="opacity-0 group-hover:opacity-100 text-red-900 hover:text-red-500 transition-all p-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
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
