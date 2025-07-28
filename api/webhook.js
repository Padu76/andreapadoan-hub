// /api/webhook.js
// Webhook Stripe per gestire pagamenti completati
// Andrea Padoan Ebooks - Versione corretta

import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verifica signature Stripe
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log('✅ Webhook signature verified');
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        // Gestisci eventi Stripe
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
                
            default:
                console.log(`🔔 Unhandled event type ${event.type}`);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
}

// Gestisce checkout completato
async function handleCheckoutCompleted(session) {
    try {
        console.log('🛒 Checkout completed:', session.id);

        const productId = session.metadata?.product_id;
        const customerEmail = session.customer_details?.email;

        if (!customerEmail || !productId) {
            console.log('⚠️ Missing email or product ID in session');
            return;
        }

        // Configurazione prodotti
        const products = {
            'wave-system': {
                title: 'IL WAVE SYSTEM',
                description: '6 cicli completi di allenamento progressivo',
                downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/wave-system.pdf',
                value: '14.90'
            },
            '2-milioni-anni': {
                title: 'In Forma da 2 Milioni di Anni',
                description: 'La guida alimentare per trasformare il tuo corpo',
                downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/forma-2-milioni-anni.pdf',
                value: '24.90'
            },
            'body-construction': {
                title: 'BODY UNDER CONSTRUCTION VOL: 1',
                description: '100 allenamenti per una forma perfetta 365 giorni all\'anno',
                downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/body-under-construction.pdf',
                value: '24.90'
            }
        };

        const product = products[productId];
        if (!product) {
            console.log('❌ Unknown product:', productId);
            return;
        }

        // Invia email con ebook
        await sendPurchaseEmail(customerEmail, product, session);

        // Notifica Telegram
        await sendTelegramNotification(customerEmail, product, session);

        console.log('✅ Purchase email sent to:', customerEmail);

    } catch (error) {
        console.error('❌ Error handling checkout completion:', error);
    }
}

// Gestisce pagamento riuscito
async function handlePaymentSucceeded(paymentIntent) {
    console.log('💳 Payment succeeded:', paymentIntent.id);
    // Aggiungere logica aggiuntiva se necessario
}

// Invia email di acquisto
async function sendPurchaseEmail(email, product, session) {
    try {
        const emailTemplate = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Il tuo ebook è pronto per il download!</title>
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
                Il pagamento è stato elaborato con successo. Ecco il tuo ebook <strong>"${product.title}"</strong>!
            </p>
            
            <div class="order-details">
                <h3 style="color: #059669; margin-top: 0;">📋 Dettagli Ordine</h3>
                <p><strong>Prodotto:</strong> ${product.title}</p>
                <p><strong>Descrizione:</strong> ${product.description}</p>
                <p><strong>Ordine ID:</strong> ${session.id}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${product.downloadUrl}" class="download-btn">
                    📥 SCARICA IL TUO EBOOK
                </a>
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
            
            <p style="font-size: 18px; font-weight: bold; color: #059669; text-align: center; margin-top: 40px;">
                Buon allenamento!<br>
                Andrea Padoan
            </p>
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

        await resend.emails.send({
            from: 'Andrea Padoan <noreply@resend.dev>',
            to: email,
            subject: `🎉 Il tuo ebook "${product.title}" è pronto!`,
            html: emailTemplate,
            tags: [
                { name: 'category', value: 'purchase' },
                { name: 'product', value: product.title }
            ]
        });

        console.log('✅ Purchase email sent via Resend');

    } catch (error) {
        console.error('❌ Error sending purchase email:', error);
    }
}

// Notifica Telegram
async function sendTelegramNotification(email, product, session) {
    try {
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            const message = `🎉 NUOVO ACQUISTO COMPLETATO!

📚 Prodotto: ${product.title}
📧 Cliente: ${email}
💰 Ordine: ${session.id}
🕐 Data: ${new Date().toLocaleString('it-IT')}

✅ Email di download inviata automaticamente!`;

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
    } catch (error) {
        console.error('⚠️ Telegram notification failed:', error);
    }
}

// Configurazione per raw body
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
}
