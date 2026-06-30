const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const QRCode = require('qrcode');

let client = null;
let isReady = false;
let qrCode = null;
let qrDataUrl = null;
let initPromise = null;

function init() {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('[WhatsApp] Init timeout (10s) — falling back to console SMS');
      isReady = false;
      resolve(false);
    }, 10000);

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '..', '..', '.wwebjs_auth'),
      }),
      puppeteer: {
        headless: true,
        executablePath: 'C:\\Users\\Deepa\\.cache\\puppeteer\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    client.on('qr', async (qr) => {
      qrCode = qr;
      try {
        qrDataUrl = await QRCode.toDataURL(qr);
      } catch (e) {
        qrDataUrl = null;
      }
      console.log('========================================');
      console.log('  WhatsApp QR Code received!');
      console.log('  Scan the QR code with WhatsApp to');
      console.log('  enable WhatsApp OTP delivery.');
      console.log('  GET /api/whatsapp-status for QR image');
      console.log('========================================');
    });

    client.on('ready', () => {
      clearTimeout(timeout);
      isReady = true;
      qrCode = null;
      qrDataUrl = null;
      console.log('[WhatsApp] Client is ready! OTPs will be sent via WhatsApp.');
      resolve(true);
    });

    client.on('disconnected', (reason) => {
      isReady = false;
      console.log('[WhatsApp] Client disconnected:', reason);
    });

    client.on('auth_failure', (msg) => {
      console.log('[WhatsApp] Auth failure:', msg);
      isReady = false;
    });

    client.initialize().catch((err) => {
      clearTimeout(timeout);
      console.log('[WhatsApp] Failed to initialize:', err.message);
      console.log('[WhatsApp] WhatsApp OTP delivery will not be available.');
      isReady = false;
      resolve(false);
    });
  });

  return initPromise;
}

async function sendOTP(phone, otp) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (token && phoneNumberId) {
    const formattedNumber = phone.replace(/[^0-9]/g, '');
    const to = (formattedNumber.length === 10 ? '91' : '') + formattedNumber;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'otp';
    const languageCode = process.env.WHATSAPP_TEMPLATE_LANG || 'en';

    console.log(`[Meta WhatsApp Cloud API] Attempting to send OTP to ${to} via template "${templateName}"`);

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otp
              }
            ]
          }
        ]
      }
    };

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let responseData = {};
      try { responseData = JSON.parse(responseText); } catch(e) {}

      if (response.ok) {
        console.log(`[Meta WhatsApp Cloud API] OTP successfully sent to ${to}. Message ID: ${responseData.messages?.[0]?.id}`);
        return true;
      } else {
        console.error(`[Meta WhatsApp Cloud API] Template failed, trying text fallback. Details:`, responseText);
        
        const textPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: `Green Era Recyclers\n\nYour OTP for deal verification is:\n\n${otp}\n\nPlease share this OTP with the staff member to complete your deal.\n\nThank you for recycling with Green Era!`
          }
        };

        const textResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(textPayload)
        });

        const textResponseText = await textResponse.text();
        if (textResponse.ok) {
          console.log(`[Meta WhatsApp Cloud API] OTP successfully sent to ${to} via text message fallback.`);
          return true;
        } else {
          console.error(`[Meta WhatsApp Cloud API] Text message fallback also failed:`, textResponseText);
        }
      }
    } catch (err) {
      console.error(`[Meta WhatsApp Cloud API] Connection error:`, err.message);
    }
  }

  // Fallback to whatsapp-web.js
  if (isReady && client) {
    const formattedNumber = phone.replace(/[^0-9]/g, '');
    const chatId = (formattedNumber.startsWith('91') ? '' : '91') + formattedNumber + '@c.us';

    const message = 'Green Era Recyclers\n\nYour OTP for deal verification is:\n\n' + otp + '\n\nPlease share this OTP with the staff member to complete your deal.\n\nThank you for recycling with Green Era!';

    try {
      await client.sendMessage(chatId, message);
      console.log('[WhatsApp Web] OTP sent to ' + phone);
      return true;
    } catch (err) {
      console.log('[WhatsApp Web] Failed to send OTP to ' + phone + ': ' + err.message);
    }
  } else {
    if (!token || !phoneNumberId) {
      init(); // fire background init for QR setup, don't await
    }
  }

  return false;
}

function getStatus() {
  return { ready: isReady, hasQR: !!qrCode, qrDataUrl: qrDataUrl };
}

module.exports = { init, sendOTP, getStatus };
