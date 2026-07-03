const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8010;

// Initialize WhatsApp Client with Local Auth for persistent sessions
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

let isReady = false;

client.on('qr', (qr) => {
  console.log('======================================================================');
  console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP APP TO LOG IN:');
  console.log('======================================================================');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp Client is ready and authenticated!');
  isReady = true;
});

client.on('auth_failure', (msg) => {
  console.error('WhatsApp Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp Client was disconnected:', reason);
  isReady = false;
  // Attempt to re-initialize
  client.initialize();
});

// API status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: isReady ? 'connected' : 'disconnected',
    message: isReady ? 'WhatsApp client is authenticated and ready' : 'WhatsApp client is not ready'
  });
});

// API endpoint to send a message
app.post('/send-message', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Missing phone or message parameter' });
  }

  if (!isReady) {
    return res.status(503).json({ success: false, error: 'WhatsApp client is not authenticated or ready yet' });
  }

  try {
    // Format the phone number to match WhatsApp requirement: 628xxxxxxxx@c.us
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    
    // Convert 0812xxx to 62812xxx
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    
    // Append the standard suffix
    if (!formattedPhone.endsWith('@c.us')) {
      formattedPhone = formattedPhone + '@c.us';
    }

    console.log(`Sending message to ${formattedPhone}...`);
    const response = await client.sendMessage(formattedPhone, message);
    
    res.json({ success: true, messageId: response.id.id });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize client
client.initialize();

app.listen(PORT, () => {
  console.log(`WhatsApp integration service running on port ${PORT}`);
});
