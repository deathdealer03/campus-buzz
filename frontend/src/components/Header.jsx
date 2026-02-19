/**
 * Header Component
 * Navigation header with logo, nav links, and user menu
 */

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
    const { user, logout, isStaff, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="container header-content">
                {/* Logo */}
                <Link to="/" className="logo">
                    <div className="logo-icon">CB</div>
                    <span className="gradient-text">CAMPUS Buzz</span>
                </Link>

                {/* Navigation */}
                <nav className="nav">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Home
                    </NavLink>
                    <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Categories
                    </NavLink>
                    <NavLink to="/alumni" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        🎓 Alumni
                    </NavLink>
                    <NavLink to="/clubs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        🏛️ Clubs
                    </NavLink>
                    <NavLink to="/research" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        🔬 Research
                    </NavLink>
                    {isStaff() && (
                        <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Admin Panel
                        </NavLink>
                    )}
                </nav>


                {/* User Actions */}
                <div className="header-actions">
                    {user ? (
                        <div className="user-menu" onClick={handleLogout} title="Click to logout">
                            <div className="user-avatar">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="user-name">{user.name}</div>
                                <div className="user-role">{user.role}</div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '0.5rem' }}>
                                ↪ Logout
                            </span>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">
                                Login
                            </Link>
                            <Link to="/signup" className="btn btn-primary">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
