import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SidePanel from '../components/SidePanel';
import ConnectionWire from '../components/ConnectionWire';
import useIsMobile from '../hooks/useIsMobile';

const profiles = [
    { name: "Dr. Hassan", role: "Principal Investigator", description: "Expert in Quantum Algorithms and Computation.", id: 1 },
    { name: "Dr. Raja", role: "Senior Researcher", description: "Specializes in Quantum Cryptography.", id: 2 },
    { name: "Dr. Vikas", role: "Research Scientist", description: "Focuses on Quantum Error Correction.", id: 3 },
    { name: "Dr. Divyansh", role: "Postdoctoral Fellow", description: "Working on Topological Quantum Computing.", id: 4 },
    { name: "Dr. Aruna", role: "Associate Professor", description: "Researching Quantum Information Theory.", id: 5 },
    { name: "Lakshya", role: "PhD Candidate", description: "Developing new quantum machine learning models.", id: 6 },
    { name: "Suraj Singh", role: "Undergraduate Researcher", description: "Exploring quantum simulation techniques.", id: 7 },
    { name: "Nisheeth Reen", role: "Undergraduate Researcher", description: "Assist in quantum circuit optimization.", id: 8 },
    { name: "Abhinav Tomar", role: "Undergraduate Researcher", description: "Implementation of quantum algorithms on hardware.", id: 9 }
];

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

const ProfileCard = ({ profile, index, setActiveProfile, setCoords, isMobile }) => {
    const cardRef = useRef(null);
    const [expanded, setExpanded] = useState(false);

    const handleMouseEnter = () => {
        if (isMobile) return;
        setActiveProfile(profile);
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setCoords({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            });
        }
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        setActiveProfile(null);
        setCoords(null);
    };

    const handleClick = () => {
        if (isMobile) {
            setExpanded(!expanded);
        }
    };

    return (
        <motion.div
            ref={cardRef}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="card-glow-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                height: 'auto' // Allow growth for expansion
            }}
            whileHover={{
                scale: isMobile ? 1 : 1.05,
            }}
        >
            <div className="card-content" style={{ padding: '2rem' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #64ffda 0%, #1d4f40 100%)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                }}>
                    {profile.name.charAt(0)}
                </div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem', color: '#64ffda' }}>{profile.name}</h2>
                <h3 style={{ fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: expanded ? '1rem' : '0' }}>{profile.role}</h3>

                {/* Render description inline on mobile if expanded, or always on desktop if that was the original design? 
            Original design had description always visible? No, description was in SidePanel mostly? 
            Actually existing code has: 
            <p style={{ fontSize: '0.9rem', opacity: 0.6, lineHeight: 1.6 }}>{profile.description}</p>
            So description IS visible on card by default. 
            User said "remove the profile hovering and research hovering appear disappear feature for phone screens instead add dropdown menu for viewing the this in detail"
            This implies the SidePanel content ("viewing this in detail") should be inline dropdown.
        */}

                <p style={{ fontSize: '0.9rem', opacity: 0.6, lineHeight: 1.6, display: isMobile ? 'none' : 'block' }}>
                    {profile.description}
                </p>

                <AnimatePresence>
                    {isMobile && expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.6, marginTop: '1rem', color: '#fff', borderTop: '1px solid rgba(100,255,218,0.2)', paddingTop: '1rem' }}>
                                {profile.description}
                            </p>
                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>
                                <strong>Focus Areas:</strong> Quantum Algorithms, Error Correction
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const Team = () => {
    const [activeProfile, setActiveProfile] = useState(null);
    const [coords, setCoords] = useState(null);
    const isMobile = useIsMobile();

    const endCoords = {
        x: typeof window !== 'undefined' ? window.innerWidth - 400 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
    };

    return (
        <div style={{ padding: '150px 10vw 50px' }}>
            {!isMobile && (
                <>
                    <ConnectionWire start={coords} end={endCoords} active={!!activeProfile} />
                    <SidePanel profile={activeProfile} isOpen={!!activeProfile} />
                </>
            )}

            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold' }}
            >
                Meet the Team
            </motion.h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem',
                position: 'relative',
                zIndex: 1
            }}>
                {profiles.map((profile, index) => (
                    <ProfileCard
                        key={index}
                        profile={profile}
                        index={index}
                        setActiveProfile={setActiveProfile}
                        setCoords={setCoords}
                        isMobile={isMobile}
                    />
                ))}
            </div>
        </div>
    );
};

export default Team;
