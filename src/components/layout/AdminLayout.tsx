import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Truck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard/admin',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      name: 'Products',
      path: '/dashboard/products',
      icon: <Package className="h-5 w-5" />
    },
    {
      name: 'Orders',
      path: '/dashboard/orders',
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      name: 'Shipping',
      path: '/dashboard/shiprocket',
      icon: <Truck className="h-5 w-5" />
    },
    {
      name: 'Customers',
      path: '/dashboard/customers',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Content',
      path: '/dashboard/content',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Settings',
      path: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-brand-600">NaturalPuff</span>
            <span className="ml-2 text-sm bg-brand-100 text-brand-800 px-2 py-0.5 rounded">Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">Sign Out</span>
          </Button>
        </nav>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden w-full bg-white shadow-sm fixed top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-brand-600">NaturalPuff</span>
            <span className="ml-2 text-sm bg-brand-100 text-brand-800 px-2 py-0.5 rounded">Admin</span>
          </Link>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Back to Site
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <div className="md:p-0 p-4 mt-16 md:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
