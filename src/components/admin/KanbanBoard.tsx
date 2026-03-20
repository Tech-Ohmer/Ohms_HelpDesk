'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Ticket, TicketStatus } from '@/types'
import {
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
} from '@/types'
import { formatDateShort, cn } from '@/lib/utils'
import { updateTicketStatus } from '@/app/actions/tickets'

const COLUMNS: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

const COLUMN_COLORS: Record<TicketStatus, string> = {
  open: 'border-t-blue-400',
  in_progress: 'border-t-yellow-400',
  resolved: 'border-t-green-400',
  closed: 'border-t-gray-400',
}

// Draggable ticket card
function TicketCard({ ticket, isDragging = false }: { ticket: Ticket; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: ticket.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="text-xs font-mono text-gray-400 mb-1">{ticket.ticket_number}</p>
      <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{ticket.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', TICKET_PRIORITY_COLORS[ticket.priority])}>
          {TICKET_PRIORITY_LABELS[ticket.priority]}
        </span>
        <span className="text-xs text-gray-400">{formatDateShort(ticket.created_at)}</span>
      </div>
      <div className="mt-2">
        <Link
          href={`/admin/tickets/${ticket.id}`}
          className="text-xs text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View details →
        </Link>
      </div>
    </div>
  )
}

// Overlay card shown while dragging
function DragOverlayCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="bg-white rounded-lg border border-blue-300 p-3 shadow-xl cursor-grabbing rotate-1 scale-105">
      <p className="text-xs font-mono text-gray-400 mb-1">{ticket.ticket_number}</p>
      <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{ticket.title}</p>
      <div className="mt-2">
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', TICKET_PRIORITY_COLORS[ticket.priority])}>
          {TICKET_PRIORITY_LABELS[ticket.priority]}
        </span>
      </div>
    </div>
  )
}

// Column droppable area
function KanbanColumn({
  status,
  tickets,
  activeId,
}: {
  status: TicketStatus
  tickets: Ticket[]
  activeId: string | null
}) {
  const { setNodeRef, isOver } = useSortable({
    id: status,
    data: { type: 'column', status },
  })

  return (
    <div
      className={cn(
        'bg-gray-50 rounded-xl border-t-4 border border-gray-200 flex flex-col min-h-[500px] min-w-[260px] flex-1 transition-colors',
        COLUMN_COLORS[status],
        isOver && 'bg-blue-50 border-blue-100'
      )}
    >
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{TICKET_STATUS_LABELS[status]}</h3>
        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 p-3 space-y-2 overflow-y-auto">
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} isDragging={activeId === ticket.id} />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-300 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
            Drop tickets here
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const getTicketsByStatus = useCallback(
    (status: TicketStatus) => tickets.filter((t) => t.status === status),
    [tickets]
  )

  const activeTicket = activeId ? tickets.find((t) => t.id === activeId) : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    // Determine the target column
    const targetStatus = COLUMNS.includes(over.id as TicketStatus)
      ? (over.id as TicketStatus)
      : tickets.find((t) => t.id === over.id)?.status

    if (!targetStatus) return

    const draggedTicket = tickets.find((t) => t.id === active.id)
    if (!draggedTicket || draggedTicket.status === targetStatus) return

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: targetStatus } : t))
    )

    // Persist
    const result = await updateTicketStatus(active.id as string, targetStatus)
    if (!result.success) {
      // Revert on failure
      setTickets((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: draggedTicket.status } : t))
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={getTicketsByStatus(status)}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket ? <DragOverlayCard ticket={activeTicket} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
