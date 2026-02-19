/**
 * API Service
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Get the authentication token from localStorage
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Make an API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== Auth API ====================

export const authAPI = {
    register: (userData) =>
        apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),

    login: (credentials) =>
        apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),

    getProfile: () =>
        apiRequest('/auth/profile'),

    updateProfile: (data) =>
        apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    getAllUsers: () =>
        apiRequest('/auth/users'),
};

// ==================== News API ====================

export const newsAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/news${queryString ? `?${queryString}` : ''}`);
    },

    getPrioritized: () =>
        apiRequest('/news/prioritized'),

    getById: (id) =>
        apiRequest(`/news/${id}`),

    getBySlug: (slug) =>
        apiRequest(`/news/${slug}`),

    create: (newsData) =>
        apiRequest('/news', {
            method: 'POST',
            body: JSON.stringify(newsData),
        }),

    update: (id, newsData) =>
        apiRequest(`/news/${id}`, {
            method: 'PUT',
            body: JSON.stringify(newsData),
        }),

    delete: (id) =>
        apiRequest(`/news/${id}`, {
            method: 'DELETE',
        }),

    getStats: () =>
        apiRequest('/news/stats'),
};

// ==================== Categories API ====================

export const categoriesAPI = {
    getAll: () =>
        apiRequest('/categories'),

    getBySlug: (slug, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/categories/${slug}${queryString ? `?${queryString}` : ''}`);
    },

    create: (categoryData) =>
        apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        }),

    update: (id, categoryData) =>
        apiRequest(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        }),

    delete: (id) =>
        apiRequest(`/categories/${id}`, {
            method: 'DELETE',
        }),
};

export const alumniAPI = {
    // Spotlight
    getSpotlights: () => apiRequest('/alumni/spotlights'),
    createAlumni: (data) => apiRequest('/alumni/spotlights', { method: 'POST', body: JSON.stringify(data) }),

    // Mentorship
    requestMentorship: (data) => apiRequest('/alumni/mentorship', { method: 'POST', body: JSON.stringify(data) }),
    getMentorshipRequests: () => apiRequest('/alumni/mentorship'),

    // Industry Newsfeed
    getIndustryPosts: (tag) => {
        const q = tag && tag !== 'All' ? `?tag=${encodeURIComponent(tag)}` : '';
        return apiRequest(`/alumni/industry-posts${q}`);
    },
    createIndustryPost: (data) => apiRequest('/alumni/industry-posts', { method: 'POST', body: JSON.stringify(data) }),
    likePost: (id) => apiRequest(`/alumni/industry-posts/${id}/like`, { method: 'POST' }),

    // Q&A
    getQuestions: () => apiRequest('/alumni/questions'),
    createQuestion: (data) => apiRequest('/alumni/questions', { method: 'POST', body: JSON.stringify(data) }),
    answerQuestion: (id, data) => apiRequest(`/alumni/questions/${id}/answer`, { method: 'POST', body: JSON.stringify(data) }),
    deletePost: (id) => apiRequest(`/alumni/industry-posts/${id}`, { method: 'DELETE' }),
    deleteQuestion: (id) => apiRequest(`/alumni/questions/${id}`, { method: 'DELETE' }),
    deleteAlumni: (id) => apiRequest(`/alumni/spotlights/${id}`, { method: 'DELETE' }),
};

export const clubsAPI = {
    // Clubs
    getClubs: (category) => {
        const q = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
        return apiRequest(`/clubs${q}`);
    },
    getClub: (id) => apiRequest(`/clubs/${id}`),
    createClub: (data) => apiRequest('/clubs', { method: 'POST', body: JSON.stringify(data) }),
    deleteClub: (id) => apiRequest(`/clubs/${id}`, { method: 'DELETE' }),

    // Posts
    getAllPosts: (category, type) => {
        const params = new URLSearchParams();
        if (category && category !== 'All') params.append('category', category);
        if (type && type !== 'All') params.append('type', type);
        const q = params.toString() ? `?${params}` : '';
        return apiRequest(`/clubs/posts${q}`);
    },
    getClubPosts: (clubId, type) => {
        const q = type && type !== 'All' ? `?type=${encodeURIComponent(type)}` : '';
        return apiRequest(`/clubs/${clubId}/posts${q}`);
    },
    createPost: (data) => apiRequest('/clubs/posts/create', { method: 'POST', body: JSON.stringify(data) }),
    deletePost: (postId) => apiRequest(`/clubs/posts/${postId}`, { method: 'DELETE' }),
    likePost: (postId) => apiRequest(`/clubs/posts/${postId}/like`, { method: 'POST' }),
};

export default {
    auth: authAPI,
    news: newsAPI,
    categories: categoriesAPI,
    alumni: alumniAPI,
    clubs: clubsAPI,
};

