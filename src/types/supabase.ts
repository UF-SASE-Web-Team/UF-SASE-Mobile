export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      academic_terms: {
        Row: {
          created_at: string;
          id: string;
          is_current: boolean;
          name: string;
          start_date: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id: string;
          is_current?: boolean;
          name: string;
          start_date: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_current?: boolean;
          name?: string;
          start_date?: string;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          checked_in_at: string;
          event_id: string;
          id: string;
          method: Database['public']['Enums']['checkin_method'];
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          checked_in_at?: string;
          event_id: string;
          id?: string;
          method?: Database['public']['Enums']['checkin_method'];
          user_id?: string | null;
        };
        Update: {
          checked_in_at?: string;
          event_id?: string;
          id?: string;
          method?: Database['public']['Enums']['checkin_method'];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'check_ins_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'check_ins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          address: string | null;
          checkin_closes_at: string | null;
          checkin_code: string | null;
          checkin_opens_at: string | null;
          created_at: string;
          description: string | null;
          ends_at: string;
          id: string;
          lat: number | null;
          lng: number | null;
          location_name: string;
          points_value: number;
          starts_at: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          checkin_closes_at?: string | null;
          checkin_code?: string | null;
          checkin_opens_at?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location_name: string;
          points_value?: number;
          starts_at: string;
          title: string;
        };
        Update: {
          address?: string | null;
          checkin_closes_at?: string | null;
          checkin_code?: string | null;
          checkin_opens_at?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location_name?: string;
          points_value?: number;
          starts_at?: string;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          discord_handle: string | null;
          full_name: string;
          grad_time: string | null;
          id: string;
          major: string | null;
          minor: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
          username: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          discord_handle?: string | null;
          full_name: string;
          grad_time?: string | null;
          id: string;
          major?: string | null;
          minor?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          discord_handle?: string | null;
          full_name?: string;
          grad_time?: string | null;
          id?: string;
          major?: string | null;
          minor?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      program_members: {
        Row: {
          academic_term: string;
          created_at: string;
          display_name: string;
          id: string;
          is_poc: boolean;
          program_id: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          academic_term: string;
          created_at?: string;
          display_name: string;
          id?: string;
          is_poc?: boolean;
          program_id: string;
          user_id?: string | null;
        };
        Update: {
          academic_term?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_poc?: boolean;
          program_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'program_members_academic_term_fkey';
            columns: ['academic_term'];
            isOneToOne: false;
            referencedRelation: 'academic_terms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_members_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      programs: {
        Row: {
          application_url: string | null;
          category: Database['public']['Enums']['program_category'] | null;
          closes_at: string | null;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          opens_at: string | null;
          parent_id: string | null;
          short_description: string | null;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          application_url?: string | null;
          category?: Database['public']['Enums']['program_category'] | null;
          closes_at?: string | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          opens_at?: string | null;
          parent_id?: string | null;
          short_description?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          application_url?: string | null;
          category?: Database['public']['Enums']['program_category'] | null;
          closes_at?: string | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          opens_at?: string | null;
          parent_id?: string | null;
          short_description?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'programs_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['id'];
          },
        ];
      };
      resources: {
        Row: {
          category: Database['public']['Enums']['resource_category'] | null;
          created_at: string;
          display_order: number;
          id: string;
          image_url: string | null;
          name: string;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          category?: Database['public']['Enums']['resource_category'] | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          name: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          category?: Database['public']['Enums']['resource_category'] | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          name?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_username_available: { Args: { input_username: string }; Returns: boolean };
      delete_user_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      get_email_from_username: { Args: { p_username: string }; Returns: string };
    };
    Enums: {
      checkin_method: 'code' | 'qr' | 'manual';
      program_category: 'events_and_committees' | 'technical_and_research' | 'community';
      resource_category: 'general' | 'sase' | 'academic' | 'professional';
      user_role: 'member' | 'officer' | 'alumni';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      checkin_method: ['code', 'qr', 'manual'],
      program_category: ['events_and_committees', 'technical_and_research', 'community'],
      resource_category: ['general', 'sase', 'academic', 'professional'],
      user_role: ['member', 'officer', 'alumni'],
    },
  },
} as const;
