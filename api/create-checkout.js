// api/create-checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId } = req.body;

  // Product configurations
  const products = {
    'wave-system': {
      name: 'IL WAVE SYSTEM',
      description: '6 cicli completi di allenamento per raggiungere la tua forma fisica mai raggiunta.',
      price: 1490, // €14.90 in centesimi
      image: 'https://andreapadoan-hub.vercel.app/images/wave-system-cover.jpg'
    },
    '2-milioni-anni': {
      name: 'In Forma da 2 Milioni di Anni',
      description: 'Il programma alimentare per trasformare il tuo corpo in una macchina brucia grassi.',
      price: 1990, // €19.90 in centesimi
      image: 'https://andreapadoan-hub.vercel.app/images/forma-2-milioni-cover.jpg'
    },
    '50-workout': {
      name: '50 WORKOUT da viaggio',
      description: '50 allenamenti essenziali per mantenerti in forma ovunque tu sia.',
      price: 0, // Gratuito
      image: 'https://andreapadoan-hub.vercel.app/images/workout-viaggio-cover.jpg'
    },
    'body-construction': {
      name: 'BODY UNDER CONSTRUCTION VOL: 1',
      description: '100 allenamenti per una forma perfetta 365 giorni all\'anno.',
      price: 2490, // €24.90 in centesimi
      image: 'https://andreapadoan-hub.vercel.app/images/body-construction-cover.jpg'
    }
  };

  const product = products[productId];
  
  if (!product) {
    return res.status(400).json({ error: 'Product not found' });
  }

  try {
    // Handle free product
    if (product.price === 0) {
      return res.json({ 
        isFree: true,
        downloadUrl: `/api/free-download?product=${productId}`
      });
    }

    // Create Stripe checkout session
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
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/ebook-store/${productId === 'wave-system' ? 'ebook-wave-system.html' : 
                                                        productId === '2-milioni-anni' ? 'ebook-2-milioni-anni.html' :
                                                        productId === '50-workout' ? 'ebook-50-workout.html' : 
                                                        'ebook-body-construction.html'}`,
      metadata: {
        product_id: productId,
        product_name: product.name
      }
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}