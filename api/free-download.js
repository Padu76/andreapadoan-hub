// /api/free-download.js
// API FIXATA con Resend per email automatiche + SALVATAGGIO AIRTABLE
// Andrea Padoan Ebooks - Versione COMPLETA con tracking

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🎁 Free download API FIXATA con Airtable tracking');

        const { email, product } = req.body;

        // Validazione rigorosa
        if (!email || !product) {
            console.error('❌ Missing required fields:', { email: !!email, product: !!product });
            return res.status(400).json({ 
                success: false,
                error: 'Email and product required' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('❌ Invalid email format:', email);
            return res.status(400).json({ 
                success: false,
                error: 'Invalid email format' 
            });
        }

        if (product !== '50-workout') {
            console.error('❌ Invalid product:', product);
            return res.status(400).json({ 
                success: false,
                error: 'Product not available for free download' 
            });
        }

        console.log('✅ Processing:', { product, email: email.substring(0, 5) + '***' });

        // Configurazione ebook
        const ebookInfo = {
            title: '50 WORKOUT da viaggio',
            downloadUrl: '/ebook-store/50-workout-viaggio.pdf',
            fullDownloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            description: '50 allenamenti essenziali per mantenerti in forma ovunque tu sia.',
            value: '19.90'
        };

        // DATI PER TRACKING
        const userAgent = req.headers['user-agent'] || '';
        const sessionId = generateSessionId();
        const timestamp = new Date().toISOString();
        
        // Determina priorità lead basata su ora e pattern email
        const leadPriority = determineLead Priority(email, userAgent);

        // SALVA SU AIRTABLE PRIMA di inviare email
        let airtableSaved = false;
        let airtableError = null;

        try {
            await saveToAirtable({
                email,
                productId: product,
                productTitle: ebookInfo.title,
                transactionType: 'free',
                amount: 0,
                paymentMethod: 'email',
                status: 'pending', // Inizialmente pending, poi completed dopo email
                timestamp,
                customerCountry: 'IT', // Default, potrebbe essere migliorato con IP geolocation
                sessionId,
                userAgent,
                downloadCount: 0,
                leadPriority,
                followUpStatus: 'New',
                revenueCategory: 'Lead Generation',
                marketingSource: determineMarketingSource(req.headers.referer)
            });
            
            airtableSaved = true;
            console.log('✅ Transaction saved to Airtable');

        } catch (error) {
            airtableError = error;
            console.error('❌ Failed to save to Airtable:', error.message);
            // Non fermiamo il processo, continuiamo con l'invio email
        }

        // INVIO EMAIL AUTOMATICO FIXATO
        let emailSent = false;
        let emailError = null;
        let emailId = null;

        try {
            const emailResult = await resend.emails.send({
                from: 'Andrea Padoan Personal Trainer <andrea.padoan@gmail.com>',
                to: email,
                subject: `🎁 Il tuo ebook GRATUITO "${ebookInfo.title}" è pronto!`,
                html: createEmailTemplate(ebookInfo),
                headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'Importance': 'high',
                    'Reply-To': 'andrea.padoan@gmail.com'
                },
                tags: [
                    { name: 'category', value: 'free-ebook' },
                    { name: 'product', value: product },
                    { name: 'version', value: 'airtable-tracking-v1' }
                ]
            });

            if (emailResult.data?.id) {
                emailSent = true;
                emailId = emailResult.data.id;
                console.log('✅ Email sent successfully via Resend:', emailId);
                
                // AGGIORNA AIRTABLE: transaction completata
                if (airtableSaved) {
                    try {
                        await updateAirtableTransactionStatus(sessionId, 'completed', {
                            downloadCount: 1,
                            lastDownload: timestamp
                        });
                        console.log('✅ Airtable transaction updated to completed');
                    } catch (updateError) {
                        console.error('⚠️ Failed to update Airtable status:', updateError.message);
                    }
                }
            } else {
                throw new Error('No email ID returned from Resend');
            }

        } catch (error) {
            emailError = error;
            console.error('❌ Resend email failed:', {
                error: error.message,
                name: error.name,
                stack: error.stack?.substring(0, 500)
            });
            
            // AGGIORNA AIRTABLE: transaction fallita
            if (airtableSaved) {
                try {
                    await updateAirtableTransactionStatus(sessionId, 'failed');
                    console.log('✅ Airtable transaction updated to failed');
                } catch (updateError) {
                    console.error('⚠️ Failed to update Airtable status to failed:', updateError.message);
                }
            }
        }

        // Notifica Telegram con dettagli completi
        await sendTelegramNotification(email, ebookInfo, emailSent, emailError, airtableSaved, airtableError);

        // RISPOSTA BASATA SUL SUCCESSO REALE
        if (emailSent) {
            return res.status(200).json({
                success: true,
                message: 'Email inviata con successo! Controlla la tua casella email.',
                downloadUrl: ebookInfo.fullDownloadUrl,
                email: email.substring(0, 3) + '***@' + email.split('@')[1],
                emailId: emailId,
                sent: true,
                tracked: airtableSaved,
                sessionId: sessionId
            });
        } else {
            console.error('❌ Email delivery failed, providing fallback');
            
            return res.status(200).json({
                success: true,
                message: 'Ecco il link diretto per il tuo ebook gratuito!',
                downloadUrl: ebookInfo.fullDownloadUrl,
                fallback: true,
                sent: false,
                tracked: airtableSaved,
                note: 'Email temporaneamente non disponibile. Salva questo link!',
                warning: 'Controlla la cartella spam o usa il link diretto sopra'
            });
        }

    } catch (error) {
        console.error('❌ API Critical Error:', {
            message: error.message,
            stack: error.stack?.substring(0, 500)
        });

        // Notifica errore critico
        await sendTelegramNotification(
            req.body?.email || 'unknown', 
            null, 
            false, 
            error,
            false,
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Errore temporaneo del server',
            message: 'Riprova tra qualche minuto',
            downloadUrl: 'https://andreapadoan-hub.vercel.app/ebook-store/50-workout-viaggio.pdf',
            fallback: true
        });
    }
}

// SALVA TRANSAZIONE SU AIRTABLE
async function saveToAirtable(transactionData) {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const EBOOK_TABLE = 'ebook_transactions';
    
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        throw new Error('Airtable credentials missing');
    }
    
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${EBOOK_TABLE}`;
    
    const record = {
        fields: {
            Email: transactionData.email,
            Product_ID: transactionData.productId,
            Product_Title: transactionData.productTitle,
            Transaction_Type: transactionData.transactionType,
            Amount: transactionData.amount,
            Payment_Method: transactionData.paymentMethod,
            Status: transactionData.status,
            Timestamp: transactionData.timestamp,
            Customer_Country: transactionData.customerCountry,
            Session_ID: transactionData.sessionId,
            User_Agent: transactionData.userAgent,
            Download_Count: transactionData.downloadCount,
            Lead_Priority: transactionData.leadPriority,
            Follow_Up_Status: transactionData.followUpStatus,
            Revenue_Category: transactionData.revenueCategory,
            Marketing_Source: transactionData.marketingSource
        }
    };

    const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// AGGIORNA STATUS TRANSAZIONE SU AIRTABLE
async function updateAirtableTransactionStatus(sessionId, status, additionalFields = {}) {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const EBOOK_TABLE = 'ebook_transactions';
    
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        console.warn('⚠️ Airtable credentials missing for update');
        return;
    }
    
    // Prima trova il record con Session_ID
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${EBOOK_TABLE}?filterByFormula={Session_ID}="${sessionId}"`;
    
    const searchResponse = await fetch(searchUrl, {
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!searchResponse.ok) {
        throw new Error(`Failed to find record: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (searchData.records.length === 0) {
        throw new Error(`No record found with Session_ID: ${sessionId}`);
    }

    const recordId = searchData.records[0].id;
    
    // Ora aggiorna il record
    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${EBOOK_TABLE}/${recordId}`;
    
    const updateFields = {
        Status: status,
        ...additionalFields
    };
    
    if (status === 'completed' && additionalFields.lastDownload) {
        updateFields.Last_Download = additionalFields.lastDownload;
    }

    const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: updateFields
        })
    });

    if (!updateResponse.ok) {
        const errorData = await updateResponse.text();
        throw new Error(`Failed to update record: ${updateResponse.status} - ${errorData}`);
    }

    return await updateResponse.json();
}

// UTILITY FUNCTIONS
function generateSessionId() {
    return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function determineLead Priority(email, userAgent) {
    let priority = 'Medium'; // Default
    
    // Pattern email business/professionali = Higher priority
    if (email.includes('.com') || email.includes('.it') || email.includes('.org')) {
        priority = 'Medium';
    }
    
    // Gmail = più comune, priority normale
    if (email.includes('@gmail.com')) {
        priority = 'Medium';
    }
    
    // Domini business
    if (!email.includes('@gmail.com') && !email.includes('@yahoo.') && !email.includes('@hotmail.') && !email.includes('@libero.')) {
        priority = 'High';
    }
    
    // Mobile vs Desktop (mobile = più engaged)
    if (userAgent.toLowerCase().includes('mobile')) {
        if (priority === 'Medium') priority = 'High';
    }
    
    return priority;
}

function determineMarketingSource(referer) {
    if (!referer) return 'Direct';
    
    if (referer.includes('google.')) return 'Google Search';
    if (referer.includes('facebook.') || referer.includes('fb.')) return 'Facebook';
    if (referer.includes('instagram.')) return 'Instagram';
    if (referer.includes('linkedin.')) return 'LinkedIn';
    if (referer.includes('youtube.')) return 'YouTube';
    if (referer.includes('whatsapp.')) return 'WhatsApp';
    if (referer.includes('andreapadoan-hub.vercel.app')) return 'Website';
    
    return 'Referral';
}

// Template email HTML MIGLIORATO (keeping existing template)
function createEmailTemplate(ebookInfo) {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Il tuo ebook gratuito è pronto!</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body { 
            font-family: Arial, Helvetica, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            -webkit-border-radius: 8px;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
        }
        
        .content { 
            padding: 40px 30px; 
        }
        
        .download-btn { 
            background: linear-gradient(135deg, #10b981, #059669) !important; 
            color: white !important; 
            padding: 18px 35px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 25px 0;
            border: none;
            cursor: pointer;
        }
        
        .download-btn:hover {
            background: linear-gradient(135deg, #34d399, #10b981) !important;
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
        
        .feature-box { 
            background: #f8fafc; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        
        .cta-box { 
            background: linear-gradient(135deg, #eff6ff, #dbeafe); 
            padding: 25px; 
            border-radius: 8px; 
            margin: 25px 0; 
            text-align: center; 
        }
        
        .contact-box { 
            background: #f1f5f9; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }

        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 0 !important;
            }
            .content {
                padding: 20px !important;
            }
            .header {
                padding: 30px 20px !important;
            }
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
            <h2 style="color: #059669; margin-bottom: 20px;">Ciao e grazie!</h2>
            
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
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px;">
                            <a href="${ebookInfo.fullDownloadUrl}" 
                               style="display: inline-block; padding: 18px 35px; color: white; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px;"
                               target="_blank">
                                📥 SCARICA GRATIS ORA!
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>Link diretto (copia e incolla):</strong><br>
                    <code style="font-size: 12px; word-break: break-all;">${ebookInfo.fullDownloadUrl}</code>
                </p>
            </div>
            
            <div class="feature-box">
                <h3 style="color: #059669; margin-top: 0;">🏋️‍♂️ Cosa troverai nell'ebook:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>15 workout</strong> per hotel e spazi ristretti</li>
                    <li><strong>10 allenamenti</strong> per la spiaggia e outdoor</li>
                    <li><strong>10 routine</strong> per parchi pubblici</li>
                    <li><strong>5 esercizi discreti</strong> durante i viaggi</li>
                    <li><strong>10 workout lampo</strong> da 15 minuti</li>
                    <li><strong>Guida completa</strong> per ogni livello di fitness</li>
                </ul>
            </div>
            
            <div class="cta-box">
                <h3 style="color: #2563eb; margin-top: 0;">🚀 Ti è piaciuto questo contenuto?</h3>
                <p style="margin-bottom: 15px;">Scopri i miei programmi premium completi per trasformare il tuo corpo:</p>
                <a href="https://andreapadoan-hub.vercel.app/ebooks.html" 
                   style="color: #2563eb; text-decoration: none; font-weight: bold; font-size: 16px;">
                    👉 VEDI TUTTI I MIEI EBOOK PREMIUM
                </a>
            </div>
            
            <div class="contact-box">
                <h3 style="color: #059669; margin-top: 0;">📞 Hai problemi con il download?</h3>
                <p style="margin-bottom: 10px;"><strong>Contattami subito:</strong></p>
                <p style="margin: 5px 0;">
                    📱 <strong>WhatsApp:</strong> 
                    <a href="https://wa.me/393478881515?text=Ciao%20Andrea,%20ho%20problemi%20con%20il%20download%20dell'ebook%20gratuito" 
                       style="color: #25d366; text-decoration: none; font-weight: bold;">
                        +39 347 888 1515
                    </a>
                </p>
                <p style="margin: 5px 0;">
                    ✉️ <strong>Email:</strong> 
                    <a href="mailto:andrea.padoan@gmail.com?subject=Problema download ebook gratuito" 
                       style="color: #059669; text-decoration: none;">
                        andrea.padoan@gmail.com
                    </a>
                </p>
                <p style="margin: 15px 0 5px 0;">
                    🌐 <strong>Sito web:</strong> 
                    <a href="https://www.personaltrainerverona.it" 
                       style="color: #2563eb; text-decoration: none;">
                        www.personaltrainerverona.it
                    </a>
                </p>
            </div>
            
            <div style="border-left: 4px solid #10b981; padding-left: 20px; margin: 30px 0; background: #f0fdf4; padding: 20px;">
                <p style="margin: 0; font-style: italic; color: #059669;">
                    💪 <strong>Questo ebook rappresenta anni di esperienza nel fitness e personal training.</strong> 
                    Sono sicuro che ti aiuterà a mantenerti in forma ovunque tu sia!
                </p>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                    ⚠️ <strong>Non vedi questa email?</strong> Controlla la cartella SPAM/Promozioni. 
                    Aggiungi <strong>andrea.padoan@gmail.com</strong> ai tuoi contatti per ricevere sempre le mie email!
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <p style="font-size: 18px; font-weight: bold; color: #059669;">Buon allenamento!</p>
                <p style="font-size: 20px; font-weight: bold; color: #059669; margin: 10px 0;">Andrea Padoan</p>
                <p style="font-style: italic; color: #666; margin: 0;">Personal Trainer Certificato</p>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 Andrea Padoan Personal Trainer. Tutti i diritti riservati.</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                Hai ricevuto questa email perché hai richiesto il nostro ebook gratuito su 
                <a href="https://andreapadoan-hub.vercel.app" style="color: #059669;">andreapadoan-hub.vercel.app</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #999;">
                Se non riesci a scaricare l'ebook, contattaci immediatamente su WhatsApp!
            </p>
        </div>
    </div>
</body>
</html>`;
}

// Notifica Telegram COMPLETA con status Airtable
async function sendTelegramNotification(email, ebookInfo, emailSent, emailError, airtableSaved, airtableError) {
    try {
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            let message;
            
            if (emailSent && airtableSaved) {
                message = `✅ FREE EBOOK - TUTTO OK!

📚 Ebook: ${ebookInfo?.title || 'Unknown'}
📧 Email: ${email}
🕐 Ora: ${new Date().toLocaleString('it-IT')}

✅ Email inviata correttamente
✅ Transazione salvata su Airtable
🎯 Sistema completamente automatico!`;
            } else if (emailSent && !airtableSaved) {
                message = `⚠️ FREE EBOOK - EMAIL OK, AIRTABLE FAIL

📚 Ebook: ${ebookInfo?.title || 'Unknown'}
📧 Email: ${email}
🕐 Ora: ${new Date().toLocaleString('it-IT')}

✅ Email inviata correttamente
❌ Airtable fallito: ${airtableError?.message || 'Unknown error'}

⚠️ L'utente ha ricevuto l'ebook ma non è trackato!`;
            } else if (!emailSent && airtableSaved) {
                message = `❌ FREE EBOOK - EMAIL FAIL, AIRTABLE OK

📚 Ebook: ${ebookInfo?.title || 'Unknown'}
📧 Email: ${email}
🕐 Ora: ${new Date().toLocaleString('it-IT')}

❌ Email fallita: ${emailError?.message || 'Unknown error'}
✅ Transazione salvata su Airtable (status: failed)

⚠️ L'utente NON ha ricevuto l'email ma è trackato!`;
            } else {
                message = `🚨 FREE EBOOK - TUTTO FALLITO!

📧 Email: ${email}
🕐 Ora: ${new Date().toLocaleString('it-IT')}

❌ Email fallita: ${emailError?.message || 'Unknown'}
❌ Airtable fallito: ${airtableError?.message || 'Unknown'}

🔧 AZIONE RICHIESTA: Verificare sistema completo!`;
            }

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
        }
    } catch (error) {
        console.error('⚠️ Telegram notification failed:', error.message);
    }
}