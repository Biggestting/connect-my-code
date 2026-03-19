export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addon_size_options: {
        Row: {
          addon_id: string
          created_at: string
          id: string
          inventory_quantity: number | null
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          addon_id: string
          created_at?: string
          id?: string
          inventory_quantity?: number | null
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          addon_id?: string
          created_at?: string
          id?: string
          inventory_quantity?: number | null
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_size_options_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "product_addons"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      band_sections: {
        Row: {
          band_id: string
          created_at: string
          description: string | null
          id: string
          inventory_limit: number | null
          launch_at: string | null
          name: string
          section_gender: string
          section_image: string | null
        }
        Insert: {
          band_id: string
          created_at?: string
          description?: string | null
          id?: string
          inventory_limit?: number | null
          launch_at?: string | null
          name: string
          section_gender?: string
          section_image?: string | null
        }
        Update: {
          band_id?: string
          created_at?: string
          description?: string | null
          id?: string
          inventory_limit?: number | null
          launch_at?: string | null
          name?: string
          section_gender?: string
          section_image?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "band_sections_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          carnival_id: string | null
          carnival_year: number | null
          cover_image: string | null
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          listing_mode: string
          logo_url: string | null
          name: string
          organizer_id: string
        }
        Insert: {
          carnival_id?: string | null
          carnival_year?: number | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          listing_mode?: string
          logo_url?: string | null
          name: string
          organizer_id: string
        }
        Update: {
          carnival_id?: string | null
          carnival_year?: number | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          listing_mode?: string
          logo_url?: string | null
          name?: string
          organizer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bands_carnival_id_fkey"
            columns: ["carnival_id"]
            isOneToOne: false
            referencedRelation: "carnivals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bands_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bands_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      carnival_seasons: {
        Row: {
          carnival_id: string
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
          year: number
        }
        Insert: {
          carnival_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          year: number
        }
        Update: {
          carnival_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "carnival_seasons_carnival_id_fkey"
            columns: ["carnival_id"]
            isOneToOne: false
            referencedRelation: "carnivals"
            referencedColumns: ["id"]
          },
        ]
      }
      carnivals: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      checkout_queue: {
        Row: {
          admitted_at: string | null
          checkout_token: string | null
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          joined_at: string
          position: number
          status: string
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          admitted_at?: string | null
          checkout_token?: string | null
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          joined_at?: string
          position?: number
          status?: string
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          admitted_at?: string | null
          checkout_token?: string | null
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          joined_at?: string
          position?: number
          status?: string
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      costume_pickup: {
        Row: {
          id: string
          pickup_date: string | null
          pickup_instructions: string | null
          pickup_location: string | null
          product_id: string
        }
        Insert: {
          id?: string
          pickup_date?: string | null
          pickup_instructions?: string | null
          pickup_location?: string | null
          product_id: string
        }
        Update: {
          id?: string
          pickup_date?: string | null
          pickup_instructions?: string | null
          pickup_location?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "costume_pickup_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "costume_products"
            referencedColumns: ["id"]
          },
        ]
      }
      costume_products: {
        Row: {
          balance_due_date: string | null
          created_at: string
          currency: string
          deposit_amount: number | null
          description: string | null
          gender: string | null
          id: string
          image_gallery: string[] | null
          inventory_quantity: number
          inventory_sold: number
          price: number
          section_id: string
          size_options: string[] | null
          status: string
          title: string
        }
        Insert: {
          balance_due_date?: string | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          description?: string | null
          gender?: string | null
          id?: string
          image_gallery?: string[] | null
          inventory_quantity?: number
          inventory_sold?: number
          price: number
          section_id: string
          size_options?: string[] | null
          status?: string
          title: string
        }
        Update: {
          balance_due_date?: string | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          description?: string | null
          gender?: string | null
          id?: string
          image_gallery?: string[] | null
          inventory_quantity?: number
          inventory_sold?: number
          price?: number
          section_id?: string
          size_options?: string[] | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "costume_products_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "band_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_fields: {
        Row: {
          created_at: string
          field_label: string
          field_type: string
          id: string
          jouvert_package_id: string | null
          options: string[] | null
          product_id: string | null
          required: boolean
          section_version_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_label: string
          field_type?: string
          id?: string
          jouvert_package_id?: string | null
          options?: string[] | null
          product_id?: string | null
          required?: boolean
          section_version_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_label?: string
          field_type?: string
          id?: string
          jouvert_package_id?: string | null
          options?: string[] | null
          product_id?: string | null
          required?: boolean
          section_version_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "customization_fields_jouvert_package_id_fkey"
            columns: ["jouvert_package_id"]
            isOneToOne: false
            referencedRelation: "jouvert_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "costume_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_fields_section_version_id_fkey"
            columns: ["section_version_id"]
            isOneToOne: false
            referencedRelation: "section_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_agenda: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          sort_order: number
          time: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          sort_order?: number
          time: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          sort_order?: number
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_lineup: {
        Row: {
          artist_name: string
          created_at: string
          event_id: string
          id: string
          image_url: string | null
          sort_order: number
        }
        Insert: {
          artist_name: string
          created_at?: string
          event_id: string
          id?: string
          image_url?: string | null
          sort_order?: number
        }
        Update: {
          artist_name?: string
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_lineup_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_promoters: {
        Row: {
          created_at: string
          event_id: string
          id: string
          promoter_id: string
          referral_code: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          promoter_id: string
          referral_code: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          promoter_id?: string
          referral_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_promoters_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          carnival_id: string | null
          carnival_year: number | null
          category: string
          city: string | null
          country: string | null
          created_at: string
          date: string
          description: string | null
          editing_at: string | null
          editing_by: string | null
          end_date: string | null
          enforce_ticket_limit: boolean
          has_agenda: boolean
          has_lineup: boolean
          hidden: boolean
          highlights: string[] | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          max_tickets_per_user: number
          min_ticket_price: number | null
          organizer_id: string
          price: number | null
          publish_at: string | null
          publishing_status: string
          sales_status: string
          state: string | null
          tags: string[] | null
          ticket_sales_start_at: string | null
          title: string
          updated_at: string
          venue: string | null
          venue_notes: string[] | null
        }
        Insert: {
          address?: string | null
          carnival_id?: string | null
          carnival_year?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          date: string
          description?: string | null
          editing_at?: string | null
          editing_by?: string | null
          end_date?: string | null
          enforce_ticket_limit?: boolean
          has_agenda?: boolean
          has_lineup?: boolean
          hidden?: boolean
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          max_tickets_per_user?: number
          min_ticket_price?: number | null
          organizer_id: string
          price?: number | null
          publish_at?: string | null
          publishing_status?: string
          sales_status?: string
          state?: string | null
          tags?: string[] | null
          ticket_sales_start_at?: string | null
          title: string
          updated_at?: string
          venue?: string | null
          venue_notes?: string[] | null
        }
        Update: {
          address?: string | null
          carnival_id?: string | null
          carnival_year?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          date?: string
          description?: string | null
          editing_at?: string | null
          editing_by?: string | null
          end_date?: string | null
          enforce_ticket_limit?: boolean
          has_agenda?: boolean
          has_lineup?: boolean
          hidden?: boolean
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          max_tickets_per_user?: number
          min_ticket_price?: number | null
          organizer_id?: string
          price?: number | null
          publish_at?: string | null
          publishing_status?: string
          sales_status?: string
          state?: string | null
          tags?: string[] | null
          ticket_sales_start_at?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
          venue_notes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_carnival_id_fkey"
            columns: ["carnival_id"]
            isOneToOne: false
            referencedRelation: "carnivals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          reason: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          reason: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_reservations: {
        Row: {
          costume_product_id: string | null
          created_at: string
          event_id: string
          expires_at: string
          id: string
          jouvert_package_id: string | null
          product_type: string
          quantity: number
          reserved_at: string
          status: string
          ticket_tier_id: string | null
          user_id: string
        }
        Insert: {
          costume_product_id?: string | null
          created_at?: string
          event_id: string
          expires_at?: string
          id?: string
          jouvert_package_id?: string | null
          product_type?: string
          quantity?: number
          reserved_at?: string
          status?: string
          ticket_tier_id?: string | null
          user_id: string
        }
        Update: {
          costume_product_id?: string | null
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          jouvert_package_id?: string | null
          product_type?: string
          quantity?: number
          reserved_at?: string
          status?: string
          ticket_tier_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_costume_product_id_fkey"
            columns: ["costume_product_id"]
            isOneToOne: false
            referencedRelation: "costume_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_jouvert_package_id_fkey"
            columns: ["jouvert_package_id"]
            isOneToOne: false
            referencedRelation: "jouvert_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      jouvert_packages: {
        Row: {
          bundle_items: string[] | null
          carnival_id: string | null
          carnival_year: number | null
          created_at: string
          event_id: string | null
          id: string
          image_url: string | null
          listing_mode: string
          name: string
          price: number
          quantity: number
          sold_count: number
        }
        Insert: {
          bundle_items?: string[] | null
          carnival_id?: string | null
          carnival_year?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          listing_mode?: string
          name: string
          price: number
          quantity?: number
          sold_count?: number
        }
        Update: {
          bundle_items?: string[] | null
          carnival_id?: string | null
          carnival_year?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          listing_mode?: string
          name?: string
          price?: number
          quantity?: number
          sold_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "jouvert_packages_carnival_id_fkey"
            columns: ["carnival_id"]
            isOneToOne: false
            referencedRelation: "carnivals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jouvert_packages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          asking_price: number
          buyer_id: string | null
          created_at: string
          event_id: string
          id: string
          listing_type: string
          purchase_id: string
          seller_id: string
          status: string
          ticket_tier_id: string
          updated_at: string
        }
        Insert: {
          asking_price: number
          buyer_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          listing_type?: string
          purchase_id: string
          seller_id: string
          status?: string
          ticket_tier_id: string
          updated_at?: string
        }
        Update: {
          asking_price?: number
          buyer_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          listing_type?: string
          purchase_id?: string
          seller_id?: string
          status?: string
          ticket_tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_follows: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_follows_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_members: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_members_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_requests: {
        Row: {
          brand_name: string
          created_at: string
          event_types: string | null
          id: string
          instagram: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          username_requested: string
          website: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string
          event_types?: string | null
          id?: string
          instagram?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          username_requested: string
          website?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          event_types?: string | null
          id?: string
          instagram?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          username_requested?: string
          website?: string | null
        }
        Relationships: []
      }
      organizers: {
        Row: {
          bio: string | null
          created_at: string
          default_commission: number | null
          event_types: string[] | null
          events_count: number
          follower_count: number
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          slug: string
          status: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          updated_at: string
          user_id: string | null
          website: string | null
          years_hosting: number
        }
        Insert: {
          bio?: string | null
          created_at?: string
          default_commission?: number | null
          event_types?: string[] | null
          events_count?: number
          follower_count?: number
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          slug: string
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          updated_at?: string
          user_id?: string | null
          website?: string | null
          years_hosting?: number
        }
        Update: {
          bio?: string | null
          created_at?: string
          default_commission?: number | null
          event_types?: string[] | null
          events_count?: number
          follower_count?: number
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          updated_at?: string
          user_id?: string | null
          website?: string | null
          years_hosting?: number
        }
        Relationships: []
      }
      platform_announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          message: string
          title: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message: string
          title: string
          type?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_enabled: boolean
          created_at: string
          id: string
          item_id: string
          item_type: string
          target_price: number | null
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          id?: string
          item_id: string
          item_type?: string
          target_price?: number | null
          user_id: string
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          target_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      product_addons: {
        Row: {
          costume_product_id: string | null
          created_at: string
          description: string | null
          has_size_options: boolean
          id: string
          jouvert_package_id: string | null
          max_quantity: number
          name: string
          price: number
          sold_count: number
          sort_order: number
        }
        Insert: {
          costume_product_id?: string | null
          created_at?: string
          description?: string | null
          has_size_options?: boolean
          id?: string
          jouvert_package_id?: string | null
          max_quantity?: number
          name: string
          price?: number
          sold_count?: number
          sort_order?: number
        }
        Update: {
          costume_product_id?: string | null
          created_at?: string
          description?: string | null
          has_size_options?: boolean
          id?: string
          jouvert_package_id?: string | null
          max_quantity?: number
          name?: string
          price?: number
          sold_count?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_costume_product_id_fkey"
            columns: ["costume_product_id"]
            isOneToOne: false
            referencedRelation: "costume_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_addons_jouvert_package_id_fkey"
            columns: ["jouvert_package_id"]
            isOneToOne: false
            referencedRelation: "jouvert_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promoter_commissions: {
        Row: {
          commission_amount: number
          created_at: string
          event_id: string
          id: string
          paid_at: string | null
          promoter_id: string
          purchase_id: string
          status: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          event_id: string
          id?: string
          paid_at?: string | null
          promoter_id: string
          purchase_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          event_id?: string
          id?: string
          paid_at?: string | null
          promoter_id?: string
          purchase_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_commissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_commissions_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_commissions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_invite_tokens: {
        Row: {
          commission_percent: number
          created_at: string
          created_by: string
          event_id: string | null
          expires_at: string
          id: string
          organizer_id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          created_by: string
          event_id?: string | null
          expires_at?: string
          id?: string
          organizer_id: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          commission_percent?: number
          created_at?: string
          created_by?: string
          event_id?: string | null
          expires_at?: string
          id?: string
          organizer_id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_invite_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_invite_tokens_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_requests: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          message: string | null
          organizer_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string | null
          organizer_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string | null
          organizer_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_requests_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          active: boolean
          commission_percent: number
          created_at: string
          display_name: string
          id: string
          invite_status: string
          invited_email: string | null
          organizer_id: string
          promo_code: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          display_name: string
          id?: string
          invite_status?: string
          invited_email?: string | null
          organizer_id: string
          promo_code: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          display_name?: string
          id?: string
          invite_status?: string
          invited_email?: string | null
          organizer_id?: string
          promo_code?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoters_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_addons: {
        Row: {
          addon_id: string | null
          addon_name: string
          created_at: string
          id: string
          purchase_id: string
          quantity: number
          size_label: string | null
          size_value: string | null
          unit_price: number
        }
        Insert: {
          addon_id?: string | null
          addon_name: string
          created_at?: string
          id?: string
          purchase_id: string
          quantity?: number
          size_label?: string | null
          size_value?: string | null
          unit_price?: number
        }
        Update: {
          addon_id?: string | null
          addon_name?: string
          created_at?: string
          id?: string
          purchase_id?: string
          quantity?: number
          size_label?: string | null
          size_value?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "product_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_addons_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_attempts: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          event_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          event_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          event_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_attempts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number | null
          balance_remaining: number | null
          commission_rate: number | null
          costume_product_id: string | null
          created_at: string
          customization_responses: Json | null
          event_id: string
          id: string
          jouvert_package_id: string | null
          organizer_payout: number | null
          payment_intent_id: string | null
          platform_fee: number | null
          product_type: string
          promoter_id: string | null
          purchase_ip: string | null
          quantity: number
          redeemed: boolean
          referral_code: string | null
          selected_size: string | null
          status: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          terms_version: string | null
          ticket_tier_id: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          balance_remaining?: number | null
          commission_rate?: number | null
          costume_product_id?: string | null
          created_at?: string
          customization_responses?: Json | null
          event_id: string
          id?: string
          jouvert_package_id?: string | null
          organizer_payout?: number | null
          payment_intent_id?: string | null
          platform_fee?: number | null
          product_type?: string
          promoter_id?: string | null
          purchase_ip?: string | null
          quantity?: number
          redeemed?: boolean
          referral_code?: string | null
          selected_size?: string | null
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          ticket_tier_id?: string | null
          total_amount: number
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          balance_remaining?: number | null
          commission_rate?: number | null
          costume_product_id?: string | null
          created_at?: string
          customization_responses?: Json | null
          event_id?: string
          id?: string
          jouvert_package_id?: string | null
          organizer_payout?: number | null
          payment_intent_id?: string | null
          platform_fee?: number | null
          product_type?: string
          promoter_id?: string | null
          purchase_ip?: string | null
          quantity?: number
          redeemed?: boolean
          referral_code?: string | null
          selected_size?: string | null
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          ticket_tier_id?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_costume_product_id_fkey"
            columns: ["costume_product_id"]
            isOneToOne: false
            referencedRelation: "costume_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_jouvert_package_id_fkey"
            columns: ["jouvert_package_id"]
            isOneToOne: false
            referencedRelation: "jouvert_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          review_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          review_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          review_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rating: number
          text: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rating: number
          text?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          text?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      section_versions: {
        Row: {
          costume_structure: string
          created_at: string
          description: string | null
          id: string
          image_gallery: string[] | null
          inventory_quantity: number
          inventory_sold: number
          price: number
          section_id: string
          version_name: string
        }
        Insert: {
          costume_structure?: string
          created_at?: string
          description?: string | null
          id?: string
          image_gallery?: string[] | null
          inventory_quantity?: number
          inventory_sold?: number
          price: number
          section_id: string
          version_name: string
        }
        Update: {
          costume_structure?: string
          created_at?: string
          description?: string | null
          id?: string
          image_gallery?: string[] | null
          inventory_quantity?: number
          inventory_sold?: number
          price?: number
          section_id?: string
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_versions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "band_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          created_at: string
          enforce_limit: boolean
          event_id: string
          id: string
          limit_window_end: string | null
          limit_window_max: number | null
          limit_window_start: string | null
          max_per_user: number
          name: string
          price: number
          quantity: number
          sold_count: number
        }
        Insert: {
          created_at?: string
          enforce_limit?: boolean
          event_id: string
          id?: string
          limit_window_end?: string | null
          limit_window_max?: number | null
          limit_window_start?: string | null
          max_per_user?: number
          name: string
          price: number
          quantity?: number
          sold_count?: number
        }
        Update: {
          created_at?: string
          enforce_limit?: boolean
          event_id?: string
          id?: string
          limit_window_end?: string | null
          limit_window_max?: number | null
          limit_window_start?: string | null
          max_per_user?: number
          name?: string
          price?: number
          quantity?: number
          sold_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          claim_code: string | null
          claim_status: string
          created_at: string
          event_id: string
          fulfillment_type: string
          id: string
          owner_user_id: string
          parent_ticket_id: string | null
          purchase_id: string | null
          qr_token: string
          qr_token_expires_at: string
          resale_price: number | null
          resale_status: string | null
          scanned_at: string | null
          scanned_by: string | null
          status: string
          ticket_tier_id: string | null
          transfer_history: Json
          updated_at: string
        }
        Insert: {
          claim_code?: string | null
          claim_status?: string
          created_at?: string
          event_id: string
          fulfillment_type?: string
          id?: string
          owner_user_id: string
          parent_ticket_id?: string | null
          purchase_id?: string | null
          qr_token?: string
          qr_token_expires_at?: string
          resale_price?: number | null
          resale_status?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: string
          ticket_tier_id?: string | null
          transfer_history?: Json
          updated_at?: string
        }
        Update: {
          claim_code?: string | null
          claim_status?: string
          created_at?: string
          event_id?: string
          fulfillment_type?: string
          id?: string
          owner_user_id?: string
          parent_ticket_id?: string | null
          purchase_id?: string | null
          qr_token?: string
          qr_token_expires_at?: string
          resale_price?: number | null
          resale_status?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: string
          ticket_tier_id?: string | null
          transfer_history?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_parent_ticket_id_fkey"
            columns: ["parent_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admit_queue_batch: {
        Args: { _batch_size?: number; _event_id: string }
        Returns: number
      }
      auto_publish_scheduled_events: { Args: never; Returns: undefined }
      check_ticket_limit:
        | {
            Args: {
              _event_id: string
              _requested_quantity: number
              _user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _event_id: string
              _requested_quantity: number
              _ticket_tier_id?: string
              _user_id: string
            }
            Returns: undefined
          }
      claim_physical_ticket: {
        Args: { _claim_code: string; _user_id: string }
        Returns: {
          event_id: string
          new_ticket_id: string
          ticket_tier_id: string
        }[]
      }
      complete_reservation: {
        Args: { _reservation_id: string; _user_id: string }
        Returns: boolean
      }
      consume_checkout_token: {
        Args: { _token: string; _user_id: string }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
      get_own_stripe_info: {
        Args: { _organizer_id: string }
        Returns: {
          stripe_account_id: string
          stripe_onboarding_complete: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member_role: {
        Args: { _organizer_id: string; _roles: string[]; _user_id: string }
        Returns: boolean
      }
      is_organizer: {
        Args: { _organizer_id: string; _user_id: string }
        Returns: boolean
      }
      is_organizer_member: {
        Args: { _organizer_id: string; _user_id: string }
        Returns: boolean
      }
      is_organizer_role: {
        Args: { _organizer_id: string; _role: string; _user_id: string }
        Returns: boolean
      }
      release_expired_reservations: { Args: never; Returns: number }
      reserve_inventory:
        | {
            Args: {
              _costume_product_id?: string
              _event_id: string
              _jouvert_package_id?: string
              _product_type: string
              _quantity?: number
              _ticket_tier_id?: string
              _ttl_minutes?: number
              _user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              _checkout_token?: string
              _costume_product_id?: string
              _event_id: string
              _jouvert_package_id?: string
              _product_type: string
              _quantity?: number
              _ticket_tier_id?: string
              _ttl_minutes?: number
              _user_id: string
            }
            Returns: string
          }
      rotate_ticket_qr: {
        Args: { ticket_id: string }
        Returns: {
          expires_at: string
          new_qr_token: string
        }[]
      }
      validate_checkout_token: {
        Args: { _event_id: string; _token: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
