import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Phone, Mail, Users, Calendar, ShoppingBag, Building, CheckCircle } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';

const SalesTeam = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    location: '',
    orderSize: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting sales inquiry with data:', formData);

      // Define Supabase API credentials
      const SUPABASE_URL = 'https://nmpaafoonvivsdxcbaoe.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcGFhZm9vbnZpdnNkeGNiYW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTYzOTcsImV4cCI6MjA2MTQ3MjM5N30.iAB0e2wl-TwGlFcE8gqCTgyUxFj7i9HSKv-bKMod8nU';

      // First, let's try to create the table if it doesn't exist
      try {
        // Use direct fetch API to create the table if needed
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
      } catch (tableError) {
        console.error('Table creation exception:', tableError);
        // Continue anyway, as the table might already exist
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

      // Now insert the inquiry using direct fetch API
      console.log('Attempting to insert inquiry data');
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/sales_inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          location: formData.location || null,
          order_size: formData.orderSize || null,
          message: formData.message,
          created_at: new Date().toISOString(),
          responded: false,
          notes: null,
          responded_at: null
        })
      });

      console.log('Insert response status:', insertResponse.status);
      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('Error response text:', errorText);
        throw new Error(`Failed to submit inquiry: ${insertResponse.status} - ${errorText}`);
      }

      // If we get here, the message was sent successfully
      console.log('Inquiry submitted successfully');
      toast({
        title: "Inquiry Submitted!",
        description: "Thank you for your interest. Our sales team will contact you shortly.",
      });
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        location: '',
        orderSize: '',
        message: ''
      });
    } catch (error) {
      console.error('Exception submitting sales inquiry:', error);
      toast({
        title: "Error Submitting Inquiry",
        description: "There was a problem sending your inquiry. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-700 to-brand-800 py-20 md:py-28 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500 opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-gold-500 opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white font-playfair">Contact Our Sales Team</h1>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-cream-100 mb-10">
              Interested in wholesale orders or business partnerships? Our dedicated sales team is ready to assist you with pricing, bulk orders, and customized solutions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gold-500 hover:bg-gold-600 text-brand-800 px-8 py-3 text-lg shadow-lg hover:shadow-xl w-[220px] border-b-2 border-gold-600"
                onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Submit an Inquiry
              </button>
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white text-white hover:bg-white/10 px-8 py-3 text-lg w-[220px] backdrop-blur-sm shadow-md hover:shadow-lg"
                onClick={() => document.getElementById('team-info')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Meet Our Team
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 md:py-24 bg-cream-100">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <span className="px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-4 inline-block">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-playfair">Benefits of Partnering With Us</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-6"></div>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {/* Benefit 1 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
              variants={fadeIn}
            >
              <div className="bg-brand-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6">
                <ShoppingBag className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-playfair">Premium Quality Products</h3>
              <p className="text-brand-700">
                Our makhana snacks are crafted with the finest ingredients, ensuring consistent quality for your customers.
              </p>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
              variants={fadeIn}
            >
              <div className="bg-brand-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6">
                <Building className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-playfair">Flexible Wholesale Options</h3>
              <p className="text-brand-700">
                From small retail orders to large distribution quantities, we offer flexible packaging and pricing options.
              </p>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
              variants={fadeIn}
            >
              <div className="bg-brand-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-playfair">Dedicated Support</h3>
              <p className="text-brand-700">
                Our sales team provides personalized service, from order placement to delivery and after-sales support.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sales Inquiry Form and Team Info */}
      <section id="inquiry-form" className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Sales Inquiry Form */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-cream-100 p-8 rounded-xl shadow-lg"
            >
              <h2 className="text-3xl font-bold mb-6 font-playfair">Submit a Sales Inquiry</h2>
              <p className="text-brand-700 mb-8">
                Fill out the form below and our sales team will get back to you within 24 hours with pricing and availability information.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-700 mb-1">
                      Full Name*
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-700 mb-1">
                      Email Address*
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your email address"
                      className="w-full"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-700 mb-1">
                      Phone Number*
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your phone number"
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-brand-700 mb-1">
                      Company/Business Name*
                    </label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Your company name"
                      className="w-full"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-brand-700 mb-1">
                      Location/City*
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Your city/location"
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="orderSize" className="block text-sm font-medium text-brand-700 mb-1">
                      Estimated Order Size*
                    </label>
                    <select
                      id="orderSize"
                      name="orderSize"
                      value={formData.orderSize}
                      onChange={handleChange}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="" disabled>Select order size</option>
                      <option value="Small (1-50 units)">Small (1-50 units)</option>
                      <option value="Medium (51-200 units)">Medium (51-200 units)</option>
                      <option value="Large (201-500 units)">Large (201-500 units)</option>
                      <option value="Bulk (500+ units)">Bulk (500+ units)</option>
                      <option value="Custom">Custom requirement</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-700 mb-1">
                    Additional Details*
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please provide details about your requirements, preferred products, or any questions you have."
                    className="w-full min-h-[150px]"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </Button>
              </form>
            </motion.div>
            
            {/* Team Information */}
            <div id="team-info">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <h2 className="text-3xl font-bold mb-6 font-playfair">Meet Our Sales Team</h2>
                <p className="text-brand-700 mb-8">
                  Our experienced sales professionals are dedicated to helping your business grow with our premium makhana products.
                </p>
              </motion.div>
              
              {/* Team Members */}
              <motion.div 
                className="space-y-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerChildren}
              >
                {/* Team Member 1 */}
                <motion.div 
                  className="flex items-center bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                  variants={fadeIn}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mr-6 flex-shrink-0">
                    <LazyImage 
                      src="https://res.cloudinary.com/dlvxjnycr/image/upload/v1746450710/Screenshot_2025-05-05_184100_ssvwxw.png" 
                      alt="Animesh Doshi" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-800">Animesh Doshi</h3>
                    <p className="text-brand-600 font-medium mb-2">Head of Sales</p>
                    <div className="flex items-center text-brand-700 mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href="tel:+917739412888" className="hover:text-brand-600">+91 7739412888</a>
                    </div>
                    <div className="flex items-center text-brand-700">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href="mailto:sales@naturalpuff.com" className="hover:text-brand-600">sales@naturalpuff.com</a>
                    </div>
                  </div>
                </motion.div>
                
                {/* Team Member 2 */}
                <motion.div 
                  className="flex items-center bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                  variants={fadeIn}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mr-6 flex-shrink-0">
                    <LazyImage 
                      src="https://res.cloudinary.com/dlvxjnycr/image/upload/v1746438074/WhatsApp_Image_2025-05-05_at_14.47.13_4e153e55_jvcaar.jpg" 
                      alt="Ravi Prakash" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-800">Ravi Prakash</h3>
                    <p className="text-brand-600 font-medium mb-2">Business Development Manager</p>
                    <div className="flex items-center text-brand-700 mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href="tel:+918530398939" className="hover:text-brand-600">+91 8530398939</a>
                    </div>
                    <div className="flex items-center text-brand-700">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href="mailto:business@naturalpuff.com" className="hover:text-brand-600">business@naturalpuff.com</a>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Business Hours and Additional Info */}
              <motion.div 
                className="mt-12 bg-cream-50 p-8 rounded-xl border border-cream-200"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <h3 className="text-xl font-bold mb-6 font-playfair">Business Hours & Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-brand-600 mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-brand-800">Business Hours</p>
                      <p className="text-brand-700">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-brand-700">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-brand-700">Sunday: Closed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-brand-600 mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-brand-800">Wholesale Minimum Order</p>
                      <p className="text-brand-700">Minimum order quantity: 50 units</p>
                      <p className="text-brand-700">Custom packaging available for orders over 200 units</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-brand-600 mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-brand-800">Shipping & Delivery</p>
                      <p className="text-brand-700">Pan-India shipping available</p>
                      <p className="text-brand-700">Typical delivery time: 3-7 business days</p>
                      <p className="text-brand-700">Express shipping options available</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-cream-200">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <span className="px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-4 inline-block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-playfair">What Our Partners Say</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-6"></div>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {/* Testimonial 1 */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md"
              variants={fadeIn}
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <LazyImage 
                    src="https://res.cloudinary.com/dlvxjnycr/image/upload/v1746784524/founder_hvmxub.jpg" 
                    alt="Testimonial" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-800">Rajesh Kumar</h3>
                  <p className="text-brand-600">Healthy Foods Distributor, Mumbai</p>
                </div>
              </div>
              <p className="text-brand-700 italic">
                "Natural Puff has been an exceptional partner for our health food stores. Their makhana snacks are consistently high quality, and their sales team is responsive and professional. Our customers love the products!"
              </p>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md"
              variants={fadeIn}
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <LazyImage 
                    src="https://res.cloudinary.com/dlvxjnycr/image/upload/v1746699710/puff_02_gono4m.jpg" 
                    alt="Testimonial" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-800">Priya Sharma</h3>
                  <p className="text-brand-600">Organic Market Owner, Delhi</p>
                </div>
              </div>
              <p className="text-brand-700 italic">
                "We've been stocking Natural Puff products for over a year now, and they're consistently among our best-sellers. The flexible wholesale options and reliable delivery make them a pleasure to work with."
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-700 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500 opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-gold-500 opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Ready to Partner With Us?</h2>
            <p className="text-lg text-cream-100 mb-8">
              Join our growing network of retailers and distributors. Contact our sales team today to discuss how we can help grow your business with our premium makhana products.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gold-500 hover:bg-gold-600 text-brand-800 px-8 py-3 text-lg shadow-lg hover:shadow-xl w-[220px] border-b-2 border-gold-600"
                onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Submit an Inquiry
              </button>
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white text-white hover:bg-white/10 px-8 py-3 text-lg w-[220px] backdrop-blur-sm shadow-md hover:shadow-lg"
                onClick={() => window.location.href = 'mailto:sales@naturalpuff.com'}
              >
                Email Sales Team
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SalesTeam;
