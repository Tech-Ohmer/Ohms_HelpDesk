import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_COLORS,
} from '@/types'
import type { TicketWithUpdates, TicketStatus } from '@/types'
import Link from 'next/link'

const STATUS_STEPS: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export default async function TrackTicketPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = await createServiceClient()
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, ticket_updates(*)')
    .eq('tracking_token', token)
    .order('created_at', { referencedTable: 'ticket_updates', ascending: true })
    .single()

  if (error || !ticket) notFound()

  const t = ticket as TicketWithUpdates
  const stepIndex = STATUS_STEPS.indexOf(t.status)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link href="/" className="text-sm text-blue-600 hover:underline block">
          ← Submit another ticket
        </Link>

        {/* Ticket Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">{t.ticket_number}</p>
              <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Submitted {formatDate(t.created_at)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', TICKET_STATUS_COLORS[t.status])}>
                {TICKET_STATUS_LABELS[t.status]}
              </span>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', TICKET_PRIORITY_COLORS[t.priority])}>
                {TICKET_PRIORITY_LABELS[t.priority]}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                {TICKET_CATEGORY_LABELS[t.category]}
              </span>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="mt-6 flex items-start">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors shrink-0',
                      idx <= stepIndex
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    )}
                  >
                    {idx < stepIndex ? '✓' : idx + 1}
                  </div>
                  <span className={cn('text-xs mt-1 text-center leading-tight', idx <= stepIndex ? 'text-blue-700 font-medium' : 'text-gray-400')}>
                    {TICKET_STATUS_LABELS[step]}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1 mb-4', idx < stepIndex ? 'bg-blue-600' : 'bg-gray-200')} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Request</h2>
          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{t.description}</p>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Activity</h2>
          {t.ticket_updates.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No replies yet. We will notify you when there is an update.</p>
          ) : (
            <div className="space-y-4">
              {t.ticket_updates.map((update) => (
                <div
                  key={update.id}
                  className={cn(
                    'rounded-xl p-4 text-sm border',
                    update.is_admin_reply
                      ? 'bg-blue-50 border-blue-100'
                      : 'bg-gray-50 border-gray-100'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('text-xs font-semibold', update.is_admin_reply ? 'text-blue-700' : 'text-gray-600')}>
                      {update.is_admin_reply ? 'Support Team' : t.submitter_name}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(update.created_at)}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{update.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-400 pb-4">
          Bookmark this page to check for updates anytime.
        </p>
      </div>
    </main>
  )
}
