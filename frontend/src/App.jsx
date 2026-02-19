/**
 * App Component
 * Main application with routing
 */

import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import NewsDetail from './pages/NewsDetail';
import AdminPanel from './pages/AdminPanel';
import AlumniPage from './pages/AlumniPage';
import ClubsPage from './pages/ClubsPage';
import ResearchPage from './pages/ResearchPage';


function App() {
    const location = useLocation();

    // Check if current page is auth page (no header needed)
    const isAuthPage = ['/login', '/signup'].includes(location.pathname);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <div className="app">
            {/* Header - shown on all pages except auth */}
            {!isAuthPage && <Header />}

            {/* Routes */}
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/news/:slug" element={<NewsDetail />} />
                <Route path="/alumni" element={<AlumniPage />} />
                <Route path="/clubs" element={<ClubsPage />} />
                <Route path="/research" element={<ResearchPage />} />


                {/* Protected Routes */}
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute roles={['admin', 'faculty']}>
                            <AdminPanel />
                        </PrivateRoute>
                    }
                />

                {/* 404 Not Found */}
                <Route path="*" element={
                    <main className="main-content">
                        <div className="container">
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <h3 className="empty-state-title">Page Not Found</h3>
                                <p className="empty-state-text">The page you're looking for doesn't exist.</p>
                                <a href="/" className="btn btn-primary">Go to Home</a>
                            </div>
                        </div>
                    </main>
                } />
            </Routes>
        </div>
    );
}

export default App;
