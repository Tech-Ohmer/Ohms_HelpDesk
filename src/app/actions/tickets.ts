'use server'

import { nanoid } from 'nanoid'
import { createServiceClient } from '@/lib/supabase/server'
import { sendTicketCreatedEmail, sendStatusUpdateEmail, sendAdminReplyEmail } from '@/lib/email'
import type { TicketCategory, TicketPriority, TicketStatus, Ticket } from '@/types'

export async function createTicket(formData: {
  submitter_name: string
  submitter_email: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
}): Promise<{ success: boolean; trackingToken?: string; error?: string }> {
  try {
    const supabase = await createServiceClient()

    const tracking_token = nanoid(16)

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        submitter_name: formData.submitter_name,
        submitter_email: formData.submitter_email,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'open',
        tracking_token,
      })
      .select()
      .single()

    if (error) throw error

    await sendTicketCreatedEmail(data as Ticket)

    return { success: true, trackingToken: tracking_token }
  } catch (err) {
    console.error('createTicket error:', err)
    return { success: false, error: 'Failed to submit ticket. Please try again.' }
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error

    await sendStatusUpdateEmail(data as Ticket)

    return { success: true }
  } catch (err) {
    console.error('updateTicketStatus error:', err)
    return { success: false, error: 'Failed to update status.' }
  }
}

export async function addAdminReply(
  ticketId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()

    const { error: updateError } = await supabase
      .from('ticket_updates')
      .insert({ ticket_id: ticketId, message, is_admin_reply: true })

    if (updateError) throw updateError

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select()
      .eq('id', ticketId)
      .single()

    if (ticketError) throw ticketError

    await sendAdminReplyEmail(ticket as Ticket, message)

    return { success: true }
  } catch (err) {
    console.error('addAdminReply error:', err)
    return { success: false, error: 'Failed to send reply.' }
  }
}

export async function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('tickets')
      .update({ priority })
      .eq('id', ticketId)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('updateTicketPriority error:', err)
    return { success: false, error: 'Failed to update priority.' }
  }
}
