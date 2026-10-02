(function () {
    'use strict';

    const { escapeHtml, formatDate } = window.GhostCommon;
    let searchQuery = '';
    let activeTag = 'all';

    function renderTags(tags, clickable = false) {
        return tags
            .map((tag) => {
                const cls = clickable ? 'writeup-tag filter-tag' : 'writeup-tag';
                const data = clickable ? ` data-tag="${escapeHtml(tag)}"` : '';
                return `<span class="${cls}"${data}>#${escapeHtml(tag)}</span>`;
            })
            .join('');
    }

    function renderFeature(entry) {
        return `
            <a href="knowledge.html#${escapeHtml(entry.id)}" class="writeup-feature" data-search="${escapeHtml((entry.title + entry.summary + entry.tags.join(' ')).toLowerCase())}" data-tags="${escapeHtml(entry.tags.join(','))}">
                <div class="writeup-feature-label"><i class="fas fa-star"></i> Latest</div>
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(entry.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(entry.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(entry.readTime)}</span>
                    </div>
                </div>
                <h2>${escapeHtml(entry.title)}</h2>
                <p class="writeup-summary">${escapeHtml(entry.summary)}</p>
                <div class="writeup-tags">${renderTags(entry.tags)}</div>
            </a>`;
    }

    function renderRow(entry) {
        return `
            <a href="knowledge.html#${escapeHtml(entry.id)}" class="writeup-row" data-search="${escapeHtml((entry.title + entry.summary + entry.tags.join(' ')).toLowerCase())}" data-tags="${escapeHtml(entry.tags.join(','))}">
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(entry.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(entry.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(entry.readTime)}</span>
                    </div>
                </div>
                <h3>${escapeHtml(entry.title)}</h3>
                <p class="writeup-summary">${escapeHtml(entry.summary)}</p>
                <div class="writeup-tags">${renderTags(entry.tags)}</div>
            </a>`;
    }

    function renderList() {
        const grid = document.getElementById('knowledge-grid');
        const data = window.GHOST_KNOWLEDGE;

        if (!data.length) {
            grid.innerHTML =
                '<div class="no-results"><i class="fas fa-brain"></i> No knowledge notes yet - check back soon.</div>';
            return;
        }

        const [latest, ...rest] = data;
        grid.innerHTML =
            renderFeature(latest) +
            `<div class="writeup-list">${rest.map(renderRow).join('')}</div>`;
        applyFilters();
    }

    function renderDetail(id) {
        const entry = window.GHOST_KNOWLEDGE.find((w) => w.id === id);
        const listView = document.getElementById('knowledge-list-view');
        const detailView = document.getElementById('knowledge-detail-view');

        if (!entry) {
            listView.style.display = '';
            detailView.style.display = 'none';
            return;
        }

        listView.style.display = 'none';
        detailView.style.display = 'block';
        detailView.innerHTML = `
            <a href="knowledge.html" class="back-link" id="back-to-list">
                <i class="fas fa-arrow-left"></i> All notes
            </a>
            <article class="writeup-article">
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(entry.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(entry.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(entry.readTime)}</span>
                    </div>
                </div>
                <h1>${escapeHtml(entry.title)}</h1>
                <div class="writeup-tags">${renderTags(entry.tags)}</div>
                <div class="writeup-body">${entry.content}</div>
            </article>`;

        document.getElementById('back-to-list').addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState('', '', 'knowledge.html');
            showList();
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showList() {
        document.getElementById('knowledge-list-view').style.display = '';
        document.getElementById('knowledge-detail-view').style.display = 'none';
    }

    function bindTagFilters() {
        document.querySelectorAll('#tag-filters .filter-tag').forEach((tag) => {
            tag.addEventListener('click', () => {
                activeTag = tag.dataset.tag;
                document.querySelectorAll('#tag-filters .filter-tag').forEach((t) => t.classList.remove('active'));
                tag.classList.add('active');
                applyFilters();
            });
        });
    }

    function applyFilters() {
        const q = searchQuery.toLowerCase().trim();
        let visible = 0;

        document.querySelectorAll('#knowledge-grid .writeup-feature, #knowledge-grid .writeup-row').forEach((card) => {
            const tags = card.dataset.tags.split(',');
            const tagMatch = activeTag === 'all' || tags.includes(activeTag);
            const searchMatch = !q || card.dataset.search.includes(q);
            const show = tagMatch && searchMatch;
            card.classList.toggle('hidden', !show);
            if (show) visible++;
        });

        let noResults = document.getElementById('no-knowledge');
        if (visible === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'no-knowledge';
                noResults.className = 'no-results';
                noResults.innerHTML = '<i class="fas fa-search"></i> No notes match your filters';
                document.getElementById('knowledge-grid').appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    function renderTagFilters() {
        const container = document.getElementById('tag-filters');
        if (!window.GHOST_KNOWLEDGE.length) {
            container.innerHTML = '';
            return;
        }

        const allTags = [...new Set(window.GHOST_KNOWLEDGE.flatMap((w) => w.tags))].sort();
        container.innerHTML =
            '<button class="filter-tag active" data-tag="all">All</button>' +
            allTags.map((t) => `<button class="filter-tag" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`).join('');
    }

    function handleRoute() {
        const hash = location.hash.replace('#', '');
        if (hash) {
            renderDetail(hash);
        } else {
            showList();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderTagFilters();
        bindTagFilters();
        renderList();
        handleRoute();

        document.getElementById('search-input').addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilters();
        });

        window.addEventListener('hashchange', handleRoute);
    });
})();
