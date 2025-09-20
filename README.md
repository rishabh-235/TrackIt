# TrackIt - Project & Task Management System

## Developer Information

**Name:** Rishabh Gupta  
**Email:** rishabhguptalahar@gmail.com  
**Mobile:** +91 8823019235

---

## 📋 Overview

TrackIt is a comprehensive Project & Task Management web application built with modern technologies. It provides role-based access control, project management capabilities, task tracking with Kanban boards, and user management features.

## 🌟 Features

### Core Features

- **User Authentication & Authorization** - Secure login/register with role-based access
- **Project Management** - Create, update, delete, and manage projects
- **Task Management** - Kanban board interface for task tracking
- **Role-Based Access Control** - Admin, Manager, and Developer roles with specific permissions
- **Team Management** - Assign team members to projects
- **Dashboard Analytics** - Project and task statistics
- **Real-time Updates** - Live data synchronization

### User Roles & Permissions

- **Admin**: Full system access, user management, all project operations
- **Manager**: Create projects, manage assigned projects, create tasks
- **Developer**: View assigned projects and tasks, update task status

## 🛠️ Technology Stack

### Frontend

- **React 19.1.1** - Modern UI library
- **Vite 7.1.6** - Fast build tool and development server
- **Redux Toolkit + RTK Query** - State management and API calls
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Toastify** - Toast notifications

### Backend

- **Node.js + Express.js 5** - Server framework
- **MongoDB + Mongoose** - Database and ODM
- **JWT Authentication** - Secure token-based auth with httpOnly cookies
- **Bcrypt.js** - Password hashing
- **Joi** - Input validation
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** (Local installation or MongoDB Atlas account)
- **Git**
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/rishabh-235/TrackIt.git
cd TrackIt
```

### 2. Backend Setup

#### Navigate to Backend Directory

```bash
cd Backend
```

#### Install Dependencies

```bash
npm install
```

#### Environment Configuration

Create a `.env` file in the Backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/trackit

# Server Configuration
PORT=5000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-minimum-32-characters

# Environment
NODE_ENV=development
```

**Important Notes:**

- Replace `MONGODB_URI` with your actual MongoDB connection string
- For MongoDB Atlas: Get your connection string from the Atlas dashboard
- For Local MongoDB: Use `mongodb://localhost:27017/trackit`
- Generate strong, unique secrets for JWT tokens (32+ characters recommended)

#### Start Backend Server

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Navigate to Frontend Directory (New Terminal)

```bash
cd Frontend
```

#### Install Dependencies

```bash
npm install
```

#### Start Frontend Development Server

```bash
npm run dev
```

Frontend will run on `http://localhost:5173` (or next available port)

### 4. Database Setup

#### Option A: MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get connection string and update `.env` file

#### Option B: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/trackit`

### 5. Initial Data Setup

The application will automatically create the database structure. For testing, you can create initial users through the registration page.

#### Default Test Users (if needed)

You can register these users for testing different roles:

- **Admin**: admin@example.com
- **Manager**: manager@example.com
- **Developer**: developer@example.com

## 📱 Application Access

1. **Open your browser** and navigate to `http://localhost:5173`
2. **Register** a new account or **Login** with existing credentials
3. **Start managing** your projects and tasks!

## 🏗️ Project Structure

```
TrackIt/
├── Frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── redux/          # State management
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── Backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Helper utilities
│   │   └── middleware/     # Custom middleware
│   ├── index.js           # Server entry point
│   └── package.json       # Backend dependencies
└── README.md              # This file
```

## �️ Database Schema (ER Diagram)

The TrackIt application uses MongoDB with a well-structured schema design that supports role-based access control and comprehensive project management features.

### Entity Relationship Diagram

![TrackIt ER Diagram](./TrackIt_ER_Diagram.png)

### Database Entities

#### **User Entity**

- **Primary Key**: `_id` (ObjectId)
- **Key Fields**: email (unique), password (hashed), firstName, lastName
- **Role System**: Admin | Manager | Developer
- **Additional**: phone, department, isActive status
- **Relationships**: Manages projects, assigned to tasks, team member of projects

#### **Project Entity**

- **Primary Key**: `_id` (ObjectId)
- **Key Fields**: name (unique), description, status, priority
- **Status Values**: Planning | Active | On Hold | Completed
- **Priority Levels**: Low | Medium | High | Critical
- **Relationships**: Has one manager (User), contains multiple tasks, has team members (Users)
- **Tracking**: budget, completion percentage, start/end dates

#### **Task Entity**

- **Primary Key**: `_id` (ObjectId)
- **Key Fields**: title, description, status, priority, dueDate
- **Status Values**: To Do | In Progress | Done
- **Time Tracking**: estimatedHours, actualHours, completedAt
- **Relationships**: Belongs to one project, assigned to one user, created by one user
- **Features**: Comments (embedded), attachments (embedded), tags

#### **Comment Entity (Embedded)**

- **Purpose**: Task collaboration and communication
- **Key Fields**: user (reference), content, createdAt
- **Validation**: Maximum 500 characters
- **Relationship**: Embedded within Task documents

#### **Attachment Entity (Embedded)**

- **Purpose**: File management for tasks
- **Key Fields**: fileName, fileUrl, uploadedBy, uploadedAt
- **Relationship**: Embedded within Task documents

### Key Database Features

- **Indexes**: Optimized queries on assignedTo, project, status, priority, dueDate
- **Virtual Fields**: isOverdue, daysRemaining, progressPercentage
- **Validation**: Comprehensive field validation with custom error messages
- **Middleware**: Automatic timestamping, status change tracking
- **Role-Based Queries**: Data filtering based on user roles and permissions

### Database Design Principles

1. **Normalization**: Related entities properly referenced with ObjectIds
2. **Embedding**: Comments and attachments embedded for performance
3. **Indexing**: Strategic indexes for common query patterns
4. **Validation**: Comprehensive data validation at schema level
5. **Flexibility**: Extensible design for future feature additions

## �🔧 Available Scripts

### Backend Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests
```

### Frontend Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get current user profile

### Projects

- `GET /api/projects` - Get all projects (role-based)
- `POST /api/projects` - Create new project (Admin/Manager)
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project (Admin/Manager)
- `DELETE /api/projects/:id` - Delete project (Admin only)

### Tasks

- `GET /api/tasks` - Get all tasks (role-based)
- `POST /api/tasks` - Create new task (Admin/Manager)
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (Admin/Manager)

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/managers` - Get all managers (for project assignment)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start

- Check if MongoDB is running
- Verify environment variables in `.env`
- Ensure port 5000 is not in use
- Check for syntax errors in console

#### Frontend Won't Start

- Check if Node.js version is 16+
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if port is available

#### Database Connection Issues

- Verify MongoDB URI format
- Check database user permissions
- Ensure IP is whitelisted (Atlas)
- Test connection string separately

#### Authentication Issues

- Check JWT secrets are set
- Verify cookie settings in browser
- Clear browser storage/cookies

## 🔒 Security Features

- **HTTP-Only Cookies** for token storage
- **JWT Access & Refresh Tokens** for authentication
- **Password Hashing** with bcrypt
- **Input Validation** with Joi
- **Role-Based Authorization** middleware
- **CORS Protection** configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For any questions or support, please contact:

- **Developer**: Rishabh Gupta
- **Email**: rishabhguptalahar@gmail.com
- **Mobile**: +91 8823019235

---

**Happy Project Management! 🎉**
