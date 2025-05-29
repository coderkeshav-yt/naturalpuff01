
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, user, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Redirect users after login based on role
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/dashboard/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, isAdmin, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (resetPasswordMode) {
      await handleResetPassword();
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login Successful!",
        description: "Welcome back to Natural Puff.",
      });
      
      // Redirection happens via the useEffect hook
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required for password reset' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the resetPassword function from AuthContext
      await resetPassword(formData.email);
      setResetEmailSent(true);
    } catch (error: any) {
      // Error handling is done in the resetPassword function
      console.error('Reset password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="section-padding bg-cream-100 min-h-screen flex items-center">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-brand-600 py-6 px-8">
            <h1 className="text-2xl font-bold text-white font-playfair">
              {resetPasswordMode ? 'Reset Password' : 'Log In'}
            </h1>
            <p className="text-cream-200 text-sm mt-1">
              {resetPasswordMode 
                ? 'Enter your email to reset your password' 
                : 'Welcome back to Natural Puff'}
            </p>
          </div>
          
          <div className="p-8">
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-xl mb-2">✓</div>
                <h2 className="text-xl font-semibold text-brand-700">Check Your Email</h2>
                <p className="text-gray-600">We've sent a password reset link to your email address.</p>
                <Button 
                  type="button" 
                  className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={() => {
                    setResetPasswordMode(false);
                    setResetEmailSent(false);
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-700 mb-1">
                  Email*
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-red-500' : ''}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              {!resetPasswordMode && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-brand-700 mb-1">
                    Password*
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
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
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>
              )}
              
              {!resetPasswordMode && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-brand-700">
                      Remember me
                    </label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setResetPasswordMode(true)}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (resetPasswordMode ? 'Sending...' : 'Logging in...') 
                  : (resetPasswordMode ? 'Reset Password' : 'Log In')}
              </Button>
              
              <div className="text-center mt-4">
                {resetPasswordMode ? (
                  <button 
                    type="button" 
                    onClick={() => setResetPasswordMode(false)}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Back to Login
                  </button>
                ) : (
                  <p className="text-sm text-brand-700">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-brand-600 hover:underline font-medium">
                      Sign up
                    </Link>
                  </p>
                )}
              </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
