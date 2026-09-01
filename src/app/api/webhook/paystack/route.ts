import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const expectedSignature = crypto.createHmac('sha512', secret).update(body).digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      
      // Extract metadata sent during checkout
      const metadata = data.metadata || {};
      const nominee_id = metadata.nominee_id;
      const category_id = metadata.category_id;
      const quantity = metadata.quantity || 1;
      const voter_name = metadata.voter_name;
      const voter_email = data.customer.email;
      const amountPaid = data.amount;

      if (!nominee_id || !category_id) {
        return NextResponse.json({ status: 'ok', message: 'No metadata found' });
      }

      const supabaseAdmin = createAdminClient();

      // Check if vote already recorded (via client verify)
      const { data: existingVote } = await supabaseAdmin
        .from('votes')
        .select('id')
        .eq('paystack_reference', reference)
        .single();

      if (!existingVote) {
        // Record it via webhook fallback
        await supabaseAdmin.from('votes').insert({
          nominee_id,
          category_id,
          voter_name,
          voter_email,
          amount_pesewas: amountPaid,
          quantity,
          paystack_reference: reference,
          payment_status: 'success',
          verified_at: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
