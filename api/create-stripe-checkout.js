export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.SITE_URL || 'https://andreapadoan-hub.vercel.app';

    if (!stripeKey) {
        return res.status(500).json({ 
            error: 'STRIPE_SECRET_KEY mancante',
            debug: 'Configura la chiave in Vercel Environment Variables'
        });
    }

    const { productId } = req.body || {};
    
    const products = {
        '2-milioni-anni': { name: 'Ebook: 2 Milioni di Anni', price: 990 },
        'body-construction': { name: 'Ebook: Body Under Construction Vol.1', price: 2490 },
        'wave-system': { name: 'Ebook: Il Wave System', price: 1490 }
    };

    if (!products[productId]) {
        return res.status(400).json({ 
            error: 'Prodotto non valido',
            received: productId,
            available: Object.keys(products)
        });
    }

    const product = products[productId];

    // Per ora, restituisci un URL di test invece di chiamare Stripe
    return res.status(200).json({
        success: true,
        sessionId: 'test_session_' + Date.now(),
        checkoutUrl: `https://checkout.stripe.com/test?product=${productId}`,
        product: {
            id: productId,
            name: product.name,
            price: product.price / 100
        },
        debug: {
            stripeKeyExists: !!stripeKey,
            stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) : 'missing',
            siteUrl: siteUrl
        }
    });
}