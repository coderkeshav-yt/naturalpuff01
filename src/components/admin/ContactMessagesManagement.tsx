import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Search, Trash2, Mail, Check } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
  responded: boolean;
  responded_at: string | null;
  responded_by: string | null;
  notes: string | null;
}

const ContactMessagesManagement = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [notes, setNotes] = useState('');
  const [showResponded, setShowResponded] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [showResponded]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showResponded) {
        query = query.eq('responded', false);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to load contact messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredMessages = messages.filter(message => {
    const searchLower = searchQuery.toLowerCase();
    return (
      message.name.toLowerCase().includes(searchLower) ||
      message.email.toLowerCase().includes(searchLower) ||
      message.subject.toLowerCase().includes(searchLower) ||
      message.message.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setNotes(message.notes || '');
  };

  const handleMarkAsResponded = async () => {
    if (!selectedMessage) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({
          responded: true,
          responded_at: new Date().toISOString(),
          responded_by: supabase.auth.getUser() ? (await supabase.auth.getUser()).data.user?.id : null,
          notes: notes,
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message marked as responded',
      });

      fetchMessages();
      setSelectedMessage(null);
    } catch (error: any) {
      console.error('Error updating message:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Message deleted successfully',
      });

      fetchMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error: any) {
      console.error('Error deleting message:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
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
        <h2 className="text-2xl font-bold text-brand-800">Contact Messages</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search messages..."
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
          <Button onClick={fetchMessages} variant="outline" size="sm">
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
            {filteredMessages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No messages found
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === message.id ? 'bg-gray-100' : ''}`}
                    onClick={() => handleSelectMessage(message)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">{message.subject}</h3>
                      {message.responded ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Responded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{message.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(message.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 border rounded-md p-4">
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold">{selectedMessage.subject}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    {!selectedMessage.responded && (
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
                    <p>{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="flex items-center">
                      {selectedMessage.email}
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="ml-2 text-brand-600 hover:text-brand-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </p>
                  </div>
                  {selectedMessage.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p>{selectedMessage.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p>{formatDate(selectedMessage.created_at)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Message</p>
                  <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this message..."
                    className="min-h-[100px]"
                  />
                </div>

                {selectedMessage.responded && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-green-700">Responded on {formatDate(selectedMessage.responded_at || '')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessagesManagement;
