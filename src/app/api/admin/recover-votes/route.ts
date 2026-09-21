import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || secret.includes('your_paystack_secret_key')) {
      return NextResponse.json({ error: 'Paystack Secret Key is not configured' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    let recoveredCount = 0;
    let page = 1;
    let hasMore = true;

    // Fetch up to 10 pages (1000 transactions) to ensure we don't miss any recent ones
    while (hasMore && page <= 10) {
      const paystackRes = await fetch(`https://api.paystack.co/transaction?status=success&perPage=100&page=${page}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      
      if (!paystackRes.ok) {
        if (page === 1) return NextResponse.json({ error: 'Failed to communicate with Paystack' }, { status: 500 });
        break; // Stop fetching on error, but process what we have
      }

      const paystackData = await paystackRes.json();
      const transactions = paystackData.data || [];
      
      if (transactions.length === 0) break;

      for (const tx of transactions) {
        const { reference, amount, metadata, customer } = tx;

        // Ensure it's a vote transaction
        if (!metadata || !metadata.nominee_id || !metadata.quantity) continue;

        // Check if this reference already exists in our DB
        const { data: existingVote } = await supabaseAdmin.from('votes').select('id').eq('paystack_reference', reference).single();
        
        if (existingVote) continue; // Already processed!

        // Double check amount against expected cost
        const { data: settings } = await supabaseAdmin.from('event_settings').select('vote_cost_pesewas, double_voting').single();
        const expectedCost = (settings?.vote_cost_pesewas || 100) * metadata.quantity;

        if (amount < expectedCost) continue;

        const quantityToRecord = settings?.double_voting ? metadata.quantity * 2 : metadata.quantity;

        // Recover the missing vote!
        const { error: dbError } = await supabaseAdmin.from('votes').insert({
          nominee_id: metadata.nominee_id,
          category_id: metadata.category_id,
          voter_name: metadata.voter_name || 'Anonymous Recovery',
          voter_email: customer?.email || 'unknown@recovery.com',
          amount_pesewas: amount,
          quantity: quantityToRecord,
          paystack_reference: reference,
          payment_status: 'success',
          verified_at: new Date().toISOString()
        });

        if (!dbError) {
          recoveredCount += metadata.quantity;
        }
      }
      
      // Paystack pagination: meta.pageCount
      if (paystackData.meta && page >= paystackData.meta.pageCount) {
        hasMore = false;
      }
      page++;
    }

    return NextResponse.json({ success: true, recoveredCount });

  } catch (error) {
    console.error('Recover votes error:', error);
    return NextResponse.json({ error: 'Failed to recover votes' }, { status: 500 });
  }
}
