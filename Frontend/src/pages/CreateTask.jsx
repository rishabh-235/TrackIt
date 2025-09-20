import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { useCreateTaskMutation } from "../redux/api/taskApi";
import { useGetProjectsQuery } from "../redux/api/projectApi";
import { useGetUsersQuery } from "../redux/api/userApi";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

const CreateTask = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [createTask, { isLoading }] = useCreateTaskMutation();

  // Get projects and users for selection
  const { data: projectsData } = useGetProjectsQuery({ limit: 100 });
  const { data: usersData } = useGetUsersQuery({ limit: 100 });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    assignedTo: "",
    priority: "Medium",
    status: "To Do",
    dueDate: "",
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

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.project) {
      newErrors.project = "Project selection is required";
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = "Assignee selection is required";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = "Due date cannot be in the past";
      }
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
      const taskData = {
        ...formData,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      await createTask(taskData).unwrap();
      toast.success("Task created successfully!");
      navigate("/tasks");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create task");
    }
  };

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];

  const statusOptions = [
    { value: "To Do", label: "To Do" },
    { value: "In Progress", label: "In Progress" },
    { value: "In Review", label: "In Review" },
    { value: "Done", label: "Done" },
  ];

  const projectOptions =
    projectsData?.data?.map((project) => ({
      value: project._id,
      label: project.name,
    })) || [];

  const userOptions =
    usersData?.data?.map((user) => ({
      value: user._id,
      label: `${user.firstName} ${user.lastName}`,
    })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Task
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to create a new task.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Task Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
                placeholder="Enter task title"
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
                placeholder="Describe the task requirements and objectives"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <Select
                label="Project"
                name="project"
                value={formData.project}
                onChange={handleChange}
                options={projectOptions}
                error={errors.project}
                required
                placeholder="Select a project"
              />
            </div>

            <div>
              <Select
                label="Assign To"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                options={userOptions}
                error={errors.assignedTo}
                required
                placeholder="Select assignee"
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
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={statusOptions}
                required
              />
            </div>

            <div>
              <Input
                label="Due Date"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                error={errors.dueDate}
                required
              />
            </div>

            <div>
              <Input
                label="Tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Enter tags separated by commas"
                helperText="e.g., frontend, bug, urgent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/tasks")}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Task
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateTask;
