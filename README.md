# CAMPUS Buzz – UPES News Portal

A centralized university news portal for sharing academic notices, events, announcements, and opportunities with role-based access for Admin, Faculty, and Students.

![CAMPUS Buzz](https://img.shields.io/badge/CAMPUS-Buzz-8b5cf6?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)

## ✨ Features

- 🔐 **Role-based Authentication** - Admin, Faculty, Student access levels
- 📰 **News Management** - Create, edit, delete, and prioritize news
- 📂 **Categories** - Academics, Events, Announcements, Opportunities, Holidays
- 🔍 **Search & Filter** - Find news by category, date, or keywords
- 📌 **Priority System** - Pin important announcements
- 🎨 **Modern UI** - Dark theme with glassmorphism effects

## 🚀 Quick Start

```bash
# Backend
cd backend
npm install
npm start     # Runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev   # Runs on http://localhost:5173
```

## 👥 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@upes.ac.in | admin123 |
| Faculty | faculty@upes.ac.in | faculty123 |
| Student | student@upes.ac.in | student123 |

## 📁 Project Structure

```
campus-buzz/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite SPA
└── docs/             # API & Deployment docs
```

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router, Vite
- **Backend:** Node.js, Express.js
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT (JSON Web Tokens)

## 📝 License

MIT License - UPES 2024
