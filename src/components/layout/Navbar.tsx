
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion } from 'framer-motion';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isLoading, isAdmin } = useAuth();
  const { totalItems } = useCart();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Health Benefits', path: '/health-benefits' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect to home page even if there's an error
      window.location.href = '/';
    }
  };

  const handleCartClick = () => {
    navigate('/checkout');
    // Ensure page scrolls to top after navigation
    window.scrollTo(0, 0);
  };

  return (
    <header className="bg-cream-100 border-b border-brand-200 sticky top-0 z-50">
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Updated to use text instead of image */}
          <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
            <span className="text-2xl font-playfair font-bold text-brand-700 hover:text-brand-600 transition-colors">
              Natural Puff
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`hover:text-brand-600 transition-colors ${
                  location.pathname === link.path ? 'font-medium text-brand-600' : 'text-brand-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Cart and Authentication Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white relative"
              onClick={handleCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center">{totalItems}</span>
              )}
            </Button>
            
            {isLoading ? (
              <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/admin')}>
                      <User className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-brand-600 text-white hover:bg-brand-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button and Cart */}
          <div className="md:hidden flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white relative"
              onClick={handleCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center">{totalItems}</span>
              )}
            </Button>
            
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-brand-800 hover:bg-brand-100"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 absolute left-0 right-0 top-full bg-cream-100 border-b border-brand-200 shadow-lg animate-fade-in">
            <div className="flex flex-col space-y-4 px-6 pb-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`py-2 hover:text-brand-600 transition-colors ${
                    location.pathname === link.path ? 'font-medium text-brand-600' : 'text-brand-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t border-brand-200">
                {user ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white"
                      onClick={() => {
                        navigate('/profile');
                        closeMobileMenu();
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        className="w-full border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white"
                        onClick={() => {
                          navigate('/dashboard/admin');
                          closeMobileMenu();
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    )}
                    <Button 
                      className="w-full bg-brand-600 text-white hover:bg-brand-700"
                      onClick={() => {
                        handleSignOut();
                        closeMobileMenu();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMobileMenu} className="w-full">
                      <Button variant="outline" className="w-full border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={closeMobileMenu} className="w-full">
                      <Button className="w-full bg-brand-600 text-white hover:bg-brand-700">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
