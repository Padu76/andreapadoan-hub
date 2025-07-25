export default async function handler(req, res) {
    try {
        console.log('🚀 Stripe API called:', req.method);

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Test environment variables
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const siteUrl = process.env.SITE_URL;

        console.log('🔧 Environment check:', {
            stripeKeyExists: !!stripeKey,
            stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) : 'missing',
            siteUrlExists: !!siteUrl,
            siteUrl: siteUrl
        });

        if (!stripeKey) {
            return res.status(500).json({ 
                error: 'STRIPE_SECRET_KEY non configurata',
                debug: 'Configura STRIPE_SECRET_KEY in Vercel Environment Variables'
            });
        }

        if (!siteUrl) {
            return res.status(500).json({ 
                error: 'SITE_URL non configurata',
                debug: 'Configura SITE_URL in Vercel Environment Variables'
            });
        }

        const { productId } = req.body;
        console.log('📦 Product requested:', productId);

        const products = {
            '2-milioni-anni': { name: 'Ebook: 2 Milioni di Anni', price: 990 },
            'body-construction': { name: 'Ebook: Body Under Construction Vol.1', price: 2490 },
            'wave-system': { name: 'Ebook: Il Wave System', price: 1490 }
        };

        if (!products[productId]) {
            return res.status(400).json({ 
                error: 'Prodotto non valido',
                availableProducts: Object.keys(products)
            });
        }

        const product = products[productId];
        console.log('✅ Product found:', product);

        // Stripe API call
        const stripeUrl = 'https://api.stripe.com/v1/checkout/sessions';
        const authHeader = `Bearer ${stripeKey}`;

        console.log('📡 Calling Stripe API...');

        const formData = new URLSearchParams({
            'mode': 'payment',
            'success_url': `${siteUrl}/success?product=${productId}&payment=stripe`,
            'cancel_url': `${siteUrl}/cancel?product=${productId}`,
            'line_items[0][price_data][currency]': 'eur',
            'line_items[0][price_data][product_data][name]': product.name,
            'line_items[0][price_data][unit_amount]': product.price.toString(),
            'line_items[0][quantity]': '1',
            'payment_method_types[0]': 'card',
            'locale': 'it'
        });

        const stripeResponse = await fetch(stripeUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        console.log('📡 Stripe response status:', stripeResponse.status);

        if (!stripeResponse.ok) {
            const errorText = await stripeResponse.text();
            console.error('❌ Stripe API error:', errorText);
            return res.status(500).json({
                error: 'Errore Stripe API',
                details: errorText,
                stripeStatus: stripeResponse.status
            });
        }

        const session = await stripeResponse.json();
        console.log('✅ Stripe session created:', session.id);

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            checkoutUrl: session.url,
            product: {
                id: productId,
                name: product.name,
                price: product.price / 100
            }
        });

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return res.status(500).json({
            error: 'Errore interno',
            message: error.message,
            stack: error.stack
        });
    }
}