
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coupon } from '@/types/product';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (couponData: Partial<Coupon>) => Promise<void>;
  isSubmitting: boolean;
  editingCoupon?: Coupon | null;
}

const CouponDialog = ({ open, onOpenChange, onSave, isSubmitting, editingCoupon }: CouponDialogProps) => {
  const { user } = useAuth();
  
  const [code, setCode] = useState(editingCoupon?.code || '');
  const [discountPercent, setDiscountPercent] = useState<number>(editingCoupon?.discount_percent || 10);
  const [isActive, setIsActive] = useState(editingCoupon?.is_active !== false);
  const [expiryDate, setExpiryDate] = useState(
    editingCoupon?.expires_at 
      ? new Date(editingCoupon.expires_at).toISOString().split('T')[0]
      : ''
  );
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or editing coupon changes
  useEffect(() => {
    if (open && editingCoupon) {
      setCode(editingCoupon.code || '');
      setDiscountPercent(editingCoupon.discount_percent || 10);
      setIsActive(editingCoupon.is_active !== false);
      setExpiryDate(
        editingCoupon.expires_at 
          ? new Date(editingCoupon.expires_at).toISOString().split('T')[0]
          : ''
      );
    } else if (open && !editingCoupon) {
      // Reset form for new coupon
      setCode('');
      setDiscountPercent(10);
      setIsActive(true);
      setExpiryDate('');
    }
    setError(null);
  }, [open, editingCoupon]);

  const handleSave = async () => {
    // Validate inputs
    if (!code.trim()) {
      setError('Coupon code is required');
      return;
    }
    
    if (discountPercent <= 0 || discountPercent > 100) {
      setError('Discount must be between 1 and 100 percent');
      return;
    }
    
    setError(null);

    // Prepare coupon data
    const couponData: Partial<Coupon> = {
      code: code.trim().toUpperCase(),
      discount_percent: discountPercent,
      is_active: isActive,
      created_by: user?.id || null,
    };

    // Add expiry date if provided
    if (expiryDate) {
      couponData.expires_at = new Date(expiryDate).toISOString();
    }

    // Add id for updating existing coupon
    if (editingCoupon?.id) {
      couponData.id = editingCoupon.id;
    }

    try {
      await onSave(couponData);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      setError('Failed to save coupon: ' + (error.message || 'Unknown error'));
    }
  };

  const generateRandomCode = () => {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omitted confusable characters
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setCode(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          <DialogDescription>
            {editingCoupon 
              ? 'Update the coupon details below.' 
              : 'Add a new discount coupon code for your customers.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">{error}</div>}
          
          <div className="space-y-1">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                  className="uppercase"
                  maxLength={10}
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateRandomCode}
                className="h-10"
                disabled={isSubmitting}
              >
                Generate
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="discount">Discount Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="discount"
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                disabled={isSubmitting}
              />
              <span className="text-lg">%</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="expiry">Expiry Date (Optional)</Label>
            <Input
              id="expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="active" 
              checked={isActive} 
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || !code.trim() || discountPercent <= 0}
            className="bg-brand-600 hover:bg-brand-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingCoupon ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingCoupon ? 'Update Coupon' : 'Create Coupon'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CouponDialog;
