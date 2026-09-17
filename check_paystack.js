require('dotenv').config({ path: '.env.local' });
const secret = process.env.PAYSTACK_SECRET_KEY;
fetch('https://api.paystack.co/transaction?status=success&perPage=50', {
  headers: { Authorization: `Bearer ${secret}` }
})
.then(r => r.json())
.then(data => {
  if (!data.data) {
    console.log("No data returned:", data);
    return;
  }
  const txs = data.data.map(tx => ({
    ref: tx.reference,
    amount: tx.amount,
    date: tx.created_at,
    customer: tx.customer?.email,
    metadata: tx.metadata
  }));
  console.log(JSON.stringify(txs, null, 2));
})
.catch(console.error);
