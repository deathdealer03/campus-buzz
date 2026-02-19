# CAMPUS Buzz - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "user@upes.ac.in",
  "password": "password123",
  "name": "John Doe",
  "role": "student"  // admin, faculty, student
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "...", "name": "...", "role": "..." },
    "token": "jwt_token_here"
  }
}
```

---

### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@upes.ac.in",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "...", "name": "...", "role": "..." },
    "token": "jwt_token_here"
  }
}
```

---

### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "...", "name": "...", "role": "..." }
  }
}
```

---

## News Endpoints

### Get All News
```http
GET /news?category=academics&search=exam&page=1&limit=10
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category slug |
| search | string | Search in title/description |
| priority | number | Minimum priority level |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| sortBy | string | Sort field (created_at, priority, views) |
| order | string | ASC or DESC |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "news": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### Get Prioritized News
```http
GET /news/prioritized
```
Returns top 10 news sorted by pinned status and priority.

---

### Get News by ID/Slug
```http
GET /news/:identifier
```

---

### Create News
```http
POST /news
Authorization: Bearer <token>
```
*Requires: Admin or Faculty role*

**Body:**
```json
{
  "title": "News Title",
  "description": "Brief description",
  "content": "Full content...",
  "category_id": 1,
  "priority": 3,
  "image_url": "https://...",
  "is_pinned": false,
  "status": "published"
}
```

---

### Update News
```http
PUT /news/:id
Authorization: Bearer <token>
```
*Requires: Admin or Faculty role (author can edit own)*

---

### Delete News
```http
DELETE /news/:id
Authorization: Bearer <token>
```
*Requires: Admin role*

---

## Category Endpoints

### Get All Categories
```http
GET /categories
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Academics",
        "slug": "academics",
        "icon": "📚",
        "color": "#8b5cf6",
        "news_count": 15
      }
    ]
  }
}
```

---

### Get Category by Slug (with News)
```http
GET /categories/:slug?page=1&limit=10
```

---

### Create/Update/Delete Category
```http
POST /categories
PUT /categories/:id
DELETE /categories/:id
Authorization: Bearer <token>
```
*Requires: Admin role*

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@upes.ac.in | admin123 |
| Faculty | faculty@upes.ac.in | faculty123 |
| Student | student@upes.ac.in | student123 |
