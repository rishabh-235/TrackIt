# TrackIt Frontend

## 📱 Overview

The frontend of TrackIt is a modern React application built with Vite, providing a responsive and intuitive user interface for project and task management. It features role-based access control, real-time updates, and a clean, professional design.

## 🛠️ Technology Stack

- **React 19.1.1** - Modern UI library with latest features
- **Vite 7.1.6** - Fast build tool and development server
- **Redux Toolkit** - State management with modern Redux patterns
- **RTK Query** - Powerful data fetching and caching
- **React Router v6** - Declarative routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Toastify** - Beautiful toast notifications

## 📁 Project Structure

```
Frontend/
├── public/                   # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components (Button, Input, etc.)
│   │   ├── auth/           # Authentication components
│   │   └── layout/         # Layout components
│   ├── pages/              # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   ├── CreateProject.jsx
│   │   ├── Tasks.jsx
│   │   ├── CreateTask.jsx
│   │   └── Users.jsx
│   ├── redux/              # State management
│   │   ├── store.js        # Redux store configuration
│   │   ├── slices/         # Redux slices
│   │   └── api/            # RTK Query API definitions
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── App.jsx             # Main App component
│   └── main.jsx            # Entry point
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. **Navigate to Frontend Directory**

   ```bash
   cd Frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 📜 Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint for code quality

## 🎨 UI Components

### Core Components

- **Button** - Customizable button with variants
- **Input** - Form input with validation states
- **Select** - Dropdown select component
- **Card** - Container component for content
- **Modal** - Overlay modal for dialogs
- **LoadingSpinner** - Loading indicator

### Layout Components

- **Layout** - Main application layout with navigation
- **Sidebar** - Navigation sidebar
- **Header** - Top navigation bar

### Page Components

- **Dashboard** - Overview of projects and tasks
- **Projects** - Project listing and management
- **Tasks** - Task management with Kanban board
- **Users** - User management (Admin only)

## 🔐 Authentication & Authorization

### Route Protection

- **PublicRoute** - Redirects authenticated users
- **ProtectedRoute** - Requires authentication
- **AdminRoute** - Admin-only access
- **ManagerRoute** - Manager and Admin access

### Role-Based UI

Components conditionally render based on user roles:

- **Admin** - Full access to all features
- **Manager** - Project and task management
- **Developer** - View assigned projects/tasks only

## 🌐 API Integration

### RTK Query APIs

- **authApi** - Authentication endpoints
- **projectApi** - Project CRUD operations
- **taskApi** - Task management
- **userApi** - User management

### Base Configuration

```javascript
// Base API with automatic token refresh
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Automatic token refresh on 401 errors
  // Uses httpOnly cookies for security
};
```

## 🎯 State Management

### Redux Store Structure

```javascript
store: {
  auth: {
    user: {},
    token: null,
    isAuthenticated: boolean,
    loading: boolean
  },
  api: {
    // RTK Query cache and state
  }
}
```

### Key Features

- **Automatic Token Refresh** - Seamless auth experience
- **Optimistic Updates** - Immediate UI feedback
- **Cache Management** - Efficient data fetching
- **Error Handling** - Comprehensive error states

## 🎨 Styling & Design

### Tailwind CSS Configuration

- **Custom Colors** - Brand color palette
- **Responsive Design** - Mobile-first approach
- **Component Classes** - Reusable style patterns
- **Dark Mode Ready** - Easy theme switching

### Design System

- **Consistent Spacing** - 4px grid system
- **Typography Scale** - Harmonious text sizes
- **Color Palette** - Accessible color combinations
- **Interactive States** - Hover, focus, active states

## 📱 Responsive Design

### Breakpoints

- **Mobile** - < 768px
- **Tablet** - 768px - 1024px
- **Desktop** - > 1024px

### Features

- **Mobile Navigation** - Collapsible sidebar
- **Touch-Friendly** - Appropriate touch targets
- **Flexible Layouts** - Grid and flexbox layouts
- **Optimized Images** - Responsive image handling

## 🔧 Development Tools

### Code Quality

- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting (if configured)
- **React DevTools** - Component debugging
- **Redux DevTools** - State debugging

### Build Optimization

- **Code Splitting** - Lazy loading of routes
- **Tree Shaking** - Dead code elimination
- **Asset Optimization** - Image and font optimization
- **Bundle Analysis** - Size monitoring

## 🚨 Error Handling

### Error Boundaries

```javascript
// Global error boundary for unexpected errors
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### API Error Handling

- **Network Errors** - Offline detection
- **Validation Errors** - Form validation feedback
- **Authentication Errors** - Automatic redirect to login
- **Server Errors** - User-friendly error messages

## 🧪 Testing

### Testing Setup (Future Enhancement)

- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **MSW** - API mocking for tests
- **Cypress** - End-to-end testing

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

- **Vercel** - Zero-config deployment
- **Netlify** - Git-based deployment
- **GitHub Pages** - Free static hosting
- **AWS S3 + CloudFront** - Scalable hosting

### Environment Variables

Create `.env` file for environment-specific configs:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=TrackIt
```

## 🔍 Browser Support

- **Chrome** - Latest 2 versions
- **Firefox** - Latest 2 versions
- **Safari** - Latest 2 versions
- **Edge** - Latest 2 versions

## 📈 Performance Optimization

### Best Practices Implemented

- **Code Splitting** - Route-based splitting
- **Lazy Loading** - Component lazy loading
- **Memoization** - React.memo for expensive components
- **Virtual Scrolling** - For large lists (if needed)
- **Image Optimization** - WebP format support

## 🔧 Configuration Files

### Vite Configuration (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
```

### Tailwind Configuration (`tailwind.config.js`)

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
      },
    },
  },
};
```

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Submit pull request

### Code Standards

- **Component Naming** - PascalCase for components
- **File Organization** - Feature-based structure
- **Props Validation** - PropTypes or TypeScript
- **Accessibility** - WCAG 2.1 compliance

## 📞 Support

For frontend-specific issues:

- **Developer**: Rishabh Gupta
- **Email**: rishabhguptalahar@gmail.com
- **GitHub**: [rishabh-235](https://github.com/rishabh-235)

---

**Built with ❤️ using React and modern web technologies**
