// Auto-derived from supabase/schema.sql — keep updated as schema evolves.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "manager" | "employee";
export type MaterialType = "raw_material" | "finished_product";
export type NotificationType =
  | "low_stock"
  | "order_update"
  | "production_complete"
  | "system";
export type OrderStatus =
  | "enquiry"
  | "contacted"
  | "measurements"
  | "production"
  | "fitting"
  | "completed"
  | "delivered"
  | "cancelled";
export type ProductionStatus =
  | "cutting"
  | "stitching"
  | "finishing"
  | "quality_check"
  | "completed"
  | "cancelled";
export type StageStatus = "pending" | "in_progress" | "completed" | "rework";
export type StageName =
  | "cutting"
  | "stitching"
  | "finishing"
  | "quality_check";
export type ProductType = "custom_design" | "finished_good";

export interface Database {
  public: {
    Tables: {
      attendance: {
        Row: {
          id: string;
          employee_id: string | null;
          date: string;
          clock_in: string | null;
          clock_out: string | null;
          hours_worked: number | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["attendance"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
      catalog_purchases: {
        Row: {
          id: string;
          product_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          amount: number;
          currency: string | null;
          lenco_reference: string;
          lenco_collection_id: string | null;
          payment_method: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["catalog_purchases"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["catalog_purchases"]["Insert"]>;
      };
      customer_inquiries: {
        Row: {
          id: string;
          product_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          preferred_size: string | null;
          custom_measurements_needed: boolean | null;
          special_requests: string | null;
          contact_method: string | null;
          status: string | null;
          staff_notes: string | null;
          converted_order_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          contacted_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["customer_inquiries"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["customer_inquiries"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          measurements: Json | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          measurements?: Json | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          measurements?: Json | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      employees: {
        Row: {
          id: string;
          name: string;
          role: string;
          email: string | null;
          phone: string;
          hire_date: string;
          hourly_rate: number | null;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["employees"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          expense_date: string;
          category: string;
          description: string;
          amount: number;
          payment_method: string | null;
          reference_number: string | null;
          employee_id: string | null;
          order_id: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["expenses"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
      financial_settings: {
        Row: {
          id: string;
          custom_hourly_rate: number | null;
          default_profit_margin: number | null;
          expected_monthly_orders: number | null;
          tax_rate: number | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["financial_settings"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["financial_settings"]["Insert"]>;
      };
      garment_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          base_labour_cost: number;
          estimated_hours: number | null;
          complexity: string | null;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["garment_types"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["garment_types"]["Insert"]>;
      };
      inventory_transactions: {
        Row: {
          id: string;
          material_id: string | null;
          quantity_change: number;
          operation_type: string;
          notes: string | null;
          created_at: string | null;
          order_id: string | null;
          unit_cost: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["inventory_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["inventory_transactions"]["Insert"]>;
      };
      materials: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: string;
          stock_quantity: number;
          min_stock_level: number;
          cost_per_unit: number;
          supplier: string | null;
          description: string | null;
          last_restocked: string | null;
          created_at: string | null;
          updated_at: string | null;
          material_type: MaterialType | null;
          finished_product_sku: string | null;
          selling_price: number | null;
          production_cost: number | null;
          product_id: string | null;
          reorder_level: number | null;
          deleted_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["materials"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: NotificationType;
          title: string;
          message: string;
          link: string | null;
          read: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          item_type: string;
          description: string | null;
          quantity: number | null;
          price: number;
          measurements: Json | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      order_materials: {
        Row: {
          id: string;
          order_id: string | null;
          material_id: string | null;
          quantity_used: number;
          cost: number;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["order_materials"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_materials"]["Insert"]>;
      };
      order_timeline: {
        Row: {
          id: string;
          order_id: string | null;
          status: string;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["order_timeline"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_timeline"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          status: OrderStatus;
          order_date: string | null;
          due_date: string | null;
          total_cost: number;
          deposit: number | null;
          balance: number | null;
          description: string | null;
          notes: string | null;
          assigned_tailor_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          labour_cost: number | null;
          overhead_cost: number | null;
          material_cost: number | null;
          profit_margin: number | null;
          garment_type_id: string | null;
          order_type: string | null;
          product_id: string | null;
          deleted_at: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      overhead_costs: {
        Row: {
          id: string;
          month: string;
          category: string;
          description: string;
          amount: number;
          is_recurring: boolean | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["overhead_costs"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["overhead_costs"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payment_date: string;
          amount: number;
          payment_method: string;
          reference_number: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      production_batches: {
        Row: {
          id: string;
          batch_number: string;
          product_id: string | null;
          quantity: number;
          status: ProductionStatus | null;
          started_at: string | null;
          completed_at: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          total_cost: number | null;
          labor_cost: number | null;
          material_cost: number | null;
          deleted_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["production_batches"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["production_batches"]["Insert"]>;
      };
      production_logs: {
        Row: {
          id: string;
          batch_id: string | null;
          user_id: string | null;
          action: string;
          details: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["production_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["production_logs"]["Insert"]>;
      };
      production_materials: {
        Row: {
          id: string;
          batch_id: string | null;
          material_id: string | null;
          quantity_used: number;
          cost: number;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["production_materials"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["production_materials"]["Insert"]>;
      };
      production_stages: {
        Row: {
          id: string;
          batch_id: string | null;
          stage_name: StageName;
          assigned_to: string | null;
          status: StageStatus | null;
          started_at: string | null;
          completed_at: string | null;
          notes: string | null;
          quality_issues: string | null;
          created_at: string | null;
          updated_at: string | null;
          input_data: Json | null;
        };
        Insert: Omit<Database["public"]["Tables"]["production_stages"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["production_stages"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          base_price: number;
          category: string | null;
          image_url: string | null;
          estimated_days: number | null;
          active: boolean | null;
          created_at: string | null;
          featured: boolean | null;
          stock_status: string | null;
          customizable: boolean | null;
          gallery_images: string[] | null;
          size_guide: string | null;
          fabric_details: string | null;
          care_instructions: string | null;
          updated_at: string | null;
          labor_cost: number | null;
          deleted_at: string | null;
          product_type: ProductType | null;
          stock_quantity: number | null;
          min_stock_level: number | null;
          cost_per_unit: number | null;
          supplier_id: string | null;
          barcode: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["user_profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      material_type: MaterialType;
      notification_type: NotificationType;
      order_status: OrderStatus;
      production_status: ProductionStatus;
      stage_status: StageStatus;
      stage_name: StageName;
    };
  };
}

// Convenience type aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
