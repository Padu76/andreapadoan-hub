// api/free-download.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, product } = req.body;

  if (!email || !product) {
    return res.status(400).json({ error: 'Email and product are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Only allow free download for 50-workout
  if (product !== '50-workout') {
    return res.status(400).json({ error: 'This product is not free' });
  }

  const ebookInfo = {
    title: '50 WORKOUT da viaggio',
    filename: '50-workout-viaggio.pdf',
    downloadUrl: 'https://andreapadoan-hub.vercel.app/downloads/50-workout-viaggio.pdf',
    description: '50 allenamenti essenziali per mantenerti in forma ovunque tu sia.'
  };

  try {
    await sendFreeEbookEmail(email, ebookInfo);
    res.json({ success: true, message: 'Ebook inviato con successo!' });
  } catch (error) {
    console.error('Error sending free ebook:', error);
    res.status(500).json({ error: 'Errore nell\'invio dell\'email' });
  }
}

async function sendFreeEbookEmail(email, ebookInfo) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .download-btn { background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .gift { font-size: 48px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="gift">🎁</div>
          <h1>Il Tuo Ebook Gratuito è Pronto!</h1>
          <p>Un regalo da Andrea Padoan</p>
        </div>
        
        <div class="content">
          <h2>Ciao!</h2>
          <p>Grazie per aver richiesto il mio ebook gratuito <strong>"${ebookInfo.title}"</strong>!</p>
          
          <p>${ebookInfo.description}</p>
          
          <div style="text-align: center;">
            <a href="${ebookInfo.downloadUrl}" class="download-btn">
              📥 SCARICA GRATIS ORA!
            </a>
          </div>
          
          <p><strong>Cosa troverai nell'ebook:</strong></p>
          <ul>
            <li>15 workout per hotel e spazi ristretti</li>
            <li>10 allenamenti per la spiaggia</li>
            <li>10 routine per parchi e outdoor</li>
            <li>5 esercizi discreti per viaggi</li>
            <li>10 workout lampo da 15 minuti</li>
          </ul>
          
          <p>Questo ebook ha un valore reale di €19.90, ma è il mio regalo per te! Se ti piace il mio approccio, dai un'occhiata ai miei altri programmi premium.</p>
          
          <p>Se hai domande o vuoi consigli personalizzati, contattami:</p>
          <p>📱 WhatsApp: +39 347 888 1515<br>
          ✉️ Email: andrea.padoan@gmail.com</p>
          
          <p>Buon allenamento!</p>
          <p><strong>Andrea Padoan</strong><br>Personal Trainer</p>
        </div>
        
        <div class="footer">
          <p>© 2025 Andrea Padoan Personal Trainer. Tutti i diritti riservati.</p>
          <p>Hai ricevuto questa email perché hai richiesto il nostro ebook gratuito.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: 'Andrea Padoan <noreply@andreapadoan-hub.vercel.app>',
    to: email,
    subject: `🎁 Il tuo ebook GRATUITO "${ebookInfo.title}" è pronto!`,
    html: emailTemplate
  });
}