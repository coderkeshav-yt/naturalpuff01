import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Star, ChevronRight, CheckCircle, Calendar, Gift } from 'lucide-react';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { HeroCarousel } from '@/components/ui/hero-carousel';

// Product interface
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  rating?: number;
  discount_percent?: number;
}

// Event interface
interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  image: string;
  type: 'event' | 'offer';
}

const Home = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sample events and offers data
  const eventsAndOffers: Event[] = [
    {
      id: 1,
      title: "Summer Special: 20% Off",
      date: "Valid till June 30, 2025",
      description: "Get 20% off on all our premium makhana products with code SUMMER20",
      image: "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910077/4_rrgvey.jpg",
      type: "offer"
    },
    {
      id: 2,
      title: "Makhana Festival 2025",
      date: "July 15-17, 2025",
      description: "Join us for a 3-day celebration of healthy snacking with workshops, tastings, and special discounts",
      image: "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910080/5_tdxi1b.jpg",
      type: "event"
    },
    {
      id: 3,
      title: "Buy One Get One Free",
      date: "Weekends Only",
      description: "Every weekend, buy any pack and get another one free. Limited time offer!",
      image: "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910077/1_hgavbu.jpg",
      type: "offer"
    },
    {
      id: 4,
      title: "Healthy Snacking Webinar",
      date: "August 5, 2025",
      description: "Learn about the benefits of makhana and healthy snacking habits from nutrition experts",
      image: "https://res.cloudinary.com/dlvxjnycr/image/upload/v1746023952/makhana_1_cj3w29.jpg",
      type: "event"
    }
  ];

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(3);
      
      if (error) throw error;
      
      if (data) {
        // Transform data to add ratings and discounts
        const productsWithRatings = data.map(product => ({
          ...product,
          rating: 4.5 + Math.random() * 0.5,
          discount_percent: Math.floor(Math.random() * 10) + 5
        }));
        
        setFeaturedProducts(productsWithRatings);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Success!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail('');
    }
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-gold-500 text-gold-500" />);
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="w-4 h-4 absolute text-gold-500" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gold-300" />);
    }

    return (
      <div className="flex">
        {stars}
        <span className="ml-1 text-sm text-brand-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Carousel images
  const carouselImages = [
    "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910077/4_rrgvey.jpg",
    "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910080/5_tdxi1b.jpg",
    "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910077/1_hgavbu.jpg",
    "https://res.cloudinary.com/dlvxjnycr/image/upload/v1746023952/makhana_1_cj3w29.jpg",
    "https://res.cloudinary.com/dlvxjnycr/image/upload/v1746023952/makhana_2_iw8vre.jpg"
  ];

  // Animated gradient backgrounds
  const blob1Variants = {
    animate: {
      x: [0, 30, -20, 0],
      y: [0, -50, 20, 0],
      scale: [1, 1.1, 0.9, 1],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const blob2Variants = {
    animate: {
      x: [0, -30, 20, 0],
      y: [0, 30, -40, 0],
      scale: [1, 0.9, 1.1, 1],
      transition: {
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
  };

  // Hero section image
  const heroImage = "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910077/4_rrgvey.jpg";
  const aboutImage = "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910080/5_tdxi1b.jpg";
  const healthImage = "https://res.cloudinary.com/dlvxjnycr/image/upload/v1745910077/1_hgavbu.jpg";

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />
      {/* Hero Section with Advanced Animation */}
      <section className="relative py-16 md:py-24 lg:py-32 bg-gradient-to-b from-cream-50 to-cream-200 overflow-hidden">
        <motion.div 
          className="absolute top-0 -right-1/4 w-2/3 h-2/3 rounded-full bg-gold-300 mix-blend-multiply filter blur-[100px] opacity-30"
          variants={blob1Variants}
          animate="animate"
        />
        <motion.div 
          className="absolute bottom-0 -left-1/4 w-2/3 h-2/3 rounded-full bg-brand-500 mix-blend-multiply filter blur-[100px] opacity-30"
          variants={blob2Variants}
          animate="animate"
        />
        
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-6 inline-block shadow-sm">Premium Quality & Taste</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-brand-800 leading-tight font-playfair"
              >
                <span className="relative">
                  Premium <span className="text-brand-600">Makhana</span>
                  <motion.span 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                    className="absolute bottom-2 left-0 w-full h-2 bg-gold-400 -z-10"
                  />
                </span>
                <br /> 
                <span className="text-brand-700">Healthy Snacks</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-xl md:text-2xl mb-10 text-brand-700 max-w-lg leading-relaxed"
              >
                Discover our artisanal, nutrient-rich makhana snacks — where health meets extraordinary flavor in every bite.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 md:gap-6"
              >
                <Link to="/products">
                  <Button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                    <span>Explore Products</span>
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all duration-300">
                    Our Story
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="mt-12"
              >
                <ul className="flex flex-wrap items-center gap-6">
                  <li className="flex items-center text-brand-700">
                    <CheckCircle className="w-5 h-5 mr-2 text-brand-600" />
                    <span>100% Natural</span>
                  </li>
                  <li className="flex items-center text-brand-700">
                    <CheckCircle className="w-5 h-5 mr-2 text-brand-600" />
                    <span>Gluten-Free</span>
                  </li>
                  <li className="flex items-center text-brand-700">
                    <CheckCircle className="w-5 h-5 mr-2 text-brand-600" />
                    <span>High Protein</span>
                  </li>
                </ul>
              </motion.div>
            </motion.div>
            
            {/* Right Column - Image/Carousel */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="order-1 lg:order-2 relative"
            >
              <div className="relative">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-brand-300/20 to-gold-300/40 blur-2xl -z-10" />
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-3xl shadow-2xl">
                  <div className="overflow-hidden rounded-2xl">
                    <ImageCarousel images={carouselImages} />
                  </div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute top-5 -left-8 bg-white/90 backdrop-blur py-2 px-4 rounded-full shadow-lg"
                >
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      200+ Reviews
                    </span>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute -bottom-5 -right-5 bg-white/90 backdrop-blur py-2 px-4 rounded-full shadow-lg"
                >
                  <span className="text-brand-800 font-medium">100% Natural</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          {/* Benefits Bar */}
          <motion.div 
            className="mt-16 md:mt-24 grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.div 
              className="bg-white/80 backdrop-blur rounded-lg px-6 py-4 shadow-md hover:shadow-lg transition-shadow"
              variants={childVariants}
            >
              <div className="text-brand-600 mb-2 text-xl font-bold">Gluten-Free</div>
              <p className="text-brand-700 text-sm">Safe for celiac & gluten-sensitive individuals</p>
            </motion.div>
            
            <motion.div 
              className="bg-white/80 backdrop-blur rounded-lg px-6 py-4 shadow-md hover:shadow-lg transition-shadow"
              variants={childVariants}
            >
              <div className="text-brand-600 mb-2 text-xl font-bold">Low Calorie</div>
              <p className="text-brand-700 text-sm">Perfect for weight management & mindful eating</p>
            </motion.div>
            
            <motion.div 
              className="bg-white/80 backdrop-blur rounded-lg px-6 py-4 shadow-md hover:shadow-lg transition-shadow"
              variants={childVariants}
            >
              <div className="text-brand-600 mb-2 text-xl font-bold">High Protein</div>
              <p className="text-brand-700 text-sm">Plant-based protein for sustained energy</p>
            </motion.div>
            
            <motion.div 
              className="bg-white/80 backdrop-blur rounded-lg px-6 py-4 shadow-md hover:shadow-lg transition-shadow"
              variants={childVariants}
            >
              <div className="text-brand-600 mb-2 text-xl font-bold">No Additives</div>
              <p className="text-brand-700 text-sm">Free from artificial colors & preservatives</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products with Animation */}
      <section className="py-20 md:py-24 bg-cream-200 overflow-hidden">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-4 inline-block">Bestselling Flavors</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">Featured Products</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-6"></div>
            <p className="mt-4 text-xl text-brand-700 max-w-2xl mx-auto">
              Discover our most-loved premium makhana varieties, crafted with care and premium ingredients.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img 
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.discount_percent && (
                      <div className="absolute top-4 left-4 bg-brand-600 text-white rounded-full px-3 py-1.5 text-sm font-bold">
                        {product.discount_percent}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-brand-800 font-playfair">{product.name}</h3>
                      <div className="text-lg font-bold text-brand-600">₹{product.price}</div>
                    </div>
                    
                    {product.rating && (
                      <div className="mb-3">
                        {renderStarRating(product.rating)}
                      </div>
                    )}
                    
                    <p className="text-brand-700 mb-6 line-clamp-2">{product.description}</p>
                    
                    <Link to={`/products`} state={{ productId: product.id }}>
                      <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                        View Product
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/products">
              <Button variant="outline" className="border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white px-8 py-4 text-lg shadow-md hover:shadow-lg transition-all duration-300">
                View All Products
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Events and Offers Section */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        <motion.div 
          className="absolute top-20 left-[10%] w-96 h-96 rounded-full bg-purple-200 mix-blend-multiply filter blur-[100px] opacity-30"
          animate={{ 
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-blue-200 mix-blend-multiply filter blur-[100px] opacity-30"
          animate={{ 
            x: [0, -30, 20, 0],
            y: [0, 40, -20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container-custom relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4 inline-block">Stay Updated</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">Upcoming Events & Offers</h2>
            <div className="w-24 h-1 bg-purple-500 mx-auto mb-6"></div>
            <p className="mt-4 text-xl text-brand-700 max-w-2xl mx-auto">
              Don't miss our latest events and special offers. Join us and enjoy premium makhana experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 mb-12">
            {eventsAndOffers.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="h-full">
                    <div className="h-full overflow-hidden">
                      <img 
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  <div className="p-6 flex flex-col">
                    <div className="flex items-center mb-3">
                      {item.type === 'event' ? (
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                          <Calendar className="w-3 h-3 mr-1" /> Event
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                          <Gift className="w-3 h-3 mr-1" /> Offer
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{item.title}</h3>
                    <p className="text-sm text-purple-600 mb-3 font-medium">{item.date}</p>
                    
                    <p className="text-gray-700 mb-4 text-sm flex-grow">{item.description}</p>
                    
                    <Link to={item.type === 'event' ? "/events" : "/products"} className="mt-auto">
                      <Button 
                        variant="outline"
                        className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors"
                      >
                        {item.type === 'event' ? 'Learn More' : 'Get Offer'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/events">
              <Button variant="outline" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 text-lg shadow-md hover:shadow-lg transition-all duration-300">
                View All Events & Offers
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Snippet with Animation - Removed Team Section */}
      <section className="py-24 md:py-32 bg-white relative overflow-hidden">
        <motion.div 
          className="absolute top-40 right-[20%] w-96 h-96 rounded-full bg-cream-300 mix-blend-multiply filter blur-[100px] opacity-30"
          animate={{ 
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center mt-0">
            {/* About Company section */}
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-4 inline-block">About Us</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">About Natural Puff</h2>
              <div className="w-24 h-1 bg-gold-500 mx-auto mb-6"></div>
              <p className="mt-4 text-xl text-brand-700 max-w-2xl mx-auto">
                Natural Puff was born from the desire to reimagine traditional makhana (fox nuts) 
                into premium, flavorful snacks that don't compromise on taste or nutrition.
              </p>
              <div className="mt-8">
                <Link to="/about">
                  <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                    Learn More About Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Health Benefits Section */}
      <section className="py-20 md:py-28 bg-brand-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <motion.div 
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-500 mix-blend-soft-light filter blur-[80px] opacity-40"
          animate={{ 
            x: [0, 50, -30, 0],
            y: [0, -30, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-gold-500 mix-blend-soft-light filter blur-[80px] opacity-40"
          animate={{ 
            x: [0, -40, 30, 0],
            y: [0, 50, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="px-4 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium mb-6 inline-block backdrop-blur-sm"
              >
                Health & Wellness
              </motion.span>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold mb-6 font-playfair"
              >
                Supercharge Your Health
              </motion.h2>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="w-20 h-1 bg-gold-500 mb-8"
              />
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xl mb-8 leading-relaxed"
              >
                Makhana, also known as fox nuts or lotus seeds, are packed with essential nutrients 
                that provide remarkable benefits for your overall well-being and vitality.
              </motion.p>
              
              <motion.ul 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerChildren}
                className="space-y-5 mb-10"
              >
                <motion.li variants={childVariants} className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 text-gold-300 flex-shrink-0" />
                  <div>
                    <span className="text-lg font-medium">Rich in Antioxidants</span>
                    <p className="text-white/80 mt-1">Helps neutralize free radicals and reduce oxidative stress</p>
                  </div>
                </motion.li>
                
                <motion.li variants={childVariants} className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 text-gold-300 flex-shrink-0" />
                  <div>
                    <span className="text-lg font-medium">Low Glycemic Index</span>
                    <p className="text-white/80 mt-1">Perfect for managing blood sugar levels and sustained energy</p>
                  </div>
                </motion.li>
                
                <motion.li variants={childVariants} className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 text-gold-300 flex-shrink-0" />
                  <div>
                    <span className="text-lg font-medium">Heart Health Support</span>
                    <p className="text-white/80 mt-1">Promotes cardiovascular wellness through plant compounds</p>
                  </div>
                </motion.li>
                
                <motion.li variants={childVariants} className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 text-gold-300 flex-shrink-0" />
                  <div>
                    <span className="text-lg font-medium">Weight Management</span>
                    <p className="text-white/80 mt-1">High fiber, low calorie profile helps with satiety and digestion</p>
                  </div>
                </motion.li>
              </motion.ul>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <Link to="/health-benefits">
                  <Button className="bg-gold-500 hover:bg-gold-600 text-brand-800 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <span>Explore Health Benefits</span>
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="relative order-1 lg:order-2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-gold-400/20 to-brand-400/20 blur-2xl -z-10" />
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl shadow-2xl">
                <div className="overflow-hidden rounded-2xl relative">
                  <img 
                    src={healthImage} 
                    alt="Health Benefits of Makhana" 
                    className="w-full h-auto rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="absolute top-6 right-6 bg-gold-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
              >
                <span className="text-brand-800 font-medium">Nutrient-Rich</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-lg p-4 shadow-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-brand-100 p-3">
                    <div className="text-brand-600 font-bold text-2xl">0%</div>
                  </div>
                  <div>
                    <div className="font-medium text-brand-800">Cholesterol</div>
                    <div className="text-sm text-brand-600">Heart Healthy</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute top-1/3 -right-6 bg-white rounded-lg p-4 shadow-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-brand-100 p-3">
                    <div className="text-brand-600 font-bold text-2xl">7g</div>
                  </div>
                  <div>
                    <div className="font-medium text-brand-800">Protein</div>
                    <div className="text-sm text-brand-600">Per Serving</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-cream-100">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-6 inline-block">What Our Customers Say</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">Customer Love</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-6"></div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Priya S.",
                role: "Fitness Enthusiast",
                quote: "Natural Puff has become my go-to snack during workouts. High protein, great taste, and keeps me energized without the guilt!",
                rating: 5
              },
              {
                name: "Rahul M.",
                role: "Office Professional",
                quote: "These makhanas are perfect for my desk drawer at work. The flavors are incredible, especially the Cream & Onion variety!",
                rating: 5
              },
              {
                name: "Aisha K.",
                role: "Mom of Two",
                quote: "Finally found a healthy snack my kids love! The caramel makhana is their favorite, and I feel good about giving them something nutritious.",
                rating: 4.5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="mb-4">
                  {renderStarRating(testimonial.rating)}
                </div>
                <p className="text-brand-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                    {testimonial.name[0]}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-brand-800">{testimonial.name}</div>
                    <div className="text-sm text-brand-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </section>

    {/* Newsletter Signup with Animation */}
    <section className="py-20 md:py-28 bg-cream-100 relative overflow-hidden">
      <motion.div 
        className="absolute top-20 right-[10%] w-96 h-96 rounded-full bg-gold-400 mix-blend-multiply filter blur-3xl opacity-20"
        animate={{ 
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 left-[10%] w-96 h-96 rounded-full bg-brand-500 mix-blend-multiply filter blur-3xl opacity-20"
        animate={{ 
          x: [0, -30, 20, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="container-custom relative z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-6 inline-block">Stay Updated</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">Join Our Newsletter</h2>
          <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
          <p className="text-xl text-brand-700 mb-10 leading-relaxed">
            Subscribe to receive updates on new products, special promotions, and healthy recipe ideas with makhana.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                type="email" 
                placeholder="Your email address" 
                className="flex-grow text-lg py-6 shadow-md"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button 
                type="submit" 
                className="bg-brand-600 hover:bg-brand-700 text-white whitespace-nowrap px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Subscribe Now
              </Button>
            </div>
            <p className="text-sm text-brand-700 mt-4">
              We respect your privacy and will never share your information.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  </div>
  );
};

export default Home;
