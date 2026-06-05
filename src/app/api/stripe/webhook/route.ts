import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

export async function POST(request: Request) {
  const buf = await request.text();
  const sig = request.headers.get('stripe-signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`⚠️  Webhook signature verification failed.`, errorMessage);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id as string;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      const supabase = await createClient();
      // Update user with Stripe IDs and set subscription active
      const { error } = await supabase
        .from('users')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          subscription_start: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user subscription after checkout:', error);
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) {
        // If no subscription, maybe it's a one-time invoice; we ignore.
        break;
      }
      const supabase = await createClient();
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating user subscription after successful invoice:', error);
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const subscriptionId = invoice.subscription as string | null;
      if (!subscriptionId) {
        break;
      }
      const supabase = await createClient();
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'past_due',
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating user subscription after failed invoice:', error);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const supabase = await createClient();
      // Determine status from Stripe subscription
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

      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: status,
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating user subscription after subscription update:', error);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const supabase = await createClient();
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating user subscription after subscription deletion:', error);
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}