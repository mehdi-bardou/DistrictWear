/** Hand-maintained mirror of db/migrations/*.sql. Regenerate if Supabase CLI is added. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** PostgREST requires a Relationships key on every table; we declare no joins. */
type WithRelationships<Tables> = {
  [Name in keyof Tables]: Tables[Name] & { Relationships: [] };
};

export type Database = {
  public: {
    Tables: WithRelationships<{
      profiles: {
        Row: {
          id: string;
          email: string;
          role: "customer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name_fr?: string;
          name_ar?: string;
          name_en?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      collections: {
        Row: {
          id: string;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          description_fr: string | null;
          description_ar: string | null;
          description_en: string | null;
          cover_image: string | null;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          description_fr?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          cover_image?: string | null;
          is_published?: boolean;
          sort_order?: number;
        };
        Update: {
          slug?: string;
          name_fr?: string;
          name_ar?: string;
          name_en?: string;
          description_fr?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          cover_image?: string | null;
          is_published?: boolean;
          sort_order?: number;
        };
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          description_fr: string | null;
          description_ar: string | null;
          description_en: string | null;
          category_id: string | null;
          collection_id: string | null;
          is_published: boolean;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          description_fr?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          category_id?: string | null;
          collection_id?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          sort_order?: number;
        };
        Update: {
          slug?: string;
          name_fr?: string;
          name_ar?: string;
          name_en?: string;
          description_fr?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          category_id?: string | null;
          collection_id?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          sort_order?: number;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          color: string;
          color_en: string | null;
          color_ar: string | null;
          size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
          price: number;
          stock: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          color: string;
          color_en?: string | null;
          color_ar?: string | null;
          size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
          price: number;
          stock?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          sku?: string;
          color?: string;
          color_en?: string | null;
          color_ar?: string | null;
          size?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
          price?: number;
          stock?: number;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string | null;
          external_url: string | null;
          alt_fr: string | null;
          alt_ar: string | null;
          alt_en: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path?: string | null;
          external_url?: string | null;
          alt_fr?: string | null;
          alt_ar?: string | null;
          alt_en?: string | null;
          sort_order?: number;
        };
        Update: {
          storage_path?: string | null;
          external_url?: string | null;
          alt_fr?: string | null;
          alt_ar?: string | null;
          alt_en?: string | null;
          sort_order?: number;
        };
      };
      settings: {
        Row: {
          id: boolean;
          whatsapp_number: string;
          contact_email: string | null;
          instagram_url: string | null;
          inquiry_logging_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          whatsapp_number?: string;
          contact_email?: string | null;
          instagram_url?: string | null;
          inquiry_logging_enabled?: boolean;
        };
        Update: {
          whatsapp_number?: string;
          contact_email?: string | null;
          instagram_url?: string | null;
          inquiry_logging_enabled?: boolean;
        };
      };
      inquiries: {
        Row: {
          id: string;
          reference: string;
          locale: "fr" | "ar" | "en";
          message: string;
          items: Json;
          total: number;
          customer_phone: string | null;
          status: "logged" | "followed_up" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          reference: string;
          locale: "fr" | "ar" | "en";
          message: string;
          items?: Json;
          total?: number;
          customer_phone?: string | null;
          status?: "logged" | "followed_up" | "closed";
        };
        Update: {
          status?: "logged" | "followed_up" | "closed";
        };
      };
      inquiry_attempts: {
        Row: {
          key: string;
          window_start: string;
          attempt_count: number;
        };
        Insert: {
          key: string;
          window_start?: string;
          attempt_count?: number;
        };
        Update: {
          window_start?: string;
          attempt_count?: number;
        };
      };
    }>;
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      handle_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      try_log_inquiry: {
        Args: {
          p_reference: string;
          p_locale: string;
          p_message: string;
          p_items: Json;
          p_total: number;
          p_customer_phone: string;
          p_key: string;
        };
        Returns: string | null;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];
export type Locale = "fr" | "ar" | "en";
