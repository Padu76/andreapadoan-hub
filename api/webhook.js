// /api/webhook.js
// Webhook Stripe FIXATO per gestire pagamenti ebook
// Andrea Padoan - Fix per errori HTTP e signature verification

import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// CONFIGURAZIONE CRITICA: Raw body per signature verification
export const config = {
    api: {
        bodyParser: false, // DISABILITA parsing automatico
    },
}

export default async function handler(req, res) {
    // Sempre rispondere con status valido per evitare retry Stripe
    try {
        // Solo POST requests
        if (req.method !== 'POST') {
            console.log('❌ Method not allowed:', req.method);
            return res.status(200).json({ error: 'Method not allowed', received: false });
        }

        // Leggi raw body correttamente
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks);

        const signature = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        // Verifica signature Stripe
        let event;
        try {
            if (!signature || !endpointSecret) {
                console.error('❌ Missing Stripe signature or endpoint secret');
                return res.status(200).json({ 
                    error: 'Missing signature', 
                    received: false 
                });
            }

            event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                endpointSecret
            );

            console.log('✅ Webhook signature verified:', {
                type: event.type,
                id: event.id,
                livemode: event.livemode
            });

        } catch (err) {
            console.error('❌ Webhook signature verification failed:', err.message);
            // Anche in caso di errore, rispondo 200 per evitare retry infiniti
            return res.status(200).json({ 
                error: 'Invalid signature', 
                received: false,
                details: err.message 
            });
        }

        // Processa eventi Stripe
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutCompleted(event.data.object);
                    break;
                
                case 'payment_intent.succeeded':
                    await handlePaymentSucceeded(event.data.object);
                    break;
                    
                default:
                    console.log('ℹ️ Unhandled event type:', event.type);
            }

            // SEMPRE rispondere 200 per confermare ricezione
            return res.status(200).json({ 
                received: true, 
                eventType: event.type,
                eventId: event.id
            });

        } catch (processingError) {
            console.error('❌ Error processing webhook:', processingError);
            // Anche con errori di processing, conferma ricezione
            return res.status(200).json({ 
                received: true, 
                error: 'Processing failed',
                eventType: event.type
            });
        }

    } catch (criticalError) {
        console.error('❌ Critical webhook error:', criticalError);
        // Ultima risorsa: sempre 200 per evitare retry
        return res.status(200).json({ 
            received: false, 
            error: 'Critical error' 
        });
    }
}

// Gestisce checkout completato - FUNZIONE PRINCIPALE
async function handleCheckoutCompleted(session) {
    try {
        console.log('🛒 Processing checkout completed:', {
            sessionId: session.id,
            paymentStatus: session.payment_status,
            customerEmail: session.customer_details?.email,
            productId: session.metadata?.product_id
        });

        // Verifica che il pagamento sia completato
        if (session.payment_status !== 'paid') {
            console.log('⚠️ Payment not completed, status:', session.payment_status);
            return;
        }

        const productId = session.metadata?.product_id;
        const customerEmail = session.customer_details?.email;

        if (!customerEmail || !productId) {
            console.error('❌ Missing required data:', { customerEmail, productId });
            return;
        }

        // Configurazione prodotti ebook
        const products = {
            'wave-system': {
                title: 'IL WAVE SYSTEM',
                description: '6 cicli completi di allenamento progressivo',
                downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/wave-system.pdf',
                price: '14.90'
            },
            '2-milioni-anni': {
                title: 'In Forma da 2 Milioni di Anni',
                description: 'La guida alimentare per trasformare il tuo corpo',
                downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/forma-2-milioni-anni.pdf',
                price: '24.90'
            },
            'body-construction': {
                title: 'BODY UNDER CONSTRUCTION VOL: 1',
                description: '100 allenamenti per una forma perfetta 365 giorni all\'anno',
                downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/body-under-construction.pdf',
                price: '24.90'
            }
        };

        const product = products[productId];
        if (!product) {
            console.error('❌ Unknown product ID:', productId);
            return;
        }

        // Salva il pagamento per tracking
        await savePaymentRecord(session, product);

        // Invia email con ebook
        await sendPurchaseEmail(customerEmail, product, session);

        // Notifica Telegram opzionale
        await sendTelegramNotification(customerEmail, product, session);

        console.log('✅ Checkout completed successfully:', {
            sessionId: session.id,
            customerEmail,
            productTitle: product.title
        });

    } catch (error) {
        console.error('❌ Error in handleCheckoutCompleted:', error);
        // Non rigenerare errore - webhook deve sempre completarsi
    }
}

// Gestisce payment intent succeeded
async function handlePaymentSucceeded(paymentIntent) {
    try {
        console.log('💳 Payment succeeded:', {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status
        });

        // Tracking aggiuntivo se necessario
        
    } catch (error) {
        console.error('❌ Error in handlePaymentSucceeded:', error);
    }
}

// Salva record pagamento per analytics
async function savePaymentRecord(session, product) {
    try {
        const paymentData = {
            sessionId: session.id,
            productId: session.metadata?.product_id,
            productTitle: product.title,
            customerEmail: session.customer_details?.email,
            amount: session.amount_total / 100,
            currency: session.currency,
            paymentStatus: session.payment_status,
            completedAt: new Date().toISOString(),
            stripeCustomerId: session.customer
        };

        console.log('💾 Payment record:', paymentData);

        // TODO: Implementare salvataggio su Airtable/Database
        // await saveToAirtable(paymentData);
        
    } catch (error) {
        console.error('❌ Error saving payment record:', error);
    }
}

// Invia email con ebook - FUNZIONE CRITICA
async function sendPurchaseEmail(email, product, session) {
    try {
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
                Il pagamento è stato completato con successo. Ecco il tuo ebook <strong>"${product.title}"</strong>!
            </p>
            
            <div class="order-details">
                <h3 style="color: #059669; margin-top: 0;">📋 Dettagli Ordine</h3>
                <p><strong>Prodotto:</strong> ${product.title}</p>
                <p><strong>Descrizione:</strong> ${product.description}</p>
                <p><strong>Prezzo:</strong> €${product.price}</p>
                <p><strong>Ordine ID:</strong> ${session.id}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${product.downloadUrl}" class="download-btn">
                    📥 SCARICA IL TUO EBOOK
                </a>
            </div>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h3 style="color: #059669; margin-top: 0;">📱 Hai bisogno di aiuto?</h3>
                <p>Se hai problemi con il download o domande:</p>
                <p>📱 <strong>WhatsApp:</strong> <a href="https://wa.me/393478881515" style="color: #25d366;">+39 347 888 1515</a></p>
                <p>✉️ <strong>Email:</strong> <a href="mailto:andrea.padoan@gmail.com" style="color: #059669;">andrea.padoan@gmail.com</a></p>
            </div>
            
            <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <h3 style="color: #2563eb; margin-top: 0;">🚀 Altri programmi disponibili</h3>
                <p style="margin-bottom: 15px;">Completa la tua collezione fitness:</p>
                <a href="https://andreapadoan-hub.vercel.app/ebooks.html" style="color: #2563eb; text-decoration: none; font-weight: bold;">
                    👉 Scopri tutti gli ebook
                </a>
            </div>
            
            <p style="font-size: 18px; font-weight: bold; color: #059669; text-align: center; margin-top: 40px;">
                Buon allenamento!<br>
                Andrea Padoan 💪
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 Andrea Padoan Personal Trainer. Tutti i diritti riservati.</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                Email automatica di conferma acquisto.
            </p>
        </div>
    </div>
</body>
</html>`;

        const result = await resend.emails.send({
            from: 'Andrea Padoan <noreply@resend.dev>',
            to: email,
            subject: `🎉 Il tuo ebook "${product.title}" è pronto per il download!`,
            html: emailTemplate,
            tags: [
                { name: 'category', value: 'ebook-purchase' },
                { name: 'product', value: product.title }
            ]
        });

        console.log('✅ Purchase email sent successfully:', {
            to: email,
            product: product.title,
            emailId: result.data?.id
        });

        return true;

    } catch (error) {
        console.error('❌ Error sending purchase email:', error);
        return false;
    }
}

// Notifica Telegram opzionale
async function sendTelegramNotification(email, product, session) {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.log('ℹ️ Telegram credentials not configured, skipping notification');
            return;
        }

        const message = `🎉 NUOVO ACQUISTO EBOOK!

📚 Prodotto: ${product.title}
💰 Prezzo: €${product.price}
📧 Cliente: ${email}
🆔 Ordine: ${session.id}
🕐 Data: ${new Date().toLocaleString('it-IT')}

✅ Email con download inviata automaticamente!`;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (response.ok) {
            console.log('✅ Telegram notification sent successfully');
        } else {
            console.log('⚠️ Telegram notification failed:', response.status);
        }

    } catch (error) {
        console.error('⚠️ Telegram notification error:', error);
    }
}