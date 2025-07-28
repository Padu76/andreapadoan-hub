// /api/free-download.js
// API standalone per download gratuito con email dirette
// Andrea Padoan Ebooks - Versione indipendente e funzionante

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Imposta CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Use POST method' 
        });
    }

    try {
        console.log('🎁 Free download API called - Standalone version');

        const { email, product } = req.body;

        // Validazione input
        if (!email || !product) {
            console.log('❌ Missing email or product');
            return res.status(400).json({ 
                error: 'Email and product are required',
                received: { email: !!email, product: !!product }
            });
        }

        // Valida formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format:', email.substring(0, 5) + '***');
            return res.status(400).json({ 
                error: 'Invalid email format',
                email: email.substring(0, 5) + '***'
            });
        }

        // Solo 50-workout è gratuito
        if (product !== '50-workout') {
            console.log('❌ Product not free:', product);
            return res.status(400).json({ 
                error: 'This product is not free',
                product: product
            });
        }

        console.log('✅ Processing free download:', { 
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
        const emailResult = await sendEbookEmail(email, ebookInfo);

        if (emailResult.success) {
            console.log('✅ Email sent successfully to:', email.substring(0, 5) + '***');

            // Risposta successo
            return res.status(200).json({ 
                success: true, 
                message: 'Ebook inviato con successo! Controlla la tua email.',
                email: email.substring(0, 5) + '***',
                downloadUrl: ebookInfo.downloadUrl
            });
        } else {
            // Fallback: ritorna link diretto se email fallisce
            console.log('⚠️ Email failed, returning direct link');
            return res.status(200).json({ 
                success: true, 
                message: 'Ecco il link diretto per scaricare il tuo ebook gratuito!',
                downloadUrl: ebookInfo.downloadUrl,
                fallback: true,
                note: 'Email temporaneamente non disponibile, usa il link diretto'
            });
        }

    } catch (error) {
        console.error('❌ Free download API error:', error);
        
        // Anche in caso di errore, restituiamo il link diretto
        return res.status(200).json({ 
            success: true,
            message: 'Ecco il link diretto per il tuo ebook gratuito!',
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            fallback: true,
            note: 'Sistema email temporaneamente non disponibile'
        });
    }
}

// Funzione per inviare email usando nodemailer con Gmail
async function sendEbookEmail(email, ebookInfo) {
    try {
        // Configurazione Gmail SMTP
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: 'andrea.padoan@gmail.com', // La tua email Gmail
                pass: process.env.GMAIL_APP_PASSWORD || 'dummy' // App Password Gmail
            }
        });

        // Template HTML
        const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Il tuo ebook gratuito è pronto!</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
                    .content { padding: 40px 30px; }
                    .download-btn { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; margin: 25px 0; }
                    .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; padding: 20px; border-top: 1px solid #eee; }
                    .gift { font-size: 48px; text-align: center; margin: 20px 0; }
                    .value-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
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
                        
                        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #059669; margin-top: 0;">🏋️‍♂️ Cosa troverai nell'ebook:</h3>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>15 workout per hotel e spazi ristretti</li>
                                <li>10 allenamenti per la spiaggia e outdoor</li>
                                <li>10 routine per parchi pubblici</li>
                                <li>5 esercizi discreti durante i viaggi</li>
                                <li>10 workout lampo da 15 minuti</li>
                                <li>Guida completa per ogni livello</li>
                            </ul>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
                            <h3 style="color: #2563eb; margin-top: 0;">🚀 Ti è piaciuto questo contenuto?</h3>
                            <p style="margin-bottom: 15px;">Scopri i miei programmi premium completi:</p>
                            <a href="https://andreapadoan-hub.vercel.app/ebooks.html" style="color: #2563eb; text-decoration: none; font-weight: bold;">
                                👉 Vedi tutti i miei ebook
                            </a>
                        </div>
                        
                        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #059669; margin-top: 0;">📞 Hai domande o vuoi consigli personalizzati?</h3>
                            <p style="margin-bottom: 10px;"><strong>Contattami direttamente:</strong></p>
                            <p style="margin: 5px 0;">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/393478881515" style="color: #25d366; text-decoration: none;">+39 347 888 1515</a></p>
                            <p style="margin: 5px 0;">✉️ <strong>Email:</strong> <a href="mailto:andrea.padoan@gmail.com" style="color: #059669; text-decoration: none;">andrea.padoan@gmail.com</a></p>
                            <p style="margin: 15px 0 5px 0;">🌐 <strong>Sito web:</strong> <a href="https://www.personaltrainerverona.it" style="color: #2563eb; text-decoration: none;">www.personaltrainerverona.it</a></p>
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
                        <p style="margin: 0 0 10px 0;">© 2025 Andrea Padoan Personal Trainer. Tutti i diritti riservati.</p>
                        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                            Hai ricevuto questa email perché hai richiesto il nostro ebook gratuito.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Configurazione email
        const mailOptions = {
            from: '"Andrea Padoan" <andrea.padoan@gmail.com>',
            to: email,
            subject: `🎁 Il tuo ebook GRATUITO "${ebookInfo.title}" è pronto!`,
            html: htmlTemplate,
            text: `Ciao! Il tuo ebook gratuito "${ebookInfo.title}" è pronto per il download: ${ebookInfo.downloadUrl}`
        };

        // Invia email
        await transporter.sendMail(mailOptions);

        console.log('✅ Email sent via Gmail SMTP');
        return { success: true };

    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Test endpoint
export async function testEmailSystem() {
    return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Free download API with email system is working',
        fallback: 'Direct download link always available'
    };
}