// /api/create-stripe-checkout.js
// Versione ultra semplice per debug

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔧 Stripe API called - SIMPLE MODE');
        
        // Controlla environment variables
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('❌ STRIPE_SECRET_KEY mancante');
            throw new Error('STRIPE_SECRET_KEY mancante');
        }
        
        if (!process.env.SITE_URL) {
            console.error('❌ SITE_URL mancante');
            throw new Error('SITE_URL mancante');
        }

        const { productId } = req.body;
        console.log('📦 Product ID:', productId);

        const products = {
            '2-milioni-anni': { name: 'Ebook: 2 Milioni di Anni', price: 990 },
            'body-construction': { name: 'Ebook: Body Under Construction Vol.1', price: 2490 },
            'wave-system': { name: 'Ebook: Il Wave System', price: 1490 }
        };

        if (!products[productId]) {
            throw new Error('Prodotto non valido: ' + productId);
        }

        const product = products[productId];
        console.log('✅ Product found:', product);

        // Chiamata Stripe semplificata
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'mode': 'payment',
                'success_url': `${process.env.SITE_URL}/success?product=${productId}&payment=stripe`,
                'cancel_url': `${process.env.SITE_URL}/cancel?product=${productId}`,
                'line_items[0][price_data][currency]': 'eur',
                'line_items[0][price_data][product_data][name]': product.name,
                'line_items[0][price_data][unit_amount]': product.price.toString(),
                'line_items[0][quantity]': '1',
                'payment_method_types[0]': 'card'
            }).toString()
        });

        console.log('📡 Stripe response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Stripe error:', errorText);
            throw new Error(`Stripe API Error: ${response.status} - ${errorText}`);
        }

        const session = await response.json();
        console.log('✅ Session created:', session.id);

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            checkoutUrl: session.url,
            product: { id: productId, name: product.name, price: product.price / 100 }
        });

    } catch (error) {
        console.error('❌ API Error:', error.message);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}