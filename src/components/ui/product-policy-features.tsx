import React from 'react';
import { Truck, RefreshCcw, CreditCard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PolicyFeatureProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

const PolicyFeature: React.FC<PolicyFeatureProps> = ({ icon, title, description, className }) => {
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm",
      className
    )}>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  );
};

export const ProductPolicyFeatures: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-brand-50/20 rounded-xl p-5 mt-6 border border-gray-100 shadow-sm">
      <h3 className="text-center text-brand-800 font-semibold mb-4 text-lg">Premium Shopping Experience</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PolicyFeature 
          icon={<Truck size={18} />} 
          title="Free Premium Delivery" 
          description="On orders above ₹599"
        />
        <PolicyFeature 
          icon={<RefreshCcw size={18} />} 
          title="7 Day Hassle-Free Returns" 
          description="No questions asked"
        />
        <PolicyFeature 
          icon={<CreditCard size={18} />} 
          title="Cash on Delivery" 
          description="Available on all orders"
        />
        <PolicyFeature 
          icon={<Shield size={18} />} 
          title="100% Authentic Products" 
          description="Quality guaranteed"
        />
      </div>
      <div className="text-center mt-4 text-xs text-gray-500">
        Experience the NaturalPuff difference with our premium customer service
      </div>
    </div>
  );
};
