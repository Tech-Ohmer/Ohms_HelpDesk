import { createServiceClient } from '@/lib/supabase/server'
import type { Ticket } from '@/types'
import AdminTicketList from '@/components/admin/TicketList'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createServiceClient()
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets?.length ?? 0} total tickets</p>
        </div>
        <a
          href="/"
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Public Form
        </a>
      </div>
      <AdminTicketList tickets={(tickets ?? []) as Ticket[]} />
    </div>
  )
}
