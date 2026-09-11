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

    // Split phone string by comma, slash, "&", "and" or whitespace if there are multiple
    const rawNumbers = phone.split(/[,/&]|\band\b/i).map(p => p.trim()).filter(Boolean);

    if (rawNumbers.length === 0) {
      return { success: false, error: 'No valid phone numbers found' };
    }

    const baseUrl = process.env.WHISTLEPULSE_BASE_URL || 'https://api.whistlepulse.com';
    const endpoint = `${baseUrl}/messages-api/single`;
    let hasError = false;
    let lastError = '';

    for (const rawPhone of rawNumbers) {
      // Format phone (e.g. 024... to 23324...)
      let formattedPhone = rawPhone.replace(/\s+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '233' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      }

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
        const errorMsg = data?.message || data?.error || response.statusText;
        console.error('Whistlepulse API Error for', formattedPhone, ':', data || response.statusText);
        hasError = true;
        lastError = `API Error (${formattedPhone}): ${response.status} - ${errorMsg}`;
      }
    }

    if (hasError && rawNumbers.length === 1) {
      return { success: false, error: lastError };
    } else if (hasError) {
      // Partial success if there are multiple numbers
      return { success: true, error: lastError }; // We'll return success true but maybe some failed
    }

    return { success: true };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
