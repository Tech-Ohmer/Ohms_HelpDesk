import { createServiceClient } from '@/lib/supabase/server'
import type { Ticket } from '@/types'
import KanbanBoard from '@/components/admin/KanbanBoard'

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
  const supabase = await createServiceClient()
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .not('status', 'eq', 'closed')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
        <p className="text-sm text-gray-500 mt-0.5">Drag tickets between columns to update their status</p>
      </div>
      <KanbanBoard initialTickets={(tickets ?? []) as Ticket[]} />
    </div>
  )
}
