// ======================================
// ANDREA PADOAN - PARALLAX EFFECTS ENGINE
// Sistema completo per effetti parallax e animazioni scroll
// ======================================

(function() {
    'use strict';

    // ======================================
    // 🎨 PARALLAX CONFIGURATION
    // ======================================
    
    const config = {
        parallaxSpeed: 0.5,
        revealOffset: 100,
        smoothScrollDuration: 1000,
        heroParallaxIntensity: 0.7,
        enableMobileParallax: false // Disabilita su mobile per performance
    };

    // ======================================
    // 🌟 HERO PARALLAX SYSTEM
    // ======================================
    
    class HeroParallax {
        constructor() {
            this.hero = document.querySelector('.hero');
            this.heroImage = null;
            this.init();
        }

        init() {
            if (!this.hero) return;
            
            // Crea background parallax per hero
            this.createParallaxBackground();
            
            // Setup scroll listener
            this.setupScrollListener();
            
            // Aggiungi classe per effetti CSS
            this.hero.classList.add('parallax-hero');
        }

        createParallaxBackground() {
            // Crea container per immagine parallax
            const parallaxBg = document.createElement('div');
            parallaxBg.className = 'hero-parallax-bg';
            parallaxBg.style.cssText = `
                position: absolute;
                top: -20%;
                left: 0;
                width: 100%;
                height: 120%;
                background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), 
                                  url('./images/andrea-training-client.jpg');
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
                z-index: -1;
                will-change: transform;
            `;
            
            // Inserisci prima del contenuto hero
            this.hero.style.position = 'relative';
            this.hero.insertBefore(parallaxBg, this.hero.firstChild);
            this.heroImage = parallaxBg;
        }

        setupScrollListener() {
            let ticking = false;
            
            const updateParallax = () => {
                const scrolled = window.pageYOffset;
                const speed = scrolled * -config.heroParallaxIntensity;
                
                if (this.heroImage) {
                    this.heroImage.style.transform = `translateY(${speed}px)`;
                }
                
                // Effetto fade out del contenuto hero
                const heroContent = this.hero.querySelector('.profile-section');
                if (heroContent) {
                    const opacity = Math.max(0, 1 - scrolled / 600);
                    const scale = Math.max(0.8, 1 - scrolled / 2000);
                    heroContent.style.opacity = opacity;
                    heroContent.style.transform = `scale(${scale})`;
                }
                
                ticking = false;
            };
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            });
        }
    }

    // ======================================
    // 📦 SECTIONS PARALLAX
    // ======================================
    
    class SectionParallax {
        constructor() {
            this.sections = document.querySelectorAll('.projects-container, .chat-section, .social-section');
            this.init();
        }

        init() {
            this.sections.forEach(section => {
                this.setupSectionParallax(section);
            });
        }

        setupSectionParallax(section) {
            // Aggiungi overlay sfumato
            const overlay = document.createElement('div');
            overlay.className = 'section-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(180deg, 
                    rgba(0,0,0,0) 0%, 
                    rgba(0,0,0,0.02) 50%, 
                    rgba(0,0,0,0) 100%);
                pointer-events: none;
                z-index: 1;
            `;
            
            section.style.position = 'relative';
            section.appendChild(overlay);
            
            // Parallax per elementi interni
            const elements = section.querySelectorAll('.project-card, .chat-feature, .social-link');
            
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                // Calcola se la sezione è visibile
                if (scrolled > sectionTop - window.innerHeight && 
                    scrolled < sectionTop + sectionHeight) {
                    
                    const parallaxOffset = (scrolled - sectionTop) * 0.1;
                    
                    elements.forEach((el, index) => {
                        const speed = 0.05 * (index % 3 + 1);
                        const yPos = -(parallaxOffset * speed);
                        el.style.transform = `translateY(${yPos}px)`;
                    });
                }
            });
        }
    }

    // ======================================
    // ✨ REVEAL ANIMATIONS ON SCROLL
    // ======================================
    
    class ScrollReveal {
        constructor() {
            this.elements = [];
            this.init();
        }

        init() {
            // Prepara elementi per reveal
            this.setupRevealElements();
            
            // Osserva scroll
            this.createObserver();
        }

        setupRevealElements() {
            // Aggiungi classi reveal a elementi
            const selectors = [
                '.section-title',
                '.section-subtitle',
                '.project-card',
                '.chat-feature',
                '.social-link',
                '.global-chat-cta',
                '.chat-bubble'
            ];
            
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach((el, index) => {
                    el.classList.add('reveal-element');
                    el.style.transitionDelay = `${index * 0.1}s`;
                    this.elements.push(el);
                });
            });
        }

        createObserver() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        
                        // Animazione speciale per project cards
                        if (entry.target.classList.contains('project-card')) {
                            this.animateProjectCard(entry.target);
                        }
                    }
                });
            }, observerOptions);
            
            this.elements.forEach(el => observer.observe(el));
        }

        animateProjectCard(card) {
            card.style.animation = 'cardReveal 0.8s ease-out forwards';
        }
    }

    // ======================================
    // 🎯 SMOOTH SCROLL ENHANCEMENT
    // ======================================
    
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            // Intercetta tutti i link interni
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const target = document.querySelector(targetId);
                    if (target) {
                        this.scrollToElement(target);
                    }
                });
            });
        }

        scrollToElement(element) {
            const targetPosition = element.offsetTop - 100;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            const duration = config.smoothScrollDuration;
            let start = null;
            
            const animation = (currentTime) => {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            };
            
            requestAnimationFrame(animation);
        }

        easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
    }

    // ======================================
    // 🖱️ MOUSE PARALLAX FOR CARDS
    // ======================================
    
    class MouseParallax {
        constructor() {
            this.cards = document.querySelectorAll('.project-card');
            this.init();
        }

        init() {
            this.cards.forEach(card => {
                this.setupCardParallax(card);
            });
        }

        setupCardParallax(card) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * 10;
                const rotateY = ((centerX - x) / centerX) * 10;
                
                card.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    translateZ(10px)
                `;
                
                // Effetto spotlight
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            });
        }
    }

    // ======================================
    // 📱 MOBILE OPTIMIZATIONS
    // ======================================
    
    class MobileOptimizer {
        constructor() {
            this.isMobile = window.innerWidth <= 768;
            this.init();
        }

        init() {
            if (this.isMobile) {
                this.disableHeavyAnimations();
                this.optimizePerformance();
            }
            
            // Rileva cambio orientamento
            window.addEventListener('orientationchange', () => {
                this.handleOrientationChange();
            });
        }

        disableHeavyAnimations() {
            // Disabilita parallax pesanti su mobile
            if (!config.enableMobileParallax) {
                document.body.classList.add('no-parallax');
            }
        }

        optimizePerformance() {
            // Riduci qualità animazioni
            document.body.style.setProperty('--animation-duration', '0.3s');
        }

        handleOrientationChange() {
            // Ricalcola layout dopo rotazione
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 500);
        }
    }

    // ======================================
    // 🎨 DYNAMIC STYLES INJECTION
    // ======================================
    
    function injectParallaxStyles() {
        const styles = `
            /* Reveal Elements Base */
            .reveal-element {
                opacity: 0;
                transform: translateY(50px);
                transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .reveal-element.revealed {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* Card Reveal Animation */
            @keyframes cardReveal {
                0% {
                    opacity: 0;
                    transform: translateY(50px) scale(0.9);
                }
                50% {
                    transform: translateY(-10px) scale(1.02);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            /* Parallax Hero */
            .parallax-hero {
                overflow: hidden;
                min-height: 100vh;
            }
            
            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .no-parallax .hero-parallax-bg {
                    background-attachment: scroll !important;
                    transform: none !important;
                }
                
                .no-parallax .reveal-element {
                    transition-duration: 0.3s;
                }
            }
            
            /* Smooth Scroll */
            html {
                scroll-behavior: smooth;
            }
            
            /* Card 3D Effect */
            .project-card {
                transform-style: preserve-3d;
                transition: transform 0.3s ease-out;
            }
            
            /* Performance */
            .will-change-transform {
                will-change: transform;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ======================================
    // 🚀 INITIALIZATION
    // ======================================
    
    function initParallaxEffects() {
        console.log('🚀 Initializing Parallax Effects...');
        
        // Inject styles
        injectParallaxStyles();
        
        // Initialize modules
        const heroParallax = new HeroParallax();
        const sectionParallax = new SectionParallax();
        const scrollReveal = new ScrollReveal();
        const smoothScroll = new SmoothScroll();
        const mouseParallax = new MouseParallax();
        const mobileOptimizer = new MobileOptimizer();
        
        // Add loaded class to body
        document.body.classList.add('parallax-loaded');
        
        // Performance monitoring
        if (window.performance && performance.mark) {
            performance.mark('parallax-effects-loaded');
        }
        
        console.log('✅ Parallax Effects Loaded Successfully!');
    }

    // Wait for DOM and existing scripts
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParallaxEffects);
    } else {
        // DOM già caricato
        setTimeout(initParallaxEffects, 100);
    }
    
    // Expose API for external use
    window.ParallaxEffects = {
        config: config,
        refresh: function() {
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('scroll'));
        }
    };

})();