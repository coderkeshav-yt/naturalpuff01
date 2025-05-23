import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash, Plus, Edit, Save, X, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CarouselItem {
  id?: number;
  title: string;
  subtitle: string;
  image_url: string;
  product_link: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

const CarouselManagement: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [newItem, setNewItem] = useState<CarouselItem>({
    title: '',
    subtitle: '',
    image_url: '',
    product_link: '',
    is_active: true,
    display_order: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);
  
  const checkAdminStatus = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in, redirect to login
        toast({
          title: 'Authentication required',
          description: 'You must be logged in to access this page',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }
      
      // Check if user is an admin (using email for now)
      // In a production app, you would use a more robust method
      // Admin email is coderkeshavyt@gmail.com
      if (user.email !== 'coderkeshavyt@gmail.com') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to manage carousel items',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }
      
      // User is admin
      setIsAdmin(true);
      fetchCarouselItems();
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify your access permissions',
        variant: 'destructive'
      });
      navigate('/');
    }
  };

  const fetchCarouselItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('carousel')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        // Type assertion to ensure data matches our CarouselItem type
        setItems(data as unknown as CarouselItem[]);
      }
    } catch (error: any) {
      console.error('Error fetching carousel items:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load carousel items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleAddItem = () => {
    const maxOrder = items.length > 0 
      ? Math.max(...items.map(item => item.display_order)) 
      : 0;
    
    setNewItem({
      title: '',
      subtitle: '',
      image_url: '',
      product_link: '',
      is_active: true,
      display_order: maxOrder + 1
    });
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: CarouselItem) => {
    setEditingItem({...item});
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: CarouselItem) => {
    if (!confirm('Are you sure you want to delete this carousel item?')) {
      return;
    }

    handleDeleteItem(item.id!);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('carousel')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Carousel item deleted successfully'
      });

      // Refresh the list
      fetchCarouselItems();
    } catch (error: any) {
      console.error('Error deleting carousel item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete carousel item',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, isNewItem: boolean) => {
    const { name, value } = e.target;
    
    if (isNewItem) {
      setNewItem(prev => ({ ...prev, [name]: value }));
    } else if (editingItem) {
      setEditingItem(prev => prev ? { ...prev, [name]: value } : null);
    }
  };
  
  const handleSwitchChange = (checked: boolean, isNewItem: boolean) => {
    if (isNewItem) {
      setNewItem(prev => ({ ...prev, is_active: checked }));
    } else if (editingItem) {
      setEditingItem(prev => prev ? { ...prev, is_active: checked } : null);
    }
  };

  const handleSaveItem = async () => {
    try {
      setIsSubmitting(true);
      const itemToSave = editingItem || newItem;
      
      // Validate required fields
      if (!itemToSave.title || !itemToSave.image_url) {
        toast({
          title: 'Validation Error',
          description: 'Title and Image URL are required fields',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('carousel')
          .update(itemToSave as any)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Carousel item updated successfully'
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('carousel')
          .insert(itemToSave as any);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'New carousel item added successfully'
        });

        // Reset new item form
        setNewItem({
          title: '',
          subtitle: '',
          image_url: '',
          product_link: '',
          is_active: true,
          display_order: items.length + 1
        });
      }

      // Clear editing state
      setEditingItem(null);
      setIsDialogOpen(false);
      
      // Refresh the list
      fetchCarouselItems();
    } catch (error: any) {
      console.error('Error saving carousel item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save carousel item',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemForm = (item: CarouselItem, isNewItem: boolean) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor={`title-${isNewItem ? 'new' : item.id}`}>Title</Label>
          <Input
            id={`title-${isNewItem ? 'new' : item.id}`}
            name="title"
            value={item.title}
            onChange={(e) => handleInputChange(e, isNewItem)}
            placeholder="Enter title"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor={`subtitle-${isNewItem ? 'new' : item.id}`}>Subtitle</Label>
          <Input
            id={`subtitle-${isNewItem ? 'new' : item.id}`}
            name="subtitle"
            value={item.subtitle}
            onChange={(e) => handleInputChange(e, isNewItem)}
            placeholder="Enter subtitle (optional)"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor={`image_url-${isNewItem ? 'new' : item.id}`}>Image URL</Label>
          <Input
            id={`image_url-${isNewItem ? 'new' : item.id}`}
            name="image_url"
            value={item.image_url}
            onChange={(e) => handleInputChange(e, isNewItem)}
            placeholder="Enter image URL"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor={`product_link-${isNewItem ? 'new' : item.id}`}>Product Link</Label>
          <Input
            id={`product_link-${isNewItem ? 'new' : item.id}`}
            name="product_link"
            value={item.product_link}
            onChange={(e) => handleInputChange(e, isNewItem)}
            placeholder="Enter product link (optional)"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Label htmlFor={`display_order-${isNewItem ? 'new' : item.id}`}>Display Order</Label>
          <Input
            id={`display_order-${isNewItem ? 'new' : item.id}`}
            name="display_order"
            type="number"
            value={item.display_order}
            onChange={(e) => handleInputChange(e, isNewItem)}
            placeholder="Enter display order"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id={`is_active-${isNewItem ? 'new' : item.id}`}
            checked={item.is_active}
            onCheckedChange={(checked) => handleSwitchChange(checked, isNewItem)}
            disabled={isSubmitting}
          />
          <Label htmlFor={`is_active-${isNewItem ? 'new' : item.id}`}>Active</Label>
        </div>
      </div>
    );
  };

  // If not admin or still checking, show loading
  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Carousel Management</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCarouselItems} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={handleAddItem}>
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No carousel items found. Add your first item to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-md p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">{item.title}</h3>
                      {!item.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{item.subtitle}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <span>Order: {item.display_order}</span>
                      {item.product_link ? (
                        <span className="text-blue-500">Has product link</span>
                      ) : (
                        <span className="text-gray-400">No product link</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Carousel Item' : 'Add New Carousel Item'}
              </DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? 'Update the details of this carousel item.' 
                  : 'Fill out the form to add a new carousel item to your homepage.'}
              </DialogDescription>
            </DialogHeader>
            
            {editingItem ? renderItemForm(editingItem, false) : renderItemForm(newItem, true)}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CarouselManagement;