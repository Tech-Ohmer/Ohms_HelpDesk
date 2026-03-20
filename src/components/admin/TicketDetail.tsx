'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { TicketWithUpdates, TicketStatus, TicketPriority } from '@/types'
import {
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_COLORS,
} from '@/types'
import { formatDate, cn } from '@/lib/utils'
import { updateTicketStatus, updateTicketPriority, addAdminReply } from '@/app/actions/tickets'

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']

export default function AdminTicketDetail({ ticket: initial }: { ticket: TicketWithUpdates }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function handleStatusChange(status: TicketStatus) {
    startTransition(async () => {
      await updateTicketStatus(initial.id, status)
      router.refresh()
    })
  }

  async function handlePriorityChange(priority: TicketPriority) {
    startTransition(async () => {
      await updateTicketPriority(initial.id, priority)
      router.refresh()
    })
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setIsSending(true)
    setReplyError(null)
    const result = await addAdminReply(initial.id, reply.trim())
    if (!result.success) {
      setReplyError(result.error ?? 'Failed to send reply.')
    } else {
      setReply('')
      router.refresh()
    }
    setIsSending(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/admin" className="text-sm text-blue-600 hover:underline mb-4 block">
        ← All Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ticket content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-mono mb-1">{initial.ticket_number}</p>
                <h1 className="text-xl font-bold text-gray-900">{initial.title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  From <span className="font-medium">{initial.submitter_name}</span>{' '}
                  ({initial.submitter_email}) · {formatDate(initial.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Description</h2>
            <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
              {initial.description}
            </p>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Activity</h2>

            {initial.ticket_updates.length === 0 ? (
              <p className="text-gray-400 text-sm italic mb-4">No replies yet.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {initial.ticket_updates.map((update) => (
                  <div
                    key={update.id}
                    className={cn(
                      'rounded-lg p-4 text-sm border',
                      update.is_admin_reply
                        ? 'bg-blue-50 border-blue-100'
                        : 'bg-gray-50 border-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('text-xs font-semibold', update.is_admin_reply ? 'text-blue-700' : 'text-gray-600')}>
                        {update.is_admin_reply ? 'You (Support)' : initial.submitter_name}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(update.created_at)}</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{update.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply form */}
            <form onSubmit={handleReply} className="space-y-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {replyError && (
                <p className="text-red-500 text-xs">{replyError}</p>
              )}
              <button
                type="submit"
                disabled={isSending || !reply.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status</h3>
            <div className="space-y-1.5">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isPending || initial.status === status}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                    initial.status === status
                      ? cn(TICKET_STATUS_COLORS[status], 'border-current')
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {TICKET_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Priority</h3>
            <div className="space-y-1.5">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  disabled={isPending || initial.priority === priority}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                    initial.priority === priority
                      ? cn(TICKET_PRIORITY_COLORS[priority], 'border-current')
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {TICKET_PRIORITY_LABELS[priority]}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500 text-xs">Category</dt>
                <dd className="text-gray-800 font-medium">{TICKET_CATEGORY_LABELS[initial.category]}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Created</dt>
                <dd className="text-gray-800 font-medium">{formatDate(initial.created_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Updated</dt>
                <dd className="text-gray-800 font-medium">{formatDate(initial.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Tracking link</dt>
                <dd>
                  <a
                    href={`/track/${initial.tracking_token}`}
                    target="_blank"
                    className="text-blue-600 hover:underline text-xs font-mono break-all"
                  >
                    /track/{initial.tracking_token}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
