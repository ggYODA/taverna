/* ============================================
   ARMELLADA TAVERNA — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- PRELOADER ----
    const preloader = document.getElementById('preloader');

    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 1200);
    });

    // ---- NAVBAR SCROLL ----
    const navbar = document.getElementById('navbar');

    // ---- WINE PANELS — show only after hero ----
    const winePanels = document.querySelectorAll('.wine-panel');
    const heroSection = document.getElementById('hero');

    function handleScroll() {
        const scrollY = window.pageYOffset;

        // Navbar
        if (scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Wine panels: appear when scrolled past the hero
        const heroBottom = heroSection ? heroSection.offsetHeight - 100 : 600;
        winePanels.forEach(panel => {
            if (scrollY >= heroBottom) {
                panel.classList.add('visible');
            } else {
                panel.classList.remove('visible');
            }
        });
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // initial check

    // ---- MOBILE MENU ----
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

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

    // ---- ACTIVE NAV LINK ON SCROLL ----
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
        const scrollY = window.pageYOffset + 200;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', updateActiveLink);

    // ---- MENU TABS ----
    const menuTabs = document.querySelectorAll('.menu-tab');
    const menuCategories = document.querySelectorAll('.menu-category');

    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs and categories
            menuTabs.forEach(t => t.classList.remove('active'));
            menuCategories.forEach(c => c.classList.remove('active'));

            // Add active to clicked tab
            tab.classList.add('active');

            // Show corresponding category
            const category = tab.getAttribute('data-category');
            const targetCat = document.getElementById(`cat-${category}`);
            if (targetCat) {
                targetCat.classList.add('active');
            }
        });
    });

    // ---- SCROLL REVEAL ----
    function revealElements() {
        const elements = document.querySelectorAll(
            '.section-header, .about-text, .about-images, .feature, .gallery-item, .contact-card, .greek-quote, .map-wrapper, .menu-card, .menu-full-sheet, .reviews-stats, .reviews-counter, .review-form-wrapper, .reviews-list'
        );
        elements.forEach(el => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
            }
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < window.innerHeight - 80) {
                el.classList.add('visible');
            }
        });
    }
    window.addEventListener('scroll', revealElements);
    window.addEventListener('load', () => setTimeout(revealElements, 500));

    // ---- GALLERY LIGHTBOX ----
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryItems = document.querySelectorAll('.gallery-item');
    let currentIndex = 0;

    const gallerySources = [];
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
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
        currentIndex = (currentIndex + 1) % gallerySources.length;
        lightboxImg.src = gallerySources[currentIndex];
    }

    function prevImage() {
        currentIndex = (currentIndex - 1 + gallerySources.length) % gallerySources.length;
        lightboxImg.src = gallerySources[currentIndex];
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', nextImage);
    lightboxPrev.addEventListener('click', prevImage);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });

    // ---- SMOOTH SCROLL ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- PARALLAX HERO ----
    const heroBg = document.querySelector('.hero-bg-img');
    window.addEventListener('scroll', () => {
        if (heroBg) {
            heroBg.style.transform = `translateY(${window.pageYOffset * 0.3}px)`;
        }
    });

    // ---- STAGGER GALLERY ANIMATIONS ----
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    galleryItems.forEach(item => {
        item.classList.add('reveal');
        observer.observe(item);
    });

    // ============================================
    // REVIEWS — Real-time счётчик + форма + SSE
    // ============================================

    // Адрес API сервера (порт Express)
    const API_BASE = 'http://localhost:3000';

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

    let currentRating = 5; // По умолчанию 5 звёзд

    // ---- Данные из внешних источников (Google, TripAdvisor и т.д.) ----
    const externalReviews = {
        google:      { rating: 4.7, count: 128 },
        tripadvisor: { rating: 4.5, count: 86 }
    };

    /**
     * Пересчитывает и отображает общий (агрегатный) рейтинг
     * на основе отзывов сайта + внешних источников.
     */
    function updateAggregateRating(siteReviews) {
        // Средний рейтинг отзывов с сайта
        let siteAvg = 0;
        let siteCount = 0;
        if (siteReviews && siteReviews.length > 0) {
            siteCount = siteReviews.length;
            siteAvg = siteReviews.reduce((sum, r) => sum + r.rating, 0) / siteCount;
        }

        // Собираем все источники: взвешенное среднее по количеству отзывов
        let totalWeightedSum = 0;
        let totalCount = 0;

        // Внешние источники
        Object.values(externalReviews).forEach(src => {
            totalWeightedSum += src.rating * src.count;
            totalCount += src.count;
        });

        // Отзывы с сайта
        if (siteCount > 0) {
            totalWeightedSum += siteAvg * siteCount;
            totalCount += siteCount;
        }

        const overallRating = totalCount > 0 ? (totalWeightedSum / totalCount) : 0;
        const roundedRating = Math.round(overallRating * 10) / 10;

        // Обновляем DOM
        if (aggregateRatingEl) {
            aggregateRatingEl.textContent = roundedRating.toFixed(1);
        }
        if (aggregateStarsEl) {
            // Используем SVG-звёзды с классами filled/half
            const stars = aggregateStarsEl.querySelectorAll('.rh-star');
            const fullStars = Math.floor(roundedRating);
            const fraction = roundedRating - fullStars;

            stars.forEach((star, i) => {
                star.classList.remove('filled', 'half');
                if (i < fullStars) {
                    star.classList.add('filled');
                } else if (i === fullStars && fraction >= 0.25) {
                    star.classList.add('half');
                }
            });
        }
        if (aggregateTotalEl) {
            // Склонение слова «отзыв»
            const word = pluralReviews(totalCount);
            aggregateTotalEl.textContent = totalCount + ' ' + word;
        }
    }

    /** Склонение слова «отзыв» */
    function pluralReviews(n) {
        const abs = Math.abs(n) % 100;
        const n1 = abs % 10;
        if (abs > 10 && abs < 20) return 'отзывов';
        if (n1 > 1 && n1 < 5) return 'отзыва';
        if (n1 === 1) return 'отзыв';
        return 'отзывов';
    }

    // ---- ЗВЁЗДЫ: интерактивная оценка ----
    if (starRating) {
        const starBtns = starRating.querySelectorAll('.star-btn');

        starBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentRating = parseInt(btn.dataset.rating, 10);
                ratingInput.value = currentRating;
                // Обновляем визуал звёзд
                starBtns.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.rating, 10) <= currentRating);
                });
            });

            // Эффект при наведении
            btn.addEventListener('mouseenter', () => {
                const hoverVal = parseInt(btn.dataset.rating, 10);
                starBtns.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.rating, 10) <= hoverVal);
                });
            });
        });

        // При уходе мыши — показываем текущий выбранный рейтинг
        starRating.addEventListener('mouseleave', () => {
            starBtns.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.rating, 10) <= currentRating);
            });
        });
    }

    /**
     * Создаёт HTML-карточку одного отзыва.
     */
    function createReviewCard(review, isNew = false) {
        const date = new Date(review.date);
        const dateStr = date.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
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

    /**
     * Защита от XSS — экранирование HTML.
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Анимация «bump» для счётчика при обновлении.
     */
    function animateCounter(newValue) {
        if (reviewCount) {
            reviewCount.textContent = newValue;
            reviewCount.classList.add('bump');
            setTimeout(() => reviewCount.classList.remove('bump'), 400);
        }
    }

    /**
     * Показывает сообщение под формой (success/error).
     */
    function showFormMessage(text, type = 'success') {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.className = 'form-message show ' + type;
        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 4000);
    }

    // ---- ЗАГРУЗКА НАЧАЛЬНЫХ ОТЗЫВОВ ----
    let siteReviewsCache = []; // кэш для пересчёта агрегатного рейтинга

    async function loadReviews() {
        try {
            const resp = await fetch(`${API_BASE}/api/reviews`);
            if (!resp.ok) throw new Error('Сервер недоступен');
            const data = await resp.json();

            siteReviewsCache = data.reviews || [];

            // Обновляем счётчик
            if (reviewCount) reviewCount.textContent = data.count;

            // Обновляем агрегатный рейтинг
            updateAggregateRating(siteReviewsCache);

            // Рендерим список карточек
            if (reviewsList) {
                reviewsList.innerHTML = '';
                data.reviews.forEach(review => {
                    reviewsList.appendChild(createReviewCard(review));
                });
            }
        } catch (err) {
            console.warn('Reviews API недоступен:', err.message);
            // Если сервер не запущен — показываем заглушку, но всё равно считаем внешние
            if (reviewCount) reviewCount.textContent = '—';
            updateAggregateRating([]);
            if (reviewsList) {
                reviewsList.innerHTML = `
                    <div class="reviews-loading" style="flex-direction:column;gap:8px;">
                        <span style="font-size:1.4rem;">🏛</span>
                        <span>Запустите сервер:<br><code style="font-size:0.8rem;background:rgba(0,0,0,0.06);padding:4px 8px;border-radius:6px;">cd server && npm start</code></span>
                    </div>
                `;
            }
        }
    }
    loadReviews();

    // ---- SSE: Подключение к серверу для real-time обновлений ----
    function connectSSE() {
        // Проверяем поддержку EventSource
        if (typeof EventSource === 'undefined') return;

        const evtSource = new EventSource(`${API_BASE}/api/reviews/stream`);

        // При первом подключении — получаем текущее количество
        evtSource.addEventListener('init', (e) => {
            const data = JSON.parse(e.data);
            if (reviewCount) reviewCount.textContent = data.count;
        });

        // При добавлении нового отзыва кем-то
        evtSource.addEventListener('new-review', (e) => {
            const data = JSON.parse(e.data);

            // Анимируем счётчик
            animateCounter(data.count);

            // Обновляем кэш и агрегатный рейтинг
            if (data.review) {
                siteReviewsCache.unshift(data.review);
                updateAggregateRating(siteReviewsCache);
            }

            // Добавляем карточку в начало списка с подсветкой
            if (reviewsList) {
                const card = createReviewCard(data.review, true);
                reviewsList.insertBefore(card, reviewsList.firstChild);
            }
        });

        // При ошибке — переподключаемся через 5 секунд
        evtSource.onerror = () => {
            evtSource.close();
            setTimeout(connectSSE, 5000);
        };
    }
    connectSSE();

    // ---- ОТПРАВКА ФОРМЫ ----
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name   = document.getElementById('reviewName').value.trim();
            const text   = document.getElementById('reviewText').value.trim();
            const rating = parseInt(ratingInput.value, 10);

            if (!name || !text) {
                showFormMessage('Заполните все поля', 'error');
                return;
            }

            // Блокируем кнопку на время отправки
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

                if (!resp.ok) {
                    throw new Error(data.error || 'Ошибка сервера');
                }

                // Успешно — очищаем форму
                reviewForm.reset();
                currentRating = 5;
                ratingInput.value = 5;
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
