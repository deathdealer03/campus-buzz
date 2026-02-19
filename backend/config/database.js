/**
 * Database Configuration
 * Initializes SQLite database connection and schema
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Database file path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

// Initialize database
let db;

/**
 * Initialize database connection and create tables
 */
function initDatabase() {
    try {
        // Create database connection
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');

        console.log('📦 Connected to SQLite database');

        // Create tables
        createTables();

        // Seed default data
        seedDefaultData();

        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
}

/**
 * Create database tables
 */
function createTables() {
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT CHECK(role IN ('admin', 'faculty', 'student')) DEFAULT 'student',
            avatar TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Categories table
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT DEFAULT '📰',
            color TEXT DEFAULT '#3b82f6',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // News table
    db.exec(`
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
        )
    `);

    // Alumni Profiles (Spotlight)
    db.exec(`
        CREATE TABLE IF NOT EXISTS alumni_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            batch_year INTEGER NOT NULL,
            branch TEXT DEFAULT 'CSE',
            company TEXT,
            role TEXT,
            avatar_url TEXT,
            bio TEXT,
            career_update TEXT,
            linkedin_url TEXT,
            email TEXT,
            is_mentor BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Mentorship Requests
    db.exec(`
        CREATE TABLE IF NOT EXISTS mentorship_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            student_email TEXT NOT NULL,
            alumni_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            message TEXT,
            scheduled_time TEXT,
            status TEXT CHECK(status IN ('pending','confirmed','completed','cancelled')) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (alumni_id) REFERENCES alumni_profiles(id) ON DELETE CASCADE
        )
    `);

    // Industry Posts (Newsfeed)
    db.exec(`
        CREATE TABLE IF NOT EXISTS industry_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alumni_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT DEFAULT 'CSE',
            likes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (alumni_id) REFERENCES alumni_profiles(id) ON DELETE CASCADE
        )
    `);

    // Q&A Questions
    db.exec(`
        CREATE TABLE IF NOT EXISTS qa_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            question TEXT NOT NULL,
            company_context TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Q&A Answers
    db.exec(`
        CREATE TABLE IF NOT EXISTS qa_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            alumni_id INTEGER NOT NULL,
            answer TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (question_id) REFERENCES qa_questions(id) ON DELETE CASCADE,
            FOREIGN KEY (alumni_id) REFERENCES alumni_profiles(id) ON DELETE CASCADE
        )
    `);

    // Clubs
    db.exec(`
        CREATE TABLE IF NOT EXISTS clubs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL DEFAULT 'Tech',
            description TEXT,
            logo_url TEXT,
            cover_url TEXT,
            founded_year INTEGER,
            member_count INTEGER DEFAULT 0,
            contact_email TEXT,
            instagram_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Club Posts
    db.exec(`
        CREATE TABLE IF NOT EXISTS club_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            club_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            post_type TEXT CHECK(post_type IN ('event','achievement','announcement','project','recruitment')) DEFAULT 'announcement',
            likes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
        )
    `);

    // Research Papers
    db.exec(`
        CREATE TABLE IF NOT EXISTS research_papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            abstract TEXT NOT NULL,
            journal_conference TEXT NOT NULL,
            publication_date DATE,
            pdf_link TEXT,
            citation_count INTEGER DEFAULT 0,
            looking_for_assistants BOOLEAN DEFAULT 0,
            author_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Student Achievements
    db.exec(`
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            date DATE,
            verified_by_dept BOOLEAN DEFAULT 0,
            image_url TEXT,
            student_id INTEGER NOT NULL,
            claps_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create indexes
    db.exec(`CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_news_author ON news(author_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_news_priority ON news(priority DESC)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_news_created ON news(created_at DESC)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alumni_batch ON alumni_profiles(batch_year DESC)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_industry_posts_alumni ON industry_posts(alumni_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_club_posts_club ON club_posts(club_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_research_author ON research_papers(author_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_achievements_student ON achievements(student_id)`);

    console.log('📋 Database tables created successfully');

}

/**
 * Seed default data (categories, admin user, sample news)
 */
function seedDefaultData() {
    // Insert default categories
    const categories = [
        { name: 'Academics', slug: 'academics', description: 'Academic notices, exam schedules, and course updates', icon: '📚', color: '#8b5cf6' },
        { name: 'Events', slug: 'events', description: 'Campus events, workshops, and seminars', icon: '🎉', color: '#ec4899' },
        { name: 'Announcements', slug: 'announcements', description: 'Official university announcements', icon: '📢', color: '#f59e0b' },
        { name: 'Opportunities', slug: 'opportunities', description: 'Internships, jobs, and scholarships', icon: '💼', color: '#10b981' },
        { name: 'Holidays', slug: 'holidays', description: 'Holiday schedules and university closures', icon: '🏖️', color: '#06b6d4' }
    ];

    const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (name, slug, description, icon, color) 
        VALUES (@name, @slug, @description, @icon, @color)
    `);

    categories.forEach(cat => insertCategory.run(cat));

    // Insert default users
    const users = [
        { email: 'admin@upes.ac.in', password: bcrypt.hashSync('admin123', 10), name: 'Admin User', role: 'admin' },
        { email: 'faculty@upes.ac.in', password: bcrypt.hashSync('faculty123', 10), name: 'Dr. Sharma', role: 'faculty' },
        { email: 'student@upes.ac.in', password: bcrypt.hashSync('student123', 10), name: 'Rahul Kumar', role: 'student' }
    ];

    const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (email, password, name, role) 
        VALUES (@email, @password, @name, @role)
    `);

    users.forEach(user => insertUser.run(user));

    // Check if we need to insert sample news
    const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get();

    if (newsCount.count === 0) {
        // Get admin user id
        const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
        const faculty = db.prepare('SELECT id FROM users WHERE role = ?').get('faculty');

        // Get category ids
        const academicsCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('academics');
        const eventsCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('events');
        const announcementsCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('announcements');
        const opportunitiesCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('opportunities');
        const holidaysCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('holidays');

        // Sample news data
        const sampleNews = [
            {
                title: 'End Semester Examination Schedule Released',
                slug: 'end-semester-exam-schedule-2024',
                description: 'The examination department has released the schedule for end semester examinations starting from March 15, 2024.',
                content: 'The Controller of Examinations office has officially released the End Semester Examination schedule for the academic session 2023-24. Students are advised to check their respective examination dates and prepare accordingly.\n\n**Key Dates:**\n- Exams begin: March 15, 2024\n- Exams end: April 5, 2024\n- Result declaration: April 20, 2024\n\nStudents must carry their admit cards to the examination hall.',
                category_id: academicsCat.id,
                priority: 5,
                author_id: admin.id,
                is_pinned: 1,
                image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
            },
            {
                title: 'TechFest 2024 - Innovation Summit',
                slug: 'techfest-2024-innovation-summit',
                description: 'Join us for the biggest tech event of the year featuring workshops, hackathons, and guest lectures from industry experts.',
                content: 'UPES is proud to announce TechFest 2024 - our annual technology festival that brings together the brightest minds in tech.\n\n**Event Highlights:**\n- 24-hour Hackathon with prizes worth ₹5 Lakhs\n- Workshops on AI, Blockchain, and Cloud Computing\n- Keynote by Google and Microsoft engineers\n- Startup pitch competition\n\n**Date:** February 20-22, 2024\n**Venue:** Main Auditorium & Tech Labs\n\nRegistration is now open on the student portal.',
                category_id: eventsCat.id,
                priority: 4,
                author_id: faculty.id,
                is_pinned: 1,
                image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
            },
            {
                title: 'New Library Timings Effective Immediately',
                slug: 'new-library-timings-2024',
                description: 'The central library will now operate with extended hours to facilitate student preparation for upcoming examinations.',
                content: 'To support students during the examination period, the Central Library will now operate with extended hours.\n\n**New Timings:**\n- Monday to Friday: 7:00 AM - 11:00 PM\n- Saturday: 8:00 AM - 8:00 PM\n- Sunday: 9:00 AM - 6:00 PM\n\nThese timings are effective from February 1, 2024, until further notice.',
                category_id: announcementsCat.id,
                priority: 3,
                author_id: admin.id,
                is_pinned: 0,
                image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'
            },
            {
                title: 'Google Summer Internship Program 2024',
                slug: 'google-summer-internship-2024',
                description: 'Google is offering summer internships for 3rd and 4th year students. Apply through the placement cell by February 28.',
                content: 'The Training and Placement Cell is pleased to announce that Google is recruiting summer interns from UPES.\n\n**Eligibility:**\n- 3rd and 4th year B.Tech students\n- CGPA above 7.5\n- Strong programming skills in Python/Java/C++\n\n**Stipend:** ₹80,000 per month\n**Duration:** 8-12 weeks\n**Location:** Bangalore/Hyderabad\n\n**Application Deadline:** February 28, 2024\n\nInterested students should register on the placement portal and upload their updated resume.',
                category_id: opportunitiesCat.id,
                priority: 5,
                author_id: faculty.id,
                is_pinned: 1,
                image_url: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800'
            },
            {
                title: 'Holi Festival Holiday - March 25, 2024',
                slug: 'holi-holiday-2024',
                description: 'The university will remain closed on March 25, 2024 on account of Holi festival.',
                content: 'This is to inform all students, faculty, and staff that the university will remain closed on **March 25, 2024** (Monday) on account of Holi festival.\n\nClasses will resume on March 26, 2024.\n\nWishing everyone a colorful and joyful Holi! 🎨',
                category_id: holidaysCat.id,
                priority: 2,
                author_id: admin.id,
                is_pinned: 0,
                image_url: 'https://images.unsplash.com/photo-1576096899289-8858b5fca41c?w=800'
            },
            {
                title: 'Workshop on Machine Learning Fundamentals',
                slug: 'ml-workshop-fundamentals',
                description: 'A hands-on workshop covering the basics of Machine Learning with Python. Open to all students.',
                content: 'The Department of Computer Science is organizing a 3-day workshop on Machine Learning Fundamentals.\n\n**Topics Covered:**\n- Introduction to ML and AI\n- Python for Data Science\n- Supervised Learning Algorithms\n- Neural Networks basics\n- Hands-on projects\n\n**Date:** March 1-3, 2024\n**Time:** 10:00 AM - 4:00 PM\n**Venue:** Computer Lab 3\n**Registration Fee:** Free for UPES students\n\nLimited seats available. Register on the student portal.',
                category_id: eventsCat.id,
                priority: 3,
                author_id: faculty.id,
                is_pinned: 0,
                image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800'
            }
        ];

        const insertNews = db.prepare(`
            INSERT INTO news (title, slug, description, content, category_id, priority, author_id, is_pinned, image_url) 
            VALUES (@title, @slug, @description, @content, @category_id, @priority, @author_id, @is_pinned, @image_url)
        `);

        sampleNews.forEach(news => insertNews.run(news));
        console.log('📰 Sample news data inserted');
    }

    // Seed alumni profiles
    const alumniCount = db.prepare('SELECT COUNT(*) as count FROM alumni_profiles').get();
    if (alumniCount.count === 0) {
        const alumniData = [
            {
                name: 'Priya Sharma',
                batch_year: 2021,
                branch: 'CSE',
                company: 'Google',
                role: 'Software Engineer II',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
                bio: 'Passionate about distributed systems and ML. Love mentoring juniors!',
                career_update: 'Just got promoted to SWE II at Google! Worked on Search infra. Happy to guide anyone preparing for FAANG interviews 🚀',
                linkedin_url: 'https://linkedin.com',
                email: 'priya@alumni.upes.ac.in',
                is_mentor: 1
            },
            {
                name: 'Arjun Mehta',
                batch_year: 2020,
                branch: 'CSE',
                company: 'Microsoft',
                role: 'Data Scientist',
                avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
                bio: 'Data Science @ Microsoft Azure. Ex-Intern at Amazon. IIT Bombay MTech.',
                career_update: 'Launched a new Azure ML feature that serves 10M+ users. AMA about Data Science careers and MS applications!',
                linkedin_url: 'https://linkedin.com',
                email: 'arjun@alumni.upes.ac.in',
                is_mentor: 1
            },
            {
                name: 'Neha Gupta',
                batch_year: 2022,
                branch: 'CSE',
                company: 'Flipkart',
                role: 'ML Engineer',
                avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
                bio: 'ML Engineer working on recommendation systems. GATE 2022 AIR 42.',
                career_update: 'Our recommendation model just improved CTR by 18%! If you want to break into ML, I share weekly tips on LinkedIn 💡',
                linkedin_url: 'https://linkedin.com',
                email: 'neha@alumni.upes.ac.in',
                is_mentor: 1
            },
            {
                name: 'Rohit Verma',
                batch_year: 2019,
                branch: 'CSE',
                company: 'Startup - ZenPay',
                role: 'Co-Founder & CTO',
                avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
                bio: 'Founded ZenPay after 3 years at Razorpay. Building the future of fintech.',
                career_update: 'ZenPay just closed our Series A of $4M! Looking for passionate engineers – DM me if interested 🎉',
                linkedin_url: 'https://linkedin.com',
                email: 'rohit@alumni.upes.ac.in',
                is_mentor: 1
            }
        ];

        const insertAlumni = db.prepare(`
            INSERT INTO alumni_profiles (name, batch_year, branch, company, role, avatar_url, bio, career_update, linkedin_url, email, is_mentor)
            VALUES (@name, @batch_year, @branch, @company, @role, @avatar_url, @bio, @career_update, @linkedin_url, @email, @is_mentor)
        `);
        alumniData.forEach(a => insertAlumni.run(a));

        // Seed industry posts
        const alumni1 = db.prepare('SELECT id FROM alumni_profiles WHERE name = ?').get('Priya Sharma');
        const alumni2 = db.prepare('SELECT id FROM alumni_profiles WHERE name = ?').get('Arjun Mehta');
        const alumni3 = db.prepare('SELECT id FROM alumni_profiles WHERE name = ?').get('Neha Gupta');
        const alumni4 = db.prepare('SELECT id FROM alumni_profiles WHERE name = ?').get('Rohit Verma');

        const industryPosts = [
            { alumni_id: alumni1.id, title: 'How FAANG conducts System Design Interviews in 2025', content: 'After 3 rounds at Google and 2 at Meta, here are the patterns I noticed. First, always clarify requirements. Second, start with a high-level design before diving deep. Third, discuss trade-offs openly – they love that. The key shift in 2025 is AI-augmented systems – expect questions on how your design handles ML model serving at scale.', tags: 'CSE' },
            { alumni_id: alumni2.id, title: 'Getting into Data Science without a Masters – my journey', content: 'Everyone told me I needed an MTech to land a DS role at a top company. I proved them wrong. Here is what actually matters: Kaggle competitions (I got to Expert level), side projects with real business impact, and a solid understanding of statistics. Microsoft hired me straight out of UPES because of my Kaggle ranking. Start today!', tags: 'Data Science' },
            { alumni_id: alumni3.id, title: 'Transformer models are changing recommendation systems', content: 'At Flipkart, we replaced our traditional collaborative filtering with a BERT4Rec-style transformer. The results? 18% CTR improvement and 12% higher GMV on the recommendations carousel. The key insight: sequential user behavior modeled as a language task. Resources: the RecSys 2024 paper by Kang & McAuley, and the HuggingFace recommendation tutorial.', tags: 'Machine Learning' },
            { alumni_id: alumni4.id, title: 'What I wish I knew before founding a startup', content: 'After 3 years at Razorpay and 2 years building ZenPay, here are my honest lessons: 1) Find a problem you personally experienced. 2) Talk to 100 potential users before writing code. 3) Your first 10 engineers define your culture forever. 4) Fundraising is a full-time job – plan for 6 months. 5) Take care of your mental health. Building ZenPay has been the hardest and most rewarding thing I have ever done.', tags: 'CSE' }
        ];

        const insertPost = db.prepare(`INSERT INTO industry_posts (alumni_id, title, content, tags) VALUES (@alumni_id, @title, @content, @tags)`);
        industryPosts.forEach(p => insertPost.run(p));

        // Seed Q&A
        const questions = [
            { student_name: 'Amit Kumar', question: 'How should I prepare for Google SWE interviews in 3 months?', company_context: 'Google' },
            { student_name: 'Sakshi Jain', question: 'What Python libraries are most important for a Data Science internship at a startup?', company_context: 'General DS' },
            { student_name: 'Dev Patel', question: 'Is doing a MTech from IIT worth it for a career in ML Research?', company_context: 'ML Research' }
        ];
        const insertQ = db.prepare(`INSERT INTO qa_questions (student_name, question, company_context) VALUES (@student_name, @question, @company_context)`);
        questions.forEach(q => insertQ.run(q));

        // Seed answer
        const q1 = db.prepare('SELECT id FROM qa_questions WHERE student_name = ?').get('Amit Kumar');
        db.prepare(`INSERT INTO qa_answers (question_id, alumni_id, answer) VALUES (?, ?, ?)`)
            .run(q1.id, alumni1.id, 'Focus on Leetcode medium problems, especially graphs and dynamic programming. Do 2–3 mock interviews per week using Pramp or with friends. Study system design from the Designing Data-Intensive Applications book. Month 1: DSA. Month 2: System Design. Month 3: Mock interviews + behavioral prep.');

        console.log('🎓 Sample alumni data inserted');
    }

    // Seed clubs
    const clubsCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get();
    if (clubsCount.count === 0) {
        const clubsData = [
            // Tech
            { name: 'CodeCraft', slug: 'codecraft', category: 'Tech', description: 'Competitive programming and open-source development club. We host weekly coding contests and hackathons.', logo_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200', cover_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', founded_year: 2018, member_count: 120, contact_email: 'codecraft@upes.ac.in' },
            { name: 'AI & Robotics Club', slug: 'ai-robotics', category: 'Tech', description: 'Exploring artificial intelligence, machine learning and robotics through hands-on projects and research.', logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200', cover_url: 'https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?w=800', founded_year: 2019, member_count: 95, contact_email: 'ai-robotics@upes.ac.in' },
            // Cultural
            { name: 'Spectrum — The Dramatics Club', slug: 'spectrum-dramatics', category: 'Cultural', description: 'Celebrating art, theatre and fine arts. We perform plays, mono-acts and street performances across festivals.', logo_url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=200', cover_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800', founded_year: 2016, member_count: 75, contact_email: 'spectrum@upes.ac.in' },
            { name: 'Tarang — Music Society', slug: 'tarang-music', category: 'Cultural', description: 'Classical and contemporary music. Vocals, guitar, keyboard, tabla — all welcome. Annual concert every spring.', logo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200', cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', founded_year: 2015, member_count: 90, contact_email: 'tarang@upes.ac.in' },
            // Literary
            { name: 'Quill — The Literary Club', slug: 'quill-literary', category: 'Literary', description: 'Creative writing, poetry, debates and book reviews. We publish a semesterly literary magazine.', logo_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200', cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800', founded_year: 2017, member_count: 55, contact_email: 'quill@upes.ac.in' },
            // Sports
            { name: 'Phoenix Sports Club', slug: 'phoenix-sports', category: 'Sports', description: 'Multi-sport club covering cricket, football, basketball and athletics. We represent UPES in inter-university tournaments.', logo_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200', cover_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', founded_year: 2015, member_count: 200, contact_email: 'phoenix@upes.ac.in' },
            // Social
            { name: 'NSS — National Service Scheme', slug: 'nss', category: 'Social', description: 'Community service, social awareness campaigns and rural outreach programs. Serving society through student power.', logo_url: 'https://images.unsplash.com/photo-1593113616828-6f22bca04804?w=200', cover_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800', founded_year: 2014, member_count: 300, contact_email: 'nss@upes.ac.in' },
            // Academic
            { name: 'IEEE Student Chapter', slug: 'ieee-upes', category: 'Academic', description: 'IEEE UPES Student Branch organises technical talks, paper presentations and industry visits for aspiring engineers.', logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200', cover_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', founded_year: 2016, member_count: 160, contact_email: 'ieee@upes.ac.in' },
        ];

        const insertClub = db.prepare(`
            INSERT INTO clubs (name, slug, category, description, logo_url, cover_url, founded_year, member_count, contact_email)
            VALUES (@name, @slug, @category, @description, @logo_url, @cover_url, @founded_year, @member_count, @contact_email)
        `);
        clubsData.forEach(c => insertClub.run(c));

        // Seed club posts
        const codecraft = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('codecraft');
        const aiRobotics = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('ai-robotics');
        const spectrum = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('spectrum-dramatics');
        const tarang = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('tarang-music');
        const quill = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('quill-literary');
        const phoenix = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('phoenix-sports');
        const nss = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('nss');
        const ieee = db.prepare('SELECT id FROM clubs WHERE slug = ?').get('ieee-upes');

        const clubPosts = [
            { club_id: codecraft.id, title: 'Codewar 2025 — Results & Winners 🏆', content: 'Our annual 6-hour coding marathon concluded with 80+ participants. 1st Place: Rahul Verma (CSE-3), 2nd: Priya Singh (CSE-2). Problems covered graphs, DP and segment trees. Certificates dispatched via email. See you at Codewar 2026!', post_type: 'achievement' },
            { club_id: codecraft.id, title: 'Open Source Contribution Drive — Join Us!', content: 'We are organising a month-long open source contribution drive. Pick any good-first-issue on GitHub, make a PR, and get featured in our Hall of Contributors. All branches welcome. Meeting every Saturday 3PM, Lab 204.', post_type: 'recruitment' },
            { club_id: aiRobotics.id, title: 'Line-Following Robot Workshop', content: 'We built and raced 12 autonomous line-following robots last weekend! The workshop covered Arduino, H-bridge motor drivers and PID control. Next session: Computer Vision with OpenCV — March 8th.', post_type: 'event' },
            { club_id: aiRobotics.id, title: 'Research Paper Accepted at ICML 2025!', content: 'Proud to announce that our club members Aditya Rao and Sneha Kulkarni had their paper "Lightweight Transformers for Edge Inference" accepted at ICML 2025. This is a landmark achievement for UPES! 🎉', post_type: 'achievement' },
            { club_id: spectrum.id, title: 'Annual Play: "The Waiting Room" — March 15', content: 'We present our annual theatrical production "The Waiting Room" — a thought-provoking play about time, regret and second chances. Venue: Main Auditorium. Doors open at 6:30 PM. Entry FREE for all UPES students.', post_type: 'event' },
            { club_id: tarang.id, title: 'Spring Fest Music Night — Performers Wanted!', content: 'Spring Fest Music Night is on April 5th. We are looking for vocalists, guitarists, and percussionists. Auditions: March 20-22 in Music Room B. Send your demo to tarang@upes.ac.in. All genres welcome!', post_type: 'recruitment' },
            { club_id: quill.id, title: 'Inkwell Vol. 4 — Submit Your Work!', content: 'Our semesterly literary magazine "Inkwell" is accepting submissions! Poetry, short stories, essays and satire. Word limit: 1500 for prose, 60 lines for poetry. Deadline: March 10. Submit at quill.upes.ac.in', post_type: 'announcement' },
            { club_id: phoenix.id, title: 'Inter-University Cricket — We Are Champions!', content: 'UPES XI clinched the Uttarakhand Inter-University Cricket Championship 2025, defeating IIT Roorkee in a nail-biting final. Congratulations to Captain Vikram Singh and the entire squad! 🏏🏆', post_type: 'achievement' },
            { club_id: nss.id, title: 'Blood Donation Camp — February 28', content: 'NSS UPES organises a blood donation camp in collaboration with Himalayan Hospital. Date: Feb 28, 10AM–3PM, Admin Block. Every donation saves 3 lives. Refreshments provided. Register at the NSS stall.', post_type: 'event' },
            { club_id: ieee.id, title: 'Tech Talk: Future of Quantum Computing', content: 'IEEE UPES invites Dr Meera Krishnan (IBM Research) for an exclusive talk on Quantum Computing and its practical applications for software engineers. March 5, 11AM, Seminar Hall. All branches welcome.', post_type: 'event' },
        ];

        const insertPost = db.prepare(`
            INSERT INTO club_posts (club_id, title, content, post_type)
            VALUES (@club_id, @title, @content, @post_type)
        `);
        clubPosts.forEach(p => insertPost.run(p));
        console.log('🏛 Sample clubs data inserted');
    }

    // Seed Research Papers
    const researchCount = db.prepare('SELECT COUNT(*) as count FROM research_papers').get();
    if (researchCount.count === 0) {
        const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
        const faculty = db.prepare('SELECT id FROM users WHERE role = ?').get('faculty');

        const researchData = [
            {
                title: 'AI-Driven Traffic Management System for Smart Cities',
                abstract: 'This paper proposes a novel approach to urban traffic control using deep reinforcement learning. By analyzing real-time camera feeds, the system optimizes traffic light timings to reduce congestion by 22%.',
                journal_conference: 'IEEE International Conference on Smart Cities 2024',
                publication_date: '2024-05-12',
                pdf_link: '#',
                citation_count: 14,
                looking_for_assistants: 1,
                author_id: faculty.id
            },
            {
                title: 'Quantum Cryptography: Securing the Future Internet',
                abstract: 'An overview of post-quantum cryptographic algorithms and their implementation challenges in existing network infrastructure. We demonstrate a hybrid key exchange protocol resistant to quantum attacks.',
                journal_conference: 'Journal of Network Security, Vol 12',
                publication_date: '2023-11-20',
                pdf_link: '#',
                citation_count: 32,
                looking_for_assistants: 0,
                author_id: faculty.id
            },
            {
                title: 'Sustainable Energy Harvesting from Piezoelectric Materials',
                abstract: 'Investigating the efficiency of new polymer composites in harvesting energy from footfall traffic in university corridors. Preliminary results show a 15% increase in power output compared to traditional ceramics.',
                journal_conference: 'Renewable Energy Summit 2024',
                publication_date: '2024-02-15',
                pdf_link: '#',
                citation_count: 5,
                looking_for_assistants: 1,
                author_id: admin.id // Using admin as placeholder for another faculty
            }
        ];

        const insertResearch = db.prepare(`
            INSERT INTO research_papers (title, abstract, journal_conference, publication_date, pdf_link, citation_count, looking_for_assistants, author_id)
            VALUES (@title, @abstract, @journal_conference, @publication_date, @pdf_link, @citation_count, @looking_for_assistants, @author_id)
        `);
        researchData.forEach(r => insertResearch.run(r));
        console.log('🔬 Sample research papers inserted');
    }

    // Seed Student Achievements
    const achCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get();
    if (achCount.count === 0) {
        const student = db.prepare('SELECT id FROM users WHERE role = ?').get('student');

        const achData = [
            {
                title: '1st Place at Smart India Hackathon 2024',
                description: 'Developed "AgroTech," an AI-powered app for early plant disease detection. Competed against 500+ teams nationwide.',
                date: '2024-08-15',
                verified_by_dept: 1,
                image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500',
                student_id: student.id,
                claps_count: 45
            },
            {
                title: 'Google Summer of Code (GSoC) Mentor',
                description: 'Selected as a mentor for the TensorFlow organization. Guided 2 students in implementing new optimization algorithms.',
                date: '2024-06-01',
                verified_by_dept: 1,
                image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500',
                student_id: student.id,
                claps_count: 32
            },
            {
                title: 'Best Research Paper Award',
                description: 'Awarded "Best Paper" at the National Conference on Student Research for work on "Blockchain in Supply Chain".',
                date: '2023-12-10',
                verified_by_dept: 0,
                image_url: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=500',
                student_id: student.id,
                claps_count: 18
            }
        ];

        const insertAch = db.prepare(`
            INSERT INTO achievements (title, description, date, verified_by_dept, image_url, student_id, claps_count)
            VALUES (@title, @description, @date, @verified_by_dept, @image_url, @student_id, @claps_count)
        `);
        achData.forEach(a => insertAch.run(a));
        console.log('🏆 Sample student achievements inserted');
    }

    console.log('✅ Default data seeded successfully');

}

/**
 * Get database instance
 */
function getDatabase() {
    if (!db) {
        initDatabase();
    }
    return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
    if (db) {
        db.close();
        console.log('📦 Database connection closed');
    }
}

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase
};
