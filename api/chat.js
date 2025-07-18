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

    // KNOWLEDGE BASE COMPLETA - Andrea Padoan Services
    const knowledgeBase = `
    === ANDREA PADOAN - KNOWLEDGE BASE COMPLETA ===
    
    CHI SONO:
    Mi chiamo Andrea Padoan, sono un Lifestyle Coach e Personal Trainer certificato di Verona.
    Dopo oltre 12 anni come manager nel marketing e vendite, ho trasformato la mia vita dedicandomi al benessere.
    Dal 2012 ho il mio studio di Personal Training a Verona.
    Nel 2015 ho partecipato a "Best in town" su Real Time, selezionato tra i migliori personal trainer di Verona.
    Ho scritto 3 libri e articoli per riviste di benessere.
    La mia missione: aiutare le persone a stare bene trasformando la loro vita.

    === PERSONAL TRAINING STUDIO ===
    
    ORARI E MODALITÀ:
    - Orari: dalle 6:00 alle 21:00
    - Solo su appuntamento
    - Staff specializzato in: posturale, tonificazione, dimagrimento, preparazione atletica
    - Durata sessioni: 1 ora
    - Frequenza consigliata: 2 volte a settimana inizialmente
    
    TIPI DI ALLENAMENTO:
    1. LEZIONI INDIVIDUALI (1:1)
    2. LEZIONI DI COPPIA (2:1) 
    3. MINICLASSI (3-5 persone)
    
    PREZZI LEZIONI INDIVIDUALI:
    - 10 lezioni → 55€/lezione (totale 550€)
    - 20 lezioni → 50€/lezione (totale 1000€)
    - 30 lezioni → 45€/lezione (totale 1350€)
    
    PREZZI LEZIONI DI COPPIA:
    - 10 lezioni → 35€/lezione a persona (totale 350€ a persona)
    - 20 lezioni → 30€/lezione a persona (totale 600€ a persona)
    - 30 lezioni → 25€/lezione a persona (totale 750€ a persona)
    
    MINICLASSI:
    - 10 lezioni → 15€/lezione
    - Orari fissi: Lunedì, Martedì, Giovedì alle 17:30 e Sabato alle 10:00
    - Gruppi WhatsApp per prenotazioni settimanali
    - Possibilità di creare nuove miniclassi per gruppi di amici
    
    EXTRA:
    - Quota annuale tesseramento e assicurazione: 30€
    - Possibilità di percorso misto individuali + miniclass
    
    === CONSULENZA A DISTANZA ===
    
    COME FUNZIONA:
    1. Primo colloquio conoscitivo (45 minuti) - analisi esigenze, stile di vita, obiettivi
    2. Analisi composizione corporea - misure e valutazione punto di partenza
    3. Programma d'allenamento personalizzato creato su misura
    4. Consigli nutrizionali personalizzati in collaborazione con nutrizionista
    
    APP "TORNO IN FORMA":
    - Schede di allenamento caricate mensilmente
    - Foto e video degli esercizi inclusi
    - Nuovo programma ogni mese
    - Call mensili ad ogni cambio scheda se necessario
    
    PREZZI APP "TORNO IN FORMA":
    - 1 mese → 140€
    - 3 mesi → 250€ (risparmio 22%)
    - 6 mesi → 450€ (risparmio 46%)
    
    === ALTRI PROGETTI ===
    
    TRIBÙ STUDIO:
    - Studio privato di Personal Training a Verona
    - Ambiente esclusivo e personalizzato
    - Solo allenamenti supervisionati da me
    - Focus sulla relazione one-to-one
    
    MEALPREP PLANNER:
    - Web app per pianificare pasti settimanali
    - Organizzazione alimentazione strutturata
    - Supporto per chi vuole strategia alimentare
    
    UPSTART:
    - Supporto per startup e idee di business
    - Validazione idee imprenditoriali
    - Strategia, team building, analisi mercato
    
    EBOOK FITNESS:
    - 3 libri pubblicati
    - Guide complete per benessere e trasformazione
    - Metodologie testate personalmente
    
    LIFESTYLE COACH:
    - La soluzione completa per il cambiamento
    - Approccio olistico: corpo, mente, business
    - Perché dieta e allenamento da soli non bastano
    - Sviluppo abitudini vincenti e mindset di successo
    
    === FAQ FREQUENTI ===
    
    Q: Ti alleni ma non ottieni risultati?
    A: Il problema è spesso nella programmazione. Creo programmi personalizzati basati sui tuoi obiettivi specifici.
    
    Q: Sei principiante e vuoi iniziare correttamente?
    A: Perfetto! Parto dal tuo livello e ti guido passo-passo nell'esecuzione corretta degli esercizi.
    
    Q: Vuoi migliorare performance sportive?
    A: Ho esperienza in preparazione atletica specifica per ogni sport.
    
    Q: Fase di stallo negli allenamenti?
    A: Analizzo la tua situazione e modifico la programmazione per superare il plateau.
    
    Q: Manca motivazione?
    A: Il personal trainer è anche un motivatore. Ti seguo e stimolo costantemente.
    
    Q: Hai poco tempo per allenarti?
    A: Creo programmi efficienti adatti ai tuoi orari e impegni.
    
    Q: Quanto costa il personal training?
    A: Dipende dal tipo: individuali 45-55€/lezione, coppia 25-35€/lezione, miniclass 15€/lezione.
    
    Q: Come prenoto?
    A: Scrivimi su WhatsApp al 347 888 1515 per fissare un appuntamento senza impegno.
    
    Q: Differenza tra studio e online?
    A: Studio: supervisione diretta, attrezzature professionali. Online: app con video, flessibilità orari.
    
    Q: Cosa rende diverso il tuo approccio?
    A: Non sono solo un trainer, sono un Lifestyle Coach. Lavoro sulla trasformazione completa della persona.
    
    === CONTATTI ===
    WhatsApp: 347 888 1515
    Email: andrea.padoan@gmail.com
    Sito Personal Training: https://www.personaltrainerverona.it
    Sito Tribù Studio: https://www.tribustudio.it
    `;

    const prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach di Verona.
    
    ${knowledgeBase}
    
    ISTRUZIONI PER LE RISPOSTE:
    - Rispondi sempre in prima persona come Andrea
    - Sii caloroso, professionale e motivante
    - Usa le informazioni della knowledge base per risposte precise
    - Quando ti chiedono prezzi, orari o dettagli, fornisci informazioni esatte
    - Fai domande per capire meglio le esigenze del cliente
    - Indirizza verso i servizi più adatti senza essere troppo promozionale
    - Se non sai qualcosa, ammettilo e proponi di parlarne direttamente
    - Includi sempre il WhatsApp (347 888 1515) quando appropriato
    
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
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 400,
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
    
    // Service-specific high intent
    if (lower.includes('personal training') || lower.includes('personal trainer')) score += 3;
    if (lower.includes('dimagrire') || lower.includes('perdere peso')) score += 2;
    if (lower.includes('forma fisica') || lower.includes('allenarsi')) score += 2;
    
    return Math.min(score, 10); // Max score 10
}

function determineInterestArea(message) {
    const lower = message.toLowerCase();
    
    // Fitness keywords
    if (lower.includes('personal') || lower.includes('allenamento') || 
        lower.includes('fitness') || lower.includes('palestra') ||
        lower.includes('muscoli') || lower.includes('forma') ||
        lower.includes('peso') || lower.includes('dimagrire') ||
        lower.includes('tonificare') || lower.includes('tribù') ||
        lower.includes('studio') || lower.includes('coppia') ||
        lower.includes('miniclass') || lower.includes('sessione')) {
        return 'fitness';
    }
    
    // Nutrition keywords
    if (lower.includes('dieta') || lower.includes('alimentazione') || 
        lower.includes('mangiare') || lower.includes('pasti') ||
        lower.includes('nutrizione') || lower.includes('meal') ||
        lower.includes('cibo') || lower.includes('calorie') ||
        lower.includes('mealprep')) {
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
        lower.includes('abitudini') || lower.includes('cambiare') ||
        lower.includes('trasformazione')) {
        return 'coaching';
    }
    
    // Online/Distance keywords
    if (lower.includes('online') || lower.includes('distanza') ||
        lower.includes('app') || lower.includes('torno in forma')) {
        return 'online';
    }
    
    return 'general';
}

function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
}