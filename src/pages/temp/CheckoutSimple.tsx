import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Checkout = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Simple Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a simplified checkout page to debug rendering issues.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkout;
