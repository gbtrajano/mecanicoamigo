import { getSupabaseAdmin } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

/**
 * Synchronizes subscription status from Stripe to Supabase for all users that have a Stripe subscription ID.
 * This function is intended to be run periodically (e.g., hourly) via a cron job.
 */
async function syncStripeSubscriptions() {
  console.log('[Stripe Sync] Starting subscription synchronization...');

  const supabase = getSupabaseAdmin();

  // Fetch all users that have a stripe_subscription_id (not null)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, stripe_subscription_id, stripe_customer_id')
    .not('stripe_subscription_id', 'is', null);

  if (usersError) {
    console.error('[Stripe Sync] Error fetching users:', usersError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('[Stripe Sync] No users with Stripe subscriptions found.');
    return;
  }

  console.log(`[Stripe Sync] Found ${users.length} users with Stripe subscriptions.`);

  for (const user of users) {
    const { id, stripe_subscription_id } = user;

    if (!stripe_subscription_id) {
      continue;
    }

    try {
      // Retrieve the subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);

      // Determine the status to store in our database
      let status: string = 'active'; // default
      switch (subscription.status) {
        case 'active':
          status = 'active';
          break;
        case 'past_due':
          status = 'past_due';
          break;
        case 'unpaid':
          status = 'past_due'; // treat as past_due
          break;
        case 'canceled':
          status = 'canceled';
          break;
        case 'incomplete':
          status = 'incomplete';
          break;
        case 'incomplete_expired':
          status = 'incomplete_expired';
          break;
        case 'trialing':
          status = 'trialing';
          break;
        case 'paused':
          status = 'paused';
          break;
        default:
          status = subscription.status;
      }

      // Update the user's subscription status in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: status,
          // Optionally, we could update the current period end if we want to display it
          // For now, we just keep the status.
        })
        .eq('id', id);

      if (updateError) {
        console.error(`[Stripe Sync] Error updating subscription status for user ${id}:`, updateError);
      } else {
        console.log(`[Stripe Sync] Updated subscription status for user ${id} to ${status}`);
      }
    } catch (err) {
      console.error(`[Stripe Sync] Error processing subscription for user ${id}:`, err);
    }
  }

  console.log('[Stripe Sync] Subscription synchronization completed.');
}

// Run the synchronization
syncStripeSubscriptions().catch((err) => {
  console.error('[Stripe Sync] Fatal error:', err);
  process.exit(1);
});