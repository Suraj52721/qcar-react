import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import useIsMobile from '../hooks/useIsMobile';

const profiles = [
    {
        name: "Dr. S.R. Hassan",
        role: "Professor",
        description: "Senior researcher with decades of experience in theoretical physics and condensed matter physics.",
        background: "Senior researcher with decades of experience in theoretical physics and mathematical optimization. Leading authority in condensed matter physics and quantum systems.",
        expertise: "Optimal transport theory, Ising models, many-body systems, graph theory, mathematical physics, quantum complexity",
        currentWork: "Advising on mathematical foundations of quantum optimization and contributing to theoretical frameworks for quantum complexity analysis.",
        achievements: "Extensive publications in theoretical physics, recognized expert in Ising model solvers, contributions to optimal transport theory"
    },
    {
        name: "Dr. Vikas Chauhan",
        role: "Professor",
        description: "Theoretical physicist with expertise in computational methods and statistical mechanics.",
        background: "Theoretical physicist with expertise in computational methods and statistical mechanics. Extensive experience in density functional theory and dynamical systems.",
        expertise: "Density functional theory, dynamical mean field theory, statistical mechanics, computational physics, atomic simulations",
        currentWork: "Providing guidance on theoretical frameworks and computational approaches for quantum system modeling and analysis.",
        achievements: "Leading researcher in DFT applications, expert in DMFT methods, published extensively in computational physics and statistical mechanics"
    },
    {
        name: "Dr. Vidhyadhiraja",
        role: "Professor",
        description: "Expert in DMFT,MOIPT and Computational Physics for Condensed Matter Systems",
        background: "",
        expertise: "Expert in DMFT,MOIPT and Computational Physics for Condensed Matter Systems",
        currentWork: "",
        achievements: ""
    },
    {
        name: "Lakshya Nagpal",
        role: "Research Collaborator",
        description: "Researcher specializing in quantum computing applications and optimization algorithms.",
        background: "Researcher specializing in quantum computing applications and optimization algorithms. Experience in quantum annealing and molecular simulation.",
        expertise: "Quantum algorithms, optimization theory, molecular simulation, quantum annealing, fermionic encodings",
        currentWork: "Developing efficient quantum algorithms for molecular energy calculations and investigating symmetry reductions for quantum annealers.",
        achievements: "Worked in quantum optimization, collaborated with quantum computing companies, developed fermionic mapping techniques"
    },
    {
        name: "Aditya Kumar",
        role: "Research Collaborator",
        description: "Specialist in combinatorial optimization with focus on quantum annealing applications.",
        background: "Specialist in combinatorial optimization with focus on quantum annealing applications. Strong mathematical background in optimization theory and algorithm design.",
        expertise: "QUBO formulations, combinatorial optimization, quantum annealing, algorithm design, mathematical optimization",
        currentWork: "Developing advanced QUBO formulations for complex optimization problems and improving quantum annealing performance through novel encoding techniques.",
        achievements: "Developed efficient QUBO encodings for real-world problems, improved quantum annealing success rates, published research on optimization algorithms"
    },
    {
        name: "Dr. Divyansh",
        role: "Research Scientist",
        description: "Research scientist with expertise in quantum mechanics fundamentals and quantum information theory.",
        background: "Research scientist with expertise in quantum mechanics fundamentals and quantum information theory. Strong background in theoretical physics and computational methods.",
        expertise: "Quantum mechanics, entanglement theory, quantum information, quantum speed limits, coherence optimization",
        currentWork: "Investigating quantum speed limits in many-body systems and developing new metrics for quantum information processing efficiency.",
        achievements: "Published papers on quantum entanglement characterization, developed novel quantum coherence metrics, contributed to quantum information theory"
    },
    {
        name: "Dr. Aruna",
        role: "Post Doctoral Fellow",
        description: "",
        background: "",
        expertise: "",
        currentWork: "",
        achievements: ""
    },
    {
        name: "Suraj Singh",
        role: "Undergraduate Researcher",
        description: "",
        background: "",
        expertise: "",
        currentWork: "",
        achievements: ""
    },
    {
        name: "Nishith Reen",
        role: "Undergraduate Researcher",
        description: "",
        background: "",
        expertise: "",
        currentWork: "",
        achievements: ""
    },
    {
        name: "Abhinav Tomar",
        role: "Undergraduate Researcher",
        description: "",
        background: "",
        expertise: "",
        currentWork: "",
        achievements: ""
    },

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
                        boxShadow: '0 0 20px rgba(137, 167, 131, 0.4)'
                    }}>
                        {profile.name.charAt(0)}
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
                boxShadow: '0 0 20px rgba(137, 167, 131, 0.2)'
            }}>
                {profile.name.charAt(0)}
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

    const [activeProfile, setActiveProfile] = useState(null);
    const isMobile = useIsMobile();

    // Mobile View: Stacked List
    if (isMobile) {
        return (
            <div style={{ padding: '120px 20px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>Meet the Team</h1>
                {profiles.map((profile, i) => (
                    <div
                        key={i}
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
                                marginRight: '1rem'
                            }}>
                                {profile.name.charAt(0)}
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
                <div style={{ position: 'absolute', top: '12vh', left: '5vw', zIndex: 10, pointerEvents: 'none' }}>
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

                {profiles.map((profile, i) => (
                    <RotatingTeamCard
                        key={i}
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
