# CAMPUS Buzz - Deployment Instructions

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

---

## Quick Start

### 1. Clone/Navigate to Project
```bash
cd "d:\minor project\campus-buzz"
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Start Backend Server
```bash
npm start
```
The API will be running at: **http://localhost:5000**

### 4. Install Frontend Dependencies (New Terminal)
```bash
cd frontend
npm install
```

### 5. Start Frontend Development Server
```bash
npm run dev
```
The app will be running at: **http://localhost:5173**

---

## Environment Configuration

### Backend (.env)
Located at `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
DB_PATH=./database.sqlite
```

> ⚠️ **Important:** Change `JWT_SECRET` to a strong random string in production!

---

## Database

The app uses **SQLite** for simplicity. The database file (`database.sqlite`) is automatically created on first run with:
- Default categories (Academics, Events, Announcements, Opportunities, Holidays)
- Default users (admin, faculty, student)
- Sample news articles

### Reset Database
To reset the database, simply delete `backend/database.sqlite` and restart the server.

---

## Production Build

### Frontend
```bash
cd frontend
npm run build
```
This creates a `dist` folder with optimized static files.

### Serve Production Build
You can serve the frontend build using any static file server, or configure the Express backend to serve it:

```javascript
// Add to backend/server.js
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

---

## Project Structure

```
campus-buzz/
├── backend/
│   ├── config/
│   │   └── database.js      # SQLite config & seeding
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── newsController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   └── roleCheck.js     # Role-based access
│   ├── routes/
│   │   ├── auth.js
│   │   ├── news.js
│   │   └── categories.js
│   ├── utils/
│   │   └── priorityAnalyzer.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── docs/
    ├── API.md
    └── DEPLOYMENT.md
```

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env
```

### SQLite Installation Issues
If `better-sqlite3` fails to install:
```bash
npm install --build-from-source better-sqlite3
```

### CORS Errors
Ensure frontend is running on port 5173 (configured in backend CORS).

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@upes.ac.in | admin123 |
| Faculty | faculty@upes.ac.in | faculty123 |
| Student | student@upes.ac.in | student123 |

---

## Support

For issues, check:
1. Backend console for API errors
2. Browser DevTools Network tab for request/response
3. Browser console for frontend errors
