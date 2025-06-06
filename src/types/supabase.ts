// Custom database type definitions for Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sales_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          location: string | null;
          order_size: string | null;
          message: string;
          created_at: string;
          responded: boolean;
          responded_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          location?: string | null;
          order_size?: string | null;
          message: string;
          created_at?: string;
          responded?: boolean;
          responded_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          location?: string | null;
          order_size?: string | null;
          message?: string;
          created_at?: string;
          responded?: boolean;
          responded_at?: string | null;
          notes?: string | null;
        };
      };
      // Add existing tables from the database schema
      coupons: any;
      marketing_offers: any;
      order_items: any;
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          created_at: string;
          updated_at: string;
          order_items: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          order_items?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          order_items?: Json;
        };
      };
      products: any;
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string | null;
        };
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: number;
          user_id: string;
          order_id: string | null;
          rating: number;
          review_text: string | null;
          helpful_votes: number;
          verified_purchase: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: number;
          user_id: string;
          order_id?: string | null;
          rating: number;
          review_text?: string | null;
          helpful_votes?: number;
          verified_purchase?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: number;
          user_id?: string;
          order_id?: string | null;
          rating?: number;
          review_text?: string | null;
          helpful_votes?: number;
          verified_purchase?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
