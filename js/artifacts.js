(function () {
    'use strict';

    let searchQuery = '';

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderPaths(paths) {
        if (!paths || !paths.length) return '<span class="artifact-muted">-</span>';
        return paths
            .map(
                (p) => `
            <div class="path-row">
                <code class="artifact-path">${escapeHtml(p)}</code>
                <button class="copy-btn copy-sm" data-copy-text="${escapeHtml(p)}" aria-label="Copy path">
                    <i class="fas fa-copy"></i>
                </button>
            </div>`
            )
            .join('');
    }

    function renderArtifact(artifact, categoryId) {
        const searchText = [
            artifact.name,
            artifact.description,
            ...(artifact.paths || []),
            artifact.registry,
            artifact.parser,
            artifact.notes,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return `
            <article class="artifact-card" data-search="${escapeHtml(searchText)}">
                <div class="artifact-header">
                    <h3>${escapeHtml(artifact.name)}</h3>
                    <span class="artifact-tag">${escapeHtml(categoryId)}</span>
                </div>
                <p class="artifact-desc">${escapeHtml(artifact.description)}</p>
                <div class="artifact-fields">
                    <div class="artifact-field">
                        <span class="field-label"><i class="fas fa-folder-open"></i> Location</span>
                        <div class="field-value paths-list">${renderPaths(artifact.paths)}</div>
                    </div>
                    ${
                        artifact.registry
                            ? `<div class="artifact-field">
                        <span class="field-label"><i class="fas fa-key"></i> Registry</span>
                        <div class="field-value">
                            <div class="path-row">
                                <code class="artifact-path">${escapeHtml(artifact.registry)}</code>
                                <button class="copy-btn copy-sm" data-copy-text="${escapeHtml(artifact.registry)}" aria-label="Copy registry key">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>`
                            : ''
                    }
                    ${
                        artifact.parser
                            ? `<div class="artifact-field">
                        <span class="field-label"><i class="fas fa-wrench"></i> Parser / Tool</span>
                        <div class="field-value"><span class="artifact-parser">${escapeHtml(artifact.parser)}</span></div>
                    </div>`
                            : ''
                    }
                    ${
                        artifact.notes
                            ? `<div class="artifact-field notes">
                        <span class="field-label"><i class="fas fa-info-circle"></i> Notes</span>
                        <div class="field-value"><span class="artifact-notes">${escapeHtml(artifact.notes)}</span></div>
                    </div>`
                            : ''
                    }
                </div>
            </article>`;
    }

    function render() {
        const data = window.GHOST_ARTIFACTS;
        const container = document.getElementById('artifacts-content');
        const nav = document.getElementById('section-nav');

        container.innerHTML = data
            .map(
                (cat) => `
            <section class="artifact-section" id="${cat.id}">
                <h2 class="tool-category">
                    <i class="fas ${cat.icon}"></i> ${escapeHtml(cat.title)}
                </h2>
                <div class="artifacts-grid">
                    ${cat.artifacts.map((a) => renderArtifact(a, cat.id)).join('')}
                </div>
            </section>`
            )
            .join('');

        nav.innerHTML = data
            .map((cat) => `<a href="#${cat.id}" class="section-pill">${escapeHtml(cat.title)}</a>`)
            .join('');

        bindCopyButtons();
        applySearch();
    }

    function bindCopyButtons() {
        document.querySelectorAll('[data-copy-text]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(btn.dataset.copyText);
                    btn.classList.add('copied');
                    showNotification('Copied to clipboard');
                    setTimeout(() => btn.classList.remove('copied'), 500);
                } catch {
                    showNotification('Failed to copy', true);
                }
            });
        });
    }

    function showNotification(message, isError = false) {
        const n = document.getElementById('notification');
        n.querySelector('span').textContent = message;
        n.classList.toggle('error', isError);
        n.classList.add('show');
        setTimeout(() => n.classList.remove('show'), 2000);
    }

    function applySearch() {
        const q = searchQuery.toLowerCase().trim();
        let visible = 0;

        document.querySelectorAll('.artifact-card').forEach((card) => {
            const match = !q || card.dataset.search.includes(q);
            card.classList.toggle('hidden', !match);
            if (match) visible++;
        });

        document.querySelectorAll('.artifact-section').forEach((section) => {
            const hasVisible = [...section.querySelectorAll('.artifact-card')].some(
                (c) => !c.classList.contains('hidden')
            );
            section.style.display = hasVisible ? '' : 'none';
        });

        let noResults = document.getElementById('no-results');
        if (visible === 0 && q) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'no-results';
                noResults.className = 'no-results';
                noResults.innerHTML = '<i class="fas fa-search"></i> No artifacts match your search';
                document.getElementById('artifacts-content').appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        render();

        document.getElementById('search-input').addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applySearch();
        });
    });
})();