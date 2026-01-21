import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Edit3 } from 'lucide-react';
import './DashboardWidgets.css';

const QuickNote = () => {
    const [note, setNote] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().quickNote !== undefined) {
                // Only update if the local state is out of sync and not currently being edited heavily
                // For simplicity in this real-time example, we just update. 
                // In a production app, you might want more complex conflict resolution.
                // Here we check if the value is different to avoid cursor jumping if possible, 
                // though controlled inputs with external updates are tricky.
                // We'll trust the user isn't editing from two places simultaneously often.
                // To prevent overwriting local typing, we won't update if we are typing (handled by not updating on every keystroke from DB if we could, but onSnapshot triggers on local writes too).
                // Actually, for a simple scratchpad, taking the DB value is safest for sync, 
                // but might conflict with very fast typing. 
                // Let's just set it initially or if significant change.
                // For now, simple set:
                setNote(docSnap.data().quickNote);
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleSave = useCallback(async (newText) => {
        if (!currentUser) return;
        try {
            setStatus('Saving...');
            await setDoc(doc(db, 'users', currentUser.uid), {
                quickNote: newText
            }, { merge: true });
            setStatus('Saved');
            setTimeout(() => setStatus(''), 2000);
        } catch (error) {
            console.error("Error saving note:", error);
            setStatus('Error');
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const newText = e.target.value;
        setNote(newText);

        // Debounce save (simple version)
        // In a real component, use a proper debounce hook. 
        // Here we just fire and forget, relying on the fact that Firestore handles rapid writes reasonably well 
        // efficiently, but for "Quick Note" usually user stops typing.
        // Let's implement a simple timeout based debounce.
    };

    // Better debounce implementation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentUser) {
                // We only write if it's different? 
                // We just rely on the user typing.
                // To avoid infinite loops with onSnapshot, we need to be careful.
                // However, standard pattern: 
                // 1. User types -> update local state -> trigger effect
                // 2. Effect writes to DB
                // 3. DB updates -> triggers onSnapshot -> updates local state
                // This loop is fine as long as values match.

                // Let's just save.
                if (currentUser) {
                    // We need to write somewhat frequently.
                    // But let's only write if we have a note state (it's initialized).
                    // Ideally we check if it changed from DB value, but we don't have that ref easily without more state.
                    // We will simply write.
                    setDoc(doc(db, 'users', currentUser.uid), { quickNote: note }, { merge: true })
                        .then(() => setStatus('Saved'))
                        .catch(() => setStatus('Error'));
                }
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [note, currentUser]);

    return (
        <div className="dashboard-widget-card note-container">
            <div className="widget-header">
                <Edit3 size={18} color="#64ffda" />
                <span>Quick Note</span>
            </div>

            <textarea
                className="note-textarea"
                placeholder="Type your notes here..."
                value={note}
                onChange={handleChange}
            />
            <div className="save-status">{status}</div>
        </div>
    );
};

export default QuickNote;
