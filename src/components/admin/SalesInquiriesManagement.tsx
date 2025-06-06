import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Search, Trash2, Mail, Check, Phone } from 'lucide-react';

interface SalesInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  location: string | null;
  order_size: string | null;
  message: string;
  created_at: string;
  responded: boolean;
  responded_at: string | null;
  notes: string | null;
}

const SalesInquiriesManagement = () => {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<SalesInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);
  const [notes, setNotes] = useState('');
  const [showResponded, setShowResponded] = useState(false);

  // Supabase API credentials
  const SUPABASE_URL = 'https://nmpaafoonvivsdxcbaoe.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcGFhZm9vbnZpdnNkeGNiYW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTYzOTcsImV4cCI6MjA2MTQ3MjM5N30.iAB0e2wl-TwGlFcE8gqCTgyUxFj7i9HSKv-bKMod8nU';

  useEffect(() => {
    fetchInquiries();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchInquiries();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [showResponded]);

  const fetchInquiries = async () => {
    setLoading(true);
    console.log('Fetching sales inquiries, showResponded:', showResponded);
    try {
      // First try to create the table if it doesn't exist
      try {
        const createTableResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_sales_inquiries_table`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({})
        });
        console.log('Table creation response status:', createTableResponse.status);
        
        // Check if the function executed successfully
        if (createTableResponse.ok) {
          console.log('Table creation function executed successfully');
        } else {
          const errorText = await createTableResponse.text();
          console.error('Table creation function error:', errorText);
        }
      } catch (e) {
        // Ignore errors here as the table might already exist
        console.log('Table creation attempt error (might already exist):', e);
      }

      // For debugging, let's try to check if the table exists directly
      try {
        const tableCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/sales_inquiries?limit=0`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        console.log('Table check response status:', tableCheckResponse.status);
        if (tableCheckResponse.status === 404) {
          console.error('Table does not exist or is not accessible');
        }
      } catch (e) {
        console.error('Error checking if table exists:', e);
      }

      // Construct the URL with query parameters
      // Important: Don't filter initially to see if there's any data
      let url = `${SUPABASE_URL}/rest/v1/sales_inquiries?select=*`;
      
      // Add the order parameter
      url += '&order=created_at.desc';
      
      // Only filter by responded status if showResponded is false
      if (!showResponded) {
        url += '&responded=eq.false';
      }

      console.log('Fetching from URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        throw new Error(`Error fetching inquiries: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched inquiries data:', data, 'Length:', data.length);
      
      // Always set the data, even if empty
      setInquiries(data || []);
      
      // Show a toast if we successfully fetched data but it's empty
      if (data.length === 0) {
        console.log('No inquiries found in the database');
        toast({
          title: 'No Inquiries',
          description: 'No sales inquiries found in the database. Try submitting one from the Sales Team page.',
        });
      }
    } catch (error: any) {
      console.error('Error fetching sales inquiries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales inquiries: ' + (error.message || 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const searchLower = searchQuery.toLowerCase();
    return (
      inquiry.name?.toLowerCase().includes(searchLower) ||
      inquiry.email?.toLowerCase().includes(searchLower) ||
      inquiry.company?.toLowerCase().includes(searchLower) ||
      inquiry.message?.toLowerCase().includes(searchLower) ||
      inquiry.location?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectInquiry = (inquiry: SalesInquiry) => {
    setSelectedInquiry(inquiry);
    setNotes(inquiry.notes || '');
  };

  const handleMarkAsResponded = async () => {
    if (!selectedInquiry) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sales_inquiries?id=eq.${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          responded: true,
          responded_at: new Date().toISOString(),
          notes: notes,
        })
      });

      if (!response.ok) {
        throw new Error(`Error updating inquiry: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: 'Inquiry marked as responded',
      });

      fetchInquiries();
      setSelectedInquiry(null);
    } catch (error: any) {
      console.error('Error updating inquiry:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to update inquiry',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sales_inquiries?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        }
      });

      if (!response.ok) {
        throw new Error(`Error deleting inquiry: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: 'Inquiry deleted successfully',
      });

      fetchInquiries();
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
    } catch (error: any) {
      console.error('Error deleting inquiry:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to delete inquiry',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-brand-800">Sales Inquiries</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search inquiries..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-responded"
              checked={showResponded}
              onCheckedChange={(checked) => setShowResponded(checked as boolean)}
            />
            <label
              htmlFor="show-responded"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Responded
            </label>
          </div>
          <Button onClick={fetchInquiries} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 overflow-auto max-h-[600px] border rounded-md">
            {filteredInquiries.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No inquiries found
              </div>
            ) : (
              <div className="divide-y">
                {filteredInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedInquiry?.id === inquiry.id ? 'bg-gray-100' : ''}`}
                    onClick={() => handleSelectInquiry(inquiry)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">{inquiry.company || 'No Company'}</h3>
                      {inquiry.responded ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Responded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{inquiry.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(inquiry.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 border rounded-md p-4">
            {selectedInquiry ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold">{selectedInquiry.company || 'No Company'}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    {!selectedInquiry.responded && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleMarkAsResponded}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark as Responded
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">From</p>
                    <p>{selectedInquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="flex items-center">
                      {selectedInquiry.email}
                      <a
                        href={`mailto:${selectedInquiry.email}`}
                        className="ml-2 text-brand-600 hover:text-brand-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </p>
                  </div>
                  {selectedInquiry.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="flex items-center">
                        {selectedInquiry.phone}
                        <a
                          href={`tel:${selectedInquiry.phone}`}
                          className="ml-2 text-brand-600 hover:text-brand-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p>{formatDate(selectedInquiry.created_at)}</p>
                  </div>
                  {selectedInquiry.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p>{selectedInquiry.location}</p>
                    </div>
                  )}
                  {selectedInquiry.order_size && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estimated Order Size</p>
                      <p>{selectedInquiry.order_size}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Message</p>
                  <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this inquiry..."
                    className="min-h-[100px]"
                  />
                </div>

                {selectedInquiry.responded && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-green-700">Responded on {formatDate(selectedInquiry.responded_at || '')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>Select an inquiry to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInquiriesManagement;
