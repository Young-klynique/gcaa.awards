import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || secret.includes('your_paystack_secret_key')) {
      return NextResponse.json({ error: 'Paystack Secret Key is not configured' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Fetch successful transactions from Paystack (fetch last 100)
    const paystackRes = await fetch('https://api.paystack.co/transaction?status=success&perPage=100', {
      headers: { Authorization: `Bearer ${secret}` },
    });
    
    if (!paystackRes.ok) {
      return NextResponse.json({ error: 'Failed to communicate with Paystack' }, { status: 500 });
    }

    const paystackData = await paystackRes.json();
    const transactions = paystackData.data || [];

    let recoveredCount = 0;

    for (const tx of transactions) {
      const { reference, amount, metadata, customer } = tx;

      // Ensure it's a vote transaction
      if (!metadata || !metadata.nominee_id || !metadata.quantity) continue;

      // Check if this reference already exists in our DB
      const { data: existingVote } = await supabaseAdmin.from('votes').select('id').eq('paystack_reference', reference).single();
      
      if (existingVote) continue; // Already processed!

      // Double check amount against expected cost
      const { data: settings } = await supabaseAdmin.from('event_settings').select('vote_cost_pesewas').single();
      const expectedCost = (settings?.vote_cost_pesewas || 100) * metadata.quantity;

      if (amount < expectedCost) continue;

      // Recover the missing vote!
      const { error: dbError } = await supabaseAdmin.from('votes').insert({
        nominee_id: metadata.nominee_id,
        category_id: metadata.category_id,
        voter_name: metadata.voter_name || 'Anonymous Recovery',
        voter_email: customer?.email || 'unknown@recovery.com',
        amount_pesewas: amount,
        quantity: metadata.quantity,
        paystack_reference: reference,
        payment_status: 'success',
        verified_at: new Date().toISOString()
      });

      if (!dbError) {
        recoveredCount += metadata.quantity;
      }
    }

    return NextResponse.json({ success: true, recoveredCount });

  } catch (error) {
    console.error('Recover votes error:', error);
    return NextResponse.json({ error: 'Failed to recover votes' }, { status: 500 });
  }
}
