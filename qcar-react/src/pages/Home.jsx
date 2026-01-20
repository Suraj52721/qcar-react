import { useRef, useState, useLayoutEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import logo from '../assets/image.png';
import videoGif from '../assets/video.gif';
import useIsMobile from '../hooks/useIsMobile';

// Logo Imports
import imscLogo from '../assets/logo/imsc-logo.png';
import jncasrLogo from '../assets/logo/jncasr-logo.png';
import uodLogo from '../assets/logo/_uod-logo.png';
import pecslabLogo from '../assets/logo/pecslab.png';

// Content for the initials
const qcarData = {
    'Q': {
        title: 'Quantum',
        description: 'Exploring the fundamental principles of quantum mechanics to revolutionize computation. We investigate superposition, entanglement, and quantum interference to build systems that surpass classical limits.'
    },
    'C': {
        title: 'Computing',
        description: 'Developing next-generation computational architectures. Our work focuses on fault-tolerant quantum computing, error correction, and scalable qubit systems.'
    },
    'A': {
        title: 'Algorithms',
        description: 'Designing efficient algorithms for quantum hardware. From Grover\'s search to Shor\'s factorization, we pioneer new methods to solve intractable problems in cryptography and optimization.'
    },
    'R': {
        title: 'Research',
        description: 'Pushing the boundaries of scientific discovery. Our interdisciplinary team bridges physics, computer science, and mathematics to advance the state of the art in quantum technology.'
    }
};

const InfoModal = ({ letter, onClose }) => {
    if (!letter || !qcarData[letter]) return null;
    const { title, description } = qcarData[letter];

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
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(5px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #89a783',
                    borderRadius: '16px',
                    padding: '40px',
                    maxWidth: '500px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 0 30px rgba(137, 167, 131, 0.2)'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        fontSize: '24px',
                        cursor: 'pointer'
                    }}
                >
                    &times;
                </button>
                <div style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    color: '#89a783',
                    marginBottom: '10px',
                    lineHeight: 1
                }}>
                    {letter}
                </div>
                <h2 style={{
                    fontSize: '2rem',
                    color: '#fff',
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-main)'
                }}>
                    {title}
                </h2>
                <p style={{
                    color: '#ccc',
                    lineHeight: 1.6,
                    fontSize: '1.1rem'
                }}>
                    {description}
                </p>
            </motion.div>
        </motion.div>
    );
};

// QCAR target Mapping
const qcarMap = [
    { wordIndex: 0, charIndex: 0 }, // Q
    { wordIndex: 1, charIndex: 0 }, // C
    { wordIndex: 2, charIndex: 0 }, // A
    { wordIndex: 3, charIndex: 0 }  // R
];

const AnimatedWord = ({ word, wordIndex, scrollYProgress, onInitialClick }) => {
    return (
        <span style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.4em' }}>
            {word.split('').map((char, charIndex) => {
                const isTargetInitial = qcarMap.some(m => m.wordIndex === wordIndex && m.charIndex === charIndex);

                return (
                    <LetterWrapper
                        key={charIndex}
                        char={char}
                        isInitial={isTargetInitial}
                        initialPos={wordIndex} // 0=Q, 1=C, 2=A, 3=R used for ordering QCAR
                        scrollYProgress={scrollYProgress}
                        onClick={isTargetInitial ? () => onInitialClick(char) : undefined}
                    />
                );
            })}
        </span>
    );
};


const LetterWrapper = ({ char, isInitial, initialPos, scrollYProgress, onClick }) => {
    const spanRef = useRef(null);
    const [delta, setDelta] = useState({ x: 0, y: 0 });

    // Scatter vars for non-initials (they start scattered/hidden and come in)
    const rX = (Math.random() - 0.5) * 1500;
    const rY = (Math.random() - 0.5) * 1500;
    const rR = (Math.random() - 0.5) * 720;

    useLayoutEffect(() => {
        if (!isInitial || !spanRef.current) return;

        const measure = () => {
            if (!spanRef.current) return;

            const parent = spanRef.current.offsetParent;
            if (!parent) return;

            const startX = spanRef.current.offsetLeft + (spanRef.current.offsetWidth / 2);
            const startY = spanRef.current.offsetTop + (spanRef.current.offsetHeight / 2);

            const parentWidth = parent.offsetWidth;
            const parentHeight = parent.offsetHeight;

            const centerX = parentWidth / 2;
            const centerY = parentHeight / 2;

            // QCAR should be "up" initially. 
            // Place at Center + Offset
            const isMobile = window.innerWidth < 768;
            const offset = isMobile ? 40 : 60;
            const qcarY = (parentHeight * 0.5) + offset;

            // Target Size Config
            const targetCharWidth = isMobile ? window.innerWidth * 0.12 : window.innerWidth * 0.05;
            const spacing = targetCharWidth * 1.5;

            // Calculate Total Width of "Q C A R"
            const totalGroupWidth = spacing * 3;
            const groupStartX = centerX - (totalGroupWidth / 2);

            const targetX = groupStartX + (initialPos * spacing);
            const targetY = qcarY;

            setDelta({
                x: targetX - startX,
                y: targetY - startY
            });
        };

        measure();
        document.fonts.ready.then(measure);
        window.addEventListener('resize', measure);
        const timer = setTimeout(measure, 1000);

        return () => {
            window.removeEventListener('resize', measure);
            clearTimeout(timer);
        };
    }, [isInitial, initialPos]);

    // INVERTED LOGIC:
    // Scroll 0 = Start State (QCAR for initials, Hidden for others)
    // Scroll 1 = End State (Full Text visible and centered)

    // Initials: Start at Delta (QCAR POS), End at 0 (Natural POS)
    // Finish assembly by 0.35 to allow "Hold" time before fade out at 0.55
    const xConverge = useTransform(scrollYProgress, [0, 0.35], [delta.x, 0]);
    const yConverge = useTransform(scrollYProgress, [0, 0.35], [delta.y, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.35], [1.5, 1]); // Start bigger?

    // Color: Start green (QCAR), End white (Full text)
    const color = useTransform(scrollYProgress, [0, 0.35], ['#89a783', '#ffffff']);


    // Others: Start Scattered/Hidden, End at 0/Visible
    const xScatter = useTransform(scrollYProgress, [0, 0.35], [rX, 0]);
    const yScatter = useTransform(scrollYProgress, [0, 0.35], [rY, 0]);
    const opacityScatter = useTransform(scrollYProgress, [0.1, 0.35], [0, 1]); // Fade in quickly
    const rotateScatter = useTransform(scrollYProgress, [0, 0.35], [rR, 0]);

    if (isInitial) {
        return (
            <motion.span
                ref={spanRef}
                onClick={onClick}
                whileHover={{ scale: 1.3, zIndex: 50, color: '#c5e0bf', cursor: 'pointer' }}
                whileTap={{ scale: 0.95 }}
                style={{
                    display: 'inline-block',
                    x: xConverge,
                    y: yConverge,
                    color: color,
                    scale: scale, // Use dynamic scale
                    zIndex: 20,
                    position: 'relative',
                    cursor: 'pointer'
                }}
            >
                {char}
            </motion.span>
        );
    }

    return (
        <motion.span
            style={{
                display: 'inline-block',
                x: xScatter,
                y: yScatter,
                opacity: opacityScatter,
                rotate: rotateScatter
            }}
        >
            {char}
        </motion.span>
    );
}

// Topic Data
const topicData = [
    {
        title: "Quantum Algorithm",
        description: "Designing algorithms that exploit quantum mechanical properties like superposition and entanglement to solve computational problems faster than classical computers. Key areas include search (Grover), factorization (Shor), and optimization (QAOA)."
    },
    {
        title: "Quantum Information",
        description: "Studying the theoretical basis of quantum communication and information processing. Topics covers Quantum Key Distribution (QKD), teleportation, dense coding, and entropy in quantum systems."
    },
    {
        title: "Quantum Computing",
        description: "Focusing on the development of robust quantum hardware and software architectures. We research fault tolerance, error correction codes, and the physical implementation of qubits to build scalable quantum systems."
    }
];

const TopicModal = ({ topic, onClose }) => {
    if (!topic) return null;

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
                    padding: '50px',
                    maxWidth: '800px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 0 40px rgba(137, 167, 131, 0.3)'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '25px',
                        right: '25px',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        fontSize: '28px',
                        cursor: 'pointer'
                    }}
                >
                    &times;
                </button>

                <h2 style={{
                    fontSize: '2.5rem',
                    color: '#fff',
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-main)',
                    lineHeight: 1.2
                }}>
                    {topic.title}
                </h2>
                <div style={{
                    width: '60px',
                    height: '3px',
                    background: '#89a783',
                    marginBottom: '2rem'
                }} />
                <p style={{
                    color: '#ddd',
                    lineHeight: 1.8,
                    fontSize: '1.2rem'
                }}>
                    {topic.description}
                </p>
                <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                    * Click anywhere outside to close
                </div>
            </motion.div>
        </motion.div>
    );
};

const Home = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const [selectedLetter, setSelectedLetter] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [videoActive, setVideoActive] = useState(false);
    const [footerActive, setFooterActive] = useState(false);
    const [gifKey, setGifKey] = useState(0);
    const isMobile = useIsMobile();

    // Adjusted Trigger for Video (Stage 2) & Footer (Stage 4)
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        // Video active range: ~0.75 to 0.90
        if (latest > 0.7 && latest < 0.95 && !videoActive) {
            setVideoActive(true);
            setGifKey(Date.now()); // Force GIF restart
        } else if ((latest < 0.65 || latest > 0.98) && videoActive) {
            setVideoActive(false);
        }

        // Footer active range: > 0.95
        if (latest > 0.95 && !footerActive) {
            setFooterActive(true);
        } else if (latest <= 0.95 && footerActive) {
            setFooterActive(false);
        }
    });

    const logoSize = isMobile ? '100px' : '150px';
    const startLogoY = isMobile ? -120 : -180;
    const endLogoY = startLogoY - 100;

    // Logo Animation: Fades out earlier to make room for Video
    const logoOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const logoY = useTransform(scrollYProgress, [0, 0.5], [startLogoY, endLogoY]);

    // Text & Subtitle: Hold until 0.55, then Fade Out
    const textOpacity = useTransform(scrollYProgress, [0.55, 0.65], [1, 0]);

    // Subtitle Opacity: Fade in late, Hold, Fade out with Text
    const subtitleOpacity = useTransform(scrollYProgress, [0.4, 0.5, 0.55, 0.65], [0, 1, 1, 0]);

    // Video Section (Stage 2): Fade In -> Hold -> Fade Out
    // Gap 0.65-0.70. Fade In 0.70-0.75. Hold. Fade Out 0.85-0.88
    const videoContainerOpacity = useTransform(scrollYProgress, [0.70, 0.75, 0.85, 0.88], [0, 1, 1, 0]);
    const videoContainerY = useTransform(scrollYProgress, [0.70, 0.75, 0.85, 0.88], [50, 0, 0, -50]);

    // Partner Logos (Stage 3): Fade In -> Hold -> Fade Out
    // Appears after Video (0.88). 
    const partnersOpacity = useTransform(scrollYProgress, [0.88, 0.90, 0.94, 0.96], [0, 1, 1, 0]);
    const partnersY = useTransform(scrollYProgress, [0.88, 0.90, 0.94, 0.96], [50, 0, 0, -50]);

    // Footer / Recruitment (Stage 4): Fade In at very end
    const footerOpacity = useTransform(scrollYProgress, [0.96, 0.98], [0, 1]);
    const footerY = useTransform(scrollYProgress, [0.96, 0.98], [50, 0]);

    const partnerLogos = [
        { img: imscLogo, label: 'IMSC', width: '80px' },
        { img: jncasrLogo, label: 'JNCASR', width: '70px' },
        { img: uodLogo, label: 'UOD', width: '80px' },
        { img: pecslabLogo, label: 'PECSLAB', width: '100px' }
    ];

    return (
        <div ref={containerRef} style={{ height: '700vh', position: 'relative' }}>
            <div style={{
                position: 'sticky',
                top: 0,
                height: '100vh',
                padding: '5vh 10vw 15vh 10vw', // Shifted up by adding more bottom padding
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start'
            }}>
                {/* Logo */}
                <motion.img
                    src={logo}
                    alt="QCAR Logo"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: logoSize,
                        height: 'auto',
                        x: '-50%',
                        y: logoY,
                        opacity: logoOpacity,
                        zIndex: 30,
                        pointerEvents: 'none'
                    }}
                />

                {/* Main Text Stage */}
                <motion.h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 6rem)',
                    fontWeight: 'bold',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 30px rgba(137,167,131,0.15)',
                    margin: 0,
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    opacity: textOpacity
                }}>
                    <AnimatedWord word="Quantum" wordIndex={0} scrollYProgress={scrollYProgress} onInitialClick={setSelectedLetter} />
                    <AnimatedWord word="Computing" wordIndex={1} scrollYProgress={scrollYProgress} onInitialClick={setSelectedLetter} />
                    <AnimatedWord word="Algorithms" wordIndex={2} scrollYProgress={scrollYProgress} onInitialClick={setSelectedLetter} />
                    <div style={{ display: 'flex' }}>
                        <AnimatedWord word="Research" wordIndex={3} scrollYProgress={scrollYProgress} onInitialClick={setSelectedLetter} />
                        <AnimatedWord word="Group" wordIndex={4} scrollYProgress={scrollYProgress} onInitialClick={setSelectedLetter} />
                    </div>
                </motion.h1>

                {/* Tagline Stage */}
                <motion.div
                    style={{
                        marginTop: '3rem',
                        opacity: subtitleOpacity,
                        y: useTransform(scrollYProgress, [0.4, 0.6], [20, 0]),
                        textAlign: 'left'
                    }}
                >
                    <div style={{ width: '120px', height: '1px', background: 'linear-gradient(to right, #89a783, transparent)', marginBottom: '2rem' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#89a783' }}>Pioneering the Quantum Future</h2>

                </motion.div>

                {/* Video Section Stage */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        minHeight: '100vh',
                        borderRadius: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#000', // Black background to hide particles behind
                        opacity: videoContainerOpacity,
                        y: videoContainerY,
                        zIndex: 20
                    }}
                >
                    {/* Background Video */}
                    <img
                        key={gifKey}
                        src={videoGif}
                        alt="Quantum Background"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 0,
                            opacity: 0.6 // Reduced opacity as requested
                        }}
                    />

                    {/* Video Text Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: videoActive ? 1 : 0 }}
                        transition={{ delay: 3, duration: 0.8 }}
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            textAlign: 'center',
                            width: '100%',
                            padding: '2rem'
                        }}
                    >
                        {topicData.map((topic, index) => (
                            <motion.h3
                                key={index}
                                onClick={() => setSelectedTopic(topic)}
                                whileHover={{ scale: 1.15, textShadow: '0 0 20px rgba(255, 255, 255, 0.8)', color: '#c5e0bf' }}
                                style={{
                                    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    margin: 0,
                                    cursor: 'pointer',
                                    transition: 'color 0.3s'
                                }}
                            >
                                {topic.title}
                            </motion.h3>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Partners / Logos Section Stage */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 25,
                        pointerEvents: 'none', // Allow clicks to pass through if transparent
                        opacity: partnersOpacity,
                        y: partnersY
                    }}
                >
                    <div style={{
                        width: isMobile ? '90vw' : '80vw', // Reduced width for more margin
                        padding: isMobile ? '2rem' : '4rem', //  padding
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: isMobile ? '1.5rem' : '3rem',
                        pointerEvents: 'auto'
                    }}>
                        <h2 style={{
                            color: '#fff',
                            fontSize: isMobile ? '1.5rem' : '2.5rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                            margin: 0,
                            textTransform: 'uppercase',
                            opacity: 0.9,
                            textAlign: 'center',
                            marginBottom: '1rem' // Added margin below heading
                        }}>
                            Collaborators
                        </h2>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: isMobile ? '1.5rem 1rem' : '3rem 4rem', // Row/Column gap
                            width: '100%'
                        }}>
                            {partnerLogos.map((logo, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.5rem' // Small padding around each logo
                                }}>
                                    <div style={{
                                        height: isMobile ? '50px' : '90px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <motion.img
                                            src={logo.img}
                                            alt={logo.label}
                                            whileHover={{ filter: 'grayscale(0%) brightness(1)', scale: 1.2 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                width: 'auto',
                                                height: 'auto',
                                                maxWidth: isMobile ? `calc(${logo.width} * 0.7)` : `calc(${logo.width} * 1.2)`,
                                                maxHeight: '100%',
                                                filter: 'grayscale(100%) brightness(0.8)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </div>
                                    <span style={{
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: isMobile ? '0.6rem' : '0.9rem',
                                        letterSpacing: '0.1em',
                                        fontWeight: 500
                                    }}>
                                        {logo.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Footer / Recruitment Section (Stage 4) */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '10vh',
                        left: 0,
                        width: '100vw',
                        height: '85vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 26,
                        opacity: footerOpacity,
                        y: footerY,
                        pointerEvents: footerActive ? 'auto' : 'none'
                    }}
                >
                    <div style={{
                        width: isMobile ? '90vw' : '80vw',
                        padding: isMobile ? '2rem 2rem' : '4rem 4rem', // Reduced top padding
                        // Glassy effect for consistency
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '400px'
                    }}>
                        {/* Top Content: Headline & CTA */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h5 style={{
                                fontSize: isMobile ? '1.8rem' : '2.5rem',
                                fontWeight: 'bold',
                                color: '#fff',
                                maxWidth: '600px',
                                lineHeight: 1.3,
                                margin: '0 0 2rem 0' // Explicitly set margin top to 0
                            }}>
                                We are a dedicated team of researchers pushing the boundaries of quantum algorithms.</h5>
                            <motion.a
                                href="#"
                                whileHover={{ x: 10, color: '#fff' }}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    fontSize: '1.2rem',
                                    color: '#89a783',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                    paddingBottom: '5px',
                                    borderBottom: '1px solid rgba(137, 167, 131, 0.3)'
                                }}
                            >
                                Connect With Us <span style={{ marginLeft: '10px' }}>&rarr;</span>
                            </motion.a>
                        </div>

                        {/* Bottom Bar: Copyright & Socials */}
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'flex-start' : 'flex-end',
                            gap: '2rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: '2rem'
                        }}>
                            <div style={{
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.4)',
                                letterSpacing: '0.1em',
                                lineHeight: 1.8,
                                textTransform: 'uppercase'
                            }}>
                                <div>Copyright QCAR {new Date().getFullYear()}.</div>
                                <div>All Rights Reserved.</div>
                                <div>New Delhi, India</div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                {/* Placeholder Social Icons (Text for now) */}
                                {['LinkedIn', 'Twitter', 'GitHub'].map((social) => (
                                    <motion.a
                                        key={social}
                                        href="#"
                                        whileHover={{ y: -3, color: '#89a783' }}
                                        style={{ color: '#fff', fontSize: '0.9rem', textDecoration: 'none' }}
                                    >
                                        {social}
                                    </motion.a>
                                ))}

                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: '#89a783', color: '#000' }}
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: '1rem'
                                    }}
                                >
                                    &uarr;
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Scroll indicator or spacing filler */}
            <div style={{ height: '200vh' }}></div>

            {/* Info Modal */}
            <AnimatePresence>
                {selectedLetter && (
                    <InfoModal letter={selectedLetter} onClose={() => setSelectedLetter(null)} />
                )}
                {selectedTopic && (
                    <TopicModal topic={selectedTopic} onClose={() => setSelectedTopic(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
