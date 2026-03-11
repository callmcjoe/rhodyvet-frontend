import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CubeIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  TicketIcon,
  HeartIcon,
  SparklesIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, adminOnly: true },
  { name: 'Staff', href: '/staff', icon: UsersIcon, adminOnly: true },
  { name: 'Treatments', href: '/treatments', icon: HeartIcon, adminOnly: true },
  { name: 'Chicken', href: '/chicken', icon: SparklesIcon, adminOnly: true },
  { name: 'Products', href: '/products', icon: CubeIcon, adminOnly: false },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCartIcon, adminOnly: false },
  { name: 'Jumia', href: '/jumia', icon: TruckIcon, adminOnly: true },
  { name: 'Sales', href: '/sales', icon: ChartBarIcon, adminOnly: false },
  { name: 'Discounts', href: '/discount-requests', icon: TicketIcon, adminOnly: true },
  { name: 'Refunds', href: '/refunds', icon: ArrowPathIcon, adminOnly: false },
  { name: 'Stock', href: '/stock', icon: ArchiveBoxIcon, adminOnly: true },
];

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin()
  );

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-primary-800">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-white">Rhody Vet</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-900 text-white'
                        : 'text-primary-100 hover:bg-primary-700'
                    }`
                  }
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-primary-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs font-medium text-primary-200 capitalize">
                    {user?.role?.replace('_', ' ')} - {user?.department}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
