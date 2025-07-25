// payment.js - Sistema pagamenti completo con API reali
// Andrea Padoan Ebooks - Versione Automatizzata

class EbookPaymentSystem {
    constructor() {
        this.isProcessing = false;
        this.init();
    }

    init() {
        console.log('🚀 Ebook Payment System - Inizializzazione con APIs reali');
        this.setupEventListeners();
        this.logSystemInfo();
    }

    setupEventListeners() {
        // Event listeners per bottoni pagamento
        document.addEventListener('click', (e) => {
            // Bottoni Stripe
            if (e.target.matches('[data-stripe-product]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-stripe-product');
                this.handleStripePayment(productId);
            }
            
            // Bottoni PayPal
            if (e.target.matches('[data-paypal-product]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-paypal-product');
                this.handlePayPalPayment(productId);
            }
            
            // Bottoni download gratuito
            if (e.target.matches('[data-free-download]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-free-download');
                this.handleFreeDownload(productId);
            }
        });

        console.log('✅ Event listeners configurati');
    }

    // ===================================
    // STRIPE PAYMENTS
    // ===================================

    async handleStripePayment(productId) {
        if (this.isProcessing) {
            console.log('⚠️ Payment already in progress');
            return;
        }

        console.log('💳 Initiating Stripe payment:', productId);
        
        try {
            this.isProcessing = true;
            this.showProcessingState('Preparazione pagamento Stripe...');

            // Chiamata API per creare sessione Stripe
            const response = await fetch('/api/create-stripe-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Errore nella creazione del checkout Stripe');
            }

            if (!data.success || !data.checkoutUrl) {
                throw new Error('URL checkout non ricevuto da Stripe');
            }

            console.log('✅ Stripe checkout session created:', data.sessionId);

            // Redirect a Stripe Checkout
            this.trackPaymentAttempt('stripe', productId);
            window.location.href = data.checkoutUrl;

        } catch (error) {
            console.error('❌ Stripe payment error:', error);
            this.handlePaymentError('stripe', error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    // ===================================
    // PAYPAL PAYMENTS
    // ===================================

    async handlePayPalPayment(productId) {
        if (this.isProcessing) {
            console.log('⚠️ Payment already in progress');
            return;
        }

        console.log('💰 Initiating PayPal payment:', productId);
        
        try {
            this.isProcessing = true;
            this.showProcessingState('Preparazione pagamento PayPal...');

            // Chiamata API per creare ordine PayPal
            const response = await fetch('/api/create-paypal-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Errore nella creazione dell\'ordine PayPal');
            }

            if (!data.success || !data.approvalUrl) {
                throw new Error('URL approvazione non ricevuto da PayPal');
            }

            console.log('✅ PayPal order created:', data.orderId);

            // Redirect a PayPal
            this.trackPaymentAttempt('paypal', productId);
            window.location.href = data.approvalUrl;

        } catch (error) {
            console.error('❌ PayPal payment error:', error);
            this.handlePaymentError('paypal', error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    // ===================================
    // FREE DOWNLOADS
    // ===================================

    handleFreeDownload(productId) {
        console.log('📥 Handling free download:', productId);

        // Trova l'input email più vicino al bottone cliccato
        const clickedButton = event.target;
        const parentContainer = clickedButton.closest('div, section, form');
        const emailInput = parentContainer.querySelector('input[type="email"]');

        if (!emailInput) {
            this.showErrorMessage('Campo email non trovato');
            return;
        }

        const email = emailInput.value.trim();

        if (!this.validateEmail(email)) {
            this.showErrorMessage('Inserisci un indirizzo email valido');
            emailInput.focus();
            return;
        }

        // Procedi con download gratuito
        this.processFreeDownload(productId, email);
    }

    async processFreeDownload(productId, email) {
        try {
            console.log('🎁 Processing free download:', { productId, email });

            // Per ora, apri WhatsApp con messaggio precompilato
            // In futuro potresti salvare l'email e inviare il PDF automaticamente
            const message = this.createFreeDownloadMessage(productId, email);
            const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
            
            // Traccia download gratuito
            this.trackFreeDownload(productId, email);
            
            // Apri WhatsApp
            window.open(whatsappUrl, '_blank');
            
            // Mostra messaggio di conferma
            this.showSuccessMessage('Ti abbiamo reindirizzato su WhatsApp! Andrea ti invierà il PDF gratuito a breve.');

        } catch (error) {
            console.error('❌ Free download error:', error);
            this.showErrorMessage('Errore nel download gratuito');
        }
    }

    createFreeDownloadMessage(productId, email) {
        const products = {
            '50-workout': '50 WORKOUT DA VIAGGIO (GRATUITO)'
        };

        const productName = products[productId] || 'Ebook Gratuito';

        return `🎁 RICHIESTA EBOOK GRATUITO

📚 Ebook: ${productName}
📧 La mia email: ${email}

Ciao Andrea! Vorrei scaricare l'ebook gratuito. Puoi inviarmelo via email? Grazie! 🙏`;
    }

    // ===================================
    // UI FEEDBACK METHODS
    // ===================================

    showProcessingState(message) {
        // Crea overlay di caricamento
        const overlay = document.createElement('div');
        overlay.id = 'paymentProcessingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        overlay.innerHTML = `
            <div style="
                background: rgba(26, 26, 26, 0.95);
                padding: 2rem;
                border-radius: 1rem;
                text-align: center;
                border: 1px solid #333;
                max-width: 400px;
                width: 90%;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(249, 115, 22, 0.3);
                    border-radius: 50%;
                    border-top: 3px solid #f97316;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                "></div>
                <h3 style="color: #f97316; margin-bottom: 0.5rem; font-size: 1.2rem;">
                    Elaborazione Pagamento
                </h3>
                <p style="color: #e0e0e0; margin: 0;">
                    ${message}
                </p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(overlay);
        
        console.log('⏳ Processing overlay shown');
    }

    hideProcessingState() {
        const overlay = document.getElementById('paymentProcessingOverlay');
        if (overlay) {
            overlay.remove();
            console.log('✅ Processing overlay hidden');
        }
    }

    showErrorMessage(message, details = null) {
        this.hideProcessingState();
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
            z-index: 10001;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

        errorDiv.innerHTML = `
            <div style="display: flex; align-items: start; gap: 0.5rem;">
                <svg style="width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">Errore Pagamento</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
                    ${details ? `<div style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.25rem;">${details}</div>` : ''}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                    font-size: 1.2rem;
                    line-height: 1;
                ">×</button>
            </div>
        `;

        // Stile animazione
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(errorDiv);

        // Auto remove dopo 7 secondi
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 7000);

        console.log('❌ Error message shown:', message);
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
            z-index: 10001;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

        successDiv.innerHTML = `
            <div style="display: flex; align-items: start; gap: 0.5rem;">
                <svg style="width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">Successo!</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                    font-size: 1.2rem;
                    line-height: 1;
                ">×</button>
            </div>
        `;

        document.body.appendChild(successDiv);

        // Auto remove dopo 5 secondi
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 5000);

        console.log('✅ Success message shown:', message);
    }

    // ===================================
    // ERROR HANDLING
    // ===================================

    handlePaymentError(method, errorMessage) {
        console.error(`❌ ${method} payment failed:`, errorMessage);
        
        // Errori specifici con soluzioni
        let userMessage = 'Si è verificato un errore durante il pagamento.';
        let suggestion = '';

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            userMessage = 'Problemi di connessione durante il pagamento.';
            suggestion = 'Verifica la tua connessione internet e riprova.';
        } else if (errorMessage.includes('timeout')) {
            userMessage = 'Il pagamento è scaduto per timeout.';
            suggestion = 'Riprova con una connessione più stabile.';
        } else if (errorMessage.includes('declined') || errorMessage.includes('insufficient')) {
            userMessage = 'Pagamento rifiutato dalla banca.';
            suggestion = 'Verifica i dati della carta o prova un altro metodo.';
        } else if (errorMessage.includes('canceled') || errorMessage.includes('cancelled')) {
            userMessage = 'Pagamento annullato.';
            suggestion = 'Nessun addebito effettuato. Puoi riprovare quando vuoi.';
        }

        this.showErrorMessage(userMessage, suggestion);
        
        // Track error per analytics
        this.trackPaymentError(method, errorMessage);
    }

    // ===================================
    // VALIDATION & UTILITIES
    // ===================================

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ===================================
    // ANALYTICS & TRACKING
    // ===================================

    trackPaymentAttempt(method, productId) {
        try {
            console.log('📊 Payment attempt tracked:', { method, productId });
            
            // Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'begin_checkout', {
                    currency: 'EUR',
                    payment_method: method,
                    product_id: productId
                });
            }

            // Facebook Pixel
            if (typeof fbq !== 'undefined') {
                fbq('track', 'InitiateCheckout', {
                    content_type: 'product',
                    content_ids: [productId],
                    payment_method: method
                });
            }

        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    trackPaymentError(method, error) {
        try {
            console.log('📊 Payment error tracked:', { method, error });
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'payment_error', {
                    payment_method: method,
                    error_message: error.substring(0, 100) // Limita lunghezza
                });
            }

        } catch (err) {
            console.error('Analytics error tracking failed:', err);
        }
    }

    trackFreeDownload(productId, email) {
        try {
            console.log('📊 Free download tracked:', { productId, email: email.substring(0, 5) + '***' });
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'generate_lead', {
                    currency: 'EUR',
                    value: 0,
                    product_id: productId,
                    method: 'free_download'
                });
            }

        } catch (error) {
            console.error('Free download tracking error:', error);
        }
    }

    // ===================================
    // DEBUG & SYSTEM INFO
    // ===================================

    logSystemInfo() {
        console.log('🔧 Payment System Info:', {
            version: '2.0 - API Integration',
            features: [
                'Stripe Checkout Integration',
                'PayPal Orders API',
                'Free Download with Email Collection',
                'Error Handling & Recovery',
                'Analytics Tracking',
                'Mobile Responsive'
            ],
            browser: navigator.userAgent.split(' ').pop(),
            timestamp: new Date().toISOString()
        });
    }

    // ===================================
    // STATIC METHODS
    // ===================================

    static getProductInfo(productId) {
        const products = {
            '2-milioni-anni': {
                name: 'Ebook: 2 Milioni di Anni',
                price: 9.90,
                currency: 'EUR'
            },
            'body-construction': {
                name: 'Ebook: Body Under Construction Vol.1',
                price: 24.90,
                currency: 'EUR'
            },
            'wave-system': {
                name: 'Ebook: Il Wave System',
                price: 14.90,
                currency: 'EUR'
            },
            '50-workout': {
                name: '50 Workout da Viaggio',
                price: 0,
                currency: 'EUR'
            }
        };

        return products[productId] || null;
    }
}

// ===================================
// INITIALIZATION
// ===================================

// Inizializza il sistema quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ebookPaymentSystem = new EbookPaymentSystem();
    });
} else {
    window.ebookPaymentSystem = new EbookPaymentSystem();
}

// Global error handler per payment system
window.addEventListener('error', function(e) {
    if (e.error && e.error.message && e.error.message.includes('payment')) {
        console.error('💳 Payment system error caught:', e.error);
        
        if (window.ebookPaymentSystem) {
            window.ebookPaymentSystem.showErrorMessage(
                'Errore imprevisto nel sistema di pagamento',
                'Ricarica la pagina e riprova'
            );
        }
    }
});

// Esporta per testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EbookPaymentSystem };
}

console.log('🚀 Payment System Script Loaded - API Integration Active');