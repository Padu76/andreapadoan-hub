// ======================================
// ANDREA PADOAN HYBRID CHAT SYSTEM
// Sistema ibrido: AI locale + Claude API + Logging completo
// ======================================

// 🌟 GLOBAL VARIABLES
let conversationHistory = [];
let isTyping = false;
let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
let userInfo = {
    name: null,
    phone: null,
    email: null,
    collected: false
};

// 🎯 SERVIZI DATABASE REALE - INFORMAZIONI CORRETTE
const SERVIZI_DATABASE = {
    'personal-training': {
        nome: 'Personal Training a Verona',
        descrizione: 'Allenamenti personalizzati nel mio Tribù Studio privato o online',
        punti_chiave: [
            'Studio privato Tribù Studio a Verona (via Albere 27/B)',
            'Allenamenti su misura per i tuoi obiettivi specifici',
            'Oltre 15 anni di esperienza nel settore fitness',
            'Approccio scientifico ma umano, niente tempo perso',
            'Opzione online per chi non può venire in studio'
        ],
        come_funziona: 'Dopo 12 anni da manager stressato ho vissuto la trasformazione sulla mia pelle. Ora aiuto persone come te a ritrovare forma fisica e benessere senza perdere tempo.',
        location: 'Tribù Studio - Via Albere 27/B, Verona (zona stadio)',
        contatti: {
            whatsapp: '347 888 1515',
            email: 'andrea.padoan@gmail.com'
        },
        prezzi: {
            individuali: {
                '10_lezioni': '55€/lezione (totale 550€)',
                '20_lezioni': '50€/lezione (totale 1000€)', 
                '30_lezioni': '45€/lezione (totale 1350€)'
            },
            coppia: {
                '10_lezioni': '35€/lezione per persona (totale 350€ cad.)',
                '20_lezioni': '30€/lezione per persona (totale 600€ cad.)',
                '30_lezioni': '25€/lezione per persona (totale 750€ cad.)'
            },
            miniclassi: '15€/lezione (pacchetto 10 lezioni)',
            tesseramento: '30€ annuali (assicurazione inclusa)',
            orari_miniclassi: 'Lun/Mar/Gio 18:00, Sabato 10:00'
        },
        url: 'https://www.personaltrainerverona.it',
        emoji: '💪'
    },
    'tribu-studio': {
        nome: 'Tribù Studio',
        descrizione: 'Il mio studio privato a Verona per allenamenti esclusivi',
        punti_chiave: [
            'Studio privato completamente attrezzato',
            'Ambiente curato senza code o attese',
            'Attrezzature professionali sempre disponibili',
            'Spazio dedicato solo a te durante la sessione',
            'Parcheggio disponibile in zona stadio'
        ],
        come_funziona: 'Non è la solita palestra affollata! Nel mio Tribù Studio sei solo tu, io e l\'obiettivo di trasformare il tuo corpo e la tua mente.',
        location: 'Via Albere 27/B, Verona (zona stadio)',
        url: 'https://www.tribuptstudio.it',
        emoji: '🏠'
    },
    'lifestyle-coaching': {
        nome: 'Lifestyle Coaching Online',
        descrizione: 'Percorso online personalizzato per trasformazione completa',
        punti_chiave: [
            'Sessioni online personalizzate',
            'Prima sessione gratuita per conoscerci',
            'Approccio olistico: mindset + azione',
            'Supporto continuo tra le sessioni',
            'Programmi su misura per i tuoi obiettivi'
        ],
        come_funziona: 'Percorso di coaching online che ti accompagna step by step verso il cambiamento che desideri. Lavoriamo insieme su obiettivi concreti.',
        target: 'Persone che vogliono un cambiamento profondo e duraturo',
        prezzi: {
            sessione: '50€/sessione',
            prima_sessione: 'GRATUITA per conoscerci'
        },
        url: 'https://tribucoach.vercel.app/',
        emoji: '🚀'
    },
    'mealprep-planner': {
        nome: 'MealPrep Planner',
        descrizione: 'App web per pianificare i pasti (in sviluppo versione freemium)',
        punti_chiave: [
            'Pianificazione automatica pasti settimanali',
            'Lista spesa generata automaticamente', 
            'Calcolo calorie e macronutrienti personalizzato',
            'Interfaccia semplice e intuitiva',
            'Versione freemium in sviluppo'
        ],
        come_funziona: 'Inserisci i tuoi dati, scegli le preferenze alimentari e l\'app genera automaticamente un piano settimanale completo con lista della spesa.',
        tecnologia: 'Next.js, TypeScript, Tailwind CSS, integrazione AI',
        stato: 'In progress - versione freemium in sviluppo',
        prezzo: 'Freemium (in sviluppo)',
        url: 'https://mealprep-planner.vercel.app/',
        emoji: '📱'
    },
    'pasto-sano': {
        nome: 'Pasto Sano - Pasti Freschi Verona',
        descrizione: 'Pasti freschi e bilanciati pronti in 2 minuti',
        punti_chiave: [
            'Pasti freschi preparati con ingredienti selezionati',
            'Pronti in 2 minuti al microonde',
            'Bilanciati nutrizionalmente',
            'Ritiro presso Tribù Studio - Via Albere 27/B',
            'Ideali per chi non ha tempo di cucinare'
        ],
        come_funziona: 'Ordini online, prepariamo fresco, ritiri presso il mio studio. Porta una borsa termica per il trasporto!',
        location: 'Ritiro: Tribù Studio - Via Albere 27/B, Verona',
        preparazione: '2 minuti in microonde',
        prezzi: 'Da 4.50€/pasto',
        url: 'https://pastosano.netlify.app/',
        emoji: '🥗'
    },
    'best-trainer': {
        nome: 'Best-Trainer',
        descrizione: 'Piattaforma di programmi di allenamento (sito in progress)',
        punti_chiave: [
            'Directory di Personal Trainer certificati',
            'Tutorial esercizi con video',
            'Vari programmi di allenamento',
            'Sito e prezzi in fase di sviluppo',
            'Piattaforma in continua evoluzione'
        ],
        stato_attuale: 'Sito in progress con prezzi vari in definizione',
        url: 'https://best-trainer-mvp.vercel.app/',
        emoji: '🏆'
    },
    'business-coaching': {
        nome: 'UpStarter - Validazione Idee Startup',
        descrizione: 'Piattaforma per validare e sviluppare idee di business con intelligenza artificiale',
        punti_chiave: [
            'Analisi AI delle idee di business con Claude',
            'Report dettagliato con SWOT analysis e score',
            'Sistema matching startup-investitori (in sviluppo)',
            'Dashboard per tracciare progressi e milestone',
            'Framework consolidati per validazione idee'
        ],
        come_funziona: 'Questionario guidato → Analisi AI con Claude → Report personalizzato → Piano di miglioramento → Sistema team building',
        tecnologia: 'Next.js 14, TypeScript, Airtable, Claude AI, Vercel',
        fasi: 'Fase 1 (MVP) completata, Fase 2 (TeamUp) in sviluppo',
        target: 'Aspiranti imprenditori, startup early-stage, chi vuole validare idee business',
        url: 'https://upstarter-tf9x.vercel.app/',
        emoji: '💼'
    },
    'ebooks': {
        nome: 'I miei eBook',
        descrizione: 'Guide digitali per trasformazione fisica e mentale',
        punti_chiave: [
            'Guide pratiche basate su esperienza reale',
            'Metodi testati su clienti',
            'Strategie di motivazione e mindset',
            'Download immediato dopo acquisto',
            'Prezzi accessibili'
        ],
        come_funziona: 'Guide pratiche basate sulla mia esperienza di trasformazione personale e professionale.',
        prezzi: 'Da 14.90€ per eBook',
        url: './ebooks.html',
        emoji: '📚'
    }
};

// ======================================
// 🧠 HYBRID AI SYSTEM - INTELLIGENZA UNIFICATA
// ======================================

// 🎯 INTELLIGENT ROUTING SYSTEM
const intelligentRouter = {
    shouldUseClaudeAPI: (message, history) => {
        const lower = message.toLowerCase();
        let complexity = 0;
        
        // TRIGGERS PER CLAUDE API (conversazioni complesse)
        const claudeTriggers = [
            // Quiz e assessment
            'quiz', 'test', 'consigli', 'quale servizio', 'assessment',
            // Richieste complesse
            'piano personalizzato', 'strategia', 'analisi', 'valutazione',
            // Lead qualificati
            'voglio iniziare', 'sono interessato', 'prenotare', 'appuntamento',
            // Situazioni personali complesse
            'non riesco', 'ho provato', 'fallito', 'non funziona', 'aiuto',
            // Richieste emotive/motivazionali
            'demotivato', 'scoraggiato', 'stanco', 'stress', 'cambiare vita'
        ];
        
        // STORIA CONVERSAZIONE COMPLESSA
        if (history.length >= 3) complexity += 2;
        if (history.length >= 6) complexity += 3;
        
        // CHECK TRIGGERS
        const hasComplexTrigger = claudeTriggers.some(trigger => lower.includes(trigger));
        if (hasComplexTrigger) complexity += 4;
        
        // LUNGHEZZA MESSAGGIO
        if (message.length > 100) complexity += 2;
        if (message.length > 200) complexity += 3;
        
        // INFORMAZIONI PERSONALI
        if (lower.includes('@') || lower.includes('347') || lower.includes('whatsapp')) {
            complexity += 5; // Lead qualificato!
        }
        
        // SOGLIA DECISIONALE
        return complexity >= 5;
    },
    
    // Analisi lead scoring per decisioni intelligenti
    calculateLeadScore: (message, history) => {
        let score = 0;
        const lower = message.toLowerCase();
        
        // Intento di acquisto
        if (lower.includes('quanto costa') || lower.includes('prezzi')) score += 3;
        if (lower.includes('prenotare') || lower.includes('appuntamento')) score += 5;
        if (lower.includes('voglio iniziare') || lower.includes('sono interessato')) score += 4;
        
        // Urgenza
        if (lower.includes('subito') || lower.includes('urgente')) score += 3;
        if (lower.includes('oggi') || lower.includes('questa settimana')) score += 2;
        
        // Contatti
        if (lower.includes('@')) score += 4;
        if (lower.includes('telefono') || lower.includes('347')) score += 3;
        
        // Coinvolgimento
        if (history.length >= 3) score += 2;
        if (history.length >= 6) score += 3;
        
        return Math.min(score, 10);
    }
};

// 🤖 LOCAL AI SYSTEM - RISPOSTE VELOCI
const localAI = {
    getQuickResponse: async (userMessage) => {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700)); // Simula thinking
        
        const message = userMessage.toLowerCase();
        
        // PASTO SANO - INFORMAZIONI CORRETTE
        if (message.includes('pasto sano') || message.includes('pasti freschi') || message.includes('pasti pronti')) {
            const servizio = SERVIZI_DATABASE['pasto-sano'];
            return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
            ${servizio.descrizione}<br><br>
            
            <strong>Come funziona:</strong><br>
            • ${servizio.punti_chiave.map(punto => punto).join('<br>• ')}<br><br>
            
            <strong>📍 Ritiro:</strong> ${servizio.location}<br>
            <strong>💰 Prezzo:</strong> ${servizio.prezzi}<br>
            <strong>⏱️ Preparazione:</strong> ${servizio.preparazione}<br><br>
            
            ${servizio.come_funziona}<br><br>
            
            Vuoi vedere il menu disponibile? 🚚`;
        }
        
        // PERSONAL TRAINING - INFORMAZIONI REALI E DETTAGLIATE
        if (message.includes('personal training') || message.includes('allenamento') || message.includes('tribù studio') || message.includes('palestra')) {
            const servizio = SERVIZI_DATABASE['personal-training'];
            return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
            ${servizio.come_funziona}<br><br>
            
            <strong>🏠 Come funziona presso Tribù Studio:</strong><br>
            • Allenamenti solo su appuntamento con Personal Trainer<br>
            • Programmazione personalizzata per i tuoi obiettivi<br>
            • Durata: 1 ora per sessione<br>
            • Consigliamo inizialmente 2 sessioni/settimana<br>
            • Orari: dalle 6:00 alle 21:00<br>
            • Staff specializzato (posturale, tonificazione, dimagrimento, preparazione atletica)<br><br>
            
            <strong>💰 LISTINO PREZZI DETTAGLIATO:</strong><br><br>
            
            <strong>🔸 LEZIONI INDIVIDUALI:</strong><br>
            • ${servizio.prezzi.individuali['10_lezioni']}<br>
            • ${servizio.prezzi.individuali['20_lezioni']}<br>
            • ${servizio.prezzi.individuali['30_lezioni']}<br><br>
            
            <strong>🔸 LEZIONI DI COPPIA:</strong><br>
            • ${servizio.prezzi.coppia['10_lezioni']}<br>
            • ${servizio.prezzi.coppia['20_lezioni']}<br>
            • ${servizio.prezzi.coppia['30_lezioni']}<br><br>
            
            <strong>🔸 MINICLASSI (3-5 persone):</strong><br>
            • ${servizio.prezzi.miniclassi}<br>
            • ${servizio.prezzi.orari_miniclassi}<br><br>
            
            <strong>📋 Extra:</strong> ${servizio.prezzi.tesseramento}<br><br>
            
            Su quale modalità vorresti più informazioni? 🎯`;
        }
        
        // MEALPREP PLANNER - STATO CORRETTO
        if (message.includes('mealprep') || message.includes('meal prep') || message.includes('organizzare pasti')) {
            const servizio = SERVIZI_DATABASE['mealprep-planner'];
            return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
            ${servizio.descrizione}<br><br>
            
            <strong>✨ Caratteristiche:</strong><br>
            • ${servizio.punti_chiave.slice(0, 3).map(punto => punto).join('<br>• ')}<br><br>
            
            <strong>📊 Stato:</strong> ${servizio.stato}<br>
            <strong>💰 Prezzo:</strong> ${servizio.prezzo}<br><br>
            
            <strong>🌐 Anteprima:</strong> <a href="${servizio.url}" target="_blank">${servizio.url}</a><br><br>
            
            Ti terremo aggiornato sui progressi! 📱`;
        }
        
        // BEST-TRAINER - STATO CORRETTO
        if (message.includes('best-trainer') || message.includes('best trainer') || message.includes('programmi allenamento')) {
            const servizio = SERVIZI_DATABASE['best-trainer'];
            return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
            ${servizio.descrizione}<br><br>
            
            <strong>📊 Stato attuale:</strong> ${servizio.stato_attuale}<br><br>
            
            <strong>✨ Cosa offre:</strong><br>
            • ${servizio.punti_chiave.map(punto => punto).join('<br>• ')}<br><br>
            
            <strong>🌐 Esplora:</strong> <a href="${servizio.url}" target="_blank">${servizio.url}</a><br><br>
            
            Ti interessano i contenuti disponibili? 🏆`;
        }
        
        // CONTATTI
        if (message.includes('contatt') || message.includes('telefono') || message.includes('whatsapp')) {
            return `📞 <strong>Contattami facilmente:</strong><br><br>
            
            <strong>📱 WhatsApp:</strong> ${SERVIZI_DATABASE['personal-training'].contatti.whatsapp}<br>
            <em>(Rispondo sempre entro 1 ora!)</em><br><br>
            
            <strong>📧 Email:</strong> ${SERVIZI_DATABASE['personal-training'].contatti.email}<br><br>
            
            <strong>📍 Studio:</strong> ${SERVIZI_DATABASE['tribu-studio'].location}<br>
            <em>(Solo su appuntamento)</em><br><br>
            
            Il modo più veloce è WhatsApp! Scrivimi quando vuoi. 💪`;
        }
        
        // PREZZI GENERALI - INFORMAZIONI CORRETTE
        if (message.includes('prezzi') || message.includes('costi') || message.includes('quanto costa')) {
            return `💰 <strong>Ecco tutti i miei servizi e prezzi:</strong><br><br>
            
            🏠 <strong>Tribù Studio - Personal Training:</strong><br>
            • Lezioni Individuali: da 45€ a 55€/lezione<br>
            • Lezioni di Coppia: da 25€ a 35€/persona<br>
            • Miniclassi: 15€/lezione (pacchetto 10)<br>
            • Tesseramento annuale: 30€<br><br>
            
            💻 <strong>Personal Training Online:</strong> Da 70€/mese<br>
            🚀 <strong>Lifestyle Coaching:</strong> 50€/sessione (prima GRATUITA)<br>
            🥗 <strong>Pasto Sano:</strong> Da 4.50€/pasto<br>
            🏆 <strong>Best-Trainer:</strong> Prezzi vari (sito in progress)<br>
            📱 <strong>MealPrep Planner:</strong> Freemium (in sviluppo)<br>
            📚 <strong>eBook:</strong> Da 14.90€<br><br>
            
            Su quale servizio vuoi dettagli specifici? 🎯`;
        }
        
        // RISPOSTA DEFAULT
        return `Ciao! Sono Andrea Padoan 😊<br><br>
        
        <strong>I miei servizi principali:</strong><br><br>
        
        💪 <strong>Personal Training</strong> - Nel mio Tribù Studio a Verona<br>
        🚀 <strong>Lifestyle Coaching</strong> - Percorso digitale 7 settimane<br>
        🥗 <strong>Pasto Sano</strong> - Pasti freschi pronti<br>
        📱 <strong>MealPrep Planner</strong> - App gratuita<br>
        🏆 <strong>Best-Trainer</strong> - Directory PT + tutorial<br>
        💼 <strong>UpStarter</strong> - Validazione idee business<br><br>
        
        <strong>Su cosa ti posso aiutare?</strong><br>
        Dimmi: <em>"Spiegami [servizio]"</em> o <em>"Fammi il quiz"</em> per scegliere! 🎯`;
    }
};

// 🌩️ CLAUDE API SYSTEM - CONVERSAZIONI COMPLESSE
const claudeAPI = {
    async getAdvancedResponse(userMessage, history) {
        try {
            console.log('🧠 Usando Claude API per conversazione complessa...');
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: history,
                    userEmail: userInfo.email,
                    userName: userInfo.name,
                    sessionId: sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Claude API response received');
            
            return data.response;
            
        } catch (error) {
            console.error('❌ Claude API failed:', error);
            // Fallback a local AI
            return await localAI.getQuickResponse(userMessage);
        }
    }
};

// ======================================
// 🚀 UNIFIED CHAT FUNCTIONS
// ======================================

// MAIN SEND MESSAGE - HYBRID INTELLIGENCE
async function sendMessage() {
    if (isTyping) {
        console.log('⚠️ Andrea sta già scrivendo, attendi...');
        return;
    }
    
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Aggiungi messaggio utente
    addMessage(message, true);
    input.value = '';
    
    // Mostra typing
    showTyping();
    
    try {
        // 🧠 INTELLIGENT ROUTING DECISION
        const shouldUseAPI = intelligentRouter.shouldUseClaudeAPI(message, conversationHistory);
        const leadScore = intelligentRouter.calculateLeadScore(message, conversationHistory);
        
        console.log('🎯 Routing Decision:', {
            useAPI: shouldUseAPI,
            leadScore: leadScore,
            historyLength: conversationHistory.length
        });
        
        let response;
        
        if (shouldUseAPI || leadScore >= 6) {
            // Usa Claude API per conversazioni complesse e lead qualificati
            response = await claudeAPI.getAdvancedResponse(message, conversationHistory);
            console.log('🌩️ Response from Claude API');
        } else {
            // Usa AI locale per risposte veloci
            response = await localAI.getQuickResponse(message);
            console.log('⚡ Response from Local AI');
        }
        
        // Nascondi typing e mostra risposta
        hideTyping();
        addMessage(response);
        
        // Animazioni avatar
        animateAvatarSpeaking();
        
        // Estrai info utente se presenti
        extractUserInfo(message);
        
        console.log('✅ Message sent successfully');
        
    } catch (error) {
        hideTyping();
        
        const errorMessage = 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco o contattami direttamente su WhatsApp al 347 888 1515! 🔧';
        addMessage(errorMessage);
        
        console.error('❌ Send message failed:', error);
    }
}

// Estrai informazioni utente dai messaggi
function extractUserInfo(message) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+39\s?)?(\d{3})\s?(\d{3})\s?(\d{4})/;
    const nameRegex = /mi chiamo ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i;
    
    const email = message.match(emailRegex)?.[0];
    const phone = message.match(phoneRegex)?.[0];
    const name = message.match(nameRegex)?.[1]?.trim();
    
    if (email && !userInfo.email) {
        userInfo.email = email;
        console.log('📧 Email captured:', email);
    }
    if (phone && !userInfo.phone) {
        userInfo.phone = phone;
        console.log('📱 Phone captured:', phone);
    }
    if (name && !userInfo.name) {
        userInfo.name = name;
        console.log('👤 Name captured:', name);
    }
    
    if ((email || phone || name) && !userInfo.collected) {
        userInfo.collected = true;
        console.log('🎯 Lead info collected!', userInfo);
    }
}

// ======================================
// 💬 CHAT UI FUNCTIONS (mantenute dal main.js)
// ======================================

// Scroll automatico al bottom della chat
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Aggiungere messaggio alla chat
function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'andrea'}`;
    
    // Avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `message-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`;
    if (isUser) {
        avatarDiv.textContent = 'TU';
    }
    
    // Contenuto messaggio
    const contentDiv = document.createElement('div');
    contentDiv.className = `message-content ${isUser ? 'user-message' : 'bot-message'}`;
    
    // Timestamp
    const timestamp = new Date().toLocaleTimeString('it-IT', {
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    contentDiv.innerHTML = `${content}<div class="message-time">${timestamp}</div>`;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll e salva in history
    scrollToBottom();
    
    // Aggiorna conversation history
    const historyEntry = {
        timestamp: new Date().toISOString(),
        user: isUser ? content : null,
        bot: isUser ? null : content
    };
    
    conversationHistory.push(historyEntry);
    
    console.log('💬 Message added:', isUser ? 'User' : 'Andrea', content.substring(0, 50) + '...');
}

// Mostra indicatore di digitazione
function showTyping() {
    if (isTyping) return;
    isTyping = true;
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message andrea';
    typingDiv.id = 'typingIndicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar bot-avatar';
    
    const typingBubble = document.createElement('div');
    typingBubble.className = 'typing-indicator';
    typingBubble.style.display = 'flex';
    typingBubble.innerHTML = `
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
        <div class="typing-text">Andrea sta scrivendo...</div>
    `;
    
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(typingBubble);
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    
    // Aggiorna header avatar
    const headerAvatar = document.getElementById('chatHeaderAvatar');
    if (headerAvatar) {
        headerAvatar.classList.add('thinking');
    }
    
    // Aggiorna status header
    const statusEl = document.getElementById('chatHeaderStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="status-dot-header"></span>Andrea sta scrivendo...';
    }
    
    console.log('💭 Typing indicator shown');
}

// Nascondi indicatore di digitazione
function hideTyping() {
    if (!isTyping) return;
    isTyping = false;
    
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    // Rimuovi animazioni avatar
    const headerAvatar = document.getElementById('chatHeaderAvatar');
    if (headerAvatar) {
        headerAvatar.classList.remove('thinking');
    }
    
    // Ripristina status
    const statusEl = document.getElementById('chatHeaderStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="status-dot-header"></span>Online e pronto ad aiutarti';
    }
    
    console.log('✅ Typing indicator hidden');
}

// Animazioni avatar quando parla
function animateAvatarSpeaking() {
    // Avatar hero
    const heroAvatar = document.getElementById('heroAvatar');
    if (heroAvatar) {
        heroAvatar.classList.add('speaking');
        setTimeout(() => heroAvatar.classList.remove('speaking'), 2000);
    }
    
    // Avatar header chat
    const headerAvatar = document.getElementById('chatHeaderAvatar');
    if (headerAvatar) {
        headerAvatar.classList.add('speaking');
        setTimeout(() => headerAvatar.classList.remove('speaking'), 2000);
    }
}

// ======================================
// 🚀 ESSENTIAL FUNCTIONS (mantenute dal main.js)
// ======================================

// Funzione per aprire progetti
function openProject(url) {
    if (url && url !== '#' && url !== '') {
        setTimeout(() => {
            window.open(url, '_blank');
        }, 100);
    } else {
        showNotification('Progetto in arrivo! Torna presto per scoprire di più.', 'info');
    }
}

// Funzione per aprire la chat AI
function openChat(contexto = null) {
    console.log('💬 Apertura chat con contesto:', contexto);
    
    const chatOverlay = document.getElementById('chatFullscreen');
    if (chatOverlay) {
        chatOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus sull'input dopo un breve delay
        setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) input.focus();
        }, 100);
        
        // Se c'è un contesto specifico, invia messaggio introduttivo
        if (contexto) {
            setTimeout(() => {
                sendServiceContextMessage(contexto);
            }, 500);
        }
        
        // Animazione avatar hero
        const heroAvatar = document.getElementById('heroAvatar');
        if (heroAvatar) {
            heroAvatar.classList.add('speaking');
            setTimeout(() => heroAvatar.classList.remove('speaking'), 2000);
        }
        
        console.log('✅ Chat aperta con successo');
    }
}

// Funzione per chiudere la chat
function closeChat() {
    const chatOverlay = document.getElementById('chatFullscreen');
    if (chatOverlay) {
        chatOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('✅ Chat closed');
    }
}

// Quick message - MIGLIORATA
function sendQuickMessage(message, servizio = null) {
    console.log('⚡ Quick message:', message, 'Servizio:', servizio);
    
    // Prima apri la chat
    openChat();
    
    // Poi invia il messaggio dopo un delay
    setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = message;
            sendMessage();
        }
    }, 800);
}

// Invia messaggio di contesto per servizio specifico
function sendServiceContextMessage(servizio) {
    const servizioInfo = SERVIZI_DATABASE[servizio];
    if (!servizioInfo) return;
    
    const contestoMessage = `Ciao Andrea! Mi interesserebbe sapere di più su ${servizioInfo.nome}. Puoi spiegarmi tutto nei dettagli?`;
    
    setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = contestoMessage;
            sendMessage();
        }
    }, 100);
}

// Navigazione al quiz
function goToQuiz() {
    console.log('🎯 Navigating to quiz...');
    window.location.href = './quiz.html';
}

// Rendi la funzione globale
window.goToQuiz = goToQuiz;

// Funzione per contatti
function openContact() {
    const contactOptions = confirm('Scegli come contattarmi:\n\nOK = WhatsApp\nAnnulla = Email');
    
    if (contactOptions) {
        window.open('https://wa.me/393478881515?text=Ciao Andrea, ho visto il tuo sito e vorrei maggiori informazioni!', '_blank');
    } else {
        window.location.href = 'mailto:andrea.padoan@gmail.com?subject=Richiesta informazioni&body=Ciao Andrea, ho visto il tuo sito e vorrei maggiori informazioni sui tuoi servizi.';
    }
}

// Sistema notifiche
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ======================================
// 🎯 EVENT LISTENERS
// ======================================

// Enter per inviare messaggio
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const chatOverlay = document.getElementById('chatFullscreen');
        if (chatOverlay && chatOverlay.style.display === 'flex') {
            e.preventDefault();
            sendMessage();
        }
    }
    
    // ESC per chiudere chat
    if (e.key === 'Escape') {
        const chatOverlay = document.getElementById('chatFullscreen');
        if (chatOverlay && chatOverlay.style.display === 'flex') {
            closeChat();
        }
    }
});

// ======================================
// 🚀 INITIALIZATION
// ======================================

// Funzione di inizializzazione dell'app
function initializeApp() {
    console.log('🚀 Andrea Padoan Hybrid Chat System - Initializing...');
    
    // Log sessione
    console.log('✅ Hybrid chat system initialized!', {
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        servizi: Object.keys(SERVIZI_DATABASE).length,
        features: ['Local AI', 'Claude API', 'Intelligent Routing', 'Lead Scoring']
    });
    
    // Test elementi essenziali
    const essentialElements = [
        'chatFullscreen',
        'chatInput', 
        'messagesContainer'
    ];
    
    essentialElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Missing essential element: ${elementId}`);
        }
    });
    
    console.log('🎯 Hybrid Chat System Ready - AI intelligente attiva!');
}

// ======================================
// 🛡️ ERROR HANDLING
// ======================================

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Global error:', e.error);
    
    // Se l'errore è nella chat, mostra messaggio user-friendly
    if (e.error?.message?.includes('chat') || e.error?.message?.includes('Andrea')) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer && isTyping) {
            hideTyping();
            addMessage('Mi dispiace, ho avuto un problema tecnico. Riprova o contattami su WhatsApp al 347 888 1515! 🔧');
        }
    }
});

// Log per debug
console.log('📁 Andrea Padoan Hybrid Chat System loaded');
console.log('🔧 Available functions:', [
    'openProject()',
    'openChat()', 
    'closeChat()',
    'sendMessage()',
    'sendQuickMessage()',
    'openContact()',
    'goToQuiz()',
    'showNotification()'
]);

console.log('✅ HYBRID FEATURES:', [
    '⚡ Local AI per risposte veloci',
    '🧠 Claude API per conversazioni complesse',
    '🎯 Intelligent routing basato su complessità',
    '📊 Lead scoring automatico',
    '📱 Logging Airtable + Telegram per lead qualificati',
    '🔄 Fallback automatico tra sistemi',
    '💾 Database servizi reali e aggiornati'
]);