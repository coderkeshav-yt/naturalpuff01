
// Helper function to get the Shiprocket token
export async function getShiprocketToken(
  email: string,
  password: string
): Promise<string> {
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Shiprocket authentication error:', error);
    throw new Error('Failed to authenticate with Shiprocket');
  }

  const data = await response.json();  
  return data.token;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
