import { useState } from "react";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";

const Table = ({
  columns = [],
  data = [],
  loading = false,
  pagination,
  onRowClick,
  className = "",
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`} {...props}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                }`}
                onClick={
                  column.sortable ? () => handleSort(column.key) : undefined
                }
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <div className="flex flex-col">
                      <svg
                        className={`w-3 h-3 ${
                          sortConfig.key === column.key &&
                          sortConfig.direction === "asc"
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <svg
                        className={`w-3 h-3 ${
                          sortConfig.key === column.key &&
                          sortConfig.direction === "desc"
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => (
              <tr
                key={row.id || index}
                className={`${
                  onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                }`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              disabled={pagination.currentPage === 1}
              onClick={() =>
                pagination.onPageChange(pagination.currentPage - 1)
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() =>
                pagination.onPageChange(pagination.currentPage + 1)
              }
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    pagination.totalItems
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.totalItems}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === 1}
                  onClick={() =>
                    pagination.onPageChange(pagination.currentPage - 1)
                  }
                  className="rounded-l-md"
                >
                  Previous
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.currentPage) <= 2
                  )
                  .map((page, index, array) => (
                    <div key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )}
                      <Button
                        variant={
                          page === pagination.currentPage
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => pagination.onPageChange(page)}
                        className="rounded-none"
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() =>
                    pagination.onPageChange(pagination.currentPage + 1)
                  }
                  className="rounded-r-md"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
