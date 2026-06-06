// Supabase Database Types
// Generated from schema — update after running: supabase gen types typescript

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          dob: string | null
          sex: string | null
          language: string
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      entries: {
        Row: {
          id: string
          user_id: string
          category: string
          subcategory: string
          fields: Record<string, unknown>
          note: string | null
          tags: string[] | null
          timestamp: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['entries']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['entries']['Insert']>
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          frequency: string
          current_streak: number
          longest_streak: number
          graceperiod: boolean
          enabled: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['habits']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['habits']['Insert']>
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          date: string
          completed: boolean
        }
        Insert: Database['public']['Tables']['habit_logs']['Row']
        Update: Partial<Database['public']['Tables']['habit_logs']['Row']>
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string
          target_value: number
          current_value: number
          unit: string
          deadline: string | null
          achieved: boolean
          achieved_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['goals']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      body_metrics: {
        Row: {
          id: string
          user_id: string
          date: string
          weight: number | null
          body_fat: number | null
          measurements: Record<string, number> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['body_metrics']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['body_metrics']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
