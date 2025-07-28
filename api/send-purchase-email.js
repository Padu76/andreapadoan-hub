// /api/send-purchase-email.js
// API per inviare email di acquisto dalla pagina success
// Andrea Padoan Ebooks - Bypass webhook

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { product, sessionId, productInfo } = req.body;

        console.log('📧 Sending purchase email for:', { product, sessionId });

        // Recupera dettagli sessione Stripe per ottenere email cliente
        const stripe = await import('stripe').then(module => new module.default(process.env.STRIPE_SECRET_KEY));
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        const customerEmail = session.customer_details?.email;
        if (!customerEmail) {
            return res.status(400).json({ error: 'Customer email not found' });
        }

        // Template email acquisto
        const emailTemplate = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Il tuo ebook è pronto!</title>
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
        .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
        .order-details { background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">🎉</div>
            <h1 style="margin: 0; font-size: 28px;">Pagamento Completato!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Il tuo ebook è pronto per il download</p>
        </div>
        
        <div class="content">
            <h2 style="color: #059669; margin-bottom: 20px;">Grazie per l'acquisto!</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Il pagamento è stato elaborato con successo. Ecco il tuo ebook <strong>"${productInfo.title}"</strong>!
            </p>
            
            <div class="order-details">
                <h3 style="color: #059669; margin-top: 0;">📋 Dettagli Ordine</h3>
                <p><strong>Prodotto:</strong> ${productInfo.title}</p>
                <p><strong>Descrizione:</strong> ${productInfo.description}</p>
                <p><strong>Ordine ID:</strong> ${sessionId}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://andreapadoan-hub.vercel.app${productInfo.downloadUrl}" class="download-btn">
                    📥 SCARICA IL TUO EBOOK
                </a>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">⚡ Download Immediato</h3>
                <p style="margin: 0; color: #856404;">
                    Puoi scaricare il tuo ebook <strong>immediatamente</strong> cliccando il bottone sopra. 
                    Il file sarà disponibile per 30 giorni.
                </p>
            </div>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h3 style="color: #059669; margin-top: 0;">📱 Supporto</h3>
                <p>Se hai problemi con il download o domande:</p>
                <p>📱 <strong>WhatsApp:</strong> <a href="https://wa.me/393478881515" style="color: #25d366;">+39 347 888 1515</a></p>
                <p>✉️ <strong>Email:</strong> <a href="mailto:andrea.padoan@gmail.com" style="color: #059669;">andrea.padoan@gmail.com</a></p>
            </div>
            
            <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <h3 style="color: #2563eb; margin-top: 0;">🚀 Scopri altri ebook</h3>
                <p style="margin-bottom: 15px;">Completa la tua collezione di fitness:</p>
                <a href="https://andreapadoan-hub.vercel.app/ebooks.html" style="color: #2563eb; text-decoration: none; font-weight: bold;">
                    👉 Vedi tutti i programmi
                </a>
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
                Email di conferma acquisto automatica.
            </p>
        </div>
    </div>
</body>
</html>`;

        // Invia email
        await resend.emails.send({
            from: 'Andrea Padoan <noreply@resend.dev>',
            to: customerEmail,
            subject: `🎉 Il tuo ebook "${productInfo.title}" è pronto!`,
            html: emailTemplate,
            tags: [
                { name: 'category', value: 'purchase' },
                { name: 'product', value: productInfo.title },
                { name: 'method', value: 'success-page' }
            ]
        });

        // Notifica Telegram
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            const message = `🎉 ACQUISTO COMPLETATO - EMAIL INVIATA!

📚 Prodotto: ${productInfo.title}
📧 Cliente: ${customerEmail}
💰 Ordine: ${sessionId}
🕐 Data: ${new Date().toLocaleString('it-IT')}

✅ Email automatica inviata dalla pagina success!`;

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message
                })
            });
        }

        console.log('✅ Purchase email sent to:', customerEmail);

        return res.status(200).json({ 
            success: true, 
            message: 'Email sent successfully',
            email: customerEmail 
        });

    } catch (error) {
        console.error('❌ Error sending purchase email:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to send email' 
        });
    }
}
