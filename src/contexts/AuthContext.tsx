
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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
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
        // Add the email from the user object
        setUserProfile({
          ...data,
          email: user?.email
        });
        console.log('Profile data fetched:', data);
      } else {
        console.log('No profile found, will create one');
        // If no profile exists, create one
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
      
      const profileData = {
        id: userId,
        first_name: user?.user_metadata?.first_name || null,
        last_name: user?.user_metadata?.last_name || null,
        phone: user?.user_metadata?.phone || null,
      };
      
      console.log('Profile data being created:', profileData);
      
      const { error } = await supabase
        .from('profiles')
        .insert(profileData);

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      // After creating, fetch the profile
      await fetchProfile(userId);
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account.",
      });
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
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
      throw error;
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
