// ======================================
// ANDREA PADOAN ENHANCED CHAT SYSTEM
// Sistema chat potenziato con nuovi servizi
// ======================================

// 🌟 GLOBAL VARIABLES
let conversationHistory = [];
let isTyping = false;
let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
let userInfo = {
    name: null,
    phone: null,
    collected: false
};

// 🎯 SERVIZI DATABASE COMPLETO
const SERVIZI_DATABASE = {
    'personal-training': {
        nome: 'Personal Training a Verona',
        descrizione: 'Allenamenti personalizzati nel mio studio privato o online',
        punti_chiave: [
            'Programmi su misura per i tuoi obiettivi',
            'Allenamenti efficaci anche con poco tempo',
            'Studio privato a Verona senza code o distrazioni',
            'Opzione online per massima flessibilità',
            'Risultati garantiti con il mio metodo provato'
        ],
        prezzo: 'Da 60€ a sessione in studio, pacchetti online da 97€/mese',
        url: 'https://www.personaltrainerverona.it',
        emoji: '💪'
    },
    'tribu-studio': {
        nome: 'Tribù Studio',
        descrizione: 'Il mio studio privato a Verona per allenamenti esclusivi',
        punti_chiave: [
            'Studio privato completamente attrezzato',
            'Ambiente rilassante senza code o attese',
            'Attrezzature professionali sempre disponibili',
            'Spazio dedicato solo a te durante la sessione',
            'Parcheggio privato incluso'
        ],
        prezzo: 'Sessioni da 60€, pacchetti mensili disponibili',
        url: 'https://www.tribuptstudio.it',
        emoji: '🏠'
    },
    'lifestyle-coaching': {
        nome: 'Lifestyle Coaching Online',
        descrizione: 'La soluzione completa per cambiare vita - perché dieta e allenamento non bastano!',
        punti_chiave: [
            'Lavoro su mindset e motivazione profonda',
            'Gestione stress ed energia quotidiana',
            'Alimentazione consapevole senza diete rigide',
            'Creazione di routine sostenibili nel tempo',
            'Supporto costante 24/7 tramite app'
        ],
        prezzo: 'Da 197€/mese con coaching personalizzato',
        url: 'https://tribucoach.vercel.app/',
        emoji: '🚀'
    },
    'mealprep-planner': {
        nome: 'MealPrep Planner',
        descrizione: 'App gratuita per organizzare i pasti della settimana in 10 minuti',
        punti_chiave: [
            'Pianificazione pasti settimanale automatica',
            'Lista spesa generata automaticamente',
            'Ricette sane e veloci incluse',
            'Calcolo calorie e macronutrienti',
            'Completamente gratuita, nessun abbonamento'
        ],
        prezzo: 'Completamente GRATUITA',
        url: 'https://mealprep-planner.vercel.app/',
        emoji: '📱'
    },
    'pasto-sano': {
        nome: 'Pasto Sano - Pasti Freschi Verona',
        descrizione: 'Piatti freschi e sani pronti in 2 minuti, fatti con ingredienti di qualità',
        punti_chiave: [
            'Pasti freschi preparati giornalmente',
            'Ingredienti locali e di qualità premium',
            'Pronti in 2 minuti al microonde',
            'Menu bilanciato per ogni obiettivo',
            'Consegna a domicilio a Verona e provincia',
            'Perfetti per chi non ha tempo di cucinare'
        ],
        prezzo: 'Da 8€ a pasto, pacchetti settimanali da 45€',
        url: 'https://pastosano.netlify.app/',
        emoji: '🥗'
    },
    'best-trainer': {
        nome: 'Best-Trainer',
        descrizione: 'Centinaia di programmi di allenamento per ogni sport, formulati dai migliori personal trainer',
        punti_chiave: [
            'Oltre 500 programmi di allenamento diversi',
            'Specializzazioni per ogni sport e obiettivo',
            'Creati da personal trainer certificati',
            'Video tutorial per ogni esercizio',
            'Progressioni e periodizzazioni scientifiche',
            'App mobile per allenarsi ovunque'
        ],
        prezzo: 'Abbonamento da 19€/mese, molti programmi gratuiti',
        url: 'https://best-trainer-mvp.vercel.app/',
        emoji: '🏆'
    },
    'business-coaching': {
        nome: 'Upstart - Business Coaching',
        descrizione: 'Testa il potenziale della tua idea di business e ricevi supporto strategico',
        punti_chiave: [
            'Validazione idea di business gratuita',
            'Analisi di mercato e competitors',
            'Strategia di lancio personalizzata',
            'Supporto nella fase di startup',
            'Network di imprenditori e investitori'
        ],
        prezzo: 'Consulenza iniziale gratuita, pacchetti da 297€',
        url: 'https://upstarter-tf9x.vercel.app/',
        emoji: '💼'
    },
    'ebooks': {
        nome: 'I miei eBook',
        descrizione: 'Guide complete per trasformare corpo e mindset, anni di esperienza in formato digitale',
        punti_chiave: [
            'Guide step-by-step testati su centinaia di clienti',
            'Metodi per trasformazione fisica e mentale',
            'Strategie di motivazione e mindset',
            'Piani alimentari pratici e sostenibili',
            'Download immediato e accesso a vita'
        ],
        prezzo: 'Da 29€ a ebook, bundle completo a 97€',
        url: './ebooks.html',
        emoji: '📚'
    }
};

// ======================================
// 🚀 FUNZIONI ESSENZIALI POTENZIATE
// ======================================

// Funzione per aprire progetti (FIX COMPLETO)
function openProject(url) {
    if (url && url !== '#' && url !== '') {
        setTimeout(() => {
            window.open(url, '_blank');
        }, 100);
    } else {
        showNotification('Progetto in arrivo! Torna presto per scoprire di più.', 'info');
    }
}

// Funzione per aprire la chat AI (POTENZIATA)
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

// NUOVA: Funzione per inviare messaggio rapido con apertura chat
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

// NUOVA: Invia messaggio di contesto per servizio specifico
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

// Funzione per chiudere la chat
function closeChat() {
    const chatOverlay = document.getElementById('chatFullscreen');
    if (chatOverlay) {
        chatOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('✅ Chat chiusa');
    }
}

// ======================================
// 💬 CHAT AI FUNCTIONS POTENZIATE
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
    
    console.log('💬 Messaggio aggiunto:', isUser ? 'User' : 'Andrea', content.substring(0, 50) + '...');
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
    
    console.log('💭 Indicatore digitazione mostrato');
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
    
    console.log('✅ Indicatore digitazione nascosto');
}

// 🤖 ANDREA AI SYSTEM - POTENZIATO CON NUOVI SERVIZI
async function getAndreaAIResponse(userMessage) {
    // Simula thinking time dell'AI
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const message = userMessage.toLowerCase();
    
    // 🔍 RICONOSCIMENTO INTENTI POTENZIATO
    
    // PASTO SANO
    if (message.includes('pasto sano') || message.includes('pasti freschi') || message.includes('pasti pronti')) {
        const servizio = SERVIZI_DATABASE['pasto-sano'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Ti spiego tutto su Pasto Sano! È il mio servizio di pasti freschi e sani per chi vuole mangiare bene ma non ha tempo di cucinare.<br><br>
        
        <strong>Come funziona:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Prezzi:</strong> ${servizio.prezzo}<br><br>
        
        È perfetto per professionisti, genitori impegnati o chiunque voglia alimentarsi correttamente senza stress! I nostri chef preparano tutto fresco ogni giorno con ingredienti selezionati.<br><br>
        
        Vuoi sapere di più sui menu disponibili o come funziona la consegna? 🚚`;
    }
    
    // BEST-TRAINER
    if (message.includes('best-trainer') || message.includes('best trainer') || message.includes('programmi allenamento')) {
        const servizio = SERVIZI_DATABASE['best-trainer'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Eccoci! Best-Trainer è la piattaforma che ho creato con i migliori personal trainer d'Italia per offrire programmi di allenamento di altissima qualità.<br><br>
        
        <strong>Cosa offre:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Investimento:</strong> ${servizio.prezzo}<br><br>
        
        Non importa se fai calcio, tennis, corsa, bodybuilding o qualsiasi altro sport - abbiamo il programma perfetto per te! Ogni workout è spiegato nei minimi dettagli con video HD.<br><br>
        
        Che sport pratichi? Ti posso consigliare i programmi più adatti! 💪`;
    }
    
    // PERSONAL TRAINING
    if (message.includes('personal training') || message.includes('allenamento') || message.includes('palestra')) {
        const servizio = SERVIZI_DATABASE['personal-training'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Perfetto! Il Personal Training è il mio core business e quello che faccio con più passione da oltre 15 anni.<br><br>
        
        <strong>Cosa otterrai:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Investimento:</strong> ${servizio.prezzo}<br><br>
        
        Lavoro sia nel mio Tribù Studio privato a Verona che online. Il mio approccio è scientifico ma umano - non ti faccio perdere tempo con esercizi inutili!<br><br>
        
        Qual è il tuo obiettivo principale? Dimagrimento, tonificazione, forza o preparazione atletica? 🎯`;
    }
    
    // TRIBÙ STUDIO
    if (message.includes('tribù studio') || message.includes('tribu studio') || message.includes('studio privato')) {
        const servizio = SERVIZI_DATABASE['tribu-studio'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Ti porto nel mio mondo! Tribù Studio è il mio spazio privato a Verona dove creo la magia del cambiamento.<br><br>
        
        <strong>Perché è speciale:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Investimento:</strong> ${servizio.prezzo}<br><br>
        
        Non è la solita palestra affollata! Qui sei solo tu, io e l'obiettivo di trasformare il tuo corpo e la tua mente. Ambiente curato, musica giusta, zero distrazioni.<br><br>
        
        Ti piacerebbe vedere come è fatto lo studio? Posso mandarti un virtual tour! 🏠✨`;
    }
    
    // LIFESTYLE COACHING
    if (message.includes('lifestyle coaching') || message.includes('cambiamento') || message.includes('mindset')) {
        const servizio = SERVIZI_DATABASE['lifestyle-coaching'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Questo è il mio servizio più completo! Il Lifestyle Coaching è per chi ha capito che dieta e palestra non bastano per cambiare davvero vita.<br><br>
        
        <strong>Su cosa lavoriamo insieme:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Investimento:</strong> ${servizio.prezzo}<br><br>
        
        Non è solo fitness o nutrizione - è una trasformazione completa del tuo stile di vita! Ti seguo personalmente per creare abitudini che durano per sempre.<br><br>
        
        Dimmi, cosa ti blocca di più nel tuo percorso di cambiamento? Lo stress, la mancanza di tempo, la motivazione che va e viene? 🎯`;
    }
    
    // MEALPREP PLANNER
    if (message.includes('mealprep') || message.includes('meal prep') || message.includes('organizzare pasti')) {
        const servizio = SERVIZI_DATABASE['mealprep-planner'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Fantastico! Il MealPrep Planner è il mio regalo alla community - un'app completamente gratuita che rivoluziona il tuo rapporto con la cucina!<br><br>
        
        <strong>Cosa fa per te:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Costo:</strong> ${servizio.prezzo} 🎁<br><br>
        
        In 10 minuti la domenica pianifichi tutta la settimana! L'app calcola tutto automaticamente e ti genera pure la lista della spesa. Geniale, no?<br><br>
        
        Vuoi che ti spieghi come usarla al meglio? È semplicissima ma ha funzioni potentissime! 📱✨`;
    }
    
    // BUSINESS COACHING
    if (message.includes('business') || message.includes('upstart') || message.includes('idea') || message.includes('startup')) {
        const servizio = SERVIZI_DATABASE['business-coaching'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Ah, ti interessa l'aspetto imprenditoriale! Upstart è il mio progetto per aiutare chi ha un'idea di business ma non sa da dove iniziare.<br><br>
        
        <strong>Ti aiuto con:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Investimento:</strong> ${servizio.prezzo}<br><br>
        
        Ho lanciato diversi progetti di successo e so quanto può essere difficile l'inizio. Ti guido passo passo dalla validazione dell'idea al lancio vero e proprio!<br><br>
        
        Che tipo di business hai in mente? Dimmi tutto, facciamo una prima valutazione insieme! 💼🚀`;
    }
    
    // EBOOKS
    if (message.includes('ebook') || message.includes('libro') || message.includes('guida')) {
        const servizio = SERVIZI_DATABASE['ebooks'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Ottima scelta! I miei eBook sono il condensato di oltre 15 anni di esperienza sul campo con migliaia di clienti.<br><br>
        
        <strong>Cosa trovi dentro:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Investimento:</strong> ${servizio.prezzo}<br><br>
        
        Non sono i soliti ebook teorici! Sono guide pratiche, step-by-step, con tutto quello che serve per iniziare subito a trasformarti. Scritti con passione e testati su centinaia di persone!<br><br>
        
        Su quale area vorresti iniziare? Fitness, alimentazione o mindset? 📖✨`;
    }
    
    // PREZZI GENERALI
    if (message.includes('prezzi') || message.includes('costi') || message.includes('quanto costa')) {
        return `💰 <strong>Ecco tutti i miei servizi e investimenti:</strong><br><br>
        
        🏠 <strong>Tribù Studio:</strong> Da 60€/sessione<br>
        💪 <strong>Personal Training Online:</strong> Da 97€/mese<br>
        🚀 <strong>Lifestyle Coaching:</strong> Da 197€/mese<br>
        🥗 <strong>Pasto Sano:</strong> Da 8€/pasto (45€ settimana)<br>
        🏆 <strong>Best-Trainer:</strong> 19€/mese (molti programmi gratis)<br>
        💼 <strong>Business Coaching:</strong> Consulenza gratuita + pacchetti da 297€<br>
        📚 <strong>eBook:</strong> Da 29€ (bundle 97€)<br>
        📱 <strong>MealPrep Planner:</strong> GRATIS per sempre!<br><br>
        
        <strong>💡 Il mio consiglio:</strong> Inizia sempre con una consulenza gratuita per capire qual è il percorso giusto per te!<br><br>
        
        Quale servizio ti incuriosisce di più? Te lo spiego nei dettagli! 🎯`;
    }
    
    // QUIZ PERSONALIZZATO
    if (message.includes('quiz') || message.includes('test') || message.includes('quale servizio')) {
        return `🎯 <strong>Perfetto! Ti faccio il mio Quiz Personalizzato Express!</strong><br><br>
        
        Rispondi a queste 3 domande e ti dirò esattamente quale servizio fa per te:<br><br>
        
        <strong>1️⃣ Qual è il tuo obiettivo principale?</strong><br>
        A) Perdere peso e tonificare<br>
        B) Cambiare completamente stile di vita<br>
        C) Mangiare sano senza cucinare<br>
        D) Lanciare un business<br><br>
        
        <strong>2️⃣ Quanto tempo hai a disposizione?</strong><br>
        A) 1-2 ore a settimana<br>
        B) 30 min al giorno<br>
        C) Pochissimo, sempre di corsa<br>
        D) Dipende dal progetto<br><br>
        
        <strong>3️⃣ Budget mensile per il tuo cambiamento?</strong><br>
        A) 0-50€<br>
        B) 50-150€<br>
        C) 150-300€<br>
        D) 300€+<br><br>
        
        Dimmi le tue risposte (es: A-B-C) e ti darò la strategia perfetta! 🚀`;
    }
    
    // PRENOTAZIONE
    if (message.includes('prenot') || message.includes('appuntamento') || message.includes('quando')) {
        return `📅 <strong>Perfetto! Prenotiamo subito!</strong><br><br>
        
        Per prenotare la tua prima sessione o consulenza gratuita, hai 3 opzioni:<br><br>
        
        <strong>📞 WhatsApp (più veloce):</strong><br>
        Scrivimi su <strong>347 888 1515</strong> e fissiamo tutto in 2 minuti!<br><br>
        
        <strong>📧 Email:</strong><br>
        andrea.padoan@gmail.com<br><br>
        
        <strong>🔗 Online:</strong><br>
        Vai su uno dei miei siti e clicca "Prenota"<br><br>
        
        <strong>💡 Il mio consiglio:</strong> WhatsApp è il modo più veloce! Ti rispondo sempre entro 1 ora e possiamo organizzare tutto subito.<br><br>
        
        Per cosa vorresti prenotare? Personal training, consulenza lifestyle o altro? 🎯`;
    }
    
    // CONTATTI
    if (message.includes('contatt') || message.includes('telefono') || message.includes('whatsapp')) {
        return `📞 <strong>Ecco come puoi contattarmi:</strong><br><br>
        
        <strong>📱 WhatsApp:</strong> 347 888 1515<br>
        <em>(Rispondo sempre entro 1 ora, anche nei weekend!)</em><br><br>
        
        <strong>📧 Email:</strong> andrea.padoan@gmail.com<br><br>
        
        <strong>📍 Studio:</strong> Tribù Studio, Verona<br>
        <em>(Solo su appuntamento)</em><br><br>
        
        <strong>🌐 Social & Web:</strong><br>
        • Instagram: @andrea.padoan.coach<br>
        • LinkedIn: Andrea Padoan<br>
        • Siti web: vedi nella chat i link ai vari servizi<br><br>
        
        Il modo più veloce è WhatsApp! Mi piace il contatto diretto e umano. Scrivimi quando vuoi! 💪`;
    }
    
    // RISPOSTA DEFAULT MIGLIORATA
    return `Ciao! Sono Andrea e sono qui per aiutarti! 😊<br><br>
    
    Ti posso parlare di tutti i miei servizi:<br><br>
    
    💪 <strong>Personal Training</strong> (studio + online)<br>
    🚀 <strong>Lifestyle Coaching</strong> (cambiamento completo)<br>
    🥗 <strong>Pasto Sano</strong> (pasti freschi pronti)<br>
    🏆 <strong>Best-Trainer</strong> (programmi allenamento)<br>
    📱 <strong>MealPrep Planner</strong> (app gratuita)<br>
    💼 <strong>Business Coaching</strong> (startup & impresa)<br>
    📚 <strong>eBook Fitness</strong> (guide complete)<br><br>
    
    Dimmi pure: <em>"Spiegami [nome servizio]"</em> oppure <em>"Fammi il quiz"</em> per trovare quello giusto per te!<br><br>
    
    Cosa ti interessa di più? 🎯`;
}

// Chiamata API Claude POTENZIATA
async function callClaudeAPI(userMessage) {
    try {
        console.log('🔄 Chiamata Andrea AI System...', {
            message: userMessage.substring(0, 50) + '...',
            historyLength: conversationHistory.length
        });
        
        // Usa il sistema AI locale potenziato
        const response = await getAndreaAIResponse(userMessage);
        
        console.log('✅ Andrea AI Response:', {
            responseLength: response.length,
            sessionId: sessionId
        });
        
        return response;
        
    } catch (error) {
        console.error('❌ Andrea AI Error:', error);
        throw error;
    }
}

// Invia messaggio principale POTENZIATO
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
        // Chiamata AI Andrea
        const response = await callClaudeAPI(message);
        
        // Nascondi typing e mostra risposta
        hideTyping();
        addMessage(response);
        
        // Animazioni avatar
        animateAvatarSpeaking();
        
        console.log('✅ Messaggio inviato con successo');
        
    } catch (error) {
        hideTyping();
        
        // Messaggio di errore user-friendly
        const errorMessage = 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco o contattami direttamente su WhatsApp al 347 888 1515! 🔧';
        addMessage(errorMessage);
        
        console.error('❌ Invio messaggio fallito:', error);
    }
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
// 🎯 EVENT LISTENERS POTENZIATI
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
// 🌟 FUNZIONI DI UTILITÀ
// ======================================

// Scroll smooth per progetti
function scrollToProjects() {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
        projectsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

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
// 🚀 INIZIALIZZAZIONE
// ======================================

// Funzione di inizializzazione dell'app
function initializeApp() {
    console.log('🚀 Andrea Padoan Enhanced Chat System - Inizializzazione...');
    
    // Log sessione
    console.log('✅ Sistema chat potenziato inizializzato!', {
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        servizi: Object.keys(SERVIZI_DATABASE).length
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
            console.warn(`⚠️ Elemento essenziale mancante: ${elementId}`);
        }
    });
    
    console.log('🎯 Chat System Ready - Andrea AI attiva!');
}

// ======================================
// 🛡️ ERROR HANDLING
// ======================================

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Errore globale:', e.error);
    
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
console.log('📁 Andrea Enhanced Chat System caricato');
console.log('🔧 Funzioni disponibili:', [
    'openProject()',
    'openChat()', 
    'closeChat()',
    'sendMessage()',
    'sendQuickMessage()',
    'openContact()',
    'scrollToProjects()'
]);

// Inizializza quando DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}