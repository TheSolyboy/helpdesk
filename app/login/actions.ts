'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('[LOGIN] Starting login for:', email)

  if (!email || !password) {
    console.log('[LOGIN] Missing email or password')
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log('[LOGIN] Auth error:', error.message)
    return { error: error.message }
  }

  console.log('[LOGIN] Authentication successful')

  // Get user profile to check role and redirect accordingly
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[LOGIN] User ID:', user?.id)

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('helpdesk_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('[LOGIN] Profile query result:', { profile, profileError })

    if (profileError) {
      console.log('[LOGIN] Profile error:', profileError)
      return { error: 'Profile not found. Please contact administrator.' }
    }

    if (profile?.role === 'admin') {
      console.log('[LOGIN] Redirecting to admin dashboard')
      redirect('/dashboard')
    } else if (profile?.role === 'agent') {
      console.log('[LOGIN] Redirecting to agent dashboard')
      redirect('/dashboard/agent')
    }
  }

  console.log('[LOGIN] No profile found, redirecting to default dashboard')
  redirect('/dashboard')
}
