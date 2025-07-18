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
        
        const data = await response.json();
        const botResponse = data.content[0].text;
        
        // Log to Airtable
        await logToAirtable(message, botResponse);
        
        res.status(200).json({ response: botResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Mi dispiace, ho avuto un problema tecnico. Contattami su WhatsApp al 347 888 1515!' });
    }
}

async function logToAirtable(userMessage, botResponse) {
    const webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/applozDwnDZOgPvsg/wflXjsQEowx2dmnN8/wtrzKiazR0Tt8171P';
    
    const leadScore = calculateLeadScore(userMessage);
    const interestArea = determineInterestArea(userMessage);
    
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                User_Message: userMessage,
                Bot_Response: botResponse,
                Lead_Score: leadScore,
                Interest_Area: interestArea,
                Session_ID: 'sess_' + Date.now(),
                User_Agent: 'API'
            })
        });
    } catch (error) {
        console.error('Airtable error:', error);
    }
}

function calculateLeadScore(message) {
    let score = 5;
    const lower = message.toLowerCase();
    if (lower.includes('voglio') || lower.includes('vorrei')) score += 2;
    if (lower.includes('prezzo') || lower.includes('costo')) score += 2;
    if (lower.includes('aiuto') || lower.includes('supporto')) score += 2;
    return Math.min(score, 10);
}

function determineInterestArea(message) {
    const lower = message.toLowerCase();
    if (lower.includes('personal') || lower.includes('fitness')) return 'fitness';
    if (lower.includes('dieta') || lower.includes('alimentazione')) return 'nutrition';
    if (lower.includes('business') || lower.includes('startup')) return 'business';
    if (lower.includes('mindset') || lower.includes('coach')) return 'coaching';
    return 'general';
}
