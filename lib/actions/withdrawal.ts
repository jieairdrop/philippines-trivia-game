'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Action returns { success: boolean, error?: string } for useActionState
export async function submitWithdrawal(_prevState: { success: boolean; error?: string }, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return { success: false, error: 'Authentication failed. Please log in again.' };
    }

    const user_id = formData.get('user_id') as string;
    const payment_method = formData.get('payment_method') as 'gcash' | 'paypal' | 'crypto';
    const points_deducted_str = formData.get('points_deducted') as string;
    const payment_details_str = formData.get('payment_details') as string;

    if (!payment_details_str.trim()) {
      return { success: false, error: 'Please enter your payment details' };
    }

    const points_deducted = parseInt(points_deducted_str);
    if (isNaN(points_deducted) || points_deducted <= 0) {
      return { success: false, error: 'Invalid points amount' };
    }

    // Prevent duplicates
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentWithdrawal } = await supabase
      .from('withdrawals')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .gte('requested_at', fiveMinAgo)
      .limit(1)
      .single();

    if (recentWithdrawal) {
      return { success: false, error: 'A pending withdrawal request is already in progress. Please wait 5 minutes and try again.' };
    }

    // Validation
    const { data: stats } = await supabase
      .from('user_withdrawal_stats')
      .select('available_points')
      .eq('user_id', user_id)
      .single();
    const available = stats?.available_points || 0;

    const MIN_WITHDRAWAL_POINTS = 500;
    if (points_deducted < MIN_WITHDRAWAL_POINTS) {
      return { success: false, error: `Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} points` };
    }
    if (points_deducted > available) {
      console.error(`Withdrawal rejected: User ${user_id} requested ${points_deducted}, but only ${available} available`);
      return { success: false, error: `Insufficient points available (only ${available} available)` };
    }

    const amount = (points_deducted / 100).toFixed(2);
    const payment_details = { [payment_method]: payment_details_str };

    const { error: insertError } = await supabase
      .from('withdrawals')
      .insert({
        user_id,
        amount,
        points_deducted,
        payment_method,
        payment_details,
        status: 'pending'
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: 'Database error. Please try again.' };
    }

    console.log(`Withdrawal success: User ${user_id}, ${points_deducted} points`);
    revalidatePath('/player/withdrawals');
    return { success: true };  // Success state
  } catch (err) {
    console.error('Unexpected error in submitWithdrawal:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
