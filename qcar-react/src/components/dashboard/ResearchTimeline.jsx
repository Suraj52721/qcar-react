import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import './DashboardWidgets.css';

const ResearchTimeline = () => {
    const [events, setEvents] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [newItem, setNewItem] = useState({
        title: '',
        date: '',
        status: 'pending', // completed, in-progress, pending
        tags: ''
    });

    useEffect(() => {
        // Fetch ALL items without filtering/sorting at DB level to ensure we see everything
        const q = query(collection(db, 'project_timeline'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side to handle missing fields gracefully
            loadedEvents.sort((a, b) => {
                const dateA = a.dateOrder || '9999-99-99';
                const dateB = b.dateOrder || '9999-99-99';
                return dateA.localeCompare(dateB);
            });

            setEvents(loadedEvents);
        });
        return () => unsubscribe();
    }, []);

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.title) return;

        try {
            await addDoc(collection(db, 'project_timeline'), {
                title: newItem.title,
                dateDisplay: newItem.date,
                dateOrder: newItem.date || new Date().toISOString().split('T')[0],
                status: newItem.status,
                tags: newItem.tags ? newItem.tags.split(',').map(t => t.trim()).filter(t => t) : [],
                createdAt: serverTimestamp()
            });
            setIsAdding(false);
            setNewItem({ title: '', date: '', status: 'pending', tags: '' });
        } catch (error) {
            console.error("Error adding timeline item:", error);
            // Alert the user to the specific error (likely permissions)
            alert("Failed to add milestone: " + error.message + "\n\nPlease check if your Firestore Security Rules allow writing to 'project_timeline'.");
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent potentially triggering other click handlers
        if (!window.confirm("Are you sure you want to delete this milestone?")) return;

        try {
            await deleteDoc(doc(db, 'project_timeline', id));
        } catch (error) {
            console.error("Error deleting timeline item:", error);
            alert("Failed to delete milestone: " + error.message);
        }
    };


    return (
        <div className="dashboard-widget-card timeline-widget" style={{ minHeight: '400px', overflow: 'hidden', position: 'relative' }}>
            {/* Floating Add Button */}
            <button className="timeline-add-btn" onClick={() => setIsAdding(true)}>
                <Plus size={14} /> Add Step
            </button>

            <div className="timeline-container">
                <div className="timeline-line-center" style={{ width: `${Math.max(100, events.length * 20)}%` }}></div>

                <div className="timeline-items">
                    <AnimatePresence>
                        {events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                transition={{ delay: index * 0.1 }}
                                className={`timeline-item ${index % 2 === 0 ? 'top' : 'bottom'} ${event.status}`}
                            >
                                <div className="timeline-node"></div>
                                <div className={`timeline-content ${event.status} group relative`}>
                                    <button
                                        onClick={(e) => handleDelete(event.id, e)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500"
                                        title="Delete Milestone"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="timeline-date">{event.dateDisplay}</div>
                                    <h4 className="timeline-title">{event.title}</h4>
                                    <div className="timeline-tags">
                                        {event.tags?.map((tag, i) => (
                                            <span key={i} className="timeline-tag">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {events.length === 0 && (
                        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', color: '#8892b0', textAlign: 'center', width: '100%', pointerEvents: 'none' }}>
                            No milestones yet. Click "Add Step" to begin.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Item Modal - Rendered via Portal to avoid z-index/overflow issues */}
            {isAdding && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Add Milestone</h3>
                        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ color: '#8892b0', fontSize: '0.8rem' }}>Milestone Title</label>
                                <input
                                    type="text"
                                    className="todo-input"
                                    style={{ width: '100%' }}
                                    placeholder="e.g. Simulation Results"
                                    value={newItem.title}
                                    onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#8892b0', fontSize: '0.8rem' }}>Date</label>
                                    <input
                                        type="date"
                                        className="todo-input"
                                        style={{ width: '100%' }}
                                        value={newItem.date}
                                        onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#8892b0', fontSize: '0.8rem' }}>Status</label>
                                    <select
                                        className="todo-input"
                                        style={{ width: '100%' }}
                                        value={newItem.status}
                                        onChange={e => setNewItem({ ...newItem, status: e.target.value })}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ color: '#8892b0', fontSize: '0.8rem' }}>Tags (comma separated)</label>
                                <input
                                    type="text"
                                    className="todo-input"
                                    style={{ width: '100%' }}
                                    placeholder="e.g. Lab, Theory"
                                    value={newItem.tags}
                                    onChange={e => setNewItem({ ...newItem, tags: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="start-meet-btn">Add Milestone</button>
                                <button type="button" className="modal-close-btn" onClick={() => setIsAdding(false)} style={{ marginTop: 0 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ResearchTimeline;
