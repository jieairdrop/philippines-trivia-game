// lib/actions/admin/withdrawals.ts (fixed: Inline admin client creation with @supabase/supabase-js to avoid cookie issues in createAdminClient; kept fallback for regular client; ensured numeric parsing with fallbacks; added RLS-safe queries where possible)
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server' // Keep regular server client for auth/RLS
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js' // Inline for admin (no cookies needed)

export async function getWithdrawals() {
  let withdrawalsData: any[] = []
  let supabase: any = null
  let isAdminClient = false
  try {
    // Log env vars for debugging (without exposing values)
    console.log('Env check - SUPABASE_URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Env check - SERVICE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Try inline admin client first (bypasses RLS, no cookies)
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing env vars for admin client')
      }
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      isAdminClient = true
      console.log('Inline admin client created successfully')
    } catch (adminErr) {
      console.error('Inline admin client creation failed:', adminErr)
      // Fallback to regular server client (may be limited by RLS)
      supabase = await createClient()
      console.log('Fallback to regular server client')
    }

    if (!supabase) {
      console.error('No Supabase client available')
      return []
    }

    // First, fetch withdrawals (admin client ignores RLS)
    const { data, error: wError } = await supabase
      .from('withdrawals')
      .select(`
        id,
        user_id,
        amount,
        points_deducted,
        payment_method,
        payment_details,
        status,
        requested_at,
        processed_at
      `)
      .order('requested_at', { ascending: false })

    console.log('Withdrawals raw data length:', data?.length || 0)
    console.log('Withdrawals error:', wError)

    if (wError) {
      console.error('Withdrawals fetch error:', wError)
      // Don't throw; log and continue with empty
      return []
    }

    withdrawalsData = data || []

    if (withdrawalsData.length === 0) {
      console.log('No withdrawals data found - table may be empty')
      return []
    }

    const userIds = [...new Set(withdrawalsData.map((w: any) => w.user_id))]

    // For profiles, use same client (full access if admin)
    let { data: profilesData, error: pError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds)

    console.log('Profiles raw data length:', profilesData?.length || 0)
    console.log('Profiles error:', pError)

    if (pError) {
      console.error('Profiles fetch error:', pError)
      // Proceed without profiles (use 'Unknown User')
      profilesData = []
    }

    const profilesMap = new Map(
      profilesData?.map((p: any) => [p.id, { first_name: p.first_name, last_name: p.last_name }]) || []
    )

    const processedData = withdrawalsData.map((w: any) => {
      const profile = profilesMap.get(w.user_id)
      return {
        ...w,
        user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
        amount: typeof w.amount === 'string' ? parseFloat(w.amount) : (w.amount || 0), // Ensure number for toFixed, default 0
        points_deducted: typeof w.points_deducted === 'string' ? parseInt(w.points_deducted, 10) : (w.points_deducted || 0), // Ensure int, default 0
      }
    })

    console.log('Processed withdrawals count:', processedData.length)
    console.log('Sample processed withdrawal:', processedData[0]) // Log first for debug

    return processedData
  } catch (error) {
    console.error('Critical error in getWithdrawals:', error)
    return []
  }
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  newStatus: 'pending' | 'approved' | 'rejected' | 'completed'
) {
  let supabase: any = null
  let adminSupabase: any = null
  try {
    // Step 1: Auth check with regular server client (includes cookies for session)
    supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('No authenticated user for update')
      return { success: false, error: 'Unauthorized' }
    }

    console.log('Authenticated user for update:', user.id)

    // Step 2: Role check with inline admin client (bypasses RLS for safety, no cookies)
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing env vars for admin client')
      }
      adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      console.log('Inline admin client created for update')
    } catch (adminErr) {
      console.error('Inline admin client creation failed for update:', adminErr)
      return { success: false, error: 'Server configuration error' }
    }

    const { data: profile, error: roleError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Admin role check result:', { profile: profile?.role, error: roleError?.message })

    if (roleError || !profile || profile.role !== 'admin') {
      console.log('Admin role verification failed:', profile?.role || 'no profile')
      return { success: false, error: 'Access denied: Admin role required' }
    }

    // Step 3: Prepare update data
    const updateData: any = { 
      status: newStatus,
      processed_by: user.id // Set the processor
    }

    if (newStatus === 'completed') {
      updateData.processed_at = new Date().toISOString()
    } else if (newStatus === 'rejected') {
      updateData.rejection_reason = null // Clear if previously set (consider adding reason param in future)
    }

    // Step 4: Update with admin client (full access)
    const { error } = await adminSupabase
      .from('withdrawals')
      .update(updateData)
      .eq('id', withdrawalId)

    if (error) {
      console.error('Update error:', error)
      return { success: false, error: error.message || 'Failed to update' }
    }

    console.log('Withdrawal status updated successfully:', { withdrawalId, newStatus })

    revalidatePath('/admin/withdrawals')
    return { success: true }
  } catch (error) {
    console.error('Error updating withdrawal status:', error)
    return { success: false, error: 'Failed to update status' }
  }
}