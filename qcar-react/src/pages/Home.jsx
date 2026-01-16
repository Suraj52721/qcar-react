import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import logo from '../assets/image.png';

const Letter = ({ char, index, isInitial, totalIndex, scrollYProgress }) => {
    // Random scatter for non-initials
    const randomX = (Math.random() - 0.5) * 800;
    const randomY = (Math.random() - 0.5) * 800;
    const randomRotate = (Math.random() - 0.5) * 360;

    let targetX = 0;
    let targetY = 0; // Center vertical

    if (isInitial) {
        const slotMap = { 'Q': -120, 'C': -40, 'A': 40, 'R': 120 };
    }

    // For non-initials:
    const xScatter = useTransform(scrollYProgress, [0, 0.4], [0, randomX]);
    const yScatter = useTransform(scrollYProgress, [0, 0.4], [0, randomY]);
    const opacityScatter = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const rotateScatter = useTransform(scrollYProgress, [0, 0.4], [0, randomRotate]);

    return (
        <motion.span
            style={{
                display: 'inline-block',
                x: isInitial ? 0 : xScatter,
                y: isInitial ? 0 : yScatter,
                opacity: isInitial ? 1 : opacityScatter,
                rotate: isInitial ? 0 : rotateScatter
            }}
        >
            {char}
        </motion.span>
    );
};

// Words configuration
const words = [
    { text: "Quantum", initialIndex: 0 },   // Q
    { text: "Computing", initialIndex: 0 }, // C
    { text: "Algorithms", initialIndex: 0 },// A
    { text: "Research", initialIndex: 0 },  // R
    { text: "Group", initialIndex: -1 }     // No initial
];

// QCAR target Mapping
const qcarMap = [
    { wordIndex: 0, charIndex: 0 }, // Q
    { wordIndex: 1, charIndex: 0 }, // C
    { wordIndex: 2, charIndex: 0 }, // A
    { wordIndex: 3, charIndex: 0 }  // R
];

const AnimatedWord = ({ word, wordIndex, scrollYProgress }) => {
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
                    />
                );
            })}
        </span>
    );
};


const LetterWrapper = ({ char, isInitial, initialPos, scrollYProgress }) => {
    const spanRef = useRef(null);
    const [delta, setDelta] = useState({ x: 0, y: 0 });
    // Non-initials scatter
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

            // Target Size Config
            const isMobile = window.innerWidth < 768;
            // Adaptive target sizing
            const targetCharWidth = isMobile ? window.innerWidth * 0.12 : window.innerWidth * 0.05;
            const spacing = targetCharWidth * 1.5;

            // Calculate Total Width of "Q C A R"
            const totalGroupWidth = spacing * 3;
            const groupStartX = centerX - (totalGroupWidth / 2);

            const targetX = groupStartX + (initialPos * spacing);
            const targetY = centerY;

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

    const xScatter = useTransform(scrollYProgress, [0, 0.6], [0, rX]);
    const yScatter = useTransform(scrollYProgress, [0, 0.6], [0, rY]);
    const opacityScatter = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
    const rotateScatter = useTransform(scrollYProgress, [0, 0.6], [0, rR]);

    const xConverge = useTransform(scrollYProgress, [0, 0.8], [0, delta.x]);
    const yConverge = useTransform(scrollYProgress, [0, 0.8], [0, delta.y]);

    const color = useTransform(scrollYProgress, [0.4, 0.8], ['#ffffff', '#89a783']);
    const scale = useTransform(scrollYProgress, [0, 0.8], [1, 1]);

    if (isInitial) {
        return (
            <motion.span
                ref={spanRef}
                style={{
                    display: 'inline-block',
                    x: xConverge,
                    y: yConverge,
                    color: color,
                    scale: scale,
                    zIndex: 20,
                    position: 'relative'
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

const Home = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const isMobile = window.innerWidth < 768;
    const logoSize = isMobile ? '100px' : '150px'; // Increased size
    const logoOffset = isMobile ? '-130px' : '-200px'; // Adjusted offset for larger logo

    return (
        <div ref={containerRef} style={{ height: '300vh', position: 'relative' }}>
            <div style={{
                position: 'sticky',
                top: 0,
                height: '100vh',
                padding: '15vh 10vw',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start'
            }}>
                {/* Logo that appears when QCAR forms */}
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
                        y: useTransform(scrollYProgress, [0.6, 0.8], [parseInt(logoOffset) - 50, parseInt(logoOffset)]),
                        opacity: useTransform(scrollYProgress, [0.6, 0.8], [0, 1]),
                        zIndex: 30,
                        pointerEvents: 'none'
                    }}
                />

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 6rem)',
                    fontWeight: 'bold',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 30px rgba(137,167,131,0.15)',
                    margin: 0,
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <AnimatedWord word="Quantum" wordIndex={0} scrollYProgress={scrollYProgress} />
                    <AnimatedWord word="Computing" wordIndex={1} scrollYProgress={scrollYProgress} />
                    <AnimatedWord word="Algorithms" wordIndex={2} scrollYProgress={scrollYProgress} />
                    <div style={{ display: 'flex' }}>
                        <AnimatedWord word="Research" wordIndex={3} scrollYProgress={scrollYProgress} />
                        <AnimatedWord word="Group" wordIndex={4} scrollYProgress={scrollYProgress} />
                    </div>
                </h1>

                <motion.div
                    style={{
                        opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]),
                        height: '1px',
                        width: '120px',
                        background: 'linear-gradient(to right, rgba(137,167,131,0.5), transparent)',
                        margin: '48px 0'
                    }}
                />

                <motion.div
                    className="sub"
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }}
                >
                    <div className="acronym" style={{ fontSize: '1.5rem' }}>QCAR</div>
                    <div className="tagline" style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '8px' }}>Exploring computation at the edge of physics</div>
                </motion.div>

                {/* New Content appearing after QCAR formation */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '55%', // Moved up from 60% to decrease space
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        padding: '0 20px',
                        opacity: useTransform(scrollYProgress, [0.7, 0.9], [0, 1]),
                        y: useTransform(scrollYProgress, [0.7, 0.9], [20, 0]),
                        pointerEvents: useTransform(scrollYProgress, v => v > 0.8 ? 'auto' : 'none')
                    }}
                >
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#89a783' }}>Pioneering the Quantum Future</h2>
                    <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                        We are a dedicated team of researchers and engineers pushing the boundaries of quantum algorithms.
                        Our work bridges the gap between theoretical quantum physics and practical computational solutions,
                        paving the way for the next generation of computing.
                    </p>
                </motion.div>
            </div>

            {/* Scroll indicator or spacing filler */}
            <div style={{ height: '200vh' }}></div>
        </div>
    );
};

export default Home;
