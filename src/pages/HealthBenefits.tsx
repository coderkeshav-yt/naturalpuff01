import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Brain, 
  Apple, 
  Utensils, 
  BarChart, 
  ThumbsUp,
  Moon,
  BookOpen
} from 'lucide-react';

// Placeholder image
const healthHeroImage = '/placeholder.svg';
const healthImage = "https://res.cloudinary.com/dlvxjnycr/image/upload/v1746679446/benifit_siynq2.jpg";

const HealthBenefits = () => {
  const benefits = [
    {
      id: 1,
      title: "Heart Health",
      description: "Makhana contains magnesium which helps maintain heart rhythm and potassium that helps regulate blood pressure.",
      icon: Heart
    },
    {
      id: 2,
      title: "Brain Function",
      description: "Rich in thiamine which helps convert carbohydrates into energy, supporting proper brain and nervous system function.",
      icon: Brain
    },
    {
      id: 3,
      title: "Low Glycemic Index",
      description: "Makhana has a low glycemic index, making it a suitable snack for those monitoring blood sugar levels.",
      icon: BarChart
    },
    {
      id: 4,
      title: "Weight Management",
      description: "High in protein and fiber while being low in calories, making it perfect for weight-conscious individuals.",
      icon: Apple
    },
    {
      id: 5,
      title: "Digestive Health",
      description: "The fiber content in makhana aids digestion and helps maintain gut health.",
      icon: Utensils
    },
    {
      id: 6,
      title: "Anti-inflammatory",
      description: "Contains antioxidants that help reduce inflammation and fight oxidative stress in the body.",
      icon: ThumbsUp
    },
    {
      id: 7,
      title: "Better Sleep",
      description: "Contains magnesium which can help improve sleep quality by promoting relaxation.",
      icon: Moon
    },
    {
      id: 8,
      title: "Ayurvedic Significance",
      description: "Traditionally used in Ayurvedic medicine for its cooling properties and health benefits.",
      icon: BookOpen
    }
  ];

  const nutritionalFacts = [
    { name: "Protein", value: "9.7g", percentage: "19%" },
    { name: "Fiber", value: "14.5g", percentage: "58%" },
    { name: "Calcium", value: "84mg", percentage: "8%" },
    { name: "Iron", value: "1.4mg", percentage: "7%" },
    { name: "Magnesium", value: "67mg", percentage: "16%" },
    { name: "Potassium", value: "332mg", percentage: "7%" },
    { name: "Zinc", value: "0.8mg", percentage: "5%" },
    { name: "Phosphorus", value: "289mg", percentage: "29%" }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-cream-100 py-16 md:py-24">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-brand-800 font-playfair">Health Benefits of Makhana</h1>
              <div className="w-24 h-1 bg-gold-500 mb-8"></div>
              <p className="text-lg md:text-xl text-brand-700 mb-8">
                Discover why fox nuts (makhana) are gaining popularity as a superfood and how they 
                can contribute to your overall health and wellbeing.
              </p>
              <Link to="/products">
                <Button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-6 text-lg">
                  Try Our Healthy Snacks
                </Button>
              </Link>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img 
                  src={healthImage} 
                  alt="Health Benefits of Makhana" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Makhana */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">What is Makhana?</h2>
            <div className="w-20 h-1 bg-gold-500 mx-auto mb-6"></div>
            <p className="text-lg text-brand-700">
              Makhana, also known as fox nuts or lotus seeds, are the popped seeds of the Euryale ferox plant, 
              which grows primarily in the wetlands of eastern India and parts of eastern Asia. These aquatic plants 
              produce seeds that, when processed and roasted, transform into a light, crunchy snack.
            </p>
          </div>
          
          <div className="bg-cream-100 rounded-lg p-6 md:p-8">
            <h3 className="text-2xl font-bold mb-4 text-center font-playfair">Did You Know?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-brand-700">Makhana is one of the few plant foods that is a complete protein, meaning it contains all nine essential amino acids.</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-brand-700">In traditional Ayurveda, makhana is considered a sattvic food, meaning it promotes clarity, balance, and purity.</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-brand-700">Makhana cultivation is primarily done by small-scale farmers in Bihar, India, where it provides livelihood for thousands of families.</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-brand-700">Unlike many other nuts and seeds, makhana is naturally low in sodium and fat, making it an ideal snack for various dietary needs.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Health Benefits Grid */}
      <section className="section-padding bg-cream-200">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Key Health Benefits</h2>
            <div className="w-20 h-1 bg-gold-500 mx-auto mb-6"></div>
            <p className="text-lg text-brand-700">
              Makhana is not just delicious but also packed with nutrients that offer several health benefits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-brand-100 p-3 inline-flex rounded-full mb-4">
                  <benefit.icon className="h-8 w-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-playfair">{benefit.title}</h3>
                <p className="text-brand-700">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nutritional Information */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Nutritional Profile</h2>
              <div className="w-20 h-1 bg-gold-500 mx-auto mb-6"></div>
              <p className="text-lg text-brand-700">
                Makhana is nutrient-dense and offers an impressive nutritional profile.
                Here's what you get in a 100g serving:
              </p>
            </div>

            <div className="bg-cream-100 rounded-lg overflow-hidden shadow-md">
              <div className="bg-brand-600 text-white py-4 px-6">
                <h3 className="text-xl font-bold">Nutritional Facts</h3>
                <p>Per 100g serving</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {nutritionalFacts.map((item, index) => (
                    <div key={index} className="flex justify-between border-b border-brand-200 py-2">
                      <span className="font-medium">{item.name}</span>
                      <div>
                        <span className="mr-2">{item.value}</span>
                        <span className="text-sm text-brand-600">{item.percentage}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-brand-700">
                  * Percent Daily Values are based on a 2,000 calorie diet.
                </p>
              </div>
            </div>

            <div className="mt-12 bg-brand-100 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 font-playfair">Additional Nutritional Benefits</h3>
              <p className="text-brand-700 mb-4">
                In addition to the nutrients listed above, makhana also contains:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-brand-700">Flavonoids and other antioxidants that help combat oxidative stress</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-brand-700">Low glycemic index, making it suitable for those with diabetes</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-brand-700">Naturally gluten-free and suitable for those with celiac disease</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-brand-700">Very low sodium content, ideal for those monitoring salt intake</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Incorporate */}
      <section className="section-padding bg-cream-100">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">How to Incorporate Makhana</h2>
            <div className="w-20 h-1 bg-gold-500 mx-auto mb-6"></div>
            <p className="text-lg text-brand-700">
              Beyond enjoying our flavored makhana snacks, here are some creative ways to incorporate makhana into your daily diet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 font-playfair">Morning Boost</h3>
              <p className="text-brand-700 mb-4">
                Add crushed makhana to your morning smoothie bowl or yogurt for extra protein and a satisfying crunch.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 font-playfair">Soup Topper</h3>
              <p className="text-brand-700 mb-4">
                Use plain roasted makhana as a healthy alternative to croutons in soups and salads.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 font-playfair">Trail Mix</h3>
              <p className="text-brand-700 mb-4">
                Create your own trail mix by combining makhana with dried fruits, nuts, and seeds for an energy-packed snack.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/products">
              <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                Explore Our Makhana Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Expert Opinion */}
      <section className="section-padding bg-brand-600 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Expert Opinion</h2>
            <div className="w-20 h-1 bg-gold-500 mx-auto mb-8"></div>
            <blockquote className="text-lg italic mb-8">
              "Makhana stands out among snack foods for its exceptional nutritional profile. Rich in protein, 
              low in fat, and containing essential minerals, it's one of the few snacks I wholeheartedly 
              recommend to patients looking for healthier alternatives that don't compromise on taste or satisfaction."
            </blockquote>
            <p className="font-bold text-xl">Dr. Anjali Sharma</p>
            <p className="text-cream-200">Nutritionist & Wellness Expert</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-cream-200">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Frequently Asked Questions</h2>
              <div className="w-20 h-1 bg-gold-500 mx-auto mb-6"></div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2 font-playfair">Are makhana and lotus seeds the same thing?</h3>
                <p className="text-brand-700">
                  Yes, makhana is the common name for lotus seeds or fox nuts. They come from the Euryale ferox plant, 
                  which is related to but different from the lotus plant (Nelumbo nucifera).
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2 font-playfair">Is makhana suitable for all diets?</h3>
                <p className="text-brand-700">
                  Makhana is naturally gluten-free, vegan, and low in fat, making it suitable for most dietary restrictions. 
                  It's also low on the glycemic index, making it appropriate for those monitoring blood sugar levels.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2 font-playfair">How is makhana different from popcorn?</h3>
                <p className="text-brand-700">
                  While both are light and crunchy snacks, makhana has a higher protein content, lower calories, 
                  and more minerals than popcorn. Makhana also doesn't have the tough hulls that can get caught in teeth.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2 font-playfair">Can children eat makhana?</h3>
                <p className="text-brand-700">
                  Yes, makhana is an excellent snack for children. It's nutritious, easy to digest, and the soft texture makes 
                  it appropriate even for younger children. Always supervise young children while eating any snack to prevent choking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair">Experience the Goodness of Makhana</h2>
            <p className="text-lg text-brand-700 mb-8">
              Ready to add this nutritional powerhouse to your snacking routine? 
              Explore our range of delicious, premium makhana snacks.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/products">
                <Button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-6 text-lg">
                  Shop Now
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white px-8 py-6 text-lg">
                  Ask Us Questions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HealthBenefits;
