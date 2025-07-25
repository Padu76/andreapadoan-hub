// /api/stripe-webhook.js
// Webhook Stripe senza import - solo per ricevere notifiche

export default async function handler(req, res) {
    // Solo POST requests da Stripe
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔔 Stripe Webhook received (simple mode)');
        
        // Per ora, accetta tutti i webhook senza verifica signature
        // In produzione dovresti implementare la verifica
        const webhookData = req.body;
        
        console.log('📨 Webhook event:', {
            type: webhookData.type,
            id: webhookData.id
        });

        // Gestione eventi base
        switch (webhookData.type) {
            case 'checkout.session.completed':
                console.log('✅ Checkout completed:', webhookData.data.object.id);
                break;
                
            case 'payment_intent.succeeded':
                console.log('💰 Payment succeeded:', webhookData.data.object.id);
                break;
                
            case 'payment_intent.payment_failed':
                console.log('❌ Payment failed:', webhookData.data.object.id);
                break;
                
            default:
                console.log('ℹ️ Unhandled event:', webhookData.type);
        }

        // Risposta OK per Stripe
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Stripe Webhook error:', error);
        return res.status(500).json({ error: 'Errore webhook' });
    }
}