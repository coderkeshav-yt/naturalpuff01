import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Connect to Supabase to store message
    console.log('Form submission:', formData);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-cream-100 py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-brand-800 font-playfair">Contact Us</h1>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-brand-700">
              Have questions or feedback? We'd love to hear from you. 
              Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="bg-cream-100 p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6 font-playfair">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-brand-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number (optional)"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-brand-700 mb-1">
                    Subject*
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is this regarding?"
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-700 mb-1">
                    Message*
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message"
                    className="w-full min-h-[150px]"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
            
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold mb-6 font-playfair">Contact Information</h2>
              
              <div className="space-y-8">
                {/* Office Address */}
                <div className="flex">
                  <div className="mr-4 bg-brand-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 font-playfair">Office Address 1: </h3>
                    <address className="not-italic text-brand-700">
                    <p>Natural Puff,</p>
                      <p>Shubhankarpur </p>
                      <p> Darbhanga,Bihar 846004
                      </p>
                    </address>
                  </div>
                </div>
                
                {/* Second Office Address */}
                <div className="flex mt-4">
                  <div className="mr-4 bg-brand-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 font-playfair">Office Address 2: </h3>
                    <address className="not-italic text-brand-700">
                      <p>Animesh Agencies,</p>
                      <p>Amarsinh Colony , Malegaon BK , </p>
                      <p>Baramati , Pune , Maharashtra-413115</p>
                    
                    </address>
                  </div>
                </div>
                
                {/* Email */}
                <div className="flex">
                  <div className="mr-4 bg-brand-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 font-playfair">Email Us</h3>
                    <p className="text-brand-700">
                      <a href="mailto:info@naturalpuff.com" className="hover:text-brand-600">
                        info@naturalpuff.com
                      </a>
                    </p>
                    <p className="text-brand-700">
                      <a href="mailto:sales@naturalpuff.com" className="hover:text-brand-600">
                        sales@naturalpuff.com
                      </a>
                    </p>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="flex">
                  <div className="mr-4 bg-brand-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 font-playfair">Call Us</h3>
                    <p className="text-brand-700">
                      <a href="tel:+917739412888" className="hover:text-brand-600">
                        +91 7739412888
                      </a> 
                    </p>
                    <p className="text-brand-700">
                      <a href="tel:+918530398939" className="hover:text-brand-600">
                        +91 8530398939
                      </a> 
                    </p>
                  </div>
                </div>
                
                {/* Business Hours */}
                <div className="flex">
                  <div className="mr-4 bg-brand-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 font-playfair">Business Hours</h3>
                    <p className="text-brand-700">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-brand-700">Saturday: 10:00 AM - 4:00 PM</p>
                    <p className="text-brand-700">Sunday: Closed</p>
                  </div>
                </div>
              </div>
              
              {/* Social Media Links */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-3 font-playfair">Connect With Us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-brand-600 hover:text-brand-700 transition-colors" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/naturalpuff.ind?igsh=YnBxazA1dGJ5NjBo" className="text-brand-600 hover:text-brand-700 transition-colors" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a href="#" className="text-brand-600 hover:text-brand-700 transition-colors" aria-label="Twitter">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a href="#" className="text-brand-600 hover:text-brand-700 transition-colors" aria-label="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-6 font-playfair">Frequently Asked Questions</h2>
              <p className="text-brand-700">
                Can't find the answer you're looking for? Reach out to our customer support team.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-cream-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2 font-playfair">What are your shipping options?</h3>
                <p className="text-brand-700">
                  We offer standard shipping (3-5 business days) and express shipping (1-2 business days) 
                  throughout India. Free shipping is available on orders above ₹500.
                </p>
              </div>

              <div className="bg-cream-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2 font-playfair">Do you offer international shipping?</h3>
                <p className="text-brand-700">
                  Currently, we only ship within India. We're working on expanding our shipping options 
                  to other countries and will announce when international shipping becomes available.
                </p>
              </div>

              <div className="bg-cream-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2 font-playfair">What is your return policy?</h3>
                <p className="text-brand-700">
                  We accept returns within 7 days of delivery if the product is unused and in its 
                  original packaging. Please contact our customer service team to initiate a return.
                </p>
              </div>

              <div className="bg-cream-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2 font-playfair">How can I track my order?</h3>
                <p className="text-brand-700">
                  Once your order is shipped, you'll receive a tracking number via email. 
                  You can also track your order on our website by logging into your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-brand-600 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Ready to Try Our Products?</h2>
            <p className="text-lg mb-8">
              Browse our selection of premium makhana snacks and experience the perfect blend of taste and nutrition.
            </p>
            <Button className="bg-gold-500 hover:bg-gold-600 text-brand-800 px-8 py-6 text-lg">
              Shop Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
