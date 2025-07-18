export default async function handler(req, res) {
    // Abilita CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    const prompt = `Tu sei Andrea Padoan, personal trainer, coach e imprenditore di Verona. 
    Sei esperto in:
    - Personal Training (in presenza a Tribù Studio e online)
    - Alimentazione e nutrizione (MealPrep Planner)
    - Business e startup (Upstart)
    - Mindset e lifestyle coaching
    - Trasformazione completa della persona
    
    Rispondi sempre in prima persona come Andrea, in modo caloroso, professionale e motivante.
    Fai domande per capire meglio i bisogni e indirizza verso i tuoi servizi quando appropriato.
    
    Messaggio utente: "${message}"
    
    Rispondi come Andrea Padoan:`;
    
    try {
        // Chiama Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 300,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Claude API Error: ${response.status}`);
        }
        
        const data = await response.json();
        const botResponse = data.content[0].text;
        
        // Log to Airtable
        await logToAirtable(message, botResponse);
        
        res.status(200).json({ response: botResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Mi dispiace, ho avuto un problema tecnico. Contattami su WhatsApp al 347 888 1515!' 
        });
    }
}

async function logToAirtable(userMessage, botResponse) {
    const webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/applozDwnDZOgPvsg/wflXjsQEowx2dmnN8/wtrzKiazR0Tt8171P';
    
    const leadScore = calculateLeadScore(userMessage);
    const interestArea = determineInterestArea(userMessage);
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                User_Message: userMessage,
                Bot_Response: botResponse,
                Lead_Score: leadScore,
                Interest_Area: interestArea,
                Session_ID: 'sess_' + Date.now(),
                User_Agent: 'Vercel-API'
            })
        });
        
        if (response.ok) {
            console.log('✅ Conversation logged to Airtable');
        } else {
            console.error('❌ Failed to log to Airtable:', response.status);
        }
    } catch (error) {
        console.error('❌ Airtable error:', error);
    }
}

function calculateLeadScore(message) {
    let score = 5; // Base score
    const lower = message.toLowerCase();
    
    // High interest keywords
    if (lower.includes('voglio') || lower.includes('vorrei')) score += 2;
    if (lower.includes('prezzo') || lower.includes('costo')) score += 2;
    if (lower.includes('quando') || lower.includes('come')) score += 1;
    if (lower.includes('aiuto') || lower.includes('supporto')) score += 2;
    if (lower.includes('risultati') || lower.includes('obiettivi')) score += 2;
    if (lower.includes('urgente') || lower.includes('subito')) score += 3;
    
    // Contact indicators
    if (lower.includes('contatto') || lower.includes('chiamare')) score += 3;
    if (lower.includes('incontro') || lower.includes('appuntamento')) score += 4;
    
    return Math.min(score, 10); // Max score 10
}

function determineInterestArea(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('personal') || lower.includes('allenamento') || 
        lower.includes('fitness') || lower.includes('palestra') ||
        lower.includes('muscoli') || lower.includes('forma')) {
        return 'fitness';
    }
    
    if (lower.includes('dieta') || lower.includes('alimentazione') || 
        lower.includes('mangiare') || lower.includes('pasti') ||
        lower.includes('nutrizione') || lower.includes('meal')) {
        return 'nutrition';
    }
    
    if (lower.includes('business') || lower.includes('startup') || 
        lower.includes('impresa') || lower.includes('soldi') ||
        lower.includes('guadagno') || lower.includes('upstart')) {
        return 'business';
    }
    
    if (lower.includes('mindset') || lower.includes('motivazione') || 
        lower.includes('coach') || lower.includes('lifestyle') ||
        lower.includes('mente') || lower.includes('psicologia')) {
        return 'coaching';
    }
    
    return 'general';
}