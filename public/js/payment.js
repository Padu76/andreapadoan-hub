// public/js/payment.js - Sistema di pagamento completo
class EbookPaymentSystem {
    constructor() {
        this.stripe = null;
        this.init();
    }

    async init() {
        try {
            // Inizializza Stripe solo se disponibile
            if (typeof Stripe !== 'undefined') {
                this.stripe = Stripe(this.getStripePublishableKey());
            }
            
            this.bindEvents();
            console.log('✅ Sistema pagamenti inizializzato');
        } catch (error) {
            console.error('❌ Errore inizializzazione pagamenti:', error);
        }
    }

    getStripePublishableKey() {
        // Chiave pubblica Stripe - pk_live_51Mc3WmIYsn5WJ3XKfVY9mm0YZZeUfJ1GyZKjyq1JmA2T37zjQgcjSetaEBAjGTLCnC18Qm7iQ5E7jj5lG9XL4xig00n1Zj4kmZ

        return 'pk_test_your_publishable_key_here';
    }

    bindEvents() {
        // Event listeners per bottoni Stripe
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-stripe-product]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-stripe-product');
                this.handleStripePayment(productId);
            }
        });

        // Event listeners per bottoni PayPal
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-paypal-product]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-paypal-product');
                this.handlePayPalPayment(productId);
            }
        });

        // Event listeners per download gratuiti
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.free-download-form')) {
                e.preventDefault();
                this.handleFreeDownload(e.target);
            }
        });
    }

    async handleStripePayment(productId) {
        if (!this.stripe) {
            alert('Stripe non disponibile. Contattaci su WhatsApp!');
            return;
        }

        try {
            this.showLoading('Preparazione pagamento...');
            
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId })
            });

            if (!response.ok) {
                throw new Error(`Errore server: ${response.status}`);
            }

            const { sessionId, isFree, downloadUrl } = await response.json();

            if (isFree) {
                // Prodotto gratuito - redirect diretto al download
                this.showSuccess('Download gratuito pronto!');
                setTimeout(() => {
                    window.location.href = downloadUrl;
                }, 1500);
                return;
            }

            // Redirect a Stripe Checkout
            const result = await this.stripe.redirectToCheckout({ sessionId });
            
            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('❌ Errore pagamento Stripe:', error);
            this.showError('Errore nel pagamento. Riprova o contattaci su WhatsApp!');
        } finally {
            this.hideLoading();
        }
    }

    handlePayPalPayment(productId) {
        // Per ora redirect a WhatsApp per PayPal
        const message = `Ciao! Vorrei acquistare l'ebook ${productId} tramite PayPal.`;
        const whatsappUrl = `https://wa.me/3478881515?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    async handleFreeDownload(form) {
        try {
            this.showLoading('Preparazione download...');
            
            const formData = new FormData(form);
            const email = formData.get('email');
            const productId = formData.get('product-id') || '50-workout';

            if (!email || !this.isValidEmail(email)) {
                throw new Error('Inserisci un email valida');
            }

            const response = await fetch('/api/free-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    productId,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`Errore server: ${response.status}`);
            }

            const result = await response.json();
            
            this.showSuccess('Email inviata! Controlla la tua casella di posta.');
            form.reset();

        } catch (error) {
            console.error('❌ Errore download gratuito:', error);
            this.showError(error.message || 'Errore nel download. Riprova!');
        } finally {
            this.hideLoading();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showLoading(message = 'Caricamento...') {
        this.removeNotifications();
        
        const loading = document.createElement('div');
        loading.id = 'payment-loading';
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 16px;
            font-weight: bold;
        `;
        loading.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 10px;">${message}</div>
                <div style="border: 3px solid #f3f3f3; border-top: 3px solid #ff6b35; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('payment-loading');
        if (loading) {
            loading.remove();
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        this.removeNotifications();
        
        const notification = document.createElement('div');
        notification.className = 'payment-notification';
        
        const bgColor = type === 'success' ? '#4ade80' : type === 'error' ? '#ef4444' : '#3b82f6';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove dopo 5 secondi
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    removeNotifications() {
        const existing = document.querySelectorAll('.payment-notification, #payment-loading');
        existing.forEach(el => el.remove());
    }
}

// Funzioni di utilità globali
window.EbookUtils = {
    formatPrice: (price) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    },

    openWhatsApp: (message = '') => {
        const defaultMessage = 'Ciao Andrea! Ho visto il tuo sito e vorrei maggiori informazioni.';
        const finalMessage = message || defaultMessage;
        const url = `https://wa.me/3478881515?text=${encodeURIComponent(finalMessage)}`;
        window.open(url, '_blank');
    },

    redirectToSuccess: () => {
        window.location.href = '/success.html';
    }
};

// Inizializzazione automatica quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inizializzazione sistema pagamenti...');
    
    // Inizializza il sistema di pagamento
    window.ebookPayment = new EbookPaymentSystem();
    
    // Aggiungi attributi mancanti ai bottoni esistenti se necessario
    setTimeout(() => {
        EbookUtils.addMissingAttributes();
    }, 1000);
    
    console.log('✅ Sistema pagamenti pronto!');
});

// Utilità per aggiungere attributi ai bottoni esistenti
window.EbookUtils.addMissingAttributes = function() {
    // Trova bottoni senza attributi e aggiungili basandosi sulla pagina
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('wave-system')) {
        const stripeBtn = document.querySelector('button:not([data-stripe-product])');
        if (stripeBtn && stripeBtn.textContent.includes('Stripe')) {
            stripeBtn.setAttribute('data-stripe-product', 'wave-system');
        }
    }
    
    if (currentPage.includes('2-milioni-anni')) {
        const stripeBtn = document.querySelector('button:not([data-stripe-product])');
        if (stripeBtn && stripeBtn.textContent.includes('Stripe')) {
            stripeBtn.setAttribute('data-stripe-product', '2-milioni-anni');
        }
    }
    
    if (currentPage.includes('50-workout')) {
        const form = document.querySelector('form:not(.free-download-form)');
        if (form) {
            form.classList.add('free-download-form');
        }
    }
    
    if (currentPage.includes('body-construction')) {
        const stripeBtn = document.querySelector('button:not([data-stripe-product])');
        if (stripeBtn && stripeBtn.textContent.includes('Stripe')) {
            stripeBtn.setAttribute('data-stripe-product', 'body-construction');
        }
    }
};

console.log('📄 Payment system script loaded');