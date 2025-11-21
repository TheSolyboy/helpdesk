import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TicketFormData, N8nWebhookPayload } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: TicketFormData = await request.json()
    const { name, email, title, description } = body

    // Validate input
    if (!name || !email || !title || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Insert ticket into Supabase
    const { data: ticket, error: dbError } = await supabase
      .from('helpdesk_tickets')
      .insert({
        name,
        email,
        title,
        description,
        status: 'open',
        priority: 'medium',
        assigned_to: null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create ticket in database' },
        { status: 500 }
      )
    }

    // Send webhook to n8n
    const webhookPayload: N8nWebhookPayload = {
      ticketId: ticket.id,
      title: ticket.title,
      email: ticket.email,
      name: ticket.name,
    }

    try {
      await fetch('https://n8n.solynex.me/webhook/helpdesk-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      })
    } catch (webhookError) {
      // Log webhook error but don't fail the request
      console.error('Webhook error:', webhookError)
    }

    return NextResponse.json(
      { success: true, ticket },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('helpdesk_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get tickets based on role
    let query = supabase
      .from('helpdesk_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    // If agent, only show their assigned tickets
    if (profile.role === 'agent') {
      query = query.eq('assigned_to', user.id)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tickets }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
