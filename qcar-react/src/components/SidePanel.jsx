import { motion, AnimatePresence } from 'framer-motion';

const SidePanel = ({ profile, isOpen }) => {
    return (
        <AnimatePresence>
            {isOpen && profile && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: '400px',
                        height: '100vh',
                        background: 'rgba(5, 5, 5, 0.95)',
                        borderLeft: '1px solid #64ffda',
                        backdropFilter: 'blur(10px)',
                        padding: '80px 40px',
                        zIndex: 1000,
                        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
                        overflowY: 'auto'
                    }}
                >
                    {/* Handle Team Profile Picture */}
                    {profile.name && (
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #64ffda 0%, #1d4f40 100%)',
                            marginBottom: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontWeight: 'bold',
                            fontSize: '2.5rem'
                        }}>
                            {profile.name.charAt(0)}
                        </div>
                    )}

                    <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '0.5rem' }}>{profile.name}</h2>
                    <h3 style={{ fontSize: '1rem', color: '#64ffda', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{profile.role}</h3>

                    <div style={{ width: '50px', height: '2px', background: '#64ffda', marginBottom: '2rem' }}></div>

                    <p style={{ lineHeight: 1.8, fontSize: '1rem', opacity: 0.8, marginBottom: '2rem' }}>
                        {profile.description}
                    </p>

                    <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                        {/* Generic Extra Info */}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SidePanel;
