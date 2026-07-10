(function () {
    'use strict';

    let offsecData = [];
    let dfirData = [];
    let commandTemplates = {};
    let activeTab = 'offsec';
    let searchQuery = '';

    const iconMap = {
        subdomain: 'fa-sitemap',
        urls: 'fa-link',
        sensitive: 'fa-eye',
        xss: 'fa-code',
        lfi: 'fa-file-code',
        cors: 'fa-globe',
        wordpress: 'fa-wordpress',
        network: 'fa-network-wired',
        'web-recon': 'fa-spider',
        parameters: 'fa-cogs',
        javascript: 'fa-code',
        'content-type': 'fa-file-code',
        shodan: 'fa-search',
        'ffuf-request': 'fa-file-code',
        advanced: 'fa-bolt',
    };

    const toolsRef = [
        { name: 'Volatility 3', desc: 'Memory forensics framework', url: 'https://github.com/volatilityfoundation/volatility3' },
        { name: 'KAPE', desc: 'Kroll Artifact Parser and Extractor', url: 'https://www.kroll.com/en/services/cyber-risk/incident-response-litigation-support/kroll-artifact-parser-extractor-kape' },
        { name: 'Velociraptor', desc: 'Endpoint visibility and collection', url: 'https://github.com/Velocidex/velociraptor' },
        { name: 'Eric Zimmerman Tools', desc: 'MFTECmd, PECmd, EvtxECmd, and more', url: 'https://ericzimmerman.github.io/' },
        { name: 'Nuclei', desc: 'Template-based vulnerability scanner', url: 'https://github.com/projectdiscovery/nuclei' },
        { name: 'Gobuster', desc: 'Directory, vhost, and DNS brute forcing', url: 'https://github.com/OJ/gobuster' },
        { name: 'Nmap', desc: 'Network discovery and security auditing', url: 'https://nmap.org/' },
        { name: 'FFuF', desc: 'Fast web fuzzer', url: 'https://github.com/ffuf/ffuf' },
        { name: 'Subfinder', desc: 'Subdomain discovery', url: 'https://github.com/projectdiscovery/subfinder' },
        { name: 'Burp Suite', desc: 'Web application security testing', url: 'https://portswigger.net/burp' },
        { name: 'Wireshark', desc: 'Network protocol analyzer', url: 'https://www.wireshark.org/' },
        { name: 'YARA', desc: 'Pattern matching for malware', url: 'https://github.com/VirusTotal/yara' },
        { name: 'Autopsy', desc: 'Digital forensics platform', url: 'https://www.autopsy.com/' },
        { name: 'Chainsaw', desc: 'Sigma-powered EVTX hunting', url: 'https://github.com/WithSecure/chainsaw' },
    ];

    async function loadData() {
        if (window.GHOST_DATA) {
            offsecData = window.GHOST_DATA.offsec;
            dfirData = window.GHOST_DATA.dfir;
            return;
        }
        const [offsecRes, dfirRes] = await Promise.all([
            fetch('js/offsec-commands.json'),
            fetch('js/dfir-commands.json'),
        ]);
        offsecData = await offsecRes.json();
        dfirData = await dfirRes.json();
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderCommandCard(cmd, section) {
        const id = `${section}-${cmd.id}`;
        commandTemplates[id] = cmd.command;
        return `
            <div class="tool-card" data-search="${escapeHtml((cmd.title + ' ' + cmd.description + ' ' + cmd.command).toLowerCase())}">
                <div class="tool-header">
                    <h3>${escapeHtml(cmd.title)}</h3>
                    <button class="copy-btn" data-copy="${id}" aria-label="Copy command">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="tool-description">${escapeHtml(cmd.description)}</div>
                <div class="terminal-box">
                    <span class="prompt" aria-hidden="true"></span>
                    <span class="command" id="${id}">${escapeHtml(cmd.command)}</span>
                </div>
            </div>`;
    }

    function renderSection(category, section) {
        const icon = category.icon || iconMap[category.id] || 'fa-terminal';
        const cards = category.commands.map((c) => renderCommandCard(c, section)).join('');
        return `
            <h2 class="tool-category" id="${section}-${category.id}">
                <i class="fas ${icon}"></i> ${escapeHtml(category.title)}
            </h2>
            <div class="tools-container" data-section="${section}-${category.id}">
                ${cards}
            </div>`;
    }

    function renderPanels() {
        const offsecPanel = document.getElementById('offsec-panel');
        const dfirPanel = document.getElementById('dfir-panel');

        offsecPanel.innerHTML = offsecData.map((c) => renderSection(c, 'offsec')).join('');
        dfirPanel.innerHTML = dfirData.map((c) => renderSection(c, 'dfir')).join('');

        renderSectionNav();
        renderToolsRef();
        bindCopyButtons();
        applySearch();
    }

    function renderSectionNav() {
        const nav = document.getElementById('section-nav');
        const data = activeTab === 'offsec' ? offsecData : activeTab === 'dfir' ? dfirData : [];
        nav.innerHTML = data
            .map(
                (c) =>
                    `<a href="#${activeTab}-${c.id}" class="section-pill">${escapeHtml(c.title)}</a>`
            )
            .join('');
    }

    function renderToolsRef() {
        const grid = document.getElementById('tools-ref-grid');
        grid.innerHTML = toolsRef
            .map(
                (t) => `
            <div class="tool-ref-card">
                <h3>${escapeHtml(t.name)}</h3>
                <p>${escapeHtml(t.desc)}</p>
                <a href="${t.url}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> View
                </a>
            </div>`
            )
            .join('');
    }

    function bindCopyButtons() {
        document.querySelectorAll('.copy-btn[data-copy]').forEach((btn) => {
            btn.addEventListener('click', () => copyCommand(btn.dataset.copy, btn));
        });
    }

    function fixCommandSpacing(text) {
        return text
            .replace(/\s{2,}/g, ' ')
            .replace(/([^\s\n])(cat|echo|grep|sed|awk|cut|sort|uniq|tee|xargs|curl)\s/g, '$1 $2 ')
            .replace(/([^\s\n])\|([^\s\n])/g, '$1 | $2')
            .replace(/([^\s\n])(\>|\>\>)/g, '$1 $2')
            .trim();
    }

    async function copyCommand(id, btn) {
        const el = document.getElementById(id);
        if (!el) return;
        try {
            await navigator.clipboard.writeText(fixCommandSpacing(el.textContent));
            if (btn) {
                btn.classList.add('copied');
                setTimeout(() => btn.classList.remove('copied'), 500);
            }
            showNotification('Command copied to clipboard');
        } catch {
            showNotification('Failed to copy command', true);
        }
    }

    function showNotification(message, isError = false) {
        const n = document.getElementById('notification');
        n.querySelector('span').textContent = message;
        n.classList.toggle('error', isError);
        n.classList.add('show');
        setTimeout(() => n.classList.remove('show'), 2000);
    }

    function updateDomain(domain) {
        document.querySelectorAll('#offsec-panel .command').forEach((el) => {
            const template = commandTemplates[el.id];
            if (!template) return;
            el.textContent = template.replace(/example\.com/g, domain);
        });
        showNotification(`OffSec commands updated for: ${domain}`);
    }

    function applySearch() {
        const q = searchQuery.toLowerCase().trim();
        const panel = document.getElementById(`${activeTab}-panel`);
        if (!panel) return;

        let visible = 0;
        panel.querySelectorAll('.tool-card').forEach((card) => {
            const match = !q || card.dataset.search.includes(q);
            card.classList.toggle('hidden', !match);
            if (match) visible++;
        });

        panel.querySelectorAll('.tool-category').forEach((header) => {
            const container = header.nextElementSibling;
            if (!container) return;
            const hasVisible = [...container.querySelectorAll('.tool-card')].some(
                (c) => !c.classList.contains('hidden')
            );
            header.style.display = hasVisible ? '' : 'none';
            container.style.display = hasVisible ? '' : 'none';
        });

        let noResults = panel.querySelector('.no-results');
        if (visible === 0 && q) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = '<i class="fas fa-search"></i> No commands match your search';
                panel.appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    function switchTab(tab) {
        activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });
        document.querySelectorAll('.panel').forEach((p) => {
            p.classList.toggle('active', p.id === `${tab}-panel`);
        });
        document.getElementById('domain-form').style.display = tab === 'offsec' ? '' : 'none';
        document.getElementById('section-nav').style.display = tab === 'tools' ? 'none' : '';
        renderSectionNav();
        applySearch();
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await loadData();
            renderPanels();
        } catch (err) {
            console.error(err);
            document.getElementById('offsec-panel').innerHTML =
                '<div class="no-results">Failed to load command data. Serve via a local web server or check js/data.js.</div>';
        }

        document.getElementById('domain-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const domain = document.getElementById('domain-input').value.trim();
            if (domain) updateDomain(domain);
        });

        document.getElementById('search-input').addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applySearch();
        });

        document.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

    });
})();