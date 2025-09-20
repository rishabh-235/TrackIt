import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../redux/api/taskApi";
import { useGetProjectsQuery } from "../redux/api/projectApi";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

const Tasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector(selectCurrentUser);

  // View mode
  const [viewMode, setViewMode] = useState(
    searchParams.get("view") || "kanban"
  );

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [projectId, setProjectId] = useState(searchParams.get("project") || "");
  const [assignedTo, setAssignedTo] = useState(
    searchParams.get("assignedTo") || ""
  );

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, task: null });

  // Query parameters
  const queryParams = {
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    project: projectId || undefined,
    assignedTo: assignedTo || undefined,
    limit: 100, // Get more for Kanban view
  };

  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useGetTasksQuery(queryParams);

  const { data: projectsData } = useGetProjectsQuery({ limit: 100 });

  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: deleting }] = useDeleteTaskMutation();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (viewMode !== "kanban") params.set("view", viewMode);
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (projectId) params.set("project", projectId);
    if (assignedTo) params.set("assignedTo", assignedTo);

    setSearchParams(params);
  }, [
    viewMode,
    search,
    status,
    priority,
    projectId,
    assignedTo,
    setSearchParams,
  ]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask({
        id: taskId,
        data: { status: newStatus },
      }).unwrap();
      toast.success("Task status updated");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update task");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(deleteModal.task._id).unwrap();
      toast.success("Task deleted successfully");
      setDeleteModal({ open: false, task: null });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete task");
    }
  };

  const TaskCard = ({ task, isKanban = false }) => (
    <Card
      className={`p-4 ${
        isKanban ? "mb-3 cursor-move" : ""
      } hover:shadow-md transition-shadow`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {task.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          </div>
          {!isKanban && (
            <div className="ml-2 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : task.status === "in-progress"
                    ? "bg-blue-100 text-blue-800"
                    : task.status === "in-review"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {task.status}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                task.priority === "high"
                  ? "bg-red-100 text-red-800"
                  : task.priority === "medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {task.priority}
            </span>
            {task.project && (
              <span className="text-blue-600">{task.project.name}</span>
            )}
          </div>
          <div className="text-right">
            <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
            {task.assignedTo && <div>Assigned: {task.assignedTo.firstName + " " + task.assignedTo.lastName}</div>}
          </div>
        </div>

        {!isKanban && (
          <div className="flex justify-end space-x-2">
            <Link to={`/tasks/${task._id}`}>
              <Button size="sm" variant="outline">
                View
              </Button>
            </Link>
            {(user?.role === "Admin" ||
              task.assignedTo?._id === user?._id ||
              task.createdBy?._id === user?._id) && (
              <>
                <Link to={`/tasks/${task._id}/edit`}>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setDeleteModal({ open: true, task })}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  const KanbanColumn = ({ title, status, tasks }) => (
    <div className="flex-1 min-w-0">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <div className="space-y-3 min-h-96">
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => handleStatusChange(task._id, status)}
            >
              <TaskCard task={task} isKanban={true} />
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No tasks
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error loading tasks
        </h3>
        <p className="text-gray-500 mb-4">
          {error?.data?.message || "Something went wrong"}
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const tasks = tasksData?.data || [];
  const todoTasks = tasks.filter((task) => task.status === "To Do");
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress");
  const completedTasks = tasks.filter((task) => task.status === "Done");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage your tasks
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "kanban" ? "primary" : "ghost"}
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "primary" : "ghost"}
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
          {user?.role !== "Developer" && (
            <Link to="/tasks/new">
              <Button>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                New Task
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />

          {viewMode === "list" && (
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "", label: "All Statuses" },
                { value: "To Do", label: "To Do" },
                { value: "In Progress", label: "In Progress" },
                { value: "Done", label: "Done" },
              ]}
            />
          )}

          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: "", label: "All Priorities" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />

          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={[
              { value: "", label: "All Projects" },
              ...(projectsData?.projects || []).map((project) => ({
                value: project._id,
                label: project.name,
              })),
            ]}
          />

          <Select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            options={[
              { value: "", label: "All Assignees" },
              { value: user?._id, label: "My Tasks" },
            ]}
          />
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {viewMode === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          )}
        </div>
      ) : tasks.length > 0 ? (
        viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KanbanColumn title="To Do" status="To Do" tasks={todoTasks} />
            <KanbanColumn
              title="In Progress"
              status="In Progress"
              tasks={inProgressTasks}
            />
            <KanbanColumn title="Done" status="Done" tasks={completedTasks} />
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === "Developer"
              ? "No tasks assigned to you yet."
              : "Get started by creating a new task."}
          </p>
          {user?.role !== "Developer" && (
            <div className="mt-6">
              <Link to="/tasks/new">
                <Button>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  New Task
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, task: null })}
        title="Delete Task"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete "{deleteModal.task?.title}"? This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, task: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
