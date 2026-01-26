import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useIsMobile from '../hooks/useIsMobile';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const TeamModal = ({ profile, onClose }) => {
    if (!profile) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #89a783',
                    borderRadius: '16px',
                    padding: '40px',
                    maxWidth: '600px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 0 40px rgba(137, 167, 131, 0.3)',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
                className="no-scrollbar"
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'sticky',
                        top: '10px',
                        left: '100%',
                        transform: 'translateX(10px)',
                        background: 'rgba(10, 10, 10, 0.8)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        float: 'right',
                        marginTop: '-20px',
                        marginRight: '-20px'
                    }}
                >
                    &times;
                </button>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #89a783 0%, #1d4f40 100%)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontWeight: 'bold',
                        fontSize: '2.5rem',
                        boxShadow: '0 0 20px rgba(137, 167, 131, 0.4)',
                        overflow: 'hidden'
                    }}>
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            profile.name ? profile.name.charAt(0) : '?'
                        )}
                    </div>

                    <h2 style={{
                        fontSize: '2rem',
                        color: '#fff',
                        marginBottom: '0.5rem',
                        fontFamily: 'var(--font-main)'
                    }}>
                        {profile.name}
                    </h2>

                    <h3 style={{
                        fontSize: '1rem',
                        color: '#89a783',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        {profile.role}
                    </h3>
                </div>

                <div style={{ textAlign: 'left' }}>
                    {profile.background && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#89a783', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Background</h4>
                            <p style={{ color: '#ddd', lineHeight: 1.6 }}>{profile.background}</p>
                        </div>
                    )}

                    {profile.expertise && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#89a783', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Expertise</h4>
                            <p style={{ color: '#ddd', lineHeight: 1.6 }}>{profile.expertise}</p>
                        </div>
                    )}

                    {profile.currentWork && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#89a783', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Current Work</h4>
                            <p style={{ color: '#ddd', lineHeight: 1.6 }}>{profile.currentWork}</p>
                        </div>
                    )}

                    {profile.achievements && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#89a783', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Key Achievements</h4>
                            <p style={{ color: '#ddd', lineHeight: 1.6 }}>{profile.achievements}</p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
                    * Active Research Member
                </div>
            </motion.div>
        </motion.div>
    );
};

const TeamCard = ({ profile, onClick }) => {
    return (
        <motion.div
            style={{
                width: '300px',
                height: '420px',
                flexShrink: 0,
                background: 'rgba(5, 5, 5, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                cursor: 'pointer',
                margin: '0 15px', // Horizontal spacing
                overflow: 'hidden'
            }}
            whileHover={{
                y: -10,
                borderColor: 'rgba(137, 167, 131, 0.5)',
                background: 'rgba(10, 10, 10, 0.9)',
                boxShadow: '0 15px 30px rgba(0,0,0,0.5)'
            }}
            onClick={() => onClick(profile)}
        >
            <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #89a783 0%, #1d4f40 100%)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '2rem',
                boxShadow: '0 0 20px rgba(137, 167, 131, 0.2)',
                overflow: 'hidden'
            }}>
                {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    profile.name ? profile.name.charAt(0) : '?'
                )}
            </div>

            <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem', color: '#89a783', fontFamily: 'var(--font-main)' }}>{profile.name}</h2>
            <h3 style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: '#fff' }}>{profile.role}</h3>

            <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {profile.description}
            </p>

            <div style={{
                marginTop: 'auto',
                fontSize: '0.75rem',
                opacity: 0.5,
                borderBottom: '1px dotted #89a783',
                paddingBottom: '2px',
                color: '#fff'
            }}>
                View Details
            </div>
        </motion.div>
    );
};

const Team = () => {
    const [profiles, setProfiles] = useState([]);
    const [activeProfile, setActiveProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        // Fetch users from Firestore
        const q = query(collection(db, 'users'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProfiles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(person => person.name && person.role);

            setProfiles(fetchedProfiles);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching team profiles:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Desktop: Horizontal Infinite Marquee
    // Mobile: Same component, maybe just let it flow or same behavior

    // We duplicate the list to create the seamless loop
    const doubledProfiles = [...profiles, ...profiles, ...profiles, ...profiles]; // 4x to be safe for wide screens

    return (
        <section style={{
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#000'
        }}>

            <div style={{ position: 'absolute', top: '14vh', left: '50%', transform: 'translateX(-50%)', zIndex: 10, textAlign: 'center' }}>
                <h4 style={{
                    fontSize: '2.6rem',
                    fontWeight: 'bold',
                    opacity: 1,
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginBottom: '1rem'
                }}>
                    THE TEAM
                </h4>
            </div>

            {loading && (
                <div style={{ color: '#666', fontSize: '1.5rem', textAlign: 'center' }}>
                    Loading researchers...
                </div>
            )}

            {error && (
                <div style={{ color: '#ef4444', fontSize: '1.2rem', textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px', width: 'fit-content', margin: '0 auto' }}>
                    <p>Error loading profiles: {error}</p>
                </div>
            )}

            {!loading && !error && profiles.length === 0 && (
                <div style={{ color: '#666', fontSize: '1.2rem', textAlign: 'center' }}>
                    No researchers found.<br />
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Go to Dashboard &gt; Settings to add your profile.</span>
                </div>
            )}

            {!loading && profiles.length > 0 && (
                <div style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2rem 0',
                    marginTop: '10vh',
                    maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                }}>
                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: '-50%' }}
                        transition={{
                            duration: Math.max(20, profiles.length * 5), // Adjust speed based on count
                            ease: "linear",
                            repeat: Infinity
                        }}
                        style={{
                            display: 'flex',
                            width: 'max-content',
                            paddingLeft: '50px' // Initial offset
                        }}
                        // Pause on hover
                        whileHover={{ animationPlayState: 'paused' }}
                    >
                        {doubledProfiles.map((profile, index) => (
                            <TeamCard
                                key={`${profile.id}-${index}`}
                                profile={profile}
                                onClick={setActiveProfile}
                            />
                        ))}
                    </motion.div>
                </div>
            )}

            <AnimatePresence>
                {activeProfile && (
                    <TeamModal profile={activeProfile} onClose={() => setActiveProfile(null)} />
                )}
            </AnimatePresence>
        </section>
    );
};

export default Team;
