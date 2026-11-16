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

    function renderFeature(writeup) {
        return `
            <a href="writeups.html#${escapeHtml(writeup.id)}" class="writeup-feature" data-search="${escapeHtml((writeup.title + writeup.summary + writeup.tags.join(' ')).toLowerCase())}" data-tags="${escapeHtml(writeup.tags.join(','))}">
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
                <div class="writeup-tags">${renderTags(writeup.tags)}</div>
            </a>`;
    }

    function renderRow(writeup) {
        return `
            <a href="writeups.html#${escapeHtml(writeup.id)}" class="writeup-row" data-search="${escapeHtml((writeup.title + writeup.summary + writeup.tags.join(' ')).toLowerCase())}" data-tags="${escapeHtml(writeup.tags.join(','))}">
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(writeup.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(writeup.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(writeup.readTime)}</span>
                    </div>
                </div>
                <h3>${escapeHtml(writeup.title)}</h3>
                <p class="writeup-summary">${escapeHtml(writeup.summary)}</p>
                <div class="writeup-tags">${renderTags(writeup.tags)}</div>
            </a>`;
    }

    function renderList() {
        const grid = document.getElementById('writeups-grid');
        const data = window.GHOST_WRITEUPS;

        if (!data.length) {
            grid.innerHTML =
                '<div class="no-results"><i class="fas fa-pen-nib"></i> No writeups yet - check back soon.</div>';
            return;
        }

        const [latest, ...rest] = data;
        grid.innerHTML =
            renderFeature(latest) +
            `<div class="writeup-list">${rest.map(renderRow).join('')}</div>`;
        applyFilters();
    }

    function renderDetail(id) {
        const writeup = window.GHOST_WRITEUPS.find((w) => w.id === id);
        const listView = document.getElementById('writeups-list-view');
        const detailView = document.getElementById('writeup-detail-view');

        if (!writeup) {
            document.body.classList.remove('reading');
            listView.style.display = '';
            detailView.style.display = 'none';
            return;
        }

        listView.style.display = 'none';
        detailView.style.display = 'block';
        document.body.classList.add('reading');
        detailView.innerHTML = `
            <a href="writeups.html" class="back-link" id="back-to-list">
                <i class="fas fa-arrow-left"></i> All writeups
            </a>
            <article class="writeup-article">
                <div class="writeup-card-header">
                    <span class="writeup-category">${escapeHtml(writeup.category)}</span>
                    <div class="writeup-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formatDate(writeup.date)}</span>
                        <span><i class="far fa-clock"></i> ${escapeHtml(writeup.readTime)}</span>
                    </div>
                </div>
                <h1>${escapeHtml(writeup.title)}</h1>
                <div class="writeup-tags">${renderTags(writeup.tags)}</div>
                <div class="writeup-body">${writeup.content}</div>
            </article>`;

        initArticle(detailView);

        document.getElementById('back-to-list').addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState('', '', 'writeups.html');
            showList();
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ---- attack chain: arrows, trace, evidence panel ---- */
    const CHAIN_COLORS = { confirmed: '#00d4ff', suspected: '#ffaa00', impact: '#ff3366', detected: '#00ffaa' };
    let redrawChain = null;

    function initChain(chain) {
        const edges = JSON.parse(chain.dataset.edges);
        const board = chain.querySelector('.chain-board');
        const svg = chain.querySelector('.chain-edges');
        const layer = svg.querySelector('g');
        const panel = chain.querySelector('.chain-panel');
        const nodes = [...chain.querySelectorAll('.chain-node')];
        const nodeOf = (id) => nodes.find((n) => n.dataset.id === id);
        let active = null;

        function pathFor(a, b, base) {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const body = a.closest('.chain-col-body');
            if (body === b.closest('.chain-col-body')) {
                const sibs = [...body.children];
                if (Math.abs(sibs.indexOf(a) - sibs.indexOf(b)) === 1) {
                    const down = ra.top < rb.top;
                    const x1 = ra.left + ra.width / 2 - base.left;
                    const y1 = (down ? ra.bottom : ra.top) - base.top;
                    const x2 = rb.left + rb.width / 2 - base.left;
                    const y2 = (down ? rb.top - 2 : rb.bottom + 2) - base.top;
                    const dy = Math.max(8, Math.abs(y2 - y1) / 2) * (down ? 1 : -1);
                    return `M${x1} ${y1} C${x1} ${y1 + dy},${x2} ${y2 - dy},${x2} ${y2}`;
                }
                // something sits in between: bow out into the gutter on the left
                const x1 = ra.left - base.left;
                const y1 = ra.top + ra.height / 2 - base.top;
                const x2 = rb.left - base.left - 2;
                const y2 = rb.top + rb.height / 2 - base.top;
                return `M${x1} ${y1} C${x1 - 22} ${y1},${x2 - 22} ${y2},${x2} ${y2}`;
            }
            const x1 = ra.right - base.left;
            const y1 = ra.top + ra.height / 2 - base.top;
            const x2 = rb.left - base.left - 2;
            const y2 = rb.top + rb.height / 2 - base.top;
            const dx = Math.max(14, Math.abs(x2 - x1) / 2);
            return `M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}`;
        }

        function draw() {
            layer.innerHTML = '';
            if (getComputedStyle(svg).display === 'none') return;
            const base = board.getBoundingClientRect();
            edges.forEach(([from, to, kind]) => {
                const a = nodeOf(from);
                const b = nodeOf(to);
                if (!a || !b) return;
                const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                p.setAttribute('d', pathFor(a, b, base));
                p.setAttribute('class', 'chain-edge' + (kind === 'suspected' ? ' suspected' : ''));
                p.setAttribute('marker-end', `url(#chain-ah-${kind})`);
                p.style.setProperty('--c', CHAIN_COLORS[kind] || CHAIN_COLORS.confirmed);
                p.dataset.from = from;
                p.dataset.to = to;
                layer.appendChild(p);
            });
            if (active) trace(active);
        }

        // everything upstream and downstream of one step
        function pathOf(id) {
            const up = new Set([id]);
            const down = new Set([id]);
            for (let grew = true; grew;) {
                grew = false;
                edges.forEach(([f, t]) => { if (up.has(t) && !up.has(f)) { up.add(f); grew = true; } });
            }
            for (let grew = true; grew;) {
                grew = false;
                edges.forEach(([f, t]) => { if (down.has(f) && !down.has(t)) { down.add(t); grew = true; } });
            }
            return new Set([...up, ...down]);
        }

        function trace(id) {
            const keep = pathOf(id);
            nodes.forEach((n) => {
                n.classList.toggle('dim', !keep.has(n.dataset.id));
                n.classList.toggle('active', n.dataset.id === id);
            });
            layer.querySelectorAll('.chain-edge').forEach((e) => {
                const on = keep.has(e.dataset.from) && keep.has(e.dataset.to);
                e.classList.toggle('dim', !on);
                e.classList.toggle('hot', on);
            });
        }

        function clear() {
            active = null;
            nodes.forEach((n) => n.classList.remove('dim', 'active'));
            layer.querySelectorAll('.chain-edge').forEach((e) => e.classList.remove('dim', 'hot'));
            panel.hidden = true;
            chain.appendChild(panel);
        }

        function select(id) {
            if (active === id) { clear(); return; }
            active = id;
            trace(id);
            const data = chain.querySelector(`.chain-data[data-for="${id}"]`);
            panel.className = 'chain-panel t-' + data.dataset.type;
            panel.innerHTML = '<button type="button" class="chain-close" aria-label="Close"><i class="fas fa-xmark"></i></button>' + data.innerHTML;
            panel.hidden = false;
            panel.querySelector('.chain-close').addEventListener('click', clear);
            // stacked layout: the evidence opens right under the step that was clicked
            if (getComputedStyle(svg).display === 'none') nodeOf(id).after(panel);
            else chain.appendChild(panel);
        }

        nodes.forEach((n) => n.addEventListener('click', () => select(n.dataset.id)));
        chain.addEventListener('keydown', (e) => { if (e.key === 'Escape') clear(); });
        redrawChain = draw;
        requestAnimationFrame(draw);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    }

    /* ---- "On this page" ---- */
    function initToc(body) {
        const heads = [...body.querySelectorAll(':scope > h2')];
        if (heads.length < 3) return;
        const toc = document.createElement('nav');
        toc.className = 'writeup-toc';
        toc.setAttribute('aria-label', 'On this page');
        const inner = document.createElement('div');
        inner.className = 'writeup-toc-inner';
        inner.innerHTML = '<span class="writeup-toc-label">On this page</span>';
        heads.forEach((h) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = h.textContent;
            b.addEventListener('click', () => h.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            inner.appendChild(b);
        });
        toc.appendChild(inner);
        body.appendChild(toc);
    }

    function syncToc() {
        const toc = document.querySelector('.writeup-toc');
        if (!toc || getComputedStyle(toc).display === 'none') return;
        const heads = [...document.querySelectorAll('.writeup-body > h2')];
        const buttons = toc.querySelectorAll('button');
        let current = 0;
        heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 130) current = i; });
        buttons.forEach((b, i) => b.classList.toggle('active', i === current));
        // the chain is wider than the text, so the list steps aside while it scrolls past
        const chain = document.querySelector('.writeup-body .chain');
        const r = toc.firstElementChild.getBoundingClientRect();
        const c = chain ? chain.getBoundingClientRect() : null;
        toc.classList.toggle('is-covered', !!c && c.top < r.bottom + 12 && c.bottom > r.top - 12);
    }

    function initArticle(view) {
        redrawChain = null;
        const body = view.querySelector('.writeup-body');
        const chain = body.querySelector('.chain');
        if (chain) initChain(chain);
        initToc(body);
        syncToc();
    }

    function showList() {
        document.body.classList.remove('reading');
        document.getElementById('writeups-list-view').style.display = '';
        document.getElementById('writeup-detail-view').style.display = 'none';
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

        document.querySelectorAll('#writeups-grid .writeup-feature, #writeups-grid .writeup-row').forEach((card) => {
            const tags = card.dataset.tags.split(',');
            const tagMatch = activeTag === 'all' || tags.includes(activeTag);
            const searchMatch = !q || card.dataset.search.includes(q);
            const show = tagMatch && searchMatch;
            card.classList.toggle('hidden', !show);
            if (show) visible++;
        });

        let noResults = document.getElementById('no-writeups');
        if (visible === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'no-writeups';
                noResults.className = 'no-results';
                noResults.innerHTML = '<i class="fas fa-search"></i> No writeups match your filters';
                document.getElementById('writeups-grid').appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    function renderTagFilters() {
        const container = document.getElementById('tag-filters');
        if (!window.GHOST_WRITEUPS.length) {
            container.innerHTML = '';
            return;
        }

        // One-off tags stay searchable but would only clutter the chip row.
        const counts = {};
        window.GHOST_WRITEUPS.forEach((w) => w.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
        const allTags = Object.keys(counts).filter((t) => counts[t] >= 2).sort();
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
        window.addEventListener('scroll', syncToc, { passive: true });
        window.addEventListener('resize', () => { if (redrawChain) redrawChain(); syncToc(); });
    });
})();