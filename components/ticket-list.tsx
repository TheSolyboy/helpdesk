'use client'

import { useState, useEffect } from 'react'
import {
  Ticket as TicketIcon,
  User,
  Mail,
  Clock,
  AlertCircle,
  Loader2,
  LogOut,
  Image as ImageIcon,
  X
} from 'lucide-react'
import type { Ticket, Profile, TicketStatus, TicketPriority } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TicketListProps {
  isAdmin: boolean
}

export default function TicketList({ isAdmin }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [agents, setAgents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTickets()
    if (isAdmin) {
      fetchAgents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchTickets() {
    try {
      const response = await fetch('/api/tickets')
      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAgents() {
    try {
      const { data, error } = await supabase
        .from('helpdesk_profiles')
        .select('*')
        .in('role', ['admin', 'agent'])

      if (!error && data) {
        setAgents(data)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  async function updateTicket(ticketId: string, updates: Partial<Ticket>) {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter)

  const statusColors: Record<TicketStatus, string> = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-purple-100 text-purple-800',
    closed: 'bg-green-100 text-green-800',
  }

  const priorityColors: Record<TicketPriority, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isAdmin ? 'Admin Dashboard' : 'Agent Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'open', 'assigned', 'in_progress', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ticket.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {ticket.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {ticket.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Image Attachments */}
                    {ticket.image_urls && ticket.image_urls.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-600 font-medium">
                            Attachments ({ticket.image_urls.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ticket.image_urls.map((url, imgIndex) => (
                            <div
                              key={imgIndex}
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImage(url)}
                            >
                              <img
                                src={url}
                                alt={`Attachment ${imgIndex + 1}`}
                                className="w-full h-20 object-cover rounded border border-gray-200 hover:border-blue-500 transition"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition rounded flex items-center justify-center">
                                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition">
                                  View
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  {/* Status Update */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={ticket.status}
                      onChange={(e) => updateTicket(ticket.id, { status: e.target.value as TicketStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Priority Update (Admin only) */}
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={ticket.priority}
                        onChange={(e) => updateTicket(ticket.id, { priority: e.target.value as TicketPriority })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  )}

                  {/* Assign Agent (Admin only) */}
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Assign to
                      </label>
                      <select
                        value={ticket.assigned_to || ''}
                        onChange={(e) => updateTicket(ticket.id, { assigned_to: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.full_name || agent.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={selectedImage}
              alt="Full size attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
