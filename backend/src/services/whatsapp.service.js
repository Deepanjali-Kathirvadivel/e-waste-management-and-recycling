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
  if (isReady && client) {
    const formattedNumber = phone.replace(/[^0-9]/g, '');
    const chatId = (formattedNumber.startsWith('91') ? '' : '91') + formattedNumber + '@c.us';

    const message = 'Green Era Recyclers\n\nYour OTP for deal verification is:\n\n' + otp + '\n\nPlease share this OTP with the staff member to complete your deal.\n\nThank you for recycling with Green Era!';

    try {
      await client.sendMessage(chatId, message);
      console.log('[WhatsApp] OTP sent to ' + phone);
      return true;
    } catch (err) {
      console.log('[WhatsApp] Failed to send OTP to ' + phone + ': ' + err.message);
    }
  } else {
    init(); // fire background init for QR setup, don't await
  }

  return false;
}

function getStatus() {
  return { ready: isReady, hasQR: !!qrCode, qrDataUrl: qrDataUrl };
}

module.exports = { init, sendOTP, getStatus };
