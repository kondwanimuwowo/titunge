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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          business_id: string
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          date: string
          employee_id: string | null
          hours_worked: number | null
          id: string
          notes: string | null
        }
        Insert: {
          business_id: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date: string
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
        }
        Update: {
          business_id?: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      business_users: {
        Row: {
          active: boolean | null
          business_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          business_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          business_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          logo_url: string | null
          name: string
          order_prefix: string
          plan: string
          slug: string
          status: string
          theme_key: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          logo_url?: string | null
          name: string
          order_prefix?: string
          plan?: string
          slug: string
          status?: string
          theme_key?: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          logo_url?: string | null
          name?: string
          order_prefix?: string
          plan?: string
          slug?: string
          status?: string
          theme_key?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      catalog_purchases: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          payment_method: string | null
          product_id: string | null
          reference: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          payment_method?: string | null
          product_id?: string | null
          reference: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          payment_method?: string | null
          product_id?: string | null
          reference?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_purchases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_inquiries: {
        Row: {
          business_id: string
          contact_method: string | null
          contacted_at: string | null
          converted_order_id: string | null
          created_at: string | null
          custom_measurements_needed: boolean | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          preferred_size: string | null
          product_id: string | null
          special_requests: string | null
          staff_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          contact_method?: string | null
          contacted_at?: string | null
          converted_order_id?: string | null
          created_at?: string | null
          custom_measurements_needed?: boolean | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          preferred_size?: string | null
          product_id?: string | null
          special_requests?: string | null
          staff_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          contact_method?: string | null
          contacted_at?: string | null
          converted_order_id?: string | null
          created_at?: string | null
          custom_measurements_needed?: boolean | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          preferred_size?: string | null
          product_id?: string | null
          special_requests?: string | null
          staff_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_inquiries_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          measurements: Json | null
          name: string
          notes: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          measurements?: Json | null
          name: string
          notes?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          measurements?: Json | null
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean | null
          business_id: string
          created_at: string | null
          email: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string | null
          description: string | null
          employee_id: string | null
          expense_date: string
          id: string
          notes: string | null
          order_id: string | null
          payment_method: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          category: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          expense_date: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_settings: {
        Row: {
          business_id: string
          custom_hourly_rate: number | null
          default_profit_margin: number | null
          expected_monthly_orders: number | null
          id: string
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          custom_hourly_rate?: number | null
          default_profit_margin?: number | null
          expected_monthly_orders?: number | null
          id?: string
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          custom_hourly_rate?: number | null
          default_profit_margin?: number | null
          expected_monthly_orders?: number | null
          id?: string
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      garment_types: {
        Row: {
          active: boolean | null
          base_labour_cost: number | null
          business_id: string
          complexity: string | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_labour_cost?: number | null
          business_id: string
          complexity?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_labour_cost?: number | null
          business_id?: string
          complexity?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garment_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          material_id: string
          notes: string | null
          operation_type: string
          order_id: string | null
          quantity_change: number
          unit_cost: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          material_id: string
          notes?: string | null
          operation_type: string
          order_id?: string | null
          quantity_change: number
          unit_cost?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          material_id?: string
          notes?: string | null
          operation_type?: string
          order_id?: string | null
          quantity_change?: number
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          min_stock_level: number | null
          name: string
          notes: string | null
          stock_quantity: number | null
          supplier: string | null
          unit: string
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          min_stock_level?: number | null
          name: string
          notes?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          min_stock_level?: number | null
          name?: string
          notes?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          business_id: string
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_materials: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          material_id: string
          order_id: string
          quantity_used: number
          unit_cost: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          material_id: string
          order_id: string
          quantity_used?: number
          unit_cost?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          material_id?: string
          order_id?: string
          quantity_used?: number
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_materials_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          balance_due: number | null
          business_id: string
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          deposit: number | null
          due_date: string | null
          employee_id: string | null
          garment_type_id: string | null
          id: string
          labour_cost: number | null
          material_cost: number | null
          measurements: Json | null
          notes: string | null
          order_date: string | null
          order_number: string
          order_type: string | null
          overhead_cost: number | null
          status: string
          style_notes: string | null
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          balance_due?: number | null
          business_id: string
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deposit?: number | null
          due_date?: string | null
          employee_id?: string | null
          garment_type_id?: string | null
          id?: string
          labour_cost?: number | null
          material_cost?: number | null
          measurements?: Json | null
          notes?: string | null
          order_date?: string | null
          order_number: string
          order_type?: string | null
          overhead_cost?: number | null
          status?: string
          style_notes?: string | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          balance_due?: number | null
          business_id?: string
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deposit?: number | null
          due_date?: string | null
          employee_id?: string | null
          garment_type_id?: string | null
          id?: string
          labour_cost?: number | null
          material_cost?: number | null
          measurements?: Json | null
          notes?: string | null
          order_date?: string | null
          order_number?: string
          order_type?: string | null
          overhead_cost?: number | null
          status?: string
          style_notes?: string | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      overhead_costs: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          month: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          month: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          month?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overhead_costs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batch_orders: {
        Row: {
          batch_id: string
          business_id: string
          created_at: string | null
          id: string
          order_id: string
        }
        Insert: {
          batch_id: string
          business_id: string
          created_at?: string | null
          id?: string
          order_id: string
        }
        Update: {
          batch_id?: string
          business_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_batch_orders_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batch_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batch_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          batch_number: string
          business_id: string
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          business_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          business_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          business_id: string
          category: string | null
          colors: Json | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          images: Json | null
          name: string
          price: number
          product_type: string | null
          sizes: Json | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          category?: string | null
          colors?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          name: string
          price?: number
          product_type?: string | null
          sizes?: Json | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          category?: string | null
          colors?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          name?: string
          price?: number
          product_type?: string | null
          sizes?: Json | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      my_business_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

// Domain types — match the CHECK constraints in schema.sql
export type OrderStatus =
  | "pending"
  | "in_progress"
  | "production"
  | "ready"
  | "completed"
  | "delivered"
  | "cancelled";

export type UserRole = "admin" | "manager" | "employee";

// Convenience aliases matching the old manual type file
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
