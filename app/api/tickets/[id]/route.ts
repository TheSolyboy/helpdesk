import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
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

    // Prepare update data based on role
    const updateData: {
      status?: string
      priority?: string
      assigned_to?: string | null
      updated_at?: string
    } = {}

    if (profile.role === 'admin') {
      // Admins can update everything
      if (body.status) updateData.status = body.status
      if (body.priority) updateData.priority = body.priority
      if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to
    } else if (profile.role === 'agent') {
      // Agents can only update status of their assigned tickets
      if (body.status) updateData.status = body.status
    }

    updateData.updated_at = new Date().toISOString()

    // Update ticket
    const { data: ticket, error: updateError } = await supabase
      .from('helpdesk_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ticket }, { status: 200 })
  } catch (error) {
    console.error('Error in PATCH /api/tickets/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
