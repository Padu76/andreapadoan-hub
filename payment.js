// payment.js - Sistema pagamenti ebook Andrea Padoan
// Versione sicura - da posizionare nella ROOT del repo

class EbookPaymentSystem {
    constructor() {
        this.init();
    }

    init() {
        console.log('📚 Ebook Payment System - Inizializzato');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Gestione bottoni PayPal → WhatsApp
        document.addEventListener('click', (e) => {
            if (e.target.dataset.paypalProduct) {
                e.preventDefault();
                this.handlePayPalPayment(e.target.dataset.paypalProduct);
            }
            
            if (e.target.dataset.stripeProduct) {
                e.preventDefault();
                this.handleStripePayment(e.target.dataset.stripeProduct);
            }
            
            if (e.target.dataset.freeDownload) {
                e.preventDefault();
                this.handleFreeDownload(e.target.dataset.freeDownload);
            }
        });
    }

    // PayPal → WhatsApp
    handlePayPalPayment(productId) {
        const products = {
            'wave-system': {
                name: 'IL WAVE SYSTEM',
                price: '€14.90',
                description: '6 CICLI COMPLETI DI ALLENAMENTO'
            },
            '2-milioni-anni': {
                name: 'In Forma da 2 Milioni di Anni',
                price: '€19.90',
                description: 'PROGRAMMA ALIMENTARE BRUCIA GRASSI'
            },
            'body-construction': {
                name: 'BODY UNDER CONSTRUCTION VOL: 1',
                price: '€24.90',
                description: '100 ALLENAMENTI PER FORMA PERFETTA'
            }
        };

        const product = products[productId];
        if (!product) {
            alert('Prodotto non trovato!');
            return;
        }

        const message = `Ciao Andrea! 👋

Sono interessato all'ebook "${product.name}" al prezzo di ${product.price}.

${product.description}

Come posso procedere con l'acquisto?

Grazie! 😊`;

        const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        // Analytics
        this.trackEvent('whatsapp_payment_click', productId, product.price);
    }

    // Stripe Payment (placeholder - da implementare se necessario)
    handleStripePayment(productId) {
        // Per ora reindirizza a WhatsApp come PayPal
        this.handlePayPalPayment(productId);
    }

    // Download gratuito con raccolta email
    handleFreeDownload(productId) {
        const email = prompt('📧 Inserisci la tua email per ricevere il download gratuito:');
        
        if (!email) {
            return;
        }

        if (!this.validateEmail(email)) {
            alert('❌ Email non valida! Inserisci un indirizzo email corretto.');
            return;
        }

        // Simula invio email e download
        this.processFreeDownload(email, productId);
    }

    processFreeDownload(email, productId) {
        const products = {
            '50-workout': {
                name: '50 WORKOUT da viaggio',
                downloadUrl: 'https://drive.google.com/file/d/your-file-id/view'
            }
        };

        const product = products[productId];
        if (!product) {
            alert('Prodotto non trovato!');
            return;
        }

        // Mostra messaggio di successo
        alert(`✅ Perfetto! 

Il download di "${product.name}" è stato inviato alla tua email: ${email}

Controlla anche la cartella spam se non lo vedi subito.

Grazie! 🙏`);

        // Apri link download (per ora placeholder)
        setTimeout(() => {
            const message = `Ciao Andrea! 👋

Ho richiesto il download gratuito dell'ebook "${product.name}" con l'email: ${email}

Potresti inviarmi il link di download?

Grazie! 😊`;

            const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }, 2000);

        // Analytics
        this.trackEvent('free_download_request', productId, email);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    trackEvent(action, product, value) {
        console.log('📊 Analytics:', {
            action: action,
            product: product,
            value: value,
            timestamp: new Date().toISOString()
        });

        // Qui puoi aggiungere Google Analytics o altri servizi
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'product_id': product,
                'value': value
            });
        }
    }

    // Metodi di utilità
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4ade80' : '#ef4444'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: bold;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Inizializza il sistema quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inizializzazione Payment System...');
    window.ebookPaymentSystem = new EbookPaymentSystem();
});

// Esponi funzioni globali per compatibilità
window.buyWithPayPal = (productId) => {
    if (window.ebookPaymentSystem) {
        window.ebookPaymentSystem.handlePayPalPayment(productId);
    }
};

window.buyWithStripe = (productId) => {
    if (window.ebookPaymentSystem) {
        window.ebookPaymentSystem.handleStripePayment(productId);
    }
};

window.downloadFree = (productId) => {
    if (window.ebookPaymentSystem) {
        window.ebookPaymentSystem.handleFreeDownload(productId);
    }
};

console.log('💳 Payment System loaded successfully!');