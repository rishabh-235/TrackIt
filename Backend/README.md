# TrackIt Backend API

## 🚀 Overview

The backend of TrackIt is a robust RESTful API service built with Node.js and Express.js. It handles all the core business logic, data storage, authentication, and provides secure endpoints for the frontend application with role-based access control.

## 🛠️ Technology Stack

- **Node.js** - JavaScript runtime environment
- **Express.js 5** - Fast, minimalist web framework
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - MongoDB ODM for schema modeling
- **JWT (JSON Web Tokens)** - Secure authentication
- **Bcrypt.js** - Password hashing and security
- **Joi** - Data validation and sanitization
- **CORS** - Cross-origin resource sharing
- **Cookie-Parser** - HTTP cookie parsing
- **Dotenv** - Environment variable management

## 📁 Project Structure

```
Backend/
├── src/
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── dashboardController.js
│   ├── models/             # Database models
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── index.js
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/              # Helper utilities
│   │   ├── helpers.js
│   │   ├── auth.js
│   │   └── validation.js
│   ├── db/                 # Database configuration
│   │   └── db.config.js
│   └── app.js              # Express app configuration
├── index.js                # Server entry point
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables
├── .env.example            # Environment template
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (Local or Atlas)
- npm or yarn

### Installation

1. **Navigate to Backend Directory**

   ```bash
   cd Backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the Backend directory:

   ```env
   # Database Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trackit

   # Server Configuration
   PORT=5000

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-minimum-32-characters

   # Environment
   NODE_ENV=development
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 📜 Available Scripts

- **`npm run dev`** - Start development server with nodemon (auto-restart)
- **`npm start`** - Start production server
- **`npm test`** - Run test suite (Jest)

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint         | Description              | Access  |
| ------ | ---------------- | ------------------------ | ------- |
| POST   | `/register`      | Register new user        | Public  |
| POST   | `/login`         | User login               | Public  |
| POST   | `/logout`        | User logout              | Private |
| POST   | `/refresh-token` | Refresh access token     | Private |
| GET    | `/profile`       | Get current user profile | Private |

### User Routes (`/api/users`)

| Method | Endpoint    | Description      | Access  |
| ------ | ----------- | ---------------- | ------- |
| GET    | `/`         | Get all users    | Admin   |
| GET    | `/managers` | Get all managers | Private |
| GET    | `/:id`      | Get user by ID   | Admin   |
| PUT    | `/:id`      | Update user      | Admin   |
| DELETE | `/:id`      | Delete user      | Admin   |

### Project Routes (`/api/projects`)

| Method | Endpoint                    | Description                         | Access        |
| ------ | --------------------------- | ----------------------------------- | ------------- |
| GET    | `/`                         | Get all projects (filtered by role) | Private       |
| GET    | `/stats`                    | Get project statistics              | Admin/Manager |
| GET    | `/my-projects`              | Get current user's projects         | Private       |
| GET    | `/:id`                      | Get specific project                | Private       |
| POST   | `/`                         | Create new project                  | Admin/Manager |
| PUT    | `/:id`                      | Update project                      | Admin/Manager |
| PUT    | `/:id/archive`              | Archive project                     | Admin/Manager |
| POST   | `/:id/team-members`         | Add team member                     | Admin/Manager |
| DELETE | `/:id/team-members/:userId` | Remove team member                  | Admin/Manager |
| DELETE | `/:id`                      | Delete project                      | Admin         |

### Task Routes (`/api/tasks`)

| Method | Endpoint        | Description                      | Access        |
| ------ | --------------- | -------------------------------- | ------------- |
| GET    | `/`             | Get all tasks (filtered by role) | Private       |
| GET    | `/stats`        | Get task statistics              | Admin/Manager |
| GET    | `/my-tasks`     | Get current user's tasks         | Private       |
| GET    | `/:id`          | Get specific task                | Private       |
| POST   | `/`             | Create new task                  | Admin/Manager |
| PUT    | `/:id`          | Update task                      | Private       |
| POST   | `/:id/comments` | Add comment to task              | Private       |
| DELETE | `/:id`          | Delete task                      | Admin/Manager |

### Dashboard Routes (`/api/dashboard`)

| Method | Endpoint     | Description            | Access        |
| ------ | ------------ | ---------------------- | ------------- |
| GET    | `/overview`  | Get dashboard overview | Private       |
| GET    | `/analytics` | Get detailed analytics | Admin/Manager |

## 🔐 Authentication & Authorization

### JWT Token Strategy

- **Access Token** - Short-lived (15 minutes), stored in httpOnly cookie
- **Refresh Token** - Long-lived (7 days), stored in httpOnly cookie
- **Automatic Refresh** - Seamless token renewal

### Role-Based Access Control

- **Admin** - Full system access, user management
- **Manager** - Project creation, team management
- **Developer** - View assigned projects/tasks only

### Middleware

```javascript
// Authentication middleware
authenticate(req, res, next);

// Authorization middleware
authorize(...roles)(req, res, next);

// Admin-only middleware
isAdmin(req, res, next);
```

## 🗄️ Database Models

### User Model

```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: Enum ['Admin', 'Manager', 'Developer'],
  department: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model

```javascript
{
  name: String (required, unique),
  description: String (required),
  status: Enum ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
  priority: Enum ['Low', 'Medium', 'High', 'Critical'],
  startDate: Date (required),
  endDate: Date (required),
  manager: ObjectId (ref: User),
  teamMembers: [{
    user: ObjectId (ref: User),
    role: String,
    assignedDate: Date
  }],
  budget: Number,
  completionPercentage: Number (0-100),
  tags: [String],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model

```javascript
{
  title: String (required),
  description: String (required),
  status: Enum ['To Do', 'In Progress', 'Done'],
  priority: Enum ['Low', 'Medium', 'High', 'Critical'],
  assignedTo: ObjectId (ref: User),
  project: ObjectId (ref: Project),
  createdBy: ObjectId (ref: User),
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [String],
  comments: [{
    user: ObjectId (ref: User),
    content: String,
    createdAt: Date
  }],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Middleware & Utilities

### Authentication Utilities

```javascript
// Generate JWT tokens
generateTokens(userId);

// Verify JWT tokens
verifyToken(token, secret);

// Hash passwords
hashPassword(password);

// Compare passwords
comparePassword(password, hashedPassword);
```

### Validation Middleware

```javascript
// Input validation with Joi
validate(schema)(req, res, next);

// Query parameter validation
validateQuery(schema)(req, res, next);
```

### Response Helpers

```javascript
// Success responses
sendSuccess(res, data, message, statusCode);

// Error responses
sendError(res, message, statusCode, errors);

// Paginated responses
sendPaginatedResponse(res, data, pagination, message);
```

## 🛡️ Security Features

### Implemented Security Measures

- **Password Hashing** - Bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **HTTP-Only Cookies** - XSS protection
- **CORS Configuration** - Controlled cross-origin access
- **Input Validation** - Joi schema validation
- **Rate Limiting** - Request rate limiting (future)
- **Helmet.js** - Security headers (future)

### Environment Variables Security

```env
# Strong JWT secrets (32+ characters)
JWT_SECRET=your-cryptographically-strong-secret-key
JWT_REFRESH_SECRET=your-cryptographically-strong-refresh-secret

# Secure MongoDB connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

## 🔄 Error Handling

### Global Error Handler

```javascript
app.use((error, req, res, next) => {
  // Mongoose validation errors
  // JWT errors
  // Duplicate key errors
  // Cast errors
  // Generic server errors
});
```

### Error Types

- **Validation Errors** - Input validation failures
- **Authentication Errors** - Invalid/expired tokens
- **Authorization Errors** - Insufficient permissions
- **Database Errors** - MongoDB operation failures
- **Network Errors** - Connection issues

## 📊 Database Operations

### Aggregation Pipelines

- **Project Statistics** - Count by status, priority
- **Task Analytics** - Completion rates, overdue tasks
- **User Metrics** - Activity and performance data

### Indexing Strategy

```javascript
// User indexes
{ email: 1 } // Unique index for fast lookup

// Project indexes
{ manager: 1, status: 1 } // Manager and status queries
{ "teamMembers.user": 1 } // Team member lookup

// Task indexes
{ assignedTo: 1, status: 1 } // User task queries
{ project: 1, dueDate: 1 } // Project task queries
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/               # Unit tests
│   ├── controllers/
│   ├── models/
│   └── utils/
├── integration/        # Integration tests
│   └── routes/
└── fixtures/          # Test data
```

### Testing Tools

- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **MongoDB Memory Server** - In-memory database for tests

## 🚀 Deployment

### Production Environment

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/trackit
JWT_SECRET=production-jwt-secret-32-characters-minimum
PORT=5000
```

### Deployment Platforms

- **Heroku** - Easy deployment with Git
- **DigitalOcean** - VPS deployment
- **AWS EC2** - Scalable cloud hosting
- **Railway** - Modern deployment platform

### Production Optimizations

- **Process Manager** - PM2 for process management
- **Logging** - Winston for structured logging
- **Monitoring** - Application performance monitoring
- **Caching** - Redis for session/data caching

## 📈 Performance Optimization

### Database Optimization

- **Proper Indexing** - Query optimization
- **Aggregation Pipelines** - Efficient data processing
- **Connection Pooling** - MongoDB connection management
- **Query Optimization** - Minimize database calls

### API Optimization

- **Pagination** - Large dataset handling
- **Field Selection** - Return only required fields
- **Caching** - Response caching strategies
- **Compression** - Gzip compression

## 🔍 Monitoring & Logging

### Logging Strategy

```javascript
// Request logging
app.use(morgan("combined"));

// Error logging
console.error("Error:", error);

// Custom logging levels
logger.info("User logged in", { userId, email });
logger.error("Database error", { error, query });
```

### Health Check

```javascript
GET /health
{
  "status": "OK",
  "message": "TrackIt API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🤝 Contributing

### Development Guidelines

1. Follow REST API conventions
2. Implement proper error handling
3. Add input validation for all endpoints
4. Write unit tests for new features
5. Update API documentation

### Code Standards

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **JSDoc** - Function documentation
- **Conventional Commits** - Commit message format

## 📞 Support

For backend-specific issues:

- **Developer**: Rishabh Gupta
- **Email**: rishabhguptalahar@gmail.com
- **GitHub**: [rishabh-235](https://github.com/rishabh-235)

---

**Secure, Scalable, and Professional Backend API 🔒**
