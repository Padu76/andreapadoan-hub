// /api/create-stripe-checkout.js
// API per creare sessioni Stripe Checkout automatiche - Andrea Padoan Ebooks

import Stripe from 'stripe';

// Inizializza Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

        console.log('🛒 Creating Stripe checkout:', {
            productId,
            price: product.price / 100,
            name: product.name
        });

        // Crea sessione Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal', 'link'],
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
                    customer_email: '{CUSTOMER_EMAIL}',
                    order_date: new Date().toISOString()
                }
            },
            
            // Scadenza sessione (30 minuti)
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
            
            // Opzioni avanzate
            allow_promotion_codes: true,
            automatic_tax: {
                enabled: false, // Gestisci tasse manualmente se necessario
            },
            
            // Configurazione consent collection (GDPR)
            consent_collection: {
                terms_of_service: 'required',
            },
            
            // Custom text
            custom_text: {
                submit: {
                    message: 'Riceverai il link di download immediatamente dopo il pagamento!'
                }
            }
        });

        console.log('✅ Stripe checkout session created:', {
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
        console.error('❌ Stripe Checkout API Error:', error);
        
        // Gestione errori specifici Stripe
        if (error.type === 'StripeCardError') {
            return res.status(400).json({
                success: false,
                error: 'Errore con la carta di credito',
                details: error.message
            });
        }
        
        if (error.type === 'StripeRateLimitError') {
            return res.status(429).json({
                success: false,
                error: 'Troppe richieste, riprova tra poco'
            });
        }
        
        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                success: false,
                error: 'Richiesta non valida',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        if (error.type === 'StripeAPIError') {
            return res.status(500).json({
                success: false,
                error: 'Errore del servizio di pagamento'
            });
        }
        
        if (error.type === 'StripeConnectionError') {
            return res.status(500).json({
                success: false,
                error: 'Errore di connessione al servizio pagamenti'
            });
        }
        
        if (error.type === 'StripeAuthenticationError') {
            return res.status(500).json({
                success: false,
                error: 'Errore di autenticazione del servizio'
            });
        }

        // Errore generico
        return res.status(500).json({
            success: false,
            error: 'Errore nella creazione della sessione di pagamento',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Funzione helper per validare i dati della richiesta
function validateRequest(body) {
    const { productId } = body;
    
    if (!productId) {
        throw new Error('Product ID è richiesto');
    }
    
    if (typeof productId !== 'string') {
        throw new Error('Product ID deve essere una stringa');
    }
    
    return true;
}