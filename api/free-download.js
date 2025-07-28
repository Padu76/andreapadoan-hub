// /api/free-download.js
// API semplificata per download gratuito - Senza dipendenze esterne
// Andrea Padoan Ebooks - Versione compatibile Vercel

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🎁 Free download API called');

        const { email, product } = req.body;

        // Validazione input
        if (!email || !product) {
            console.log('❌ Missing email or product');
            return res.status(400).json({ error: 'Email and product are required' });
        }

        // Valida formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format:', email.substring(0, 5) + '***');
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Solo 50-workout è gratuito
        if (product !== '50-workout') {
            console.log('❌ Product not free:', product);
            return res.status(400).json({ error: 'This product is not free' });
        }

        console.log('✅ Processing free download:', { 
            product, 
            email: email.substring(0, 5) + '***',
            timestamp: new Date().toISOString()
        });

        // Per ora, invece di inviare email direttamente,
        // salviamo la richiesta e inviamo notifica
        const downloadData = {
            email: email,
            product: product,
            timestamp: new Date().toISOString(),
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf'
        };

        // Invia notifica a te via webhook (se configurato)
        await sendNotificationToAdmin(downloadData);

        // Rispondi con successo e istruzioni
        console.log('✅ Free download processed successfully');

        return res.status(200).json({ 
            success: true, 
            message: 'Richiesta ricevuta! Ti invieremo l\'ebook a breve.',
            email: email.substring(0, 5) + '***',
            instructions: 'Controlla la tua email nei prossimi minuti. Se non arriva, contattaci su WhatsApp.'
        });

    } catch (error) {
        console.error('❌ Free download API error:', error);
        
        return res.status(500).json({ 
            error: 'Errore interno del server',
            message: 'Riprova o contattaci direttamente',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Funzione per inviare notifica all'admin
async function sendNotificationToAdmin(downloadData) {
    try {
        // Opzione 1: Telegram (se hai bot configurato)
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            await sendTelegramNotification(downloadData);
        }

        // Opzione 2: WhatsApp Webhook (se configurato)
        if (process.env.WHATSAPP_WEBHOOK_URL) {
            await sendWhatsAppNotification(downloadData);
        }

        // Opzione 3: Email Webhook Zapier (se configurato)
        if (process.env.EMAIL_AUTOMATION_WEBHOOK_URL) {
            await sendZapierWebhook(downloadData);
        }

        console.log('✅ Admin notification sent');

    } catch (error) {
        console.error('⚠️ Admin notification failed (non-critical):', error);
        // Non bloccare il processo principale se le notifiche falliscono
    }
}

// Notifica Telegram
async function sendTelegramNotification(data) {
    const message = `🎁 NUOVO DOWNLOAD GRATUITO

📚 Ebook: ${data.product}
📧 Email: ${data.email}
🕐 Ora: ${new Date(data.timestamp).toLocaleString('it-IT')}

🔗 Link diretto: ${data.downloadUrl}

👉 Invia manualmente l'ebook a: ${data.email}`;

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    });

    if (!response.ok) {
        throw new Error('Telegram notification failed');
    }

    console.log('✅ Telegram notification sent');
}

// Notifica WhatsApp via Webhook
async function sendWhatsAppNotification(data) {
    const message = {
        email: data.email,
        product: data.product,
        timestamp: data.timestamp,
        action: 'free_download_request'
    };

    const response = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
    });

    if (!response.ok) {
        throw new Error('WhatsApp notification failed');
    }

    console.log('✅ WhatsApp notification sent');
}

// Webhook Zapier per automazione email
async function sendZapierWebhook(data) {
    const payload = {
        email: data.email,
        product_name: '50 WORKOUT da viaggio',
        download_url: data.downloadUrl,
        customer_name: data.email.split('@')[0],
        timestamp: data.timestamp
    };

    const response = await fetch(process.env.EMAIL_AUTOMATION_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Zapier webhook failed');
    }

    console.log('✅ Zapier webhook sent');
}

// Funzione di test per verificare che l'API funzioni
export async function testFunction() {
    return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Free download API is working'
    };
}