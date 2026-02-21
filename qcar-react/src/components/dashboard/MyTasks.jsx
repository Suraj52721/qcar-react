import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Check, CheckSquare, Calendar, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        // Query all tasks assigned to me, across all projects
        const q = query(
            collection(db, 'project_tasks'),
            where('assignedTo', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Filter out 'done' since they are completed
            fetchedTasks = fetchedTasks.filter(t => t.status !== 'done');
            // Sort by due date, then created
            fetchedTasks.sort((a, b) => {
                if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
                if (a.dueDate) return -1;
                if (b.dueDate) return 1;
                return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            });
            setTasks(fetchedTasks);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleComplete = async (taskId) => {
        try {
            await updateDoc(doc(db, 'project_tasks', taskId), { status: 'done' });
        } catch (e) {
            console.error("Error completing task", e);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="h-full flex flex-col overflow-y-auto no-scrollbar pr-2 space-y-3 relative font-space">
            {tasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm opacity-50">
                    <CheckSquare size={32} className="mb-2" />
                    <p>No assigned tasks</p>
                </div>
            ) : (
                <AnimatePresence>
                    {tasks.map((task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-black border border-zinc-800 rounded-xl p-3 hover:border-emerald-500/30 transition-colors shadow-lg group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    <button
                                        onClick={() => handleComplete(task.id)}
                                        className="w-4 h-4 rounded border border-zinc-500 flex items-center justify-center text-transparent hover:border-emerald-500 hover:text-emerald-500 transition-colors focus:outline-none"
                                        title="Mark as Done"
                                    >
                                        <Check size={12} strokeWidth={3} />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-zinc-200 leading-snug">{task.text}</p>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        {task.dueDate && (
                                            <div className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded font-mono font-bold">
                                                <Calendar size={10} />
                                                <span>{task.dueDate}</span>
                                            </div>
                                        )}
                                        {task.projectId && (
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium tracking-wide">
                                                <Folder size={10} />
                                                <span>{task.status.replace('_', ' ').toUpperCase()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>
    );
};

export default MyTasks;
