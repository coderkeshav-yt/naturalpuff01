
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the profile interface
interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of admin user IDs
const ADMIN_USER_IDS = ['a3301900-bf5e-4afe-a114-d59bb08a05a1'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  // Function to fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      // Log the current user metadata for debugging
      console.log('Current user metadata:', user?.user_metadata);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to prevent errors

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('Profile data fetched from database:', data);
        
        // Combine data from profiles table with user metadata for completeness
        setUserProfile({
          id: data.id,
          // For each field, prefer the database value but fall back to metadata if needed
          first_name: data.first_name || user?.user_metadata?.first_name || user?.user_metadata?.firstName || null,
          last_name: data.last_name || user?.user_metadata?.last_name || user?.user_metadata?.lastName || null,
          phone: data.phone || user?.user_metadata?.phone || user?.user_metadata?.phoneNumber || null,
          address: data.address || user?.user_metadata?.address || null,
          city: data.city || user?.user_metadata?.city || null,
          state: data.state || user?.user_metadata?.state || null,
          pincode: data.pincode || user?.user_metadata?.pincode || null,
          email: user?.email
        });
      } else {
        console.log('No profile found in database, will create one from user metadata');
        // If no profile exists, create one from user metadata
        await createInitialProfile(userId);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  // Function to create initial profile if it doesn't exist
  const createInitialProfile = async (userId: string) => {
    try {
      console.log('Creating initial profile for user:', userId);
      console.log('User metadata:', user?.user_metadata);
      
      // Extract all available metadata from the user object
      // Check for both snake_case and camelCase versions of all fields
      const metadata = user?.user_metadata || {};
      
      const profileData = {
        id: userId,
        first_name: metadata.first_name || metadata.firstName || null,
        last_name: metadata.last_name || metadata.lastName || null,
        phone: metadata.phone || metadata.phoneNumber || null,
        address: metadata.address || null,
        city: metadata.city || null,
        state: metadata.state || null,
        pincode: metadata.pincode || null,
      };
      
      // Check if we have any actual data to save
      const hasProfileData = Object.values(profileData).some(
        (value, index) => index > 0 && value !== null && value !== ''
      );
      
      if (!hasProfileData) {
        console.warn('No profile data available in user metadata. Creating minimal profile.');
      }
      
      console.log('Profile data being created:', profileData);
      
      const { error } = await supabase
        .from('profiles')
        .insert(profileData);

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      // Set the profile data directly to avoid an extra database call
      setUserProfile({
        ...profileData,
        email: user?.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      console.log('Profile created successfully');
    } catch (error) {
      console.error('Error creating initial profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    console.log('AuthProvider initialized');
    
    // First set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check if admin in a separate operation
        if (currentSession?.user) {
          setTimeout(() => {
            checkIfUserIsAdmin(currentSession.user);
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Got existing session:', currentSession ? 'yes' : 'no');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Check if admin in a separate operation
      if (currentSession?.user) {
        checkIfUserIsAdmin(currentSession.user);
        fetchProfile(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Updated function to check if user is admin using hardcoded list & metadata
  const checkIfUserIsAdmin = async (user: User) => {
    if (!user) return;
    
    try {
      // Check if user ID is in the admin list
      if (ADMIN_USER_IDS.includes(user.id)) {
        console.log('User is in admin list');
        setIsAdmin(true);
        return;
      }
      
      // Also check app metadata or user metadata for admin role
      if (user.app_metadata && user.app_metadata.admin === true) {
        console.log('User has admin role in app_metadata');
        setIsAdmin(true);
        return;
      }
      
      // For backward compatibility, also check if email is admin@naturalpuff.com
      if (user.email === 'admin@naturalpuff.com') {
        console.log('User email is admin@naturalpuff.com');
        setIsAdmin(true);
        return;
      }
      
      setIsAdmin(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      console.log('Signing up with metadata:', metadata);
      
      // Ensure metadata uses consistent field naming
      const normalizedMetadata = {
        first_name: metadata?.first_name || metadata?.firstName || '',
        last_name: metadata?.last_name || metadata?.lastName || '',
        phone: metadata?.phone || metadata?.phoneNumber || '',
        address: metadata?.address || '',
        city: metadata?.city || '',
        state: metadata?.state || '',
        pincode: metadata?.pincode || '',
        // Also include camelCase versions for compatibility
        firstName: metadata?.first_name || metadata?.firstName || '',
        lastName: metadata?.last_name || metadata?.lastName || '',
        phoneNumber: metadata?.phone || metadata?.phoneNumber || '',
      };
      
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: normalizedMetadata,
        },
      });

      if (response.error) throw response.error;
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account.",
      });
      
      // Return the full response so the signup component can access the user data
      return response;
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome Back!",
        description: "You have successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user and clearing all sessions...');
      
      // First reset all state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setIsAdmin(false);
      
      // Manually clear localStorage items related to Supabase auth and cart data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-') || key === 'cart' || key === 'appliedCoupon')) {
          console.log('Removing localStorage item:', key);
          localStorage.removeItem(key);
        }
      }
      
      // Explicitly remove cart and coupon data
      localStorage.removeItem('cart');
      localStorage.removeItem('appliedCoupon');
      
      // Clear sessionStorage items related to Supabase
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          console.log('Removing sessionStorage item:', key);
          sessionStorage.removeItem(key);
        }
      }
      
      // Then call Supabase signOut with scope: 'global' to kill all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Supabase signOut error:', error);
        // Continue with logout process even if there's an error
      }
      
      // Show success toast
      toast({
        title: "Signed Out",
        description: "You have been successfully logged out.",
      });
      
      // Use a more aggressive approach to clear the page state
      setTimeout(() => {
        // Force a complete page reload with cache clearing
        window.location.href = '/?nocache=' + new Date().getTime();
      }, 100);
    } catch (error: any) {
      console.error('Error during sign out:', error);
      
      // Still reset state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setIsAdmin(false);
      
      // Clear storage anyway
      localStorage.clear();
      sessionStorage.clear();
      
      // Explicitly ensure cart and coupon data are removed
      localStorage.removeItem('cart');
      localStorage.removeItem('appliedCoupon');
      
      // Show error toast
      toast({
        title: "Sign Out Error",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
      
      // Force redirect to home page even if there's an error
      window.location.href = '/?nocache=' + new Date().getTime();
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    userProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
