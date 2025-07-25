// analytics-tracker.js
// Sistema di tracking comportamento utenti per landing page

class AnalyticsTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.lastScrollTime = Date.now();
        this.sectionsViewed = new Set();
        this.clicksTracked = [];
        this.scrollDepth = 0;
        this.maxScrollDepth = 0;
        this.deviceInfo = this.getDeviceInfo();
        this.isTracking = true;
        
        // Inizializza tracking
        this.init();
    }

    // Genera ID sessione unico
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Ottiene informazioni dispositivo
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
            browser: this.getBrowser(),
            os: this.getOS(),
            referrer: document.referrer || 'direct',
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    getBrowser() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('Edge') > -1) return 'Edge';
        return 'Unknown';
    }

    getOS() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Windows') > -1) return 'Windows';
        if (ua.indexOf('Mac') > -1) return 'macOS';
        if (ua.indexOf('Linux') > -1) return 'Linux';
        if (ua.indexOf('Android') > -1) return 'Android';
        if (ua.indexOf('iPhone') > -1) return 'iOS';
        return 'Unknown';
    }

    // Inizializza tutti i tracker
    init() {
        console.log('🔍 Analytics Tracker initialized for session:', this.sessionId);
        
        // Track page load
        this.trackEvent('page_load', 'landing', {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            device: this.deviceInfo
        });

        // Setup event listeners
        this.setupScrollTracking();
        this.setupClickTracking();
        this.setupSectionTracking();
        this.setupTimeTracking();
        this.setupExitTracking();
        
        // Start periodic data sending
        this.startPeriodicSync();
    }

    // Tracking scroll behavior
    setupScrollTracking() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateScrollDepth();
                    this.trackSectionViews();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Track scroll milestones
        this.scrollMilestones = [25, 50, 75, 100];
        this.scrollMilestonesHit = new Set();
    }

    updateScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
        const windowHeight = window.innerHeight;
        
        this.scrollDepth = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
        this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);
        
        // Track scroll milestones
        this.scrollMilestones.forEach(milestone => {
            if (this.scrollDepth >= milestone && !this.scrollMilestonesHit.has(milestone)) {
                this.scrollMilestonesHit.add(milestone);
                this.trackEvent('scroll_milestone', 'scroll', {
                    milestone: milestone,
                    timestamp: new Date().toISOString(),
                    timeToReach: Date.now() - this.startTime
                });
            }
        });
    }

    // Tracking sezioni visualizzate
    setupSectionTracking() {
        // Definisci sezioni da tracciare
        this.sections = [
            { id: 'hero', name: 'Hero Section', selector: '.hero-section' },
            { id: 'projects', name: 'Projects Grid', selector: '.projects-grid' },
            { id: 'personal-training', name: 'Personal Training', selector: '.project-card[data-project="personal-training"]' },
            { id: 'tribu-studio', name: 'Tribù Studio', selector: '.project-card[data-project="tribu-studio"]' },
            { id: 'lifestyle-coach', name: 'Lifestyle Coach', selector: '.project-card[data-project="lifestyle-coach"]' },
            { id: 'upstart', name: 'Upstart', selector: '.project-card[data-project="upstart"]' },
            { id: 'ebooks', name: 'eBooks', selector: '.project-card[data-project="ebooks"]' },
            { id: 'mealprep', name: 'MealPrep', selector: '.project-card[data-project="mealprep"]' },
            { id: 'chat', name: 'Chat Section', selector: '.chat-section' },
            { id: 'footer', name: 'Footer', selector: '.footer-section' }
        ];

        // Setup intersection observer per sezioni
        const observerOptions = {
            threshold: 0.5, // 50% della sezione deve essere visibile
            rootMargin: '0px 0px -50px 0px'
        };

        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.dataset.section;
                    const sectionName = entry.target.dataset.sectionName;
                    
                    if (!this.sectionsViewed.has(sectionId)) {
                        this.sectionsViewed.add(sectionId);
                        this.trackEvent('section_view', sectionId, {
                            sectionName: sectionName,
                            timestamp: new Date().toISOString(),
                            timeToView: Date.now() - this.startTime,
                            scrollDepth: this.scrollDepth
                        });
                    }
                }
            });
        }, observerOptions);

        // Osserva tutte le sezioni
        this.sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                element.dataset.section = section.id;
                element.dataset.sectionName = section.name;
                this.sectionObserver.observe(element);
            }
        });
    }

    trackSectionViews() {
        // Aggiorna tempo speso nelle sezioni
        this.sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element && this.isElementInViewport(element)) {
                const timeSpent = Date.now() - this.lastScrollTime;
                this.updateSectionTime(section.id, timeSpent);
            }
        });
        
        this.lastScrollTime = Date.now();
    }

    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= windowHeight &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    updateSectionTime(sectionId, timeSpent) {
        // Aggiorna tempo speso nella sezione
        if (!this.sectionTimes) this.sectionTimes = {};
        this.sectionTimes[sectionId] = (this.sectionTimes[sectionId] || 0) + timeSpent;
    }

    // Tracking click su elementi
    setupClickTracking() {
        // Elementi da tracciare
        this.trackableElements = [
            '.project-card',
            '.chat-button',
            '.whatsapp-button',
            '.email-button',
            '.dashboard-button',
            '.cta-button',
            '.project-link',
            '.social-link',
            '.contact-button',
            'a[href*="ebooks"]',
            'a[href*="personaltrainer"]',
            'a[href*="tribu"]',
            'a[href*="upstart"]',
            'a[href*="mealprep"]'
        ];

        // Setup click listeners
        document.addEventListener('click', (event) => {
            this.handleClick(event);
        }, true);

        // Setup form submissions
        document.addEventListener('submit', (event) => {
            this.handleFormSubmit(event);
        }, true);
    }

    handleClick(event) {
        const element = event.target.closest(this.trackableElements.join(', '));
        
        if (element) {
            const elementData = this.getElementData(element);
            
            this.trackEvent('click', elementData.type, {
                elementId: element.id || 'unknown',
                elementClass: element.className,
                elementText: element.textContent?.trim().substring(0, 50) || '',
                elementHref: element.href || '',
                elementType: elementData.type,
                elementCategory: elementData.category,
                position: this.getElementPosition(element),
                timestamp: new Date().toISOString(),
                timeToClick: Date.now() - this.startTime,
                scrollDepth: this.scrollDepth
            });
        }
    }

    getElementData(element) {
        // Identifica tipo e categoria elemento
        if (element.classList.contains('project-card')) {
            return {
                type: 'project',
                category: element.dataset.project || 'unknown'
            };
        }
        if (element.classList.contains('chat-button')) {
            return { type: 'chat', category: 'communication' };
        }
        if (element.classList.contains('whatsapp-button')) {
            return { type: 'whatsapp', category: 'communication' };
        }
        if (element.classList.contains('email-button')) {
            return { type: 'email', category: 'communication' };
        }
        if (element.classList.contains('dashboard-button')) {
            return { type: 'dashboard', category: 'navigation' };
        }
        
        return { type: 'unknown', category: 'unknown' };
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height
        };
    }

    handleFormSubmit(event) {
        const form = event.target;
        
        this.trackEvent('form_submit', 'form', {
            formId: form.id || 'unknown',
            formAction: form.action || '',
            formMethod: form.method || 'GET',
            timestamp: new Date().toISOString(),
            timeToSubmit: Date.now() - this.startTime
        });
    }

    // Tracking tempo speso
    setupTimeTracking() {
        // Track time milestones
        this.timeMilestones = [10, 30, 60, 120, 300]; // seconds
        this.timeMilestonesHit = new Set();
        
        setInterval(() => {
            const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
            
            this.timeMilestones.forEach(milestone => {
                if (timeSpent >= milestone && !this.timeMilestonesHit.has(milestone)) {
                    this.timeMilestonesHit.add(milestone);
                    this.trackEvent('time_milestone', 'engagement', {
                        milestone: milestone,
                        timestamp: new Date().toISOString(),
                        scrollDepth: this.maxScrollDepth,
                        sectionsViewed: Array.from(this.sectionsViewed)
                    });
                }
            });
        }, 1000);
    }

    // Tracking uscita dal sito
    setupExitTracking() {
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_exit', 'session', {
                totalTime: Date.now() - this.startTime,
                maxScrollDepth: this.maxScrollDepth,
                sectionsViewed: Array.from(this.sectionsViewed),
                clicksCount: this.clicksTracked.length,
                timestamp: new Date().toISOString()
            });
            
            // Send final data
            this.sendDataSync();
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', 'engagement', {
                    timestamp: new Date().toISOString(),
                    timeActive: Date.now() - this.startTime
                });
            } else {
                this.trackEvent('page_visible', 'engagement', {
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    // Traccia evento generico
    trackEvent(action, category, data = {}) {
        const event = {
            sessionId: this.sessionId,
            action: action,
            category: category,
            data: data,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.clicksTracked.push(event);
        
        // Log per debug
        console.log('📊 Analytics Event:', action, category, data);
        
        // Invia evento se è critico
        if (this.isCriticalEvent(action)) {
            this.sendEvent(event);
        }
    }

    isCriticalEvent(action) {
        const criticalEvents = [
            'click',
            'form_submit',
            'page_load',
            'page_exit',
            'scroll_milestone'
        ];
        
        return criticalEvents.includes(action);
    }

    // Invia evento singolo
    async sendEvent(event) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'event',
                    event: event
                })
            });
        } catch (error) {
            console.error('❌ Error sending analytics event:', error);
        }
    }

    // Invia dati batch
    async sendDataBatch() {
        if (this.clicksTracked.length === 0) return;

        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'batch',
                    sessionId: this.sessionId,
                    events: this.clicksTracked,
                    summary: {
                        totalTime: Date.now() - this.startTime,
                        maxScrollDepth: this.maxScrollDepth,
                        sectionsViewed: Array.from(this.sectionsViewed),
                        sectionTimes: this.sectionTimes,
                        deviceInfo: this.deviceInfo
                    }
                })
            });

            if (response.ok) {
                this.clicksTracked = []; // Reset dopo invio
            }
        } catch (error) {
            console.error('❌ Error sending analytics batch:', error);
        }
    }

    // Invia dati sincrono (per page unload)
    sendDataSync() {
        if (this.clicksTracked.length === 0) return;

        try {
            const data = JSON.stringify({
                type: 'batch',
                sessionId: this.sessionId,
                events: this.clicksTracked,
                summary: {
                    totalTime: Date.now() - this.startTime,
                    maxScrollDepth: this.maxScrollDepth,
                    sectionsViewed: Array.from(this.sectionsViewed),
                    sectionTimes: this.sectionTimes,
                    deviceInfo: this.deviceInfo
                }
            });

            // Use sendBeacon for reliable delivery
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics', data);
            } else {
                // Fallback per browser vecchi
                fetch('/api/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true
                });
            }
        } catch (error) {
            console.error('❌ Error sending analytics sync:', error);
        }
    }

    // Sync periodico
    startPeriodicSync() {
        setInterval(() => {
            this.sendDataBatch();
        }, 30000); // Ogni 30 secondi
    }

    // Metodi pubblici per controllo
    pause() {
        this.isTracking = false;
    }

    resume() {
        this.isTracking = true;
    }

    destroy() {
        this.isTracking = false;
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }
        this.sendDataSync();
    }
}

// Inizializza tracker quando DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se tracking è consentito (privacy compliance)
    if (typeof window.analyticsEnabled === 'undefined' || window.analyticsEnabled) {
        window.analyticsTracker = new AnalyticsTracker();
    }
});

// Export per uso esterno
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsTracker;
}