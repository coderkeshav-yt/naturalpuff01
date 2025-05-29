import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ResetPasswordError = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    // Extract error information from URL
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace('#', ''));
    
    // Check for error in both query params and hash
    const queryError = searchParams.get('error_description') || searchParams.get('error');
    const hashError = hashParams.get('error_description') || hashParams.get('error');
    
    const errorDesc = queryError || hashError || 'The password reset link is invalid or has expired.';
    setErrorMessage(errorDesc.replace(/\+/g, ' '));
  }, [location]);

  const handleResendLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to send a new reset link.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (error) {
      console.error('Error sending reset link:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section-padding bg-cream-100 min-h-screen flex items-center">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-brand-600 py-6 px-8">
            <h1 className="text-2xl font-bold text-white font-playfair">Reset Link Expired</h1>
            <p className="text-cream-200 text-sm mt-1">
              We'll help you get a new reset link
            </p>
          </div>
          
          <div className="p-8">
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-xl mb-2">✓</div>
                <h2 className="text-xl font-semibold text-brand-700">Check Your Email</h2>
                <p className="text-gray-600">We've sent a new password reset link to your email address.</p>
                <Button 
                  type="button" 
                  className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-red-600 text-center mb-2">⚠️</div>
                  <h2 className="text-xl font-semibold text-brand-700 text-center mb-2">Password Reset Error</h2>
                  <p className="text-gray-600 text-center">{errorMessage}</p>
                </div>
                
                <form onSubmit={handleResendLink} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-700 mb-1">
                      Your Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send New Reset Link'}
                  </Button>
                  
                  <div className="text-center">
                    <button 
                      type="button" 
                      onClick={() => navigate('/login')}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordError;
