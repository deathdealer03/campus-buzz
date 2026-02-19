/**
 * Login Page
 * User authentication form
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }

        setLoading(false);
    };

    // Quick login handlers for demo
    const quickLogin = async (role) => {
        setLoading(true);
        const credentials = {
            admin: { email: 'admin@upes.ac.in', password: 'admin123' },
            faculty: { email: 'faculty@upes.ac.in', password: 'faculty123' },
            student: { email: 'student@upes.ac.in', password: 'student123' },
        };

        const cred = credentials[role];
        const result = await login(cred.email, cred.password);

        if (result.success) {
            navigate('/', { replace: true });
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <div className="logo">
                            <div className="logo-icon">CB</div>
                            <span className="gradient-text">CAMPUS Buzz</span>
                        </div>
                    </Link>
                    <h1 className="auth-title">Welcome Back!</h1>
                    <p className="auth-subtitle">Sign in to access your account</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-divider">Quick Login (Demo)</div>

                <div className="flex gap-2">
                    <button
                        className="btn btn-secondary flex-1"
                        onClick={() => quickLogin('admin')}
                        disabled={loading}
                    >
                        👑 Admin
                    </button>
                    <button
                        className="btn btn-secondary flex-1"
                        onClick={() => quickLogin('faculty')}
                        disabled={loading}
                    >
                        👨‍🏫 Faculty
                    </button>
                    <button
                        className="btn btn-secondary flex-1"
                        onClick={() => quickLogin('student')}
                        disabled={loading}
                    >
                        🎓 Student
                    </button>
                </div>

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
