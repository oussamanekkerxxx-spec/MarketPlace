// Placeholder: replace with generated types from Supabase
// Run: npx supabase gen types typescript --project-id <ref> --schema public > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          title_fr: string;
          title_en: string;
          title_ar: string;
          short_description_fr: string | null;
          short_description_en: string | null;
          short_description_ar: string | null;
          description_fr: string | null;
          description_en: string | null;
          description_ar: string | null;
          price: number;
          compare_at_price: number | null;
          currency: string;
          category_id: string | null;
          sku: string | null;
          stock_quantity: number;
          track_inventory: boolean;
          low_stock_threshold: number;
          is_active: boolean;
          is_featured: boolean;
          attributes: Json;
          meta_title_fr: string | null;
          meta_title_en: string | null;
          meta_title_ar: string | null;
          meta_description_fr: string | null;
          meta_description_en: string | null;
          meta_description_ar: string | null;
          total_orders: number;
          total_revenue: number;
          view_count: number;
          detail_sections: Json;
          product_row_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_fr: string;
          name_en: string;
          name_ar: string;
          description_fr: string | null;
          description_en: string | null;
          description_ar: string | null;
          image_url: string | null;
          parent_id: string | null;
          display_order: number;
          is_active: boolean;
          meta_title_fr: string | null;
          meta_title_en: string | null;
          meta_title_ar: string | null;
          meta_description_fr: string | null;
          meta_description_en: string | null;
          meta_description_ar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      product_rows: {
        Row: {
          id: string;
          slug: string;
          title_fr: string;
          title_en: string | null;
          title_ar: string | null;
          subtitle_fr: string | null;
          subtitle_en: string | null;
          subtitle_ar: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_city_id: string | null;
          customer_city_name: string;
          customer_address: string | null;
          customer_notes: string | null;
          status: string;
          subtotal: number;
          shipping_fee: number;
          total: number;
          currency: string;
          admin_notes: string | null;
          assigned_to: string | null;
          source: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          referrer: string | null;
          ip_address: string | null;
          user_agent: string | null;
          locale: string;
          confirmed_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          returned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_title_snapshot: string;
          product_image_snapshot: string | null;
          product_slug_snapshot: string | null;
          unit_price_at_order: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      cities: {
        Row: {
          id: string;
          name_fr: string;
          name_en: string;
          name_ar: string;
          shipping_fee: number;
          estimated_days: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'manager';
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      site_settings: {
        Row: {
          id: number;
          site_name: string;
          site_tagline_fr: string | null;
          site_tagline_en: string | null;
          site_tagline_ar: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          contact_email: string | null;
          contact_phone: string | null;
          whatsapp_number: string | null;
          business_address: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          telegram_url: string | null;
          youtube_url: string | null;
          telegram_bot_token: string | null;
          telegram_chat_id: string | null;
          notification_email: string | null;
          meta_pixel_id: string | null;
          meta_capi_access_token: string | null;
          meta_dataset_id: string | null;
          google_analytics_id: string | null;
          google_ads_id: string | null;
          tiktok_pixel_id: string | null;
          default_currency: string;
          default_locale: string;
          thank_you_message_fr: string | null;
          thank_you_message_en: string | null;
          thank_you_message_ar: string | null;
          cod_badge_fr: string | null;
          cod_badge_en: string | null;
          cod_badge_ar: string | null;
          // Announcement bar
          announcement_enabled: boolean;
          announcement_text_fr: string | null;
          announcement_text_en: string | null;
          announcement_text_ar: string | null;
          // Hero section
          hero_eyebrow_fr: string | null;
          hero_eyebrow_en: string | null;
          hero_eyebrow_ar: string | null;
          hero_title_accent_fr: string | null;
          hero_title_accent_en: string | null;
          hero_title_accent_ar: string | null;
          hero_title_main_fr: string | null;
          hero_title_main_en: string | null;
          hero_title_main_ar: string | null;
          hero_subtitle_fr: string | null;
          hero_subtitle_en: string | null;
          hero_subtitle_ar: string | null;
          // Trust strip
          trust_1_title_fr: string | null;
          trust_1_title_en: string | null;
          trust_1_title_ar: string | null;
          trust_1_sub_fr: string | null;
          trust_1_sub_en: string | null;
          trust_1_sub_ar: string | null;
          trust_2_title_fr: string | null;
          trust_2_title_en: string | null;
          trust_2_title_ar: string | null;
          trust_2_sub_fr: string | null;
          trust_2_sub_en: string | null;
          trust_2_sub_ar: string | null;
          trust_3_title_fr: string | null;
          trust_3_title_en: string | null;
          trust_3_title_ar: string | null;
          trust_3_sub_fr: string | null;
          trust_3_sub_en: string | null;
          trust_3_sub_ar: string | null;
          // Featured section
          featured_section_title_fr: string | null;
          featured_section_title_en: string | null;
          featured_section_title_ar: string | null;
          featured_section_subtitle_fr: string | null;
          featured_section_subtitle_en: string | null;
          featured_section_subtitle_ar: string | null;
          why_us_title_fr: string | null;
          why_us_title_en: string | null;
          why_us_title_ar: string | null;
          why_us_sub_fr: string | null;
          why_us_sub_en: string | null;
          why_us_sub_ar: string | null;
          footer_description_fr: string | null;
          footer_description_en: string | null;
          footer_description_ar: string | null;
          whatsapp_default_message_fr: string | null;
          whatsapp_default_message_en: string | null;
          whatsapp_default_message_ar: string | null;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      why_us_items: {
        Row: {
          id: string;
          display_order: number;
          number_label_fr: string;
          number_label_en: string | null;
          number_label_ar: string | null;
          title_fr: string;
          title_en: string | null;
          title_ar: string | null;
          text_fr: string;
          text_en: string | null;
          text_ar: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      hero_images: {
        Row: {
          id: string;
          url: string;
          alt_text: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      pixel_events: {
        Row: {
          id: string;
          event_name: string;
          event_id: string;
          product_id: string | null;
          order_id: string | null;
          payload: Json;
          sent_to_meta: boolean;
          meta_response: Json | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
