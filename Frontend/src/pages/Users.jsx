import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../redux/api/userApi";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  // Modals
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  // Form data for edit modal
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    isActive: true,
  });

  // Query parameters
  const queryParams = {
    page,
    limit: 10,
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  };

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useGetUsersQuery(queryParams);

  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    if (page !== 1) params.set("page", page.toString());

    setSearchParams(params);
  }, [search, role, status, page, setSearchParams]);

  // Set form data when edit modal opens
  useEffect(() => {
    if (editModal.user) {
      setEditForm({
        name: editModal.user.name,
        email: editModal.user.email,
        role: editModal.user.role,
        isActive: editModal.user.isActive,
      });
    }
  }, [editModal.user]);

  const handleEdit = (user) => {
    setEditModal({ open: true, user });
  };

  const handleUpdate = async () => {
    try {
      await updateUser({
        id: editModal.user._id,
        data: editForm,
      }).unwrap();
      toast.success("User updated successfully");
      setEditModal({ open: false, user: null });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update user");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteModal.user._id).unwrap();
      toast.success("User deleted successfully");
      setDeleteModal({ open: false, user: null });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete user");
    }
  };

  const columns = [
    {
      header: "Name",
      accessor: "name",
      render: (user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      render: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.role === "Admin"
              ? "bg-purple-100 text-purple-800"
              : user.role === "Manager"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Created",
      accessor: "createdAt",
      render: (user) => (
        <div className="text-sm text-gray-900">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (user) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:border-red-300"
            onClick={() => setDeleteModal({ open: true, user })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

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
          Error loading users
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search users..."
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
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: "", label: "All Roles" },
              { value: "Admin", label: "Admin" },
              { value: "Manager", label: "Manager" },
              { value: "Member", label: "Member" },
            ]}
          />

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          data={usersData?.users || []}
          columns={columns}
          loading={isLoading}
          emptyMessage="No users found"
        />

        {/* Pagination */}
        {usersData?.pagination?.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, usersData.pagination.totalUsers)} of{" "}
                {usersData.pagination.totalUsers} users
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
                  Page {page} of {usersData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === usersData.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        title="Edit User"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
            required
          />

          <Select
            label="Role"
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            options={[
              { value: "Admin", label: "Admin" },
              { value: "Manager", label: "Manager" },
              { value: "Member", label: "Member" },
            ]}
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={editForm.isActive}
              onChange={(e) =>
                setEditForm({ ...editForm, isActive: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-900"
            >
              User is active
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setEditModal({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={updating}>
              Update User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete "{deleteModal.user?.name}"? This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, user: null })}
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

export default Users;
