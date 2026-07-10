window.GHOST_WRITEUPS = [
  {
    id: "web-recon-pipeline",
    title: "My Web Recon Pipeline: Nmap, Gobuster & Nuclei",
    excerpt: "How I chain port scanning, directory brute forcing, and template-based vuln scanning into a repeatable web recon workflow.",
    summary: "A practical walkthrough of my daily web recon stack — from initial port discovery through to Nuclei findings.",
    date: "2026-06-12",
    readTime: "7 min",
    category: "OffSec",
    tags: ["recon", "nmap", "gobuster", "nuclei"],
    content: `
      <p>Most of my web assessments start the same way. I want fast signal on what's running, what's hidden, and what's actually exploitable — without running every tool in isolation and drowning in output.</p>
      <h2>Phase 1 — Port & Service Discovery</h2>
      <p>I start with a focused Nmap scan against common web ports rather than a full <code>-p-</code> sweep on every target. Speed matters early in recon.</p>
      <pre><code>nmap -sV -sC -p 80,443,8000,8080,8443,8888 example.com -oA web-ports</code></pre>
      <p>The <code>-sC</code> default scripts often pull HTTP titles and SSL cert info that saves a separate pass later. If something interesting shows up on a non-standard port, I'll widen from there.</p>
      <h2>Phase 2 — Directory & Vhost Brute Force</h2>
      <p>Gobuster is my go-to for content discovery. Dir mode for paths, vhost mode when I suspect multiple sites on one IP.</p>
      <pre><code>gobuster dir -u https://example.com -w raft-medium-directories.txt -x php,html,js,bak -t 50
gobuster vhost -u https://example.com -w subdomains-top5000.txt -t 50</code></pre>
      <p>I keep wordlists lean. A medium SecLists list with smart extensions beats a massive list that runs for hours and gets WAF-blocked.</p>
      <h2>Phase 3 — Nuclei Sweep</h2>
      <p>Once I have live URLs from httpx, Nuclei does the heavy lifting for known CVEs and misconfigs.</p>
      <pre><code>cat alive.txt | nuclei -severity critical,high,medium -c 40 -o nuclei-results.txt</code></pre>
      <p>I usually run a broad pass first, then tag-specific scans (<code>-tags cve,exposure</code>) against anything that looked interesting in Gobuster output.</p>
      <h2>Key Takeaways</h2>
      <ul>
        <li>Don't full-port scan every target on day one — scope your ports to web services</li>
        <li>Feed tool output into the next tool; httpx is the glue between recon and scanning</li>
        <li>Save everything to files — you'll want timestamps and reproducibility during reporting</li>
      </ul>
    `
  },
  {
    id: "kape-triage-collection",
    title: "DFIR Triage Collection with KAPE",
    excerpt: "Collecting the right Windows artifacts in the first 30 minutes of an incident — without imaging the entire disk.",
    summary: "A focused guide to KAPE triage targets for rapid Windows incident response.",
    date: "2026-05-28",
    readTime: "9 min",
    category: "DFIR",
    tags: ["dfir", "windows", "kape", "triage"],
    content: `
      <p>When an incident lands, the first question isn't "how do I image this box?" — it's "what do I need right now to answer whether this host is compromised?"</p>
      <p>KAPE (Kroll Artifact Parser and Extractor) is built exactly for that. Targeted collection, fast turnaround, minimal footprint.</p>
      <h2>My Default Triage Command</h2>
      <pre><code>kape.exe --tsource C: --tdest \\\\evidence\\host01 --target !SANS_Triage --mdest \\\\evidence\\host01\\parsed --module !EZParser</code></pre>
      <p>The <code>!SANS_Triage</code> target grabs the high-value artifacts: Prefetch, AmCache, registry hives, event logs, Jump Lists, and more. EZParser modules then normalize them for timeline tools.</p>
      <h2>What I'm Looking For First</h2>
      <ul>
        <li><strong>Prefetch + BAM/DAM</strong> — what executed and when</li>
        <li><strong>AmCache</strong> — program execution with file hashes</li>
        <li><strong>Security.evtx</strong> — logons, process creation (4688)</li>
        <li><strong>PowerShell Operational</strong> — script block logging if enabled</li>
        <li><strong>Scheduled Tasks + Services</strong> — persistence indicators</li>
      </ul>
      <h2>Common Mistakes</h2>
      <p>Writing to the same drive you're collecting from. Always stage to external media or a network share. Also — don't skip <code>UsrClass.dat</code> if you need ShellBags; it's not in every target by default.</p>
    `
  },
  {
    id: "shellbags-amcache-prefetch",
    title: "Correlating ShellBags, AmCache & Prefetch",
    excerpt: "Three execution artifacts that tell different parts of the same story — and how I use them together on investigations.",
    summary: "Building a user activity timeline by combining ShellBags, AmCache, and Prefetch analysis.",
    date: "2026-05-10",
    readTime: "8 min",
    category: "DFIR",
    tags: ["dfir", "windows", "shellbags", "amcache", "prefetch"],
    content: `
      <p>Individually, ShellBags, AmCache, and Prefetch are useful. Together, they build a convincing picture of what a user did on a system — even when the original files are gone.</p>
      <h2>What Each Artifact Tells You</h2>
      <p><strong>Prefetch</strong> — binary execution, run count, last run time, files loaded. Lives at <code>C:\\Windows\\Prefetch\\</code>. Parse with PECmd.</p>
      <p><strong>AmCache</strong> — execution evidence with SHA1 hashes and compile timestamps. Hive at <code>C:\\Windows\\AppCompat\\Programs\\Amcache.hve</code>.</p>
      <p><strong>ShellBags</strong> — folder browsing history in UsrClass.dat. Proves a user opened a directory, even if it's since been deleted.</p>
      <h2>Correlation Workflow</h2>
      <ol>
        <li>Parse all three into a common timeline format (CSV)</li>
        <li>Normalize timestamps to UTC</li>
        <li>Look for Prefetch/AmCache execution events near ShellBag folder access</li>
        <li>Cross-reference with Security 4688 if process creation auditing was on</li>
      </ol>
      <p>The payoff: you can show a user browsed to a folder, executed a binary from it, and the binary was also recorded in AmCache — three independent sources, same narrative.</p>
    `
  },
  {
    id: "evtx-hunting-chainsaw",
    title: "Hunting in Windows Event Logs with Chainsaw",
    excerpt: "Sigma rules against EVTX logs — how I cut through millions of events to find the ones that matter.",
    summary: "Using Chainsaw and Sigma rules to hunt across collected Windows event logs.",
    date: "2026-04-22",
    readTime: "6 min",
    category: "DFIR",
    tags: ["dfir", "windows", "evtx", "sigma", "chainsaw"],
    content: `
      <p>Raw EVTX files are useless if you're just scrolling the Event Viewer. I collect logs with KAPE, parse with EvtxECmd, and hunt with Chainsaw + Sigma rules.</p>
      <h2>Collection</h2>
      <pre><code>wevtutil epl Security C:\\forensics\\Security.evtx
wevtutil epl "Microsoft-Windows-PowerShell/Operational" C:\\forensics\\PS.evtx</code></pre>
      <h2>Hunting Command</h2>
      <pre><code>chainsaw hunt C:\\forensics\\evtx\\ --sigma rules/ --mapping mappings/sigma-event-logs-all.yml -o results/</code></pre>
      <h2>Events I Prioritize</h2>
      <ul>
        <li><strong>4624/4625</strong> — logon success/failure, especially Type 10 (RDP)</li>
        <li><strong>4688</strong> — process creation (needs audit policy)</li>
        <li><strong>4698/4699</strong> — scheduled task created/deleted</li>
        <li><strong>4104</strong> — PowerShell script block logging</li>
        <li><strong>7045</strong> — new service installed (System log)</li>
      </ul>
      <p>Sigma rules give you community-vetted detection logic. Update your rules repo regularly — new rules drop after every major breach writeup.</p>
    `
  },
  {
    id: "volatility3-quickstart",
    title: "Volatility 3 Quickstart for Incident Response",
    excerpt: "The first six Vol3 plugins I run on every memory dump — and what I'm hoping to find with each one.",
    summary: "A rapid memory forensics workflow using Volatility 3 on Windows dumps.",
    date: "2026-04-05",
    readTime: "7 min",
    category: "DFIR",
    tags: ["dfir", "memory", "volatility"],
    content: `
      <p>Memory forensics feels overwhelming until you have a default plugin order. Here's mine — same sequence every dump, every time.</p>
      <h2>Step 1 — Identify the Image</h2>
      <pre><code>vol -f memory.dmp windows.info</code></pre>
      <p>Confirms OS version, kernel, and whether Vol3 recognizes the dump format. If this fails, stop and fix your dump before going further.</p>
      <h2>Step 2 — Process Enumeration</h2>
      <pre><code>vol -f memory.dmp windows.pslist
vol -f memory.dmp windows.pstree</code></pre>
      <p>Pstree is where injection and process hollowing show up — child processes where they shouldn't be, parents that don't match expected trees.</p>
      <h2>Step 3 — Network & Malware Indicators</h2>
      <pre><code>vol -f memory.dmp windows.netscan
vol -f memory.dmp windows.malfind</code></pre>
      <p>Netscan for C2 connections. Malfind for injected code regions. Dump suspicious processes with <code>windows.dumpfiles</code> for further static analysis.</p>
      <h2>When to Image Memory</h2>
      <p>Before you pull the plug on a potentially compromised host. Live response tools (KAPE, Velociraptor) for artifacts; memory for what's running right now that never touches disk.</p>
    `
  },
  {
    id: "recon-to-incident",
    title: "When Recon Becomes an Incident",
    excerpt: "That moment you find something during offensive work that triggers a full IR — how I document, escalate, and pivot.",
    summary: "Bridging offensive security findings into a structured incident response engagement.",
    date: "2026-03-18",
    readTime: "5 min",
    category: "Both",
    tags: ["offsec", "dfir", "workflow"],
    content: `
      <p>Not every finding is a bug bounty report. Sometimes you stumble into active compromise — webshells, lateral movement indicators, or data exfil in progress. The workflow changes immediately.</p>
      <h2>Stop and Document</h2>
      <p>Don't poke further without recording what you've seen. Screenshots, exact URLs, timestamps, request/response pairs. Your recon notes become the IR lead's initial briefing.</p>
      <h2>Escalate with Context</h2>
      <p>A good escalation includes: what you found, how you found it, what scope it appears to affect, and what you recommend <em>not</em> doing (e.g., don't restart the server yet).</p>
      <h2>Pivot to Collection</h2>
      <p>If you're the one doing IR: switch hats. KAPE triage on affected hosts, preserve logs before rotation, isolate if policy allows. Your Nmap/Nuclei output from recon is now evidence of attacker TTPs too.</p>
      <h2>The Overlap</h2>
      <p>Offsec and DFIR aren't separate disciplines — they're different phases of the same problem. The best operators are comfortable in both modes.</p>
    `
  }
];