import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, File, X, MessageSquare, MoreVertical, Edit2, Trash2, Heart, ThumbsUp, Laugh, Frown, Reply, Check, CheckCheck, Mic, Square, Search, Pin, PinOff } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';

const STICKERS = [
    { id: '1', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2a2RjZ2Y2c2xkeGgxNjY5NGw1OXE0ZXN0ZjEzeHRzMnIxOHRxNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L2A3X8cnsyIVwZgIOr/giphy.gif', name: 'Thumbs Up Dog' },
    { id: '2', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnhzbTRtYmR4ZXlybHl5YWxyanV3ZGk1OXlxcXF5ZXF6aGwyY294eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2wgZJhWgRgCqfKGq2e/giphy.gif', name: 'Happy Dance' },
    { id: '3', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXQyOGQ1MTRta2RjanhyeXNheGtxNzgwaG9yZTB2bjIweXN0ZmI3aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tIe1O2s6ZkS6U0D759/giphy.gif', name: 'Cool Cat' },
    { id: '4', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGJxb2V5ZG5uejA5ZXlxM2d0MXY3dWpqYmg0NDBydDhyZDhzMTRxOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Wgb2FpSXxhXLVYNnUr/giphy.gif', name: 'Mind Blown' },
    { id: '5', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTc1dGh6MzRseWZzcmRzOXVteDV3bjcyam94ajNsdm01bnd2NnNjYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o72FkiKWMGcauifnO/giphy.gif', name: 'Typing Fast' },
    { id: '6', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWNyc25ocG5tbzAwczI3Mmp6MnhwNWg3YmwxemE5OXFhMTBxa29xeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xAFtjouKvtOU1s/giphy.gif', name: 'Yes/Approve' },
    { id: '7', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExczB1eGwycmN1azRucml5ZW12ZXUzMTR2bzVoeHRydWRvdjV5bnkybCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/iYtLXXw0m3wK0M5fci/giphy.gif', name: 'Wave' },
    { id: '8', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeDZueHpyejZteXNwcDNuM2pmdWF6MWo0ZmRxcW1tNng2anBpeXAwZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1gdrVv6AtrrEaKItWc/giphy.gif', name: 'Heart' },
];

const LinkPreview = ({ url }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
                const json = await res.json();
                if (json.status === 'success') setPreview(json.data);
            } catch (error) { console.error("Link preview error:", error); }
            finally { setLoading(false); }
        };
        fetchPreview();
    }, [url]);

    if (loading) return null;
    if (!preview || (!preview.title && !preview.image)) return null;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex mt-2 mb-1 p-2 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 transition overflow-hidden gap-3 items-center max-w-sm">
            {preview.image && preview.image.url && (
                <img src={preview.image.url} alt="preview" className="w-16 h-16 object-cover rounded-lg shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-emerald-400 line-clamp-1">{preview.title || url}</h4>
                {preview.description && <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{preview.description}</p>}
                <p className="text-[9px] text-zinc-500 mt-1 font-mono uppercase truncate">{new URL(url).hostname}</p>
            </div>
        </a>
    );
};

const ChatPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activePickerTab, setActivePickerTab] = useState('emoji'); // 'emoji' or 'sticker'
    const [attachment, setAttachment] = useState(null); // { type, data, name }
    const [showSidebarMobile, setShowSidebarMobile] = useState(true);

    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageText, setEditMessageText] = useState('');
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [showReactionPickerFor, setShowReactionPickerFor] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const scrollRef = useRef();
    const fileInputRef = useRef();
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isCurrentlyTypingRef = useRef(false);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) navigate('/login');
            else setUser(currentUser);
        });

        // Request Browser Notification Permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        const fetchUsers = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const usersList = usersSnap.docs.map(d => ({
                    uid: d.id,
                    ...d.data()
                })).filter(u => u.uid !== user.uid);
                setAllUsers(usersList);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };
        fetchUsers();
    }, [user]);

    useEffect(() => {
        if (!user || !selectedUser) return;

        const chatId = [user.uid, selectedUser.uid].sort().join('_');
        const q = query(
            collection(db, 'direct_messages'),
            where('chatId', '==', chatId),
            orderBy('createdAt', 'asc')
        );
        let isInitialLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    // Notifications are now handled globally by GlobalNotificationProvider
                }
            });

            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);

            if (document.hasFocus()) {
                msgs.forEach(msg => {
                    if (msg.receiverId === user.uid && !msg.isRead) {
                        updateDoc(doc(db, 'direct_messages', msg.id), { isRead: true }).catch(console.error);
                    }
                });
            }
            isInitialLoad = false;
        }, (err) => {
            console.error("ChatPage direct_messages Listener Error:", err);
        });
        return () => unsubscribe();
    }, [user, selectedUser]);

    useEffect(() => {
        if (!user || !selectedUser) return;
        const chatId = [user.uid, selectedUser.uid].sort().join('_');

        const unsubscribe = onSnapshot(doc(db, 'chat_status', chatId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setOtherUserTyping(data[`typing_${selectedUser.uid}`] || false);
            }
        }, (err) => {
            if (err.code !== 'permission-denied') {
                console.warn("Typing indicator error:", err);
            }
        });
        return () => unsubscribe();
    }, [user, selectedUser]);

    useEffect(() => {
        const handleFocus = () => {
            messages.forEach(msg => {
                if (msg.receiverId === user?.uid && !msg.isRead) {
                    updateDoc(doc(db, 'direct_messages', msg.id), { isRead: true }).catch(console.error);
                }
            });
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [messages, user]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, attachment, otherUserTyping]);

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (!user || !selectedUser) return;

        const chatId = [user.uid, selectedUser.uid].sort().join('_');

        if (!isCurrentlyTypingRef.current) {
            isCurrentlyTypingRef.current = true;
            setDoc(doc(db, 'chat_status', chatId), {
                [`typing_${user.uid}`]: true
            }, { merge: true }).catch(err => { if (err.code !== 'permission-denied') console.warn(err); });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            isCurrentlyTypingRef.current = false;
            setDoc(doc(db, 'chat_status', chatId), {
                [`typing_${user.uid}`]: false
            }, { merge: true }).catch(err => { if (err.code !== 'permission-denied') console.warn(err); });
        }, 2000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !user || !selectedUser) return;

        const chatId = [user.uid, selectedUser.uid].sort().join('_');
        const messageData = {
            chatId,
            senderId: user.uid,
            receiverId: selectedUser.uid,
            text: newMessage.trim(),
            createdAt: serverTimestamp(),
            attachment: attachment || null,
            isRead: false,
            ...(replyingTo && {
                replyTo: {
                    id: replyingTo.id,
                    text: replyingTo.text || 'Attachment',
                    senderName: replyingTo.senderId === user.uid ? 'You' : (selectedUser.name || selectedUser.email)
                }
            })
        };

        setNewMessage('');
        setAttachment(null);
        setShowEmojiPicker(false);
        setReplyingTo(null);

        try {
            await addDoc(collection(db, 'direct_messages'), messageData);
            setDoc(doc(db, 'chat_status', chatId), {
                [`typing_${user.uid}`]: false
            }, { merge: true }).catch(err => { if (err.code !== 'permission-denied') console.warn(err); });
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const handleSendSticker = async (stickerUrl) => {
        if (!user || !selectedUser) return;
        const chatId = [user.uid, selectedUser.uid].sort().join('_');
        const messageData = {
            chatId,
            senderId: user.uid,
            receiverId: selectedUser.uid,
            text: '',
            createdAt: serverTimestamp(),
            attachment: { type: 'sticker', data: stickerUrl, name: 'Sticker' },
            isRead: false
        };

        setShowEmojiPicker(false);
        try {
            await addDoc(collection(db, 'direct_messages'), messageData);
        } catch (error) {
            console.error('Error sending sticker:', error);
            toast.error('Failed to send sticker');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = e => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    setAttachment({
                        type: 'audio',
                        data: base64Audio,
                        name: 'Voice Memo'
                    });
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Mic access denied", error);
            toast.error("Microphone access denied or unavailable.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const formatRecordingTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleDeleteMessage = async (msgId) => {
        import('firebase/firestore').then(({ deleteDoc, doc }) => {
            deleteDoc(doc(db, 'direct_messages', msgId)).catch(e => {
                console.error(e);
                toast.error("Failed to delete");
            });
        });
    };

    const togglePinMessage = async (msg) => {
        try {
            await updateDoc(doc(db, 'direct_messages', msg.id), { isPinned: !msg.isPinned });
        } catch (e) {
            console.error("Error pinning", e);
            toast.error("Failed to pin message");
        }
    };

    const startEditing = (msg) => {
        setEditingMessageId(msg.id);
        setEditMessageText(msg.text || '');
    };

    const submitEdit = async () => {
        if (!editMessageText.trim() || !editingMessageId) {
            setEditingMessageId(null);
            return;
        }
        import('firebase/firestore').then(({ updateDoc, doc }) => {
            updateDoc(doc(db, 'direct_messages', editingMessageId), {
                text: editMessageText.trim(),
                isEdited: true
            }).then(() => {
                setEditingMessageId(null);
            }).catch(e => {
                console.error(e);
                toast.error("Failed to edit");
            });
        });
    };

    const handleReact = async (msgId, emoji) => {
        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;

        let newReactions = msg.reactions || {};
        if (newReactions[user.uid] === emoji) {
            delete newReactions[user.uid]; // Toggle off
        } else {
            newReactions[user.uid] = emoji;
        }

        import('firebase/firestore').then(({ updateDoc, doc }) => {
            updateDoc(doc(db, 'direct_messages', msgId), {
                reactions: newReactions
            }).catch(e => console.error(e));
        });
        setShowReactionPickerFor(null);
    };

    const getGroupedReactions = (reactions) => {
        if (!reactions) return [];
        const counts = {};
        Object.values(reactions).forEach(emoji => {
            counts[emoji] = (counts[emoji] || 0) + 1;
        });
        return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit size to 1MB for Firestore base64
        if (file.size > 1024 * 1024) {
            alert('File is too large! Please select a file smaller than 1MB for direct transfer.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setAttachment({
                type: file.type.startsWith('image/') ? 'image' : 'file',
                data: event.target.result,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null;

    return (
        <div className="h-screen w-screen bg-black text-white flex overflow-hidden font-space relative">
            <Toaster position="top-center" />
            {/* Sidebar */}
            <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={clsx(
                    "border-r border-zinc-800 bg-[#0d0d0d] flex flex-col z-20 transition-all absolute md:relative h-full w-full md:w-80",
                    showSidebarMobile ? "left-0" : "-left-full md:left-0"
                )}
            >
                <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 bg-zinc-900 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold tracking-tight">Direct Comms</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                    {allUsers.map((u, i) => (
                        <motion.div
                            key={u.uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => { setSelectedUser(u); setShowSidebarMobile(false); }}
                            className={clsx(
                                "flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all",
                                selectedUser?.uid === u.uid
                                    ? "bg-emerald-500/10 border border-emerald-500/30 text-white"
                                    : "hover:bg-zinc-900 border border-transparent text-zinc-400"
                            )}
                        >
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {u.photoURL ? (
                                    <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-lg">{u.name?.charAt(0) || u.email?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate text-sm">{u.name || u.email}</h3>
                                <p className="text-xs text-zinc-500 truncate">{u.role || 'Operative'}</p>
                            </div>
                        </motion.div>
                    ))}
                    {allUsers.length === 0 && (
                        <div className="text-center text-zinc-600 mt-10 text-sm">No other operatives found in network.</div>
                    )}
                </div>
            </motion.div>

            {/* Main Chat Area */}
            <div className={clsx("flex-1 flex flex-col bg-black relative w-full h-full", showSidebarMobile ? "hidden md:flex" : "flex")}>
                {selectedUser ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-16 md:h-20 border-b border-zinc-800 bg-[#0d0d0d]/80 backdrop-blur-md flex items-center px-4 md:px-8 shrink-0 z-10 sticky top-0"
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowSidebarMobile(true)}
                                        className="md:hidden p-2 bg-zinc-900 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition mr-2"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 shrink-0">
                                        {selectedUser.photoURL ? (
                                            <img src={selectedUser.photoURL} alt={selectedUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold">{selectedUser.name?.charAt(0) || selectedUser.email?.charAt(0) || '?'}</span>
                                        )}
                                    </div>
                                    <div className="hidden sm:block">
                                        <h2 className="font-bold tracking-tight">{selectedUser.name || selectedUser.email}</h2>
                                        <p className="text-xs text-emerald-400 font-mono tracking-widest uppercase truncate">Connection Active</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-black/50 border border-zinc-700 rounded-full px-3 py-1.5 focus-within:border-emerald-500/50 transition w-32 md:w-48 ml-2">
                                    <Search size={14} className="text-zinc-500 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 ml-2 w-full"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Pinned Messages Bar */}
                        {messages.filter(m => m.isPinned).length > 0 && !searchQuery && (
                            <div className="bg-zinc-800/80 backdrop-blur-md border-b border-zinc-700/50 p-2 flex items-center gap-3 overflow-x-auto no-scrollbar z-10 shrink-0 shadow-lg relative">
                                <div className="px-2 py-1 bg-emerald-500/20 rounded-lg flex items-center shrink-0 border border-emerald-500/30">
                                    <Pin size={12} className="text-emerald-400 mr-1" />
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Pinned</span>
                                </div>
                                {messages.filter(m => m.isPinned).map(msg => (
                                    <div key={msg.id} onClick={() => setSearchQuery(msg.text || '')} className="bg-black/40 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 truncate max-w-[200px] md:max-w-xs shrink-0 cursor-pointer hover:bg-black/60 transition border border-white/5 flex items-center gap-2 group/pin">
                                        <span className="truncate flex-1">{msg.senderId === user.uid ? 'You' : selectedUser.name?.split(' ')[0]}: {msg.text || (msg.attachment ? msg.attachment.name : 'Voice Memo')}</span>
                                        <button onClick={(e) => { e.stopPropagation(); togglePinMessage(msg); }} className="text-zinc-500 hover:text-red-400 opacity-0 group-hover/pin:opacity-100 transition">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4 no-scrollbar" ref={scrollRef}>
                            <AnimatePresence mode="popLayout">
                                {(searchQuery.trim() ? messages.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase())) : messages).map((msg, index) => {
                                    const isMe = msg.senderId === user.uid;
                                    const isEditing = editingMessageId === msg.id;
                                    const groupedReactions = getGroupedReactions(msg.reactions);

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)", transition: { duration: 0.2 } }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            className={clsx(
                                                "max-w-[85%] md:max-w-[70%] flex flex-col relative",
                                                isMe ? "self-end items-end" : "self-start items-start"
                                            )}
                                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                                            onMouseLeave={() => {
                                                setHoveredMessageId(null);
                                                setShowReactionPickerFor(null);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className="text-[10px] text-zinc-500 font-mono">{formatTime(msg.createdAt)}</span>
                                                {isMe && (
                                                    <span className={clsx("flex items-center", msg.isRead ? "text-emerald-500" : "text-zinc-500")}>
                                                        {msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="relative group/msg flex items-center gap-2">

                                                {/* Left side actions (if I sent it) */}
                                                {isMe && hoveredMessageId === msg.id && !isEditing && (
                                                    <div className="hidden md:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mr-2 shadow-xl">
                                                        <button onClick={() => togglePinMessage(msg)} className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition" title={msg.isPinned ? "Unpin message" : "Pin message"}>
                                                            {msg.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                        </button>
                                                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition" title="Reply">
                                                            <Reply size={14} />
                                                        </button>
                                                        <button onClick={() => startEditing(msg)} className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition" title="Edit text">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition" title="Delete message">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className={clsx(
                                                    "p-3 md:p-4 rounded-3xl relative shadow-lg",
                                                    isMe ? "bg-emerald-600/90 text-black rounded-tr-sm border border-emerald-500/50" : "bg-zinc-900/90 text-zinc-100 border border-zinc-800 rounded-tl-sm"
                                                )}>

                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                                            <textarea
                                                                value={editMessageText}
                                                                onChange={(e) => setEditMessageText(e.target.value)}
                                                                className="w-full bg-black/20 text-black border border-black/30 rounded-xl p-2 outline-none text-sm resize-none no-scrollbar"
                                                                rows={2}
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingMessageId(null)} className="text-xs font-bold text-black/60 hover:text-black">Cancel</button>
                                                                <button onClick={submitEdit} className="text-xs font-bold bg-black text-emerald-500 px-3 py-1 rounded-lg hover:bg-black/80">Save</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {msg.replyTo && (
                                                                <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-emerald-500 flex flex-col items-start min-w-[120px]">
                                                                    <span className="text-[10px] font-bold text-emerald-400 mb-1">{msg.replyTo.senderName}</span>
                                                                    <span className="text-xs text-white/70 truncate w-full max-w-[200px]">{msg.replyTo.text}</span>
                                                                </div>
                                                            )}
                                                            {msg.attachment && msg.attachment.type === 'image' && (
                                                                <img src={msg.attachment.data} alt="attachment" className="rounded-xl w-full max-w-[200px] mb-2 cursor-pointer hover:opacity-90 transition shadow-md" onClick={() => window.open(msg.attachment.data)} />
                                                            )}
                                                            {msg.attachment && msg.attachment.type === 'file' && (
                                                                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl mb-2 border border-white/10 hover:bg-black/40 transition">
                                                                    <File size={20} className={isMe ? "text-black" : "text-emerald-400"} />
                                                                    <span className="text-sm font-medium truncate max-w-[200px]">{msg.attachment.name}</span>
                                                                    <a href={msg.attachment.data} download={msg.attachment.name} className={clsx("ml-auto text-xs underline font-bold", isMe ? "text-black/70 hover:text-black" : "text-emerald-400 hover:text-emerald-300")}>Download</a>
                                                                </div>
                                                            )}
                                                            {msg.attachment && msg.attachment.type === 'sticker' && (
                                                                <img src={msg.attachment.data} alt="sticker" className="w-32 h-32 md:w-40 md:h-40 object-contain mb-2 drop-shadow-xl" />
                                                            )}
                                                            {msg.attachment && msg.attachment.type === 'audio' && (
                                                                <div className="flex items-center gap-2 p-2 bg-black/30 rounded-xl mb-2 border border-white/10">
                                                                    <Mic size={16} className={isMe ? "text-black" : "text-emerald-400"} />
                                                                    <audio controls src={msg.attachment.data} className="w-[200px] h-8 outline-none" />
                                                                </div>
                                                            )}
                                                            {msg.text && (
                                                                <motion.p layout className="whitespace-pre-wrap break-words text-sm leading-relaxed font-medium inline-block">
                                                                    {msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => (
                                                                        part.match(/^https?:\/\//) ? (
                                                                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={clsx("underline", isMe ? "text-black hover:text-black/80 font-bold" : "text-emerald-400 hover:text-emerald-300")}>
                                                                                {part}
                                                                            </a>
                                                                        ) : (
                                                                            <span key={i}>{part}</span>
                                                                        )
                                                                    ))}
                                                                    {msg.isEdited && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="text-[10px] ml-2 italic">(edited)</motion.span>}
                                                                </motion.p>
                                                            )}
                                                            {msg.text && (msg.text.match(/https?:\/\/[^\s]+/) || [])[0] && (
                                                                <LinkPreview url={msg.text.match(/https?:\/\/[^\s]+/)[0]} />
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Right side actions (for mobile/desktop reaction) */}
                                                {!isMe && hoveredMessageId === msg.id && (
                                                    <div className="relative flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1 ml-2 shadow-xl">
                                                        <button onClick={() => togglePinMessage(msg)} className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-full transition" title={msg.isPinned ? "Unpin message" : "Pin message"}>
                                                            {msg.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                        </button>
                                                        <button onClick={() => setReplyingTo(msg)} className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-full transition" title="Reply">
                                                            <Reply size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowReactionPickerFor(showReactionPickerFor === msg.id ? null : msg.id); }}
                                                            className="p-1 text-zinc-400 hover:text-emerald-400 rounded-full hover:bg-zinc-800 transition"
                                                            title="React"
                                                        >
                                                            <Smile size={14} />
                                                        </button>

                                                        {showReactionPickerFor === msg.id && (
                                                            <div className="absolute top-full mt-2 left-0 z-50 bg-zinc-900 border border-zinc-700 rounded-full p-2 flex gap-1 shadow-2xl">
                                                                {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                                                                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="hover:scale-125 transition text-lg px-1 filter grayscale hover:grayscale-0">
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Mobile self actions */}
                                                {isMe && hoveredMessageId === msg.id && !isEditing && (
                                                    <div className="md:hidden flex flex-col gap-1 ml-2">
                                                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-zinc-500 hover:text-emerald-400 bg-zinc-900 rounded-full transition shadow-xl"><Reply size={12} /></button>
                                                        <button onClick={() => startEditing(msg)} className="p-1.5 text-zinc-500 hover:text-emerald-400 bg-zinc-900 rounded-full transition shadow-xl"><Edit2 size={12} /></button>
                                                        <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-900 rounded-full transition shadow-xl"><Trash2 size={12} /></button>
                                                    </div>
                                                )}
                                            </div>

                                            {groupedReactions.length > 0 && (
                                                <div className={clsx("flex gap-1 mt-1 z-10", isMe ? "mr-2" : "ml-2")}>
                                                    {groupedReactions.map(({ emoji, count }) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReact(msg.id, emoji)}
                                                            className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded-full text-xs hover:border-emerald-500/50 transition flex items-center gap-1 shadow-lg"
                                                        >
                                                            {emoji} <span className="text-zinc-400 text-[10px]">{count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            {otherUserTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="self-start relative p-3 bg-zinc-900 border border-zinc-800 rounded-3xl rounded-tl-sm shadow-lg flex items-center gap-3 ml-2"
                                >
                                    <div className="flex gap-1 items-center">
                                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, delay: 0, duration: 0.8 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, delay: 0.2, duration: 0.8 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, delay: 0.4, duration: 0.8 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{selectedUser.name?.split(' ')[0] || 'Operative'} is typing</span>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="p-3 md:p-6 bg-transparent relative z-20 pb-safe md:pb-8"
                        >
                            <AnimatePresence>
                                {attachment && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full left-6 mb-4 p-3 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-xl"
                                    >
                                        {attachment.type === 'image' ? (
                                            <img src={attachment.data} alt="preview" className="w-12 h-12 object-cover rounded-xl" />
                                        ) : (
                                            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
                                                <File size={20} className="text-zinc-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-[200px] pr-4">
                                            <p className="text-sm font-bold truncate text-white">{attachment.name}</p>
                                            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono">Payload Ready</p>
                                        </div>
                                        <button onClick={() => setAttachment(null)} className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-full transition-colors shrink-0">
                                            <X size={16} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {replyingTo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-xl max-w-sm w-full z-10"
                                    >
                                        <div className="flex-1 min-w-[200px] border-l-2 border-emerald-500 pl-3">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono mb-1">
                                                Replying to {replyingTo.senderId === user?.uid ? 'Yourself' : (selectedUser?.name || 'Operative')}
                                            </p>
                                            <p className="text-sm font-medium truncate text-zinc-300">
                                                {replyingTo.text || 'Attachment'}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => setReplyingTo(null)} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-full transition-colors shrink-0">
                                            <X size={16} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto backdrop-blur-md bg-zinc-900/40 p-2 md:p-3 rounded-[3rem] border border-zinc-800/60 shadow-2xl relative z-20">
                                <div className="flex-1 bg-zinc-900 border border-zinc-700/50 rounded-full p-1 md:p-2 flex items-center focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all relative shadow-inner">
                                    <div className="flex gap-1 pl-2 shrink-0">
                                        {!isRecording && (
                                            <>
                                                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors rounded-full hover:bg-white/5 active:scale-95">
                                                    <Smile size={20} />
                                                </button>
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors rounded-full hover:bg-white/5 active:scale-95">
                                                    <Paperclip size={20} />
                                                </button>
                                                <button type="button" onClick={startRecording} className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/5 active:scale-95">
                                                    <Mic size={20} />
                                                </button>
                                            </>
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    </div>

                                    {showEmojiPicker && (
                                        <div className="absolute bottom-[calc(100%+1rem)] left-0 md:left-auto md:bottom-auto md:top-[calc(100%+1rem)] z-50 shadow-2xl rounded-2xl overflow-hidden border border-zinc-800 w-full md:w-auto bg-zinc-900 flex flex-col">
                                            <div className="flex items-center border-b border-zinc-800/60 p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePickerTab('emoji')}
                                                    className={clsx("flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors", activePickerTab === 'emoji' ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50")}
                                                >
                                                    Emoji
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePickerTab('sticker')}
                                                    className={clsx("flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors", activePickerTab === 'sticker' ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50")}
                                                >
                                                    Stickers
                                                </button>
                                            </div>

                                            {activePickerTab === 'emoji' ? (
                                                <EmojiPicker
                                                    theme="dark"
                                                    onEmojiClick={(e) => setNewMessage(p => p + e.emoji)}
                                                    width="100%"
                                                    height={300}
                                                />
                                            ) : (
                                                <div className="p-3 grid grid-cols-4 gap-3 bg-zinc-900 w-full md:w-[350px] h-[300px] overflow-y-auto no-scrollbar">
                                                    {STICKERS.map(sticker => (
                                                        <button
                                                            key={sticker.id}
                                                            onClick={() => handleSendSticker(sticker.url)}
                                                            className="aspect-square bg-zinc-800/50 rounded-xl hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all p-2 border border-transparent hover:border-emerald-500/30 flex items-center justify-center overflow-hidden"
                                                            title={sticker.name}
                                                        >
                                                            <img src={sticker.url} alt={sticker.name} className="w-full h-full object-contain pointer-events-none" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isRecording ? (
                                        <div className="flex-1 flex items-center justify-between px-4 animate-in fade-in slide-in-from-right-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                                <span className="text-red-400 font-mono text-sm tracking-widest">{formatRecordingTime(recordingTime)}</span>
                                                <span className="text-zinc-500 text-xs italic ml-2">Recording...</span>
                                            </div>
                                            <button type="button" onClick={stopRecording} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 flex items-center gap-2 hover:text-white rounded-full transition-colors mr-2">
                                                <Square size={14} className="fill-current" />
                                                <span className="text-xs font-bold uppercase tracking-wider pr-1">Stop</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <textarea
                                            value={newMessage}
                                            onChange={handleTyping}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            placeholder="Transmit message..."
                                            className="flex-1 bg-transparent border-none outline-none resize-none px-3 py-2 text-sm text-white placeholder-zinc-500 font-medium leading-relaxed no-scrollbar self-center"
                                            rows={1}
                                            style={{ minHeight: '36px', maxHeight: '100px' }}
                                        />
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() && !attachment}
                                    className="h-[52px] w-[52px] md:h-[56px] md:w-[56px] rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all shrink-0 disabled:hover:scale-100"
                                >
                                    <Send size={22} className="ml-1" />
                                </button>
                            </form>
                        </motion.div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-10 bg-black hidden md:flex">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-32 h-32 mb-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shadow-2xl"
                        >
                            <MessageSquare size={40} className="text-zinc-700" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)]"
                            >
                                <div className="w-3 h-3 bg-black rounded-full" />
                            </motion.div>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-4 tracking-tight"
                        >
                            Secure Channel
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-zinc-500 max-w-sm font-medium leading-relaxed"
                        >
                            Select a team operative from the sidebar to establish a secure, encrypted one-on-one transmission. Share intelligence, media, and data packets.
                        </motion.p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
