import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Connect to Supabase to store email
    console.log('Newsletter submission');
  };

  return (
    <footer className="bg-brand-800 text-cream-100">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-playfair font-bold">Natural <span className="text-gold-500">Puff</span></h3>
            <p className="text-cream-300 max-w-xs">
              Premium roasted makhana snacks crafted with love and care for your healthy lifestyle.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-playfair font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-cream-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-cream-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/products" className="text-cream-300 hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/health-benefits" className="text-cream-300 hover:text-white transition-colors">Health Benefits</Link></li>
              <li><Link to="/blog" className="text-cream-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-cream-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-playfair font-bold mb-4">Contact Us</h4>
            <address className="not-italic text-cream-300 space-y-2">
              <p>Shubhankarpur </p>
              <p> Darbhanga,  Bihar 846004
              </p>
              <p>India</p>
              <p className="pt-2">
                <a href="mailto:info@naturalpuff.com" className="hover:text-white transition-colors">
                  info@naturalpuff.com
                </a>
              </p>
              <p>
                <a href="tel:+917739412888" className="hover:text-white transition-colors">
                  +91 7739412888
                </a>
              </p>
            </address>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-playfair font-bold mb-4">Subscribe to Newsletter</h4>
            <p className="text-cream-300 mb-4">
              Stay updated with our latest products and offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="flex">
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-brand-700 border-brand-600 text-white placeholder:text-cream-400 rounded-r-none"
                  required
                />
                <Button className="bg-gold-500 hover:bg-gold-600 text-brand-800 rounded-l-none">
                  Subscribe
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Social Media and Copyright */}
        <div className="mt-12 pt-6 border-t border-brand-700 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-cream-300 text-sm flex flex-col">
            <div>© {new Date().getFullYear()} Natural Puff. All rights reserved.</div>
            <div className="text-xs opacity-70 mt-1" style={{ fontSize: '0.8rem' }}>
              Designed & Developed by <a 
                href="https://quick-site-lab.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gold-300 transition-colors"
              >
                Quick Site Lab
              </a>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-cream-300 hover:text-white transition-colors" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/naturalpuff.ind?igsh=YnBxazA1dGJ5NjBo" className="text-cream-300 hover:text-white transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className="text-cream-300 hover:text-white transition-colors" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
