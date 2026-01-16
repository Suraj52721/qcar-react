import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import RippleBackground from './RippleBackground';
import CursorGlow from './CursorGlow';


const Layout = () => {
    return (
        <>
            <RippleBackground />
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
