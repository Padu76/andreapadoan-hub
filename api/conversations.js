// /api/conversations.js
// API per recuperare conversazioni complete da Airtable

export default async function handler(req, res) {
    // Configurazione CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Configurazione Airtable
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
        const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'conversazioni';
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

        if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
            console.error('❌ Missing Airtable credentials');
            return res.status(500).json({ 
                error: 'Airtable configuration missing',
                conversations: []
            });
        }

        // Chiama API Airtable
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
        
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Processa e raggruppa conversazioni per sessione
        const conversationsMap = new Map();
        
        data.records.forEach(record => {
            const fields = record.fields;
            const sessionId = fields.Session_ID || `session_${record.id}`;
            
            if (!conversationsMap.has(sessionId)) {
                conversationsMap.set(sessionId, {
                    id: sessionId,
                    name: extractName(fields.User_Message) || fields.User_Name || null,
                    phone: extractPhone(fields.User_Message) || fields.User_Phone || null,
                    email: extractEmail(fields.User_Message) || fields.User_Email || null,
                    timestamp: new Date(fields.Timestamp || record.createdTime).toISOString(),
                    status: determineStatus(fields),
                    interest: determineInterest(fields.Interest_Area, fields.User_Message),
                    isHot: determineIfHot(fields),
                    messages: [],
                    lastUpdate: new Date(fields.Timestamp || record.createdTime).toISOString()
                });
            }
            
            const conversation = conversationsMap.get(sessionId);
            
            // Aggiungi messaggio utente
            if (fields.User_Message) {
                conversation.messages.push({
                    role: 'user',
                    content: fields.User_Message,
                    timestamp: new Date(fields.Timestamp || record.createdTime).toISOString()
                });
            }
            
            // Aggiungi risposta AI
            if (fields.Bot_Response) {
                conversation.messages.push({
                    role: 'assistant',
                    content: fields.Bot_Response,
                    timestamp: new Date(fields.Timestamp || record.createdTime).toISOString()
                });
            }
            
            // Aggiorna timestamp se più recente
            const recordTime = new Date(fields.Timestamp || record.createdTime);
            if (recordTime > new Date(conversation.lastUpdate)) {
                conversation.lastUpdate = recordTime.toISOString();
            }
        });

        // Converti Map in array e ordina per timestamp
        const conversations = Array.from(conversationsMap.values())
            .map(conv => {
                // Ordina messaggi per timestamp
                conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                // Aggiorna nome e contatti se trovati nei messaggi
                updateContactInfo(conv);
                
                return conv;
            })
            .sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

        console.log(`✅ Processed ${conversations.length} conversations`);

        // Restituisci dati
        res.status(200).json({
            success: true,
            conversations: conversations,
            total: conversations.length,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in conversations API:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            conversations: []
        });
    }
}

// Funzioni di utilità per processare i dati

function extractName(message) {
    if (!message) return null;
    
    // Pattern per trovare nomi nelle conversazioni
    const patterns = [
        /mi chiamo ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i,
        /sono ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i,
        /il mio nome è ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i,
        /nome: ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return null;
}

function extractPhone(message) {
    if (!message) return null;
    
    // Pattern per trovare numeri di telefono
    const patterns = [
        /(\+39\s?)?(\d{3})\s?(\d{3})\s?(\d{4})/,
        /(\+39\s?)?(\d{3})\s?(\d{4})\s?(\d{4})/,
        /telefono[:\s]+(\+39\s?)?(\d{3})\s?(\d{3})\s?(\d{4})/i,
        /cell[:\s]+(\+39\s?)?(\d{3})\s?(\d{3})\s?(\d{4})/i
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            return match[0].replace(/[^\d\+]/g, '').replace(/^\+39/, '');
        }
    }
    
    return null;
}

function extractEmail(message) {
    if (!message) return null;
    
    // Pattern per trovare email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = message.match(emailPattern);
    
    return match ? match[0] : null;
}

function determineStatus(fields) {
    // Determina lo status della conversazione
    if (fields.Status) {
        return fields.Status.toLowerCase();
    }
    
    // Logica per determinare status automaticamente
    const now = new Date();
    const timestamp = new Date(fields.Timestamp || now);
    const hoursAgo = (now - timestamp) / (1000 * 60 * 60);
    
    if (hoursAgo < 2) return 'new';
    if (hoursAgo < 24) return 'active';
    if (hoursAgo < 72) return 'contacted';
    return 'completed';
}

function determineInterest(interestArea, userMessage) {
    // Determina l'area di interesse dalla conversazione
    if (interestArea) {
        return interestArea.toLowerCase();
    }
    
    if (!userMessage) return 'generale';
    
    const message = userMessage.toLowerCase();
    
    // Keywords per determinare interesse
    const keywords = {
        fitness: ['fitness', 'allenamento', 'palestra', 'muscoli', 'workout', 'esercizio', 'training'],
        nutrition: ['nutrizione', 'dieta', 'alimentazione', 'cibo', 'mangiare', 'peso', 'calorie'],
        business: ['business', 'lavoro', 'azienda', 'marketing', 'vendite', 'coaching', 'consulenza'],
        lifestyle: ['lifestyle', 'vita', 'benessere', 'stress', 'equilibrio', 'motivazione', 'obiettivi']
    };
    
    for (const [interest, terms] of Object.entries(keywords)) {
        if (terms.some(term => message.includes(term))) {
            return interest;
        }
    }
    
    return 'generale';
}

function determineIfHot(fields) {
    // Determina se è un lead caldo
    if (fields.Is_Hot) {
        return fields.Is_Hot === 'true' || fields.Is_Hot === true;
    }
    
    // Logica per determinare hot lead
    const message = fields.User_Message?.toLowerCase() || '';
    
    // Keywords che indicano interesse elevato
    const hotKeywords = [
        'subito', 'urgente', 'quando possiamo', 'chiamami', 'contattami',
        'interessato', 'voglio iniziare', 'quanto costa', 'prezzo',
        'disponibilità', 'quando', 'dove', 'come funziona'
    ];
    
    return hotKeywords.some(keyword => message.includes(keyword));
}

function updateContactInfo(conversation) {
    // Aggiorna informazioni contatto analizzando tutti i messaggi
    const allMessages = conversation.messages.map(m => m.content).join(' ');
    
    // Aggiorna nome se non già presente
    if (!conversation.name) {
        conversation.name = extractName(allMessages);
    }
    
    // Aggiorna telefono se non già presente
    if (!conversation.phone) {
        conversation.phone = extractPhone(allMessages);
    }
    
    // Aggiorna email se non già presente
    if (!conversation.email) {
        conversation.email = extractEmail(allMessages);
    }
    
    // Aggiorna interesse analizzando tutti i messaggi
    if (conversation.interest === 'generale') {
        conversation.interest = determineInterest(null, allMessages);
    }
}

// Funzione per debug/test (commentata in produzione)
/*
function generateMockData() {
    return {
        success: true,
        conversations: [
            {
                id: "session_123",
                name: "Mario Rossi",
                phone: "347 123 4567",
                email: "mario@email.com",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                status: "new",
                interest: "fitness",
                isHot: true,
                messages: [
                    {
                        role: "user",
                        content: "Ciao, mi chiamo Mario Rossi e sono interessato al personal training",
                        timestamp: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        role: "assistant",
                        content: "Ciao Mario! Perfetto, sono Andrea. Ti posso aiutare con il personal training. Hai obiettivi specifici?",
                        timestamp: new Date(Date.now() - 3500000).toISOString()
                    }
                ]
            }
        ],
        total: 1,
        lastUpdate: new Date().toISOString()
    };
}
*/