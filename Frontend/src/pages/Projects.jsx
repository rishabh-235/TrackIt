import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import {
  useGetProjectsQuery,
  useDeleteProjectMutation,
} from "../redux/api/projectApi";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

const Projects = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector(selectCurrentUser);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "createdAt"
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "desc"
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    project: null,
  });

  // Query parameters
  const queryParams = {
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
  };

  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
  } = useGetProjectsQuery(queryParams);

  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (page !== 1) params.set("page", page.toString());

    setSearchParams(params);
  }, [search, status, sortBy, sortOrder, page, setSearchParams]);

  const handleDelete = async () => {
    try {
      await deleteProject(deleteModal.project._id).unwrap();
      toast.success("Project deleted successfully");
      setDeleteModal({ open: false, project: null });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete project");
    }
  };

  const ProjectCard = ({ project }) => {
    return (
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {project.name}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.status === "active"
                    ? "bg-green-100 text-green-800"
                    : project.status === "completed"
                    ? "bg-blue-100 text-blue-800"
                    : project.status === "on-hold"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {project.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
              <div>
                <span className="font-medium">Start Date:</span>{" "}
                {new Date(project.startDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">End Date:</span>{" "}
                {new Date(project.endDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Manager:</span>{" "}
                {project.manager?.firstName + " " + project.manager?.lastName ||
                  "Unassigned"}
              </div>
              <div>
                <span className="font-medium">Team:</span>{" "}
                {project.teamMembers?.length || 0} members
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm text-gray-500">
                  {project.progress || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="ml-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Link to={`/projects/${project._id}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
              {(user?.role === "Admin" ||
                project.manager?._id === user?._id) && (
                <>
                  <Link to={`/projects/${project._id}/edit`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => setDeleteModal({ open: true, project })}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

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
          Error loading projects
        </h3>
        <p className="text-gray-500 mb-4">
          {error?.data?.message || "Something went wrong"}
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track your project portfolio
          </p>
        </div>
        {user?.role !== "Developer" && (
          <Link to="/projects/new">
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
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search projects..."
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

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "All Statuses" },
              { value: "planning", label: "Planning" },
              { value: "active", label: "Active" },
              { value: "on-hold", label: "On Hold" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: "createdAt", label: "Created Date" },
              { value: "name", label: "Name" },
              { value: "startDate", label: "Start Date" },
              { value: "endDate", label: "End Date" },
              { value: "progress", label: "Progress" },
            ]}
          />

          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            options={[
              { value: "desc", label: "Descending" },
              { value: "asc", label: "Ascending" },
            ]}
          />
        </div>
      </Card>

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : projectsData?.data?.length > 0 ? (
        <>
          <div className="space-y-4">
            {projectsData.data.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {projectsData?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, projectsData.pagination.totalItems)} of{" "}
                {projectsData.pagination.totalItems} projects
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {page} of {projectsData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === projectsData.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No projects
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === "Developer"
              ? "No projects assigned to you yet."
              : "Get started by creating a new project."}
          </p>
          {user?.role !== "Developer" && (
            <div className="mt-6">
              <Link to="/projects/new">
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
                  New Project
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, project: null })}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete "{deleteModal.project?.name}"? This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, project: null })}
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

export default Projects;
