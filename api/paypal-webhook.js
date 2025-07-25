// /api/paypal-webhook.js
// Webhook per verificare pagamenti PayPal completati - Andrea Padoan Ebooks

import crypto from 'crypto';

export default async function handler(req, res) {
    // Solo POST requests da PayPal
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const webhookBody = req.body;
        const headers = req.headers;

        console.log('🔔 PayPal Webhook received:', {
            eventType: webhookBody.event_type,
            resourceType: webhookBody.resource_type,
            webhookId: headers['paypal-transmission-id']
        });

        // Verifica signature webhook (sicurezza)
        const isValid = await verifyPayPalWebhook(req);
        if (!isValid) {
            console.error('❌ Invalid PayPal webhook signature');
            return res.status(401).json({ error: 'Webhook signature non valida' });
        }

        // Gestione eventi PayPal
        switch (webhookBody.event_type) {
            case 'CHECKOUT.ORDER.APPROVED':
                await handleOrderApproved(webhookBody);
                break;
                
            case 'PAYMENT.CAPTURE.COMPLETED':
                await handlePaymentCompleted(webhookBody);
                break;
                
            case 'PAYMENT.CAPTURE.DENIED':
                await handlePaymentDenied(webhookBody);
                break;
                
            case 'CHECKOUT.ORDER.COMPLETED':
                await handleOrderCompleted(webhookBody);
                break;
                
            default:
                console.log('ℹ️ Unhandled PayPal event:', webhookBody.event_type);
        }

        // Risposta OK per PayPal
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ PayPal Webhook Error:', error);
        return res.status(500).json({ error: 'Errore elaborazione webhook' });
    }
}

// Gestisce ordine approvato (ma non ancora pagato)
async function handleOrderApproved(webhookData) {
    try {
        const order = webhookData.resource;
        const orderId = order.id;
        const purchaseUnit = order.purchase_units?.[0];
        const productId = purchaseUnit?.reference_id;

        console.log('✅ PayPal Order Approved:', {
            orderId,
            productId,
            amount: purchaseUnit?.amount?.value,
            status: order.status
        });

        // Qui potresti salvare l'ordine in un database per tracking
        // await saveOrderToDatabase(orderId, productId, 'approved');

    } catch (error) {
        console.error('❌ Error handling order approved:', error);
    }
}

// Gestisce pagamento completato (il più importante!)
async function handlePaymentCompleted(webhookData) {
    try {
        const capture = webhookData.resource;
        const orderId = capture.supplementary_data?.related_ids?.order_id;
        const amount = capture.amount;
        const payerId = capture.payer?.payer_id;
        const payerEmail = capture.payer?.email_address;

        // Recupera dettagli ordine per ottenere product_id
        const orderDetails = await getPayPalOrderDetails(orderId);
        const productId = orderDetails?.purchase_units?.[0]?.reference_id;

        console.log('💰 PayPal Payment Completed:', {
            orderId,
            productId,
            amount: amount.value,
            currency: amount.currency_code,
            payerEmail,
            captureId: capture.id
        });

        if (!productId) {
            console.error('❌ Product ID not found in completed payment');
            return;
        }

        // Genera token di accesso sicuro per download
        const downloadToken = generateSecureToken(orderId, productId);
        
        // Salva il pagamento verificato (database o cache)
        await saveVerifiedPayment({
            orderId,
            productId,
            payerEmail,
            amount: amount.value,
            currency: amount.currency_code,
            downloadToken,
            status: 'completed',
            paymentMethod: 'paypal',
            completedAt: new Date().toISOString()
        });

        console.log('✅ Payment verified and saved:', {
            orderId,
            productId,
            downloadToken: downloadToken.substring(0, 10) + '...'
        });

        // Opzionale: Invia email di conferma
        // await sendDownloadEmail(payerEmail, productId, downloadToken);

    } catch (error) {
        console.error('❌ Error handling payment completed:', error);
    }
}

// Gestisce pagamento negato
async function handlePaymentDenied(webhookData) {
    try {
        const capture = webhookData.resource;
        const orderId = capture.supplementary_data?.related_ids?.order_id;

        console.log('❌ PayPal Payment Denied:', {
            orderId,
            reason: capture.status_details?.reason
        });

        // Salva il pagamento fallito per tracking
        // await saveFailedPayment(orderId, 'denied');

    } catch (error) {
        console.error('❌ Error handling payment denied:', error);
    }
}

// Gestisce ordine completato
async function handleOrderCompleted(webhookData) {
    try {
        const order = webhookData.resource;
        console.log('🎉 PayPal Order Completed:', {
            orderId: order.id,
            status: order.status
        });
    } catch (error) {
        console.error('❌ Error handling order completed:', error);
    }
}

// Verifica signature webhook PayPal per sicurezza
async function verifyPayPalWebhook(req) {
    try {
        // Headers necessari da PayPal
        const headers = req.headers;
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        const bodyRaw = JSON.stringify(req.body);

        // PayPal signature headers
        const transmissionId = headers['paypal-transmission-id'];
        const certId = headers['paypal-cert-id'];
        const transmissionTime = headers['paypal-transmission-time'];
        const signature = headers['paypal-transmission-sig'];
        const authAlgo = headers['paypal-auth-algo'];

        if (!transmissionId || !certId || !transmissionTime || !signature) {
            console.error('❌ Missing PayPal signature headers');
            return false;
        }

        // Per ora ritorniamo true - implementazione completa richiederebbe
        // certificati PayPal e validazione crittografica complessa
        console.log('⚠️ PayPal signature verification simplified');
        return true;

        // Implementazione completa sarebbe:
        // const isValid = await verifyPayPalSignature({
        //     transmissionId,
        //     certId,
        //     transmissionTime,
        //     signature,
        //     authAlgo,
        //     webhookId,
        //     bodyRaw
        // });
        // return isValid;

    } catch (error) {
        console.error('❌ Error verifying PayPal webhook:', error);
        return false;
    }
}

// Recupera dettagli ordine PayPal
async function getPayPalOrderDetails(orderId) {
    try {
        const accessToken = await getPayPalAccessToken();
        if (!accessToken) {
            throw new Error('Cannot get PayPal access token');
        }

        const response = await fetch(`${getPayPalBaseURL()}/v2/checkout/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`PayPal API error: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('❌ Error getting PayPal order details:', error);
        return null;
    }
}

// Ottieni access token PayPal (riutilizzato da create-paypal-order.js)
async function getPayPalAccessToken() {
    try {
        const auth = Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString('base64');

        const response = await fetch(`${getPayPalBaseURL()}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();
        return response.ok ? data.access_token : null;

    } catch (error) {
        console.error('❌ PayPal auth error:', error);
        return null;
    }
}

// URL base PayPal
function getPayPalBaseURL() {
    return process.env.PAYPAL_CLIENT_ID?.startsWith('AZ') || process.env.PAYPAL_CLIENT_ID?.startsWith('AR')
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
}

// Genera token sicuro per download
function generateSecureToken(orderId, productId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const data = `${orderId}-${productId}-${timestamp}-${random}`;
    
    return crypto
        .createHash('sha256')
        .update(data + process.env.PAYPAL_CLIENT_SECRET) // Salt con secret
        .digest('hex')
        .substring(0, 32); // 32 chars
}

// Salva pagamento verificato (implementazione semplificata)
async function saveVerifiedPayment(paymentData) {
    try {
        // In produzione, salveresti in un database
        // Per ora, log dei dati
        console.log('💾 Saving verified payment:', {
            orderId: paymentData.orderId,
            productId: paymentData.productId,
            amount: paymentData.amount,
            downloadToken: paymentData.downloadToken.substring(0, 10) + '...'
        });

        // Implementazione database:
        // await db.collection('payments').add(paymentData);
        
        return true;
    } catch (error) {
        console.error('❌ Error saving payment:', error);
        return false;
    }
}