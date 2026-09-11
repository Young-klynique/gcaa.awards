'use server';

export async function sendNominationSMS(phone: string, name: string, code: string, categoryName: string) {
  try {
    const apiKey = process.env.WHISTLEPULSE_API_KEY;
    const senderId = process.env.WHISTLEPULSE_SENDER_ID || 'NASPA GCAA';
    
    if (!apiKey) {
      console.warn('Whistlepulse API Key not set. SMS not sent.');
      return { success: false, error: 'SMS API Key not configured' };
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

    const message = `Congratulations ${name}! You have been nominated for ${categoryName} at the NASPA GCAA Awards & Movie. Your official voting code is: ${code}. Share this with your supporters to vote for you!`;

    // The endpoint is POST /messages-api/single
    const baseUrl = process.env.WHISTLEPULSE_BASE_URL || 'https://api.whistlepulse.com';
    const endpoint = `${baseUrl}/messages-api/single`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
