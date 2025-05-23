
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ImageIcon, Loader2, Plus, RefreshCw, Trash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { v4 as uuidv4 } from 'uuid';
import { MarketingOffer } from '@/types/product';

const OfferManagement: React.FC = () => {
  const [offers, setOffers] = useState<MarketingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOffer, setNewOffer] = useState<Omit<MarketingOffer, 'id' | 'created_at'>>({
    title: '',
    description: '',
    image_url: '',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      // Use the correct table name and type here
      const { data, error } = await supabase
        .from('marketing_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Ensure the data matches our MarketingOffer type
      setOffers(data || []);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load offers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOffer(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setDate(date);
    if (date) {
      setNewOffer(prev => ({ ...prev, expires_at: date.toISOString() }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Error", description: "Please select an image to upload." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a FormData object to upload the image
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', `offer_image_${generateUniqueId()}_${selectedFile.name}`);
      
      // Use a mock URL for now - normally this would be uploaded to a storage service
      const mockImageUrl = `https://picsum.photos/seed/${Math.random()}/1200/600`;
      
      // In a real implementation, you would upload to a storage service
      // and get back a URL. Here, we're simulating that with a timeout
      setTimeout(() => {
        // Update the new offer with the image URL
        setNewOffer(prev => ({ ...prev, image_url: mockImageUrl }));
        
        toast({ title: "Success", description: "Image uploaded successfully." });
        setIsUploading(false);
        setUploadProgress(100);
        setSelectedFile(null);
      }, 1000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image." });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const generateUniqueId = () => {
    return uuidv4();
  };

  const validateForm = (): string | null => {
    if (!newOffer.title.trim()) return 'Title is required';
    if (!newOffer.description.trim()) return 'Description is required';
    if (!newOffer.image_url.trim()) return 'Image URL is required';
    if (!newOffer.expires_at) return 'Expiry date is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast({
        title: 'Validation Error',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('marketing_offers')
        .insert([newOffer])
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offer created successfully',
      });

      // Reset form
      setNewOffer({
        title: '',
        description: '',
        image_url: '',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      
      // Refresh offers list
      fetchOffers();
    } catch (error: any) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create offer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    try {
      const { error } = await supabase
        .from('marketing_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offer deleted successfully',
      });
      
      // Refresh offers list
      fetchOffers();
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete offer',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Promotional Offers</CardTitle>
        <Button 
          onClick={fetchOffers} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <h3 className="text-lg font-medium">Add New Promotional Offer</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={newOffer.title}
                onChange={handleInputChange}
                placeholder="Summer Sale"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires On</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={newOffer.description}
              onChange={handleInputChange}
              placeholder="Get 20% off on all products"
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image_url">Banner Image</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="image_url"
                name="image_url"
                className="flex-grow"
                value={newOffer.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/banner.jpg"
                disabled={isSubmitting || isUploading}
              />
              <label htmlFor="upload-offer-image">
                <Input
                  type="file"
                  id="upload-offer-image"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isSubmitting || isUploading}
                />
                <Button variant="secondary" asChild disabled={isSubmitting || isUploading}>
                  <label htmlFor="upload-offer-image" className="cursor-pointer">
                    {isUploading ? 'Uploading...' : 'Choose File'}
                  </label>
                </Button>
              </label>
              {selectedFile && (
                <Button 
                  variant="secondary" 
                  onClick={handleImageUpload} 
                  disabled={isSubmitting || isUploading}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
            {isUploading && (
              <progress value={uploadProgress} max="100" className="w-full">
                {uploadProgress}%
              </progress>
            )}
            {newOffer.image_url && (
              <div className="mt-2 relative w-full h-32 overflow-hidden rounded-md">
                <img 
                  src={newOffer.image_url} 
                  alt="Offer preview" 
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="bg-brand-600 hover:bg-brand-700" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Offer
              </>
            )}
          </Button>
        </form>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Current Offers</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No promotional offers available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="relative w-16 h-12 overflow-hidden rounded">
                        <img 
                          src={offer.image_url} 
                          alt={offer.title} 
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{offer.title}</TableCell>
                    <TableCell>{format(new Date(offer.expires_at), "PPP")}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferManagement;
