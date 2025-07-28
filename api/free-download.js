// /api/free-download.js
// API con Resend per email automatiche
// Andrea Padoan Ebooks - Versione finale automatica

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🎁 Free download API - Resend version');

        const { email, product } = req.body;

        // Validazione
        if (!email || !product) {
            return res.status(400).json({ error: 'Email and product required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (product !== '50-workout') {
            return res.status(400).json({ error: 'Product not free' });
        }

        console.log('✅ Processing:', { product, email: email.substring(0, 5) + '***' });

        // Configurazione ebook
        const ebookInfo = {
            title: '50 WORKOUT da viaggio',
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            description: '50 allenamenti essenziali per mantenerti in forma ovunque tu sia.',
            value: '19.90'
        };

        // INVIO EMAIL AUTOMATICO
        try {
            const emailResult = await resend.emails.send({
                from: 'Andrea Padoan <noreply@resend.dev>',
                to: email,
                subject: `🎁 Il tuo ebook GRATUITO "${ebookInfo.title}" è pronto!`,
                html: createEmailTemplate(ebookInfo),
                tags: [
                    { name: 'category', value: 'free-ebook' },
                    { name: 'product', value: '50-workout' }
                ]
            });

            console.log('✅ Email sent via Resend:', emailResult.data?.id);

            // Notifica Telegram (opzionale)
            await sendTelegramNotification(email, ebookInfo);

            // Risposta successo
            return res.status(200).json({
                success: true,
                message: 'Email inviata con successo! Controlla la tua casella.',
                downloadUrl: ebookInfo.downloadUrl,
                email: email.substring(0, 5) + '***',
                emailId: emailResult.data?.id
            });

        } catch (emailError) {
            console.error('❌ Resend email failed:', emailError);

            // Fallback: link diretto se email fallisce
            return res.status(200).json({
                success: true,
                message: 'Ecco il link diretto per il tuo ebook!',
                downloadUrl: ebookInfo.downloadUrl,
                fallback: true,
                note: 'Email temporaneamente non disponibile, usa il link diretto'
            });
        }

    } catch (error) {
        console.error('❌ API Error:', error);

        // Fallback finale
        return res.status(200).json({
            success: true,
            message: 'Link diretto al tuo ebook gratuito:',
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            fallback: true
        });
    }
}

// Template email HTML
function createEmailTemplate(ebookInfo) {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Il tuo ebook gratuito è pronto!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .download-btn { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 18px 35px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 25px 0;
        }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; padding: 20px; border-top: 1px solid #eee; }
        .gift { font-size: 48px; text-align: center; margin: 20px 0; }
        .value-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        .feature-box { background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; }
        .cta-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; }
        .contact-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="gift">🎁</div>
            <h1 style="margin: 0; font-size: 28px;">Il Tuo Ebook Gratuito è Pronto!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Un regalo speciale da Andrea Padoan</p>
        </div>
        
        <div class="content">
            <h2 style="color: #059669; margin-bottom: 20px;">Ciao!</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Grazie per aver richiesto il mio ebook gratuito <strong>"${ebookInfo.title}"</strong>!
            </p>
            
            <div class="value-badge">
                🏷️ Valore: €${ebookInfo.value} - OMAGGIO PER TE!
            </div>
            
            <p style="font-size: 16px; margin: 20px 0;">
                ${ebookInfo.description}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${ebookInfo.downloadUrl}" class="download-btn">
                    📥 SCARICA GRATIS ORA!
                </a>
            </div>
            
            <div class="feature-box">
                <h3 style="color: #059669; margin-top: 0;">🏋️‍♂️ Cosa troverai nell'ebook:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>15 workout</strong> per hotel e spazi ristretti</li>
                    <li><strong>10 allenamenti</strong> per la spiaggia e outdoor</li>
                    <li><strong>10 routine</strong> per parchi pubblici</li>
                    <li><strong>5 esercizi discreti</strong> durante i viaggi</li>
                    <li><strong>10 workout lampo</strong> da 15 minuti</li>
                    <li><strong>Guida completa</strong> per ogni livello di fitness</li>
                </ul>
            </div>
            
            <div class="cta-box">
                <h3 style="color: #2563eb; margin-top: 0;">🚀 Ti è piaciuto questo contenuto?</h3>
                <p style="margin-bottom: 15px;">Scopri i miei programmi premium completi per trasformare il tuo corpo:</p>
                <a href="https://andreapadoan-hub.vercel.app/ebooks.html" style="color: #2563eb; text-decoration: none; font-weight: bold; font-size: 16px;">
                    👉 VEDI TUTTI I MIEI EBOOK PREMIUM
                </a>
            </div>
            
            <div class="contact-box">
                <h3 style="color: #059669; margin-top: 0;">📞 Hai domande o vuoi consigli personalizzati?</h3>
                <p style="margin-bottom: 10px;"><strong>Contattami direttamente:</strong></p>
                <p style="margin: 5px 0;">
                    📱 <strong>WhatsApp:</strong> 
                    <a href="https://wa.me/393478881515" style="color: #25d366; text-decoration: none; font-weight: bold;">
                        +39 347 888 1515
                    </a>
                </p>
                <p style="margin: 5px 0;">
                    ✉️ <strong>Email:</strong> 
                    <a href="mailto:andrea.padoan@gmail.com" style="color: #059669; text-decoration: none;">
                        andrea.padoan@gmail.com
                    </a>
                </p>
                <p style="margin: 15px 0 5px 0;">
                    🌐 <strong>Sito web:</strong> 
                    <a href="https://www.personaltrainerverona.it" style="color: #2563eb; text-decoration: none;">
                        www.personaltrainerverona.it
                    </a>
                </p>
            </div>
            
            <div style="border-left: 4px solid #10b981; padding-left: 20px; margin: 30px 0; background: #f0fdf4; padding: 20px;">
                <p style="margin: 0; font-style: italic; color: #059669;">
                    💪 <strong>Questo ebook rappresenta anni di esperienza nel fitness e personal training.</strong> 
                    Sono sicuro che ti aiuterà a mantenerti in forma ovunque tu sia!
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <p style="font-size: 18px; font-weight: bold; color: #059669;">Buon allenamento!</p>
                <p style="font-size: 20px; font-weight: bold; color: #059669; margin: 10px 0;">Andrea Padoan</p>
                <p style="font-style: italic; color: #666; margin: 0;">Personal Trainer Certificato</p>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 Andrea Padoan Personal Trainer. Tutti i diritti riservati.</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                Hai ricevuto questa email perché hai richiesto il nostro ebook gratuito su 
                <a href="https://andreapadoan-hub.vercel.app" style="color: #059669;">andreapadoan-hub.vercel.app</a>
            </p>
        </div>
    </div>
</body>
</html>`;
}

// Notifica Telegram opzionale
async function sendTelegramNotification(email, ebookInfo) {
    try {
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            const message = `✅ EMAIL AUTOMATICA INVIATA

📚 Ebook: ${ebookInfo.title}
📧 Email: ${email}
🕐 Ora: ${new Date().toLocaleString('it-IT')}

🎯 Sistema completamente automatico funzionante!`;

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message
                })
            });
        }
    } catch (error) {
        console.error('⚠️ Telegram notification failed:', error);
    }
}
