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

    const { message, conversationHistory = [] } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }

    // Debug logging
    console.log('=== CHAT API PHASE 1 DEBUG ===');
    console.log('Received message:', message);
    console.log('Conversation history length:', conversationHistory.length);
    
    // Get Claude API key
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
        console.error('❌ CLAUDE_API_KEY not found in environment variables');
        return res.status(500).json({ 
            error: 'Configurazione server non corretta. Contattami su WhatsApp al 347 888 1515!' 
        });
    }

    // 🧠 QUIZ ASSESSMENT SYSTEM
    const quizQuestions = {
        1: {
            question: "Prima di tutto, su una scala da 1 a 10, come valuti il tuo livello di forma fisica attuale? 💪",
            options: ["1-3 (Principiante assoluto)", "4-6 (Qualche base ma inconsistente)", "7-8 (Discretamente allenato)", "9-10 (Molto allenato)"],
            key: "fitness_level"
        },
        2: {
            question: "Perfetto! Qual è il tuo obiettivo principale? 🎯",
            options: ["A) Dimagrire e perdere peso", "B) Tonificare e definire", "C) Aumentare energia e benessere", "D) Migliorare performance sportive", "E) Correggere postura/dolori"],
            key: "main_goal"
        },
        3: {
            question: "Quanto tempo puoi dedicare all'allenamento a settimana? ⏰",
            options: ["A) 1-2 ore (molto poco tempo)", "B) 3-4 ore (tempo moderato)", "C) 5-6 ore (buona disponibilità)", "D) 7+ ore (tanto tempo)"],
            key: "time_available"
        },
        4: {
            question: "Hai mai fatto personal training o seguito programmi strutturati? 📚",
            options: ["A) Mai, sono completamente nuovo", "B) Qualche volta ma senza costanza", "C) Sì, ma non ho ottenuto risultati", "D) Sì, e mi è sempre piaciuto"],
            key: "experience_level"
        },
        5: {
            question: "Ultima domanda: quale budget mensile consideri sostenibile per il tuo benessere? 💰",
            options: ["A) 50-100€ (budget limitato)", "B) 100-200€ (budget moderato)", "C) 200-400€ (budget buono)", "D) 400€+ (investimento importante)"],
            key: "budget_range"
        }
    };

    // 🎯 AI RECOMMENDATION ENGINE
    const recommendationEngine = {
        generatePersonalizedPlan: (answers) => {
            const recommendations = [];
            let primaryService = "";
            let reasoning = "";
            let compatibilityScore = 0;
            
            // Analisi livello fitness
            const fitnessLevel = answers.fitness_level || "";
            const goal = answers.main_goal || "";
            const time = answers.time_available || "";
            const experience = answers.experience_level || "";
            const budget = answers.budget_range || "";
            
            // LOGIC TREE PER RACCOMANDAZIONI
            
            // Budget-driven recommendations
            if (budget.includes("50-100")) {
                primaryService = "Miniclassi (15€/sessione)";
                reasoning = "Budget ottimizzato con massimo valore";
                compatibilityScore += 7;
                
                recommendations.push({
                    service: "Miniclassi 2x/settimana",
                    price: "120€/mese (8 sessioni)",
                    benefits: ["Gruppo motivante", "Costi contenuti", "Orari fissi", "Socializzazione"],
                    perfect_for: "Chi vuole risultati con budget limitato"
                });
                
                if (goal.includes("Dimagrire")) {
                    recommendations.push({
                        service: "App 'Torno in Forma' (aggiunta)",
                        price: "+70€/mese",
                        benefits: ["Allenamenti extra casa", "Piano nutrizionale", "Supporto costante"],
                        perfect_for: "Accelerare il dimagrimento"
                    });
                }
                
            } else if (budget.includes("100-200")) {
                primaryService = "Percorso Misto (Miniclassi + Individuali)";
                reasoning = "Equilibrio perfetto tra attenzione personale e socializzazione";
                compatibilityScore += 8;
                
                recommendations.push({
                    service: "2 Miniclassi + 1 Individuale/mese",
                    price: "165€/mese",
                    benefits: ["Attenzione personalizzata", "Gruppo motivante", "Progressi più rapidi", "Correzioni specifiche"],
                    perfect_for: "Chi vuole il meglio di entrambi i mondi"
                });
                
            } else if (budget.includes("200-400")) {
                primaryService = "Personal Training Individuale";
                reasoning = "Attenzione 100% dedicata per risultati ottimali";
                compatibilityScore += 9;
                
                if (time.includes("1-2 ore")) {
                    recommendations.push({
                        service: "2 Sessioni individuali/settimana",
                        price: "400€/mese (8 sessioni da 50€)",
                        benefits: ["Efficienza massima", "Programma ultra-personalizzato", "Risultati garantiti", "Flessibilità orari"],
                        perfect_for: "Chi ha poco tempo ma vuole risultati certi"
                    });
                } else {
                    recommendations.push({
                        service: "3 Sessioni individuali/settimana",
                        price: "600€/mese (12 sessioni da 50€)",
                        benefits: ["Trasformazione accelerata", "Monitoraggio costante", "Motivazione continua", "Risultati eccezionali"],
                        perfect_for: "Chi vuole una trasformazione completa"
                    });
                }
                
            } else { // Budget 400€+
                primaryService = "Percorso Premium Completo";
                reasoning = "La formula di eccellenza per trasformazioni straordinarie";
                compatibilityScore += 10;
                
                recommendations.push({
                    service: "Personal Training Premium + Consulenza Nutrizionale",
                    price: "650€/mese",
                    benefits: ["3 sessioni individuali/settimana", "Piano nutrizionale personalizzato", "Supporto 24/7", "Analisi corporea mensile", "App inclusa"],
                    perfect_for: "Chi vuole investire seriamente nel proprio benessere"
                });
            }
            
            // Goal-specific adjustments
            if (goal.includes("Dimagrire")) {
                compatibilityScore += 1;
                recommendations.forEach(rec => {
                    rec.goal_focus = "Protocolli specifici per dimagrimento sostenibile";
                });
            } else if (goal.includes("Tonificare")) {
                compatibilityScore += 1;
                recommendations.forEach(rec => {
                    rec.goal_focus = "Focus su tonificazione e definizione muscolare";
                });
            } else if (goal.includes("performance")) {
                compatibilityScore += 2;
                recommendations.forEach(rec => {
                    rec.goal_focus = "Preparazione atletica e miglioramento performance";
                });
            }
            
            // Experience adjustments
            if (experience.includes("Mai") && fitnessLevel.includes("1-3")) {
                reasoning += " - Perfetto per principianti, con progressione graduale";
                compatibilityScore += 1;
            } else if (experience.includes("non ho ottenuto risultati")) {
                reasoning += " - Finalmente l'approccio giusto per te!";
                compatibilityScore += 2;
            }
            
            return {
                primary_service: primaryService,
                reasoning: reasoning,
                compatibility_score: Math.min(compatibilityScore, 10),
                recommendations: recommendations,
                next_steps: [
                    "Sessione conoscitiva gratuita (15 min)",
                    "Visita dello studio senza impegno",
                    "Prima sessione di prova (40€, detraibili)"
                ]
            };
        }
    };

    // 🔍 QUIZ STATE DETECTION
    const detectQuizState = (message, history) => {
        const lower = message.toLowerCase();
        
        // Check if user wants to start quiz
        if (lower.includes('quiz') || lower.includes('domande') || lower.includes('assessment') ||
            lower.includes('consigli') || lower.includes('quale') && lower.includes('servizio')) {
            return { action: 'start_quiz', step: 1 };
        }
        
        // Check if we're in middle of quiz (look for A, B, C, D answers or numbers)
        if (history.length > 0) {
            const lastBotMessage = history[history.length - 1]?.bot || "";
            if (lastBotMessage.includes("scala da 1 a 10")) {
                return { action: 'quiz_answer', step: 1, answer: message };
            }
            if (lastBotMessage.includes("obiettivo principale")) {
                return { action: 'quiz_answer', step: 2, answer: message };
            }
            if (lastBotMessage.includes("tempo puoi dedicare")) {
                return { action: 'quiz_answer', step: 3, answer: message };
            }
            if (lastBotMessage.includes("personal training o seguito")) {
                return { action: 'quiz_answer', step: 4, answer: message };
            }
            if (lastBotMessage.includes("budget mensile")) {
                return { action: 'quiz_answer', step: 5, answer: message };
            }
        }
        
        return { action: 'normal_chat' };
    };

    // ENHANCED KNOWLEDGE BASE
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
    
    === 📱 APP "TORNO IN FORMA" - CONSULENZA A DISTANZA ===
    
    PREZZI APP "TORNO IN FORMA":
    • 1 mese → 140€ (per testare l'approccio)
    • 3 mesi → 250€ (risparmio 22% - CONSIGLIATO)
    • 6 mesi → 450€ (risparmio 46% - TRASFORMAZIONE COMPLETA)
    
    FUNZIONALITÀ APP:
    • Schede aggiornate ogni mese
    • Video dimostrativi per ogni esercizio
    • Progressione mensile programmata
    • Consigli nutrizionali personalizzati
    • Chat diretta con me per domande
    • Call mensile di follow-up (30 min)

    === 🏢 TRIBÙ STUDIO - ESPERIENZA PREMIUM ===
    
    FILOSOFIA TRIBÙ:
    • Studio privato esclusivo nel centro di Verona
    • Ambiente intimo e personalizzato
    • Solo allenamenti con supervisione diretta
    • Attrezzature professionali di ultima generazione
    • Focus sulla relazione one-to-one
    • Approccio olistico: corpo, mente, lifestyle

    === ❓ FAQ AVANZATE E OBIEZIONI COMUNI ===
    
    Q: "Non ho mai fatto sport, sono troppo fuori forma..."
    A: PERFETTO! I migliori clienti partono da zero. Ho protocolli specifici per principianti assoluti. Iniziamo gradualmente e costruiamo una base solida. La mia specialità è proprio trasformare persone che non si sono mai allenate in atleti della loro vita quotidiana.
    
    Q: "Ho provato tutto, niente funziona per me..."
    A: Capisco la frustrazione. Il 90% dei fallimenti deriva da approcci generici o non sostenibili. Io lavoro diversamente: prima analizzo PERCHÉ gli altri metodi non hanno funzionato, poi creo un piano che si adatta al TUO stile di vita, non viceversa.
    
    Q: "Non ho tempo, lavoro 12 ore al giorno..."
    A: I miei clienti più occupati sono spesso quelli che ottengono i risultati migliori! Creo programmi da 20-30 minuti ultra-efficaci. L'efficienza batte sempre la quantità. E poi... chi ha tempo da perdere con allenamenti che non funzionano?
    
    Q: "Costa troppo, non posso permettermelo..."
    A: Capisco. Ma facciamo un calcolo: quanto spendi in medicine, integratori che non servono, tentativi falliti, stress da malessere? Il personal training non è un costo, è un investimento nella tua salute. E ho soluzioni per tutti i budget: dalle miniclassi all'app online.

    === 📞 CONTATTI E PRENOTAZIONI ===
    
    WhatsApp: 347 888 1515 (PREFERITO - risposta rapida)
    Email: andrea.padoan@gmail.com
    Sito Personal Training: https://www.personaltrainerverona.it
    Sito Tribù Studio: https://www.tribustudio.it
    `;

    // Detect quiz state
    const quizState = detectQuizState(message, conversationHistory);
    
    let prompt = "";
    
    if (quizState.action === 'start_quiz') {
        // Start the quiz
        prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach di Verona.

${massiveKnowledgeBase}

L'utente ha chiesto consigli sui servizi o vuole fare un assessment. Inizia il quiz di valutazione con entusiasmo e professionalità.

Utilizza esattamente questa domanda per iniziare:
"${quizQuestions[1].question}"

E poi presenta le opzioni:
${quizQuestions[1].options.map((opt, i) => `${opt}`).join('\n')}

Sii caloroso e spiega che questo ti aiuterà a consigliargli il servizio perfetto per lui.

Messaggio utente: "${message.trim()}"`;

    } else if (quizState.action === 'quiz_answer') {
        // Handle quiz progression
        const currentStep = quizState.step;
        const nextStep = currentStep + 1;
        
        if (nextStep <= 5) {
            // Continue with next question
            prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach di Verona.

${massiveKnowledgeBase}

L'utente ha appena risposto alla domanda ${currentStep} del quiz di assessment: "${quizState.answer}"

Ringrazialo brevemente per la risposta e fai la prossima domanda:

"${quizQuestions[nextStep].question}"

Opzioni:
${quizQuestions[nextStep].options.map((opt, i) => `${opt}`).join('\n')}

Sii incoraggiante e motivante.

Messaggio utente: "${message.trim()}"`;

        } else {
            // Quiz completed - generate recommendations
            const answers = extractAnswersFromHistory(conversationHistory, message);
            const personalizedPlan = recommendationEngine.generatePersonalizedPlan(answers);
            
            prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach di Verona.

${massiveKnowledgeBase}

L'utente ha completato il quiz di assessment. Ecco il suo profilo:
${JSON.stringify(answers, null, 2)}

Genera una risposta personalizzata che include:
1. Ringraziamento per aver completato il quiz
2. Il piano personalizzato raccomandato: ${personalizedPlan.primary_service}
3. Punteggio di compatibilità: ${personalizedPlan.compatibility_score}/10
4. Spiegazione del perché questo servizio è perfetto per lui: ${personalizedPlan.reasoning}
5. Dettagli specifici del servizio raccomandato
6. Prossimi passi concreti per iniziare
7. Invito a contattarti su WhatsApp per approfondire

Usa un tono entusiasta ma professionale. Sii specifico sui benefici e sui risultati che può aspettarsi.

Messaggio utente: "${message.trim()}"`;
        }
        
    } else {
        // Normal conversation
        prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach di Verona.

${massiveKnowledgeBase}

ISTRUZIONI SPECIALI:
- Se l'utente chiede consigli sui servizi, suggerisci il quiz di assessment: "Ti faccio 5 domande veloci per consigliarti il servizio perfetto!"
- Se l'utente sembra indeciso, proponi il quiz per aiutarlo a scegliere
- Sempre professionale, caloroso e motivante
- Usa esempi concreti e risultati reali
- Include sempre un call-to-action appropriato

Messaggio utente: "${message.trim()}"

Rispondi come Andrea Padoan:`;
    }
    
    try {
        console.log('🔄 Calling Claude API with Quiz System...');
        
        // Chiama Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 600,
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
        console.log('✅ Claude API success with Quiz System');
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('❌ Invalid Claude API response format:', data);
            throw new Error('Invalid response format from Claude API');
        }
        
        const botResponse = data.content[0].text;
        console.log('💬 Quiz-enhanced bot response generated, length:', botResponse.length);
        
        // Enhanced Airtable logging with quiz data
        enhancedAirtableLogging(message.trim(), botResponse, quizState)
            .then(() => console.log('✅ Enhanced Airtable logging completed'))
            .catch(err => console.error('❌ Airtable logging failed:', err));
        
        // Return successful response with quiz state
        res.status(200).json({ 
            response: botResponse,
            quiz_state: quizState.action,
            quiz_step: quizState.step || null
        });
        
    } catch (error) {
        console.error('❌ Handler Error:', error);
        res.status(500).json({ 
            error: 'Mi dispiace, ho avuto un problema tecnico. Contattami su WhatsApp al 347 888 1515!' 
        });
    }
}

// 🔍 Extract answers from conversation history
function extractAnswersFromHistory(history, lastMessage) {
    const answers = {};
    
    // This is a simplified version - in production you'd want more robust parsing
    // For now, we'll extract based on message patterns
    
    history.forEach((exchange, index) => {
        const bot = exchange.bot || "";
        const user = exchange.user || "";
        
        if (bot.includes("scala da 1 a 10")) {
            answers.fitness_level = user;
        } else if (bot.includes("obiettivo principale")) {
            answers.main_goal = user;
        } else if (bot.includes("tempo puoi dedicare")) {
            answers.time_available = user;
        } else if (bot.includes("personal training o seguito")) {
            answers.experience_level = user;
        }
    });
    
    // Add the last message as the budget answer if we're at step 5
    if (Object.keys(answers).length === 4) {
        answers.budget_range = lastMessage;
    }
    
    return answers;
}

// 📊 ENHANCED AIRTABLE LOGGING with Quiz Data
async function enhancedAirtableLogging(userMessage, botResponse, quizState) {
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
        Quiz_State: quizState.action,
        Quiz_Step: quizState.step || null,
        Message_Length: userMessage.length,
        Response_Length: botResponse.length,
        User_Agent: 'Vercel-API-Quiz-Enhanced'
    };
    
    try {
        console.log('📊 Enhanced logging with Quiz data to Airtable...', {
            leadScore,
            interestArea,
            quizState: quizState.action,
            quizStep: quizState.step
        });
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ Quiz-enhanced conversation logged to Airtable successfully');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to log to Airtable:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Airtable logging error:', error);
    }
}

// 🎯 ADVANCED LEAD SCORING (same as before)
function advancedLeadScore(message, botResponse) {
    let score = 3;
    const lower = message.toLowerCase();
    
    // Quiz participation bonus
    if (lower.includes('quiz') || lower.includes('assessment') || lower.includes('domande')) {
        score += 3; // High engagement signal
    }
    
    // High intent signals
    if (lower.includes('voglio iniziare') || lower.includes('come si fa')) score += 4;
    if (lower.includes('quanto costa') || lower.includes('prezzi')) score += 4;
    if (lower.includes('prenotare') || lower.includes('appuntamento')) score += 5;
    if (lower.includes('urgente') || lower.includes('subito')) score += 4;
    
    // Buying signals
    if (lower.includes('investimento') || lower.includes('budget')) score += 3;
    if (lower.includes('pacchetto') || lower.includes('abbonamento')) score += 3;
    
    // Specific needs
    if (lower.includes('dimagrire') || lower.includes('perdere peso')) score += 3;
    if (lower.includes('tonificare') || lower.includes('muscoli')) score += 3;
    if (lower.includes('risultati') || lower.includes('obiettivi')) score += 2;
    
    // Pain points
    if (lower.includes('non riesco') || lower.includes('fallito')) score += 3;
    if (lower.includes('frustrato') || lower.includes('demotivato')) score += 2;
    
    // Contact readiness
    if (lower.includes('numero') || lower.includes('telefono')) score += 4;
    if (lower.includes('whatsapp')) score += 3;
    
    return Math.min(score, 10);
}

// 🧠 INTELLIGENT INTEREST DETECTION (same as before)
function intelligentInterestDetection(message) {
    const lower = message.toLowerCase();
    let scores = {
        fitness: 0,
        nutrition: 0,
        business: 0,
        coaching: 0,
        online: 0,
        studio: 0,
        assessment: 0
    };
    
    // Assessment/Quiz interest
    if (lower.includes('quiz') || lower.includes('assessment') || lower.includes('domande') || 
        lower.includes('consigli') || lower.includes('quale servizio')) {
        scores.assessment += 3;
    }
    
    // Fitness keywords
    const fitnessKeywords = ['personal', 'allenamento', 'fitness', 'palestra', 'muscoli', 'forma', 'peso', 'dimagrire', 'tonificare'];
    fitnessKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.fitness += 1;
    });
    
    // Other categories (same logic as before)...
    
    const maxScore = Math.max(...Object.values(scores));
    const topCategory = Object.keys(scores).find(key => scores[key] === maxScore);
    
    return maxScore > 0 ? topCategory : 'general';
}

// 🎭 CONVERSATION STAGE DETECTION (same as before)
function detectConversationStage(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('quiz') || lower.includes('assessment')) {
        return 'quiz_engagement';
    }
    if (lower.includes('costo') || lower.includes('prezzo')) {
        return 'price_inquiry';
    }
    if (lower.includes('prenotare') || lower.includes('appuntamento')) {
        return 'booking_intent';
    }
    
    return 'exploration';
}

// ⚡ URGENCY LEVEL DETECTION (same as before)
function detectUrgency(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('urgente') || lower.includes('subito')) {
        return 'high';
    }
    if (lower.includes('presto') || lower.includes('questa settimana')) {
        return 'medium';
    }
    
    return 'low';
}

function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
}