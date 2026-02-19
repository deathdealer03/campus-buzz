/**
 * Priority Analyzer Utility
 * Analyzes content to determine priority level for news articles
 */

// Keywords that indicate high priority
const HIGH_PRIORITY_KEYWORDS = [
    'urgent', 'important', 'deadline', 'immediate', 'required', 'mandatory',
    'examination', 'exam', 'result', 'admission', 'registration',
    'last date', 'final', 'notice', 'alert', 'warning', 'emergency'
];

// Keywords that indicate medium priority
const MEDIUM_PRIORITY_KEYWORDS = [
    'workshop', 'seminar', 'event', 'opportunity', 'internship', 'placement',
    'scholarship', 'competition', 'conference', 'training', 'certification'
];

// Keywords that indicate lower priority
const LOW_PRIORITY_KEYWORDS = [
    'holiday', 'vacation', 'celebration', 'festival', 'cultural',
    'sports', 'club', 'fun', 'recreational'
];

/**
 * Analyze text content and determine priority level (1-5)
 * @param {string} title - Article title
 * @param {string} description - Article description
 * @param {string} content - Full article content
 * @returns {number} Priority level from 1 (lowest) to 5 (highest)
 */
function analyzePriority(title, description, content = '') {
    const fullText = `${title} ${description} ${content}`.toLowerCase();

    let score = 0;

    // Check for high priority keywords
    HIGH_PRIORITY_KEYWORDS.forEach(keyword => {
        if (fullText.includes(keyword.toLowerCase())) {
            score += 3;
        }
    });

    // Check for medium priority keywords
    MEDIUM_PRIORITY_KEYWORDS.forEach(keyword => {
        if (fullText.includes(keyword.toLowerCase())) {
            score += 2;
        }
    });

    // Check for low priority keywords
    LOW_PRIORITY_KEYWORDS.forEach(keyword => {
        if (fullText.includes(keyword.toLowerCase())) {
            score += 1;
        }
    });

    // Additional scoring factors

    // Check for dates (suggests time-sensitive content)
    const datePattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi;
    if (datePattern.test(fullText)) {
        score += 2;
    }

    // Check for monetary values (suggests financial opportunities)
    const moneyPattern = /₹\s*[\d,]+|rs\.?\s*[\d,]+|\$\s*[\d,]+/gi;
    if (moneyPattern.test(fullText)) {
        score += 2;
    }

    // Check for deadline mentions
    if (fullText.includes('last date') || fullText.includes('deadline')) {
        score += 3;
    }

    // Title emphasis (all caps or exclamation marks)
    if (title === title.toUpperCase() || title.includes('!')) {
        score += 1;
    }

    // Convert score to priority level (1-5)
    if (score >= 10) return 5;
    if (score >= 7) return 4;
    if (score >= 4) return 3;
    if (score >= 2) return 2;
    return 1;
}

/**
 * Categorize content based on keywords
 * @param {string} text - Text to analyze
 * @returns {string} Suggested category slug
 */
function suggestCategory(text) {
    const lowerText = text.toLowerCase();

    const categoryKeywords = {
        'academics': ['exam', 'syllabus', 'course', 'class', 'lecture', 'assignment', 'grade', 'semester', 'academic', 'curriculum'],
        'events': ['event', 'workshop', 'seminar', 'conference', 'fest', 'competition', 'hackathon', 'meetup'],
        'announcements': ['notice', 'announcement', 'update', 'change', 'policy', 'rule', 'guideline'],
        'opportunities': ['internship', 'job', 'placement', 'scholarship', 'career', 'opportunity', 'hiring', 'recruitment'],
        'holidays': ['holiday', 'vacation', 'break', 'festival', 'celebration', 'closure']
    };

    let maxScore = 0;
    let suggestedCategory = 'announcements';

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        let score = 0;
        keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                score++;
            }
        });

        if (score > maxScore) {
            maxScore = score;
            suggestedCategory = category;
        }
    }

    return suggestedCategory;
}

module.exports = {
    analyzePriority,
    suggestCategory,
    HIGH_PRIORITY_KEYWORDS,
    MEDIUM_PRIORITY_KEYWORDS,
    LOW_PRIORITY_KEYWORDS
};
