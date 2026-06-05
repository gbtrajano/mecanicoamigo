import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the Stripe subscription ID from the user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.stripe_subscription_id) {
      return new NextResponse('No active subscription found for this user', { status: 400 });
    }

    // Cancel the subscription at the end of the billing period
    const subscription = await stripe.subscriptions.update(userData.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ subscription });
  } catch (err) {
    console.error('Stripe cancel subscription error:', err);
    return new NextResponse(`Internal Error: ${err}`, { status: 500 });
  }
}