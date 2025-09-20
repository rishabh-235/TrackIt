import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import store from "./redux/store";
import AuthProvider from "./components/auth/AuthProvider";
import {
  ProtectedRoute,
  PublicRoute,
  AdminRoute,
  ManagerRoute,
} from "./components/auth/RouteGuards";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import Tasks from "./pages/Tasks";
import CreateTask from "./pages/CreateTask";
import Users from "./pages/Users";

// Layout
import Layout from "./components/layout/Layout";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route
                  path="projects/new"
                  element={
                    <ManagerRoute>
                      <CreateProject />
                    </ManagerRoute>
                  }
                />
                <Route path="tasks" element={<Tasks />} />
                <Route
                  path="tasks/new"
                  element={
                    <ManagerRoute>
                      <CreateTask />
                    </ManagerRoute>
                  }
                />

                {/* Admin/Manager only routes */}
                <Route
                  path="users"
                  element={
                    <AdminRoute>
                      <Users />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* Catch all route */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900">404</h1>
                      <p className="mt-2 text-gray-600">Page not found</p>
                      <a
                        href="/"
                        className="mt-4 inline-block text-blue-600 hover:text-blue-500"
                      >
                        Go back home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>

            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;
