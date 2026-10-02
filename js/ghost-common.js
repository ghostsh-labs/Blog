(function () {
    'use strict';

    window.GhostCommon = {
        initParticles(count = 30) {
            const container = document.querySelector('.particles-container');
            if (!container || container.childElementCount) return;
            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                const size = Math.random() * 3 + 1;
                p.style.width = `${size}px`;
                p.style.height = `${size}px`;
                p.style.left = `${Math.random() * 100}%`;
                p.style.top = `${Math.random() * 100}%`;
                p.style.animation = `particleFloat ${Math.random() * 40 + 20}s ease-in-out ${Math.random() * 10}s infinite alternate`;
                container.appendChild(p);
            }
        },

        initMobileMenu() {
            const toggle = document.querySelector('.menu-toggle');
            const nav = document.querySelector('.nav-links');
            const overlay = document.querySelector('.mobile-overlay');
            if (!toggle || !nav) return;

            const close = () => {
                nav.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            };

            toggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                if (overlay) overlay.classList.toggle('active');
                document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
            });

            if (overlay) overlay.addEventListener('click', close);
            nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
        },

        initScrollTop() {
            const btn = document.getElementById('scroll-to-top');
            if (!btn) return;
            window.addEventListener('scroll', () => {
                btn.classList.toggle('show', window.pageYOffset > 300);
            });
            btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        },

        initIntro() {
            const intro = document.querySelector('.intro-container');
            if (!intro) return;
            intro.addEventListener('animationend', (e) => {
                if (e.animationName === 'fadeOut') intro.style.display = 'none';
            });
        },

        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        formatDate(dateStr) {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        },
    };

    document.addEventListener('DOMContentLoaded', () => {
        GhostCommon.initParticles();
        GhostCommon.initMobileMenu();
        GhostCommon.initScrollTop();
        GhostCommon.initIntro();
    });
})();