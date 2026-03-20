import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { TicketWithUpdates } from '@/types'
import AdminTicketDetail from '@/components/admin/TicketDetail'

export const dynamic = 'force-dynamic'

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, ticket_updates(*)')
    .eq('id', id)
    .order('created_at', { ascending: true, referencedTable: 'ticket_updates' })
    .single()

  if (!ticket) notFound()

  return <AdminTicketDetail ticket={ticket as TicketWithUpdates} />
}
