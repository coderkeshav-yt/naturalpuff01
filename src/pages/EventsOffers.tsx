
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Tag, Info, Clock, MapPin, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url?: string;
  link?: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount_percent: number;
  expires_at?: string;
  is_active: boolean;
}

const EventsOffers = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Natural Foods Expo 2023',
      description: 'Join us at the biggest natural foods expo of the year! Our team will be showcasing our latest products and offering exclusive samples.',
      date: '2023-10-15',
      location: 'Delhi Exhibition Center, Hall 3',
      image_url: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2574&q=80',
      link: 'https://naturalfoodsexpo.com'
    },
    {
      id: '2',
      title: 'Wellness Workshop',
      description: 'Learn about incorporating healthy snacks into your daily routine with our nutrition experts.',
      date: '2023-09-20',
      location: 'Online Webinar',
      image_url: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
      link: 'https://naturalpuff.com/webinars'
    },
    {
      id: '3',
      title: 'Community Market Day',
      description: 'We\'ll be at the local farmers market offering tastings and special discounts on all our products.',
      date: '2023-08-27',
      location: 'Mumbai Community Park',
      image_url: 'https://images.unsplash.com/photo-1620706857370-efc5835aa8d5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1744&q=80',
    }
  ]);
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveOffers();
  }, []);

  const fetchActiveOffers = async () => {
    setIsLoading(true);
    try {
      // Fetch active coupons from the database
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map coupons to offers
      const activeOffers: Offer[] = (data || []).map(coupon => ({
        id: coupon.id,
        title: `${coupon.discount_percent}% Off with code: ${coupon.code}`,
        description: 'Apply this coupon during checkout to get an exclusive discount on your order.',
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        expires_at: coupon.expires_at,
        is_active: coupon.is_active
      }));

      setOffers(activeOffers);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load current offers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code Copied!',
      description: 'Coupon code has been copied to clipboard.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  return (
    <div className="container-custom py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-brand-800 font-playfair text-center">Events & Offers</h1>
      
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <p className="text-gray-600">
          Stay updated with our latest events and exclusive offers. Join us at our upcoming events or use our special discount codes to save on your favorite products!
        </p>
      </div>
      
      {/* Upcoming Events Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-brand-700">
          <CalendarDays className="mr-2 h-6 w-6" />
          Upcoming Events
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col h-full">
              {event.image_url && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {event.location}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-gray-600">{event.description}</p>
              </CardContent>
              <CardFooter className="pt-0">
                {event.link ? (
                  <Button asChild className="w-full bg-brand-600 hover:bg-brand-700">
                    <a href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                      Learn More
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button className="w-full bg-brand-600 hover:bg-brand-700">
                    Save the Date
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Special Offers Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center text-brand-700">
          <Tag className="mr-2 h-6 w-6" />
          Special Offers
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
          </div>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Info className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Offers</h3>
              <p className="text-gray-500">
                There are currently no active offers. Check back soon for new discounts and promotions!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className={`overflow-hidden border-l-4 ${isExpired(offer.expires_at) ? 'border-l-gray-400' : 'border-l-green-500'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{offer.title}</CardTitle>
                    <Badge variant={isExpired(offer.expires_at) ? "outline" : "secondary"} className="ml-2">
                      {isExpired(offer.expires_at) ? 'Expired' : `${offer.discount_percent}% Off`}
                    </Badge>
                  </div>
                  {offer.expires_at && (
                    <CardDescription className={isExpired(offer.expires_at) ? 'text-red-500' : 'text-gray-500'}>
                      {isExpired(offer.expires_at) 
                        ? `Expired on ${formatDate(offer.expires_at)}`
                        : `Valid until ${formatDate(offer.expires_at)}`}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{offer.description}</p>
                  <div className="bg-gray-100 p-3 rounded-md flex items-center justify-between">
                    <code className="font-mono font-bold text-brand-700">{offer.code}</code>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyCode(offer.code)}
                      disabled={isExpired(offer.expires_at)}
                    >
                      Copy Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EventsOffers;
