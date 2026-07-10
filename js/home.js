(function () {
    'use strict';

    const { escapeHtml, formatDate } = window.GhostCommon;

    function renderSummaryCard(writeup) {
        return `
            <article class="writeup-card summary-card">
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(writeup.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(writeup.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(writeup.readTime)}</span>
                    </div>
                </div>
                <h3><a href="writeups.html#${escapeHtml(writeup.id)}">${escapeHtml(writeup.title)}</a></h3>
                <p class="writeup-excerpt">${escapeHtml(writeup.excerpt)}</p>
                <a href="writeups.html#${escapeHtml(writeup.id)}" class="read-more">
                    Read more <i class="fas fa-arrow-right"></i>
                </a>
            </article>`;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const writeups = [...window.GHOST_WRITEUPS].sort((a, b) => b.date.localeCompare(a.date));
        const latest = writeups.slice(0, 4);

        document.getElementById('blog-summaries').innerHTML = latest.map(renderSummaryCard).join('');
    });
})();