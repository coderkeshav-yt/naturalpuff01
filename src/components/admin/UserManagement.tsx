import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  last_sign_in_at?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles data first
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      // Get auth users data for emails and last sign in times
      let enhancedUsers: User[] = [];
      
      if (profiles) {
        // For each profile, try to get additional auth info using admin user access
        enhancedUsers = await Promise.all(profiles.map(async (profile) => {
          // Try to get user email with the function
          try {
            const { data, error } = await supabase.rpc('get_user_email', {
              user_id: profile.id
            });
            
            // Make sure email is always a string
            const email: string = data || 'N/A';
            
            return {
              id: profile.id,
              email: email,
              first_name: profile.first_name || 'N/A',
              last_name: profile.last_name || 'N/A',
              phone: profile.phone || 'N/A',
              created_at: profile.created_at,
              last_sign_in_at: undefined // We don't have this in profiles
            };
          } catch (authError) {
            // If we can't get auth data, just use profile data
            return {
              id: profile.id,
              email: 'N/A', // Email not available from profile
              first_name: profile.first_name || 'N/A',
              last_name: profile.last_name || 'N/A',
              phone: profile.phone || 'N/A',
              created_at: profile.created_at,
              last_sign_in_at: undefined
            };
          }
        }));
      }

      setUsers(enhancedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return 'N/A';
  };

  // Sort users with most recent first
  const sortedUsers = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No users available. Users will appear here after they register.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {getUserName(user)}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
