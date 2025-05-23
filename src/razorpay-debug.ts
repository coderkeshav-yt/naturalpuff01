// This is a debug script to properly load Razorpay
// It directly tests if the Razorpay SDK can be loaded in your environment

export const debugRazorpay = async () => {
  console.log('==== RAZORPAY DEBUG START ====');
  console.log('Testing Razorpay script loading...');
  
  try {
    // First check if Razorpay is already defined in window
    if (typeof window !== 'undefined' && window.Razorpay) {
      console.log('✅ Razorpay already loaded in window object');
    } else {
      console.log('Razorpay not found in window object, trying to load script...');
      
      // Create a script element
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      // Define load and error handlers
      const loadPromise = new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('✅ Razorpay script loaded successfully');
          resolve(true);
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load Razorpay script');
          reject(new Error('Failed to load Razorpay script'));
        };
      });
      
      // Add the script to the document
      document.body.appendChild(script);
      
      // Wait for load or error
      await loadPromise;
      
      // Check if Razorpay is defined after script load
      if (typeof window !== 'undefined' && window.Razorpay) {
        console.log('✅ Razorpay object available after script load');
      } else {
        console.error('❌ Razorpay object not available after script load');
        throw new Error('Razorpay object not available after script load');
      }
    }
    
    // Test creating a Razorpay instance
    console.log('Testing Razorpay instance creation...');
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    console.log(`Using key: ${key ? '✅ Key found (hidden)' : '❌ Key not found'}`);
    
    if (!key) {
      throw new Error('VITE_RAZORPAY_KEY_ID environment variable not found');
    }
    
    // Create dummy options for testing
    const testOptions = {
      key: key,
      amount: 100,
      currency: 'INR',
      name: 'Test',
      description: 'Test Transaction',
      order_id: 'test_order_id',
      prefill: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '9999999999'
      }
    };
    
    try {
      // Only create the instance, don't open it
      const razorpayInstance = new window.Razorpay(testOptions);
      console.log('✅ Razorpay instance created successfully');
      
      // Test if razorpayInstance has open method
      if (typeof razorpayInstance.open === 'function') {
        console.log('✅ Razorpay instance has open method');
      } else {
        console.error('❌ Razorpay instance does not have open method');
      }
      
      // Clean up by removing any event listeners
      // We don't need to call open() for this test
    } catch (instanceError) {
      console.error('❌ Failed to create Razorpay instance', instanceError);
      throw instanceError;
    }
    
    console.log('==== RAZORPAY DEBUG COMPLETE ====');
    return true;
  } catch (error) {
    console.error('==== RAZORPAY DEBUG FAILED ====', error);
    return false;
  }
};
