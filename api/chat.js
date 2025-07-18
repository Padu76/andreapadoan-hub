export default async function handler(req, res) {
    // Abilita CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }

    // Debug logging
    console.log('=== CHAT API DEBUG ===');
    console.log('Received message:', message);
    console.log('Environment check:');
    console.log('- CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
    console.log('- CLAUDE_API_KEY length:', process.env.CLAUDE_API_KEY?.length || 0);
    console.log('- CLAUDE_API_KEY prefix:', process.env.CLAUDE_API_KEY?.substring(0, 25) || 'NOT_FOUND');
    
    // Get Claude API key
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
        console.error('❌ CLAUDE_API_KEY not found in environment variables');
        return res.status(500).json({ 
            error: 'Configurazione server non corretta. Contattami su WhatsApp al 347 888 1515!' 
        });
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
    Non essere troppo promozionale, sii naturale e utile.
    
    Messaggio utente: "${message.trim()}"
    
    Rispondi come Andrea Padoan:`;
    
    try {
        console.log('🔄 Calling Claude API...');
        
        // Chiama Claude API con modello aggiornato
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',  // MODELLO AGGIORNATO
                max_tokens: 300,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        console.log('📡 Claude API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Claude API Error:', response.status, errorText);
            throw new Error(`Claude API Error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Claude API success');
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('❌ Invalid Claude API response format:', data);
            throw new Error('Invalid response format from Claude API');
        }
        
        const botResponse = data.content[0].text;
        console.log('💬 Bot response generated, length:', botResponse.length);
        
        // Log to Airtable (non-blocking)
        logToAirtable(message.trim(), botResponse)
            .then(() => console.log('✅ Airtable logging completed'))
            .catch(err => console.error('❌ Airtable logging failed:', err));
        
        // Return successful response
        res.status(200).json({ response: botResponse });
        
    } catch (error) {
        console.error('❌ Handler Error:', error);
        
        // Return user-friendly error message
        res.status(500).json({ 
            error: 'Mi dispiace, ho avuto un problema tecnico. Contattami su WhatsApp al 347 888 1515!' 
        });
    }
}

async function logToAirtable(userMessage, botResponse) {
    const webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/applozDwnDZOgPvsg/wflXjsQEowx2dmnN8/wtrzKiazR0Tt8171P';
    
    const leadScore = calculateLeadScore(userMessage);
    const interestArea = determineInterestArea(userMessage);
    const sessionId = generateSessionId();
    
    const payload = {
        User_Message: userMessage,
        Bot_Response: botResponse,
        Lead_Score: leadScore,
        Interest_Area: interestArea,
        Session_ID: sessionId,
        User_Agent: 'Vercel-API'
    };
    
    try {
        console.log('📊 Logging to Airtable...', {
            leadScore,
            interestArea,
            sessionId
        });
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ Conversation logged to Airtable successfully');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to log to Airtable:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Airtable logging error:', error);
    }
}

function calculateLeadScore(message) {
    let score = 5; // Base score
    const lower = message.toLowerCase();
    
    // High interest keywords
    if (lower.includes('voglio') || lower.includes('vorrei')) score += 2;
    if (lower.includes('prezzo') || lower.includes('costo') || lower.includes('quanto')) score += 2;
    if (lower.includes('quando') || lower.includes('come')) score += 1;
    if (lower.includes('aiuto') || lower.includes('supporto')) score += 2;
    if (lower.includes('risultati') || lower.includes('obiettivi')) score += 2;
    if (lower.includes('urgente') || lower.includes('subito')) score += 3;
    
    // Contact indicators
    if (lower.includes('contatto') || lower.includes('chiamare')) score += 3;
    if (lower.includes('incontro') || lower.includes('appuntamento')) score += 4;
    if (lower.includes('numero') || lower.includes('telefono')) score += 3;
    
    // Pain points
    if (lower.includes('problema') || lower.includes('difficoltà')) score += 2;
    if (lower.includes('fallito') || lower.includes('non riesco')) score += 2;
    
    return Math.min(score, 10); // Max score 10
}

function determineInterestArea(message) {
    const lower = message.toLowerCase();
    
    // Fitness keywords
    if (lower.includes('personal') || lower.includes('allenamento') || 
        lower.includes('fitness') || lower.includes('palestra') ||
        lower.includes('muscoli') || lower.includes('forma') ||
        lower.includes('peso') || lower.includes('dimagrire') ||
        lower.includes('tonificare') || lower.includes('tribù')) {
        return 'fitness';
    }
    
    // Nutrition keywords
    if (lower.includes('dieta') || lower.includes('alimentazione') || 
        lower.includes('mangiare') || lower.includes('pasti') ||
        lower.includes('nutrizione') || lower.includes('meal') ||
        lower.includes('cibo') || lower.includes('calorie')) {
        return 'nutrition';
    }
    
    // Business keywords
    if (lower.includes('business') || lower.includes('startup') || 
        lower.includes('impresa') || lower.includes('soldi') ||
        lower.includes('guadagno') || lower.includes('upstart') ||
        lower.includes('idea') || lower.includes('progetto')) {
        return 'business';
    }
    
    // Coaching keywords
    if (lower.includes('mindset') || lower.includes('motivazione') || 
        lower.includes('coach') || lower.includes('lifestyle') ||
        lower.includes('mente') || lower.includes('psicologia') ||
        lower.includes('abitudini') || lower.includes('cambiare')) {
        return 'coaching';
    }
    
    return 'general';
}

function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
}