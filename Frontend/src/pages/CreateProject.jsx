import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { useCreateProjectMutation } from "../redux/api/projectApi";
import { useGetManagersQuery } from "../redux/api/userApi";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

const CreateProject = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [createProject, { isLoading }] = useCreateProjectMutation();

  // Get managers using the new dedicated endpoint (accessible to all users)
  const {
    data: managersData,
    isLoading: managersLoading,
    error: managersError,
  } = useGetManagersQuery();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    manager: "",
    priority: "Medium",
    budget: "",
    tags: "",
  });

  const [errors, setErrors] = useState({});

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

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (!formData.manager) {
      newErrors.manager = "Manager selection is required";
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = "Budget must be a valid number";
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
      const projectData = {
        ...formData,
        budget: formData.budget ? Number(formData.budget) : undefined,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      await createProject(projectData).unwrap();
      toast.success("Project created successfully!");
      navigate("/projects");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create project");
    }
  };

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];

  // Create manager options from the dedicated managers API
  const managers = managersData?.data || [];
  const managerOptions = managers.map((manager) => ({
    value: manager._id,
    label: `${manager.firstName} ${manager.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Project
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to create a new project.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                placeholder="Enter project name"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Describe the project objectives and scope"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                error={errors.startDate}
                required
              />
            </div>

            <div>
              <Input
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                error={errors.endDate}
                required
              />
            </div>

            <div>
              <Select
                label="Project Manager"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                options={managerOptions}
                error={errors.manager}
                required
                placeholder={
                  managersLoading
                    ? "Loading managers..."
                    : managersError
                    ? "Error loading managers"
                    : managerOptions.length === 0
                    ? "No managers available"
                    : "Select a manager"
                }
                disabled={managersLoading}
              />
            </div>

            <div>
              <Select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={priorityOptions}
                required
              />
            </div>

            <div>
              <Input
                label="Budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                error={errors.budget}
                placeholder="Enter budget amount"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Input
                label="Tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Enter tags separated by commas"
                helperText="e.g., web, mobile, backend"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/projects")}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateProject;
