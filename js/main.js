/* ============================================
   ARMELLADA TAVERNA — Main JavaScript
   Optimised: rAF scroll, passive listeners,
   IntersectionObserver, mobile-first, GitHub Pages fallback
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- helpers ---------- */
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini/i.test(navigator.userAgent)
                  || window.innerWidth <= 768;

    /* ======================================================
       GOOGLE MAPS — ЕДИНСТВЕННОЕ МЕСТО ДЛЯ ИЗМЕНЕНИЯ!
       Меняй ТОЛЬКО здесь — всё остальное обновится само.
       ====================================================== */
    const GOOGLE_RATING = 4.6;      // ← Рейтинг с Google Maps
    const GOOGLE_COUNT  = 331;      // ← Количество отзывов на Google Maps
    const GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/Armellada+Taverna+Aeroporias+80+Nea+Makri+Greece';

    /* ---------- PRELOADER ---------- */
    const preloader = document.getElementById('preloader');

    window.addEventListener('load', () => {
        setTimeout(() => {
            if (preloader) preloader.classList.add('hidden');
        }, 1200);
    });

    /* ---------- DOM refs ---------- */
    const navbar      = document.getElementById('navbar');
    const winePanels  = document.querySelectorAll('.wine-panel');
    const heroSection = document.getElementById('hero');
    const heroBg      = document.querySelector('.hero-bg-img');
    const sections    = document.querySelectorAll('section[id]');
    const navLinks    = document.querySelectorAll('.nav-link');

    /* ===========================================
       SINGLE rAF-BATCHED SCROLL HANDLER
       =========================================== */
    let ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollY = window.pageYOffset;

            /* — Navbar — */
            if (navbar) {
                navbar.classList.toggle('scrolled', scrollY > 80);
            }

            /* — Wine panels — */
            const heroBottom = heroSection ? heroSection.offsetHeight - 100 : 600;
            winePanels.forEach(panel => {
                panel.classList.toggle('visible', scrollY >= heroBottom);
            });

            /* — Parallax hero (desktop only) — */
            if (!isMobile && heroBg) {
                heroBg.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
            }

            /* — Active nav link — */
            const offset = scrollY + 200;
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');
                if (offset >= top && offset < top + height) {
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });

            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check

    /* ---------- MOBILE MENU ---------- */
    const navToggle = document.getElementById('navToggle');
    const navMenu   = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu on outside tap (mobile UX)
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active')
                && !navMenu.contains(e.target)
                && !navToggle.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    /* ---------- MENU TABS ---------- */
    const menuTabs       = document.querySelectorAll('.menu-tab');
    const menuCategories = document.querySelectorAll('.menu-category');

    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            menuTabs.forEach(t => t.classList.remove('active'));
            menuCategories.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetCat = document.getElementById(`cat-${tab.getAttribute('data-category')}`);
            if (targetCat) targetCat.classList.add('active');
        });
    });

    /* ===========================================
       SCROLL REVEAL — IntersectionObserver
       =========================================== */
    const revealSelector =
        '.section-header, .about-text, .about-images, .feature, .gallery-item, ' +
        '.contact-card, .greek-quote, .map-wrapper, .menu-card, .menu-full-sheet, ' +
        '.reviews-stats, .reviews-counter, .review-form-wrapper, .reviews-list';

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

        document.querySelectorAll(revealSelector).forEach(el => {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    } else {
        // Fallback for very old browsers — show everything immediately
        document.querySelectorAll(revealSelector).forEach(el => {
            el.classList.add('reveal', 'visible');
        });
    }

    /* ---------- GALLERY LIGHTBOX (with null-checks) ---------- */
    const lightbox     = document.getElementById('lightbox');
    const lightboxImg  = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (lightbox && lightboxImg && galleryItems.length > 0) {
        let currentIndex = 0;
        const gallerySources = [];

        galleryItems.forEach((item, index) => {
            const img = item.querySelector('img');
            if (!img) return;
            gallerySources.push(img.src);
            item.addEventListener('click', () => {
                currentIndex = index;
                openLightbox(img.src);
            });
        });

        function openLightbox(src) {
            lightboxImg.src = src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function nextImage() {
            if (!gallerySources.length) return;
            currentIndex = (currentIndex + 1) % gallerySources.length;
            lightboxImg.src = gallerySources[currentIndex];
        }

        function prevImage() {
            if (!gallerySources.length) return;
            currentIndex = (currentIndex - 1 + gallerySources.length) % gallerySources.length;
            lightboxImg.src = gallerySources[currentIndex];
        }

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxNext)  lightboxNext.addEventListener('click', nextImage);
        if (lightboxPrev)  lightboxPrev.addEventListener('click', prevImage);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape')     closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft')  prevImage();
        });

        // Stagger gallery animations
        if ('IntersectionObserver' in window) {
            const galleryObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => entry.target.classList.add('visible'), index * 80);
                        galleryObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            galleryItems.forEach(item => {
                item.classList.add('reveal');
                galleryObserver.observe(item);
            });
        }
    }

    /* ---------- SMOOTH SCROLL ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ============================================
       REVIEWS — Google Maps only (static display)
       ============================================ */

    function renderGoogleRating() {
        const ratingEl = document.getElementById('googleRating');
        const starsEl  = document.getElementById('googleStars');
        const totalEl  = document.getElementById('googleTotal');

        // 1. Видимый рейтинг
        if (ratingEl) ratingEl.textContent = GOOGLE_RATING.toFixed(1);

        // 2. Звёздочки
        if (starsEl) {
            const stars = starsEl.querySelectorAll('.rh-star');
            const fullStars = Math.floor(GOOGLE_RATING);
            const fraction = GOOGLE_RATING - fullStars;
            stars.forEach((star, i) => {
                star.classList.remove('filled', 'half');
                if (i < fullStars) star.classList.add('filled');
                else if (i === fullStars && fraction >= 0.25) star.classList.add('half');
            });
        }

        // 3. Текст «N отзывов на Google» (с правильным склонением)
        if (totalEl) {
            const abs = Math.abs(GOOGLE_COUNT) % 100;
            const n1 = abs % 10;
            let word = 'отзывов';
            if (abs > 10 && abs < 20) word = 'отзывов';
            else if (n1 > 1 && n1 < 5) word = 'отзыва';
            else if (n1 === 1) word = 'отзыв';
            totalEl.textContent = GOOGLE_COUNT + ' ' + word + ' на Google';
        }

        // 4. Автообновление Schema.org JSON-LD (SEO-микроразметка)
        const schemaScript = document.querySelector('script[type="application/ld+json"]');
        if (schemaScript) {
            try {
                const schema = JSON.parse(schemaScript.textContent);
                if (schema.aggregateRating) {
                    schema.aggregateRating.ratingValue = String(GOOGLE_RATING);
                    schema.aggregateRating.reviewCount = String(GOOGLE_COUNT);
                    schemaScript.textContent = JSON.stringify(schema);
                }
            } catch (e) { /* ignore parse errors */ }
        }
    }
    renderGoogleRating();

});
