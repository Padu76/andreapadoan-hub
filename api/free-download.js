// /api/free-download.js
// API senza dipendenze esterne - SEMPRE FUNZIONANTE
// Andrea Padoan Ebooks - Versione bulletproof

export default async function handler(req, res) {
    // Imposta CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Use POST method' 
        });
    }

    try {
        console.log('🎁 Free download API called - No dependencies version');

        const { email, product } = req.body;

        // Validazione input
        if (!email || !product) {
            console.log('❌ Missing email or product');
            return res.status(400).json({ 
                error: 'Email and product are required',
                received: { email: !!email, product: !!product }
            });
        }

        // Valida formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format:', email.substring(0, 5) + '***');
            return res.status(400).json({ 
                error: 'Invalid email format',
                email: email.substring(0, 5) + '***'
            });
        }

        // Solo 50-workout è gratuito
        if (product !== '50-workout') {
            console.log('❌ Product not free:', product);
            return res.status(400).json({ 
                error: 'This product is not free',
                product: product
            });
        }

        console.log('✅ Processing free download:', { 
            product, 
            email: email.substring(0, 5) + '***',
            timestamp: new Date().toISOString()
        });

        // Configurazione ebook
        const ebookInfo = {
            title: '50 WORKOUT da viaggio',
            filename: '50-workout-viaggio.pdf',
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            description: '50 allenamenti essenziali per mantenerti in forma ovunque tu sia.',
            value: '19.90'
        };

        // Salva richiesta per invio manuale
        const requestData = {
            email: email,
            product: product,
            timestamp: new Date().toISOString(),
            downloadUrl: ebookInfo.downloadUrl,
            userAgent: req.headers['user-agent'] || 'unknown',
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
        };

        // Invia notifica a te (opzionale)
        await sendNotificationToYou(requestData);

        console.log('✅ Free download request processed successfully');

        // Risposta di successo con link diretto
        return res.status(200).json({ 
            success: true, 
            message: 'Perfetto! Ecco il tuo ebook gratuito!',
            downloadUrl: ebookInfo.downloadUrl,
            email: email.substring(0, 5) + '***',
            instructions: [
                '📥 Clicca sul link qui sopra per scaricare subito',
                '📧 Ti invieremo anche una email di conferma a breve',
                '💪 Buon allenamento!'
            ],
            ebook: {
                title: ebookInfo.title,
                description: ebookInfo.description,
                value: `€${ebookInfo.value} - GRATIS per te!`,
                format: 'PDF',
                pages: '50+ pagine'
            }
        });

    } catch (error) {
        console.error('❌ Free download API error:', error);
        
        // Anche in caso di errore, restituiamo sempre il link
        return res.status(200).json({ 
            success: true,
            message: 'Ecco il link diretto per il tuo ebook gratuito!',
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            fallback: true,
            note: 'Link diretto sempre disponibile',
            instructions: [
                '📥 Clicca sul link per scaricare immediatamente',
                '🔄 Se il link non funziona, ricarica la pagina',
                '📞 Per supporto: WhatsApp +39 347 888 1515'
            ]
        });
    }
}

// Funzione per inviare notifica a te
async function sendNotificationToYou(requestData) {
    try {
        // Telegram notification (se configurato)
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            const message = `🎁 NUOVO DOWNLOAD GRATUITO

📚 Ebook: ${requestData.product}
📧 Email: ${requestData.email}
🕐 Ora: ${new Date(requestData.timestamp).toLocaleString('it-IT')}
🌍 IP: ${requestData.ip}

🔗 Link: ${requestData.downloadUrl}

👉 AZIONE: Invia email manuale a ${requestData.email}`;

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message
                })
            });

            console.log('✅ Telegram notification sent');
        }

        // Webhook generico (se configurato)
        if (process.env.WEBHOOK_URL) {
            await fetch(process.env.WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            console.log('✅ Webhook notification sent');
        }

    } catch (error) {
        console.error('⚠️ Notification failed (non-critical):', error.message);
        // Non bloccare il processo principale
    }
}

// Test endpoint semplice
export async function GET(req, res) {
    return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Free download API is working perfectly',
        methods: ['POST'],
        version: '3.0 - No Dependencies'
    });
}