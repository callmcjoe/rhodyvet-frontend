import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatTimeAgo } from '../../utils/helpers';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, salesRes, activityRes, stockRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getSalesReport({ period: 'daily' }),
        dashboardAPI.getRecentActivity({ limit: 10 }),
        dashboardAPI.getLowStockAlerts(),
      ]);

      setSummary(summaryRes.data.data);
      setSalesReport(salesRes.data.data);
      setRecentActivity(activityRes.data.data);
      setLowStock(stockRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const stats = [
    {
      name: "Today's Sales",
      value: formatCurrency(summary?.todaySales?.total || 0),
      subtext: `${summary?.todaySales?.count || 0} transactions`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Refunds',
      value: summary?.pendingRefunds || 0,
      subtext: 'Awaiting approval',
      icon: ArrowPathIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Low Stock Items',
      value: summary?.lowStockCount || 0,
      subtext: 'Need restocking',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
    {
      name: 'Active Staff',
      value: summary?.activeStaff || 0,
      subtext: 'Team members',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                    <dd className="text-xs text-gray-500">{stat.subtext}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card title="Sales Trend (Last 30 Days)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesReport?.salesTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#0ea5e9"
                  fill="#bae6fd"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div className="h-64 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        activity.type === 'sale'
                          ? 'success'
                          : activity.type === 'refund'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {activity.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.user} - {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Department Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Today's Sales by Department">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-amber-900">Feeds</p>
                <p className="text-2xl font-bold text-amber-700">
                  {formatCurrency(summary?.salesByDepartment?.feeds?.total || 0)}
                </p>
              </div>
              <p className="text-sm text-amber-600">
                {summary?.salesByDepartment?.feeds?.count || 0} items
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Store</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(summary?.salesByDepartment?.store?.total || 0)}
                </p>
              </div>
              <p className="text-sm text-blue-600">
                {summary?.salesByDepartment?.store?.count || 0} items
              </p>
            </div>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card title="Low Stock Alerts">
          <div className="h-48 overflow-y-auto">
            {lowStock.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No low stock items
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {lowStock.slice(0, 5).map((item) => (
                  <li key={item._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Current: {item.currentStock}
                      </p>
                    </div>
                    <Badge variant={item.department === 'feeds' ? 'feeds' : 'store'}>
                      {item.department}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
