import { Resend } from 'resend'
import type { Ticket } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export async function sendTicketCreatedEmail(ticket: Ticket) {
  const trackingUrl = `${APP_URL}/track/${ticket.tracking_token}`

  // Notify submitter
  await resend.emails.send({
    from: 'My Helpdesk <onboarding@resend.dev>',
    to: ticket.submitter_email,
    subject: `[${ticket.ticket_number}] Your ticket has been received`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your ticket has been received</h2>
        <p>Hi ${ticket.submitter_name},</p>
        <p>We've received your support request. Here are the details:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Ticket</td><td style="padding: 8px;">${ticket.ticket_number}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Title</td><td style="padding: 8px;">${ticket.title}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Priority</td><td style="padding: 8px;">${ticket.priority}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Status</td><td style="padding: 8px;">Open</td></tr>
        </table>
        <p>Track your ticket anytime using this link:</p>
        <a href="${trackingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">Track My Ticket</a>
        <p style="color: #666; font-size: 0.875rem; margin-top: 24px;">Or copy this URL: ${trackingUrl}</p>
      </div>
    `,
  })

  // Notify admin
  if (ADMIN_EMAIL) {
    await resend.emails.send({
      from: 'My Helpdesk <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `[NEW] [${ticket.ticket_number}] ${ticket.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New ticket submitted</h2>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Ticket</td><td style="padding: 8px;">${ticket.ticket_number}</td></tr>
            <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">From</td><td style="padding: 8px;">${ticket.submitter_name} (${ticket.submitter_email})</td></tr>
            <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Title</td><td style="padding: 8px;">${ticket.title}</td></tr>
            <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Category</td><td style="padding: 8px;">${ticket.category}</td></tr>
            <tr><td style="padding: 8px; background: #f5f5f5; font-weight: bold;">Priority</td><td style="padding: 8px;">${ticket.priority}</td></tr>
          </table>
          <p><strong>Description:</strong></p>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${ticket.description}</p>
          <a href="${APP_URL}/admin/tickets/${ticket.id}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">View in Admin</a>
        </div>
      `,
    })
  }
}

export async function sendStatusUpdateEmail(ticket: Ticket) {
  const trackingUrl = `${APP_URL}/track/${ticket.tracking_token}`

  await resend.emails.send({
    from: 'My Helpdesk <onboarding@resend.dev>',
    to: ticket.submitter_email,
    subject: `[${ticket.ticket_number}] Ticket status updated → ${ticket.status.replace('_', ' ')}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your ticket status has been updated</h2>
        <p>Hi ${ticket.submitter_name},</p>
        <p>The status of your ticket <strong>${ticket.ticket_number}</strong> has been updated to <strong>${ticket.status.replace('_', ' ').toUpperCase()}</strong>.</p>
        <a href="${trackingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">View Your Ticket</a>
      </div>
    `,
  })
}

export async function sendAdminReplyEmail(ticket: Ticket, replyMessage: string) {
  const trackingUrl = `${APP_URL}/track/${ticket.tracking_token}`

  await resend.emails.send({
    from: 'My Helpdesk <onboarding@resend.dev>',
    to: ticket.submitter_email,
    subject: `[${ticket.ticket_number}] New reply on your ticket`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New reply on your ticket</h2>
        <p>Hi ${ticket.submitter_name},</p>
        <p>There's a new reply on your ticket <strong>${ticket.ticket_number} — ${ticket.title}</strong>:</p>
        <blockquote style="border-left: 4px solid #2563eb; margin: 16px 0; padding: 12px 16px; background: #f0f7ff; border-radius: 0 6px 6px 0;">
          ${replyMessage}
        </blockquote>
        <a href="${trackingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">View Your Ticket</a>
      </div>
    `,
  })
}
