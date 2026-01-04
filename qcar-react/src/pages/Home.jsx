import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const Letter = ({ char, index, isInitial, totalIndex, scrollYProgress }) => {
    // Random scatter for non-initials
    const randomX = (Math.random() - 0.5) * 800;
    const randomY = (Math.random() - 0.5) * 800;
    const randomRotate = (Math.random() - 0.5) * 360;

    // Target positions for initials (centering them "QCAR")
    // Layout: Q C A R centered
    // Basic centering logic relative to their original position is hard without accurate measurements.
    // Easier approach: Move them all to a fixed center point, but offset slightly by their index in "QCAR".

    // Q C A R indices in the final word: 0, 1, 2, 3
    // We can guess approximate offsets: -1.5em, -0.5em, 0.5em, 1.5em

    let targetX = 0;
    let targetY = 0; // Center vertical

    if (isInitial) {
        // Map char to specific 'slot' in QCAR
        const slotMap = { 'Q': -120, 'C': -40, 'A': 40, 'R': 120 }; // pixels approx
        // Note: There are multiple 'C's, 'A's, 'R's. We need to identify WHICH one it is.
        // We'll pass a 'targetSlot' prop if it's the *correct* initial.
    }

    // Animation values
    // 0 scroll -> 0 displacement
    // 1 scroll -> target displacement

    // For non-initials:
    const xScatter = useTransform(scrollYProgress, [0, 0.4], [0, randomX]);
    const yScatter = useTransform(scrollYProgress, [0, 0.4], [0, randomY]);
    const opacityScatter = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const rotateScatter = useTransform(scrollYProgress, [0, 0.4], [0, randomRotate]);

    // For initials:
    // We need to calculate how far to move to get to 'center'. 
    // Since we are in a sticky container, we can use absolute positioning or translates.
    // IF we make the initials 'absolute' positioned at the end state? No, harder to layout initially.

    // Alternative:
    // Use `useTransform` to move from '0' (natural flow) to 'Center - CurrentPosition'.
    // Determining 'CurrentPosition' dynamically is tricky in React without refs for every letter.

    // Simplified Visual Hack:
    // Hide the original initials at end of scroll.
    // Show a new "QCAR" at center that fades in? 
    // User asked for: "initials Q C A R moves in such a way that it comes in center".

    // Let's try to make them move.
    // If we assume the container is centered, we can estimate.

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

                // Specialized transform for initials
                // This is an approximation. Ideally we'd measure.
                // Q is at approx -300px relative to center?
                // We'll use large approximations to converge 'near' center.

                // Let's rely on a simplified 'converge' where we don't know exact start, 
                // but we know we want them to end up 'tightly packed'.

                // We will handle Initials separately in the main component to keep it clean?
                // Or handle here.

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

            // We use offsetLeft/Top which are relative to the nearest positioned ancestor.
            // Our container is 'position: sticky', so it catches these.
            // Since the container is 100vh/100vw and pinned to top-left, 
            // offsetLeft/Top roughly equals viewport X/Y (if no scrolling within container).

            const parent = spanRef.current.offsetParent;
            if (!parent) return; // Not visible yet

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

        // Measure immediately
        measure();

        // Measure after fonts load (crucial for "production" build where fonts might strict layout)
        document.fonts.ready.then(measure);

        // Measure on resize
        window.addEventListener('resize', measure);

        // Safety: Check again after a short delay for any framework layout shifts
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

    // Smooth color transition
    const color = useTransform(scrollYProgress, [0.4, 0.8], ['#ffffff', '#64ffda']);
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
                justifyContent: 'flex-start' // Match original alignment
            }}>
                <h1 style={{
                    fontSize: 'clamp(3rem, 8vw, 8rem)',
                    fontWeight: 'bold',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 30px rgba(100,255,218,0.15)',
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
                        background: 'linear-gradient(to right, rgba(100,255,218,0.5), transparent)',
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
            </div>

            {/* Scroll indicator or spacing filler */}
            <div style={{ height: '200vh' }}></div>
        </div>
    );
};

export default Home;
