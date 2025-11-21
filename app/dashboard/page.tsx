import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TicketList from '@/components/ticket-list'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('helpdesk_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  // Only admins can access this page
  if (profile.role !== 'admin') {
    redirect('/dashboard/agent')
  }

  return <TicketList isAdmin={true} />
}
