import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/components/layout/AdminLayout';
import ShiprocketManager from '@/components/admin/ShiprocketManager';
import ShiprocketConfig from '@/components/admin/ShiprocketConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ShiprocketAdmin = () => {
  const [activeTab, setActiveTab] = useState('shipments');
  const { isAdmin } = useAuth();

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shiprocket Management</h1>
            <p className="text-muted-foreground">
              Manage orders, shipments, and configure Shiprocket integration
            </p>
          </div>
          
          <Separator />
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="shipments">Shipments</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shipments" className="space-y-4">
              <ShiprocketManager />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <ShiprocketConfig />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShiprocketAdmin;
