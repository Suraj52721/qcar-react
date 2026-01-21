import React, { useState, useEffect } from 'react';
import { rtdb, auth } from '../../lib/firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { Users } from 'lucide-react';

const TeamPresence = () => {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [showList, setShowList] = useState(false);

    // 1. Monitor Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // 2. Handle Presence Logic
    useEffect(() => {
        if (!currentUser || !rtdb) return;

        try {
            const userStatusDatabaseRef = ref(rtdb, '/status/' + currentUser.uid);
            const isOfflineForDatabase = {
                state: 'offline',
                last_changed: serverTimestamp(),
            };
            const isOnlineForDatabase = {
                state: 'online',
                last_changed: serverTimestamp(),
                name: currentUser.displayName || currentUser.email
            };

            const connectedRef = ref(rtdb, '.info/connected');

            const unsubscribe = onValue(connectedRef, (snapshot) => {
                if (snapshot.val() === false) {
                    return;
                };

                onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                    set(userStatusDatabaseRef, isOnlineForDatabase);
                });
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Presence connection failed:", error);
        }
    }, [currentUser]);

    // 3. Monitor All Users Status
    useEffect(() => {
        if (!rtdb) return;

        const allStatusRef = ref(rtdb, '/status');
        const unsubscribe = onValue(allStatusRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const users = Object.values(data).filter(user => user.state === 'online');
                setOnlineUsers(users);
            } else {
                setOnlineUsers([]);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowList(true)}
            onMouseLeave={() => setShowList(false)}
        >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full cursor-help">
                <div className="relative">
                    <Users size={14} className="text-zinc-400" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0d0d0d]"></span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    {onlineUsers.length} Online
                </span>
            </div>

            {/* User List Dropdown */}
            {showList && onlineUsers.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0d0d0d] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Researchers</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                        {onlineUsers.map((user, idx) => (
                            <div key={idx} className="px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-900 rounded-lg transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-zinc-300 truncate font-mono">
                                    {user.name || 'Unknown Agent'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPresence;
