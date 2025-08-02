// ======================================
// ANDREA PADOAN LANDING - MAIN SCRIPT CON DATI REALI
// Database servizi corretto con informazioni vere
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

// 🎯 SERVIZI DATABASE CORRETTO - SOLO INFORMAZIONI REALI
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
        descrizione: 'Percorso digitale di trasformazione in 7 settimane - perché dieta e allenamento non bastano!',
        punti_chiave: [
            'Percorso strutturato in 7 settimane progressive',
            '4 aree fondamentali: Benessere Emotivo, Salute Fisica, Relazioni Sociali, Vita Professionale',
            'Target: professionisti stressati, manager, chi cerca equilibrio vita-lavoro',
            'Piattaforma digitale completa su tribucoach.vercel.app',
            'Sistema avatar personalizzabile e tracking progressi'
        ],
        come_funziona: 'Percorso digitale completo che ti accompagna settimana per settimana. Ogni modulo si sblocca progressivamente per garantire un apprendimento strutturato.',
        target: 'Professionisti stressati, manager, persone che vogliono migliorare equilibrio vita-lavoro',
        url: 'https://tribucoach.vercel.app/',
        emoji: '🚀'
    },
    'mealprep-planner': {
        nome: 'MealPrep Planner',
        descrizione: 'App web gratuita per pianificare i pasti della settimana in modo intelligente',
        punti_chiave: [
            'Completamente gratuita, nessun abbonamento',
            'Pianificazione automatica pasti settimanali',
            'Lista spesa generata automaticamente',
            'Calcolo calorie e macronutrienti personalizzato',
            'Interfaccia semplice e intuitiva'
        ],
        come_funziona: 'Inserisci i tuoi dati, scegli le preferenze alimentari e l\'app genera automaticamente un piano settimanale completo con lista della spesa.',
        tecnologia: 'Next.js, TypeScript, Tailwind CSS, integrazione AI',
        stato: 'Versione stabile disponibile online',
        prezzo: 'Completamente GRATUITA',
        url: 'https://mealprep-planner.vercel.app/',
        emoji: '📱'
    },
    'pasto-sano': {
        nome: 'Pasto Sano - Pasti Freschi Verona',
        descrizione: 'Pasti freschi e bilanciati pronti in 2 minuti, selezionati personalmente da Andrea',
        punti_chiave: [
            'Pasti freschi da 330g (100g proteine + 100g carboidrati + verdure)',
            'Preparati da laboratori selezionati personalmente da Andrea',
            'Solo ingredienti naturali, senza conservanti',
            'Cottura a vapore o piastra per mantenere proprietà nutritive',
            'Durata: 3-4 giorni in frigo, possibilità di congelare',
            'Ritiro presso Tribù Studio - Via Albere 27/B'
        ],
        come_funziona: 'Ordini online, prepariamo fresco, ritiri presso il mio studio. Porta una borsa termica per il trasporto!',
        story: 'Nasce dalla mia esperienza personale: dopo anni da manager spesso non avevo tempo di cucinare e finivo per mangiare male. Ho testato laboratori per 4 anni prima di trovare quelli giusti.',
        location: 'Ritiro: Tribù Studio - Via Albere 27/B, Verona',
        preparazione: '2 minuti e mezzo in microonde o 4-5 minuti in forno a 160°',
        url: 'https://pastosano.netlify.app/',
        emoji: '🥗'
    },
    'best-trainer': {
        nome: 'Best-Trainer',
        descrizione: 'Piattaforma marketplace di programmi di allenamento (in fase di sviluppo e-commerce)',
        punti_chiave: [
            'Directory completa di Personal Trainer certificati',
            'Tutorial esercizi gratuiti con video HD',
            'Sistema di approvazione rigoroso per i PT',
            'Dashboard per PT per gestire profili e programmi',
            'Fase attuale: pre-e-commerce (acquisti non ancora attivi)'
        ],
        stato_attuale: 'Piattaforma funzionante con directory PT e tutorial gratuiti. Sistema e-commerce in sviluppo per permettere acquisto/vendita programmi.',
        tecnologia: 'Next.js, PostgreSQL, Stripe Connect (in integrazione)',
        timeline: 'E-commerce previsto per settembre 2025',
        cosa_funziona: 'Directory PT, tutorial gratuiti, sistema approvazione',
        cosa_non_funziona: 'Acquisto programmi, pagamenti, download automatici',
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
        descrizione: 'Guide digitali complete per trasformazione fisica e mentale',
        punti_chiave: [
            'Anni di esperienza condensata in formato digitale',
            'Guide step-by-step testate su clienti reali',
            'Metodi per trasformazione fisica e mentale',
            'Strategie di motivazione e mindset',
            'Download immediato dopo acquisto'
        ],
        come_funziona: 'Guide pratiche basate sulla mia esperienza personale di trasformazione da manager stressato a coach esperto.',
        url: './ebooks.html',
        emoji: '📚'
    }
};

// ======================================
// 🚀 ESSENTIAL FUNCTIONS - MIGLIORATI
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

// FIX: Funzione per navigare al quiz
function goToQuiz() {
    console.log('🎯 Navigating to quiz...');
    window.location.href = './quiz.html';
}

// Rendi la funzione globale per accesso diretto
window.goToQuiz = goToQuiz;

// Funzione per aprire la chat AI - MIGLIORATA
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

// Funzione per aprire il dashboard
function openDashboard() {
    window.open('./dashboard.html', '_blank');
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

// ======================================
// 🆕 NUOVE FUNZIONI PER CHAT MIGLIORATA
// ======================================

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
// 💬 CHAT AI FUNCTIONS - POTENZIATE
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

// 🤖 ANDREA AI SYSTEM - CON INFORMAZIONI REALI
async function getAndreaAIResponse(userMessage) {
    // Simula thinking time dell'AI
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const message = userMessage.toLowerCase();
    
    // 🔍 RICONOSCIMENTO INTENTI CON DATI REALI
    
    // PASTO SANO - INFORMAZIONI REALI
    if (message.includes('pasto sano') || message.includes('pasti freschi') || message.includes('pasti pronti')) {
        const servizio = SERVIZI_DATABASE['pasto-sano'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Ti racconto la vera storia di Pasto Sano! ${servizio.story}<br><br>
        
        <strong>Come funziona:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>Ritiro e Preparazione:</strong><br>
        • ${servizio.location}<br>
        • ${servizio.preparazione}<br>
        • Porta una borsa termica per il trasporto!<br><br>
        
        ${servizio.come_funziona}<br><br>
        
        Vuoi vedere il menu o hai domande sui pasti? Scrivimi su WhatsApp al <strong>${SERVIZI_DATABASE['personal-training'].contatti.whatsapp}</strong>! 🚚`;
    }
    
    // BEST-TRAINER - INFORMAZIONI REALI
    if (message.includes('best-trainer') || message.includes('best trainer') || message.includes('programmi allenamento')) {
        const servizio = SERVIZI_DATABASE['best-trainer'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        Ti spiego la situazione attuale di Best-Trainer:<br><br>
        
        <strong>Cosa funziona già:</strong><br>
        ${servizio.punti_chiave.slice(0, 4).map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>⚠️ Stato attuale:</strong> ${servizio.stato_attuale}<br><br>
        
        <strong>🚧 In sviluppo:</strong><br>
        • Sistema e-commerce per acquisto programmi<br>
        • Pagamenti automatici<br>
        • Download sicuri<br>
        • ${servizio.timeline}<br><br>
        
        <strong>Cosa puoi fare ora:</strong><br>
        • Esplorare la directory dei Personal Trainer certificati<br>
        • Guardare i tutorial gratuiti<br>
        • Candidarti come PT se sei certificato<br><br>
        
        Ti interessa essere aggiornato quando sarà pronto l'e-commerce? 💪`;
    }
    
    // PERSONAL TRAINING - INFORMAZIONI REALI
    if (message.includes('personal training') || message.includes('allenamento') || message.includes('palestra')) {
        const servizio = SERVIZI_DATABASE['personal-training'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        ${servizio.come_funziona}<br><br>
        
        <strong>Cosa otterrai:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>📍 Dove mi trovi:</strong><br>
        ${servizio.location}<br><br>
        
        <strong>📞 Contatti diretti:</strong><br>
        • WhatsApp: ${servizio.contatti.whatsapp}<br>
        • Email: ${servizio.contatti.email}<br><br>
        
        Il mio approccio è scientifico ma umano - non ti faccio perdere tempo con esercizi inutili!<br><br>
        
        Qual è il tuo obiettivo principale? Scrivimi su WhatsApp e ne parliamo! 🎯`;
    }
    
    // TRIBÙ STUDIO - INFORMAZIONI REALI
    if (message.includes('tribù studio') || message.includes('tribu studio') || message.includes('studio privato')) {
        const servizio = SERVIZI_DATABASE['tribu-studio'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        ${servizio.come_funziona}<br><br>
        
        <strong>Perché è speciale:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>📍 Dove si trova:</strong><br>
        ${servizio.location}<br><br>
        
        Non è la solita palestra affollata! Ambiente curato, musica giusta, zero distrazioni. Solo tu, io e l'obiettivo di trasformarti.<br><br>
        
        Vuoi vedere lo studio? Scrivimi su <strong>${SERVIZI_DATABASE['personal-training'].contatti.whatsapp}</strong> e organizziamo una visita! 🏠✨`;
    }
    
    // LIFESTYLE COACHING - INFORMAZIONI REALI
    if (message.includes('lifestyle coaching') || message.includes('cambiamento') || message.includes('mindset')) {
        const servizio = SERVIZI_DATABASE['lifestyle-coaching'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        ${servizio.descrizione}<br><br>
        
        <strong>Il percorso:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>🎯 Perfetto per:</strong> ${servizio.target}<br><br>
        
        <strong>Come funziona:</strong><br>
        ${servizio.come_funziona}<br><br>
        
        <strong>🌐 Piattaforma:</strong> <a href="${servizio.url}" target="_blank">${servizio.url}</a><br><br>
        
        È per chi ha capito che dieta e palestra non bastano per cambiare davvero vita!<br><br>
        
        Vuoi saperne di più sul percorso? Ti faccio vedere la piattaforma! 🎯`;
    }
    
    // MEALPREP PLANNER - INFORMAZIONI REALI
    if (message.includes('mealprep') || message.includes('meal prep') || message.includes('organizzare pasti')) {
        const servizio = SERVIZI_DATABASE['mealprep-planner'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        ${servizio.descrizione}<br><br>
        
        <strong>Caratteristiche:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>💰 Prezzo:</strong> ${servizio.prezzo} 🎁<br><br>
        
        <strong>Come funziona:</strong><br>
        ${servizio.come_funziona}<br><br>
        
        <strong>🛠️ Tecnologia:</strong> ${servizio.tecnologia}<br>
        <strong>📊 Stato:</strong> ${servizio.stato}<br><br>
        
        È il mio regalo alla community! Provala subito: <a href="${servizio.url}" target="_blank">${servizio.url}</a><br><br>
        
        Hai domande su come usarla? 📱✨`;
    }
    
    // BUSINESS COACHING / UPSTART - INFORMAZIONI REALI
    if (message.includes('business') || message.includes('upstart') || message.includes('idea') || message.includes('startup')) {
        const servizio = SERVIZI_DATABASE['business-coaching'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        ${servizio.descrizione}<br><br>
        
        <strong>Come funziona:</strong><br>
        ${servizio.come_funziona}<br><br>
        
        <strong>Cosa offre:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>🛠️ Tecnologia:</strong> ${servizio.tecnologia}<br>
        <strong>📊 Sviluppo:</strong> ${servizio.fasi}<br>
        <strong>🎯 Target:</strong> ${servizio.target}<br><br>
        
        <strong>🌐 Prova subito:</strong> <a href="${servizio.url}" target="_blank">${servizio.url}</a><br><br>
        
        Hai un'idea di business da validare? Ti aiuto a capire se ha potenziale! 💼🚀`;
    }
    
    // EBOOKS - INFORMAZIONI REALI
    if (message.includes('ebook') || message.includes('libro') || message.includes('guida')) {
        const servizio = SERVIZI_DATABASE['ebooks'];
        return `${servizio.emoji} <strong>${servizio.nome}</strong><br><br>
        ${servizio.descrizione}<br><br>
        
        <strong>Cosa trovi:</strong><br>
        ${servizio.punti_chiave.map(punto => `• ${punto}`).join('<br>')}<br><br>
        
        <strong>La mia storia:</strong><br>
        ${servizio.come_funziona}<br><br>
        
        Sono guide pratiche, non teoria! Tutto quello che ho imparato nella mia trasformazione da manager stressato a coach esperto.<br><br>
        
        <strong>📖 Scopri di più:</strong> <a href="${servizio.url}" target="_blank">Vai agli eBook</a><br><br>
        
        Su quale area vorresti iniziare? Fitness, alimentazione o mindset? 📖✨`;
    }
    
    // INFORMAZIONI GENERALI / CONTATTI
    if (message.includes('contatt') || message.includes('telefono') || message.includes('whatsapp')) {
        return `📞 <strong>Ecco come puoi contattarmi:</strong><br><br>
        
        <strong>📱 WhatsApp:</strong> ${SERVIZI_DATABASE['personal-training'].contatti.whatsapp}<br>
        <em>(Rispondo sempre entro 1 ora, anche nei weekend!)</em><br><br>
        
        <strong>📧 Email:</strong> ${SERVIZI_DATABASE['personal-training'].contatti.email}<br><br>
        
        <strong>📍 Studio:</strong> ${SERVIZI_DATABASE['tribu-studio'].location}<br>
        <em>(Solo su appuntamento)</em><br><br>
        
        <strong>🌐 I miei progetti online:</strong><br>
        • Personal Training: <a href="${SERVIZI_DATABASE['personal-training'].url}" target="_blank">personaltrainerverona.it</a><br>
        • Lifestyle Coaching: <a href="${SERVIZI_DATABASE['lifestyle-coaching'].url}" target="_blank">tribucoach.vercel.app</a><br>
        • MealPrep Planner: <a href="${SERVIZI_DATABASE['mealprep-planner'].url}" target="_blank">mealprep-planner.vercel.app</a><br><br>
        
        Il modo più veloce è WhatsApp! Mi piace il contatto diretto e umano. 💪`;
    }
    
    // PREZZI - INFORMAZIONI ONESTE
    if (message.includes('prezzi') || message.includes('costi') || message.includes('quanto costa')) {
        return `💰 <strong>Parliamo di investimenti:</strong><br><br>
        
        <strong>🏠 Tribù Studio (Personal Training):</strong><br>
        Contattami per tariffe personalizzate - ogni percorso è su misura!<br><br>
        
        <strong>🚀 Lifestyle Coaching:</strong><br>
        Percorso completo 7 settimane - info dettagliate sulla piattaforma<br><br>
        
        <strong>🥗 Pasto Sano:</strong><br>
        Vedi prezzi aggiornati sul sito - variano per tipo di pasto<br><br>
        
        <strong>📱 MealPrep Planner:</strong> GRATIS per sempre!<br><br>
        
        <strong>🏆 Best-Trainer:</strong> Directory gratuita, e-commerce in arrivo<br><br>
        
        <strong>💡 Il mio consiglio:</strong> Ogni percorso è personalizzato sulle tue esigenze. Scrivimi su WhatsApp <strong>${SERVIZI_DATABASE['personal-training'].contatti.whatsapp}</strong> e ne parliamo insieme!<br><br>
        
        Quale servizio ti interessa di più? 🎯`;
    }
    
    // QUIZ PERSONALIZZATO
    if (message.includes('quiz') || message.includes('test') || message.includes('quale servizio')) {
        return `🎯 <strong>Perfetto! Ti aiuto a scegliere il servizio giusto!</strong><br><br>
        
        Rispondi a queste domande e ti dirò qual è il percorso ideale per te:<br><br>
        
        <strong>1️⃣ Qual è la tua situazione attuale?</strong><br>
        A) Voglio rimettermi in forma fisicamente<br>
        B) Sono stressato e voglio cambiare vita completamente<br>
        C) Non ho tempo di cucinare ma voglio mangiare sano<br>
        D) Ho un'idea di business da sviluppare<br><br>
        
        <strong>2️⃣ Preferisci:</strong><br>
        A) Supporto in presenza a Verona<br>
        B) Percorso online strutturato<br>
        C) Soluzioni pratiche immediate<br>
        D) Tools gratuiti per iniziare<br><br>
        
        <strong>3️⃣ Il tuo obiettivo è:</strong><br>
        A) Trasformazione fisica<br>
        B) Equilibrio vita-lavoro<br>
        C) Ottimizzare il tempo<br>
        D) Crescita professionale/business<br><br>
        
        Dimmi le tue risposte (es: A-A-A) e ti consiglierò il percorso perfetto! 🚀`;
    }
    
    // RISPOSTA DEFAULT MIGLIORATA
    return `Ciao! Sono Andrea Padoan e sono qui per aiutarti! 😊<br><br>
    
    <strong>I miei servizi principali:</strong><br><br>
    
    💪 <strong>Personal Training</strong> - Nel mio Tribù Studio a Verona<br>
    🚀 <strong>Lifestyle Coaching</strong> - Percorso digitale 7 settimane<br>
    🥗 <strong>Pasto Sano</strong> - Pasti freschi pronti<br>
    📱 <strong>MealPrep Planner</strong> - App gratuita<br>
    🏆 <strong>Best-Trainer</strong> - Directory PT (e-commerce in arrivo)<br>
    💼 <strong>UpStarter</strong> - Validazione idee business<br>
    📚 <strong>eBook</strong> - Guide complete<br><br>
    
    <strong>Cosa ti interessa di più?</strong><br>
    Dimmi: <em>"Spiegami [nome servizio]"</em> oppure <em>"Fammi il quiz"</em> per trovare quello giusto per te!<br><br>
    
    📱 WhatsApp diretto: <strong>${SERVIZI_DATABASE['personal-training'].contatti.whatsapp}</strong> 🎯`;
}

// Chiamata API Claude - SOSTITUITA CON AI LOCALE
async function callClaudeAPI(userMessage) {
    try {
        console.log('🔄 Chiamata Andrea AI System...', {
            message: userMessage.substring(0, 50) + '...',
            historyLength: conversationHistory.length
        });
        
        // Usa il sistema AI locale invece dell'API esterna
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

// Invia messaggio principale - MIGLIORATO
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
        // Chiamata AI Andrea (locale)
        const response = await callClaudeAPI(message);
        
        // Nascondi typing e mostra risposta
        hideTyping();
        addMessage(response);
        
        // Animazioni avatar
        animateAvatarSpeaking();
        
        console.log('✅ Message sent successfully');
        
    } catch (error) {
        hideTyping();
        
        // Messaggio di errore user-friendly
        const errorMessage = 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco o contattami direttamente su WhatsApp al 347 888 1515! 🔧';
        addMessage(errorMessage);
        
        console.error('❌ Send message failed:', error);
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
// 🌟 ANIMATIONS & UI ENHANCEMENTS
// ======================================

// Stats animati (se presenti)
function startLiveStatsUpdates() {
    setInterval(() => {
        updateClientCount();
    }, 15000);
    
    setInterval(() => {
        updateActiveUsers();
    }, 8000);
}

function updateClientCount() {
    const clientsEl = document.getElementById('heroClientsCount');
    if (clientsEl) {
        const current = parseInt(clientsEl.textContent) || 500;
        const increment = Math.random() < 0.3 ? 1 : 0;
        if (increment) {
            animateCounter(clientsEl, current, current + 1);
        }
    }
}

function updateActiveUsers() {
    const activeEl = document.getElementById('heroActiveNow');
    if (activeEl) {
        const current = parseInt(activeEl.textContent) || 12;
        const change = Math.floor(Math.random() * 5) - 2;
        const newValue = Math.max(8, Math.min(20, current + change));
        animateCounter(activeEl, current, newValue);
    }
}

function animateCounter(element, start, end) {
    if (start === end) return;
    
    const duration = 800;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.round(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

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

// Inizializza animazioni al caricamento
function initializeAnimations() {
    // Animazione project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 100);
    });

    // Animazione list items
    const listItems = document.querySelectorAll('.project-list-item');
    listItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-50px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.6s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 1000 + index * 150);
    });

    // Intersection Observer per chat section
    const chatSection = document.querySelector('.chat-section');
    if (chatSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        });

        chatSection.style.opacity = '0';
        chatSection.style.transform = 'translateY(50px)';
        chatSection.style.transition = 'all 0.8s ease';
        observer.observe(chatSection);
    }
}

// ======================================
// 🚀 INITIALIZATION
// ======================================

// Funzione di inizializzazione dell'app (chiamata dopo il caricamento dei componenti)
function initializeApp() {
    console.log('🚀 Andrea Padoan Landing - Initializing with REAL data...');
    
    // Avvia stats live (se elementi presenti)
    startLiveStatsUpdates();
    
    // Inizializza animazioni
    initializeAnimations();
    
    // Log sessione
    console.log('✅ Landing page initialized successfully with REAL data!', {
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
            console.warn(`⚠️ Missing essential element: ${elementId}`);
        }
    });
    
    console.log('🎯 Real data chat system ready!');
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
console.log('📁 Andrea Padoan REAL DATA Main Script loaded');
console.log('🔧 Available functions:', [
    'openProject()',
    'openChat()', 
    'closeChat()',
    'sendMessage()',
    'sendQuickMessage()',
    'openContact()',
    'openDashboard()',
    'goToQuiz()',
    'showNotification()'
]);

console.log('✅ REAL data features:', [
    '✅ Pasto Sano: Informazioni reali, ritiro studio, 330g pasti',
    '✅ Best-Trainer: Stato corretto (directory + tutorial, e-commerce in sviluppo)',
    '✅ Lifestyle Coaching: 7 settimane, tribucoach.vercel.app',
    '✅ UpStarter: Validazione AI con Claude, tecnologie reali',
    '✅ Personal Training: Tribù Studio via Albere 27/B',
    '✅ MealPrep Planner: GRATIS, Next.js app',
    '✅ Contatti reali: WhatsApp 347 888 1515, email andrea.padoan@gmail.com'
]);