export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'bug' | 'feature_request' | 'question' | 'other'

export interface Ticket {
  id: string
  ticket_number: string
  submitter_name: string
  submitter_email: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  tracking_token: string
  created_at: string
  updated_at: string
}

export interface TicketUpdate {
  id: string
  ticket_id: string
  message: string
  is_admin_reply: boolean
  created_at: string
}

export interface TicketWithUpdates extends Ticket {
  ticket_updates: TicketUpdate[]
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  question: 'Question',
  other: 'Other',
}

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-red-200 text-red-900 font-semibold',
}
