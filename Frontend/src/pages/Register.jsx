import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button, Input, Select, Card } from "../components/ui";
import { useRegisterMutation } from "../redux/api/authApi";
import { selectIsAuthenticated } from "../redux/slices/authSlice";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [register, { isLoading }] = useRegisterMutation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const roleOptions = [
    { value: "Developer", label: "Developer" },
    { value: "Manager", label: "Manager" },
    { value: "Admin", label: "Admin" },
  ];

  const departmentOptions = [
    { value: "Engineering", label: "Engineering" },
    { value: "Product", label: "Product" },
    { value: "Design", label: "Design" },
    { value: "Marketing", label: "Marketing" },
    { value: "Sales", label: "Sales" },
    { value: "HR", label: "Human Resources" },
    { value: "Finance", label: "Finance" },
    { value: "Operations", label: "Operations" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData).unwrap();

      if (result.success) {
        toast.success("Registration successful! Welcome to TrackIt.");
      }
    } catch (error) {
      console.error("Registration error:", error);

      const errorMessage =
        error?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);

      // Handle specific error cases
      if (error?.data?.errors) {
        const apiErrors = {};
        error.data.errors.forEach((err) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="firstName"
                type="text"
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
                autoComplete="given-name"
              />

              <Input
                name="lastName"
                type="text"
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
                autoComplete="family-name"
              />
            </div>

            <Input
              name="email"
              type="email"
              label="Email address"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="email"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                autoComplete="new-password"
              />

              <Input
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                name="role"
                label="Role"
                placeholder="Select your role"
                value={formData.role}
                onChange={handleChange}
                error={errors.role}
                options={roleOptions}
                required
              />

              <Select
                name="department"
                label="Department"
                placeholder="Select department"
                value={formData.department}
                onChange={handleChange}
                error={errors.department}
                options={departmentOptions}
              />
            </div>

            <Input
              name="phone"
              type="tel"
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              autoComplete="tel"
            />

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-900"
              >
                I agree to the{" "}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Create Account
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
