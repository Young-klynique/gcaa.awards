import { NextResponse } from 'next/val';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { reference, nominee_id, category_id, quantity, voter_email, voter_name } = await request.json();

    if (!reference || !nominee_id || !quantity || !voter_email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify payment with Paystack server-side
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: 'Payment verification failed at Paystack' }, { status: 400 });
    }

    const amountPaid = paystackData.data.amount; // in pesewas
    
    // 2. Double check event settings for expected cost
    const supabaseAdmin = createAdminClient();
    const { data: settings } = await supabaseAdmin.from('event_settings').select('vote_cost_pesewas').single();
    const expectedCost = (settings?.vote_cost_pesewas || 300) * quantity;

    if (amountPaid < expectedCost) {
       return NextResponse.json({ success: false, error: 'Payment amount mismatch' }, { status: 400 });
    }

    // 3. Record the vote in DB
    // The DB trigger `on_vote_verified` will automatically update the nominee's `vote_count`
    const { error: dbError } = await supabaseAdmin.from('votes').insert({
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

    if (dbError) {
      // If it's a unique constraint violation on reference, it means webhook or double-click already processed it. That's fine.
      if (dbError.code === '23505') {
         return NextResponse.json({ success: true, message: 'Vote already recorded' });
      }
      console.error('DB Error recording vote:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to record vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
