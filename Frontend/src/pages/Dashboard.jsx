import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";
import { useGetDashboardStatsQuery } from "../redux/api/dashboardApi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  ProjectIcon,
  TaskIcon,
  CompletedTaskIcon,
  UsersIcon,
  ClockIcon,
  AlertIcon,
} from "../components/ui/Icons";
import { canCreateResources, isAdmin } from "../utils/roleUtils";

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();
  const dashboardData = stats?.data || {};
  const userCanCreate = canCreateResources(user?.role);
  const userIsAdmin = isAdmin(user?.role);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const StatCard = ({
    title,
    value,
    change,
    changeType,
    icon,
    color = "blue",
  }) => (
    <Card className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div
            className={`inline-flex items-center justify-center p-3 bg-${color}-600 rounded-md`}
          >
            <div className="text-white">{icon}</div>
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change !== undefined && (
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeType === "increase"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {changeType === "increase" ? "+" : "-"}
                  {Math.abs(change)}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );

  const RecentActivityItem = ({ activity }) => (
    <div className="flex items-center space-x-3 py-3">
      <div
        className={`w-2 h-2 rounded-full ${
          activity.type === "task_completed"
            ? "bg-green-400"
            : activity.type === "task_created"
            ? "bg-blue-400"
            : activity.type === "project_created"
            ? "bg-purple-400"
            : "bg-gray-400"
        }`}
      ></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{activity.description}</p>
        <p className="text-xs text-gray-500">
          {new Date(activity.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertIcon className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error loading dashboard
        </h3>
        <p className="text-gray-500 mb-4">
          Unable to load dashboard statistics. Please try again.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.name || "User"}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={dashboardData.projectsCount || 0}
          change={dashboardData.projectsChange}
          changeType={
            dashboardData.projectsChange > 0 ? "increase" : "decrease"
          }
          color="blue"
          icon={<ProjectIcon />}
        />

        <StatCard
          title="Active Tasks"
          value={dashboardData.activeTasksCount || 0}
          change={dashboardData.tasksChange}
          changeType={dashboardData.tasksChange > 0 ? "increase" : "decrease"}
          color="green"
          icon={<TaskIcon />}
        />

        <StatCard
          title="Completed Tasks"
          value={dashboardData.completedTasksCount || 0}
          change={dashboardData.completionChange}
          changeType={
            dashboardData.completionChange > 0 ? "increase" : "decrease"
          }
          color="purple"
          icon={<CompletedTaskIcon />}
        />

        <StatCard
          title="Team Members"
          value={dashboardData.teamMembersCount || 0}
          color="indigo"
          icon={<UsersIcon />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Projects
            </h3>
            <Link to="/projects">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.recentProjects?.length > 0 ? (
              dashboardData.recentProjects.slice(0, 5).map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {project.description?.substring(0, 50)}...
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <ProjectIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No projects yet</p>
                {userCanCreate && (
                  <Link to="/projects/new" className="mt-2">
                    <Button size="sm">Create Project</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-1">
            {dashboardData.recentActivities?.length > 0 ? (
              dashboardData.recentActivities
                .slice(0, 8)
                .map((activity, index) => (
                  <RecentActivityItem key={index} activity={activity} />
                ))
            ) : (
              <div className="text-center py-6">
                <ClockIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {userCanCreate && (
            <>
              <Link to="/projects/new">
                <Button className="w-full justify-start" variant="outline">
                  <PlusIcon />
                  New Project
                </Button>
              </Link>
              <Link to="/tasks/new">
                <Button className="w-full justify-start" variant="outline">
                  <PlusIcon />
                  New Task
                </Button>
              </Link>
            </>
          )}
          <Link to="/tasks">
            <Button className="w-full justify-start" variant="outline">
              <TaskIcon className="w-5 h-5 mr-2" />
              View Tasks
            </Button>
          </Link>
          {userIsAdmin && (
            <Link to="/users">
              <Button className="w-full justify-start" variant="outline">
                <UsersIcon className="w-5 h-5 mr-2" />
                Manage Users
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
