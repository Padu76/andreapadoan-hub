// 🛠️ HELPER FUNCTIONS - DEFINITE PRIMA DI TUTTO
function detectIntent(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('dimagrire') || lower.includes('perdere peso') || lower.includes('grasso')) {
        return 'weight_loss';
    }
    if (lower.includes('tonificare') || lower.includes('definire') || lower.includes('muscoli')) {
        return 'muscle_toning';
    }
    if (lower.includes('energia') || lower.includes('stanco') || lower.includes('stress')) {
        return 'energy_wellness';
    }
    if (lower.includes('postura') || lower.includes('mal di schiena') || lower.includes('dolore')) {
        return 'posture_pain';
    }
    if (lower.includes('sport') || lower.includes('performance') || lower.includes('competizione')) {
        return 'athletic_performance';
    }
    if (lower.includes('prezzo') || lower.includes('costo') || lower.includes('quanto')) {
        return 'pricing_inquiry';
    }
    if (lower.includes('tempo') || lower.includes('occupato') || lower.includes('lavoro')) {
        return 'time_constraints';
    }
    
    return 'general_inquiry';
}

function extractGoals(message) {
    const goals = [];
    const lower = message.toLowerCase();
    
    if (lower.includes('dimagrire') || lower.includes('perdere')) goals.push('weight_loss');
    if (lower.includes('tonificare') || lower.includes('definire')) goals.push('muscle_building');
    if (lower.includes('energia') || lower.includes('benessere')) goals.push('wellness');
    if (lower.includes('forza') || lower.includes('performance')) goals.push('strength');
    if (lower.includes('postura') || lower.includes('dolore')) goals.push('rehabilitation');
    
    return goals;
}

function extractConstraints(message) {
    const constraints = [];
    const lower = message.toLowerCase();
    
    if (lower.includes('poco tempo') || lower.includes('occupato') || lower.includes('lavoro')) {
        constraints.push('time_limited');
    }
    if (lower.includes('principiante') || lower.includes('mai fatto') || lower.includes('nuovo')) {
        constraints.push('beginner');
    }
    if (lower.includes('infortunio') || lower.includes('problema') || lower.includes('limitazione')) {
        constraints.push('physical_limitation');
    }
    if (lower.includes('casa') || lower.includes('palestra') || lower.includes('viaggio')) {
        constraints.push('location_flexible');
    }
    
    return constraints;
}

function extractBudgetSignals(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('economico') || lower.includes('budget') || lower.includes('costa poco')) {
        return 'budget_conscious';
    }
    if (lower.includes('investimento') || lower.includes('qualità') || lower.includes('premium')) {
        return 'quality_focused';
    }
    if (lower.includes('€') || /\d+/.test(lower)) {
        return 'price_specific';
    }
    
    return 'price_neutral';
}

function detectUrgency(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('urgente') || lower.includes('subito') || lower.includes('oggi')) {
        return 'high';
    }
    if (lower.includes('presto') || lower.includes('questa settimana') || lower.includes('velocemente')) {
        return 'medium';
    }
    
    return 'low';
}

function extractExperience(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('principiante') || lower.includes('mai fatto') || lower.includes('nuovo')) {
        return 'beginner';
    }
    if (lower.includes('esperto') || lower.includes('anni') && lower.includes('allenamento')) {
        return 'advanced';
    }
    if (lower.includes('fallito') || lower.includes('non funziona') || lower.includes('provato tutto')) {
        return 'frustrated';
    }
    
    return 'intermediate';
}

function determineConversationStage(history) {
    if (history.length === 0) return 'initial';
    if (history.length < 3) return 'exploration';
    if (history.length < 6) return 'consideration';
    return 'decision';
}

function detectLeadMagnetInterest(message) {
    const lower = message.toLowerCase();
    let interestedMagnets = [];

    const leadMagnets = {
        freeEbooks: {
            "50 Workout da Viaggio": {
                title: "50 Workout da Viaggio - GRATUITO",
                description: "Allenamenti efficaci senza attrezzi ovunque",
                downloadUrl: "https://drive.google.com/file/d/your-ebook-id/view",
                trigger: ["viaggio", "casa", "tempo", "hotel", "lavoro"],
                value: "GRATUITO"
            },
            "Guida Principianti": {
                title: "Guida Completa per Principianti - GRATUITO", 
                description: "Tutto quello che devi sapere per iniziare",
                downloadUrl: "https://drive.google.com/file/d/your-beginner-guide/view",
                trigger: ["principiante", "nuovo", "iniziare", "prima volta"],
                value: "GRATUITO"
            }
        }
    };

    Object.entries(leadMagnets.freeEbooks).forEach(([key, ebook]) => {
        const isInterested = ebook.trigger.some(trigger => lower.includes(trigger));
        if (isInterested) {
            interestedMagnets.push({
                type: 'ebook',
                magnet: ebook,
                key: key
            });
        }
    });

    return interestedMagnets;
}

function extractContactInfo(message, history) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+39\s?)?(\d{3})\s?(\d{3})\s?(\d{4})/;
    const nameRegex = /mi chiamo ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i;

    return {
        email: message.match(emailRegex)?.[0] || null,
        phone: message.match(phoneRegex)?.[0] || null,
        name: message.match(nameRegex)?.[1]?.trim() || null
    };
}

function selectPrimaryService(analysis) {
    const { intent, goals, constraints, budgetSignals } = analysis;
    
    if (constraints.includes('time_limited')) {
        if (budgetSignals === 'budget_conscious') {
            return {
                name: "Miniclassi Tribù Studio",
                price: "15€/lezione (pacchetto 10 lezioni + 30€ tesseramento)",
                reasoning: "Perfetto per chi ha poco tempo - orari fissi, gruppo motivante, costo contenuto"
            };
        } else {
            return {
                name: "Personal Training Individuale",
                price: "45-60€/lezione (pacchetti da 10-30 lezioni)",
                reasoning: "Efficienza massima - risultati certi in tempi record con supervisione diretta"
            };
        }
    }
    
    if (intent === 'weight_loss' || goals.includes('weight_loss')) {
        if (budgetSignals === 'budget_conscious') {
            return {
                name: "Miniclassi + Consulenza Nutrizionale",
                price: "15€/lezione + 160€ prima visita nutrizionale",
                reasoning: "Combinazione vincente per dimagrimento: gruppo motivante + piano alimentare professionale"
            };
        } else {
            return {
                name: "Personal Training + Consulenza Nutrizionale",
                price: "45-60€/lezione + 160€ prima visita nutrizionale",
                reasoning: "Approccio completo per dimagrimento duraturo - allenamento personalizzato + alimentazione"
            };
        }
    }
    
    if (constraints.includes('beginner')) {
        return {
            name: "Lezioni di Coppia o Miniclassi",
            price: "25-35€/lezione (coppia) o 15€/lezione (miniclassi)",
            reasoning: "Ideale per iniziare - ambiente sicuro, progressione graduale, supporto del gruppo"
        };
    }
    
    return {
        name: "Personal Training Individuale",
        price: "45-60€/lezione (pacchetti da 10-30 lezioni)",
        reasoning: "La scelta più efficace - attenzione 100% personalizzata per i tuoi obiettivi"
    };
}

function generateUpsells(analysis, primaryService) {
    const upsells = [];
    const { intent, goals, constraints } = analysis;
    
    if (!primaryService) return upsells;
    
    if (primaryService.name.includes('Personal Training') || primaryService.name.includes('Miniclassi')) {
        if (intent === 'weight_loss' || goals.includes('weight_loss')) {
            upsells.push({
                suggestion: "Consulenza Nutrizionale Specializzata",
                benefit: "Risultati 3x più veloci con piano alimentare professionale",
                price: "160€ (1h con nutrizionista + piano personalizzato)"
            });
        }
    }
    
    return upsells;
}

function generateCrossSells(analysis, userMessage) {
    const crossSells = [];
    const { intent, goals } = analysis;
    const lower = userMessage.toLowerCase();
    
    if (intent === 'weight_loss' || goals.includes('weight_loss')) {
        crossSells.push({
            product: "eBook 'In Forma da 2 Milioni di Anni'",
            relevance: "Alimentazione evolutiva per dimagrimento naturale",
            price: "19.90€"
        });
    }
    
    if (lower.includes('viaggio') || lower.includes('casa') || lower.includes('tempo')) {
        crossSells.push({
            product: "eBook '50 Workout da Viaggio'",
            relevance: "Allenamenti efficaci senza attrezzi ovunque",
            price: "GRATUITO"
        });
    }
    
    return crossSells;
}

function generateDynamicPricing(analysis, recommendations) {
    const { urgency, budgetSignals } = analysis;
    
    if (urgency === 'high') {
        return {
            offer: "Sconto Decisione Rapida",
            discount: "-10% su tutti i pacchetti da 20+ lezioni",
            validity: "Valido solo per le prossime 48 ore"
        };
    }
    
    return null;
}

function generateLeadMagnetOffer(interestedMagnets) {
    if (interestedMagnets.length === 0) return null;

    const topMagnet = interestedMagnets[0];
    
    return {
        type: topMagnet.type,
        title: topMagnet.magnet.title,
        description: topMagnet.magnet.description,
        value: topMagnet.magnet.value,
        cta: topMagnet.type === 'ebook' ? 'Scarica Gratis' : 'Prenota Ora',
        url: topMagnet.magnet.downloadUrl || topMagnet.magnet.bookingUrl
    };
}

function extractAnswersFromHistory(history, lastMessage) {
    const answers = {};
    
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
    
    if (Object.keys(answers).length === 4) {
        answers.budget_range = lastMessage;
    }
    
    return answers;
}

function generatePersonalizedPlan(answers) {
    const recommendations = [];
    let primaryService = "";
    let reasoning = "";
    let compatibilityScore = 0;
    
    const fitnessLevel = answers.fitness_level || "";
    const goal = answers.main_goal || "";
    const time = answers.time_available || "";
    const experience = answers.experience_level || "";
    const budget = answers.budget_range || "";
    
    if (budget.includes("50-100")) {
        primaryService = "Miniclassi Tribù Studio (15€/lezione + 30€ tesseramento)";
        reasoning = "Budget ottimizzato con massimo valore - gruppo motivante e costi contenuti";
        compatibilityScore += 7;
    } else if (budget.includes("100-200")) {
        primaryService = "Lezioni di Coppia (25-35€/lezione per persona)";
        reasoning = "Equilibrio perfetto tra attenzione personale, socializzazione e costo";
        compatibilityScore += 8;
    } else if (budget.includes("200-400")) {
        primaryService = "Personal Training Individuale (45-60€/lezione)";
        reasoning = "Attenzione 100% dedicata per risultati ottimali";
        compatibilityScore += 9;
    } else {
        primaryService = "Percorso Premium Completo con Consulenza Nutrizionale (160€)";
        reasoning = "La formula di eccellenza per trasformazioni straordinarie";
        compatibilityScore += 10;
    }
    
    return {
        primary_service: primaryService,
        reasoning: reasoning,
        compatibility_score: Math.min(compatibilityScore, 10),
        recommendations: recommendations
    };
}

function advancedLeadScore(message, botResponse) {
    let score = 3;
    const lower = message.toLowerCase();
    
    // Quiz engagement
    if (lower.includes('quiz') || lower.includes('assessment') || lower.includes('domande')) {
        score += 3;
    }
    
    // High intent keywords
    if (lower.includes('voglio iniziare') || lower.includes('come si fa')) score += 4;
    if (lower.includes('quanto costa') || lower.includes('prezzi') || lower.includes('prezzo')) score += 4;
    if (lower.includes('prenotare') || lower.includes('appuntamento') || lower.includes('prova')) score += 5;
    if (lower.includes('urgente') || lower.includes('subito')) score += 4;
    
    // Budget discussion
    if (lower.includes('investimento') || lower.includes('budget') || lower.includes('dilazionare')) score += 3;
    if (lower.includes('pacchetto') || lower.includes('abbonamento')) score += 3;
    
    // Goals discussion
    if (lower.includes('dimagrire') || lower.includes('perdere peso')) score += 3;
    if (lower.includes('tonificare') || lower.includes('muscoli')) score += 3;
    if (lower.includes('risultati') || lower.includes('obiettivi')) score += 2;
    
    // Pain points
    if (lower.includes('non riesco') || lower.includes('fallito')) score += 3;
    if (lower.includes('frustrato') || lower.includes('demotivato')) score += 2;
    
    // Contact intent
    if (lower.includes('numero') || lower.includes('telefono')) score += 4;
    if (lower.includes('whatsapp')) score += 3;
    if (lower.includes('@') && lower.includes('.')) score += 5;
    
    // Studio-specific questions
    if (lower.includes('studio') || lower.includes('tribù')) score += 2;
    if (lower.includes('orari') || lower.includes('disponibilità')) score += 3;
    
    return Math.min(score, 10);
}

function intelligentInterestDetection(message) {
    const lower = message.toLowerCase();
    let scores = {
        fitness: 0,
        nutrition: 0,
        business: 0,
        coaching: 0,
        online: 0,
        studio: 0,
        assessment: 0,
        pricing: 0
    };
    
    // Assessment/Quiz interest
    if (lower.includes('quiz') || lower.includes('assessment') || lower.includes('domande') || 
        lower.includes('consigli') || lower.includes('quale servizio')) {
        scores.assessment += 3;
    }
    
    // Pricing interest
    if (lower.includes('prezzo') || lower.includes('costa') || lower.includes('budget') ||
        lower.includes('dilazionare') || lower.includes('pagamento')) {
        scores.pricing += 3;
    }
    
    // Studio interest
    if (lower.includes('studio') || lower.includes('tribù') || lower.includes('orari') ||
        lower.includes('appuntamento') || lower.includes('prova')) {
        scores.studio += 2;
    }
    
    const fitnessKeywords = ['personal', 'allenamento', 'fitness', 'palestra', 'muscoli', 'forma', 'peso', 'dimagrire', 'tonificare'];
    fitnessKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.fitness += 1;
    });
    
    const nutritionKeywords = ['nutrizione', 'dieta', 'alimentazione', 'cibo', 'mangiare'];
    nutritionKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.nutrition += 1;
    });
    
    const businessKeywords = ['business', 'imprenditore', 'lavoro', 'azienda'];
    businessKeywords.forEach(keyword => {
        if (lower.includes(keyword)) scores.business += 1;
    });
    
    const maxScore = Math.max(...Object.values(scores));
    const topCategory = Object.keys(scores).find(key => scores[key] === maxScore);
    
    return maxScore > 0 ? topCategory : 'general';
}

function detectConversationStage(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('quiz') || lower.includes('assessment')) {
        return 'quiz_engagement';
    }
    if (lower.includes('costo') || lower.includes('prezzo') || lower.includes('budget')) {
        return 'price_inquiry';
    }
    if (lower.includes('prenotare') || lower.includes('appuntamento') || lower.includes('prova')) {
        return 'booking_intent';
    }
    if (lower.includes('email') || lower.includes('@') || lower.includes('telefono')) {
        return 'contact_sharing';
    }
    if (lower.includes('studio') || lower.includes('orari') || lower.includes('come funziona')) {
        return 'information_gathering';
    }
    
    return 'exploration';
}

function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
}

// 📱 DIRECT TELEGRAM NOTIFICATION FUNCTION
async function sendTelegramNotification(userMessage, leadScore, botResponse) {
    const TELEGRAM_BOT_TOKEN = '8018703502:AAGBzIHugAvXGd8A7vuGRUB_prqUngyBMDU';
    const TELEGRAM_CHAT_ID = '1602722401';
    
    try {
        // Send only for high-interest users
        if (leadScore >= 7) {
            const message = `🔥 LEAD CALDO! (VERSIONE CORRETTA)
            
👤 Score: ${leadScore}/10
💬 "${userMessage.substring(0, 100)}..."
⏰ ${new Date().toLocaleString('it-IT')}
🌐 andreapadoan.vercel.app

Controlla subito! 💪`;

            const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            
            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message
                })
            });
            
            if (response.ok) {
                console.log('✅ Telegram notification sent successfully');
                return true;
            } else {
                const error = await response.text();
                console.error('❌ Telegram notification failed:', error);
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Telegram notification error:', error);
        return false;
    }
}

// 📊 ENHANCED AIRTABLE LOGGING
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
        User_Agent: 'Vercel-API-TelegramDirect-FIXED',
        Version: 'FIXED-FunctionsOrdered'
    };
    
    try {
        console.log('📊 Logging to Airtable with FIXED version...', {
            leadScore,
            interestArea,
            version: 'FIXED'
        });
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ FIXED Conversation logged to Airtable successfully');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to log to Airtable:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Airtable logging error:', error);
    }
}

// 🔍 QUIZ STATE DETECTION
const detectQuizState = (message, history) => {
    const lower = message.toLowerCase();
    
    if (lower.includes('quiz') || lower.includes('domande') || lower.includes('assessment') ||
        lower.includes('consigli') || lower.includes('quale') && lower.includes('servizio')) {
        return { action: 'start_quiz', step: 1 };
    }
    
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

// 🎯 MAIN HANDLER FUNCTION
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

    const { message, conversationHistory = [], userEmail = null, userName = null } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }

    console.log('=== CHATBOT ANDREA PADOAN - VERSIONE FIXED ===');
    console.log('Received message:', message);
    console.log('User email:', userEmail);
    console.log('User name:', userName);
    console.log('Conversation history length:', conversationHistory.length);
    
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

    // 🎯 ADVANCED AI RECOMMENDATION ENGINE
    const advancedRecommendationEngine = {
        analyzeMessage: (userMessage, history) => {
            const analysis = {
                intent: detectIntent(userMessage),
                goals: extractGoals(userMessage),
                constraints: extractConstraints(userMessage),
                budgetSignals: extractBudgetSignals(userMessage),
                urgency: detectUrgency(userMessage),
                experience: extractExperience(userMessage),
                conversationStage: determineConversationStage(history),
                leadMagnetInterest: detectLeadMagnetInterest(userMessage),
                contactInfo: extractContactInfo(userMessage, history)
            };
            
            return analysis;
        },

        generateContextualRecommendations: (analysis, userMessage) => {
            const recommendations = [];
            
            const primaryService = selectPrimaryService(analysis);
            if (primaryService) {
                recommendations.push(primaryService);
            }
            
            const upsells = generateUpsells(analysis, primaryService);
            recommendations.push(...upsells);
            
            const crossSells = generateCrossSells(analysis, userMessage);
            recommendations.push(...crossSells);
            
            const pricingOffers = generateDynamicPricing(analysis, recommendations);
            const leadMagnetOffer = generateLeadMagnetOffer(analysis.leadMagnetInterest);
            
            return {
                primary: primaryService,
                upsells: upsells,
                crossSells: crossSells,
                pricing: pricingOffers,
                leadMagnet: leadMagnetOffer,
                urgencyBoost: analysis.urgency === 'high',
                automationTriggers: analysis.contactInfo.email ? true : false
            };
        },

        formatRecommendationsForPrompt: (recommendations, analysis) => {
            let prompt = "";

            if (recommendations.primary || recommendations.upsells.length > 0 || recommendations.crossSells.length > 0) {
                prompt += "\n\n=== RACCOMANDAZIONI INTELLIGENTI ===\n";
                
                if (recommendations.primary) {
                    prompt += `SERVIZIO PRINCIPALE CONSIGLIATO: ${recommendations.primary.name}\n`;
                    prompt += `Prezzo: ${recommendations.primary.price}\n`;
                    prompt += `Perché perfetto: ${recommendations.primary.reasoning}\n\n`;
                }
                
                if (recommendations.upsells.length > 0) {
                    prompt += "UPSELLING NATURALE:\n";
                    recommendations.upsells.forEach(upsell => {
                        prompt += `- ${upsell.suggestion}: ${upsell.benefit} (+${upsell.price})\n`;
                    });
                    prompt += "\n";
                }
                
                if (recommendations.crossSells.length > 0) {
                    prompt += "CROSS-SELLING CONTESTUALE:\n";
                    recommendations.crossSells.forEach(cross => {
                        prompt += `- ${cross.product}: ${cross.relevance} (${cross.price})\n`;
                    });
                    prompt += "\n";
                }
                
                if (recommendations.pricing && recommendations.pricing.offer) {
                    prompt += `OFFERTA DINAMICA: ${recommendations.pricing.offer}\n`;
                    prompt += `Sconto: ${recommendations.pricing.discount}\n`;
                    prompt += `Scadenza: ${recommendations.pricing.validity}\n\n`;
                }
            }

            if (recommendations.leadMagnet) {
                prompt += "\n=== LEAD MAGNET PERFETTO ===\n";
                prompt += `OFFERTA GRATUITA: ${recommendations.leadMagnet.title}\n`;
                prompt += `Descrizione: ${recommendations.leadMagnet.description}\n`;
                prompt += `Valore: ${recommendations.leadMagnet.value}\n`;
                prompt += `Call-to-Action: ${recommendations.leadMagnet.cta}\n\n`;
                prompt += "ISTRUZIONI LEAD MAGNET: Proponi questa risorsa gratuita in modo naturale, spiegando come può aiutarlo immediatamente. Chiedi la sua email per inviargli il download.\n\n";
            }

            if (!analysis.contactInfo.email && (recommendations.primary || recommendations.leadMagnet)) {
                prompt += "\n=== RACCOLTA CONTATTI ===\n";
                prompt += "Se l'utente mostra interesse, chiedi naturalmente la sua email per inviargli informazioni dettagliate o risorse gratuite.\n\n";
            }
            
            prompt += "ISTRUZIONI: Integra queste raccomandazioni in modo naturale nella conversazione. Non elencarle tutte insieme, ma inseriscile nel contesto appropriato. Sii consultivo, non venditore.";
            
            return prompt;
        }
    };

    // 💪 ENHANCED KNOWLEDGE BASE COMPLETA E CORRETTA
    const massiveKnowledgeBase = `
    === ANDREA PADOAN - MASTER KNOWLEDGE BASE CORRETTA ===
    
    🎯 CHI SONO - BACKGROUND COMPLETO:
    Mi chiamo Andrea Padoan, sono un Lifestyle Coach e Personal Trainer certificato di Verona.
    Dopo oltre 12 anni come manager nel marketing e vendite in aziende multinazionali, ho trasformato radicalmente la mia vita dedicandomi al benessere delle persone.
    Dal 2012 ho il mio studio di Personal Training a Verona.
    Nel 2015 ho partecipato a "Best in town" su Real Time, selezionato tra i migliori personal trainer di Verona.
    Ho scritto 4 eBook bestseller e collaboro con riviste specializzate.
    Negli ultimi 12 anni ho seguito oltre 500 clienti aiutandoli a trasformare il loro corpo e la loro vita.
    La mia missione: non sono solo un trainer, sono un facilitatore di trasformazioni complete.

    === 🏋️ TRIBÙ STUDIO - INFORMAZIONI COMPLETE ===

    DIFFERENZA FONDAMENTALE - NON SIAMO UNA PALESTRA!
    "Presso lo studio di Personal Training gli allenamenti sono solo su appuntamento e ci si allena con un Personal trainer.
    In base agli obiettivi che devi raggiungere verrà stesa una programmazione e ad ogni lezione il Personal Trainer ti guida passo-passo attraverso l'esecuzione corretta degli esercizi.
    Verrà creato un percorso in base al tuo livello di partenza e ti guideremo al miglioramento della tua salute e prestazione fisica."

    CARATTERISTICHE DELLO STUDIO:
    - La lezione dura 1 ora 
    - Consigliamo inizialmente 2 sessioni alla settimana
    - Lavoriamo dalle 6:00 alle 21:00 
    - Staff specializzato in diversi ambiti: posturale, tonificazione, dimagrimento, preparazione atletica
    - Non ci sono abbonamenti annuali come in palestra
    - Tutto su appuntamento personalizzato

    === 💰 LISTINO PREZZI CORRETTO E AGGIORNATO ===
    
    LEZIONI INDIVIDUALI (1:1):
    • Singola lezione: 60€
    • 10 lezioni → 55€/lezione (totale 550€)
    • 20 lezioni → 50€/lezione (totale 1000€) 
    • 30 lezioni → 45€/lezione (totale 1350€)
    
    LEZIONI DI COPPIA (2:1):
    • 10 lezioni → 35€/lezione a persona (totale 350€ per persona)
    • 20 lezioni → 30€/lezione a persona (totale 600€ per persona)
    • 30 lezioni → 25€/lezione a persona (totale 750€ per persona)
    
    MINICLASSI (3-5 persone):
    • 10 lezioni → 15€/lezione
    • Orari fissi: Lunedì, Martedì, Giovedì alle 17:30
    • Sabato alle 10:00
    • Gruppi di massimo 3-5 persone
    • Quota annuale tesseramento + assicurazione: 30€
    
    🥗 SERVIZI NUTRIZIONALI CORRETTI:
    • Collaboro con nutrizionista specializzato ESTERNO
    • Prima visita nutrizionale: 160€ (NON 80€!)
    • Include piano alimentare personalizzato completo
    • Riceve solo su appuntamento tramite WhatsApp
    
    🚀 BUSINESS & LIFESTYLE COACHING:
    • Coaching personalizzato per imprenditori
    • Mindset e strategie di crescita
    • Approccio olistico: fitness + business + mindset

    === 🔄 POLITICHE E REGOLE FERREE ===

    ❌ COSA NON FARE MAI:
    • NON fissare appuntamenti diretti in chat
    • NON offrire lezioni di prova gratuite specifiche
    • NON dare orari di disponibilità precisi
    • NON promettere servizi che non offro

    ✅ COMPORTAMENTO CORRETTO:
    • Fornire informazioni sui servizi e prezzi
    • Rimandare SEMPRE a WhatsApp per appuntamenti: 347 888 1515
    • Spiegare che gli orari li controlliamo su WhatsApp

    FLESSIBILITÀ ORARI:
    • È possibile cambiare giorni ed orari
    • Molte persone lavorano a turni o vanno in trasferta
    • Possiamo fissare le sessioni di settimana in settimana
    • Alternative: giorni ed orari fissi se c'è disponibilità
    • Io ho una mia agenda dove accolgo le richieste dei clienti

    PAGAMENTI:
    • Si può dilazionare il pagamento
    • I dettagli si decidono durante l'appuntamento in studio
    • Nessun pagamento anticipato obbligatorio

    DISDETTE:
    • La lezione può essere disdetta con preavviso di 12 ore
    • Senza preavviso viene segnata come se fosse fatta
    • Massima flessibilità per imprevisti

    === 🔗 CONTATTI E PRENOTAZIONI ===
    
    WhatsApp: 347 888 1515 (PREFERITO - risposta rapida)
    Email: andrea.padoan@gmail.com
    Sito Personal Training: https://www.personaltrainerverona.it
    Sito Tribù Studio: https://www.tribuptstudio.it

    === 🔥 FRASI CHIAVE DA USARE ===

    Per distinguerci dalle palestre:
    "Non siamo una palestra, siamo uno studio di Personal Training. Qui non ci sono abbonamenti ma percorsi personalizzati su appuntamento."

    Per il mindset:
    "Il vero cambiamento non avviene solo con l'allenamento, ma serve alimentazione corretta e mindset focalizzato!"

    Per la flessibilità:
    "Capiamo che la vita è imprevisibile, per questo offriamo massima flessibilità negli orari e nelle disdette."

    Per appuntamenti:
    "Per prenotazioni e per controllare i miei orari disponibili, scrivimi su WhatsApp: 347 888 1515. Così possiamo organizzare tutto!"

    Per nutrizione:
    "Per la nutrizione lavoro con un nutrizionista specializzato esterno. La prima visita costa 160€. Per prenotare scrivimi su WhatsApp: 347 888 1515"
    `;

    // Detect quiz state
    const quizState = detectQuizState(message, conversationHistory);
    
    let prompt = "";
    
    if (quizState.action === 'start_quiz') {
        prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach professionale di Verona. Rispondi sempre in modo amichevole ma professionale.

${massiveKnowledgeBase}

L'utente ha chiesto consigli sui servizi. Inizia il quiz con entusiasmo.

REGOLE FERREE:
❌ NON fissare mai appuntamenti diretti in chat
❌ NON offrire lezioni di prova gratuite specifiche
✅ Rimanda SEMPRE a WhatsApp per appuntamenti: 347 888 1515

STILE CONVERSAZIONALE:
- MASSIMO 2 frasi + la domanda quiz
- Spiega brevemente perché il quiz è utile
- Poi fai la prima domanda

"${quizQuestions[1].question}"

Opzioni:
${quizQuestions[1].options.map((opt, i) => `${opt}`).join('\n')}

Messaggio utente: "${message.trim()}"`;

    } else if (quizState.action === 'quiz_answer') {
        const currentStep = quizState.step;
        const nextStep = currentStep + 1;
        
        if (nextStep <= 5) {
            prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach professionale di Verona.

REGOLE FERREE:
❌ NON fissare mai appuntamenti diretti in chat
❌ NON offrire lezioni di prova gratuite specifiche
✅ Rimanda SEMPRE a WhatsApp per appuntamenti: 347 888 1515

L'utente ha risposto alla domanda ${currentStep}: "${quizState.answer}"

STILE CONVERSAZIONALE:
- Ringrazia brevemente (1 frase)
- Fai subito la prossima domanda

"${quizQuestions[nextStep].question}"

Opzioni:
${quizQuestions[nextStep].options.map((opt, i) => `${opt}`).join('\n')}

Messaggio utente: "${message.trim()}"`;

        } else {
            const answers = extractAnswersFromHistory(conversationHistory, message);
            const personalizedPlan = generatePersonalizedPlan(answers);
            
            prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach professionale di Verona.

${massiveKnowledgeBase}

REGOLE FERREE:
❌ NON fissare mai appuntamenti diretti in chat
❌ NON offrire lezioni di prova gratuite specifiche
✅ Rimanda SEMPRE a WhatsApp per appuntamenti: 347 888 1515

L'utente ha completato il quiz di assessment. Ecco il suo profilo:
${JSON.stringify(answers, null, 2)}

Genera una risposta personalizzata che include:
1. Ringraziamento per aver completato il quiz
2. Il piano personalizzato raccomandato: ${personalizedPlan.primary_service}
3. Punteggio di compatibilità: ${personalizedPlan.compatibility_score}/10
4. Spiegazione del perché questo servizio è perfetto per lui: ${personalizedPlan.reasoning}
5. Dettagli specifici del servizio raccomandato
6. Invito a contattarti su WhatsApp per approfondire: 347 888 1515

IMPORTANTE: Non fissare orari o appuntamenti specifici in chat!

Usa un tono entusiasta ma professionale. Sii specifico sui benefici e sui risultati che può aspettarsi.

Messaggio utente: "${message.trim()}"`;
        }
        
    } else {
        const messageAnalysis = advancedRecommendationEngine.analyzeMessage(message, conversationHistory);
        const contextualRecommendations = advancedRecommendationEngine.generateContextualRecommendations(messageAnalysis, message);
        const recommendationsPrompt = advancedRecommendationEngine.formatRecommendationsForPrompt(contextualRecommendations, messageAnalysis);
        
        console.log('🎯 Advanced Recommendations Generated:', {
            analysis: messageAnalysis,
            recommendations: contextualRecommendations
        });
        
        prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach professionale di Verona. Stai chattando con un potenziale cliente.

${massiveKnowledgeBase}

${recommendationsPrompt}

=== REGOLE FERREE (DA SEGUIRE SEMPRE) ===
❌ NON FARE MAI:
- NON fissare appuntamenti diretti in chat
- NON offrire lezioni di prova gratuite specifiche
- NON dare orari specifici di disponibilità
- NON promettere servizi che non offri

✅ COMPORTAMENTO CORRETTO:
- Fornisci solo informazioni sui servizi e prezzi CORRETTI
- Rimanda SEMPRE a WhatsApp per appuntamenti: 347 888 1515
- Sii professionale ma amichevole
- Prezzi CORRETTI: singola 60€, pacchetti 55€, 50€, 45€
- Nutrizione: 160€ con nutrizionista esterno

STILE CONVERSAZIONALE OBBLIGATORIO:
- MASSIMO 2-3 frasi per risposta
- Rispondi SOLO alla domanda specifica
- SEMPRE termina con 1 domanda per continuare il dialogo
- Tono amichevole e diretto, mai prolisso
- NO elenchi lunghi o spiegazioni infinite
- Una cosa alla volta, step by step
- Mantieni la curiosità dell'utente

FRASI CHIAVE DA USARE QUANDO APPROPRIATE:
- "Non siamo una palestra, siamo uno studio di Personal Training"
- "Il vero cambiamento serve allenamento + alimentazione + mindset"
- "Per prenotazioni e orari disponibili scrivimi su WhatsApp: 347 888 1515"
- "È possibile dilazionare i pagamenti"
- "Massima flessibilità negli orari e disdette con 12h di preavviso"
- "Per la nutrizione lavoro con un nutrizionista esterno. Prima visita 160€"

ESEMPI DI RISPOSTE CORRETTE:

❌ SBAGLIATO: "Ti aspetto sabato alle 14 per una lezione di prova gratuita"
✅ GIUSTO: "Per vedere i miei orari disponibili e organizzare tutto, scrivimi su WhatsApp: 347 888 1515"

❌ SBAGLIATO: "La consulenza nutrizionale costa 80€"
✅ GIUSTO: "Per la nutrizione lavoro con un nutrizionista specializzato. Prima visita 160€. Per prenotare scrivimi su WhatsApp"

REGOLE FERREE:
1. MASSIMO 3 frasi
2. SEMPRE 1 domanda finale
3. Una informazione per volta
4. Mantieni il dialogo attivo
5. SEMPRE rimandare a WhatsApp per appuntamenti

Messaggio utente: "${message.trim()}"

Rispondi come Andrea, breve e conversazionale, seguendo le REGOLE FERREE:`;
    }
    
    try {
        console.log('🔄 Calling Claude API with FIXED prompt...');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 150,
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
        console.log('✅ Claude API success with FIXED behavior');
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('❌ Invalid Claude API response format:', data);
            throw new Error('Invalid response format from Claude API');
        }
        
        const botResponse = data.content[0].text;
        console.log('💬 FIXED Response generated, length:', botResponse.length);
        
        // 📱 DIRECT TELEGRAM NOTIFICATION
        try {
            const leadScore = advancedLeadScore(message, botResponse);
            await sendTelegramNotification(message.trim(), leadScore, botResponse);
        } catch (telegramError) {
            console.error('❌ Telegram direct notification failed:', telegramError);
        }
        
        // Enhanced Airtable logging
        enhancedAirtableLogging(message.trim(), botResponse, quizState)
            .then(() => console.log('✅ Airtable logging completed'))
            .catch(err => console.error('❌ Airtable logging failed:', err));
        
        res.status(200).json({ 
            response: botResponse,
            quiz_state: quizState.action,
            quiz_step: quizState.step || null,
            status: 'success',
            version: 'fixed'
        });
        
    } catch (error) {
        console.error('❌ Handler Error:', error);
        res.status(500).json({ 
            error: 'Mi dispiace, ho avuto un problema tecnico. Contattami su WhatsApp al 347 888 1515!' 
        });
    }
}