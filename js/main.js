// ======================================
// ANDREA PADOAN LANDING - MAIN SCRIPT
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

// ======================================
// 🚀 ESSENTIAL FUNCTIONS
// ======================================

// Funzione per aprire progetti
function openProject(url) {
    if (url && url !== '#' && url !== '') {
        // Aggiungi un piccolo delay per migliorare UX
        setTimeout(() => {
            window.open(url, '_blank');
        }, 100);
    } else {
        alert('Progetto in arrivo! Torna presto per scoprire di più.');
    }
}

// FIX: Funzione per navigare al quiz
function goToQuiz() {
    console.log('🎯 Navigating to quiz...');
    window.location.href = './quiz.html';
}

// Rendi la funzione globale per accesso diretto
window.goToQuiz = goToQuiz;

// Funzione per aprire la chat AI
function openChat() {
    const chatOverlay = document.getElementById('chatFullscreen');
    if (chatOverlay) {
        chatOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus sull'input dopo un breve delay
        setTimeout(() => {
            const input = document.getElementById('chatInput');
            if (input) input.focus();
        }, 100);
        
        // Animazione avatar hero
        const heroAvatar = document.getElementById('heroAvatar');
        if (heroAvatar) {
            heroAvatar.classList.add('speaking');
            setTimeout(() => heroAvatar.classList.remove('speaking'), 2000);
        }
        
        console.log('✅ Chat opened');
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
    // Reindirizza direttamente alla dashboard
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
// 💬 CHAT AI FUNCTIONS
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

// Quick message
function sendQuickMessage(message) {
    if (isTyping) return;
    
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = message;
        sendMessage();
    }
}

// Chiamata API Claude
async function callClaudeAPI(userMessage) {
    try {
        console.log('🔄 Calling Claude API...', {
            message: userMessage.substring(0, 50) + '...',
            historyLength: conversationHistory.length
        });
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                conversationHistory: conversationHistory,
                sessionId: sessionId,
                userAgent: navigator.userAgent
            })
        });
        
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ API Success:', {
            responseLength: data.response?.length || 0,
            quizState: data.quiz_state
        });
        
        if (!data.response) {
            throw new Error('Nessuna risposta ricevuta dall\'API');
        }
        
        return data.response;
        
    } catch (error) {
        console.error('❌ Claude API Error:', error);
        throw error;
    }
}

// Invia messaggio principale
async function sendMessage() {
    if (isTyping) {
        console.log('⚠️ Already typing, ignoring send');
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
        // Chiamata API
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
        const errorMessage = 'Mi dispiace, ho avuto un problema tecnico. Riprova tra poco o contattami direttamente su WhatsApp al 347 888 1515!';
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
    console.log('🚀 Andrea Padoan Landing - Initializing...');
    
    // Avvia stats live (se elementi presenti)
    startLiveStatsUpdates();
    
    // Inizializza animazioni
    initializeAnimations();
    
    // Log sessione
    console.log('✅ Landing page initialized successfully!', {
        sessionId: sessionId,
        timestamp: new Date().toISOString()
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
    
    console.log('🎯 Chat system ready!');
}

// ======================================
// 🛡️ ERROR HANDLING
// ======================================

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Global error:', e.error);
    
    // Se l'errore è nella chat, mostra messaggio user-friendly
    if (e.error?.message?.includes('chat') || e.error?.message?.includes('Claude')) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer && isTyping) {
            hideTyping();
            addMessage('Mi dispiace, ho avuto un problema tecnico. Riprova o contattami su WhatsApp!');
        }
    }
});

// Log per debug
console.log('📁 Andrea Padoan Landing Script loaded');
console.log('🔧 Available functions:', [
    'openProject()',
    'openChat()', 
    'closeChat()',
    'sendMessage()',
    'sendQuickMessage()',
    'openContact()',
    'openDashboard()',
    'goToQuiz()' // AGGIUNTA LA FUNZIONE MANCANTE
]);