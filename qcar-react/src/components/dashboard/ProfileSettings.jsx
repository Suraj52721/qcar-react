import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auth, db, storage } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Upload, Save, User, Briefcase, FileText, Camera } from 'lucide-react';

const ProfileSettings = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        description: '', // Short bio
        background: '',
        expertise: '',
        currentWork: '',
        achievements: '',
        photoURL: ''
    });

    const currentUser = auth.currentUser;

    // Fetch existing profile on mount or when modal opens
    useEffect(() => {
        if (!currentUser || !isOpen) return;

        const fetchProfile = async () => {
            try {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(prev => ({ ...prev, ...docSnap.data() }));
                } else {
                    // Pre-fill name/email from Auth if no profile exists
                    setFormData(prev => ({
                        ...prev,
                        name: currentUser.displayName || '',
                    }));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        fetchProfile();
    }, [currentUser, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `avatars/${currentUser.uid}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            setFormData(prev => ({ ...prev, photoURL: downloadURL }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                ...formData,
                updatedAt: serverTimestamp(),
                isShowcased: true // Default to showing on team page
            }, { merge: true });

            alert("Profile updated successfully!");
            onClose();
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d0d0d] border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-emerald-500" /> Edit Profile
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form onSubmit={handleSave} className="space-y-6">

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4 mb-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-900 flex items-center justify-center">
                                    {formData.photoURL ? (
                                        <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-zinc-700">{formData.name?.charAt(0) || '?'}</span>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                    <Camera className="text-white" size={24} />
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-zinc-500">Click to upload new avatar</div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-zinc-600" size={16} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500/50 focus:bg-zinc-900 outline-none transition-all"
                                        placeholder="e.g. Dr. Jane Doe"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Role / Title</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 text-zinc-600" size={16} />
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500/50 focus:bg-zinc-900 outline-none transition-all"
                                        placeholder="e.g. Senior Researcher"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description (Short Bio) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Short Bio (Card Description)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-emerald-500/50 focus:bg-zinc-900 outline-none transition-all resize-none h-24"
                                placeholder="Brief overview shown on the team card..."
                                maxLength={150}
                            />
                            <div className="text-right text-[10px] text-zinc-600">{formData.description.length}/150</div>
                        </div>

                        {/* Detailed Fields */}
                        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                            <h3 className="text-sm font-bold text-emerald-500 mb-2">Detailed Profile</h3>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Background</label>
                                <textarea name="background" value={formData.background} onChange={handleChange} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none h-20" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Expertise</label>
                                <textarea name="expertise" value={formData.expertise} onChange={handleChange} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none h-20" placeholder="Comma separated areas of expertise..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Current Work</label>
                                <textarea name="currentWork" value={formData.currentWork} onChange={handleChange} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none h-20" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Key Achievements</label>
                                <textarea name="achievements" value={formData.achievements} onChange={handleChange} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none h-20" />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || uploading}
                        className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : <><Save size={16} /> Save Profile</>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileSettings;
