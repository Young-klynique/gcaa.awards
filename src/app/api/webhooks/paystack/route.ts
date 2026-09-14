import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { reference, amount, metadata, customer } = event.data;
      
      if (!metadata || !metadata.nominee_id || !metadata.quantity) {
        return NextResponse.json({ success: true, message: 'No vote metadata found' });
      }

      const supabaseAdmin = createAdminClient();
      const { data: settings } = await supabaseAdmin.from('event_settings').select('vote_cost_pesewas').single();
      const expectedCost = (settings?.vote_cost_pesewas || 100) * metadata.quantity;

      if (amount < expectedCost) {
         console.error(`Webhook amount mismatch: Paid ${amount}, Expected ${expectedCost}`);
         return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      const { error: dbError } = await supabaseAdmin.from('votes').insert({
        nominee_id: metadata.nominee_id,
        category_id: metadata.category_id,
        voter_name: metadata.voter_name || 'Anonymous Webhook',
        voter_email: customer?.email || 'unknown@webhook.com',
        amount_pesewas: amount,
        quantity: metadata.quantity,
        paystack_reference: reference,
        payment_status: 'success',
        verified_at: new Date().toISOString()
      });

      if (dbError) {
        if (dbError.code === '23505') {
           return NextResponse.json({ success: true, message: 'Already recorded by frontend' });
        }
        console.error('Webhook DB Error:', dbError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      
      console.log(`Webhook successfully recovered ${metadata.quantity} votes for ref ${reference}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
