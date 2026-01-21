import { motion } from 'framer-motion';

const Contact = () => {
    return (
        <div style={{ padding: '150px 10vw 50px', color: '#fff' }}>
            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold', color: '#fff' }}
            >
                Contact Us
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ maxWidth: '500px' }}
            >
                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                    Interested in collaboration or joining the group? Reach out to us.
                </p>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="text"
                        placeholder="Name"
                        style={{
                            padding: '1rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            fontFamily: 'inherit',
                            fontSize: '1rem'
                        }}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        style={{
                            padding: '1rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            fontFamily: 'inherit',
                            fontSize: '1rem'
                        }}
                    />
                    <textarea
                        rows="5"
                        placeholder="Message"
                        style={{
                            padding: '1rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            resize: 'vertical'
                        }}
                    ></textarea>

                    <button
                        type="submit"
                        style={{
                            padding: '1rem 2rem',
                            background: 'transparent',
                            border: '1px solid #89a783',
                            color: '#89a783',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            alignSelf: 'flex-start',
                            transition: 'background 0.3s, color 0.3s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = 'rgba(100,255,218,0.1)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'transparent';
                        }}
                    >
                        Send Message
                    </button>
                </form>

                <div style={{ marginTop: '3rem', opacity: 0.6, fontSize: '0.9rem' }}>
                    <p>Or email us directly at:<br /><a href="mailto:contact@qcar.org" style={{ color: '#89a783', textDecoration: 'none' }}>contact@qcar.org</a></p>
                </div>
            </motion.div>
        </div>
    );
};

export default Contact;
