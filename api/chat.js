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

    console.log('=== FASE 3: AUTOMATION + LEAD MAGNETS ===');
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

    // 🧠 QUIZ ASSESSMENT SYSTEM (keeping existing)
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

    // 🎁 LEAD MAGNETS SYSTEM
    const leadMagnets = {
        // eBook gratuiti
        freeEbooks: {
            "50 Workout da Viaggio": {
                title: "50 Workout da Viaggio - GRATUITO",
                description: "Allenamenti efficaci senza attrezzi ovunque",
                downloadUrl: "https://drive.google.com/file/d/your-ebook-id/view",
                trigger: ["viaggio", "casa", "tempo", "hotel", "lavoro"],
                value: "GRATUITO",
                followUpSequence: "traveler_sequence"
            },
            "Guida Principianti": {
                title: "Guida Completa per Principianti - GRATUITO", 
                description: "Tutto quello che devi sapere per iniziare",
                downloadUrl: "https://drive.google.com/file/d/your-beginner-guide/view",
                trigger: ["principiante", "nuovo", "iniziare", "prima volta"],
                value: "GRATUITO",
                followUpSequence: "beginner_sequence"
            },
            "10 Errori Fitness": {
                title: "10 Errori che Sabotano i Tuoi Risultati - GRATUITO",
                description: "Evita gli sbagli più comuni nel fitness",
                downloadUrl: "https://drive.google.com/file/d/your-errors-guide/view",
                trigger: ["errori", "fallito", "risultati", "sbagliato"],
                value: "GRATUITO", 
                followUpSequence: "mistakes_sequence"
            }
        },
        
        // Sessioni gratuite
        freeSessions: {
            "Consulenza Gratuita": {
                title: "Consulenza Strategica Gratuita (15 min)",
                description: "Analizziamo insieme i tuoi obiettivi",
                bookingUrl: "https://calendly.com/andrea-padoan/consulenza-gratuita",
                trigger: ["consulenza", "gratuita", "parlare", "conoscere"],
                value: "40€ di valore",
                followUpSequence: "consultation_sequence"
            },
            "Sessione Prova": {
                title: "Prima Sessione di Prova - 30€ invece di 40€",
                description: "Prova il mio metodo senza rischi",
                bookingUrl: "https://calendly.com/andrea-padoan/sessione-prova",
                trigger: ["prova", "provare", "test", "prima volta"],
                value: "Sconto 25%",
                followUpSequence: "trial_sequence"
            }
        },

        // Mini-corsi email
        miniCourses: {
            "7 Giorni Trasformazione": {
                title: "Mini-Corso: 7 Giorni per Iniziare la Trasformazione",
                description: "Email quotidiane con strategie pratiche",
                signupUrl: "internal_email_course",
                trigger: ["corso", "trasformazione", "imparare", "strategia"],
                value: "7 email esclusive",
                followUpSequence: "transformation_course"
            }
        }
    };

    // 📧 EMAIL AUTOMATION SEQUENCES
    const emailSequences = {
        beginner_sequence: [
            {
                day: 0,
                subject: "🎯 Benvenuto! Ecco la tua guida per principianti",
                content: "Ciao {name}! Grazie per aver scaricato la guida. Nei prossimi giorni ti manderò consigli esclusivi per iniziare nel modo giusto...",
                cta: "Prenota consulenza gratuita",
                cta_url: "https://calendly.com/andrea-padoan/consulenza-gratuita"
            },
            {
                day: 3,
                subject: "💪 I 3 errori più comuni dei principianti (da evitare)",
                content: "Ciao {name}! Dopo 12 anni di esperienza, questi sono gli errori che vedo più spesso...",
                cta: "Scopri il mio metodo",
                cta_url: "https://www.personaltrainerverona.it"
            },
            {
                day: 7,
                subject: "🔥 Sei pronto per il passo successivo?",
                content: "Ciao {name}! Come sta andando con la guida? Se vuoi accelerare i risultati...",
                cta: "Prenota sessione di prova (30€)",
                cta_url: "https://calendly.com/andrea-padoan/sessione-prova"
            }
        ],

        traveler_sequence: [
            {
                day: 0,
                subject: "✈️ I tuoi 50 workout da viaggio sono pronti!",
                content: "Ciao {name}! Non perdere mai un allenamento, anche in trasferta. Ecco come...",
                cta: "Scopri l'app Torno in Forma",
                cta_url: "https://app.tornoinforma.it"
            },
            {
                day: 5,
                subject: "🏨 Come allenarsi in hotel (video esclusivo)",
                content: "Ciao {name}! Ho preparato un video speciale per te...",
                cta: "Guarda il video",
                cta_url: "https://youtube.com/watch?v=your-video"
            }
        ],

        consultation_sequence: [
            {
                day: 0,
                subject: "📅 Conferma della tua consulenza gratuita",
                content: "Ciao {name}! La tua consulenza è confermata. Ecco cosa preparare...",
                cta: "Aggiungi al calendario",
                cta_url: "calendar_link"
            },
            {
                day: 1,
                subject: "🎯 Domani ci sentiamo! Ecco 3 domande da prepararti",
                content: "Ciao {name}! Per massimizzare il nostro tempo insieme...",
                cta: "Accedi alla consulenza",
                cta_url: "consultation_link"
            }
        ]
    };

    // 🤖 AUTOMATION ENGINE
    const automationEngine = {
        // Detecta se l'utente è interessato a lead magnets
        detectLeadMagnetInterest: (message, conversationStage) => {
            const lower = message.toLowerCase();
            let interestedMagnets = [];

            // Check eBook interests
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

            // Check free session interests
            Object.entries(leadMagnets.freeSessions).forEach(([key, session]) => {
                const isInterested = session.trigger.some(trigger => lower.includes(trigger));
                if (isInterested) {
                    interestedMagnets.push({
                        type: 'session',
                        magnet: session,
                        key: key
                    });
                }
            });

            // Check mini-course interests
            Object.entries(leadMagnets.miniCourses).forEach(([key, course]) => {
                const isInterested = course.trigger.some(trigger => lower.includes(trigger));
                if (isInterested) {
                    interestedMagnets.push({
                        type: 'course',
                        magnet: course,
                        key: key
                    });
                }
            });

            return interestedMagnets;
        },

        // Genera offerte di lead magnets
        generateLeadMagnetOffer: (interestedMagnets, userProfile) => {
            if (interestedMagnets.length === 0) return null;

            // Prendi il magnet più rilevante
            const topMagnet = interestedMagnets[0];
            
            return {
                type: topMagnet.type,
                title: topMagnet.magnet.title,
                description: topMagnet.magnet.description,
                value: topMagnet.magnet.value,
                cta: topMagnet.type === 'ebook' ? 'Scarica Gratis' : 
                     topMagnet.type === 'session' ? 'Prenota Ora' : 
                     'Iscriviti Gratis',
                url: topMagnet.magnet.downloadUrl || topMagnet.magnet.bookingUrl || topMagnet.magnet.signupUrl,
                followUpSequence: topMagnet.magnet.followUpSequence
            };
        },

        // Detecta se l'utente ha fornito email
        extractContactInfo: (message, history) => {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const phoneRegex = /(\+39\s?)?(\d{3})\s?(\d{3})\s?(\d{4})/;
            const nameRegex = /mi chiamo ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i;

            return {
                email: message.match(emailRegex)?.[0] || null,
                phone: message.match(phoneRegex)?.[0] || null,
                name: message.match(nameRegex)?.[1]?.trim() || null
            };
        },

        // Determina il follow-up appropriato
        determineFollowUpAction: (userProfile, conversationStage, leadScore) => {
            const actions = [];

            // High-intent users get immediate follow-up
            if (leadScore >= 8) {
                actions.push({
                    type: 'immediate_whatsapp',
                    message: `🔥 LEAD CALDO: ${userProfile.name || 'Anonimo'} - Score: ${leadScore}/10`,
                    delay: 0
                });
            }

            // Medium-intent users get email sequence
            if (leadScore >= 5 && userProfile.email) {
                actions.push({
                    type: 'email_sequence',
                    sequence: 'nurturing_sequence',
                    delay: 30 // minutes
                });
            }

            // Users who asked for lead magnets get specific follow-up
            if (userProfile.leadMagnetInterest) {
                actions.push({
                    type: 'email_sequence',
                    sequence: userProfile.leadMagnetInterest.followUpSequence,
                    delay: 10 // minutes
                });
            }

            return actions;
        },

        // Trigger automation in external systems
        triggerAutomation: async (automationActions, userProfile) => {
            const results = [];

            for (const action of automationActions) {
                try {
                    switch (action.type) {
                        case 'immediate_whatsapp':
                            // Webhook to Zapier/Make for WhatsApp notification
                            await triggerWhatsAppNotification(action.message, userProfile);
                            results.push({ type: 'whatsapp', status: 'sent' });
                            break;

                        case 'email_sequence':
                            // Webhook to email automation platform
                            await triggerEmailSequence(action.sequence, userProfile);
                            results.push({ type: 'email', status: 'scheduled' });
                            break;

                        case 'calendar_booking':
                            // Integrate with Calendly API
                            await triggerCalendarBooking(userProfile);
                            results.push({ type: 'calendar', status: 'invited' });
                            break;
                    }
                } catch (error) {
                    console.error(`Automation error for ${action.type}:`, error);
                    results.push({ type: action.type, status: 'failed', error: error.message });
                }
            }

            return results;
        }
    };

    // 🎯 ADVANCED AI RECOMMENDATION ENGINE (keeping existing + enhanced)
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
                previousRecommendations: extractPreviousRecommendations(history),
                // NEW: Lead magnet analysis
                leadMagnetInterest: automationEngine.detectLeadMagnetInterest(userMessage, determineConversationStage(history)),
                contactInfo: automationEngine.extractContactInfo(userMessage, history)
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

            // NEW: Lead magnet recommendations
            const leadMagnetOffer = automationEngine.generateLeadMagnetOffer(analysis.leadMagnetInterest, analysis);
            
            return {
                primary: primaryService,
                upsells: upsells,
                crossSells: crossSells,
                pricing: pricingOffers,
                leadMagnet: leadMagnetOffer, // NEW
                urgencyBoost: analysis.urgency === 'high',
                automationTriggers: analysis.contactInfo.email ? true : false // NEW
            };
        },

        formatRecommendationsForPrompt: (recommendations, analysis) => {
            let prompt = "";

            // Existing recommendations logic
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
                
                if (recommendations.pricing.offer) {
                    prompt += `OFFERTA DINAMICA: ${recommendations.pricing.offer}\n`;
                    prompt += `Sconto: ${recommendations.pricing.discount}\n`;
                    prompt += `Scadenza: ${recommendations.pricing.validity}\n\n`;
                }
            }

            // NEW: Lead magnet integration
            if (recommendations.leadMagnet) {
                prompt += "\n=== LEAD MAGNET PERFETTO ===\n";
                prompt += `OFFERTA GRATUITA: ${recommendations.leadMagnet.title}\n`;
                prompt += `Descrizione: ${recommendations.leadMagnet.description}\n`;
                prompt += `Valore: ${recommendations.leadMagnet.value}\n`;
                prompt += `Call-to-Action: ${recommendations.leadMagnet.cta}\n\n`;
                prompt += "ISTRUZIONI LEAD MAGNET: Proponi questa risorsa gratuita in modo naturale, spiegando come può aiutarlo immediatamente. Chiedi la sua email per inviargli il download.\n\n";
            }

            // Contact info request
            if (!analysis.contactInfo.email && (recommendations.primary || recommendations.leadMagnet)) {
                prompt += "\n=== RACCOLTA CONTATTI ===\n";
                prompt += "Se l'utente mostra interesse, chiedi naturalmente la sua email per inviargli informazioni dettagliate o risorse gratuite.\n\n";
            }
            
            prompt += "ISTRUZIONI: Integra queste raccomandazioni in modo naturale nella conversazione. Non elencarle tutte insieme, ma inseriscile nel contesto appropriato. Sii consultivo, non venditore.";
            
            return prompt;
        }
    };

    // Keep existing detection functions but add lead magnet logic
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

    function selectPrimaryService(analysis) {
        const { intent, goals, constraints, budgetSignals } = analysis;
        
        if (constraints.includes('time_limited')) {
            if (budgetSignals === 'budget_conscious') {
                return {
                    name: "App 'Torno in Forma'",
                    price: "140€/mese",
                    reasoning: "Perfetto per chi ha poco tempo - allenamenti efficaci ovunque e quando vuoi"
                };
            } else {
                return {
                    name: "Personal Training Intensivo 2x/settimana",
                    price: "400€/mese",
                    reasoning: "Efficienza massima - risultati certi in tempi record con supervisione diretta"
                };
            }
        }
        
        if (intent === 'weight_loss' || goals.includes('weight_loss')) {
            if (budgetSignals === 'budget_conscious') {
                return {
                    name: "Miniclassi + App Nutrizione",
                    price: "190€/mese",
                    reasoning: "Combinazione vincente per dimagrimento: gruppo motivante + piano alimentare"
                };
            } else {
                return {
                    name: "Personal Training + Consulenza Nutrizionale",
                    price: "480€/mese",
                    reasoning: "Approccio completo per dimagrimento duraturo - allenamento + alimentazione"
                };
            }
        }
        
        if (constraints.includes('beginner')) {
            return {
                name: "Miniclassi per Principianti",
                price: "120€/mese",
                reasoning: "Ideale per iniziare - ambiente sicuro, progressione graduale, supporto del gruppo"
            };
        }
        
        if (intent === 'athletic_performance') {
            return {
                name: "Personal Training Sportivo",
                price: "600€/mese (3x/settimana)",
                reasoning: "Preparazione atletica specifica - programmi avanzati per performance"
            };
        }
        
        return {
            name: "Personal Training Individuale",
            price: "400€/mese (2x/settimana)",
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
                    suggestion: "Consulenza Nutrizionale Personalizzata",
                    benefit: "Risultati 3x più veloci con piano alimentare su misura",
                    price: "80€/mese",
                    conversion_boost: "90% dei clienti che aggiungono nutrizione raggiungono l'obiettivo"
                });
            }
        }
        
        if (primaryService.name.includes('2x/settimana')) {
            upsells.push({
                suggestion: "Upgrade a 3 sessioni/settimana",
                benefit: "Trasformazione accelerata e risultati evidenti in metà tempo",
                price: "+200€/mese",
                conversion_boost: "I clienti 3x/settimana vedono risultati il 60% più velocemente"
            });
        }
        
        if (primaryService.name.includes('App')) {
            upsells.push({
                suggestion: "1 Sessione individuale mensile",
                benefit: "Correzioni personali e motivazione extra per massimizzare l'app",
                price: "+50€/mese",
                conversion_boost: "Chi combina app + sessioni ha 85% più aderenza"
            });
        }
        
        if (goals.includes('muscle_building') || intent === 'muscle_toning') {
            upsells.push({
                suggestion: "Analisi Composizione Corporea Mensile",
                benefit: "Monitoraggio scientifico progressi - massa grassa/muscolare",
                price: "Inclusa nei pacchetti 20+ lezioni",
                conversion_boost: "Vedere i dati motiva il 95% dei clienti"
            });
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
                price: "19.90€",
                benefit: "Scopri come mangiavano i nostri antenati per perdere peso facilmente"
            });
        }
        
        if (intent === 'muscle_toning' || goals.includes('muscle_building')) {
            crossSells.push({
                product: "eBook 'Body Under Construction Vol.1'",
                relevance: "La bibbia della trasformazione corporea",
                price: "29.90€",
                benefit: "Metodologie avanzate per costruire il fisico dei tuoi sogni"
            });
        }
        
        if (lower.includes('viaggio') || lower.includes('casa') || lower.includes('tempo')) {
            crossSells.push({
                product: "eBook '50 Workout da Viaggio'",
                relevance: "Allenamenti efficaci senza attrezzi ovunque",
                price: "GRATUITO",
                benefit: "Non perdere mai un allenamento, anche in trasferta"
            });
        }
        
        if (lower.includes('organizzare') || lower.includes('pasti') || intent === 'weight_loss') {
            crossSells.push({
                product: "MealPrep Planner (Web App)",
                relevance: "Organizza i pasti settimanali e lista spesa automatica",
                price: "Gratuito da provare",
                benefit: "Risparmia ore ogni settimana nella pianificazione alimentare"
            });
        }
        
        if (lower.includes('imprenditore') || lower.includes('business') || lower.includes('lavoro')) {
            crossSells.push({
                product: "Upstart - Business Coaching",
                relevance: "Mindset vincente per corpo E business",
                price: "Consulenza gratuita",
                benefit: "Applica la disciplina del fitness al tuo business"
            });
        }
        
        return crossSells;
    }

    function generateDynamicPricing(analysis, recommendations) {
        const { urgency, conversationStage, budgetSignals } = analysis;
        
        if (urgency === 'high') {
            return {
                offer: "Sconto Decisione Rapida",
                discount: "-15% su tutti i pacchetti",
                validity: "Valido solo per le prossime 48 ore",
                trigger: "Per chi è pronto a iniziare subito"
            };
        }
        
        if (budgetSignals === 'budget_conscious') {
            return {
                offer: "Pacchetto Starter Conveniente",
                discount: "Prima sessione di prova a 30€ invece di 40€",
                validity: "Valido per nuovi clienti",
                trigger: "Prova senza rischi"
            };
        }
        
        if (budgetSignals === 'quality_focused') {
            return {
                offer: "Bundle Premium Excellence",
                discount: "Personal Training + Nutrizione + Analisi = 520€ invece di 580€",
                validity: "Offerta limitata per clienti seri",
                trigger: "Trasformazione completa garantita"
            };
        }
        
        if (recommendations.upsells && recommendations.upsells.length >= 2) {
            return {
                offer: "Sconto Combinazione Servizi",
                discount: "-10% su pacchetti combinati",
                validity: "Per chi vuole il percorso completo",
                trigger: "Risultati 3x più veloci"
            };
        }
        
        return null;
    }

    function determineConversationStage(history) {
        if (history.length === 0) return 'initial';
        if (history.length < 3) return 'exploration';
        if (history.length < 6) return 'consideration';
        return 'decision';
    }

    function extractPreviousRecommendations(history) {
        const mentioned = [];
        history.forEach(exchange => {
            const bot = exchange.bot || "";
            if (bot.includes('Personal Training')) mentioned.push('personal_training');
            if (bot.includes('Miniclassi')) mentioned.push('miniclassi');
            if (bot.includes('App')) mentioned.push('app');
        });
        return mentioned;
    }

    // 🔍 QUIZ STATE DETECTION (keeping existing)
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

    === 📚 EBOOK E RISORSE DIGITALI ===
    
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
        const currentStep = quizState.step;
        const nextStep = currentStep + 1;
        
        if (nextStep <= 5) {
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
            const answers = extractAnswersFromHistory(conversationHistory, message);
            const personalizedPlan = generatePersonalizedPlan(answers);
            
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
        // 🚀 ADVANCED RECOMMENDATION ENGINE + AUTOMATION IN ACTION
        const messageAnalysis = advancedRecommendationEngine.analyzeMessage(message, conversationHistory);
        const contextualRecommendations = advancedRecommendationEngine.generateContextualRecommendations(messageAnalysis, message);
        const recommendationsPrompt = advancedRecommendationEngine.formatRecommendationsForPrompt(contextualRecommendations, messageAnalysis);
        
        console.log('🎯 Advanced Recommendations + Automation Generated:', {
            analysis: messageAnalysis,
            recommendations: contextualRecommendations,
            leadMagnet: contextualRecommendations.leadMagnet,
            contactInfo: messageAnalysis.contactInfo
        });
        
        prompt = `Sei Andrea Padoan, personal trainer e lifestyle coach di Verona.

${massiveKnowledgeBase}

${recommendationsPrompt}

ISTRUZIONI AVANZATE CON AUTOMATION:
- Analizza il messaggio dell'utente per capire le sue vere esigenze
- Se hai generato raccomandazioni sopra, integrale naturalmente nella conversazione
- Se c'è un lead magnet perfetto, proponilo in modo naturale
- Se l'utente mostra alto interesse, chiedi delicatamente i suoi contatti per follow-up personalizzato
- Non essere mai aggressivo nel vendere, ma consultivo e utile
- Usa le raccomandazioni per arricchire la risposta, non per dominare
- Se l'utente chiede consigli sui servizi, suggerisci il quiz di assessment
- Se l'utente sembra indeciso, proponi il quiz per aiutarlo a scegliere
- Sempre professionale, caloroso e motivante
- Usa esempi concreti e risultati reali
- Include sempre un call-to-action appropriato ma non invadente

Messaggio utente: "${message.trim()}"

Rispondi come Andrea Padoan, integrando intelligentemente raccomandazioni e lead magnets quando appropriato:`;
    }
    
    try {
        console.log('🔄 Calling Claude API with Automation + Lead Magnets...');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 800, // Increased for automation features
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
        console.log('✅ Claude API success with Automation');
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('❌ Invalid Claude API response format:', data);
            throw new Error('Invalid response format from Claude API');
        }
        
        const botResponse = data.content[0].text;
        console.log('💬 Automation-enhanced response generated, length:', botResponse.length);
        
        // 🤖 TRIGGER AUTOMATION ACTIONS
        const messageAnalysis = advancedRecommendationEngine.analyzeMessage(message, conversationHistory);
        const leadScore = advancedLeadScore(message, botResponse);
        
        // Create user profile for automation
        const userProfile = {
            name: messageAnalysis.contactInfo.name || userName,
            email: messageAnalysis.contactInfo.email || userEmail,
            phone: messageAnalysis.contactInfo.phone,
            leadScore: leadScore,
            intent: messageAnalysis.intent,
            goals: messageAnalysis.goals,
            constraints: messageAnalysis.constraints,
            budgetSignals: messageAnalysis.budgetSignals,
            leadMagnetInterest: messageAnalysis.leadMagnetInterest.length > 0 ? messageAnalysis.leadMagnetInterest[0] : null,
            conversationStage: messageAnalysis.conversationStage,
            lastMessage: message,
            timestamp: new Date().toISOString()
        };

        // Determine and trigger automation actions
        const automationActions = automationEngine.determineFollowUpAction(
            userProfile, 
            messageAnalysis.conversationStage, 
            leadScore
        );

        // Trigger automation (async, don't wait for completion)
        if (automationActions.length > 0) {
            console.log('🤖 Triggering automation actions:', automationActions);
            automationEngine.triggerAutomation(automationActions, userProfile)
                .then(results => console.log('✅ Automation triggered:', results))
                .catch(error => console.error('❌ Automation failed:', error));
        }
        
        // Enhanced Airtable logging with automation data
        enhancedAirtableLogging(message.trim(), botResponse, quizState, messageAnalysis, userProfile, automationActions)
            .then(() => console.log('✅ Enhanced Airtable logging completed'))
            .catch(err => console.error('❌ Airtable logging failed:', err));
        
        // Return successful response with automation info
        res.status(200).json({ 
            response: botResponse,
            quiz_state: quizState.action,
            quiz_step: quizState.step || null,
            recommendations_applied: quizState.action === 'normal_chat',
            lead_magnet_offered: messageAnalysis.leadMagnetInterest.length > 0,
            automation_triggered: automationActions.length > 0,
            lead_score: leadScore,
            user_profile: userProfile
        });
        
    } catch (error) {
        console.error('❌ Handler Error:', error);
        res.status(500).json({ 
            error: 'Mi dispiace, ho avuto un problema tecnico. Contattami su WhatsApp al 347 888 1515!' 
        });
    }
}

// Keep existing helper functions
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
        primaryService = "Miniclassi (15€/sessione)";
        reasoning = "Budget ottimizzato con massimo valore";
        compatibilityScore += 7;
    } else if (budget.includes("100-200")) {
        primaryService = "Percorso Misto (Miniclassi + Individuali)";
        reasoning = "Equilibrio perfetto tra attenzione personale e socializzazione";
        compatibilityScore += 8;
    } else if (budget.includes("200-400")) {
        primaryService = "Personal Training Individuale";
        reasoning = "Attenzione 100% dedicata per risultati ottimali";
        compatibilityScore += 9;
    } else {
        primaryService = "Percorso Premium Completo";
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

// 🤖 AUTOMATION TRIGGER FUNCTIONS
async function triggerWhatsAppNotification(message, userProfile) {
    // Webhook to Zapier/Make.com for WhatsApp notification to Andrea
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/your-webhook-id/';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'whatsapp_notification',
                message: message,
                user: userProfile,
                timestamp: new Date().toISOString()
            })
        });
        
        console.log('📱 WhatsApp notification sent:', response.status);
    } catch (error) {
        console.error('❌ WhatsApp notification failed:', error);
    }
}

async function triggerEmailSequence(sequenceName, userProfile) {
    // Webhook to email automation platform (Mailchimp, ConvertKit, etc.)
    const webhookUrl = process.env.EMAIL_AUTOMATION_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/your-email-webhook/';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'email_sequence',
                sequence: sequenceName,
                user: userProfile,
                timestamp: new Date().toISOString()
            })
        });
        
        console.log('📧 Email sequence triggered:', response.status);
    } catch (error) {
        console.error('❌ Email sequence failed:', error);
    }
}

async function triggerCalendarBooking(userProfile) {
    // Integration with Calendly API or similar
    const webhookUrl = process.env.CALENDAR_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/your-calendar-webhook/';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'calendar_booking',
                user: userProfile,
                timestamp: new Date().toISOString()
            })
        });
        
        console.log('📅 Calendar booking triggered:', response.status);
    } catch (error) {
        console.error('❌ Calendar booking failed:', error);
    }
}

// 📊 ENHANCED AIRTABLE LOGGING with Automation Data
async function enhancedAirtableLogging(userMessage, botResponse, quizState, messageAnalysis = null, userProfile = null, automationActions = []) {
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
        AI_Intent: messageAnalysis?.intent || null,
        AI_Goals: messageAnalysis?.goals?.join(',') || null,
        AI_Constraints: messageAnalysis?.constraints?.join(',') || null,
        Budget_Signal: messageAnalysis?.budgetSignals || null,
        // NEW: Automation fields
        User_Name: userProfile?.name || null,
        User_Email: userProfile?.email || null,
        User_Phone: userProfile?.phone || null,
        Lead_Magnet_Interest: messageAnalysis?.leadMagnetInterest?.length > 0 ? 'Yes' : 'No',
        Lead_Magnet_Type: messageAnalysis?.leadMagnetInterest?.[0]?.type || null,
        Automation_Triggered: automationActions.length > 0 ? 'Yes' : 'No',
        Automation_Actions: automationActions.map(a => a.type).join(',') || null,
        Message_Length: userMessage.length,
        Response_Length: botResponse.length,
        User_Agent: 'Vercel-API-Automation-Phase3'
    };
    
    try {
        console.log('📊 Enhanced logging with Automation data to Airtable...', {
            leadScore,
            interestArea,
            userProfile: userProfile?.name || 'Anonymous',
            automationTriggered: automationActions.length > 0
        });
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ Advanced automation conversation logged to Airtable successfully');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to log to Airtable:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Airtable logging error:', error);
    }
}

// Keep existing utility functions
function advancedLeadScore(message, botResponse) {
    let score = 3;
    const lower = message.toLowerCase();
    
    if (lower.includes('quiz') || lower.includes('assessment') || lower.includes('domande')) {
        score += 3;
    }
    
    if (lower.includes('voglio iniziare') || lower.includes('come si fa')) score += 4;
    if (lower.includes('quanto costa') || lower.includes('prezzi')) score += 4;
    if (lower.includes('prenotare') || lower.includes('appuntamento')) score += 5;
    if (lower.includes('urgente') || lower.includes('subito')) score += 4;
    
    if (lower.includes('investimento') || lower.includes('budget')) score += 3;
    if (lower.includes('pacchetto') || lower.includes('abbonamento')) score += 3;
    
    if (lower.includes('dimagrire') || lower.includes('perdere peso')) score += 3;
    if (lower.includes('tonificare') || lower.includes('muscoli')) score += 3;
    if (lower.includes('risultati') || lower.includes('obiettivi')) score += 2;
    
    if (lower.includes('non riesco') || lower.includes('fallito')) score += 3;
    if (lower.includes('frustrato') || lower.includes('demotivato')) score += 2;
    
    if (lower.includes('numero') || lower.includes('telefono')) score += 4;
    if (lower.includes('whatsapp')) score += 3;
    
    // NEW: Email provided bonus
    if (lower.includes('@') && lower.includes('.')) score += 5;
    
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
        lead_magnet: 0 // NEW
    };
    
    if (lower.includes('quiz') || lower.includes('assessment') || lower.includes('domande') || 
        lower.includes('consigli') || lower.includes('quale servizio')) {
        scores.assessment += 3;
    }
    
    // NEW: Lead magnet interest detection
    if (lower.includes('gratuito') || lower.includes('gratis') || lower.includes('download') || 
        lower.includes('ebook') || lower.includes('guida')) {
        scores.lead_magnet += 3;
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
    if (lower.includes('costo') || lower.includes('prezzo')) {
        return 'price_inquiry';
    }
    if (lower.includes('prenotare') || lower.includes('appuntamento')) {
        return 'booking_intent';
    }
    if (lower.includes('email') || lower.includes('@')) {
        return 'contact_sharing';
    }
    if (lower.includes('gratuito') || lower.includes('download')) {
        return 'lead_magnet_interest';
    }
    
    return 'exploration';
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

function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
}