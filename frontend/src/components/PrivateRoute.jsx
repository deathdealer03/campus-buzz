/**
 * PrivateRoute Component
 * Protects routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children, roles = [] }) {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading state
    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <span>Loading...</span>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check for required roles
    if (roles.length > 0 && !roles.includes(user.role)) {
        return (
            <div className="main-content">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔒</div>
                        <h3 className="empty-state-title">Access Denied</h3>
                        <p className="empty-state-text">
                            You don't have permission to access this page.
                        </p>
                        <a href="/" className="btn btn-primary">Go to Home</a>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}

export default PrivateRoute;
