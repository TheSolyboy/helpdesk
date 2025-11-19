import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TicketList from '@/components/ticket-list'

export default async function AgentDashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  // Agents and admins can access this page
  if (profile.role !== 'agent' && profile.role !== 'admin') {
    redirect('/login')
  }

  return <TicketList isAdmin={false} />
}
