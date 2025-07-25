// /api/create-paypal-order.js
// API per creare ordini PayPal automatici - Andrea Padoan Ebooks

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { productId } = req.body;

        // Configurazione prodotti con prezzi
        const products = {
            '2-milioni-anni': {
                name: 'Ebook: 2 Milioni di Anni',
                price: '9.90',
                description: 'La guida completa per la trasformazione fisica'
            },
            'body-construction': {
                name: 'Ebook: Body Under Construction Vol.1',
                price: '24.90',
                description: '100 allenamenti per una forma perfetta 365 giorni l\'anno'
            },
            'wave-system': {
                name: 'Ebook: Il Wave System',
                price: '14.90',
                description: '6 cicli completi di allenamento progressivo'
            }
        };

        // Verifica prodotto valido
        if (!products[productId]) {
            return res.status(400).json({ error: 'Prodotto non valido' });
        }

        const product = products[productId];

        // Ottieni access token PayPal
        const accessToken = await getPayPalAccessToken();
        if (!accessToken) {
            throw new Error('Impossibile ottenere access token PayPal');
        }

        // Crea ordine PayPal
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: productId,
                description: product.description,
                amount: {
                    currency_code: 'EUR',
                    value: product.price
                },
                payee: {
                    merchant_id: process.env.PAYPAL_MERCHANT_ID // Opzionale
                }
            }],
            application_context: {
                brand_name: 'Andrea Padoan Ebooks',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: `${process.env.SITE_URL}/success?product=${productId}&payment=paypal`,
                cancel_url: `${process.env.SITE_URL}/cancel?product=${productId}`
            }
        };

        console.log('🛒 Creating PayPal order:', {
            productId,
            price: product.price,
            name: product.name
        });

        // Chiamata API PayPal
        const response = await fetch(`${getPayPalBaseURL()}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'PayPal-Request-Id': `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
            },
            body: JSON.stringify(orderData)
        });

        const orderResult = await response.json();

        if (!response.ok) {
            console.error('❌ PayPal order creation failed:', orderResult);
            throw new Error(`PayPal API Error: ${orderResult.message || 'Unknown error'}`);
        }

        console.log('✅ PayPal order created:', {
            orderId: orderResult.id,
            status: orderResult.status
        });

        // Trova approval URL
        const approvalUrl = orderResult.links?.find(link => link.rel === 'approve')?.href;
        
        if (!approvalUrl) {
            throw new Error('Approval URL non trovato nella risposta PayPal');
        }

        // Risposta successo
        return res.status(200).json({
            success: true,
            orderId: orderResult.id,
            approvalUrl: approvalUrl,
            product: {
                id: productId,
                name: product.name,
                price: product.price
            }
        });

    } catch (error) {
        console.error('❌ PayPal Order API Error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Errore nella creazione dell\'ordine PayPal',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Funzione per ottenere access token PayPal
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

        if (!response.ok) {
            console.error('❌ PayPal auth failed:', data);
            return null;
        }

        console.log('✅ PayPal access token obtained');
        return data.access_token;

    } catch (error) {
        console.error('❌ PayPal auth error:', error);
        return null;
    }
}

// URL base PayPal (sandbox vs live)
function getPayPalBaseURL() {
    return process.env.PAYPAL_CLIENT_ID?.startsWith('AZ') || process.env.PAYPAL_CLIENT_ID?.startsWith('AR')
        ? 'https://api-m.paypal.com'  // Live
        : 'https://api-m.sandbox.paypal.com';  // Sandbox
}