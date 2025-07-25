// /api/leads.js
// API per gestione avanzata lead con pipeline, scoring e analytics

export default async function handler(req, res) {
    // Configurazione CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
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
                leads: []
            });
        }

        switch (req.method) {
            case 'GET':
                return await getLeads(req, res, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_API_KEY);
            case 'POST':
                return await createLead(req, res, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_API_KEY);
            case 'PUT':
                return await updateLead(req, res, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_API_KEY);
            case 'DELETE':
                return await deleteLead(req, res, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_API_KEY);
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('❌ Error in leads API:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            leads: []
        });
    }
}

// GET - Recupera tutti i lead con processing avanzato
async function getLeads(req, res, baseId, tableName, apiKey) {
    try {
        console.log('📊 Loading leads from Airtable...');
        
        // Chiama API Airtable per ottenere tutti i record
        const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
        
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Processa i dati per creare lead strutturati
        const leadsMap = new Map();
        
        data.records.forEach(record => {
            const fields = record.fields;
            const sessionId = fields.Session_ID || `session_${record.id}`;
            
            if (!leadsMap.has(sessionId)) {
                leadsMap.set(sessionId, {
                    id: sessionId,
                    airtableId: record.id,
                    name: extractName(fields.User_Message) || fields.User_Name || null,
                    phone: extractPhone(fields.User_Message) || fields.User_Phone || null,
                    email: extractEmail(fields.User_Message) || fields.User_Email || null,
                    interest: determineInterest(fields.Interest_Area, fields.User_Message),
                    stage: determineStage(fields),
                    score: 0, // Calcolato dopo
                    estimatedValue: 0, // Calcolato dopo
                    isHot: false, // Calcolato dopo
                    isQualified: false, // Calcolato dopo
                    needsFollowUp: false, // Calcolato dopo
                    createdAt: new Date(fields.Timestamp || record.createdTime).toISOString(),
                    lastContact: null,
                    followUpDate: fields.Follow_Up_Date || null,
                    source: determineSource(fields),
                    status: fields.Status || 'new',
                    messages: [],
                    activities: [],
                    lastUpdate: new Date(fields.Timestamp || record.createdTime).toISOString()
                });
            }
            
            const lead = leadsMap.get(sessionId);
            
            // Aggiungi messaggi per analisi
            if (fields.User_Message) {
                lead.messages.push({
                    role: 'user',
                    content: fields.User_Message,
                    timestamp: new Date(fields.Timestamp || record.createdTime).toISOString()
                });
            }
            
            if (fields.Bot_Response) {
                lead.messages.push({
                    role: 'assistant',
                    content: fields.Bot_Response,
                    timestamp: new Date(fields.Timestamp || record.createdTime).toISOString()
                });
            }
            
            // Aggiorna timestamp se più recente
            const recordTime = new Date(fields.Timestamp || record.createdTime);
            if (recordTime > new Date(lead.lastUpdate)) {
                lead.lastUpdate = recordTime.toISOString();
                lead.lastContact = recordTime.toISOString();
            }
        });

        // Converti Map in array e processa lead
        const leads = Array.from(leadsMap.values()).map(lead => {
            // Ordina messaggi per timestamp
            lead.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Aggiorna informazioni contatto
            updateContactInfo(lead);
            
            // Calcola lead score
            lead.score = calculateLeadScore(lead);
            
            // Determina valore stimato
            lead.estimatedValue = calculateEstimatedValue(lead);
            
            // Determina se è hot lead
            lead.isHot = determineIfHot(lead);
            
            // Determina se è qualificato
            lead.isQualified = determineIfQualified(lead);
            
            // Determina se ha bisogno di follow-up
            lead.needsFollowUp = determineNeedsFollowUp(lead);
            
            // Genera cronologia attività
            lead.activities = generateActivities(lead);
            
            return lead;
        });

        // Ordina per priorità (hot leads primi, poi per score)
        leads.sort((a, b) => {
            if (a.isHot !== b.isHot) return b.isHot - a.isHot;
            return b.score - a.score;
        });

        console.log(`✅ Processed ${leads.length} leads`);

        // Calcola statistiche
        const stats = calculateLeadStats(leads);

        res.status(200).json({
            success: true,
            leads: leads,
            stats: stats,
            total: leads.length,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error getting leads:', error);
        throw error;
    }
}

// POST - Crea nuovo lead
async function createLead(req, res, baseId, tableName, apiKey) {
    try {
        const { name, phone, email, interest, source, estimatedValue } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Nome richiesto' });
        }

        // Crea record in Airtable
        const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
        
        const newRecord = {
            fields: {
                User_Name: name,
                User_Phone: phone,
                User_Email: email,
                Interest_Area: interest || 'generale',
                Source: source || 'manual',
                Estimated_Value: estimatedValue || 500,
                Status: 'new',
                Session_ID: `manual_${Date.now()}`,
                Timestamp: new Date().toISOString(),
                User_Message: `Lead creato manualmente: ${name}`,
                Bot_Response: 'Lead aggiunto al CRM per follow-up'
            }
        };

        const response = await fetch(airtableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecord)
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ New lead created:', data.id);

        res.status(201).json({
            success: true,
            message: 'Lead creato con successo',
            leadId: data.id
        });

    } catch (error) {
        console.error('❌ Error creating lead:', error);
        res.status(500).json({ error: 'Errore creazione lead' });
    }
}

// PUT - Aggiorna lead esistente
async function updateLead(req, res, baseId, tableName, apiKey) {
    try {
        const { leadId, updates } = req.body;
        
        if (!leadId) {
            return res.status(400).json({ error: 'Lead ID richiesto' });
        }

        // Aggiorna record in Airtable
        const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}/${leadId}`;
        
        const updateData = {
            fields: {
                ...updates,
                Last_Updated: new Date().toISOString()
            }
        };

        const response = await fetch(airtableUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('✅ Lead updated:', leadId);

        res.status(200).json({
            success: true,
            message: 'Lead aggiornato con successo',
            data: data
        });

    } catch (error) {
        console.error('❌ Error updating lead:', error);
        res.status(500).json({ error: 'Errore aggiornamento lead' });
    }
}

// DELETE - Elimina lead
async function deleteLead(req, res, baseId, tableName, apiKey) {
    try {
        const { leadId } = req.body;
        
        if (!leadId) {
            return res.status(400).json({ error: 'Lead ID richiesto' });
        }

        // Elimina record da Airtable
        const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}/${leadId}`;
        
        const response = await fetch(airtableUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        console.log('✅ Lead deleted:', leadId);

        res.status(200).json({
            success: true,
            message: 'Lead eliminato con successo'
        });

    } catch (error) {
        console.error('❌ Error deleting lead:', error);
        res.status(500).json({ error: 'Errore eliminazione lead' });
    }
}

// Funzioni di utilità per processare i dati

function extractName(message) {
    if (!message) return null;
    
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
    
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = message.match(emailPattern);
    
    return match ? match[0] : null;
}

function determineInterest(interestArea, userMessage) {
    if (interestArea) {
        return interestArea.toLowerCase();
    }
    
    if (!userMessage) return 'generale';
    
    const message = userMessage.toLowerCase();
    
    const keywords = {
        fitness: ['fitness', 'allenamento', 'palestra', 'muscoli', 'workout', 'esercizio', 'training', 'forma fisica'],
        nutrition: ['nutrizione', 'dieta', 'alimentazione', 'cibo', 'mangiare', 'peso', 'calorie', 'dimagrire'],
        business: ['business', 'lavoro', 'azienda', 'marketing', 'vendite', 'coaching', 'consulenza', 'impresa'],
        lifestyle: ['lifestyle', 'vita', 'benessere', 'stress', 'equilibrio', 'motivazione', 'obiettivi', 'cambiamento']
    };
    
    for (const [interest, terms] of Object.entries(keywords)) {
        if (terms.some(term => message.includes(term))) {
            return interest;
        }
    }
    
    return 'generale';
}

function determineStage(fields) {
    // Determina lo stage del lead basato sui dati
    if (fields.Stage) {
        return fields.Stage.toLowerCase();
    }
    
    if (fields.Status === 'customer' || fields.Status === 'converted') {
        return 'customer';
    }
    
    // Logica automatica per determinare stage
    const now = new Date();
    const timestamp = new Date(fields.Timestamp || now);
    const hoursAgo = (now - timestamp) / (1000 * 60 * 60);
    
    if (hoursAgo < 24) return 'hot';
    if (hoursAgo < 72) return 'warm';
    return 'cold';
}

function determineSource(fields) {
    if (fields.Source) {
        return fields.Source;
    }
    
    if (fields.User_Agent) {
        if (fields.User_Agent.includes('Mobile')) return 'mobile';
        if (fields.User_Agent.includes('Facebook')) return 'facebook';
        if (fields.User_Agent.includes('Instagram')) return 'instagram';
    }
    
    return 'website';
}

function updateContactInfo(lead) {
    const allMessages = lead.messages.map(m => m.content).join(' ');
    
    if (!lead.name) {
        lead.name = extractName(allMessages);
    }
    
    if (!lead.phone) {
        lead.phone = extractPhone(allMessages);
    }
    
    if (!lead.email) {
        lead.email = extractEmail(allMessages);
    }
    
    if (lead.interest === 'generale') {
        lead.interest = determineInterest(null, allMessages);
    }
}

function calculateLeadScore(lead) {
    let score = 0;
    
    // Punteggio base per informazioni contatto
    if (lead.name) score += 15;
    if (lead.phone) score += 20;
    if (lead.email) score += 15;
    
    // Punteggio per engagement
    const messageCount = lead.messages.length;
    if (messageCount > 5) score += 20;
    else if (messageCount > 2) score += 10;
    
    // Punteggio per interesse specifico
    if (lead.interest !== 'generale') score += 10;
    
    // Punteggio per recency
    const daysSinceCreation = (new Date() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation <= 1) score += 15;
    else if (daysSinceCreation <= 7) score += 10;
    
    // Punteggio per keywords di alta intenzione
    const allText = lead.messages.map(m => m.content).join(' ').toLowerCase();
    const highIntentKeywords = ['prezzo', 'costo', 'quando', 'dove', 'come', 'voglio', 'interessato', 'disponibile'];
    const keywordMatches = highIntentKeywords.filter(keyword => allText.includes(keyword)).length;
    score += keywordMatches * 5;
    
    // Punteggio per stage
    const stageScores = {
        'customer': 100,
        'hot': 80,
        'warm': 60,
        'cold': 40
    };
    
    return Math.min(100, Math.max(0, score + (stageScores[lead.stage] || 0) - 40));
}

function calculateEstimatedValue(lead) {
    const baseValues = {
        'fitness': 1200,
        'nutrition': 800,
        'business': 2000,
        'lifestyle': 1500,
        'generale': 500
    };
    
    let baseValue = baseValues[lead.interest] || 500;
    
    // Moltiplicatori basati su score
    if (lead.score >= 80) baseValue *= 1.5;
    else if (lead.score >= 60) baseValue *= 1.2;
    else if (lead.score >= 40) baseValue *= 1.0;
    else baseValue *= 0.8;
    
    // Moltiplicatore per stage
    const stageMultipliers = {
        'customer': 1.0,
        'hot': 0.8,
        'warm': 0.6,
        'cold': 0.4
    };
    
    baseValue *= stageMultipliers[lead.stage] || 0.5;
    
    return Math.round(baseValue);
}

function determineIfHot(lead) {
    // Lead è hot se ha score alto o keywords urgenti
    if (lead.score >= 80) return true;
    
    const allText = lead.messages.map(m => m.content).join(' ').toLowerCase();
    const hotKeywords = ['subito', 'urgente', 'oggi', 'domani', 'chiamami', 'contattami', 'prezzo', 'costo'];
    
    return hotKeywords.some(keyword => allText.includes(keyword));
}

function determineIfQualified(lead) {
    // Lead è qualificato se ha contatti completi e interesse specifico
    return !!(lead.name && lead.phone && lead.interest !== 'generale');
}

function determineNeedsFollowUp(lead) {
    if (lead.followUpDate) {
        const followUpDate = new Date(lead.followUpDate);
        const today = new Date();
        return followUpDate <= today;
    }
    
    // Se non ha follow-up date, determina basato sull'ultima attività
    if (lead.lastContact) {
        const daysSinceContact = (new Date() - new Date(lead.lastContact)) / (1000 * 60 * 60 * 24);
        return daysSinceContact >= 3; // Follow-up dopo 3 giorni
    }
    
    return false;
}

function generateActivities(lead) {
    const activities = [];
    
    // Attività di creazione
    activities.push({
        type: 'Lead Created',
        description: `Lead creato da ${lead.source || 'website'}`,
        timestamp: lead.createdAt
    });
    
    // Attività per ogni messaggio significativo
    lead.messages.forEach((message, index) => {
        if (message.role === 'user' && index % 3 === 0) { // Ogni 3 messaggi
            activities.push({
                type: 'Message Received',
                description: `Messaggio ricevuto: "${message.content.substring(0, 50)}..."`,
                timestamp: message.timestamp
            });
        }
    });
    
    // Attività per contatto
    if (lead.lastContact && lead.lastContact !== lead.createdAt) {
        activities.push({
            type: 'Contact Attempted',
            description: 'Tentativo di contatto',
            timestamp: lead.lastContact
        });
    }
    
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function calculateLeadStats(leads) {
    const total = leads.length;
    const byStage = {
        cold: leads.filter(l => l.stage === 'cold').length,
        warm: leads.filter(l => l.stage === 'warm').length,
        hot: leads.filter(l => l.stage === 'hot').length,
        customer: leads.filter(l => l.stage === 'customer').length
    };
    
    const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
    const avgScore = total > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / total) : 0;
    const conversionRate = total > 0 ? Math.round((byStage.customer / total) * 100) : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const followUpToday = leads.filter(lead => 
        lead.followUpDate && lead.followUpDate.split('T')[0] === today
    ).length;
    
    return {
        total,
        byStage,
        totalValue,
        avgScore,
        conversionRate,
        followUpToday,
        qualified: leads.filter(l => l.isQualified).length,
        hot: leads.filter(l => l.isHot).length
    };
}