// public/js/payment.js
class EbookPayment {
  constructor() {
    this.stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');
    this.init();
  }

  init() {
    // Bind click events to payment buttons
    document.addEventListener('DOMContentLoaded', () => {
      this.bindPaymentButtons();
      this.bindFreeDownloadForms();
    });
  }

  bindPaymentButtons() {
    // Stripe payment buttons
    const stripeButtons = document.querySelectorAll('[data-stripe-product]');
    stripeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = button.getAttribute('data-stripe-product');
        this.handleStripePayment(productId);
      });
    });

    // PayPal payment buttons (redirect to PayPal checkout)
    const paypalButtons = document.querySelectorAll('[data-paypal-product]');
    paypalButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = button.getAttribute('data-paypal-product');
        this.handlePayPalPayment(productId);
      });
    });
  }

  bindFreeDownloadForms() {
    const freeDownloadForms = document.querySelectorAll('.free-download-form');
    freeDownloadForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFreeDownload(form);
      });
    });

    // Also bind to standalone free download buttons
    const freeButtons = document.querySelectorAll('[data-free-download]');
    freeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.showFreeDownloadModal();
      });
    });
  }

  async handleStripePayment(productId) {
    try {
      // Show loading state
      this.showLoading('Preparazione pagamento...');

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      const { sessionId, isFree, downloadUrl } = await response.json();

      this.hideLoading();

      if (isFree) {
        // Handle free product
        this.showFreeDownloadModal();
        return;
      }

      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        this.showError('Errore nel pagamento: ' + error.message);
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Errore di connessione. Riprova tra un momento.');
      console.error('Payment error:', error);
    }
  }

  handlePayPalPayment(productId) {
    // PayPal payment URLs (you'll need to create these in PayPal)
    const paypalUrls = {
      'wave-system': 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YOUR_WAVE_SYSTEM_ID',
      '2-milioni-anni': 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YOUR_2_MILIONI_ID',
      'body-construction': 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YOUR_BODY_CONSTRUCTION_ID'
    };

    const url = paypalUrls[productId];
    if (url) {
      window.open(url, '_blank');
    } else {
      this.showError('Prodotto non trovato');
    }
  }

  async handleFreeDownload(form) {
    const email = form.querySelector('input[type="email"]').value;
    const productId = '50-workout';

    if (!email) {
      this.showError('Inserisci il tuo indirizzo email');
      return;
    }

    try {
      this.showLoading('Invio ebook in corso...');

      const response = await fetch('/api/free-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, product: productId }),
      });

      const result = await response.json();

      this.hideLoading();

      if (response.ok) {
        this.showSuccess('Ebook inviato! Controlla la tua email.');
        form.reset();
      } else {
        this.showError(result.error || 'Errore nell\'invio');
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Errore di connessione. Riprova tra un momento.');
      console.error('Free download error:', error);
    }
  }

  showFreeDownloadModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md mx-4">
        <h3 class="text-2xl font-bold mb-4 text-gray-800">Scarica Gratis</h3>
        <p class="text-gray-600 mb-6">Inserisci la tua email per ricevere immediatamente l'ebook "50 WORKOUT da viaggio"</p>
        
        <form class="free-download-modal-form">
          <input type="email" placeholder="La tua email" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-green-500">
          
          <div class="flex gap-3">
            <button type="submit" 
                    class="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              📥 Scarica Gratis
            </button>
            <button type="button" onclick="this.closest('.fixed').remove()"
                    class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
              Annulla
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind form submission
    modal.querySelector('.free-download-modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFreeDownload(e.target);
      modal.remove();
    });
  }

  showLoading(message) {
    const existing = document.querySelector('.payment-loading');
    if (existing) existing.remove();

    const loading = document.createElement('div');
    loading.className = 'payment-loading fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loading.innerHTML = `
      <div class="bg-white rounded-lg p-8 flex items-center space-x-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span class="text-lg font-semibold">${message}</span>
      </div>
    `;
    document.body.appendChild(loading);
  }

  hideLoading() {
    const loading = document.querySelector('.payment-loading');
    if (loading) loading.remove();
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform`;
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

// Initialize payment system
new EbookPayment();