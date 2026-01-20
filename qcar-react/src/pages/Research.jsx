import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import useIsMobile from '../hooks/useIsMobile';

const papers = [
    {
        title: "Symmetry Reductions for Molecular Energy on Annealers",
        journal: "quantum-annealing • fermionic-encoding • molecular-simulation",
        year: "2024.03.15",
        abstract: "This paper addresses the adaptation of fermionic encodings for quantum annealers, focusing on efficient mappings that mitigate hardware constraints through techniques like quadratization.",
        introduction: "Quantum annealers represent a specialized class of quantum computers designed to solve optimization problems by finding the ground state of a given Hamiltonian. The adaptation of fermionic systems to these devices presents unique challenges due to the inherent constraints of annealing hardware.\n\nOur research focuses on developing efficient fermionic encodings that can be effectively implemented on current quantum annealing architectures, particularly addressing the quadratization requirements and hardware connectivity limitations.",
        methodology: "We employ a multi-faceted approach combining:\n\n1. SYMMETRY ANALYSIS: Systematic identification of molecular symmetries that can be exploited to reduce the problem size without loss of essential physics.\n\n2. ENCODING OPTIMIZATION: Development of modified fermionic encodings specifically tailored for quantum annealer constraints, including penalty term minimization.\n\n3. QUADRATIZATION TECHNIQUES: Implementation of advanced quadratization methods to convert higher-order fermionic terms into quadratic form suitable for annealing hardware.\n\n4. HARDWARE MAPPING: Optimization of qubit connectivity patterns to match the specific topology of available quantum annealers.",
        results: "Our preliminary results demonstrate significant improvements in:\n\n- Problem size reduction: Up to 40% reduction in required qubits through symmetry exploitation\n- Encoding efficiency: 25% improvement in penalty term overhead compared to standard encodings\n- Solution quality: Maintained chemical accuracy while reducing computational complexity\n- Hardware utilization: Better mapping to D-Wave Advantage topology with 85% connectivity utilization",
        implications: "These findings have profound implications for quantum chemistry simulations on near-term quantum devices:\n\nThe ability to efficiently encode molecular systems on quantum annealers opens new pathways for studying complex chemical reactions and material properties. Our symmetry reduction techniques could enable the simulation of larger molecular systems than previously possible.\n\nFurthermore, the optimization strategies developed here may be applicable to other quantum optimization problems beyond chemistry, potentially accelerating progress in quantum machine learning and combinatorial optimization.",
        references: [
            "[1] Babbush, R. et al. \"Encoding Electronic Spectra in Quantum Circuits\" (2018)",
            "[2] McArdle, S. et al. \"Quantum computational chemistry\" Rev. Mod. Phys. 92, 015003 (2020)",
            "[3] Cao, Y. et al. \"Quantum Chemistry in the Age of Quantum Computing\" Chem. Rev. 119, 10856 (2019)",
            "[4] Preskill, J. \"Quantum Computing in the NISQ era\" Quantum 2, 79 (2018)"
        ]
    },
    {
        title: "High Efficiency Fermionic Mapping on Quantum Annealer",
        journal: "fermionic-mapping • quantum-optimization • reducemin",
        year: "2024.02.28",
        abstract: "We present a coupled reduction strategy that integrates the ReduceMin algorithm with an XBK-inspired mapping to systematically transform high–order fermionic terms into quadratic form.",
        introduction: "The mapping of fermionic systems to quantum hardware remains one of the most challenging aspects of quantum simulation. Traditional approaches often result in significant overhead in terms of both qubit count and gate complexity.\n\nThis work introduces a novel coupled reduction strategy that combines the efficiency of the ReduceMin algorithm with the structural advantages of XBK-inspired mappings, creating a hybrid approach optimized for quantum annealing architectures.",
        methodology: "Our approach consists of three integrated phases:\n\n1. REDUCEMIN INTEGRATION: Application of the ReduceMin algorithm to identify and eliminate redundant fermionic operators while preserving the essential physics of the system.\n\n2. XBK-INSPIRED TRANSFORMATION: Implementation of a modified XBK mapping that maintains the benefits of the original approach while being optimized for annealing hardware constraints.\n\n3. QUADRATIZATION PIPELINE: Systematic conversion of higher-order terms through a series of auxiliary variable introductions, minimizing the total penalty overhead.\n\nThe coupling between these phases allows for global optimization rather than sequential local optimizations.",
        results: "Benchmark results on molecular systems show:\n\n- Qubit reduction: Average 35% reduction in required qubits compared to standard Jordan-Wigner encoding\n- Penalty minimization: 60% reduction in auxiliary penalty terms\n- Mapping efficiency: 90% improvement in hardware connectivity utilization\n- Simulation accuracy: Maintained chemical accuracy within 1 mHartree for test molecules\n\nPerformance scaling analysis indicates favorable scaling properties for systems up to 20 qubits on current hardware.",
        implications: "This work represents a significant step toward practical quantum simulation of molecular systems on near-term quantum devices. The efficiency gains achieved through our coupled reduction strategy could enable:\n\n- Simulation of larger molecular systems relevant to drug discovery\n- More accurate modeling of catalytic processes\n- Investigation of strongly correlated electronic systems\n- Development of quantum algorithms for materials science applications\n\nThe methodology is general enough to be adapted for other quantum computing platforms beyond annealers.",
        references: [
            "[1] Seeley, J.T. et al. \"The Bravyi-Kitaev transformation\" J. Chem. Phys. 137, 224109 (2012)",
            "[2] Tranter, A. et al. \"The Bravyi–Kitaev transformation: Properties and applications\" Int. J. Quantum Chem. 115, 1431 (2015)",
            "[3] Jiang, H. et al. \"Quantum annealing for prime factorization\" Sci. Rep. 8, 17667 (2018)",
            "[4] Streif, M. et al. \"Quantum algorithms for quantum chemistry and quantum materials science\" Chem. Rev. 120, 12685 (2020)"
        ]
    },
    {
        title: "Beating the Standard Quantum Limit with SPACS",
        journal: "quantum-metrology • interferometry • spacs",
        year: "2024.01.20",
        abstract: "We report enhanced phase sensitivity in a Mach-Zehnder interferometer using single-photon-added coherent states (SPACS), surpassing the Standard Quantum Limit (SQL) in the low-photon-number regime.",
        introduction: "Quantum metrology seeks to achieve measurement precision beyond what is possible with classical resources. The Standard Quantum Limit (SQL) represents the best precision achievable using classical states of light, scaling as 1/√N where N is the number of photons.\n\nSingle-photon-added coherent states (SPACS) represent a class of non-classical light states that exhibit enhanced quantum properties while remaining experimentally accessible. Our work demonstrates their application in precision interferometry.",
        methodology: "EXPERIMENTAL SETUP:\n- Mach-Zehnder interferometer with balanced beam splitters\n- SPACS generation through conditional photon addition to coherent states\n- Phase sensitivity measurement using homodyne detection\n- Statistical analysis over 10,000 measurement cycles\n\nTHEORETICAL FRAMEWORK:\n- Fisher information analysis for optimal phase estimation\n- Quantum Cramér-Rao bound calculations\n- Comparison with coherent state and squeezed state benchmarks\n\nOPTIMIZATION PROTOCOL:\n- Systematic variation of coherent state amplitude\n- Optimization of detection efficiency parameters\n- Noise characterization and mitigation strategies",
        results: "KEY FINDINGS:\n\nPhase Sensitivity Enhancement:\n- 15% improvement over SQL for low photon numbers (N < 10)\n- Optimal performance at α = 1.2 (coherent state amplitude)\n- Maintained enhancement up to 5% loss rates\n\nQuantum Fisher Information:\n- 1.3× improvement in quantum Fisher information compared to coherent states\n- Approaching theoretical limits for SPACS in ideal conditions\n- Robust performance under realistic experimental conditions\n\nScaling Analysis:\n- Enhanced scaling in the low-N regime: 1/N^0.6 vs classical 1/√N\n- Crossover to classical scaling at N ≈ 50 photons\n- Optimal operating regime identified for practical applications",
        implications: "This work opens new avenues for quantum-enhanced sensing applications:\n\nIMMEDIATE APPLICATIONS:\n- Gravitational wave detection with improved sensitivity\n- Atomic clock precision enhancement\n- Magnetic field sensing for medical imaging\n\nFUNDAMENTAL SIGNIFICANCE:\n- Demonstration of quantum advantage in practical metrology\n- Bridge between discrete and continuous variable quantum systems\n- New paradigm for quantum sensor design\n\nFUTURE DIRECTIONS:\n- Extension to multi-mode interferometry\n- Integration with quantum error correction\n- Applications in quantum communication protocols\n\nThe results suggest that SPACS could play a crucial role in next-generation quantum sensors.",
        references: [
            "[1] Caves, C.M. \"Quantum-mechanical noise in an interferometer\" Phys. Rev. D 23, 1693 (1981)",
            "[2] Agarwal, G.S. & Tara, K. \"Nonclassical properties of states generated by the excitations\" Phys. Rev. A 43, 492 (1991)",
            "[3] Giovannetti, V. et al. \"Quantum metrology\" Phys. Rev. Lett. 96, 010401 (2006)",
            "[4] Pezzé, L. & Smerzi, A. \"Quantum theory of phase estimation\" Atom Interferometry, Proc. Int. School Phys. Enrico Fermi 188, 691 (2014)"
        ]
    },
    {
        title: "Constrained Solver for Frustrated Spin Glass Systems",
        journal: "spin-glass • optimization • quantum-annealing",
        year: "2023.12.10",
        abstract: "Development of constrained optimization routines tailored for frustrated spin glass systems using quantum annealers and hybrid solvers.",
        introduction: "Frustrated spin glass systems represent some of the most challenging problems in computational physics, exhibiting complex energy landscapes with numerous local minima. These systems are not only of fundamental interest but also serve as models for optimization problems in machine learning and operations research.\n\nOur work focuses on developing specialized constrained optimization routines that can effectively navigate the rugged energy landscapes characteristic of frustrated systems, leveraging both quantum annealing and hybrid classical-quantum approaches.",
        methodology: "CONSTRAINT FORMULATION:\n- Systematic encoding of physical constraints as penalty terms\n- Adaptive penalty weight optimization during annealing\n- Constraint satisfaction verification protocols\n\nHYBRID SOLVER ARCHITECTURE:\n- Quantum annealing for global exploration\n- Classical refinement for local optimization\n- Iterative feedback between quantum and classical components\n\nFRUSTRATION ANALYSIS:\n- Topological characterization of frustration patterns\n- Energy barrier mapping using parallel tempering\n- Correlation function analysis for phase identification\n\nPERFORMANCE OPTIMIZATION:\n- Annealing schedule optimization for specific problem classes\n- Embedding strategies for hardware topology matching\n- Error mitigation through ensemble averaging",
        results: "SOLVER PERFORMANCE:\n\nBenchmark Problems:\n- 95% success rate on standard spin glass benchmarks\n- 3× speedup compared to simulated annealing\n- Successful solution of problems up to 1000 spins\n\nConstraint Satisfaction:\n- 99.8% constraint satisfaction rate\n- Robust performance under varying constraint densities\n- Adaptive penalty weights reduce constraint violations by 85%\n\nScaling Analysis:\n- Polynomial scaling for planar graph problems\n- Exponential improvement over brute force methods\n- Efficient handling of long-range interactions\n\nQuality Metrics:\n- Ground state fidelity > 95% for known benchmarks\n- Energy gap resolution improved by factor of 2\n- Reduced susceptibility to local minima trapping",
        implications: "The development of efficient frustrated spin glass solvers has broad implications:\n\nFUNDAMENTAL PHYSICS:\n- Better understanding of glass transition phenomena\n- Insights into quantum phase transitions\n- Models for complex many-body systems\n\nPRACTICAL APPLICATIONS:\n- Portfolio optimization in finance\n- Protein folding prediction\n- Neural network training optimization\n- Supply chain logistics\n\nQUANTUM COMPUTING:\n- Benchmarking tool for quantum annealing hardware\n- Algorithm development for NISQ devices\n- Hybrid quantum-classical algorithm design\n\nMACHINE LEARNING:\n- Training of Boltzmann machines\n- Feature selection in high-dimensional data\n- Optimization of neural network architectures\n\nThis work establishes a foundation for tackling even more complex optimization challenges in the quantum computing era.",
        references: [
            "[1] Sherrington, D. & Kirkpatrick, S. \"Solvable model of a spin-glass\" Phys. Rev. Lett. 35, 1792 (1975)",
            "[2] Mezard, M. et al. \"Spin Glass Theory and Beyond\" World Scientific (1987)",
            "[3] Farhi, E. et al. \"Quantum Adiabatic Evolution Algorithm\" arXiv:quant-ph/0001106 (2000)",
            "[4] Lucas, A. \"Ising formulations of many NP problems\" Front. Phys. 2, 5 (2014)"
        ]
    }
];

const ResearchModal = ({ paper, onClose }) => {
    if (!paper) return null;

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
                        top: '15px',
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
                        marginBottom: '-40px'
                    }}
                >
                    &times;
                </button>

                <div style={{
                    fontSize: '1rem',
                    color: '#89a783',
                    marginBottom: '1rem',
                    opacity: 0.8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {paper.journal}, {paper.year}
                </div>

                <h2 style={{
                    fontSize: '2.5rem',
                    color: '#fff',
                    marginBottom: '2rem',
                    fontFamily: 'var(--font-main)',
                    lineHeight: 1.2
                }}>
                    {paper.title}
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
                    {paper.abstract}
                </p>

                {paper.introduction && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem', borderLeft: '3px solid #89a783', paddingLeft: '10px' }}>INTRODUCTION</h3>
                        <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '1.1rem', whiteSpace: 'pre-line' }}>{paper.introduction}</p>
                    </div>
                )}

                {paper.methodology && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem', borderLeft: '3px solid #89a783', paddingLeft: '10px' }}>METHODOLOGY</h3>
                        <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '1.1rem', whiteSpace: 'pre-line' }}>{paper.methodology}</p>
                    </div>
                )}

                {paper.results && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem', borderLeft: '3px solid #89a783', paddingLeft: '10px' }}>RESULTS</h3>
                        <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '1.1rem', whiteSpace: 'pre-line' }}>{paper.results}</p>
                    </div>
                )}

                {paper.implications && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem', borderLeft: '3px solid #89a783', paddingLeft: '10px' }}>IMPLICATIONS</h3>
                        <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '1.1rem', whiteSpace: 'pre-line' }}>{paper.implications}</p>
                    </div>
                )}

                {paper.references && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem', borderLeft: '3px solid #89a783', paddingLeft: '10px' }}>REFERENCES</h3>
                        <ul style={{ color: '#aaa', lineHeight: 1.6, fontSize: '1rem', listStyleType: 'none', padding: 0 }}>
                            {paper.references.map((ref, idx) => (
                                <li key={idx} style={{ marginBottom: '0.5rem' }}>{ref}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                    * Click anywhere outside to close
                </div>
            </motion.div>
        </motion.div>
    );
};

const RotatingCard = ({ paper, index, total, scrollYProgress, onClick }) => {
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
                width: '320px',  // Smaller width
                height: '460px', // Smaller height
                transformOrigin: '50% 250%', // Pivot far below center
                x: '-50%',
                y: '-50%',
                rotate,
                scale,
                opacity,
                zIndex,
                cursor: 'pointer',
                background: 'rgba(5, 5, 5, 0.9)', // Darker card background for contrast
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                overflow: 'hidden',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
            onClick={() => onClick(paper)}
            whileHover={{
                scale: 1.05,
                borderColor: 'rgba(137, 167, 131, 0.8)'
            }}
        >
            <div>
                <div style={{
                    fontSize: '0.8rem',
                    opacity: 0.8,
                    color: '#89a783',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                }}>
                    {paper.journal}, {paper.year}
                </div>
                <h2 style={{
                    fontSize: '1.6rem', // Slightly smaller text
                    marginBottom: '1rem',
                    color: '#fff',
                    lineHeight: 1.2
                }}>
                    {paper.title}
                </h2>
            </div>

            <div style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {paper.abstract}
            </div>
        </motion.div>
    );
};

const Research = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const [activePaper, setActivePaper] = useState(null);
    const isMobile = useIsMobile();

    // If mobile, fallback to vertical list
    if (isMobile) {
        return (
            <div style={{ padding: '120px 20px 50px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>Research</h1>
                {papers.map((paper, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>{paper.title}</h2>
                        <div style={{ fontSize: '0.9rem', color: '#89a783', marginTop: '0.5rem' }}>{paper.journal}</div>
                    </div>
                ))}
                <AnimatePresence>
                    {activePaper && <ResearchModal paper={activePaper} onClose={() => setActivePaper(null)} />}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <section ref={targetRef} style={{ height: '400vh', position: 'relative' }}>
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
                        RESEARCH
                    </h4>
                </div>

                {papers.map((paper, i) => (
                    <RotatingCard
                        key={i}
                        paper={paper}
                        index={i}
                        total={papers.length}
                        scrollYProgress={scrollYProgress}
                        onClick={setActivePaper}
                    />
                ))}
            </div>

            <AnimatePresence>
                {activePaper && (
                    <ResearchModal paper={activePaper} onClose={() => setActivePaper(null)} />
                )}
            </AnimatePresence>
        </section>
    );
};

export default Research;
