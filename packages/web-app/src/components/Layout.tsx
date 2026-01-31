import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Gift, CheckCircle, Settings, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Layout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const isParent = user?.role === 'parent';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/chores', icon: CheckSquare, label: 'Chores' },
    { to: '/rewards', icon: Gift, label: 'Rewards' },
    ...(isParent ? [{ to: '/approvals', icon: CheckCircle, label: 'Approvals' }] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-primary-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Family Chores</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {user?.firstName} {user?.emoji}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-primary-700 rounded-lg transition"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-4 ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`
              }
            >
              <item.icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
