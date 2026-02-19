-- CAMPUS Buzz Database Schema
-- SQLite Database Schema for University News Portal

-- Users table with role-based access control
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'faculty', 'student')) DEFAULT 'student',
    avatar TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories for organizing news
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📰',
    color TEXT DEFAULT '#3b82f6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- News/Posts table with priority system
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    category_id INTEGER NOT NULL,
    priority INTEGER DEFAULT 1 CHECK(priority BETWEEN 1 AND 5),
    author_id INTEGER NOT NULL,
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT 0,
    views INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('draft', 'published', 'archived')) DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_author ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_priority ON news(priority DESC);
CREATE INDEX IF NOT EXISTS idx_news_created ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, slug, description, icon, color) VALUES
    ('Academics', 'academics', 'Academic notices, exam schedules, and course updates', '📚', '#8b5cf6'),
    ('Events', 'events', 'Campus events, workshops, and seminars', '🎉', '#ec4899'),
    ('Announcements', 'announcements', 'Official university announcements', '📢', '#f59e0b'),
    ('Opportunities', 'opportunities', 'Internships, jobs, and scholarships', '💼', '#10b981'),
    ('Holidays', 'holidays', 'Holiday schedules and university closures', '🏖️', '#06b6d4');

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (email, password, name, role) VALUES
    ('admin@upes.ac.in', '$2a$10$rQnM1w.xnVJjZxqzq5vKxeJhLDDnCl0qlKZYl.0Z0G5qY8YW0HHXK', 'Admin User', 'admin');

-- Insert default faculty user (password: faculty123)
INSERT OR IGNORE INTO users (email, password, name, role) VALUES
    ('faculty@upes.ac.in', '$2a$10$UMxqU1JqK2dWVWqGvXQnXuJsxXXn.MxqU1JqK2dWVWqGvXQnXuJs', 'Faculty Member', 'faculty');

-- Insert default student user (password: student123)
INSERT OR IGNORE INTO users (email, password, name, role) VALUES
    ('student@upes.ac.in', '$2a$10$YZxqU1JqK2dWVWqGvXQnXuJsxXXn.YZxqU1JqK2dWVWqGvXQnXuJs', 'Student User', 'student');
