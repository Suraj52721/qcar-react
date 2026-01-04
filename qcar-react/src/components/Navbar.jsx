import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav style={{
            position: 'fixed',
            top: '24px',
            left: '48px',
            right: '48px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            zIndex: 100,
            textTransform: 'uppercase'
        }}>
            <div className="logo" style={{ fontWeight: 'bold' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>QUANTUM</Link>
            </div>
            <div className="nav-links">
                <Link to="/" style={{ marginLeft: '24px', textDecoration: 'none', color: 'white', opacity: 0.7 }}>Home</Link>
                <Link to="/research" style={{ marginLeft: '24px', textDecoration: 'none', color: 'white', opacity: 0.7 }}>Research</Link>
                <Link to="/team" style={{ marginLeft: '24px', textDecoration: 'none', color: 'white', opacity: 0.7 }}>Team</Link>
                <Link to="/about" style={{ marginLeft: '24px', textDecoration: 'none', color: 'white', opacity: 0.7 }}>About</Link>
            </div>
        </nav>
    );
};

export default Navbar;
