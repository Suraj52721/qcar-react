import React, { createContext, useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export const GlobalNotificationContext = createContext();

export const GlobalNotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [unreadMessages, setUnreadMessages] = useState([]);

    // We use a ref to track if this is the first load of the listener
    // so we don't spam notifications for existing unread messages when the app first opens
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (!user) return;

        // Request Browser Notification Permission securely
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        let unsubscribes = [];

        const setupListeners = async () => {
            try {
                // 1. Fetch all users to construct valid chatIds
                const usersSnap = await getDocs(collection(db, 'users'));

                const validChatIds = usersSnap.docs
                    .map(d => d.id)
                    .filter(uid => uid !== user.uid)
                    .map(otherUid => [user.uid, otherUid].sort().join('_'));

                // 2. Setup individual listeners for each chatId to completely bypass rule restrictions
                validChatIds.forEach(chatId => {
                    const q = query(
                        collection(db, 'direct_messages'),
                        where('chatId', '==', chatId),
                        orderBy('createdAt', 'asc')
                    );

                    const unsub = onSnapshot(q, (snapshot) => {
                        const isInitialLoad = isInitialLoadRef.current;

                        snapshot.docChanges().forEach((change) => {
                            if (change.type === 'added') {
                                const data = change.doc.data();

                                // We only care if we are the receiver for global notifications
                                if (data.receiverId === user.uid && !isInitialLoad && data.isRead === false && data.createdAt && snapshot.metadata.hasPendingWrites === false) {

                                    if (!location.pathname.includes('/chat')) {
                                        toast(`New message received`, {
                                            icon: '💬',
                                            style: { borderRadius: '10px', background: '#333', color: '#fff' }
                                        });

                                        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
                                            new Notification(`New Message`, {
                                                body: data.text || 'Sent an attachment',
                                                icon: '/favicon.ico'
                                            });
                                        }
                                    }
                                }
                            }
                        });

                        // Note: Unread count state aggregation across multiple listeners can be complex,
                        // keeping it simple here for notifications only to ensure stability.
                    }, (err) => {
                        console.error(`Global Notification Listener Error for ${chatId}:`, err);
                    });

                    unsubscribes.push(unsub);
                });

                // Give a short delay before marking initial load as false to allow all listeners to catch up
                setTimeout(() => {
                    isInitialLoadRef.current = false;
                }, 1000);

            } catch (error) {
                console.error("Error setting up global notifications:", error);
            }
        };

        setupListeners();

        return () => {
            unsubscribes.forEach(unsub => unsub());
            isInitialLoadRef.current = true;
        };
    }, [user, location.pathname]);

    return (
        <GlobalNotificationContext.Provider value={{ unreadCount: unreadMessages.length }}>
            <Toaster position="top-center" />
            {children}
        </GlobalNotificationContext.Provider>
    );
};
