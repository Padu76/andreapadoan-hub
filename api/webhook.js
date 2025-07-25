// api/webhook.js
import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Get customer email and product info
    const customerEmail = session.customer_details.email;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const productName = lineItems.data[0].description;
    
    // Determine which ebook to send based on product
    let ebookInfo = getEbookInfo(productName);
    
    if (ebookInfo) {
      try {
        // Send email with ebook
        await sendEbookEmail(customerEmail, ebookInfo);
        console.log(`Ebook sent to ${customerEmail} for product: ${productName}`);
      } catch (error) {
        console.error('Error sending ebook:', error);
      }
    }
  }

  res.json({ received: true });
}

function getEbookInfo(productName) {
  const ebooks = {
    'IL WAVE SYSTEM': {
      title: 'IL WAVE SYSTEM',
      filename: 'wave-system.pdf',
      downloadUrl: 'https://andreapadoan-hub.vercel.app/downloads/wave-system.pdf',
      description: '6 cicli completi di allenamento per raggiungere la tua forma fisica mai raggiunta.'
    },
    'In Forma da 2 Milioni di Anni': {
      title: 'In Forma da 2 Milioni di Anni',
      filename: 'forma-2-milioni-anni.pdf', 
      downloadUrl: 'https://andreapadoan-hub.vercel.app/downloads/forma-2-milioni-anni.pdf',
      description: 'Il programma alimentare per trasformare il tuo corpo in una macchina brucia grassi.'
    },
    '50 WORKOUT da viaggio': {
      title: '50 WORKOUT da viaggio',
      filename: '50-workout-viaggio.pdf',
      downloadUrl: 'https://andreapadoan-hub.vercel.app/downloads/50-workout-viaggio.pdf', 
      description: '50 allenamenti essenziali per mantenerti in forma ovunque tu sia.'
    },
    'BODY UNDER CONSTRUCTION VOL: 1': {
      title: 'BODY UNDER CONSTRUCTION VOL: 1',
      filename: 'body-under-construction.pdf',
      downloadUrl: 'https://andreapadoan-hub.vercel.app/downloads/body-under-construction.pdf',
      description: '100 allenamenti per una forma perfetta 365 giorni all\'anno.'
    }
  };

  return ebooks[productName] || null;
}

async function sendEbookEmail(email, ebookInfo) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .download-btn { background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Il Tuo Ebook è Pronto!</h1>
          <p>Grazie per aver scelto Andrea Padoan</p>
        </div>
        
        <div class="content">
          <h2>Ciao!</h2>
          <p>Grazie per il tuo acquisto! Il tuo ebook <strong>"${ebookInfo.title}"</strong> è pronto per il download.</p>
          
          <p>${ebookInfo.description}</p>
          
          <div style="text-align: center;">
            <a href="${ebookInfo.downloadUrl}" class="download-btn">
              📥 SCARICA IL TUO EBOOK
            </a>
          </div>
          
          <p><strong>Nota importante:</strong></p>
          <ul>
            <li>Il link di download è valido per 30 giorni</li>
            <li>Puoi scaricare il file più volte entro questo periodo</li>
            <li>Salva il PDF sul tuo dispositivo per accesso futuro</li>
          </ul>
          
          <p>Se hai domande o problemi con il download, non esitare a contattarmi:</p>
          <p>📱 WhatsApp: +39 347 888 1515<br>
          ✉️ Email: andrea.padoan@gmail.com</p>
          
          <p>Buon allenamento!</p>
          <p><strong>Andrea Padoan</strong><br>Personal Trainer</p>
        </div>
        
        <div class="footer">
          <p>© 2025 Andrea Padoan Personal Trainer. Tutti i diritti riservati.</p>
          <p>Hai ricevuto questa email perché hai acquistato un ebook dal nostro store.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: 'Andrea Padoan <noreply@andreapadoan-hub.vercel.app>',
    to: email,
    subject: `🎉 Il tuo ebook "${ebookInfo.title}" è pronto!`,
    html: emailTemplate
  });
}