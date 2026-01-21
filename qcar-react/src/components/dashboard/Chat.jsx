import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { Send, Smile, Plus } from 'lucide-react';


const REACTION_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeReactionId, setActiveReactionId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [sendError, setSendError] = useState(null);
    const scrollRef = useRef();
    const emojiPickerRef = useRef();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        }, (error) => {
            console.error("Snapshot error:", error);
            setSendError("Error loading messages.");
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!currentUser) return;

        const messageToSend = newMessage;
        setNewMessage('');
        setShowEmojiPicker(false);

        try {
            await addDoc(collection(db, 'messages'), {
                text: messageToSend,
                sender: currentUser.email || 'Anonymous',
                senderUid: currentUser.uid,
                createdAt: serverTimestamp(),
                reactions: {}
            });
        } catch (error) {
            console.error("Error sending message: ", error);
            setSendError("Failed to send.");
            setNewMessage(messageToSend);
        }
    };

    const handleReaction = async (messageId, emoji) => {
        if (!currentUser) return;
        const messageRef = doc(db, 'messages', messageId);
        try {
            await updateDoc(messageRef, {
                [`reactions.${currentUser.uid}`]: emoji
            });
            setActiveReactionId(null);
        } catch (error) {
            console.error("Error adding reaction:", error);
        }
    };

    const getGroupedReactions = (reactions) => {
        if (!reactions) return [];
        const counts = {};
        Object.values(reactions).forEach(emoji => {
            counts[emoji] = (counts[emoji] || 0) + 1;
        });
        return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-container">
            <div className="messages-list" ref={scrollRef}>
                <AnimatePresence>
                    {messages.map((msg, index) => {
                        const isCurrentUser = msg.senderUid === currentUser?.uid;
                        const groupedReactions = getGroupedReactions(msg.reactions);
                        const showHeader = index === 0 || messages[index - 1].senderUid !== msg.senderUid;

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`message-wrapper ${isCurrentUser ? 'sent' : 'received'}`}
                            >
                                {/* Info Row: Only show if sender changed usually, but let's show for clarity now */}
                                <div className="message-header-row" style={{ flexDirection: isCurrentUser ? 'row-reverse' : 'row' }}>
                                    <span className="message-sender-name">
                                        {isCurrentUser ? 'You' : msg.sender?.split('@')[0]}
                                    </span>
                                    <span className="message-timestamp">
                                        {formatTime(msg.createdAt)}
                                    </span>
                                </div>

                                <div className="message-bubble relative group">
                                    {msg.text}

                                    {/* Reaction Button triggers on hover */}
                                    <button
                                        className="reaction-button"
                                        onClick={() => setActiveReactionId(activeReactionId === msg.id ? null : msg.id)}
                                    >
                                        <Plus size={12} />
                                    </button>

                                    {/* Picker Popup */}
                                    {activeReactionId === msg.id && (
                                        <div className="absolute -top-10 z-50 bg-[#0d0d0d] border border-zinc-700 rounded-full p-2 flex gap-1 shadow-xl">
                                            {REACTION_OPTIONS.map(emoji => (
                                                <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="hover:scale-125 transition text-lg">
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {groupedReactions.length > 0 && (
                                    <div className="reactions-display">
                                        {groupedReactions.map(({ emoji, count }) => (
                                            <span key={emoji} className="reaction-pill">
                                                {emoji} {count > 1 ? count : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-form">
                <div ref={emojiPickerRef} className="relative">
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-10 left-0 z-50 shadow-2xl">
                            <EmojiPicker
                                theme="dark"
                                onEmojiClick={(e) => setNewMessage(p => p + e.emoji)}
                                width={280}
                                height={350}
                            />
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />

                <button type="submit" className="icon-btn send-btn-icon">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
