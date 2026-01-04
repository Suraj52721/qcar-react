import { motion } from 'framer-motion';

const About = () => {
    return (
        <div style={{ padding: '150px 10vw 50px' }}>
            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold' }}
            >
                About QCAR
            </motion.h1>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ maxWidth: '800px', lineHeight: 1.8, fontSize: '1.1rem', opacity: 0.8 }}
            >
                <p style={{ marginBottom: '1.5rem' }}>
                    The Quantum Computing Algorithms Research (QCAR) group was founded with the mission to bridge the gap between theoretical quantum physics and practical computational advantages.
                </p>
                <p style={{ marginBottom: '1.5rem' }}>
                    We focus on designing algorithms that can withstand the noise of the NISQ era while paving the way for fault-tolerant quantum computing. Our interdisciplinary team of physicists, computer scientists, and mathematicians works collaboratively to solve the most pressing challenges in the field.
                </p>
                <p>
                    From quantum machine learning to quantum cryptography, QCAR is at the forefront of the second quantum revolution.
                </p>
            </motion.div>
        </div>
    );
};

export default About;
