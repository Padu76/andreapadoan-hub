// /api/create-stripe-checkout.js
// API Stripe fixed per pagamenti automatici
// Andrea Padoan Ebooks - Versione corretta

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }

    try {
        console.log('💳 Stripe checkout API called');

        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ 
                success: false,
                error: 'Product ID è richiesto' 
            });
        }

        // Configurazione prodotti con prezzi corretti
        const products = {
            '2-milioni-anni': {
                name: 'Ebook: 2 Milioni di Anni',
                price: 2490, // €24.90 in centesimi
                description: 'La guida completa per la trasformazione fisica',
                image: 'https://andreapadoan-hub.vercel.app/ebook-store/forma-2-milioni-anni.jpg'
            },
            'body-construction': {
                name: 'Ebook: Body Under Construction Vol.1',
                price: 2490, // €24.90 in centesimi
                description: '100 allenamenti per una forma perfetta 365 giorni all\'anno',
                image: 'https://andreapadoan-hub.vercel.app/ebook-store/body-under-construction.jpg'
            },
            'wave-system': {
                name: 'Ebook: Il Wave System',
                price: 1490, // €14.90 in centesimi
                description: '6 cicli completi di allenamento progressivo',
                image: 'https://andreapadoan-hub.vercel.app/ebook-store/wave-system.jpg'
            }
        };

        const product = products[productId];
        if (!product) {
            return res.status(400).json({ 
                success: false,
                error: 'Prodotto non valido',
                availableProducts: Object.keys(products)
            });
        }

        console.log('🛒 Creating Stripe checkout for:', {
            productId,
            name: product.name,
            price: product.price / 100
        });

        // Crea sessione Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
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
            
            // URLs corretti con .html
            success_url: `https://andreapadoan-hub.vercel.app/success.html?product=${productId}&payment=stripe&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://andreapadoan-hub.vercel.app/ebooks.html?cancelled=${productId}`,
            
            // Configurazioni
            billing_address_collection: 'auto',
            customer_creation: 'always',
            
            // Metadati per tracking
            metadata: {
                product_id: productId,
                product_name: product.name,
                price_eur: (product.price / 100).toString(),
                source: 'ebook_store',
                timestamp: new Date().toISOString()
            },
            
            // Configurazioni UI
            locale: 'it',
            
            // Payment intent data
            payment_intent_data: {
                description: `Acquisto ebook: ${product.name}`,
                metadata: {
                    product_id: productId,
                    order_date: new Date().toISOString(),
                    customer_type: 'ebook_customer'
                }
            },
            
            // Scadenza sessione (30 minuti)
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
            
            // Configurazioni avanzate
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
        });

        console.log('✅ Stripe session created:', {
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
        console.error('❌ Stripe API Error:', error);
        
        // Gestione errori specifici
        let errorMessage = 'Errore nella creazione del checkout';
        let statusCode = 500;
        
        if (error.type === 'StripeCardError') {
            errorMessage = 'Errore con la carta di credito';
            statusCode = 400;
        } else if (error.type === 'StripeRateLimitError') {
            errorMessage = 'Troppe richieste, riprova tra poco';
            statusCode = 429;
        } else if (error.type === 'StripeInvalidRequestError') {
            errorMessage = 'Richiesta non valida';
            statusCode = 400;
        } else if (error.type === 'StripeAPIError') {
            errorMessage = 'Errore del servizio di pagamento';
            statusCode = 500;
        } else if (error.type === 'StripeConnectionError') {
            errorMessage = 'Errore di connessione';
            statusCode = 500;
        } else if (error.type === 'StripeAuthenticationError') {
            errorMessage = 'Errore di autenticazione';
            statusCode = 500;
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            type: error.type || 'unknown'
        });
    }
}