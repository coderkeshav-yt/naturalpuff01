
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Instagram } from 'lucide-react';

// Placeholder images
const blogImage = '/placeholder.svg';
const authorImage = '/placeholder.svg';
const relatedBlogImage1 = '/placeholder.svg';
const relatedBlogImage2 = '/placeholder.svg';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  
  // Mock blog data - this would come from Supabase in a real implementation
  const blogData = {
    title: "The Ancient History of Makhana and Its Cultural Significance",
    excerpt: "Discover the rich history and cultural significance of makhana (lotus seeds) that spans thousands of years across various cultures in India and parts of Eastern Asia.",
    content: `
      <p>Makhana, also known as fox nuts or lotus seeds, has a rich history that spans thousands of years across various cultures, particularly in India and parts of Eastern Asia. This humble yet nutritionally dense food has been revered not just for its health benefits but also for its cultural and spiritual significance.</p>
      
      <h2>Ancient Origins</h2>
      <p>The cultivation and consumption of makhana dates back to ancient times in the Indian subcontinent, particularly in the eastern regions of Bihar and parts of Nepal, where it naturally grows in ponds and wetlands. Archaeological evidence suggests that makhana has been consumed in these regions for over 5,000 years.</p>
      
      <p>In ancient Indian texts, makhana is mentioned as a food of significance. It appears in Ayurvedic treatises like the Charaka Samhita and Sushruta Samhita, where it's praised for its medicinal properties and is classified as a sattvic food - one that promotes clarity, intelligence, and a peaceful mind.</p>
      
      <h2>Cultural Significance in India</h2>
      <p>In traditional Indian culture, makhana holds a special place in various ceremonies and rituals. During religious fasts (vrats), particularly those observed during festivals like Navratri and Maha Shivaratri, makhana is one of the few foods permitted for consumption. Its inclusion in these sacred observances underscores its purity and auspiciousness in Indian culture.</p>
      
      <p>In Bihar, where the majority of India's makhana is produced, it's not just a food but a way of life. The cultivation, harvesting, and processing of makhana provides livelihood to thousands of families, many of whom have been engaged in this tradition for generations. The intricate knowledge of growing and processing makhana has been passed down through families, becoming an integral part of their cultural heritage.</p>
      
      <h2>Makhana in Traditional Medicine</h2>
      <p>Beyond its cultural significance, makhana has been a cornerstone of traditional medicine systems. In Ayurveda, it's believed to possess cooling properties and is often recommended for balancing the body's doshas (biological energies).</p>
      
      <p>Traditional Chinese Medicine also recognizes the therapeutic value of lotus seeds, using them to strengthen the spleen, calm the mind, and nourish the heart. They are often prescribed for conditions related to restlessness, insomnia, and poor digestion.</p>
      
      <h2>Modern Resurgence</h2>
      <p>While makhana has been celebrated in traditional cultures for millennia, it's experiencing a modern resurgence as a superfood. As global interest in plant-based proteins, gluten-free options, and nutrient-dense foods continues to grow, makhana has found its way into contemporary health food markets worldwide.</p>
      
      <p>This renewed interest not only brings economic benefits to the traditional makhana-growing communities but also helps preserve this ancient food tradition for future generations. At Natural Puff, we're proud to be part of this revival, bringing premium quality makhana products to health-conscious consumers while honoring its rich cultural heritage.</p>
      
      <h2>Preserving Tradition Through Innovation</h2>
      <p>As we continue to develop innovative flavors and products using makhana, we remain committed to preserving the traditional methods of cultivation and processing that have been perfected over centuries. Our partnerships with local farmers in Bihar ensure that these ancient practices are sustained while providing fair compensation for their expertise and labor.</p>
      
      <p>By appreciating the cultural significance of makhana alongside its nutritional benefits, we can develop a deeper connection with this remarkable food and the communities that have nurtured it through the ages.</p>
    `,
    author: {
      name: "Animesh Doshi",
      bio: "Founder of Natural Puff and makhana enthusiast with over 10 years of experience in the industry.",
      image: authorImage
    },
    published_date: "2023-08-15",
    reading_time: "8 min read",
    image_url: blogImage,
    tags: ["History", "Culture", "Makhana Origins", "Traditions"]
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Related posts - mock data
  const relatedPosts = [
    {
      id: 1,
      title: "Makhana vs. Popcorn: Which is the Healthier Snack?",
      slug: "makhana-vs-popcorn-healthier-snack",
      image_url: relatedBlogImage1,
      excerpt: "A comparative analysis of nutritional profiles and health benefits between makhana and popcorn."
    },
    {
      id: 2,
      title: "How Makhana Cultivation Is Supporting Rural Communities",
      slug: "makhana-cultivation-supporting-rural-communities",
      image_url: relatedBlogImage2,
      excerpt: "Exploring the socioeconomic impact of makhana farming on rural communities in Bihar."
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-cream-100 to-cream-200 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-5"></div>
        <div className="animate-blob bg-brand-400 opacity-10 absolute -right-20 bottom-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl"></div>
        
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-6">
              {blogData.tags.map((tag, index) => (
                <span key={index} className="text-sm bg-brand-100 text-brand-600 px-3 py-1 rounded-full shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-brand-800 font-playfair leading-tight">
              {blogData.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-full overflow-hidden mr-4 border-2 border-white shadow-md">
                  <img 
                    src={blogData.author.image} 
                    alt={blogData.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-brand-800">{blogData.author.name}</p>
                  <p className="text-sm text-brand-600">{formatDate(blogData.published_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center text-brand-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{blogData.reading_time}</span>
              </div>
              
              <a href="https://www.instagram.com/naturalpuff.ind?igsh=YnBxazA1dGJ5NjBo" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 text-brand-700 hover:text-brand-600 transition-colors ml-auto">
                <Instagram size={18} />
                <span className="text-sm font-medium">@naturalpuff.ind</span>
              </a>
            </div>
            
            <p className="text-xl text-brand-700 mb-8 leading-relaxed max-w-3xl">
              {blogData.excerpt}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Featured Image */}
            <div className="rounded-2xl overflow-hidden mb-12 shadow-xl">
              <img 
                src={blogData.image_url} 
                alt={blogData.title}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Blog Content */}
            <article className="prose prose-lg lg:prose-xl max-w-none prose-headings:font-playfair prose-headings:font-bold prose-headings:text-brand-800 prose-p:text-brand-700 prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline">
              <div dangerouslySetInnerHTML={{ __html: blogData.content }} />
            </article>

            {/* Tags */}
            <div className="mt-12 flex flex-wrap gap-2">
              {blogData.tags.map((tag, index) => (
                <a key={index} href="#" className="text-sm bg-cream-100 text-brand-600 px-4 py-2 rounded-full hover:bg-brand-100 transition-colors">
                  #{tag.toLowerCase().replace(/\s+/g, '')}
                </a>
              ))}
            </div>

            {/* Author Bio */}
            <div className="mt-14 p-8 bg-cream-100 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-8 shadow-md">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img 
                  src={blogData.author.image} 
                  alt={blogData.author.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 font-playfair text-center md:text-left">About the Author</h3>
                <p className="text-brand-700 text-lg mb-3 font-medium text-center md:text-left">{blogData.author.name}</p>
                <p className="text-brand-700">{blogData.author.bio}</p>
                
                <div className="mt-4 flex items-center justify-center md:justify-start">
                  <a href="https://www.instagram.com/naturalpuff.ind?igsh=YnBxazA1dGJ5NjBo" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-brand-700 hover:text-brand-600 transition-colors">
                    <Instagram size={20} />
                    <span>Follow on Instagram</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Social Sharing */}
            <div className="mt-12 flex flex-col sm:flex-row justify-between items-center p-6 bg-cream-50 rounded-xl shadow-sm">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-medium mb-3">Share this article</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-brand-600 hover:text-brand-700 transition-colors transform hover:scale-110" aria-label="Share on Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </a>
                  <a href="#" className="text-brand-600 hover:text-brand-700 transition-colors transform hover:scale-110" aria-label="Share on Twitter">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a href="#" className="text-brand-600 hover:text-brand-700 transition-colors transform hover:scale-110" aria-label="Share on LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                    </svg>
                  </a>
                </div>
              </div>
              <Link to="/blog">
                <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                  Back to Blog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="section-padding bg-cream-200 relative overflow-hidden">
        <div className="animate-blob animation-delay-4000 bg-gold-400 opacity-20 absolute top-20 left-[10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl"></div>
        
        <div className="container-custom">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center font-playfair">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {relatedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className="h-56 overflow-hidden relative">
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <span className="text-white font-medium">Read Article</span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-bold mb-3 font-playfair">{post.title}</h3>
                    <p className="text-brand-700 mb-6 line-clamp-2">{post.excerpt}</p>
                    <Link to={`/blog/${post.slug}`}>
                      <Button className="bg-brand-600 hover:bg-brand-700 text-white w-full shadow-md hover:shadow-lg transition-all duration-300">
                        Read Article
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link to="/blog">
                <Button variant="outline" className="border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white px-6 py-4 shadow-md hover:shadow-lg transition-all duration-300">
                  View All Articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
