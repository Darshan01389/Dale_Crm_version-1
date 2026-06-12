const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

let currentQRUrl = null;
let clientStatus = 'initializing'; // initializing, qr_ready, authenticated, ready, disconnected

console.log('Initializing WhatsApp Web Client...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log('QR Code generated. Waiting for scan...');
    clientStatus = 'qr_ready';
    try {
        currentQRUrl = await qrcode.toDataURL(qr);
    } catch (err) {
        console.error('Failed to generate QR Code Data URL', err);
    }
});

client.on('authenticated', () => {
    console.log('WhatsApp Web Authenticated!');
    clientStatus = 'authenticated';
    currentQRUrl = null; // Clear QR code as it's no longer needed
});

client.on('ready', () => {
    console.log('WhatsApp Web Client is Ready!');
    clientStatus = 'ready';
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Web Client was disconnected:', reason);
    clientStatus = 'disconnected';
    currentQRUrl = null;
    // Attempt to re-initialize after disconnect
    client.initialize();
});

client.initialize();

// Endpoint to get the current QR code
app.get('/qr', (req, res) => {
    if (clientStatus === 'ready') {
        return res.json({ status: 'ready', message: 'Client is already connected.' });
    }
    if (clientStatus === 'qr_ready' && currentQRUrl) {
        return res.json({ status: 'qr_ready', qrCodeDataUrl: currentQRUrl });
    }
    return res.json({ status: clientStatus, message: 'QR code not available yet.' });
});

// Endpoint to get connection status
app.get('/status', (req, res) => {
    res.json({ status: clientStatus });
});

// Endpoint to send a message
app.post('/send-message', async (req, res) => {
    const { to, message } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({ error: 'Missing "to" or "message" in request body.' });
    }

    if (clientStatus !== 'ready') {
        return res.status(503).json({ error: 'WhatsApp client is not ready. Current status: ' + clientStatus });
    }

    try {
        // WhatsApp ID format: number@c.us
        // Strip out any non-numeric characters from the phone number
        const cleanNumber = to.replace(/\D/g, '');
        const chatId = `${cleanNumber}@c.us`;
        
        await client.sendMessage(chatId, message);
        console.log(`Message sent to ${cleanNumber}`);
        res.json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message.', details: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp Gateway microservice listening on port ${PORT}`);
});
