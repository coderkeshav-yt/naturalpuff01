
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ShoppingBag, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-14 w-14 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-7xl font-bold text-brand-800 mb-4 font-playfair">404</h1>
        <p className="text-2xl text-gray-700 mb-4">Oops! Page not found</p>
        
        <p className="text-gray-600 mb-8">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            asChild
            className="bg-brand-600 hover:bg-brand-700 w-full sm:w-auto flex items-center"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline"
            className="w-full sm:w-auto flex items-center"
          >
            <Link to="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>
        
        <Button 
          variant="link" 
          className="mt-6 text-gray-500"
          onClick={handleGoBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
