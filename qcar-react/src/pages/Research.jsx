import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SidePanel from '../components/SidePanel';
import ConnectionWire from '../components/ConnectionWire';
import useIsMobile from '../hooks/useIsMobile';

const papers = [
    {
        title: "Quantum Error Correction with Surface Codes",
        journal: "Nature Physics",
        year: "2024",
        abstract: "We present a novel approach to surface code implementation that reduces the physical qubit overhead by 15% while maintaining logical error rates. Our simulation results suggest this method is viable for near-term superconducting processors."
    },
    {
        title: "Variational Quantum Eigensolvers for Chemical Simulation",
        journal: "Physical Review X",
        year: "2023",
        abstract: "This paper explores the limits of VQE algorithms on noisy intermediate-scale quantum (NISQ) devices. We demonstrate improved accuracy in ground state energy estimation for Lithium Hydride using a noise-resilient ansatz."
    },
    {
        title: "Cryptanalytic Attacks on LWE using Quantum Annealing",
        journal: "IEEE S&P",
        year: "2025",
        abstract: "We analyze the vulnerability of Learning With Errors (LWE) based cryptosystems against D-Wave's latest quantum annealing hardware. Our findings indicate a potential reduction in the bit-security levels of standard parameters."
    },
    {
        title: "Entanglement Dynamics in Many-Body Localization",
        journal: "Physical Review Letters",
        year: "2024",
        abstract: "Investigating the growth of entanglement entropy in disordered quantum spin chains. We observe distinct phases of thermalization and localization, characterized by logarithmic growth of entanglement."
    },
    {
        title: "Topological Quantum Computing with Majorana Fermions",
        journal: "Reviews of Modern Physics",
        year: "2025",
        abstract: "A comprehensive review of the current state of Majorana-based qubits. We discuss recent experimental evidence in nanowire systems and the challenges remaining for braiding operations."
    }
];

const ResearchCard = ({ paper, index, setActivePaper, setCoords, isMobile }) => {
    const cardRef = useRef(null);
    const [expanded, setExpanded] = useState(false);

    const handleMouseEnter = () => {
        if (isMobile) return;
        setActivePaper({
            name: paper.title,
            role: `${paper.journal}, ${paper.year}`,
            description: paper.abstract
        });

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
        setActivePaper(null);
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="card-glow-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{
                marginBottom: '1.5rem',
                cursor: 'pointer'
            }}
        >
            <div className="card-content" style={{
                padding: '1.5rem',
                borderLeft: '2px solid transparent'
            }}>
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem', color: '#fff' }}>{paper.title}</h2>
                <div style={{ fontSize: '0.9rem', opacity: 0.6, color: '#64ffda', marginBottom: expanded ? '0.5rem' : '0' }}>{paper.journal}, {paper.year}</div>

                <AnimatePresence>
                    {isMobile && expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.6, marginTop: '1rem', color: '#fff', borderTop: '1px solid rgba(100,255,218,0.2)', paddingTop: '1rem' }}>
                                {paper.abstract}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const Research = () => {
    const [activePaper, setActivePaper] = useState(null);
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
                    <ConnectionWire start={coords} end={endCoords} active={!!activePaper} />
                    <SidePanel profile={activePaper} isOpen={!!activePaper} />
                </>
            )}

            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold' }}
            >
                Research
            </motion.h1>

            <div style={{ marginTop: '2rem', maxWidth: '800px' }}>
                <p style={{ maxWidth: '600px', lineHeight: 1.6, opacity: 0.8, marginBottom: '3rem' }}>
                    Our group is dedicated to pushing the boundaries of what's physically possible in computation.
                    From theoretical complexity classes to practical hardware implementation.
                </p>

                {papers.map((paper, i) => (
                    <ResearchCard
                        key={i}
                        paper={paper}
                        index={i}
                        setActivePaper={setActivePaper}
                        setCoords={setCoords}
                        isMobile={isMobile}
                    />
                ))}
            </div>
        </div>
    );
};

export default Research;
