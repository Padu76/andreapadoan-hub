// /api/stripe-webhook.js
// Webhook per verificare pagamenti Stripe completati - Andrea Padoan Ebooks

import Stripe from 'stripe';
import crypto from 'crypto';

// Inizializza Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configurazione per leggere raw body (necessario per webhook signature)
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
}

export default async function handler(req, res) {
    // Solo POST requests da Stripe
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let event;
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        // Verifica signature webhook Stripe (sicurezza critica!)
        if (!signature || !endpointSecret) {
            console.error('❌ Missing Stripe signature or endpoint secret');
            return res.status(400).json({ error: 'Webhook signature mancante' });
        }

        // Stripe richiede raw body per verifica signature
        const rawBody = JSON.stringify(req.body);
        
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            endpointSecret
        );

        console.log('🔔 Stripe Webhook received:', {
            eventType: event.type,
            eventId: event.id,
            livemode: event.livemode
        });

    } catch (error) {
        console.error('❌ Stripe webhook signature verification failed:', error.message);
        return res.status(400).json({ 
            error: 'Webhook signature non valida',
            details: error.message 
        });
    }

    try {
        // Gestione eventi Stripe
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
                
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
                
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
                
            case 'customer.created':
                await handleCustomerCreated(event.data.object);
                break;
                
            default:
                console.log('ℹ️ Unhandled Stripe event:', event.type);
        }

        // Risposta OK per Stripe
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Stripe Webhook processing error:', error);
        return res.status(500).json({ error: 'Errore elaborazione webhook' });
    }
}

// Gestisce checkout session completata (evento principale!)
async function handleCheckoutCompleted(session) {
    try {
        const sessionId = session.id;
        const customerId = session.customer;
        const customerEmail = session.customer_details?.email;
        const amountTotal = session.amount_total; // in centesimi
        const currency = session.currency;
        const paymentStatus = session.payment_status;
        const productId = session.metadata?.product_id;

        console.log('💰 Stripe Checkout Completed:', {
            sessionId,
            productId,
            amount: amountTotal / 100,
            currency,
            customerEmail,
            paymentStatus
        });

        // Verifica che il pagamento sia effettivamente completato
        if (paymentStatus !== 'paid') {
            console.log('⚠️ Payment not completed yet, status:', paymentStatus);
            return;
        }

        if (!productId) {
            console.error('❌ Product ID not found in session metadata');
            return;
        }

        // Recupera line items per dettagli prodotto
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
        const product = lineItems.data?.[0];

        // Genera token di accesso sicuro per download
        const downloadToken = generateSecureToken(sessionId, productId);
        
        // Recupera dettagli customer se presente
        let customerDetails = null;
        if (customerId) {
            try {
                customerDetails = await stripe.customers.retrieve(customerId);
            } catch (error) {
                console.error('⚠️ Could not retrieve customer details:', error.message);
            }
        }

        // Salva il pagamento verificato
        await saveVerifiedPayment({
            sessionId,
            productId,
            customerEmail,
            customerId,
            amount: amountTotal / 100,
            currency,
            downloadToken,
            status: 'completed',
            paymentMethod: 'stripe',
            productName: product?.description || 'Unknown Product',
            customerDetails: customerDetails ? {
                name: customerDetails.name,
                phone: customerDetails.phone,
                address: customerDetails.address
            } : null,
            completedAt: new Date().toISOString(),
            sessionData: {
                mode: session.mode,
                paymentIntentId: session.payment_intent
            }
        });

        console.log('✅ Stripe payment verified and saved:', {
            sessionId,
            productId,
            downloadToken: downloadToken.substring(0, 10) + '...'
        });

        // Opzionale: Invia email di conferma
        // await sendDownloadEmail(customerEmail, productId, downloadToken);

    } catch (error) {
        console.error('❌ Error handling checkout completed:', error);
    }
}

// Gestisce payment intent succeeded (conferma pagamento)
async function handlePaymentSucceeded(paymentIntent) {
    try {
        const paymentIntentId = paymentIntent.id;
        const amount = paymentIntent.amount; // in centesimi
        const currency = paymentIntent.currency;
        const customerEmail = paymentIntent.receipt_email;

        console.log('✅ Stripe Payment Intent Succeeded:', {
            paymentIntentId,
            amount: amount / 100,
            currency,
            customerEmail
        });

        // Questo evento è spesso ridondante con checkout.session.completed
        // ma può essere utile per tracking aggiuntivo

    } catch (error) {
        console.error('❌ Error handling payment succeeded:', error);
    }
}

// Gestisce pagamento fallito
async function handlePaymentFailed(paymentIntent) {
    try {
        const paymentIntentId = paymentIntent.id;
        const failureReason = paymentIntent.last_payment_error?.message;
        const customerEmail = paymentIntent.receipt_email;

        console.log('❌ Stripe Payment Failed:', {
            paymentIntentId,
            reason: failureReason,
            customerEmail
        });

        // Salva il pagamento fallito per analytics
        await saveFailedPayment({
            paymentIntentId,
            reason: failureReason,
            customerEmail,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            failedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error handling payment failed:', error);
    }
}

// Gestisce pagamento fattura (per abbonamenti futuri)
async function handleInvoicePaymentSucceeded(invoice) {
    try {
        console.log('💰 Invoice Payment Succeeded:', {
            invoiceId: invoice.id,
            customerId: invoice.customer,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency
        });

        // Implementazione futura per abbonamenti
        
    } catch (error) {
        console.error('❌ Error handling invoice payment:', error);
    }
}

// Gestisce nuovo customer creato
async function handleCustomerCreated(customer) {
    try {
        console.log('👤 New Stripe Customer Created:', {
            customerId: customer.id,
            email: customer.email,
            name: customer.name
        });

        // Potresti salvare info customer per marketing/analytics
        
    } catch (error) {
        console.error('❌ Error handling customer created:', error);
    }
}

// Genera token sicuro per download (stesso sistema PayPal)
function generateSecureToken(sessionId, productId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const data = `${sessionId}-${productId}-${timestamp}-${random}`;
    
    return crypto
        .createHash('sha256')
        .update(data + process.env.STRIPE_SECRET_KEY) // Salt con secret
        .digest('hex')
        .substring(0, 32); // 32 chars
}

// Salva pagamento verificato (implementazione semplificata)
async function saveVerifiedPayment(paymentData) {
    try {
        console.log('💾 Saving Stripe verified payment:', {
            sessionId: paymentData.sessionId,
            productId: paymentData.productId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            customerEmail: paymentData.customerEmail,
            downloadToken: paymentData.downloadToken.substring(0, 10) + '...'
        });

        // In produzione, salveresti in un database
        // await db.collection('payments').add(paymentData);
        
        // Per ora, potresti usare una cache o file temporaneo
        // await cacheVerifiedPayment(paymentData);
        
        return true;
    } catch (error) {
        console.error('❌ Error saving Stripe payment:', error);
        return false;
    }
}

// Salva pagamento fallito per analytics
async function saveFailedPayment(failureData) {
    try {
        console.log('📊 Saving failed payment data:', {
            paymentIntentId: failureData.paymentIntentId,
            reason: failureData.reason,
            amount: failureData.amount
        });

        // In produzione:
        // await db.collection('failed_payments').add(failureData);
        
        return true;
    } catch (error) {
        console.error('❌ Error saving failed payment:', error);
        return false;
    }
}

// Funzione helper per validare webhook data
function validateWebhookData(event) {
    if (!event.id || !event.type || !event.data) {
        throw new Error('Invalid webhook event structure');
    }
    
    if (!event.livemode && process.env.NODE_ENV === 'production') {
        throw new Error('Test event received in production');
    }
    
    return true;
}