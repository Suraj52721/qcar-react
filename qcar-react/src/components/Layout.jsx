import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ParticleBackground from './ParticleBackground';
import CursorGlow from './CursorGlow';

const Layout = () => {
    return (
        <>
            <ParticleBackground />
            <CursorGlow />
            <Navbar />
            <main style={{ position: 'relative', zIndex: 1 }}>
                <Outlet />
            </main>
            <Footer />
        </>
    );
};

export default Layout;
