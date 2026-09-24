(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.add('js');

    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

    /* ---------- Theme ---------- */
    $('.theme-toggle').addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
    });
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
        var stored = null;
        try { stored = localStorage.getItem('theme'); } catch (err) {}
        if (!stored) root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    });

    /* ---------- Mobile menu ---------- */
    var burger = $('.burger');
    var nav = $('#site-nav');
    function closeMenu() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    burger.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });

    /* ---------- Header state, progress bar, active link ---------- */
    var header = $('.site-header');
    var bar = $('.progress span');
    var navLinks = $$('.site-nav a');
    var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        header.classList.toggle('scrolled', y > 8);
        bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

        var current = null;
        sections.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * .35) current = s.id; });
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current); });
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---------- Reveal on scroll ---------- */
    // Stagger siblings that reveal together
    $$('.reveal').forEach(function (el) {
        if (el.classList.contains('xp')) return;
        var siblings = $$(':scope > .reveal', el.parentElement);
        el.style.setProperty('--d', Math.min(siblings.indexOf(el), 6) * 0.08 + 's');
    });
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        $$('.reveal').forEach(function (el) { io.observe(el); });
    } else {
        $$('.reveal').forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- Typed roles ---------- */
    var typed = $('.typed');
    if (typed && !reduceMotion) {
        var words = typed.dataset.words.split('|');
        var w = 0, c = words[0].length, deleting = true;
        (function tick() {
            var word = words[w];
            c += deleting ? -1 : 1;
            typed.textContent = word.slice(0, c);
            var delay = deleting ? 35 : 70;
            if (!deleting && c === word.length) { deleting = true; delay = 2200; }
            else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
            setTimeout(tick, delay);
        })();
    }

    /* ---------- Counters ---------- */
    var counters = $$('[data-count]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        counters.forEach(function (el) { el.textContent = '0'; });
        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target, target = +el.dataset.count, start = null;
                cio.unobserve(el);
                requestAnimationFrame(function step(ts) {
                    if (!start) start = ts;
                    var p = Math.min((ts - start) / 1400, 1);
                    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                    if (p < 1) requestAnimationFrame(step);
                });
            });
        }, { threshold: 0.5 });
        counters.forEach(function (el) { cio.observe(el); });
    }

    /* ---------- Logo marquee (seamless loop) ---------- */
    $$('.logo-tile img').forEach(function (img) {
        img.parentNode.setAttribute('data-name', img.getAttribute('title') || img.alt);
        if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.parentNode.classList.add('is-missing');
    });
    if (!reduceMotion) $$('.marquee').forEach(function (m) {
        var track = $('.marquee-track', m);
        $$('li', track).forEach(function (li) {
            var clone = li.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
        track.style.setProperty('--duration', (m.dataset.speed || 45) + 's');
    });

    /* ---------- Missing images (placeholders) ---------- */
    $$('.work-media img').forEach(function (img) {
        if (img.complete && img.naturalWidth === 0) img.parentNode.classList.add('is-missing');
    });

    /* ---------- Experience filters ---------- */
    var filters = $$('.filter');
    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var f = btn.dataset.filter;
            filters.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
            $$('.xp').forEach(function (xp) {
                var show = f === 'all' || xp.dataset.kind.split(' ').indexOf(f) !== -1;
                xp.classList.toggle('is-hidden', !show);
                if (show) xp.classList.add('in');
            });
        });
    });

    /* ---------- Card spotlight ---------- */
    if (window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('pointermove', function (e) {
            var card = e.target.closest && e.target.closest('.spotlight');
            if (!card) return;
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }, { passive: true });

        /* Portrait tilt */
        var tilt = $('.tilt');
        if (tilt && !reduceMotion) {
            var hero = $('.hero');
            hero.addEventListener('pointermove', function (e) {
                var r = tilt.getBoundingClientRect();
                var x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
                var y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
                tilt.style.transform = 'rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 14) + 'deg)';
            });
            hero.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
        }
    }

    /* ---------- Lightbox ---------- */
    var lb = $('#lightbox');
    if (lb && typeof lb.showModal === 'function') {
        var lbImg = $('img', lb), lbCap = $('figcaption', lb);
        $$('[data-lightbox]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                if (a.classList.contains('is-missing')) return;
                lbImg.src = a.getAttribute('href');
                lbImg.alt = a.dataset.caption || '';
                lbCap.textContent = a.dataset.caption || '';
                lb.showModal();
            });
        });
        $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
        lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    }

    /* ---------- Footer year ---------- */
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
})();
