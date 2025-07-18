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

    // 🧠 KNOWLEDGE BASE MASSIVA - VERSIONE ESPANSA
    const massiveKnowledgeBase = `
    === ANDREA PADOAN - MASTER KNOWLEDGE BASE ===
    
    🎯 CHI SONO - BACKGROUND COMPLETO:
    Mi chiamo Andrea Padoan, sono un Lifestyle Coach e Personal Trainer certificato di Verona.
    Dopo oltre 12 anni come manager nel marketing e vendite in aziende multinazionali, ho trasformato radicalmente la mia vita dedicandomi al benessere delle persone.
    Dal 2012 ho il mio studio di Personal Training a Verona.
    Nel 2015 ho partecipato a "Best in town" su Real Time, selezionato tra i migliori personal trainer di Verona.
    Ho scritto 4 eBook bestseller e collaboro con riviste specializzate.
    Negli ultimi 12 anni ho seguito oltre 500 clienti aiutandoli a trasformare il loro corpo e la loro vita.
    La mia missione: non sono solo un trainer, sono un facilitatore di trasformazioni complete.

    === 💪 PERSONAL TRAINING STUDIO - SERVIZI COMPLETI ===
    
    🏋️ MODALITÀ DI ALLENAMENTO:
    
    1. LEZIONI INDIVIDUALI (1:1) - LA FORMULA PREMIUM:
    - Attenzione 100% dedicata a te
    - Programma completamente personalizzato
    - Correzione posturale in tempo reale
    - Progressione ottimizzata per i tuoi obiettivi
    - Flessibilità oraria massima
    
    2. LEZIONI DI COPPIA (2:1) - PERFETTE PER:
    - Coppie che vogliono allenarsi insieme
    - Amici con obiettivi simili
    - Madre/figlia, padre/figlio
    - Motivazione reciproca
    - Costo dimezzato rispetto all'individuale
    
    3. MINICLASSI (3-5 persone) - ENERGIA DI GRUPPO:
    - Ambiente motivante e divertente
    - Socializzazione e supporto del gruppo
    - Costi accessibili
    - Orari fissi per organizzazione
    - Possibilità di creare gruppi personalizzati
    
    📅 ORARI E ORGANIZZAZIONE:
    - Studio aperto: 6:00 - 21:00 (Lunedì-Sabato)
    - Solo su appuntamento per garantire privacy
    - Prenotazioni via WhatsApp per flessibilità
    - Possibilità di sessioni domenicali per casi speciali
    - Recovery session: 30 minuti di stretching/mobilità
    
    💰 LISTINO PREZZI DETTAGLIATO:
    
    LEZIONI INDIVIDUALI:
    • 10 lezioni → 55€/sessione (totale 550€) - FORMULA STARTER
    • 20 lezioni → 50€/sessione (totale 1000€) - FORMULA COMMITMENT
    • 30 lezioni → 45€/sessione (totale 1350€) - FORMULA TRANSFORMATION
    
    LEZIONI DI COPPIA:
    • 10 lezioni → 35€/sessione per persona (totale 350€ cad.)
    • 20 lezioni → 30€/sessione per persona (totale 600€ cad.)
    • 30 lezioni → 25€/sessione per persona (totale 750€ cad.)
    
    MINICLASSI (3-5 persone):
    • 10 lezioni → 15€/sessione
    • 20 lezioni → 13€/sessione
    • Orari fissi: Lun/Mar/Gio 17:30, Sabato 10:00
    • Gruppo WhatsApp per coordinamento settimanale
    
    EXTRA E SERVIZI AGGIUNTIVI:
    • Quota annuale tesseramento + assicurazione: 30€
    • Analisi composizione corporea: GRATUITA per pacchetti 20+ lezioni
    • Consulenza nutrizionale: 80€ (1h con piano personalizzato)
    • Percorso misto (individuali + miniclass): sconto 10%
    • Sessione di prova: 40€ (detraibili dal pacchetto)
    
    === 📱 CONSULENZA A DISTANZA - APP "TORNO IN FORMA" ===
    
    🎯 COME FUNZIONA IL PERCORSO ONLINE:
    
    FASE 1 - ASSESSMENT COMPLETO (Prima settimana):
    • Primo colloquio via video (45 minuti)
    • Analisi stile di vita, orari, preferenze alimentari
    • Valutazione obiettivi e tempistiche realistiche
    • Definizione delle priorità (dimagrimento/tonificazione/performance)
    
    FASE 2 - ANALISI COMPOSIZIONE CORPOREA:
    • Misurazione circonferenze (con mio video tutorial)
    • Foto del "prima" per monitoraggio progressi
    • Calcolo fabbisogno calorico personalizzato
    • Identificazione punti di forza e aree di miglioramento
    
    FASE 3 - PROGRAMMA PERSONALIZZATO:
    • Scheda allenamento creata su misura
    • Video dimostrativi per ogni esercizio
    • Progressione mensile programmata
    • Consigli nutrizionali in collaborazione con nutrizionista certificato
    
    APP "TORNO IN FORMA" - FUNZIONALITÀ:
    • Schede aggiornate ogni mese
    • Database video esercizi HD
    • Timer e contatori integrati
    • Tracking progressi e misure
    • Chat diretta con me per domande
    • Call mensile di follow-up (30 min)
    
    PREZZI APP "TORNO IN FORMA":
    • 1 mese → 140€ (per testare l'approccio)
    • 3 mesi → 250€ (risparmio 22% - CONSIGLIATO)
    • 6 mesi → 450€ (risparmio 46% - TRASFORMAZIONE COMPLETA)
    
    === 🏢 TRIBÙ STUDIO - ESPERIENZA PREMIUM ===
    
    FILOSOFIA TRIBÙ:
    • Studio privato esclusivo nel centro di Verona
    • Ambiente intimo e personalizzato
    • Solo allenamenti con supervisione diretta
    • Attrezzature professionali di ultima generazione
    • Focus sulla relazione one-to-one
    • Approccio olistico: corpo, mente, lifestyle
    
    SERVIZI ESCLUSIVI TRIBÙ:
    • Personal training intensivo
    • Coaching mindset e motivazione
    • Consulenza alimentare specializzata
    • Supporto per cambiamenti di abitudini
    • Networking con altri membri della "tribù"
    
    === 🚀 PROGETTI COLLATERALI ===
    
    1. MEALPREP PLANNER:
    • Web app per pianificazione pasti settimanali
    • Database ricette sane e veloci
    • Lista spesa automatica
    • Calcolo macro e calorie
    • Perfetto per chi ha poco tempo
    • Integrazione con il percorso fitness
    
    2. UPSTART - BUSINESS COACHING:
    • Supporto per startup e idee di business
    • Validazione idee imprenditoriali
    • Strategia, team building, analisi mercato
    • Mindset imprenditoriale vincente
    • Network di investitori e mentor
    • Sessioni 1:1 o workshop di gruppo
    
    3. EBOOK FITNESS - BIBLIOTECA COMPLETA:
    
    "IL WAVE SYSTEM" (€14.90):
    • Metodologia rivoluzionaria per body transformation
    • Sistema di allenamento a onde
    • Adatto a tutti i livelli
    • Include piani nutrizionali
    
    "IN FORMA DA 2 MILIONI DI ANNI" (€19.90):
    • Approccio evolutivo all'alimentazione
    • Come mangiavano i nostri antenati
    • Ricette paleo moderne
    • Scienza della nutrizione applicata
    
    "50 WORKOUT DA VIAGGIO" (GRATUITO):
    • Allenamenti senza attrezzi
    • Perfetti per hotel e spazi ridotti
    • 15-45 minuti
    • Tutti i livelli di fitness
    
    "BODY UNDER CONSTRUCTION VOL. 1" (€29.90):
    • La bibbia della trasformazione corporea
    • Metodologie avanzate
    • Periodizzazione dell'allenamento
    • Psicologia del cambiamento
    
    4. LIFESTYLE COACHING - IL MIO APPROCCIO UNICO:
    • Non solo fitness: trasformazione completa della vita
    • Sviluppo abitudini vincenti
    • Mindset di successo
    • Equilibrio lavoro-vita
    • Gestione stress e energia
    • Obiettivi a 360 gradi
    
    === 💡 METODOLOGIE E SPECIALIZZAZIONI ===
    
    🎯 ALLENAMENTO SPECIALIZZATO PER:
    
    DIMAGRIMENTO:
    • Protocolli HIIT personalizzati
    • Periodizzazione calorica
    • Metabolic training
    • Cardio intelligente (non ore di tapis roulant!)
    
    TONIFICAZIONE:
    • Resistance training progressivo
    • Focus su forma e tecnica
    • Ipertrofia funzionale
    • Body recomposition
    
    PERFORMANCE ATLETICA:
    • Preparazione sport-specifica
    • Forza esplosiva e potenza
    • Agilità e coordinazione
    • Recovery e prevenzione infortuni
    
    POSTURALE E RIABILITATIVO:
    • Correzione squilibri muscolari
    • Rinforzo core stability
    • Mobilità articolare
    • Collaborazione con fisioterapisti
    
    TERZA ETÀ:
    • Functional training sicuro
    • Prevenzione sarcopenia
    • Equilibrio e coordinazione
    • Mantenimento autonomia
    
    === 🥗 APPROCCIO NUTRIZIONALE ===
    
    FILOSOFIA ALIMENTARE:
    • NO alle diete estreme
    • Educazione alimentare permanente
    • Sostenibilità a lungo termine
    • Personalizzazione totale
    • Collaborazione con nutrizionisti certificati
    
    SERVIZI NUTRIZIONALI:
    • Analisi composizione corporea
    • Calcolo fabbisogno calorico
    • Piano alimentare personalizzato
    • Ricette e meal prep
    • Gestione "sgarri" e flessibilità
    • Integrazione sportiva (se necessaria)
    
    === ❓ FAQ AVANZATE E OBIEZIONI COMUNI ===
    
    Q: "Non ho mai fatto sport, sono troppo fuori forma..."
    A: PERFETTO! I migliori clienti partono da zero. Ho protocolli specifici per principianti assoluti. Iniziamo gradualmente e costruiamo una base solida. La mia specialità è proprio trasformare persone che non si sono mai allenate in atleti della loro vita quotidiana.
    
    Q: "Ho provato tutto, niente funziona per me..."
    A: Capisco la frustrazione. Il 90% dei fallimenti deriva da approcci generici o non sostenibili. Io lavoro diversamente: prima analizzo PERCHÉ gli altri metodi non hanno funzionato, poi creo un piano che si adatta al TUO stile di vita, non viceversa.
    
    Q: "Non ho tempo, lavoro 12 ore al giorno..."
    A: I miei clienti più occupati sono spesso quelli che ottengono i risultati migliori! Creo programmi da 20-30 minuti ultra-efficaci. L'efficienza batte sempre la quantità. E poi... chi ha tempo da perdere con allenamenti che non funzionano?
    
    Q: "Sono troppo vecchio per iniziare..."
    A: Il miglior momento per piantare un albero era 20 anni fa. Il secondo miglior momento è OGGI. Ho clienti da 16 a 75 anni. L'età è solo un numero quando hai il programma giusto.
    
    Q: "Costa troppo, non posso permettermelo..."
    A: Capisco. Ma facciamo un calcolo: quanto spendi in medicine, integratori che non servono, tentativi falliti, stress da malessere? Il personal training non è un costo, è un investimento nella tua salute. E ho soluzioni per tutti i budget: dalle miniclassi all'app online.
    
    Q: "Ho problemi fisici/infortuni..."
    A: Ancora meglio! Lavoro spesso con fisioterapisti. Il movimento corretto è spesso la miglior medicina. Ovviamente tutto sotto supervisione medica quando necessario.
    
    Q: "Preferisco allenarmi da solo..."
    A: Ti capisco, molti la pensano così... finché non provano il personal training! Non è che ti sto addosso a contare le ripetizioni. Ti insegno COME allenarti davvero, poi potrai essere autonomo. È come imparare a guidare: serve un istruttore all'inizio.
    
    Q: "E se non ottengo risultati?"
    A: Domanda legittima. I risultati dipendono da: 1) Programma corretto (io) 2) Costanza (tu) 3) Alimentazione adeguata (insieme). Se fai la tua parte, i risultati arrivano. SEMPRE. Ho 12 anni di trasformazioni a dimostrarlo.
    
    Q: "Meglio palestra o personal trainer?"
    A: Dipende dai tuoi obiettivi. Palestra: buona per socializzare, costi bassi. Personal trainer: risultati garantiti, no perdite di tempo, apprendimento corretto. È come la differenza tra studiare da autodidatta o avere un tutor privato.
    
    Q: "Quanto tempo per vedere risultati?"
    A: Prima settimana: più energia. Secondo settimana: migliore umore. Primo mese: primi cambiamenti fisici visibili. Tre mesi: trasformazione evidente. Sei mesi: nuova persona. Ma già dal primo allenamento ti senti diverso!
    
    === 📞 CONTATTI E PRENOTAZIONI ===
    
    WhatsApp: 347 888 1515 (PREFERITO - risposta rapida)
    Email: andrea.padoan@gmail.com
    Sito Personal Training: https://www.personaltrainerverona.it
    Sito Tribù Studio: https://www.tribustudio.it
    
    PRENOTAZIONE PRIMA SESSIONE:
    • Messaggio WhatsApp con: nome, obiettivo, disponibilità oraria
    • Sessione conoscitiva gratuita di 15 minuti
    • Prima sessione di prova: 40€ (detraibili dal pacchetto)
    • Possibilità di visitare lo studio prima di decidere
    
    === 🎯 PERSONALIZZAZIONE MESSAGGI PER TIPOLOGIE CLIENTE ===
    
    CLIENTE PRINCIPIANTE:
    "Non preoccuparti di essere alle prime armi! I miei migliori clienti erano principianti assoluti. Partiamo dal tuo livello e costruiamo passo dopo passo. La cosa bella del fitness è che ogni piccolo miglioramento è una vittoria!"
    
    CLIENTE ESPERTO/DELUSO:
    "Capisco la frustrazione di non ottenere risultati nonostante l'impegno. Spesso il problema è nella programmazione o nell'approccio. Analizziamo insieme cosa non ha funzionato e troviamo la strategia giusta per te."
    
    CLIENTE CON POCO TEMPO:
    "Perfetto! I miei protocolli più efficaci sono spesso quelli più brevi. 30 minuti con il programma giusto valgono più di 2 ore casuali. Ottimizziamo ogni minuto del tuo tempo."
    
    CLIENTE BUDGET LIMITATO:
    "Ti capisco, l'investimento è importante. Abbiamo diverse opzioni: dalle miniclassi a 15€ all'app online. L'importante è iniziare con ciò che è sostenibile per te. I risultati giustificheranno l'investimento."
    
    CLIENTE MOTIVAZIONE BASSA:
    "La motivazione va e viene, ma le abitudini rimangono. Il mio lavoro è aiutarti a creare un sistema che funzioni anche quando non hai voglia. Una volta che diventa automatico, non serve più forza di volontà."
    
    === 🏆 STORIE DI SUCCESSO (da usare come ispirazione) ===
    
    MARIA, 45 anni, manager:
    "In 6 mesi ha perso 15kg e ritrovato energia. Ora corre le maratone e ha cambiato lavoro per ridurre lo stress."
    
    LUCA, 30 anni, programmer:
    "Dal divano alla sua prima gara di triathlon in 1 anno. Ha risolto anche i problemi di postura dal lavoro al computer."
    
    GIULIA, 28 anni, neomamma:
    "Ha ritrovato la forma pre-gravidanza in 4 mesi e dice di sentirsi più forte di prima."
    
    ANTONIO, 55 anni, imprenditore:
    "Ha trasformato completamente il suo corpo e il suo business. Maggiore energia = migliori decisioni."
    `;

    const advancedPrompt = `Sei Andrea Padoan, personal trainer e lifestyle coach di Verona.

    ${massiveKnowledgeBase}

    === 🎯 ISTRUZIONI AVANZATE PER CONVERSAZIONI ===

    PERSONALITÀ:
    - Sei caloroso, genuino e motivante
    - Parli in prima persona con esperienza diretta
    - Eviti il gergo tecnico eccessivo (resta comprensibile)
    - Mostri passione autentica per la trasformazione delle persone
    - Sei diretto ma mai arrogante
    - Usi esempi concreti e storie reali

    STRATEGIA CONVERSAZIONALE:
    1. ASCOLTA: Fai domande per capire davvero la situazione
    2. EMPATIZZA: Riconosci le difficoltà e frustrazioni
    3. EDUCA: Spiega il "perché" dietro i tuoi consigli
    4. ISPIRA: Condividi visioni positive del futuro
    5. GUIDA: Proponi azioni concrete e prossimi passi

    QUANDO PARLARE DI PREZZI:
    - Non evitare l'argomento, ma contestualizza il valore
    - Usa il principio "investimento vs costo"
    - Presenta sempre 2-3 opzioni
    - Sottolinea i benefici a lungo termine

    GESTIONE OBIEZIONI:
    - Riconosci sempre la validità della preoccupazione
    - Condividi esperienze di altri clienti simili
    - Proponi alternative o compromessi
    - Non essere mai insistente o aggressivo

    CALL TO ACTION:
    - Sempre presente ma mai pressante
    - Offri sempre un "passo successivo" facile
    - Usa il WhatsApp come contatto preferito
    - Proponi la sessione conoscitiva gratuita

    TONO E STILE:
    - Usa "tu" informale
    - Inserisci qualche emoji appropriata (💪 🎯 😊)
    - Frasi non troppo lunghe
    - Linguaggio colloquiale ma professionale

    Messaggio utente: "${message.trim()}"

    Rispondi come Andrea Padoan seguendo le istruzioni avanzate:`;
    
    try {
        console.log('🔄 Calling Claude API with enhanced prompt...');
        
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
                max_tokens: 500, // Aumentato per risposte più complete
                messages: [{ role: 'user', content: advancedPrompt }]
            })
        });
        
        console.log('📡 Claude API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Claude API Error:', response.status, errorText);
            throw new Error(`Claude API Error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Claude API success with enhanced knowledge');
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('❌ Invalid Claude API response format:', data);
            throw new Error('Invalid response format from Claude API');
        }
        
        const botResponse = data.content[0].text;
        console.log('💬 Enhanced bot response generated, length:', botResponse.length);
        
        // Enhanced Airtable logging with more intelligence
        enhancedAirtableLogging(message.trim(), botResponse)
            .then(() => console.log('✅ Enhanced Airtable logging completed'))
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

// 📊 ENHANCED AIRTABLE LOGGING con AI più intelligente
async function enhancedAirtableLogging(userMessage, botResponse) {
    const webhookUrl = 'https://hooks.airtable.com/workflows/v1/genericWebhook/applozDwnDZOgPvsg/wflXjsQEowx2dmnN8/wtrzKiazR0Tt8171P';
    
    const leadScore = advancedLeadScore(userMessage, botResponse);
    const interestArea = intelligentInterestDetection(userMessage);
    const sessionId = generateSessionId();
    const conversationStage = detectConversationStage(userMessage);
    const urgencyLevel = detectUrgency(userMessage);
    
    const payload = {
        User_Message: userMessage,
        Bot_Response: botResponse,
        Lead_Score: leadScore,
        Interest_Area: interestArea,
        Session_ID: sessionId,
        Conversation_Stage: conversationStage,
        Urgency_Level: urgencyLevel,
        Message_Length: userMessage.length,
        Response_Length: botResponse.length,
        User_Agent: 'Vercel-API-Enhanced'
    };
    
    try {
        console.log('📊 Enhanced logging to Airtable...', {
            leadScore,
            interestArea,
            conversationStage,
            urgencyLevel,
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
            console.log('✅ Enhanced conversation logged to Airtable successfully');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to log to Airtable:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Airtable logging error:', error);
    }
}

// 🎯 ADVANCED LEAD SCORING con logica più sofisticata
function advancedLeadScore(message, botResponse) {
    let score = 3; // Base score ridotto
    const lower = message.toLowerCase();
    
    // 🔥 HIGH INTENT SIGNALS (3-4 points each)
    if (lower.includes('voglio iniziare') || lower.includes('come si fa')) score += 4;
    if (lower.includes('quanto costa') || lower.includes('prezzi') || lower.includes('tariffe')) score += 4;
    if (lower.includes('prenotare') || lower.includes('appuntamento')) score += 5;
    if (lower.includes('quando possiamo') || lower.includes('disponibilità')) score += 4;
    if (lower.includes('urgente') || lower.includes('subito') || lower.includes('prima possibile')) score += 4;
    
    // 💰 BUYING SIGNALS (2-3 points each)
    if (lower.includes('investimento') || lower.includes('budget')) score += 3;
    if (lower.includes('pacchetto') || lower.includes('abbonamento')) score += 3;
    if (lower.includes('prova') || lower.includes('test')) score += 2;
    
    // 🎯 SPECIFIC NEEDS (2-3 points each)
    if (lower.includes('dimagrire') || lower.includes('perdere peso')) score += 3;
    if (lower.includes('tonificare') || lower.includes('muscoli')) score += 3;
    if (lower.includes('risultati') || lower.includes('obiettivi')) score += 2;
    if (lower.includes('trasformazione') || lower.includes('cambiare')) score += 3;
    
    // 🚨 PAIN POINTS (2-3 points each)
    if (lower.includes('non riesco') || lower.includes('fallito') || lower.includes('provato tutto')) score += 3;
    if (lower.includes('frustrato') || lower.includes('demotivato')) score += 2;
    if (lower.includes('problema') || lower.includes('difficoltà')) score += 2;
    
    // 📞 CONTACT READINESS (3-5 points each)
    if (lower.includes('numero') || lower.includes('telefono') || lower.includes('chiamare')) score += 4;
    if (lower.includes('whatsapp') || lower.includes('messaggio')) score += 3;
    if (lower.includes('incontrarci') || lower.includes('vederci')) score += 5;
    
    // 🏃‍♂️ SERVICE INTEREST (1-2 points each)
    if (lower.includes('personal training') || lower.includes('personal trainer')) score += 2;
    if (lower.includes('studio') || lower.includes('tribù')) score += 2;
    if (lower.includes('online') || lower.includes('app')) score += 1;
    if (lower.includes('coppia') || lower.includes('insieme')) score += 2;
    
    // ⏰ TIME AVAILABILITY (1-2 points each)
    if (lower.includes('tempo') && (lower.includes('poco') || lower.includes('limitato'))) score += 1;
    if (lower.includes('mattina') || lower.includes('sera') || lower.includes('weekend')) score += 1;
    
    // 💬 MESSAGE QUALITY BONUS
    if (message.length > 100) score += 1; // Longer messages show more interest
    if (message.split(' ').length > 20) score += 1; // Detailed messages
    
    // 🤝 RELATIONSHIP BUILDING
    if (lower.includes('grazie') || lower.includes('complimenti')) score += 1;
    if (lower.includes('esperienza') || lower.includes('professionale')) score += 1;
    
    return Math.min(score, 10); // Max score 10
}

// 🧠 INTELLIGENT INTEREST DETECTION con più categorie
function intelligentInterestDetection(message) {
    const lower = message.toLowerCase();
    let scores = {
        fitness: 0,
        nutrition: 0,
        business: 0,
        coaching: 0,
        online: 0,
        studio: 0,
        posturale: 0
    };
    
    // FITNESS KEYWORDS
    const fitnessKeywords = ['personal', 'allenamento', 'fitness', 'palestra', 'muscoli', 'forma', 'peso', 
                           'dimagrire', 'tonificare', 'esercizi', 'workout', 'training'];
    fitnessKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.fitness += 1;
    });
    
    // NUTRITION KEYWORDS
    const nutritionKeywords = ['dieta', 'alimentazione', 'mangiare', 'pasti', 'nutrizione', 'meal', 
                              'cibo', 'calorie', 'mealprep', 'ricette'];
    nutritionKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.nutrition += 1;
    });
    
    // BUSINESS KEYWORDS
    const businessKeywords = ['business', 'startup', 'impresa', 'soldi', 'guadagno', 'upstart', 
                             'idea', 'progetto', 'imprenditore'];
    businessKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.business += 1;
    });
    
    // COACHING KEYWORDS
    const coachingKeywords = ['mindset', 'motivazione', 'coach', 'lifestyle', 'mente', 'psicologia', 
                             'abitudini', 'cambiare', 'trasformazione'];
    coachingKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.coaching += 1;
    });
    
    // ONLINE KEYWORDS
    const onlineKeywords = ['online', 'distanza', 'app', 'torno in forma', 'remoto', 'video'];
    onlineKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.online += 1;
    });
    
    // STUDIO KEYWORDS
    const studioKeywords = ['studio', 'tribù', 'verona', 'coppia', 'miniclass', 'gruppo'];
    studioKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.studio += 1;
    });
    
    // POSTURALE KEYWORDS
    const posturaleKeywords = ['postura', 'mal di schiena', 'dolore', 'cervicale', 'riabilitazione'];
    posturaleKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.posturale += 1;
    });
    
    // Return the category with highest score
    const maxScore = Math.max(...Object.values(scores));
    const topCategory = Object.keys(scores).find(key => scores[key] === maxScore);
    
    return maxScore > 0 ? topCategory : 'general';
}

// 🎭 CONVERSATION STAGE DETECTION
function detectConversationStage(message) {
    const lower = message.toLowerCase();
    
    // INITIAL INQUIRY
    if (lower.includes('ciao') || lower.includes('salve') || lower.includes('buongiorno') || 
        lower.includes('informazioni') || lower.includes('sapere') || lower.includes('vorrei')) {
        return 'initial_inquiry';
    }
    
    // PRICE INQUIRY
    if (lower.includes('costo') || lower.includes('prezzo') || lower.includes('quanto') || 
        lower.includes('tariffe') || lower.includes('budget')) {
        return 'price_inquiry';
    }
    
    // BOOKING INTENT
    if (lower.includes('prenotare') || lower.includes('appuntamento') || lower.includes('quando') || 
        lower.includes('disponibile') || lower.includes('orari')) {
        return 'booking_intent';
    }
    
    // OBJECTION HANDLING
    if (lower.includes('ma') || lower.includes('però') || lower.includes('non so') || 
        lower.includes('dubbio') || lower.includes('pensare')) {
        return 'objection_handling';
    }
    
    // READY TO BUY
    if (lower.includes('va bene') || lower.includes('perfetto') || lower.includes('iniziamo') || 
        lower.includes('procediamo') || lower.includes('contatto')) {
        return 'ready_to_buy';
    }
    
    return 'exploration';
}

// ⚡ URGENCY LEVEL DETECTION
function detectUrgency(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('urgente') || lower.includes('subito') || lower.includes('prima possibile') || 
        lower.includes('immediato')) {
        return 'high';
    }
    
    if (lower.includes('presto') || lower.includes('velocemente') || lower.includes('entro') || 
        lower.includes('questa settimana')) {
        return 'medium';
    }
    
    return 'low';
}

function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
}