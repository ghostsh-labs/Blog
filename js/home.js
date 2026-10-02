(function () {
    'use strict';

    const { escapeHtml, formatDate } = window.GhostCommon;

    function renderFeature(writeup) {
        return `
            <a href="writeups.html#${escapeHtml(writeup.id)}" class="writeup-feature">
                <div class="writeup-feature-label"><i class="fas fa-star"></i> Latest</div>
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(writeup.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(writeup.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(writeup.readTime)}</span>
                    </div>
                </div>
                <h2>${escapeHtml(writeup.title)}</h2>
                <p class="writeup-summary">${escapeHtml(writeup.summary)}</p>
            </a>`;
    }

    function renderRow(writeup) {
        return `
            <a href="writeups.html#${escapeHtml(writeup.id)}" class="writeup-row">
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(writeup.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(writeup.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(writeup.readTime)}</span>
                    </div>
                </div>
                <h3>${escapeHtml(writeup.title)}</h3>
                <p class="writeup-summary">${escapeHtml(writeup.summary)}</p>
            </a>`;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('blog-summaries');
        const writeups = [...window.GHOST_WRITEUPS].sort((a, b) => b.date.localeCompare(a.date));

        if (!writeups.length) {
            container.innerHTML =
                '<div class="no-results"><i class="fas fa-pen-nib"></i> No writeups yet - check back soon.</div>';
            return;
        }

        const [latest, ...rest] = writeups.slice(0, 4);
        container.innerHTML =
            renderFeature(latest) +
            `<div class="writeup-list">${rest.map(renderRow).join('')}</div>`;
    });
})();