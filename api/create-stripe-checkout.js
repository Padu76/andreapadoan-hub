// /api/create-stripe-checkout.js
// API per creare sessioni Stripe Checkout automatiche - Andrea Padoan Ebooks
// Versione FETCH-ONLY senza import

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { productId } = req.body;

        // Configurazione prodotti con prezzi (in centesimi per Stripe)
        const products = {
            '2-milioni-anni': {
                name: 'Ebook: 2 Milioni di Anni',
                price: 990, // €9.90 in centesimi
                description: 'La guida completa per la trasformazione fisica',
                image: `${process.env.SITE_URL}/ebook-store/forma-2-milioni-anni.jpg`
            },
            'body-construction': {
                name: 'Ebook: Body Under Construction Vol.1',
                price: 2490, // €24.90 in centesimi
                description: '100 allenamenti per una forma perfetta 365 giorni all\'anno',
                image: `${process.env.SITE_URL}/ebook-store/body-under-construction.jpg`
            },
            'wave-system': {
                name: 'Ebook: Il Wave System',
                price: 1490, // €14.90 in centesimi
                description: '6 cicli completi di allenamento progressivo',
                image: `${process.env.SITE_URL}/ebook-store/wave-system.jpg`
            }
        };

        // Verifica prodotto valido
        if (!products[productId]) {
            return res.status(400).json({ error: 'Prodotto non valido' });
        }

        const product = products[productId];

        // Crea sessione Stripe usando fetch diretto
        const sessionData = {
            payment_method_types: ['card', 'paypal'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: product.name,
                            description: product.description,
                            images: [product.image],
                            metadata: {
                                product_id: productId,
                                product_type: 'ebook',
                                author: 'Andrea Padoan'
                            }
                        },
                        unit_amount: product.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            
            // URLs di successo e cancellazione
            success_url: `${process.env.SITE_URL}/success?product=${productId}&payment=stripe&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.SITE_URL}/cancel?product=${productId}`,
            
            // Configurazioni aggiuntive
            billing_address_collection: 'auto',
            customer_creation: 'always',
            
            // Metadati per tracking
            metadata: {
                product_id: productId,
                product_name: product.name,
                price_eur: (product.price / 100).toString(),
                source: 'ebook_store'
            },
            
            // Configurazioni UI
            locale: 'it',
            
            // Configurazioni business
            payment_intent_data: {
                description: `Acquisto ebook: ${product.name}`,
                metadata: {
                    product_id: productId,
                    order_date: new Date().toISOString()
                }
            },
            
            // Scadenza sessione (30 minuti)
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
            
            // Opzioni avanzate
            allow_promotion_codes: true,
            automatic_tax: {
                enabled: false
            },
            
            // Custom text
            custom_text: {
                submit: {
                    message: 'Riceverai il link di download immediatamente dopo il pagamento!'
                }
            }
        };

        // Chiamata API Stripe diretta
        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: createStripeFormData(sessionData)
        });

        if (!stripeResponse.ok) {
            const errorText = await stripeResponse.text();
            console.error('❌ Stripe API Error:', errorText);
            throw new Error(`Stripe API Error: ${stripeResponse.status}`);
        }

        const session = await stripeResponse.json();

        console.log('✅ Stripe checkout session created (fetch mode):', {
            sessionId: session.id,
            url: session.url
        });

        // Risposta successo
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
        console.error('❌ Stripe Checkout API Error (fetch mode):', error);
        
        return res.status(500).json({
            success: false,
            error: 'Errore nella creazione della sessione di pagamento',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Crea form data per Stripe API
function createStripeFormData(data) {
    const params = new URLSearchParams();
    
    // Funzione ricorsiva per convertire oggetto in form data
    function addToFormData(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            const formKey = prefix ? `${prefix}[${key}]` : key;
            
            if (value === null || value === undefined) {
                continue;
            }
            
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object') {
                        addToFormData(item, `${formKey}[${index}]`);
                    } else {
                        params.append(`${formKey}[${index}]`, item);
                    }
                });
            } else if (typeof value === 'object') {
                addToFormData(value, formKey);
            } else {
                params.append(formKey, value.toString());
            }
        }
    }
    
    addToFormData(data);
    return params.toString();
}