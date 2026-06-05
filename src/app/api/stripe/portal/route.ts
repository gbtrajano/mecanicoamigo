import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the Stripe customer ID from the user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return new NextResponse('No Stripe customer found for this user', { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      // URL to redirect to after the user leaves the portal
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/gerenciar-assinatura`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return new NextResponse(`Internal Error: ${err}`, { status: 500 });
  }
}