'use server';

export async function sendSMS(phone: string, message: string) {
  try {
    const apiKey = process.env.WHISTLEPULSE_API_KEY;
    const senderId = process.env.WHISTLEPULSE_SENDER_ID || 'NASPA GCAA';
    
    const accountId = process.env.WHISTLEPULSE_ACCOUNT_ID;
    
    if (!apiKey || !accountId) {
      console.warn('Whistlepulse API Key or Account ID not set. SMS not sent.');
      return { success: false, error: 'SMS credentials not configured (Missing API Key or Account ID)' };
    }

    if (!phone) {
      return { success: false, error: 'No phone number provided' };
    }

    // Format phone (e.g. 024... to 23324...)
    let formattedPhone = phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // The endpoint based on updated docs
    const baseUrl = process.env.WHISTLEPULSE_BASE_URL || 'https://api.whistlepulse.com/api';
    const endpoint = `${baseUrl}/messages-api/single`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-account-id': accountId,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        senderName: senderId,
        recipient: formattedPhone,
        message: message,
        type: 0 // Normal text SMS
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && data.success === false)) {
      console.error('Whistlepulse API Error:', data || response.statusText);
      return { success: false, error: 'Failed to send SMS' };
    }

    return { success: true };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
