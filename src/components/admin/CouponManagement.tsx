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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash, Plus, Edit, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Coupon } from '@/types/product';
import CouponDialog from './CouponDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import FixCouponPermissions from './FixCouponPermissions';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);
  const { toast } = useToast();

  // Function to ensure the required RLS policies exist
  const ensureCouponPolicies = async () => {
    try {
      // First try using RPC
      const { error } = await supabase.rpc('configure_coupon_rls_policies');
      
      if (error) {
        console.log('RPC method failed, trying edge function:', error);
        // Try edge function
        const { error: edgeFunctionError } = await supabase.functions.invoke('fixCouponPermissions');
        
        if (edgeFunctionError) {
          console.log('Edge function failed:', edgeFunctionError);
          // Try direct SQL through RPC (not direct table access)
          const { error: rpcError } = await supabase.rpc('configure_coupon_rls_policies');
          
          if (rpcError) {
            console.error('All permission fix methods failed:', rpcError);
            throw new Error('Failed to configure coupon policies');
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error configuring coupon policies:', error);
      return { success: false, error };
    }
  };

  // Load coupons on component mount
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If we get permission denied, set the error state and try to fix
        if (error.message.includes('permission denied')) {
          setPermissionError(error.message);
          // Try to fix permissions automatically
          const result = await ensureCouponPolicies();
          if (result.success) {
            // Try fetching again after fixing permissions
            const { data: retryData, error: retryError } = await supabase
              .from('coupons')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (!retryError) {
              setCoupons(retryData || []);
              setPermissionError(null);
              return;
            }
          }
        } else {
          throw error;
        }
      } else {
        setCoupons(data || []);
        setPermissionError(null);
      }
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load coupons',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    setEditingCoupon(coupon || null);
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = async (couponData: Partial<Coupon>) => {
    setIsSubmitting(true);
    try {
      // Prepare data for insert/update
      const insertData = {
        code: couponData.code,
        discount_percent: couponData.discount_percent,
        is_active: couponData.is_active !== undefined ? couponData.is_active : true,
        min_order_value: couponData.min_order_value || null,
        expires_at: couponData.expires_at || null,
        created_by: couponData.created_by || null
      };

      // If we're editing an existing coupon
      if (editingCoupon?.id) {
        // Update existing coupon
        // Remove updated_at from the update object to avoid schema cache errors
        const { error } = await supabase
          .from('coupons')
          .update({
            code: couponData.code,
            discount_percent: couponData.discount_percent,
            is_active: couponData.is_active,
            min_order_value: couponData.min_order_value,
            expires_at: couponData.expires_at
            // updated_at is handled automatically by Supabase
          })
          .eq('id', editingCoupon.id);

        if (error) {
          // If permission denied, try fixing permissions first
          if (error.message.includes('permission denied')) {
            setPermissionError(error.message);
            const result = await ensureCouponPolicies();
            if (result.success) {
              // Try updating again
              const { error: retryError } = await supabase
                .from('coupons')
                .update({
                  code: couponData.code,
                  discount_percent: couponData.discount_percent,
                  is_active: couponData.is_active,
                  min_order_value: couponData.min_order_value,
                  expires_at: couponData.expires_at
                  // updated_at is handled automatically by Supabase
                })
                .eq('id', editingCoupon.id);
                
              if (retryError) {
                throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
              }
            } else {
              throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
            }
          } else {
            throw error;
          }
        }

        toast({
          title: 'Success',
          description: 'Coupon updated successfully',
        });
      } else {
        // Creating a new coupon
        const { error } = await supabase
          .from('coupons')
          .insert(insertData);

        if (error) {
          // If permission denied, try fixing permissions first
          if (error.message.includes('permission denied')) {
            setPermissionError(error.message);
            const result = await ensureCouponPolicies();
            if (result.success) {
              // Try inserting again
              const { error: retryError } = await supabase
                .from('coupons')
                .insert(insertData);
                
              if (retryError) {
                throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
              }
            } else {
              throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
            }
          } else {
            throw error;
          }
        }

        toast({
          title: 'Success',
          description: 'Coupon created successfully',
        });
      }

      // Refresh coupons list
      await fetchCoupons();
      setIsDialogOpen(false);
      setEditingCoupon(null);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save coupon',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) {
        // If permission denied, try fixing permissions first
        if (error.message.includes('permission denied')) {
          setPermissionError(error.message);
          const result = await ensureCouponPolicies();
          if (result.success) {
            // Try updating again
            const { error: retryError } = await supabase
              .from('coupons')
              .update({ is_active: !coupon.is_active })
              .eq('id', coupon.id);
              
            if (retryError) {
              throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
            }
          } else {
            throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
          }
        } else {
          throw error;
        }
      }

      // Update local state
      setCoupons(coupons.map(c => 
        c.id === coupon.id ? { ...c, is_active: !coupon.is_active } : c
      ));

      toast({
        title: 'Success',
        description: `Coupon ${coupon.is_active ? 'disabled' : 'enabled'} successfully`,
      });
    } catch (error: any) {
      console.error('Error toggling coupon status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update coupon status',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;
    
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponToDelete.id);

      if (error) {
        // If permission denied, try fixing permissions first
        if (error.message.includes('permission denied')) {
          setPermissionError(error.message);
          const result = await ensureCouponPolicies();
          if (result.success) {
            // Try deleting again
            const { error: retryError } = await supabase
              .from('coupons')
              .delete()
              .eq('id', couponToDelete.id);
              
            if (retryError) {
              throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
            }
          } else {
            throw new Error('Permission denied. Please use the "Fix Coupon Permissions" button.');
          }
        } else {
          throw error;
        }
      }

      // Update local state
      setCoupons(coupons.filter((c) => c.id !== couponToDelete.id));

      toast({
        title: 'Success',
        description: 'Coupon deleted successfully',
      });
      
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coupon',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleRetryPermissions = async () => {
    setIsFixingPermissions(true);
    try {
      const result = await ensureCouponPolicies();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Permissions fixed successfully. Refreshing coupons...',
        });
        await fetchCoupons();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fix permissions. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error fixing permissions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fix permissions',
        variant: 'destructive',
      });
    } finally {
      setIsFixingPermissions(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Coupon Management</CardTitle>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-brand-600 hover:bg-brand-700"
          disabled={!!permissionError || isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </CardHeader>
      <CardContent>
        {permissionError && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Error</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="mb-2">{permissionError}</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetryPermissions}
                    disabled={isFixingPermissions}
                  >
                    {isFixingPermissions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fixing Permissions...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Fix Permissions
                      </>
                    )}
                  </Button>
                  <FixCouponPermissions />
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : coupons.length === 0 && !permissionError ? (
          <div className="text-center p-8 text-gray-500">
            <p>No coupons available. Create your first coupon to get started.</p>
          </div>
        ) : !permissionError && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>{coupon.discount_percent}%</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(coupon.expires_at)}</TableCell>
                    <TableCell>{formatDate(coupon.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(coupon)}
                        >
                          {coupon.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500"
                          onClick={() => openDeleteDialog(coupon)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Coupon Create/Edit Dialog */}
        <CouponDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveCoupon}
          isSubmitting={isSubmitting}
          editingCoupon={editingCoupon}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash className="h-5 w-5 text-red-500" />
                <span>Delete Coupon</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the coupon <span className="font-semibold">{couponToDelete?.code}</span>?
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default CouponManagement;
