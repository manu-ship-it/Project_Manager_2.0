import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Project {
  id: string
  project_number: string
  client: string
  project_name: string
  project_address: string
  date_created: string
  project_status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  install_commencement_date: string
  install_duration: number
  overall_project_budget: number
  priority_level: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export interface JoineryItem {
  id: string
  project_id: string
  item_name: string
  item_budget: number
  install_commencement_date: string
  install_duration: number
  shop_drawings_approved: boolean
  board_ordered: boolean
  hardware_ordered: boolean
  site_measured: boolean
  microvellum_ready_to_process: boolean
  processed_to_factory: boolean
  picked_up_from_factory: boolean
  install_scheduled: boolean
  plans_printed: boolean
  assembled: boolean
  delivered: boolean
  installed: boolean
  invoiced: boolean
  created_at: string
  updated_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  task_description: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  project_id: string
  material_name: string
  thickness: number
  board_size: string
  quantity: number
  supplier: string
  created_at: string
  updated_at: string
}

export interface Installer {
  id: string
  name: string
  contact_info: string
  created_at: string
  updated_at: string
}

export interface ProjectInstaller {
  id: string
  project_id: string
  installer_id: string
  created_at: string
}


