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
          created_at: string
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
          created_at?: string
        }
        Update: {
          [_ in never]: never
        }
        Relationships: []
      }
      hunter_profiles: {
        Row: {
          id: string
          display_name: string | null
          residency_state: string | null
          hunter_ed_number: string | null
          sat_device_type: 'inreach' | 'spot' | 'none' | null
          sat_device_id: string | null
          weapon_types: string[]
          target_species: string[]
          states_of_interest: string[]
          hunt_access_types: string[]
          experience_level: 'beginner' | 'intermediate' | 'experienced' | 'expert' | null
          years_hunting: number | null
          physical_condition: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          annual_budget: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          hunt_styles: string[]
          training_interests: string[]
          home_city: string | null
          home_state: string | null
          nearest_airport: string | null
          nearest_airport_name: string | null
          willing_to_fly: boolean | null
          max_drive_hours: number | null
          typical_trip_days: number | null
          max_trips_per_year: number | null
          looking_for_buddy: boolean
          willing_to_mentor: boolean
          buddy_bio: string | null
          avatar_url: string | null
          is_verified: boolean
          social_facebook: string | null
          social_instagram: string | null
          social_x: string | null
          phone: string | null
          backup_email: string | null
          date_of_birth: string | null
          height_inches: number | null
          weight_lbs: number | null
          bench_press_lbs: number | null
          squat_lbs: number | null
          deadlift_lbs: number | null
          overhead_press_lbs: number | null
          photo_urls: string[]
          profile_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          residency_state?: string | null
          hunter_ed_number?: string | null
          sat_device_type?: 'inreach' | 'spot' | 'none' | null
          sat_device_id?: string | null
          weapon_types?: string[]
          target_species?: string[]
          states_of_interest?: string[]
          hunt_access_types?: string[]
          experience_level?: 'beginner' | 'intermediate' | 'experienced' | 'expert' | null
          years_hunting?: number | null
          physical_condition?: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          annual_budget?: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          hunt_styles?: string[]
          training_interests?: string[]
          home_city?: string | null
          home_state?: string | null
          nearest_airport?: string | null
          nearest_airport_name?: string | null
          willing_to_fly?: boolean | null
          max_drive_hours?: number | null
          typical_trip_days?: number | null
          max_trips_per_year?: number | null
          looking_for_buddy?: boolean
          willing_to_mentor?: boolean
          buddy_bio?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_x?: string | null
          phone?: string | null
          backup_email?: string | null
          date_of_birth?: string | null
          height_inches?: number | null
          weight_lbs?: number | null
          bench_press_lbs?: number | null
          squat_lbs?: number | null
          deadlift_lbs?: number | null
          overhead_press_lbs?: number | null
          photo_urls?: string[]
          profile_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          residency_state?: string | null
          hunter_ed_number?: string | null
          sat_device_type?: 'inreach' | 'spot' | 'none' | null
          sat_device_id?: string | null
          weapon_types?: string[]
          target_species?: string[]
          states_of_interest?: string[]
          hunt_access_types?: string[]
          experience_level?: 'beginner' | 'intermediate' | 'experienced' | 'expert' | null
          years_hunting?: number | null
          physical_condition?: 'light' | 'moderate' | 'strenuous' | 'extreme' | null
          annual_budget?: 'under_500' | '500_2000' | '2000_5000' | '5000_15000' | '15000_plus' | null
          hunt_styles?: string[]
          training_interests?: string[]
          home_city?: string | null
          home_state?: string | null
          nearest_airport?: string | null
          nearest_airport_name?: string | null
          willing_to_fly?: boolean | null
          max_drive_hours?: number | null
          typical_trip_days?: number | null
          max_trips_per_year?: number | null
          looking_for_buddy?: boolean
          willing_to_mentor?: boolean
          buddy_bio?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_x?: string | null
          phone?: string | null
          backup_email?: string | null
          date_of_birth?: string | null
          height_inches?: number | null
          weight_lbs?: number | null
          bench_press_lbs?: number | null
          squat_lbs?: number | null
          deadlift_lbs?: number | null
          overhead_press_lbs?: number | null
          photo_urls?: string[]
          profile_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          id: string
          email: string
          full_name: string | null
          stripe_customer_id: string | null
          experience_level: 'beginner' | 'intermediate' | 'expert' | null
          interests: string[]
          fitness_level: 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null
          residential_state: string | null
          onboarding_completed: boolean
          community_guidelines_accepted_at: string | null
          community_guidelines_version: number
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          stripe_customer_id?: string | null
          experience_level?: 'beginner' | 'intermediate' | 'expert' | null
          interests?: string[]
          fitness_level?: 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null
          residential_state?: string | null
          onboarding_completed?: boolean
          community_guidelines_accepted_at?: string | null
          community_guidelines_version?: number
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          stripe_customer_id?: string | null
          experience_level?: 'beginner' | 'intermediate' | 'expert' | null
          interests?: string[]
          fitness_level?: 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null
          residential_state?: string | null
          onboarding_completed?: boolean
          community_guidelines_accepted_at?: string | null
          community_guidelines_version?: number
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hunter_points: {
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
          created_at: string
          updated_at: string
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
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hunt_applications: {
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
          result_date: string | null
          created_at: string
          updated_at: string
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
          result_date?: string | null
          created_at?: string
          updated_at?: string
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
          result_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hunt_plans: {
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
          checklist: Json
          ai_recommendations: Json | null
          ai_chat: Json
          saved_services: Json
          gear_list: Json
          notes: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          print_recipients: Json
          created_at: string
          updated_at: string
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
          checklist?: Json
          ai_recommendations?: Json | null
          ai_chat?: Json
          saved_services?: Json
          gear_list?: Json
          notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          print_recipients?: Json
          created_at?: string
          updated_at?: string
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
          checklist?: Json
          ai_recommendations?: Json | null
          ai_chat?: Json
          saved_services?: Json
          gear_list?: Json
          notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          print_recipients?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hunt_members: {
        Row: {
          id: string
          hunt_plan_id: string
          user_id: string | null
          display_name: string
          phone: string | null
          email: string | null
          role: 'owner' | 'collaborator' | 'viewer'
          tag_status: 'pending' | 'applied' | 'drawn' | 'not_drawn'
          points_contributed: number | null
          is_scout_user: boolean
          added_at: string
          updated_at: string
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
          points_contributed?: number | null
          is_scout_user?: boolean
          added_at?: string
          updated_at?: string
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
          points_contributed?: number | null
          is_scout_user?: boolean
          added_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hunt_locations: {
        Row: {
          id: string
          hunt_plan_id: string
          label: string
          description: string | null
          lat: number | null
          lng: number | null
          scout_report: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hunt_plan_id: string
          label?: string
          description?: string | null
          lat?: number | null
          lng?: number | null
          scout_report?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hunt_plan_id?: string
          label?: string
          description?: string | null
          lat?: number | null
          lng?: number | null
          scout_report?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gear_items: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          brand: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string
          brand?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          brand?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
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
          created_at: string
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
          created_at?: string
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
      draw_states: {
        Row: {
          id: string
          state_name: string
          state_code: string
          year: number
          portal_url: string | null
          gmu_notes: string | null
          state_warning: string | null
          shared_requirements: Json
          created_at: string
          updated_at: string
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
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      draw_species: {
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
          species_requirements: Json
          created_at: string
          updated_at: string
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
          species_requirements?: Json
          created_at?: string
          updated_at?: string
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
          species_requirements?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      draw_research_reports: {
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
          created_at: string
          updated_at: string
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
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          status: 'pending' | 'accepted' | 'declined' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          recipient_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'blocked'
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          id: string
          user_id: string
          post_type: 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review' | 'progress' | 'gear_review' | 'tip' | 'catch_report' | 'spot_review' | 'range_report' | 'training_log' | 'wow_result'
          entity_name: string | null
          content: string
          module: string
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_type?: 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review' | 'progress' | 'gear_review' | 'tip' | 'catch_report' | 'spot_review' | 'range_report' | 'training_log' | 'wow_result'
          entity_name?: string | null
          content: string
          module?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          post_type?: 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review' | 'progress' | 'gear_review' | 'tip' | 'catch_report' | 'spot_review' | 'range_report' | 'training_log' | 'wow_result'
          entity_name?: string | null
          content?: string
          module?: string
          metadata?: Record<string, unknown> | null
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: { [_ in never]: never }
        Relationships: []
      }
      journal_sightings: {
        Row: {
          id: string
          user_id: string
          species: string
          point_count: number | null
          distance_yards: number | null
          direction: string | null
          animal_count: number
          behavior: string | null
          notes: string | null
          lat: number | null
          lng: number | null
          location_name: string | null
          property_name: string | null
          observed_at: string
          temp_f: number | null
          wind_speed_mph: number | null
          wind_direction: string | null
          pressure_inhg: number | null
          pressure_trend: string | null
          moon_phase: string | null
          moon_illumination: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          species: string
          point_count?: number | null
          distance_yards?: number | null
          direction?: string | null
          animal_count?: number
          behavior?: string | null
          notes?: string | null
          lat?: number | null
          lng?: number | null
          location_name?: string | null
          property_name?: string | null
          observed_at?: string
          temp_f?: number | null
          wind_speed_mph?: number | null
          wind_direction?: string | null
          pressure_inhg?: number | null
          pressure_trend?: string | null
          moon_phase?: string | null
          moon_illumination?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          species?: string
          point_count?: number | null
          distance_yards?: number | null
          direction?: string | null
          animal_count?: number
          behavior?: string | null
          notes?: string | null
          lat?: number | null
          lng?: number | null
          location_name?: string | null
          property_name?: string | null
          observed_at?: string
          temp_f?: number | null
          wind_speed_mph?: number | null
          wind_direction?: string | null
          pressure_inhg?: number | null
          pressure_trend?: string | null
          moon_phase?: string | null
          moon_illumination?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      issue_reports: {
        Row: {
          id: string
          user_id: string
          module: string
          category: 'bug' | 'feature_request' | 'content_error' | 'other'
          title: string
          description: string
          page_url: string | null
          status: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module?: string
          category?: 'bug' | 'feature_request' | 'content_error' | 'other'
          title: string
          description: string
          page_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          module?: string
          category?: 'bug' | 'feature_request' | 'content_error' | 'other'
          title?: string
          description?: string
          page_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
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
          updated_at?: string
        }
        Relationships: []
      }
      journal_pins: {
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
          created_at: string
          updated_at: string
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
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gear_checklist: {
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
          module: string
          content_type: 'article' | 'video'
          title: string
          slug: string
          description: string | null
          body: string | null
          video_url: string | null
          thumbnail_url: string | null
          duration_minutes: number | null
          tier_required: string
          category: string | null
          sort_order: number
          published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module?: string
          content_type: 'article' | 'video'
          title: string
          slug: string
          description?: string | null
          body?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration_minutes?: number | null
          tier_required?: string
          category?: string | null
          sort_order?: number
          published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module?: string
          content_type?: 'article' | 'video'
          title?: string
          slug?: string
          description?: string | null
          body?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration_minutes?: number | null
          tier_required?: string
          category?: string | null
          sort_order?: number
          published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
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
          created_at: string
          updated_at: string
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
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_workouts: {
        Row: {
          id: string
          week_start: string
          title: string
          description: string
          workout_details: Json
          created_at: string
        }
        Insert: {
          id?: string
          week_start: string
          title: string
          description: string
          workout_details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          week_start?: string
          title?: string
          description?: string
          workout_details?: Json
          created_at?: string
        }
        Relationships: []
      }
      workout_submissions: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          scaling: 'rx' | 'scaled' | 'beginner'
          score_value: number
          score_display: string
          notes: string | null
          community_post_id: string | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
        }
        Relationships: []
      }
      baseline_tests: {
        Row: {
          id: string
          user_id: string
          run_time_seconds: number
          pushups: number
          situps: number
          pullups: number
          notes: string | null
          tested_at: string
          created_at: string
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
          created_at?: string
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
          created_at?: string
        }
        Relationships: []
      }
      leaderboard_points: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          week_start: string
          scaling: 'rx' | 'scaled' | 'beginner'
          placement: number
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          week_start: string
          scaling: 'rx' | 'scaled' | 'beginner'
          placement: number
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          week_start?: string
          scaling?: 'rx' | 'scaled' | 'beginner'
          placement?: number
          points?: number
          created_at?: string
        }
        Relationships: []
      }
      shared_plans: {
        Row: {
          id: string
          source_plan_id: string
          source_user_id: string
          target_plan_id: string | null
          target_user_id: string
          status: 'pending' | 'accepted' | 'declined'
          shared_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          source_plan_id: string
          source_user_id: string
          target_plan_id?: string | null
          target_user_id: string
          status?: 'pending' | 'accepted' | 'declined'
          shared_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          source_plan_id?: string
          source_user_id?: string
          target_plan_id?: string | null
          target_user_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          shared_at?: string
          accepted_at?: string | null
        }
        Relationships: []
      }
      training_plans: {
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
          created_at: string
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
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'run' | 'strength'
          status?: 'active' | 'completed' | 'abandoned'
          config?: Json
          plan_data?: Json
          goal?: string | null
          weeks_total?: number
          started_at?: string
          created_at?: string
        }
        Relationships: []
      }
      plan_workout_logs: {
        Row: {
          id: string
          plan_id: string
          user_id: string
          week_number: number
          session_number: number
          notes: string | null
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          user_id: string
          week_number: number
          session_number: number
          notes?: string | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          user_id?: string
          week_number?: number
          session_number?: number
          notes?: string | null
          completed_at?: string
          created_at?: string
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
          created_at: string
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
