// /api/free-download.js
// API per invio email automatiche ebook gratuiti con Resend
// Andrea Padoan Ebooks - Versione 3.0

import { Resend } from 'resend';

// Inizializza Resend con API Key
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, product } = req.body;

        // Validazione input
        if (!email || !product) {
            return res.status(400).json({ error: 'Email and product are required' });
        }

        // Valida formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Solo 50-workout è gratuito
        if (product !== '50-workout') {
            return res.status(400).json({ error: 'This product is not free' });
        }

        console.log('🎁 Processing free download:', { 
            product, 
            email: email.substring(0, 5) + '***',
            timestamp: new Date().toISOString()
        });

        // Configurazione ebook
        const ebookInfo = {
            title: '50 WORKOUT da viaggio',
            filename: '50-workout-viaggio.pdf',
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            description: '50 allenamenti essenziali per mantenerti in forma ovunque tu sia.',
            value: '19.90'
        };

        // Invia email con ebook
        await sendFreeEbookEmail(email, ebookInfo);

        console.log('✅ Free ebook email sent successfully to:', email.substring(0, 5) + '***');

        // Risposta successo
        return res.status(200).json({ 
            success: true, 
            message: 'Ebook inviato con successo!',
            email: email.substring(0, 5) + '***'
        });

    } catch (error) {
        console.error('❌ Free download API error:', error);
        
        // Gestione errori specifici Resend
        if (error.message?.includes('API key')) {
            return res.status(500).json({ 
                error: 'Errore configurazione email',
                details: 'API key non valida'
            });
        }
        
        if (error.message?.includes('rate limit')) {
            return res.status(429).json({ 
                error: 'Troppe richieste email',
                details: 'Riprova tra qualche minuto'
            });
        }
        
        if (error.message?.includes('invalid email')) {
            return res.status(400).json({ 
                error: 'Indirizzo email non valido'
            });
        }

        // Errore generico
        return res.status(500).json({ 
            error: 'Errore nell\'invio dell\'email',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Funzione per inviare email ebook gratuito
async function sendFreeEbookEmail(email, ebookInfo) {
    try {
        // Template HTML professionale
        const emailTemplate = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Il tuo ebook gratuito è pronto!</title>
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0; 
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header { 
                        background: linear-gradient(135deg, #10b981, #059669); 
                        color: white; 
                        padding: 40px 30px; 
                        text-align: center; 
                        border-radius: 10px 10px 0 0; 
                    }
                    .content { 
                        background: #ffffff; 
                        padding: 40px 30px; 
                        border-radius: 0 0 10px 10px; 
                    }
                    .download-btn { 
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white; 
                        padding: 18px 35px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold; 
                        font-size: 16px;
                        margin: 25px 0;
                        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                        transition: all 0.3s ease;
                    }
                    .download-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 40px; 
                        color: #666; 
                        font-size: 14px; 
                        padding: 20px;
                        border-top: 1px solid #eee;
                    }
                    .gift { 
                        font-size: 48px; 
                        text-align: center; 
                        margin: 20px 0; 
                    }
                    .value-badge {
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        display: inline-block;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    .feature-list {
                        background: #f8fafc;
                        padding: 25px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .feature-list li {
                        margin: 8px 0;
                        padding-left: 20px;
                        position: relative;
                    }
                    .feature-list li:before {
                        content: "💪";
                        position: absolute;
                        left: 0;
                    }
                    .cta-section {
                        background: linear-gradient(135deg, #eff6ff, #dbeafe);
                        padding: 25px;
                        border-radius: 8px;
                        margin: 25px 0;
                        text-align: center;
                    }
                    .contact-info {
                        background: #f1f5f9;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="gift">🎁</div>
                        <h1 style="margin: 0; font-size: 28px;">Il Tuo Ebook Gratuito è Pronto!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Un regalo speciale da Andrea Padoan</p>
                    </div>
                    
                    <div class="content">
                        <h2 style="color: #059669; margin-bottom: 20px;">Ciao!</h2>
                        
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Grazie per aver richiesto il mio ebook gratuito <strong>"${ebookInfo.title}"</strong>!
                        </p>
                        
                        <div class="value-badge">
                            🏷️ Valore: €${ebookInfo.value} - OMAGGIO PER TE!
                        </div>
                        
                        <p style="font-size: 16px; margin: 20px 0;">
                            ${ebookInfo.description}
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${ebookInfo.downloadUrl}" class="download-btn">
                                📥 SCARICA GRATIS ORA!
                            </a>
                        </div>
                        
                        <div class="feature-list">
                            <h3 style="color: #059669; margin-top: 0;">🏋️‍♂️ Cosa troverai nell'ebook:</h3>
                            <ul style="margin: 0; padding-left: 0; list-style: none;">
                                <li>15 workout per hotel e spazi ristretti</li>
                                <li>10 allenamenti per la spiaggia e outdoor</li>
                                <li>10 routine per parchi pubblici</li>
                                <li>5 esercizi discreti durante i viaggi</li>
                                <li>10 workout lampo da 15 minuti</li>
                                <li>Guida completa per ogni livello</li>
                            </ul>
                        </div>
                        
                        <div class="cta-section">
                            <h3 style="color: #2563eb; margin-top: 0;">🚀 Ti è piaciuto questo contenuto?</h3>
                            <p style="margin-bottom: 15px;">Scopri i miei programmi premium completi:</p>
                            <a href="https://andreapadoan-hub.vercel.app/ebooks.html" 
                               style="color: #2563eb; text-decoration: none; font-weight: bold;">
                                👉 Vedi tutti i miei ebook
                            </a>
                        </div>
                        
                        <div class="contact-info">
                            <h3 style="color: #059669; margin-top: 0;">📞 Hai domande o vuoi consigli personalizzati?</h3>
                            <p style="margin-bottom: 10px;"><strong>Contattami direttamente:</strong></p>
                            <p style="margin: 5px 0;">
                                📱 <strong>WhatsApp:</strong> 
                                <a href="https://wa.me/393478881515" style="color: #25d366; text-decoration: none;">
                                    +39 347 888 1515
                                </a>
                            </p>
                            <p style="margin: 5px 0;">
                                ✉️ <strong>Email:</strong> 
                                <a href="mailto:andrea.padoan@gmail.com" style="color: #059669; text-decoration: none;">
                                    andrea.padoan@gmail.com
                                </a>
                            </p>
                            <p style="margin: 15px 0 5px 0;">
                                🌐 <strong>Sito web:</strong> 
                                <a href="https://www.personaltrainerverona.it" style="color: #2563eb; text-decoration: none;">
                                    www.personaltrainerverona.it
                                </a>
                            </p>
                        </div>
                        
                        <p style="font-size: 16px; margin-top: 30px;">
                            Questo ebook rappresenta anni di esperienza nel fitness e personal training. 
                            Sono sicuro che ti aiuterà a mantenerti in forma ovunque tu sia! 💪
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 0;">
                            <strong>Buon allenamento!</strong><br>
                            <span style="color: #059669; font-size: 18px; font-weight: bold;">Andrea Padoan</span><br>
                            <em>Personal Trainer Certificato</em>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0 0 10px 0;">
                            © 2025 Andrea Padoan Personal Trainer. Tutti i diritti riservati.
                        </p>
                        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                            Hai ricevuto questa email perché hai richiesto il nostro ebook gratuito su 
                            <a href="https://andreapadoan-hub.vercel.app" style="color: #059669;">andreapadoan-hub.vercel.app</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Invia email tramite Resend
        const result = await resend.emails.send({
            from: 'Andrea Padoan <noreply@resend.dev>', // Email default Resend
            to: email,
            subject: `🎁 Il tuo ebook GRATUITO "${ebookInfo.title}" è pronto!`,
            html: emailTemplate,
            headers: {
                'X-Entity-Ref-ID': `ebook-${Date.now()}`,
            },
            tags: [
                {
                    name: 'category',
                    value: 'free-ebook'
                },
                {
                    name: 'product',
                    value: '50-workout'
                }
            ]
        });

        console.log('✅ Resend email sent:', {
            id: result.data?.id,
            to: email.substring(0, 5) + '***'
        });

        return result;

    } catch (error) {
        console.error('❌ Resend email error:', error);
        throw error;
    }
}

// Test endpoint per verificare configurazione
export async function testResendConnection() {
    try {
        const result = await resend.emails.send({
            from: 'Test <noreply@resend.dev>',
            to: 'test@example.com',
            subject: 'Test Connection',
            html: '<p>Test email</p>'
        });
        
        return { success: true, id: result.data?.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
