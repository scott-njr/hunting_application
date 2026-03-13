// Auto-generated types — run: supabase gen types typescript --linked > src/types/database.types.ts
// Manually maintained until CLI is linked to the project

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blog_post: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          cover_image_url: string | null
          category: 'field_reports' | 'gear_reviews' | 'strategy_breakdowns' | 'scouting_intel' | 'community_stories' | 'how_to_guides'
          status: 'draft' | 'published' | 'archived'
          author_id: string | null
          published_on: string | null
          targets: string[]
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: string
          excerpt?: string | null
          cover_image_url?: string | null
          category: 'field_reports' | 'gear_reviews' | 'strategy_breakdowns' | 'scouting_intel' | 'community_stories' | 'how_to_guides'
          status?: 'draft' | 'published' | 'archived'
          author_id?: string | null
          published_on?: string | null
          targets?: string[]
          created_on?: string
          updated_on?: string
        }
        Update: {
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          cover_image_url?: string | null
          category?: 'field_reports' | 'gear_reviews' | 'strategy_breakdowns' | 'scouting_intel' | 'community_stories' | 'how_to_guides'
          status?: 'draft' | 'published' | 'archived'
          published_on?: string | null
          targets?: string[]
          updated_on?: string
        }
        Relationships: []
      }
      email_broadcast: {
        Row: {
          id: string
          sent_by: string | null
          category: 'release_notes' | 'newsletter' | 'blog' | 'announcement'
          subject: string
          body_markdown: string
          body_html: string
          recipient_count: number
          status: 'draft' | 'sending' | 'sent' | 'failed'
          error_message: string | null
          created_on: string
          updated_on: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          sent_by: string
          category: 'release_notes' | 'newsletter' | 'blog' | 'announcement'
          subject: string
          body_markdown: string
          body_html: string
          recipient_count?: number
          status?: 'draft' | 'sending' | 'sent' | 'failed'
          error_message?: string | null
          created_on?: string
          updated_on?: string
          sent_at?: string | null
        }
        Update: {
          status?: 'draft' | 'sending' | 'sent' | 'failed'
          recipient_count?: number
          error_message?: string | null
          updated_on?: string
          sent_at?: string | null
        }
        Relationships: []
      }
      email_unsubscribe: {
        Row: {
          id: string
          email: string
          category: 'release_notes' | 'newsletter' | 'blog' | 'announcement' | 'all'
          created_on: string
        }
        Insert: {
          id?: string
          email: string
          category: 'release_notes' | 'newsletter' | 'blog' | 'announcement' | 'all'
          created_on?: string
        }
        Update: {
          [_ in never]: never
        }
        Relationships: []
      }
      ai_responses: {
        Row: {
          id: string
          user_id: string
          module: string
          feature: string
          input_length: number
          output_length: number
          raw_response: string
          tokens_input: number | null
          tokens_output: number | null
          parse_success: boolean
          flags: string[]
          duration_ms: number
          sanitized_input: string | null
          created_on: string
        }
        Insert: {
          id?: string
          user_id: string
          module: string
          feature: string
          input_length: number
          output_length: number
          raw_response: string
          tokens_input?: number | null
          tokens_output?: number | null
          parse_success?: boolean
          flags?: string[]
          duration_ms: number
          sanitized_input?: string | null
          created_on?: string
        }
        Update: {
          [_ in never]: never
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          display_name: string | null
          user_name: string
          gender: 'male' | 'female' | null
          date_of_birth: string | null
          avatar_url: string | null
          phone: string | null
          email: string | null
          city: string | null
          state: string | null
          country: string | null
          photo_urls: string[]
          physical_condition: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          social_facebook: string | null
          social_instagram: string | null
          social_x: string | null
          is_verified: boolean
          created_on: string
          updated_on: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          user_name?: string
          gender?: 'male' | 'female' | null
          date_of_birth?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          photo_urls?: string[]
          physical_condition?: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_x?: string | null
          is_verified?: boolean
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          user_name?: string
          gender?: 'male' | 'female' | null
          date_of_birth?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          photo_urls?: string[]
          physical_condition?: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_x?: string | null
          is_verified?: boolean
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_profile: {
        Row: {
          id: string
          weapon_types: string[]
          target_species: string[]
          states_of_interest: string[]
          hunt_access_types: string[]
          experience_level: 'beginner' | 'intermediate' | 'experienced' | 'expert' | null
          years_hunting: number | null
          annual_budget: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          hunt_styles: string[]
          hunter_ed_number: string | null
          sat_device_type: 'inreach' | 'spot' | 'none' | null
          sat_device_id: string | null
          willing_to_fly: boolean | null
          max_drive_hours: number | null
          looking_for_buddy: boolean
          willing_to_mentor: boolean
          buddy_bio: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id: string
          weapon_types?: string[]
          target_species?: string[]
          states_of_interest?: string[]
          hunt_access_types?: string[]
          experience_level?: 'beginner' | 'intermediate' | 'experienced' | 'expert' | null
          years_hunting?: number | null
          annual_budget?: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          hunt_styles?: string[]
          hunter_ed_number?: string | null
          sat_device_type?: 'inreach' | 'spot' | 'none' | null
          sat_device_id?: string | null
          willing_to_fly?: boolean | null
          max_drive_hours?: number | null
          looking_for_buddy?: boolean
          willing_to_mentor?: boolean
          buddy_bio?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          weapon_types?: string[]
          target_species?: string[]
          states_of_interest?: string[]
          hunt_access_types?: string[]
          experience_level?: 'beginner' | 'intermediate' | 'experienced' | 'expert' | null
          years_hunting?: number | null
          annual_budget?: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          hunt_styles?: string[]
          hunter_ed_number?: string | null
          sat_device_type?: 'inreach' | 'spot' | 'none' | null
          sat_device_id?: string | null
          willing_to_fly?: boolean | null
          max_drive_hours?: number | null
          looking_for_buddy?: boolean
          willing_to_mentor?: boolean
          buddy_bio?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      fitness_profile: {
        Row: {
          id: string
          height_inches: number | null
          weight_lbs: number | null
          bench_press_lbs: number | null
          squat_lbs: number | null
          deadlift_lbs: number | null
          overhead_press_lbs: number | null
          fitness_level: 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id: string
          height_inches?: number | null
          weight_lbs?: number | null
          bench_press_lbs?: number | null
          squat_lbs?: number | null
          deadlift_lbs?: number | null
          overhead_press_lbs?: number | null
          fitness_level?: 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          height_inches?: number | null
          weight_lbs?: number | null
          bench_press_lbs?: number | null
          squat_lbs?: number | null
          deadlift_lbs?: number | null
          overhead_press_lbs?: number | null
          fitness_level?: 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          id: string
          email: string
          full_name: string | null
          stripe_customer_id: string | null
          onboarding_completed: boolean
          community_guidelines_accepted_at: string | null
          community_guidelines_version: number
          is_admin: boolean
          created_on: string
          updated_on: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          stripe_customer_id?: string | null
          onboarding_completed?: boolean
          community_guidelines_accepted_at?: string | null
          community_guidelines_version?: number
          is_admin?: boolean
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          stripe_customer_id?: string | null
          onboarding_completed?: boolean
          community_guidelines_accepted_at?: string | null
          community_guidelines_version?: number
          is_admin?: boolean
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_points: {
        Row: {
          id: string
          user_id: string
          state: string
          state_name: string
          species: string
          season: string
          points: number
          point_type: 'preference' | 'bonus'
          notes: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          state: string
          state_name: string
          species: string
          season: string
          points?: number
          point_type?: 'preference' | 'bonus'
          notes?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          state?: string
          state_name?: string
          species?: string
          season?: string
          points?: number
          point_type?: 'preference' | 'bonus'
          notes?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_applications: {
        Row: {
          id: string
          user_id: string
          state: string
          state_name: string
          species: string
          season: string
          year: number
          unit: string | null
          status: 'applied' | 'drawn' | 'not_drawn' | 'withdrawn' | 'hunt_started'
          date_applied: string | null
          first_choice: string | null
          second_choice: string | null
          third_choice: string | null
          notes: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          state: string
          state_name: string
          species: string
          season: string
          year: number
          unit?: string | null
          status?: 'applied' | 'drawn' | 'not_drawn' | 'withdrawn' | 'hunt_started'
          date_applied?: string | null
          first_choice?: string | null
          second_choice?: string | null
          third_choice?: string | null
          notes?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          state?: string
          state_name?: string
          species?: string
          season?: string
          year?: number
          unit?: string | null
          status?: 'applied' | 'drawn' | 'not_drawn' | 'withdrawn' | 'hunt_started'
          date_applied?: string | null
          first_choice?: string | null
          second_choice?: string | null
          third_choice?: string | null
          notes?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          hunt_type: 'group_draw' | 'otc' | 'out_of_state' | 'in_state' | 'solo' | null
          state: string
          state_name: string
          species: string
          season: string
          year: number
          unit: string | null
          status: 'planning' | 'applied' | 'booked' | 'completed' | 'cancelled'
          trip_start_date: string | null
          trip_end_date: string | null
          trip_days: number | null
          budget: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          terrain_difficulty: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          fly_or_drive: 'fly' | 'drive' | null
          base_camp: string | null
          base_camp_state: string | null
          gear_list: Json
          notes: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          print_recipients: Json
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          hunt_type?: 'group_draw' | 'otc' | 'out_of_state' | 'in_state' | 'solo' | null
          state: string
          state_name: string
          species: string
          season: string
          year: number
          unit?: string | null
          status?: 'planning' | 'applied' | 'booked' | 'completed' | 'cancelled'
          trip_start_date?: string | null
          trip_end_date?: string | null
          trip_days?: number | null
          budget?: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          terrain_difficulty?: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          fly_or_drive?: 'fly' | 'drive' | null
          base_camp?: string | null
          base_camp_state?: string | null
          gear_list?: Json
          notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          print_recipients?: Json
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          hunt_type?: 'group_draw' | 'otc' | 'out_of_state' | 'in_state' | 'solo' | null
          state?: string
          state_name?: string
          species?: string
          season?: string
          year?: number
          unit?: string | null
          status?: 'planning' | 'applied' | 'booked' | 'completed' | 'cancelled'
          trip_start_date?: string | null
          trip_end_date?: string | null
          trip_days?: number | null
          budget?: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          terrain_difficulty?: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          fly_or_drive?: 'fly' | 'drive' | null
          base_camp?: string | null
          base_camp_state?: string | null
          gear_list?: Json
          notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          print_recipients?: Json
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_plan_members: {
        Row: {
          id: string
          hunt_plan_id: string
          user_id: string | null
          display_name: string
          phone: string | null
          email: string | null
          role: 'owner' | 'collaborator' | 'viewer'
          tag_status: 'pending' | 'applied' | 'drawn' | 'not_drawn'

          is_scout_user: boolean
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          hunt_plan_id: string
          user_id?: string | null
          display_name: string
          phone?: string | null
          email?: string | null
          role?: 'owner' | 'collaborator' | 'viewer'
          tag_status?: 'pending' | 'applied' | 'drawn' | 'not_drawn'

          is_scout_user?: boolean
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          hunt_plan_id?: string
          user_id?: string | null
          display_name?: string
          phone?: string | null
          email?: string | null
          role?: 'owner' | 'collaborator' | 'viewer'
          tag_status?: 'pending' | 'applied' | 'drawn' | 'not_drawn'

          is_scout_user?: boolean
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_locations: {
        Row: {
          id: string
          hunt_plan_id: string
          label: string
          description: string | null
          lat: number | null
          lng: number | null
          scout_report: Json | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          hunt_plan_id: string
          label?: string
          description?: string | null
          lat?: number | null
          lng?: number | null
          scout_report?: Json | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          hunt_plan_id?: string
          label?: string
          description?: string | null
          lat?: number | null
          lng?: number | null
          scout_report?: Json | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_gear_items: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          brand: string | null
          notes: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string
          brand?: string | null
          notes?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          brand?: string | null
          notes?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      deploy_log: {
        Row: {
          id: string
          triggered_by: string | null
          issue_id: string | null
          severity: string | null
          status: 'triggered' | 'building' | 'success' | 'failed'
          github_pr_url: string | null
          admin_notes: string | null
          created_on: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          triggered_by?: string | null
          issue_id?: string | null
          severity?: string | null
          status?: 'triggered' | 'building' | 'success' | 'failed'
          github_pr_url?: string | null
          admin_notes?: string | null
          created_on?: string
          completed_at?: string | null
        }
        Update: {
          triggered_by?: string | null
          issue_id?: string | null
          severity?: string | null
          status?: 'triggered' | 'building' | 'success' | 'failed'
          github_pr_url?: string | null
          admin_notes?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      hunting_draw_states: {
        Row: {
          id: string
          state_name: string
          state_code: string
          year: number
          portal_url: string | null
          gmu_notes: string | null
          state_warning: string | null
          shared_requirements: Json
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          state_name: string
          state_code: string
          year: number
          portal_url?: string | null
          gmu_notes?: string | null
          state_warning?: string | null
          shared_requirements?: Json
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          state_name?: string
          state_code?: string
          year?: number
          portal_url?: string | null
          gmu_notes?: string | null
          state_warning?: string | null
          shared_requirements?: Json
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_draw_species: {
        Row: {
          id: string
          draw_state_id: string
          state_code: string
          year: number
          species: string
          seasons: string[]
          open_date: string | null
          deadline: string | null
          results_date: string | null
          payment_deadline: string | null
          secondary_open: string | null
          secondary_close: string | null
          secondary_results: string | null
          leftover_date: string | null
          status: 'open' | 'upcoming' | 'closed'
          note: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          draw_state_id: string
          state_code: string
          year: number
          species: string
          seasons?: string[]
          open_date?: string | null
          deadline?: string | null
          results_date?: string | null
          payment_deadline?: string | null
          secondary_open?: string | null
          secondary_close?: string | null
          secondary_results?: string | null
          leftover_date?: string | null
          status?: 'open' | 'upcoming' | 'closed'
          note?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          draw_state_id?: string
          state_code?: string
          year?: number
          species?: string
          seasons?: string[]
          open_date?: string | null
          deadline?: string | null
          results_date?: string | null
          payment_deadline?: string | null
          secondary_open?: string | null
          secondary_close?: string | null
          secondary_results?: string | null
          leftover_date?: string | null
          status?: 'open' | 'upcoming' | 'closed'
          note?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_draw_research_reports: {
        Row: {
          id: string
          user_id: string
          title: string
          state: string
          species: string
          season: string | null
          wizard_inputs: Json
          recommendations: Json
          summary: string | null
          chat_history: Json
          user_rankings: Json | null
          status: 'draft' | 'final' | 'shared'
          shared_with: string[]
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          state: string
          species: string
          season?: string | null
          wizard_inputs?: Json
          recommendations?: Json
          summary?: string | null
          chat_history?: Json
          user_rankings?: Json | null
          status?: 'draft' | 'final' | 'shared'
          shared_with?: string[]
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          state?: string
          species?: string
          season?: string | null
          wizard_inputs?: Json
          recommendations?: Json
          summary?: string | null
          chat_history?: Json
          user_rankings?: Json | null
          status?: 'draft' | 'final' | 'shared'
          shared_with?: string[]
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      social_friendships: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          status: 'pending' | 'accepted' | 'declined' | 'blocked'
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          requester_id: string
          recipient_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'blocked'
          created_on?: string
          updated_on?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'blocked'
          updated_on?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          id: string
          user_id: string
          post_type: 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review' | 'progress' | 'gear_review' | 'tip' | 'catch_report' | 'spot_review' | 'range_report' | 'training_log' | 'wow_result'
          entity_name: string | null
          content: string
          module: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          metadata: Record<string, unknown> | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          post_type?: 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review' | 'progress' | 'gear_review' | 'tip' | 'catch_report' | 'spot_review' | 'range_report' | 'training_log' | 'wow_result'
          entity_name?: string | null
          content: string
          module?: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          metadata?: Record<string, unknown> | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          post_type?: 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review' | 'progress' | 'gear_review' | 'tip' | 'catch_report' | 'spot_review' | 'range_report' | 'training_log' | 'wow_result'
          entity_name?: string | null
          content?: string
          module?: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          metadata?: Record<string, unknown> | null
          updated_on?: string
        }
        Relationships: []
      }
      social_messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read_at: string | null
          created_on: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          read_at?: string | null
          created_on?: string
        }
        Update: {
          read_at?: string | null
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_on: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_on?: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      social_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_on: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_on?: string
        }
        Update: { [_ in never]: never }
        Relationships: []
      }
      issue_reports: {
        Row: {
          id: string
          user_id: string
          module: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          category: 'bug' | 'feature_request' | 'content_error' | 'other'
          title: string
          description: string
          page_url: string | null
          status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix'
          admin_notes: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          release_tag: string | null
          notified_at: string | null
          severity: 'easy' | 'major' | null
          ai_classified_at: string | null
          ai_proposed_fix: string | null
          github_issue_url: string | null
          admin_deploy_notes: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          module?: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          category?: 'bug' | 'feature_request' | 'content_error' | 'other'
          title: string
          description: string
          page_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix'
          admin_notes?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          release_tag?: string | null
          notified_at?: string | null
          severity?: 'easy' | 'major' | null
          ai_classified_at?: string | null
          ai_proposed_fix?: string | null
          github_issue_url?: string | null
          admin_deploy_notes?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          module?: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          category?: 'bug' | 'feature_request' | 'content_error' | 'other'
          title?: string
          description?: string
          page_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix'
          admin_notes?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          release_tag?: string | null
          notified_at?: string | null
          severity?: 'easy' | 'major' | null
          ai_classified_at?: string | null
          ai_proposed_fix?: string | null
          github_issue_url?: string | null
          admin_deploy_notes?: string | null
          updated_on?: string
        }
        Relationships: []
      }
      hunting_field_map_pins: {
        Row: {
          id: string
          user_id: string
          pin_type: string
          lat: number
          lng: number
          label: string | null
          notes: string | null
          color: string | null
          metadata: Json
          observed_at: string
          temp_f: number | null
          wind_speed_mph: number | null
          wind_direction: string | null
          pressure_inhg: number | null
          pressure_trend: string | null
          moon_phase: string | null
          moon_illumination: number | null
          source_hunt_plan_id: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          pin_type: string
          lat: number
          lng: number
          label?: string | null
          notes?: string | null
          color?: string | null
          metadata?: Json
          observed_at?: string
          temp_f?: number | null
          wind_speed_mph?: number | null
          wind_direction?: string | null
          pressure_inhg?: number | null
          pressure_trend?: string | null
          moon_phase?: string | null
          moon_illumination?: number | null
          source_hunt_plan_id?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          pin_type?: string
          lat?: number
          lng?: number
          label?: string | null
          notes?: string | null
          color?: string | null
          metadata?: Json
          observed_at?: string
          temp_f?: number | null
          wind_speed_mph?: number | null
          wind_direction?: string | null
          pressure_inhg?: number | null
          pressure_trend?: string | null
          moon_phase?: string | null
          moon_illumination?: number | null
          source_hunt_plan_id?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      hunting_gear_checklist: {
        Row: {
          user_id: string
          item_slug: string
        }
        Insert: {
          user_id: string
          item_slug: string
        }
        Update: { [_ in never]: never }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          module: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          content_type: 'article' | 'video'
          title: string
          slug: string
          description: string | null
          body: string | null
          video_url: string | null
          thumbnail_url: string | null
          duration_minutes: number | null
          tier_required: 'free' | 'basic' | 'pro'
          category: string | null
          sort_order: number
          published: boolean
          published_at: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          module?: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          content_type: 'article' | 'video'
          title: string
          slug: string
          description?: string | null
          body?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration_minutes?: number | null
          tier_required?: 'free' | 'basic' | 'pro'
          category?: string | null
          sort_order?: number
          published?: boolean
          published_at?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          module?: 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
          content_type?: 'article' | 'video'
          title?: string
          slug?: string
          description?: string | null
          body?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration_minutes?: number | null
          tier_required?: 'free' | 'basic' | 'pro'
          category?: string | null
          sort_order?: number
          published?: boolean
          published_at?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          completed: boolean
          completed_at: string | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          completed?: boolean
          completed_at?: string | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          completed?: boolean
          completed_at?: string | null
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          slug: string
          name: string
          description: string | null
          icon: string | null
          is_active: boolean
          sort_order: number
        }
        Insert: {
          slug: string
          name: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          slug?: string
          name?: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      module_subscriptions: {
        Row: {
          id: string
          user_id: string
          module_slug: string
          tier: 'free' | 'basic' | 'pro'
          status: 'active' | 'inactive' | 'cancelled' | 'trialing'
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_end: string | null
          ai_queries_this_month: number
          ai_queries_reset_date: string
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          module_slug: string
          tier?: 'free' | 'basic' | 'pro'
          status?: 'active' | 'inactive' | 'cancelled' | 'trialing'
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_end?: string | null
          ai_queries_this_month?: number
          ai_queries_reset_date?: string
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_slug?: string
          tier?: 'free' | 'basic' | 'pro'
          status?: 'active' | 'inactive' | 'cancelled' | 'trialing'
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_end?: string | null
          ai_queries_this_month?: number
          ai_queries_reset_date?: string
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      firearms_course_of_fire: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          strings_count: number
          shots_per_string: number
          delay_mode: 'fixed' | 'random' | 'instant'
          delay_min_ms: number
          delay_max_ms: number
          par_times_ms: number[]
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          strings_count: number
          shots_per_string: number
          delay_mode?: 'fixed' | 'random' | 'instant'
          delay_min_ms?: number
          delay_max_ms?: number
          par_times_ms?: number[]
          created_on?: string
          updated_on?: string
        }
        Update: {
          name?: string
          description?: string | null
          strings_count?: number
          shots_per_string?: number
          delay_mode?: 'fixed' | 'random' | 'instant'
          delay_min_ms?: number
          delay_max_ms?: number
          par_times_ms?: number[]
          updated_on?: string
        }
        Relationships: []
      }
      firearms_match: {
        Row: {
          id: string
          organizer_id: string
          course_of_fire_id: string
          name: string
          match_date: string | null
          status: 'setup' | 'active' | 'complete'
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          organizer_id: string
          course_of_fire_id: string
          name: string
          match_date?: string | null
          status?: 'setup' | 'active' | 'complete'
          created_on?: string
          updated_on?: string
        }
        Update: {
          name?: string
          course_of_fire_id?: string
          match_date?: string | null
          status?: 'setup' | 'active' | 'complete'
          updated_on?: string
        }
        Relationships: [
          {
            foreignKeyName: 'firearms_match_course_of_fire_id_fkey'
            columns: ['course_of_fire_id']
            isOneToOne: false
            referencedRelation: 'firearms_course_of_fire'
            referencedColumns: ['id']
          }
        ]
      }
      firearms_match_member: {
        Row: {
          id: string
          match_id: string
          user_id: string
          squad: string | null
          division: 'open' | 'limited' | 'production' | 'carry_optics' | 'single_stack' | 'revolver' | 'pcc' | 'limited_10' | null
          power_factor: 'major' | 'minor'
          classification: 'gm' | 'm' | 'a' | 'b' | 'c' | 'd' | 'u' | null
          session_id: string | null
          shoot_order: number | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          squad?: string | null
          division?: 'open' | 'limited' | 'production' | 'carry_optics' | 'single_stack' | 'revolver' | 'pcc' | 'limited_10' | null
          power_factor?: 'major' | 'minor'
          classification?: 'gm' | 'm' | 'a' | 'b' | 'c' | 'd' | 'u' | null
          session_id?: string | null
          shoot_order?: number | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          squad?: string | null
          division?: 'open' | 'limited' | 'production' | 'carry_optics' | 'single_stack' | 'revolver' | 'pcc' | 'limited_10' | null
          power_factor?: 'major' | 'minor'
          classification?: 'gm' | 'm' | 'a' | 'b' | 'c' | 'd' | 'u' | null
          session_id?: string | null
          shoot_order?: number | null
          updated_on?: string
        }
        Relationships: [
          {
            foreignKeyName: 'firearms_match_member_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profile'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'firearms_match_member_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'firearms_shot_session'
            referencedColumns: ['id']
          }
        ]
      }
      firearms_profile: {
        Row: {
          id: string
          dominant_hand: 'left' | 'right' | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id: string
          dominant_hand?: 'left' | 'right' | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          dominant_hand?: 'left' | 'right' | null
          updated_on?: string
        }
        Relationships: []
      }
      firearms_shot_session: {
        Row: {
          id: string
          user_id: string
          name: string | null
          mode: 'timer' | 'stopwatch' | 'spy'
          sensitivity: number
          band_thresholds: number[]
          delay_mode: 'fixed' | 'random' | 'instant'
          delay_min_ms: number
          delay_max_ms: number
          par_times_ms: number[]
          points: number
          notes: string | null
          total_strings: number
          started_at: string | null
          ended_at: string | null
          course_name: string | null
          status: 'review' | 'dq' | 'dnf' | null
          procedurals: number
          additional_penalty: number
          hit_factor: number | null
          shots_per_string: number | null
          alpha: number
          bravo: number
          charlie: number
          delta: number
          miss: number
          match_id: string | null
          match_member_id: string | null
          target_photo_url: string | null
          target_analysis: Json | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          mode?: 'timer' | 'stopwatch' | 'spy'
          sensitivity?: number
          band_thresholds?: number[]
          delay_mode?: 'fixed' | 'random' | 'instant'
          delay_min_ms?: number
          delay_max_ms?: number
          par_times_ms?: number[]
          points?: number
          notes?: string | null
          total_strings?: number
          started_at?: string | null
          ended_at?: string | null
          course_name?: string | null
          status?: 'review' | 'dq' | 'dnf' | null
          procedurals?: number
          additional_penalty?: number
          hit_factor?: number | null
          shots_per_string?: number | null
          alpha?: number
          bravo?: number
          charlie?: number
          delta?: number
          miss?: number
          match_id?: string | null
          match_member_id?: string | null
          target_photo_url?: string | null
          target_analysis?: Json | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          name?: string | null
          mode?: 'timer' | 'stopwatch' | 'spy'
          sensitivity?: number
          band_thresholds?: number[]
          delay_mode?: 'fixed' | 'random' | 'instant'
          delay_min_ms?: number
          delay_max_ms?: number
          par_times_ms?: number[]
          points?: number
          notes?: string | null
          total_strings?: number
          started_at?: string | null
          ended_at?: string | null
          course_name?: string | null
          status?: 'review' | 'dq' | 'dnf' | null
          procedurals?: number
          additional_penalty?: number
          hit_factor?: number | null
          shots_per_string?: number | null
          alpha?: number
          bravo?: number
          charlie?: number
          delta?: number
          miss?: number
          match_id?: string | null
          match_member_id?: string | null
          target_photo_url?: string | null
          target_analysis?: Json | null
          updated_on?: string
        }
        Relationships: []
      }
      firearms_shot_string: {
        Row: {
          id: string
          session_id: string
          user_id: string
          string_number: number
          shots_ms: number[]
          shot_amplitudes: number[]
          amplitude_samples: Json | null
          split_times_ms: number[]
          total_time_ms: number | null
          shot_count: number
          points: number | null
          hit_factor: number | null
          par_hit: boolean | null
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          string_number: number
          shots_ms?: number[]
          shot_amplitudes?: number[]
          amplitude_samples?: Json | null
          split_times_ms?: number[]
          total_time_ms?: number | null
          shot_count?: number
          points?: number | null
          hit_factor?: number | null
          par_hit?: boolean | null
          created_on?: string
          updated_on?: string
        }
        Update: {
          shots_ms?: number[]
          shot_amplitudes?: number[]
          amplitude_samples?: Json | null
          split_times_ms?: number[]
          total_time_ms?: number | null
          shot_count?: number
          points?: number | null
          hit_factor?: number | null
          par_hit?: boolean | null
          updated_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "firearms_shot_string_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "firearms_shot_session"
            referencedColumns: ["id"]
          }
        ]
      }
      fitness_weekly_workouts: {
        Row: {
          id: string
          week_start: string
          title: string
          description: string
          workout_details: Json
          created_on: string
        }
        Insert: {
          id?: string
          week_start: string
          title: string
          description: string
          workout_details?: Json
          created_on?: string
        }
        Update: {
          id?: string
          week_start?: string
          title?: string
          description?: string
          workout_details?: Json
          created_on?: string
        }
        Relationships: []
      }
      fitness_workout_submissions: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          scaling: 'rx' | 'scaled' | 'beginner'
          score_value: number
          score_display: string
          notes: string | null
          community_post_id: string | null
          created_on: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          scaling: 'rx' | 'scaled' | 'beginner'
          score_value: number
          score_display: string
          notes?: string | null
          community_post_id?: string | null
          created_on?: string
        }
        Update: {
          id?: string
          workout_id?: string
          user_id?: string
          scaling?: 'rx' | 'scaled' | 'beginner'
          score_value?: number
          score_display?: string
          notes?: string | null
          community_post_id?: string | null
          created_on?: string
        }
        Relationships: []
      }
      fitness_baseline_tests: {
        Row: {
          id: string
          user_id: string
          run_time_seconds: number
          pushups: number
          situps: number
          pullups: number
          notes: string | null
          tested_at: string
          created_on: string
        }
        Insert: {
          id?: string
          user_id: string
          run_time_seconds: number
          pushups: number
          situps: number
          pullups: number
          notes?: string | null
          tested_at?: string
          created_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          run_time_seconds?: number
          pushups?: number
          situps?: number
          pullups?: number
          notes?: string | null
          tested_at?: string
          created_on?: string
        }
        Relationships: []
      }
      fitness_leaderboard_points: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          week_start: string
          scaling: 'rx' | 'scaled' | 'beginner'
          placement: number
          points: number
          created_on: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          week_start: string
          scaling: 'rx' | 'scaled' | 'beginner'
          placement: number
          points: number
          created_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          week_start?: string
          scaling?: 'rx' | 'scaled' | 'beginner'
          placement?: number
          points?: number
          created_on?: string
        }
        Relationships: []
      }
      fitness_shared_items: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          item_type: 'run_session' | 'strength_session' | 'meal'
          item_snapshot: Json
          source_plan_id: string | null
          message: string | null
          created_on: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          item_type: 'run_session' | 'strength_session' | 'meal'
          item_snapshot: Json
          source_plan_id?: string | null
          message?: string | null
          created_on?: string
        }
        Update: {
          [_ in never]: never
        }
        Relationships: []
      }
      fitness_challenges: {
        Row: {
          id: string
          challenger_id: string
          challenged_id: string
          item_type: 'run_session' | 'strength_session'
          item_snapshot: Json
          status: 'pending' | 'accepted' | 'declined' | 'completed'
          scoring_type: 'time' | 'reps'
          message: string | null
          created_on: string
          accepted_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          challenger_id: string
          challenged_id: string
          item_type: 'run_session' | 'strength_session'
          item_snapshot: Json
          status?: 'pending' | 'accepted' | 'declined' | 'completed'
          scoring_type: 'time' | 'reps'
          message?: string | null
          created_on?: string
          accepted_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          challenger_id?: string
          challenged_id?: string
          item_type?: 'run_session' | 'strength_session'
          item_snapshot?: Json
          status?: 'pending' | 'accepted' | 'declined' | 'completed'
          scoring_type?: 'time' | 'reps'
          message?: string | null
          created_on?: string
          accepted_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      fitness_challenge_submissions: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          score_value: number
          score_display: string
          scaling: 'rx' | 'scaled' | 'beginner'
          notes: string | null
          created_on: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          score_value: number
          score_display: string
          scaling?: 'rx' | 'scaled' | 'beginner'
          notes?: string | null
          created_on?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          score_value?: number
          score_display?: string
          scaling?: 'rx' | 'scaled' | 'beginner'
          notes?: string | null
          created_on?: string
        }
        Relationships: []
      }
      fitness_shared_plans: {
        Row: {
          id: string
          source_plan_id: string
          source_user_id: string
          target_plan_id: string | null
          target_user_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_on: string
          updated_on: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          source_plan_id: string
          source_user_id: string
          target_plan_id?: string | null
          target_user_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_on?: string
          updated_on?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          source_plan_id?: string
          source_user_id?: string
          target_plan_id?: string | null
          target_user_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_on?: string
          updated_on?: string
          accepted_at?: string | null
        }
        Relationships: []
      }
      fitness_training_plans: {
        Row: {
          id: string
          user_id: string
          plan_type: 'run' | 'strength' | 'meal'
          status: 'active' | 'completed' | 'abandoned'
          config: Json
          plan_data: Json
          goal: string | null
          weeks_total: number
          started_at: string
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'run' | 'strength' | 'meal'
          status?: 'active' | 'completed' | 'abandoned'
          config?: Json
          plan_data?: Json
          goal?: string | null
          weeks_total?: number
          started_at?: string
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'run' | 'strength' | 'meal'
          status?: 'active' | 'completed' | 'abandoned'
          config?: Json
          plan_data?: Json
          goal?: string | null
          weeks_total?: number
          started_at?: string
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
      fitness_plan_workout_logs: {
        Row: {
          id: string
          plan_id: string
          user_id: string
          week_number: number
          session_number: number
          notes: string | null
          completed: boolean
          completed_at: string
          created_on: string
          updated_on: string
        }
        Insert: {
          id?: string
          plan_id: string
          user_id: string
          week_number: number
          session_number: number
          notes?: string | null
          completed?: boolean
          completed_at?: string
          created_on?: string
          updated_on?: string
        }
        Update: {
          id?: string
          plan_id?: string
          user_id?: string
          week_number?: number
          session_number?: number
          notes?: string | null
          completed?: boolean
          completed_at?: string
          created_on?: string
          updated_on?: string
        }
        Relationships: []
      }
    }
    Views: {
      my_friends: {
        Row: {
          friendship_id: string
          friend_id: string
          display_name: string | null
          email: string
          direction: 'sent' | 'received'
          status: 'pending' | 'accepted' | 'declined' | 'blocked'
          created_on: string
        }
        Relationships: []
      }
    }
    Functions: {
      increment_module_ai_queries: {
        Args: {
          user_id_param: string
          module_slug_param: string
        }
        Returns: number
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
