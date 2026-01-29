import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore'; // Added where
import { onAuthStateChanged } from 'firebase/auth';
import { FileText, Upload, Trash2, FolderKanban, Download, ExternalLink, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './DashboardWidgets.css';

const DocumentRepo = ({ projectId }) => { // Accept projectId
    const [docs, setDocs] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser || !projectId) return;

        const q = query(
            collection(db, 'documents'),
            where('projectId', '==', projectId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setDocs(fetchedDocs);
        });
        return () => unsubscribe();
    }, [currentUser, projectId]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser || !projectId) return;

        setUploading(true);
        try {
            // Upload to Supabase Storage
            // Using a unique path: papers/UID/projectId/timestamp_filename
            const filePath = `papers/${currentUser.uid}/${projectId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

            const { data, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // Save Metadata to Firestore
            await addDoc(collection(db, 'documents'), {
                name: file.name,
                url: publicUrl,
                storagePath: filePath, // Save path for deletion
                type: file.type,
                size: file.size,
                uploadedBy: currentUser.uid,
                projectId: projectId, // Save with project ID
                createdAt: serverTimestamp()
            });

        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docData) => {
        if (!window.confirm("Delete this document?")) return;
        try {
            // Delete from Firestore
            await deleteDoc(doc(db, 'documents', docData.id));

            // Delete from Supabase Storage
            if (docData.storagePath) {
                const { error } = await supabase.storage
                    .from('documents')
                    .remove([docData.storagePath]);

                if (error) console.error("Error deleting from Supabase:", error);
            }

        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Widget View
    if (!isExpanded) {
        return (
            <div className="dashboard-widget-card repo-widget-collapsed">
                <div className="h-full flex flex-col items-center justify-center gap-3 group cursor-pointer" onClick={() => setIsExpanded(true)}>
                    <div className="p-4 bg-zinc-900 rounded-full group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all text-zinc-600">
                        <FolderKanban size={24} />
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-zinc-300">{docs.length}</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Documents</div>
                    </div>
                </div>
            </div>
        );
    }

    // Modal View
    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b0b0b] border border-zinc-800 w-full max-w-4xl h-[70vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <FolderKanban className="text-emerald-500" />
                        <h2 className="text-xl font-bold tracking-tight text-white">Document Repository</h2>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-zinc-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-6">
                    {/* Upload Area */}
                    <label className={`border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed bg-zinc-900' : 'hover:border-emerald-500/50 hover:bg-zinc-900/50'}`}>
                        <div className="p-3 bg-zinc-800 rounded-full text-zinc-400">
                            <Upload size={24} className={uploading ? 'animate-bounce' : ''} />
                        </div>
                        <span className="text-sm font-bold text-zinc-300">
                            {uploading ? 'Uploading...' : 'Click to Upload Research Paper (PDF)'}
                        </span>
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} className="hidden" />
                    </label>

                    {/* File List */}
                    <div className="mt-6 flex-1 overflow-y-auto space-y-2">
                        {docs.map(doc => (
                            <div key={doc.id} className="flex items-center gap-4 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:bg-zinc-900 transition-colors group">
                                <FileText className="text-emerald-500" size={20} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-zinc-200 truncate">{doc.name}</div>
                                    <div className="text-[10px] text-zinc-500 flex gap-2">
                                        <span>{formatSize(doc.size)}</span>
                                        <span>•</span>
                                        <span>{new Date(doc.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-lg" title="Open">
                                        <ExternalLink size={16} />
                                    </a>
                                    <button onClick={() => handleDelete(doc)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {docs.length === 0 && !uploading && (
                            <div className="text-center text-zinc-600 mt-10">No documents founded.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default DocumentRepo;
