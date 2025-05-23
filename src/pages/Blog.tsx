
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Placeholder blog images
const blogImages = Array(6).fill('/placeholder.svg');

const Blog = () => {
  // Mock blog data - this would come from Supabase in a real implementation
  const blogs = [
    {
      id: 1,
      title: "The Ancient History of Makhana and Its Cultural Significance",
      slug: "ancient-history-makhana-cultural-significance",
      content: "Explore the rich history of makhana dating back thousands of years and its importance in various cultural traditions.",
      image_url: blogImages[0],
      created_at: "2023-08-15"
    },
    {
      id: 2,
      title: "5 Creative Recipes Using Makhana You Need to Try",
      slug: "creative-recipes-using-makhana",
      content: "Move beyond simple roasted makhana with these innovative recipes that transform this humble ingredient into gourmet dishes.",
      image_url: blogImages[1],
      created_at: "2023-09-10"
    },
    {
      id: 3,
      title: "Makhana vs. Popcorn: Which is the Healthier Snack?",
      slug: "makhana-vs-popcorn-healthier-snack",
      content: "A detailed nutritional comparison between these two popular snacks to help you make informed choices for your health.",
      image_url: blogImages[2],
      created_at: "2023-10-05"
    },
    {
      id: 4,
      title: "How Makhana Cultivation Is Supporting Rural Communities",
      slug: "makhana-cultivation-supporting-rural-communities",
      content: "Discover how the cultivation of makhana is providing sustainable livelihoods for farming communities in Bihar, India.",
      image_url: blogImages[3],
      created_at: "2023-11-20"
    },
    {
      id: 5,
      title: "The Science Behind Makhana's Health Benefits",
      slug: "science-behind-makhana-health-benefits",
      content: "A deep dive into the research and scientific evidence supporting the various health claims of makhana consumption.",
      image_url: blogImages[4],
      created_at: "2023-12-15"
    },
    {
      id: 6,
      title: "Seasonal Flavors: Limited Edition Makhana Creations",
      slug: "seasonal-flavors-limited-edition-makhana",
      content: "Introducing our special seasonal flavors and the inspiration behind these limited edition makhana snacks.",
      image_url: blogImages[5],
      created_at: "2024-01-08"
    }
  ];

  // Format date function
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-cream-100 py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-brand-800 font-playfair">Our Blog</h1>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-brand-700">
              Discover insights, recipes, and stories from the world of makhana and healthy snacking.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="section-padding bg-cream-200">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-56 overflow-hidden">
                  <img 
                    src={blog.image_url} 
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-brand-600 mb-2">
                    {formatDate(blog.created_at)}
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-playfair line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-brand-700 mb-4 line-clamp-3">
                    {blog.content}
                  </p>
                  <Link to={`/blog/${blog.slug}`}>
                    <Button className="bg-brand-600 hover:bg-brand-700 text-white w-full">
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - Simplified version */}
          <div className="mt-12 flex justify-center">
            <div className="flex space-x-2">
              <Button variant="outline" className="border-brand-600 text-brand-600" disabled>
                Previous
              </Button>
              <Button className="bg-brand-600 text-white">1</Button>
              <Button variant="outline" className="border-brand-600 text-brand-600">2</Button>
              <Button variant="outline" className="border-brand-600 text-brand-600">
                Next
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-padding bg-brand-600 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Subscribe for Updates</h2>
            <p className="text-lg mb-8">
              Stay informed with our latest blog posts, recipes, and exclusive product announcements.
            </p>
            <div className="max-w-md mx-auto">
              <form className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="px-4 py-2 rounded-md flex-grow"
                  required
                />
                <Button className="bg-gold-500 hover:bg-gold-600 text-brand-800 whitespace-nowrap">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center font-playfair">Explore Topics</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                Health Benefits
              </Button>
              <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                Recipes
              </Button>
              <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                Nutrition
              </Button>
              <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                Sustainable Farming
              </Button>
              <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                Product Insights
              </Button>
              <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                Wellness
              </Button>
              <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white">
                Indian Culture
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
