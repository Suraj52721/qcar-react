import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

import logo from '../assets/image.png';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <nav className="navbar">
                <div className="logo">
                    <Link to="/">
                        <img src={logo} alt="QUANTUM" style={{ height: '40px', width: 'auto' }} />
                    </Link>
                </div>

                {/* Desktop Menu */}
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/research">Research</Link>
                    <Link to="/team">Team</Link>
                    <Link to="/about">About</Link>
                    <Link to="/dashboard">Dashboard</Link>
                </div>

                {/* Mobile Menu Icon */}
                <button className="mobile-menu-icon" onClick={toggleMenu} aria-label="Toggle menu">
                    <div className="menu-line" style={{ transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 6px)' : 'none' }}></div>
                    <div className="menu-line" style={{ opacity: isMobileMenuOpen ? 0 : 1 }}></div>
                    <div className="menu-line" style={{ transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -6px)' : 'none' }}></div>
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-container ${isMobileMenuOpen ? 'open' : ''}`}>
                <Link to="/" onClick={closeMenu}>Home</Link>
                <Link to="/research" onClick={closeMenu}>Research</Link>
                <Link to="/team" onClick={closeMenu}>Team</Link>
                <Link to="/about" onClick={closeMenu}>About</Link>
                <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            </div>
        </>
    );
};

export default Navbar;
