export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type UserRole = 'admin' | 'agent'

export interface Ticket {
  id: string
  title: string
  description: string
  name: string
  email: string
  status: TicketStatus
  priority: TicketPriority
  assigned_to: string | null
  image_urls: string[] | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface TicketFormData {
  name: string
  email: string
  title: string
  description: string
  image_urls?: string[]
}

export interface N8nWebhookPayload {
  ticketId: string
  title: string
  email: string
  name: string
}
