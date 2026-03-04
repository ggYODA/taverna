/* ============================================
   ARMELLADA TAVERNA — Main JavaScript
   Optimised: rAF scroll, passive listeners,
   IntersectionObserver, mobile-first, GitHub Pages fallback
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- helpers ---------- */
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini/i.test(navigator.userAgent)
                  || window.innerWidth <= 768;

    const isLocalDev = ['localhost', '127.0.0.1', ''].includes(location.hostname);

    // Auto-detect API: on localhost use Flask server, otherwise reviews are offline
    const API_BASE = isLocalDev ? 'http://localhost:3000' : null;

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
       REVIEWS — Real-time + форма + SSE
       Graceful degradation on GitHub Pages (no server)
       ============================================ */

    const reviewCount      = document.getElementById('reviewCount');
    const reviewForm       = document.getElementById('reviewForm');
    const reviewsList      = document.getElementById('reviewsList');
    const formMessage      = document.getElementById('formMessage');
    const submitBtn        = document.getElementById('reviewSubmitBtn');
    const starRating       = document.getElementById('starRating');
    const ratingInput      = document.getElementById('reviewRating');
    const aggregateRatingEl = document.getElementById('aggregateRating');
    const aggregateStarsEl  = document.getElementById('aggregateStars');
    const aggregateTotalEl  = document.getElementById('aggregateTotal');

    let currentRating = 5;

    // External sources (Google, TripAdvisor etc.)
    const externalReviews = {
        google:      { rating: 4.7, count: 128 },
        tripadvisor: { rating: 4.5, count: 86 }
    };

    /** Weighted aggregate rating from all sources */
    function updateAggregateRating(siteReviews) {
        let siteAvg = 0, siteCount = 0;
        if (siteReviews && siteReviews.length > 0) {
            siteCount = siteReviews.length;
            siteAvg = siteReviews.reduce((sum, r) => sum + r.rating, 0) / siteCount;
        }

        let totalWeightedSum = 0, totalCount = 0;
        Object.values(externalReviews).forEach(src => {
            totalWeightedSum += src.rating * src.count;
            totalCount += src.count;
        });
        if (siteCount > 0) {
            totalWeightedSum += siteAvg * siteCount;
            totalCount += siteCount;
        }

        const overallRating = totalCount > 0 ? (totalWeightedSum / totalCount) : 0;
        const roundedRating = Math.round(overallRating * 10) / 10;

        if (aggregateRatingEl) aggregateRatingEl.textContent = roundedRating.toFixed(1);
        if (aggregateStarsEl) {
            const stars = aggregateStarsEl.querySelectorAll('.rh-star');
            const fullStars = Math.floor(roundedRating);
            const fraction = roundedRating - fullStars;
            stars.forEach((star, i) => {
                star.classList.remove('filled', 'half');
                if (i < fullStars) star.classList.add('filled');
                else if (i === fullStars && fraction >= 0.25) star.classList.add('half');
            });
        }
        if (aggregateTotalEl) {
            aggregateTotalEl.textContent = totalCount + ' ' + pluralReviews(totalCount);
        }
    }

    function pluralReviews(n) {
        const abs = Math.abs(n) % 100;
        const n1 = abs % 10;
        if (abs > 10 && abs < 20) return 'отзывов';
        if (n1 > 1 && n1 < 5) return 'отзыва';
        if (n1 === 1) return 'отзыв';
        return 'отзывов';
    }

    /* ---- Star rating widget ---- */
    if (starRating) {
        const starBtns = starRating.querySelectorAll('.star-btn');

        starBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentRating = parseInt(btn.dataset.rating, 10);
                if (ratingInput) ratingInput.value = currentRating;
                starBtns.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.rating, 10) <= currentRating);
                });
            });

            btn.addEventListener('mouseenter', () => {
                const hoverVal = parseInt(btn.dataset.rating, 10);
                starBtns.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.rating, 10) <= hoverVal);
                });
            });
        });

        starRating.addEventListener('mouseleave', () => {
            starBtns.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.rating, 10) <= currentRating);
            });
        });
    }

    /** Create review card HTML */
    function createReviewCard(review, isNew = false) {
        const date = new Date(review.date);
        const dateStr = date.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const stars = '\u2605'.repeat(review.rating) + '\u2606'.repeat(5 - review.rating);
        const initial = review.name.charAt(0).toUpperCase();

        const card = document.createElement('div');
        card.className = 'review-card' + (isNew ? ' new-review' : '');
        card.innerHTML = `
            <div class="review-card-header">
                <div class="review-card-author">
                    <div class="review-avatar">${initial}</div>
                    <div>
                        <div class="review-name">${escapeHtml(review.name)}</div>
                        <div class="review-date">${dateStr}</div>
                    </div>
                </div>
                <div class="review-stars">${stars}</div>
            </div>
            <p class="review-card-text">${escapeHtml(review.text)}</p>
        `;
        return card;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function animateCounter(newValue) {
        if (reviewCount) {
            reviewCount.textContent = newValue;
            reviewCount.classList.add('bump');
            setTimeout(() => reviewCount.classList.remove('bump'), 400);
        }
    }

    function showFormMessage(text, type = 'success') {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.className = 'form-message show ' + type;
        setTimeout(() => { formMessage.className = 'form-message'; }, 4000);
    }

    /* ---- Load reviews ---- */
    let siteReviewsCache = [];

    // Direct Google Maps link for the restaurant profile
    const GOOGLE_MAPS_URL = 'https://www.google.com/maps/place/Armellada+Taverna/@38.0895,23.9795,17z/';
    // Link that opens the "Write a review" dialog directly
    const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/search/Armellada+Taverna+Aeroporias+80+Nea+Makri+Greece';

    async function loadReviews() {
        // No API available (GitHub Pages) — show external-only aggregate
        if (!API_BASE) {
            updateAggregateRating([]);
            if (reviewsList) {
                reviewsList.innerHTML = `
                    <div class="reviews-loading" style="flex-direction:column;gap:8px;text-align:center;">
                        <span style="font-size:1.4rem;">🏛</span>
                        <span>Отзывы доступны при посещении ресторана<br>или на <a href="${GOOGLE_MAPS_URL}" target="_blank" rel="noopener" style="color:var(--gold);text-decoration:underline;">Google Maps</a></span>
                    </div>
                `;
            }
            // Replace the form with a Google Maps review button
            const formWrapper = reviewForm ? reviewForm.closest('.review-form-wrapper') : null;
            if (formWrapper) {
                formWrapper.innerHTML = `
                    <h3 class="review-form-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Оставить отзыв
                    </h3>
                    <p style="color:var(--text-secondary);margin-bottom:1rem;font-size:0.95rem;">Поделитесь впечатлениями о посещении на Google Maps:</p>
                    <a href="${GOOGLE_REVIEW_URL}" target="_blank" rel="noopener"
                       class="btn btn--primary" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Написать отзыв на Google Maps
                    </a>
                `;
            }
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/reviews`);
            if (!resp.ok) throw new Error('Сервер недоступен');
            const data = await resp.json();

            siteReviewsCache = data.reviews || [];
            if (reviewCount) reviewCount.textContent = data.count;
            updateAggregateRating(siteReviewsCache);

            if (reviewsList) {
                reviewsList.innerHTML = '';
                data.reviews.forEach(review => {
                    reviewsList.appendChild(createReviewCard(review));
                });
            }
        } catch (err) {
            console.warn('Reviews API недоступен:', err.message);
            if (reviewCount) reviewCount.textContent = '—';
            updateAggregateRating([]);
            if (reviewsList) {
                reviewsList.innerHTML = `
                    <div class="reviews-loading" style="flex-direction:column;gap:8px;">
                        <span style="font-size:1.4rem;">🏛</span>
                        <span>Запустите сервер:<br><code style="font-size:0.8rem;background:rgba(0,0,0,0.06);padding:4px 8px;border-radius:6px;">cd server && python server.py</code></span>
                    </div>
                `;
            }
        }
    }
    loadReviews();

    /* ---- SSE real-time updates (only when API is available) ---- */
    function connectSSE() {
        if (!API_BASE) return;
        if (typeof EventSource === 'undefined') return;

        const evtSource = new EventSource(`${API_BASE}/api/reviews/stream`);

        evtSource.addEventListener('init', (e) => {
            const data = JSON.parse(e.data);
            if (reviewCount) reviewCount.textContent = data.count;
        });

        evtSource.addEventListener('new-review', (e) => {
            const data = JSON.parse(e.data);
            animateCounter(data.count);
            if (data.review) {
                siteReviewsCache.unshift(data.review);
                updateAggregateRating(siteReviewsCache);
            }
            if (reviewsList) {
                const card = createReviewCard(data.review, true);
                reviewsList.insertBefore(card, reviewsList.firstChild);
            }
        });

        evtSource.onerror = () => {
            evtSource.close();
            setTimeout(connectSSE, 5000);
        };
    }
    connectSSE();

    /* ---- Submit review form (only when API is available) ---- */
    if (reviewForm && API_BASE) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name   = document.getElementById('reviewName').value.trim();
            const text   = document.getElementById('reviewText').value.trim();
            const rating = parseInt(ratingInput.value, 10);

            if (!name || !text) {
                showFormMessage('Заполните все поля', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <div class="preloader-spinner" style="width:18px;height:18px;border-width:2px;"></div>
                Отправка...
            `;

            try {
                const resp = await fetch(`${API_BASE}/api/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, rating, text })
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Ошибка сервера');

                reviewForm.reset();
                currentRating = 5;
                if (ratingInput) ratingInput.value = 5;
                if (starRating) {
                    starRating.querySelectorAll('.star-btn').forEach(s => {
                        s.classList.toggle('active', parseInt(s.dataset.rating, 10) <= 5);
                    });
                }

                showFormMessage('Спасибо за ваш отзыв! ✨', 'success');

            } catch (err) {
                showFormMessage(err.message || 'Не удалось отправить отзыв', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Отправить отзыв
                `;
            }
        });
    }

});
