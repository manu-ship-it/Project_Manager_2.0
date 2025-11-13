import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create client if we have valid URLs (not placeholders)
export const supabase = supabaseUrl.includes('placeholder') || supabaseUrl === 'your_supabase_url_here'
  ? null as any
  : createClient(supabaseUrl, supabaseAnonKey)

// Database types - V2 Structure

// =====================================================
// Customer Library
// =====================================================
export interface Customer {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  company_name: string
  contact_name: string | null
  email: string
  phone: string | null
  mobile: string | null
  address: string | null
}

// =====================================================
// Quote/Project (Unified)
// =====================================================
export interface QuoteProject {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  quote: boolean // TRUE = quote, FALSE = project
  quote_num: string | null
  proj_num: string | null
  name: string
  description: string | null
  customer_id: string
  address: string | null
  quote_date: string | null
  valid_until: string | null
  status: string | null
  total_amount: number
  budget: number
  install_commencement_date: string | null
  install_duration: number | null
  priority_level: 'low' | 'medium' | 'high' | null
  markup_percentage: number
  customer?: Customer
}

// =====================================================
// Joinery Item (Unified for Quotes and Projects)
// =====================================================
export interface JoineryItem {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  quote: boolean // TRUE = quote item, FALSE = project item
  joinery_number: string | null
  name: string
  description: string | null
  qty: number
  quote_proj_id: string
  factory_hours: number | null
  install_hours: number | null
  budget: number
  install_commencement_date: string | null
  install_duration: number | null
  // Material fields (direct references to materials table)
  carcass_material_id: string | null
  face_material_1_id: string | null
  face_material_2_id: string | null
  face_material_3_id: string | null
  face_material_4_id: string | null
  // Hardware fields (hinge and drawer hardware references)
  hinge_id: string | null
  drawer_hardware_id: string | null
  // Material relations (populated via select)
  carcass_material?: Material | null
  face_material_1?: Material | null
  face_material_2?: Material | null
  face_material_3?: Material | null
  face_material_4?: Material | null
  // Hardware relations (hinge and drawer hardware)
  hinge?: Hardware | null
  drawer_hardware?: Hardware | null
  // Project checklist fields (only relevant when quote = FALSE)
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
  // Calculated cost fields (populated by database functions)
  calculated_cabinet_cost?: number | null
  calculated_specialized_cost?: number | null
  calculated_hours_cost?: number | null
  calculated_total_cost?: number | null
  quote_project?: QuoteProject
}

// =====================================================
// Project Task (Still uses project_id - may need update later)
// =====================================================
export interface ProjectTask {
  id: string
  project_id: string // TODO: Update to quote_proj_id in future
  task_description: string
  is_completed: boolean
  is_flagged: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// Supplier Library
// =====================================================
export interface Supplier {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  name: string
  contact_info: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

// =====================================================
// Material Library
// =====================================================
export interface Material {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  name: string // Renamed from material_name
  material_type: 'Board/Laminate' | 'Edgetape' | null
  thickness: number | null
  board_size: string | null // Kept for backward compatibility
  length: number | null // For Board/Laminate (in mm)
  width: number | null // For Board/Laminate (in mm)
  edge_size: '21x1' | '21x2' | '29x1' | '29x2' | '38x1' | '38x2' | null // For Edgetape
  unit: 'sheet' | 'meters' | 'units' | 'hours' | null
  cost_per_unit: number | null
  supplier_id: string | null
  supplier?: Supplier | null
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


// =====================================================
// Hardware Library
// =====================================================
export interface Hardware {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  name: string
  description: string | null
  dimension: string | null
  cost_per_unit: number
  supplier_id: string | null
  supplier?: Supplier | null
}

// =====================================================
// Template Cabinet Library (Renamed from StandardCabinet)
// =====================================================
export type CabinetType = 
  | 'door'
  | 'drawer'
  | 'open'
  | 'int_dishwasher'
  | 'accessories'
  | 'int_rangehood'
  | 'int_fridge'

export interface TemplateCabinet {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  type: CabinetType | null // Restricted to specific values
  category: string | null // Renamed from cabinet_category
  name: string | null
  width: number | null // Renamed from cabinet_width
  height: number | null // Renamed from cabinet_height
  depth: number | null // Renamed from cabinet_depth
  description: string | null
  assigned_face_material: 1 | 2 | 3 | 4 // Which face material (1-4) is assigned (default: 1)
  end_panels_qty: number // Quantity of end panels (default: 0)
  hinge_qty: string | null // Formula or number for hinge quantity (e.g., "door_qty*2", "0")
  drawer_qty: number // Number of drawers (default: 0)
  door_qty: number // Number of doors (default: 0, positive integers only)
  shelf_qty: number // Number of shelves (default: 0, positive integers only)
  drawer_hardware_qty: string | null // Formula or number for drawer hardware quantity (e.g., "drawer_qty*1", "drawer_qty")
  carcass_calculation: string | null // Formula for calculating carcass material area
  face_calculation: string | null // Formula for calculating face material area
}

// =====================================================
// Cabinet (Unified Cabinet Instances)
// =====================================================
export interface Cabinet {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  type: CabinetType | null // Restricted to specific values
  category: string | null
  name: string | null
  width: number | null
  height: number | null
  depth: number | null
  quantity: number
  template_id: string | null // Reference to TemplateCabinet (nullable)
  quote: boolean // TRUE = quote cabinet, FALSE = project cabinet
  joinery_item_id: string
  assigned_face_material: 1 | 2 | 3 | 4 | null // Which face material (1-4) from parent joinery item is assigned
  extra_hinges: number // Additional hinges beyond automatically calculated ones
  extra_drawers: number // Additional drawer hardware beyond automatically calculated ones
  end_panels_qty: number // Quantity of end panels for this cabinet
  hinge_qty: string | null // Formula or number for hinge quantity (inherited from template or overridden)
  drawer_qty: number // Number of drawers (inherited from template or overridden)
  door_qty: number // Number of doors (inherited from template or overridden, positive integers only)
  shelf_qty: number // Number of shelves (inherited from template or overridden, positive integers only)
  drawer_hardware_qty: string | null // Formula or number for drawer hardware quantity (inherited from template or overridden)
  template_cabinet?: TemplateCabinet | null
  joinery_item?: JoineryItem
}

// =====================================================
// Cabinet-Hardware Junction (Renamed from CabinetHardware)
// =====================================================
export interface CabJoinHardware {
  id: string
  created_at: string
  updated_at: string
  hardware_id: string
  cab_id: string // Reference to Cabinet.id
  qty: number // Renamed from quantity
  notes: string | null
  hardware?: Hardware
  cabinet?: Cabinet
}

// =====================================================
// Cabinet-Material Junction (Renamed from CabinetMaterial)
// =====================================================
export interface CabJoinMaterial {
  id: string
  created_at: string
  updated_at: string
  material_id: string
  cab_id: string // Reference to Cabinet.id
  qty: number // DECIMAL for fractional quantities
  notes: string | null
  material?: Material & { supplier?: Supplier | null }
  cabinet?: Cabinet
}

// =====================================================
// Joinery Item-Material Junction
// =====================================================
export interface JoineryItemMaterial {
  id: string
  created_at: string
  updated_at: string
  joinery_item_id: string
  material_id: string
  quantity: number
  material?: Material & { supplier?: Supplier | null }
  joinery_item?: JoineryItem
}

// =====================================================
// Template Cabinet-Material Junction (NEW)
// =====================================================
export interface TempCabJoinMaterial {
  id: string
  created_at: string
  updated_at: string
  material_id: string
  temp_cab_id: string // Reference to TemplateCabinet.id
  qty: number
  material?: Material & { supplier?: Supplier | null }
  template_cabinet?: TemplateCabinet
}

// =====================================================
// Supplier-Material Junction (NEW)
// =====================================================
export interface SupJoinMaterial {
  id: string
  created_at: string
  updated_at: string
  sup_id: string // Reference to Supplier.id
  mat_id: string // Reference to Material.id
  sup_cost: number
  supplier?: Supplier
  material?: Material
}

// =====================================================
// Specialized Items (Hardware/Materials for Joinery Items)
// =====================================================
export interface SpecializedItem {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  joinery_item_id: string
  item_type: 'hardware' | 'material'
  item_id: string // References either hardware(id) or materials(id)
  quantity: number
  unit_cost: number
  total_cost: number
  notes: string | null
  hardware?: Hardware | null
  material?: Material | null
  joinery_item?: JoineryItem
}

// =====================================================
// Settings
// =====================================================
export interface Setting {
  id: string
  key: string
  value: string
  description: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// Type Aliases for Backward Compatibility
// =====================================================
// Legacy type aliases - these help maintain compatibility with older code
export type Project = QuoteProject
export type JoineryItemCabinet = Cabinet
export type QuoteJoineryItemCabinet = Cabinet
export type QuoteJoineryItemMaterial = JoineryItemMaterial
export type Quote = QuoteProject
export type StandardCabinet = TemplateCabinet


