import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import useIsMobile from '../hooks/useIsMobile';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: "easeOut"
        }
    })
};

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

const RotatingTeamCard = ({ profile, index, total, scrollYProgress, onClick }) => {
    // Determine the "active" float index from scroll
    const activeIndex = useTransform(scrollYProgress, [0, 1], [0, total - 1]);

    // Smooth the active index for fluid movement
    const smoothIndex = useSpring(activeIndex, { stiffness: 50, damping: 20 });

    // Calculate this card's offset from the active index
    const offset = useTransform(smoothIndex, (current) => index - current);

    // Rotation: Fan out from Bottom Center
    const rotate = useTransform(offset, (o) => {
        return o * 15; // 0 degrees at center, fanning out 15deg per unit
    });

    const opacity = useTransform(smoothIndex, (current) => {
        const dist = Math.abs(current - index);
        // Fade out neighbors stronger to focus on center
        if (dist < 0.5) return 1;
        return Math.max(0.3, 1 - dist * 0.5);
    });

    const scale = useTransform(offset, (o) => {
        const dist = Math.abs(o);
        return 1 - dist * 0.1;
    });

    const zIndex = useTransform(offset, (o) => {
        return 100 - Math.round(Math.abs(o));
    });

    return (
        <motion.div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '320px',
                height: '460px',
                transformOrigin: '-150% 150%', // Pivot below left
                x: '-50%',
                y: '-50%',
                rotate,
                scale,
                opacity,
                zIndex,
                cursor: 'pointer',
                background: 'rgba(5, 5, 5, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                overflow: 'hidden',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
            onClick={() => onClick(profile)}
            whileHover={{
                scale: 1.05,
                borderColor: 'rgba(137, 167, 131, 0.8)'
            }}
        >
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
                boxShadow: '0 0 20px rgba(137, 167, 131, 0.2)',
                overflow: 'hidden'
            }}>
                {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    profile.name ? profile.name.charAt(0) : '?'
                )}
            </div>

            <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem', color: '#89a783' }}>{profile.name}</h2>
            <h3 style={{ fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: '#fff' }}>{profile.role}</h3>

            <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {profile.description}
            </p>

            {/* Visual indicator for click */}
            <div style={{
                marginTop: 'auto',
                fontSize: '0.8rem',
                opacity: 0.4,
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
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

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
            })).filter(person => person.name && person.role); // Filter out incomplete profiles if needed

            setProfiles(fetchedProfiles);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching team profiles:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Mobile View: Stacked List
    if (isMobile) {
        return (
            <div style={{ padding: '120px 20px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold', color: '#fff' }}>Meet the Team</h1>

                {profiles.length === 0 && (
                    <div style={{ color: '#666', textAlign: 'center', fontSize: '1rem', marginTop: '2rem' }}>
                        No team members found. Update your profile in Dashboard to appear here.
                    </div>
                )}

                {profiles.map((profile, i) => (
                    <div
                        key={profile.id || i}
                        style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setActiveProfile(profile)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #89a783 0%, #1d4f40 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                marginRight: '1rem',
                                overflow: 'hidden'
                            }}>
                                {profile.photoURL ? (
                                    <img src={profile.photoURL} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    profile.name ? profile.name.charAt(0) : '?'
                                )}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>{profile.name}</h2>
                                <div style={{ fontSize: '0.9rem', color: '#89a783' }}>{profile.role}</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#aaa' }}>{profile.description}</p>
                    </div>
                ))}
                <AnimatePresence>
                    {activeProfile && <TeamModal profile={activeProfile} onClose={() => setActiveProfile(null)} />}
                </AnimatePresence>
            </div>
        );
    }

    // Desktop View: 3D Carousel
    return (
        <section ref={targetRef} style={{ height: '300vh', position: 'relative' }}>
            <div style={{
                position: 'sticky',
                top: 0,
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                perspective: '1000px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {/* Fixed Title Background */}
                <div style={{ position: 'absolute', top: '15vh', left: '5vw', zIndex: 10, pointerEvents: 'none' }}>
                    <h4 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        opacity: 1,
                        color: '#fff',
                        letterSpacing: '0.05em',
                        borderLeft: '4px solid #89a783',
                        paddingLeft: '1rem',
                        lineHeight: 1
                    }}>
                        THE TEAM
                    </h4>
                </div>

                {loading && (
                    <div style={{ color: '#666', fontSize: '1.5rem', position: 'absolute' }}>
                        Loading researchers...
                    </div>
                )}

                {error && (
                    <div style={{ color: '#ef4444', fontSize: '1.2rem', position: 'absolute', textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px', zIndex: 100 }}>
                        <p>Error loading profiles: {error}</p>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Check Firestore Security Rules.</span>
                    </div>
                )}

                {!loading && !error && profiles.length === 0 && (
                    <div style={{ color: '#666', fontSize: '1.2rem', position: 'absolute', textAlign: 'center' }}>
                        No researchers found.<br />
                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Go to Dashboard &gt; Settings to add your profile.</span>
                    </div>
                )}

                {profiles.map((profile, i) => (
                    <RotatingTeamCard
                        key={profile.id || i}
                        profile={profile}
                        index={i}
                        total={profiles.length}
                        scrollYProgress={scrollYProgress}
                        onClick={setActiveProfile}
                    />
                ))}
            </div>

            <AnimatePresence>
                {activeProfile && (
                    <TeamModal profile={activeProfile} onClose={() => setActiveProfile(null)} />
                )}
            </AnimatePresence>
        </section>
    );
};

export default Team;
