import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [validResetLink, setValidResetLink] = useState(true);

  useEffect(() => {
    // Check for error in URL hash or query parameters
    const checkForErrors = () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(location.search);
      
      // Check for error in hash
      if (hash && (hash.includes('error=') || hash.includes('error_description='))) {
        return true;
      }
      
      // Check for error in query parameters
      if (searchParams.get('error') || searchParams.get('error_description')) {
        return true;
      }
      
      return false;
    };
    
    // Extract access token and type from URL hash or query parameters
    const getResetParams = () => {
      // First try from hash fragment
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        return true;
      }
      
      // Then try from query parameters (Supabase sometimes uses these instead)
      const searchParams = new URLSearchParams(location.search);
      const type = searchParams.get('type');
      return type === 'recovery';
    };

    // Check if there's an error in the URL
    if (checkForErrors()) {
      // Redirect to the error page with the current URL parameters
      navigate(`/reset-password-error${location.search}${location.hash}`);
      return;
    }

    const isValidResetLink = getResetParams();
    setValidResetLink(isValidResetLink);

    if (!isValidResetLink) {
      toast({
        title: "Invalid Reset Link",
        description: "This reset password link is invalid or has expired.",
        variant: "destructive"
      });
      // Redirect to the error page
      navigate('/reset-password-error');
    }
  }, [navigate, toast, location]);

  const validateForm = () => {
    setError(null);
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the updatePassword function from AuthContext
      await updatePassword(password);
      
      setResetSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      // Error toast is already shown by updatePassword function
      setError(error.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="section-padding bg-cream-100 min-h-screen flex items-center">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-brand-600 py-6 px-8">
            <h1 className="text-2xl font-bold text-white font-playfair">Reset Password</h1>
            <p className="text-cream-200 text-sm mt-1">
              Enter your new password below
            </p>
          </div>
          
          <div className="p-8">
            {!validResetLink ? (
              <div className="text-center space-y-4">
                <div className="text-red-600 text-xl mb-2">⚠️</div>
                <h2 className="text-xl font-semibold text-brand-700">Invalid Reset Link</h2>
                <p className="text-gray-600">This reset password link is invalid or has expired.</p>
                <p className="text-gray-600">Redirecting to login page...</p>
              </div>
            ) : resetSuccess ? (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-xl mb-2">✓</div>
                <h2 className="text-xl font-semibold text-brand-700">Password Reset Complete</h2>
                <p className="text-gray-600">Your password has been updated successfully.</p>
                <p className="text-gray-600">Redirecting to login page...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-brand-700 mb-1">
                    New Password*
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-700 mb-1">
                    Confirm New Password*
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
