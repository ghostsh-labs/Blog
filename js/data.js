window.GHOST_DATA = {
  "offsec": [
    {
      "id": "nmap",
      "title": "Nmap",
      "order": 1,
      "icon": "fa-network-wired",
      "defaultOpen": true,
      "commands": [
        {
          "id": "nmap-quick",
          "title": "Quick Scan - Top Ports + Version",
          "description": "Fast service detection on the most common ports.",
          "command": "nmap -sV -sC -T4 example.com -oA nmap-quick"
        },
        {
          "id": "nmap-web-ports",
          "title": "Web Port Scan",
          "description": "Common web and app ports with version detection.",
          "command": "nmap -sV -sC -p 80,443,8000,8080,8443,8888,3000,5000,9000 example.com -oA web-ports"
        },
        {
          "id": "nmap-full",
          "title": "Full Port Scan",
          "description": "All TCP ports with aggressive timing and OS/service detection.",
          "command": "nmap -p- --min-rate 1000 -T4 -A example.com -oA fullscan"
        },
        {
          "id": "nmap-http-scripts",
          "title": "HTTP Enumeration Scripts",
          "description": "NSE scripts for titles, headers, methods, and tech fingerprinting.",
          "command": "nmap -p 80,443 --script=http-title,http-headers,http-methods,http-server-header,http-enum -oA http-enum example.com"
        },
        {
          "id": "nmap-ssl-scan",
          "title": "SSL/TLS Analysis",
          "description": "Certificate details, cipher enumeration, and known SSL issues.",
          "command": "nmap -p 443 --script ssl-cert,ssl-enum-ciphers,ssl-heartbleed -oA ssl-scan example.com"
        },
        {
          "id": "naabu-nmap",
          "title": "Naabu \u2192 Nmap Service Scan",
          "description": "Port discovery with Naabu, then Nmap service/script scan on hits.",
          "command": "naabu -host example.com -c 50 -nmap-cli 'nmap -sV -sC' -o naabu-full.txt"
        },
        {
          "id": "masscan",
          "title": "Masscan - Full Range",
          "description": "High-speed full TCP range scan. Follow up open ports with Nmap.",
          "command": "masscan -p0-65535 example.com --rate 100000 -oG masscan-results.txt"
        }
      ]
    },
    {
      "id": "nuclei",
      "title": "Nuclei",
      "order": 2,
      "icon": "fa-radiation",
      "defaultOpen": true,
      "commands": [
        {
          "id": "nuclei-single",
          "title": "Single Target - All Templates",
          "description": "Run the full Nuclei template set against one URL.",
          "command": "nuclei -u https://example.com -o nuclei-single.txt"
        },
        {
          "id": "nuclei-severity",
          "title": "Critical & High Only",
          "description": "Filter findings to critical and high severity.",
          "command": "nuclei -u https://example.com -severity critical,high -o nuclei-critical.txt"
        },
        {
          "id": "nuclei-panels",
          "title": "Panels / Default Login / Exposure",
          "description": "Focused scan for admin panels, default creds, and exposed services.",
          "command": "nuclei -u https://example.com -tags panel,default-login,exposure,misconfig -severity medium,high,critical -o nuclei-panels.txt"
        },
        {
          "id": "nuclei-tags",
          "title": "Tagged Templates (CVE / Exposure)",
          "description": "Focused scan using cve, exposure, and misconfig tags.",
          "command": "nuclei -u https://example.com -tags cve,exposure,misconfig -o nuclei-tagged.txt"
        },
        {
          "id": "nuclei-list",
          "title": "Scan URL List",
          "description": "Run Nuclei against a list of live URLs from recon output.",
          "command": "cat alive-urls.txt | nuclei -t nuclei-templates/ -severity medium,high,critical -c 50 -o nuclei-results.txt"
        },
        {
          "id": "nuclei-cors",
          "title": "CORS Misconfiguration Templates",
          "description": "CORS-specific templates across a list of live hosts.",
          "command": "cat example.coms.txt | httpx -silent | nuclei -t nuclei-templates/vulnerabilities/cors/ -o cors_results.txt"
        }
      ]
    },
    {
      "id": "web-recon",
      "title": "Web Recon",
      "order": 3,
      "icon": "fa-spider",
      "defaultOpen": true,
      "commands": [
        {
          "id": "httpx-single",
          "title": "Httpx - Single Target",
          "description": "Probe a URL for status, title, tech stack, and IP.",
          "command": "httpx -u https://example.com -title -tech-detect -status-code -server -ip -follow-redirects -o httpx-out.txt"
        },
        {
          "id": "httpx-ip",
          "title": "Httpx - Probe External IP",
          "description": "Check an IP for live web services on common ports (C2/panel triage).",
          "command": "echo example.com | httpx -ip -title -tech-detect -status-code -server -ports 80,443,8080,8443,8000,8888 -o ip-probe.txt"
        },
        {
          "id": "curl-headers",
          "title": "curl - Response Headers",
          "description": "Quick header grab for server, redirects, and security headers.",
          "command": "curl -sI https://example.com"
        },
        {
          "id": "curl-follow",
          "title": "curl - Follow Redirect Chain",
          "description": "Trace redirect chain and final response headers.",
          "command": "curl -sIL https://example.com"
        },
        {
          "id": "gobuster-dir",
          "title": "Gobuster - Directory Brute Force",
          "description": "Discover hidden directories and files on a web server.",
          "command": "gobuster dir -u https://example.com -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,html,js,txt,bak -t 50 -o gobuster-dirs.txt"
        },
        {
          "id": "gobuster-vhost",
          "title": "Gobuster - Vhost Discovery",
          "description": "Brute force virtual hosts on the same IP.",
          "command": "gobuster vhost -u https://example.com -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t 50 -o gobuster-vhosts.txt"
        }
      ]
    },
    {
      "id": "full-scans",
      "title": "Full Scans & Pipelines",
      "order": 4,
      "icon": "fa-layer-group",
      "commands": [
        {
          "id": "web-recon-pipeline",
          "title": "Web Recon Pipeline",
          "description": "Port scan \u2192 probe live hosts \u2192 directory brute \u2192 Nuclei.",
          "command": "nmap -sV -p 80,443,8080,8443 example.com -oG - | awk '/Status: Open/{print $2}' | httpx -silent -o alive.txt && gobuster dir -u https://example.com -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -q -o gobuster.txt && nuclei -l alive.txt -severity critical,high -o nuclei.txt"
        },
        {
          "id": "httpx-nuclei",
          "title": "Httpx \u2192 Nuclei Sweep",
          "description": "Probe hosts for live web services, then Nuclei scan.",
          "command": "cat targets.txt | httpx -silent -status-code -title -tech-detect -o alive.txt && nuclei -l alive.txt -severity critical,high,medium -c 40 -o nuclei-sweep.txt"
        },
        {
          "id": "nmap-httpx-nuclei",
          "title": "Nmap \u2192 Httpx \u2192 Nuclei",
          "description": "Port scan an IP, probe web ports, then vulnerability scan.",
          "command": "nmap -sV -p 80,443,8080,8443 example.com -oG - | awk '/Status: Open/{print $2}' | httpx -silent -o alive.txt && nuclei -l alive.txt -tags panel,exposure,cve -severity high,critical -o nuclei.txt"
        }
      ]
    },
    {
      "id": "sensitive",
      "title": "Sensitive Data & Panels",
      "order": 5,
      "icon": "fa-eye",
      "commands": [
        {
          "id": "git-detection",
          "title": "Git Repository Detection",
          "description": "Probe hosts for exposed .git directories.",
          "command": "echo https://example.com | httpx -path \"/.git/\" -mc 200 -location -ms \"Index of\" -probe"
        },
        {
          "id": "s3-buckets",
          "title": "AWS S3 Bucket Finder",
          "description": "Scan for S3 buckets associated with the target domain.",
          "command": "s3scanner scan -d example.com"
        },
        {
          "id": "api-keys",
          "title": "API Key Finder (JS)",
          "description": "Search JavaScript files for exposed keys and tokens.",
          "command": "cat allurls.txt | grep -E \"\\.js$\" | httpx -mc 200 -content-type | grep -E \"application/javascript|text/javascript\" | cut -d' ' -f1 | xargs -I% curl -s % | grep -E \"(API_KEY|api_key|apikey|secret|token|password)\""
        },
        {
          "id": "sensitive-files",
          "title": "Sensitive File Detection",
          "description": "Grep collected URLs for sensitive file extensions.",
          "command": "cat allurls.txt | grep -E \"\\.xls|\\.xml|\\.xlsx|\\.json|\\.pdf|\\.sql|\\.doc|\\.docx|\\.pptx|\\.txt|\\.zip|\\.tar\\.gz|\\.tgz|\\.bak|\\.7z|\\.rar|\\.log|\\.cache|\\.secret|\\.db|\\.backup|\\.yml|\\.gz|\\.config|\\.csv|\\.yaml|\\.md|\\.md5\""
        }
      ]
    },
    {
      "id": "urls",
      "title": "URL Collection",
      "order": 6,
      "icon": "fa-link",
      "commands": [
        {
          "id": "gau-urls",
          "title": "GAU URL Collection",
          "description": "Collect historical URLs with gau and filter for parameters.",
          "command": "echo example.com | gau --mc 200 | urldedupe > urls.txt"
        },
        {
          "id": "katana-passive",
          "title": "Katana - Passive URL Collection",
          "description": "Collect URLs from passive sources via katana.",
          "command": "katana -u https://example.com -d 5 -ps -pss waybackarchive,commoncrawl,alienvault -kf -jc -fx -ef woff,css,png,svg,jpg,woff2,jpeg,gif,svg -o allurls.txt"
        },
        {
          "id": "katana-gau",
          "title": "Katana + GAU Combined",
          "description": "Multi-source URL collection and deduplication.",
          "command": "echo example.com | gau --mc 200 | urldedupe > urls.txt && katana -u https://example.com -d 5 -o katana-urls.txt"
        }
      ]
    },
    {
      "id": "subdomain",
      "title": "Subdomain Enumeration",
      "order": 7,
      "icon": "fa-sitemap",
      "commands": [
        {
          "id": "subfinder-basic",
          "title": "Subfinder - Basic Discovery",
          "description": "Recursive subdomain enumeration with subfinder.",
          "command": "subfinder -d example.com -all -recursive > subexample.com.txt"
        },
        {
          "id": "httpx-filter",
          "title": "Httpx - Live Subdomain Filter",
          "description": "Filter discovered subdomains to alive hosts on common web ports.",
          "command": "cat subexample.com.txt | httpx -ports 80,443,8080,8000,8888 -threads 200 -o subexample.coms_alive.txt"
        },
        {
          "id": "gobuster-dns",
          "title": "Gobuster - DNS Subdomain Enum",
          "description": "Enumerate subdomains via DNS brute force.",
          "command": "gobuster dns -d example.com -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-110000.txt -t 50 -o gobuster-dns.txt"
        },
        {
          "id": "subzy-check",
          "title": "Subzy - Takeover Check",
          "description": "Check for subdomain takeover vulnerabilities.",
          "command": "subzy run --targets subexample.coms.txt --concurrency 100 --hide_fails --verify_ssl"
        }
      ]
    },
    {
      "id": "xss",
      "title": "XSS Testing",
      "order": 8,
      "icon": "fa-code",
      "commands": [
        {
          "id": "xss-pipeline",
          "title": "XSS Hunting Pipeline",
          "description": "URL collection \u2192 parameter filter \u2192 reflected XSS check.",
          "command": "echo https://example.com/ | gau | gf xss | uro | Gxss | kxss | tee xss_output.txt"
        },
        {
          "id": "dalfox-xss",
          "title": "Dalfox Scan",
          "description": "Scan parameterized URLs with Dalfox and blind XSS callback.",
          "command": "cat xss_params.txt | dalfox pipe --blind https://your-collaborator-url --waf-bypass --silence"
        },
        {
          "id": "stored-xss",
          "title": "Stored XSS - Form Endpoints",
          "description": "Nuclei XSS templates against auth-related endpoints.",
          "command": "cat urls.txt | grep -E \"(login|signup|register|forgot|password|reset)\" | httpx -silent | nuclei -t nuclei-templates/vulnerabilities/xss/ -severity critical,high"
        }
      ]
    },
    {
      "id": "lfi",
      "title": "LFI Testing",
      "order": 9,
      "icon": "fa-file-code",
      "commands": [
        {
          "id": "lfi-method",
          "title": "LFI with FFuF",
          "description": "Parameter fuzzing for local file inclusion using ffuf.",
          "command": "echo \"https://example.com/\" | gau | gf lfi | uro | sed 's/=.*/=/' | qsreplace \"FUZZ\" | sort -u | xargs -I{} ffuf -u {} -w payloads/lfi.txt -c -mr \"root:(x|\\*|\\$[^\\:]*):0:0:\" -v"
        }
      ]
    },
    {
      "id": "cors",
      "title": "CORS Testing",
      "order": 10,
      "icon": "fa-globe",
      "commands": [
        {
          "id": "cors-check",
          "title": "Manual CORS Check",
          "description": "Send a cross-origin request and inspect response headers.",
          "command": "curl -H \"Origin: http://example.com\" -I https://example.com/wp-json/"
        },
        {
          "id": "corscanner",
          "title": "CORScanner",
          "description": "Automated CORS misconfiguration scanner.",
          "command": "python3 CORScanner.py -u https://example.com -d -t 10"
        },
        {
          "id": "cors-reflection",
          "title": "Origin Reflection Test",
          "description": "Test whether the server reflects arbitrary origins in ACAO header.",
          "command": "curl -H \"Origin: https://evil.com\" -I https://example.com/api/data | grep -i \"access-control-allow-origin: https://evil.com\""
        }
      ]
    },
    {
      "id": "ffuf",
      "title": "FFuF",
      "order": 11,
      "icon": "fa-bolt",
      "commands": [
        {
          "id": "ffuf-lfi",
          "title": "LFI - Request File",
          "description": "Bruteforce LFI using a saved HTTP request file.",
          "command": "ffuf -request lfi -request-proto https -w /usr/share/wordlists/offensive-payloads/LFI-payload.txt -c -mr \"root:\""
        },
        {
          "id": "ffuf-xss",
          "title": "XSS - Request File",
          "description": "Bruteforce XSS using a saved HTTP request file.",
          "command": "ffuf -request xss -request-proto https -w /usr/share/wordlists/xss-payloads.txt -c -mr \"<script>alert('XSS')</script>\""
        }
      ]
    },
    {
      "id": "parameters",
      "title": "Parameter Discovery",
      "order": 12,
      "icon": "fa-cogs",
      "commands": [
        {
          "id": "arjun-passive",
          "title": "Arjun - Passive",
          "description": "Passive parameter discovery with Arjun.",
          "command": "arjun -u https://example.com/endpoint.php -oT arjun_output.txt -t 10 --rate-limit 10 --passive -m GET,POST --headers \"User-Agent: Mozilla/5.0\""
        },
        {
          "id": "arjun-wordlist",
          "title": "Arjun - Wordlist",
          "description": "Active parameter discovery with a custom wordlist.",
          "command": "arjun -u https://example.com/endpoint.php -oT arjun_output.txt -m GET,POST -w /usr/share/wordlists/seclists/Discovery/Web-Content/burp-parameter-names.txt -t 10 --rate-limit 10"
        }
      ]
    },
    {
      "id": "javascript",
      "title": "JavaScript Analysis",
      "order": 13,
      "icon": "fa-js",
      "commands": [
        {
          "id": "js-hunting",
          "title": "JS File Collection + Nuclei",
          "description": "Crawl for JS files and scan with exposure templates.",
          "command": "echo example.com | katana -d 5 | grep -E \"\\.js$\" | nuclei -t nuclei-templates/http/exposures/ -c 30"
        },
        {
          "id": "js-analysis",
          "title": "JS File Nuclei Scan",
          "description": "Run Nuclei exposure templates against collected JS URLs.",
          "command": "cat alljs.txt | nuclei -t nuclei-templates/http/exposures/"
        }
      ]
    },
    {
      "id": "wordpress",
      "title": "WordPress",
      "order": 14,
      "icon": "fa-wordpress",
      "commands": [
        {
          "id": "wpscan",
          "title": "WPScan - Aggressive",
          "description": "Enumerate users, plugins, and themes with aggressive plugin detection.",
          "command": "wpscan --url https://example.com --disable-tls-checks --api-token YOUR_TOKEN -e at -e ap -e u --enumerate ap --plugins-detection aggressive --force"
        }
      ]
    },
    {
      "id": "shodan",
      "title": "Shodan Dorks",
      "order": 15,
      "icon": "fa-search",
      "commands": [
        {
          "id": "shodan-ssl",
          "title": "SSL Certificate Search",
          "description": "Find hosts with certificates issued for the target domain.",
          "command": "Ssl.cert.subject.CN:\"example.com\" 200"
        },
        {
          "id": "shodan-ip",
          "title": "Shodan - IP Lookup",
          "description": "Look up services and banners on a known external IP.",
          "command": "ip:example.com"
        }
      ]
    }
  ],
  "dfir": [
    {
      "id": "kape",
      "title": "KAPE",
      "order": 1,
      "icon": "fa-box-archive",
      "defaultOpen": true,
      "commands": [
        {
          "id": "kape-triage",
          "title": "SANS Triage Collection",
          "description": "Rapid artifact collection using the !SANS_Triage target.",
          "command": "kape.exe --tsource C: --tdest C:\\kape_out --target !SANS_Triage"
        },
        {
          "id": "kape-triage-remote",
          "title": "SANS Triage \u2192 Network Share",
          "description": "Collect triage artifacts to a UNC path or external drive.",
          "command": "kape.exe --tsource C: --tdest \\\\share\\evidence\\HOSTNAME --target !SANS_Triage"
        },
        {
          "id": "kape-ezparser",
          "title": "Collect + Parse with EZTools",
          "description": "Triage collection then run !EZParser modules on output.",
          "command": "kape.exe --tsource C: --tdest C:\\kape_out --target !SANS_Triage --mdest C:\\kape_out --module !EZParser"
        },
        {
          "id": "kape-target-list",
          "title": "List Available Targets",
          "description": "Show installed KAPE targets before running a collection.",
          "command": "kape.exe --tsource C: --tdest C:\\kape_out --target list"
        }
      ]
    },
    {
      "id": "velociraptor",
      "title": "Velociraptor",
      "order": 2,
      "icon": "fa-feather",
      "commands": [
        {
          "id": "velo-pslist",
          "title": "Running Processes",
          "description": "List processes on an endpoint via VQL.",
          "command": "SELECT Pid, Name, CommandLine, Username, Exe FROM pslist()"
        },
        {
          "id": "velo-netstat",
          "title": "Network Connections",
          "description": "Active connections and listening ports.",
          "command": "SELECT Pid, Name, Laddr, Raddr, Status FROM netstat()"
        },
        {
          "id": "velo-authenticode",
          "title": "Unsigned Binary Check",
          "description": "Find executables missing valid Authenticode signatures.",
          "command": "SELECT FullPath, Authenticode FROM Authenticode().WHERE(Authenticode.Trusted != 'trusted')"
        },
        {
          "id": "velo-collect",
          "title": "Collect Forensic Artifacts",
          "description": "Run a built-in artifact collection (adjust artifact name as needed).",
          "command": "SELECT * FROM Artifact.Windows.KapeFiles.Targets()"
        }
      ]
    },
    {
      "id": "winpmem",
      "title": "WinPmem",
      "order": 3,
      "icon": "fa-memory",
      "commands": [
        {
          "id": "winpmem-acquire",
          "title": "Acquire Memory Dump",
          "description": "Capture physical memory to a raw image file.",
          "command": "winpmem.exe memory.raw"
        },
        {
          "id": "winpmem-write-protected",
          "title": "Acquire (Write-Protected Driver)",
          "description": "Memory capture using the recommended write-protected acquisition method.",
          "command": "winpmem_mini_x64.exe memory.raw"
        }
      ]
    },
    {
      "id": "volatility",
      "title": "Volatility 3",
      "order": 4,
      "icon": "fa-microchip",
      "defaultOpen": true,
      "commands": [
        {
          "id": "vol3-info",
          "title": "System Info",
          "description": "Identify OS, kernel version, and architecture from the dump.",
          "command": "vol -f memory.raw windows.info"
        },
        {
          "id": "vol3-pslist",
          "title": "Process List",
          "description": "Enumerate running processes at time of capture.",
          "command": "vol -f memory.raw windows.pslist"
        },
        {
          "id": "vol3-pstree",
          "title": "Process Tree",
          "description": "Parent-child process relationships for spotting anomalies.",
          "command": "vol -f memory.raw windows.pstree"
        },
        {
          "id": "vol3-netscan",
          "title": "Network Connections",
          "description": "Active connections and listening ports from memory.",
          "command": "vol -f memory.raw windows.netscan"
        },
        {
          "id": "vol3-malfind",
          "title": "Injected Code (malfind)",
          "description": "Find suspicious memory regions and injected code.",
          "command": "vol -f memory.raw windows.malfind"
        },
        {
          "id": "vol3-cmdline",
          "title": "Process Command Lines",
          "description": "Recover command-line arguments for processes.",
          "command": "vol -f memory.raw windows.cmdline"
        }
      ]
    },
    {
      "id": "memprocfs",
      "title": "MemProcFS",
      "order": 5,
      "icon": "fa-folder-tree",
      "commands": [
        {
          "id": "memprocfs-mount",
          "title": "Mount Memory Image",
          "description": "Mount a memory dump as a virtual filesystem for browsing.",
          "command": "memprocfs.exe -device memory.raw -forensic 1"
        },
        {
          "id": "memprocfs-mount-m",
          "title": "Mount to Drive Letter",
          "description": "Mount memory image to M: for Explorer and tool access.",
          "command": "memprocfs.exe -mount m -device memory.raw -forensic 1"
        },
        {
          "id": "memprocfs-volatility",
          "title": "Run Volatility Plugin via MemProcFS",
          "description": "Execute a Volatility plugin through the MemProcFS API.",
          "command": "memprocfs.exe -device memory.raw -forensic 1 -pythonexec \"vol windows.pslist\""
        }
      ]
    },
    {
      "id": "eztools",
      "title": "EZTools",
      "order": 6,
      "icon": "fa-wrench",
      "commands": [
        {
          "id": "evtxecmd",
          "title": "EvtxECmd - Parse EVTX",
          "description": "Parse Windows event logs to CSV for timeline review.",
          "command": "EvtxECmd.exe -d C:\\kape_out\\C\\Windows\\System32\\winevt\\Logs --csv C:\\parsed\\evtx\\"
        },
        {
          "id": "pecmd",
          "title": "PECmd - Parse Prefetch",
          "description": "Parse Prefetch files for program execution evidence.",
          "command": "PECmd.exe -d C:\\kape_out\\C\\Windows\\Prefetch --csv C:\\parsed\\prefetch\\"
        },
        {
          "id": "mftecmd",
          "title": "MFTECmd - Parse $MFT",
          "description": "Parse the Master File Table for filesystem timeline.",
          "command": "MFTECmd.exe -f C:\\kape_out\\C\\$MFT --csv C:\\parsed\\mft\\"
        },
        {
          "id": "amcache",
          "title": "AmcacheParser",
          "description": "Parse Amcache for program execution artifacts.",
          "command": "AmcacheParser.exe -f C:\\kape_out\\C\\Windows\\AppCompat\\Programs\\Amcache.hve --csv C:\\parsed\\amcache\\"
        },
        {
          "id": "appcompatcache",
          "title": "AppCompatCacheParser",
          "description": "Parse ShimCache for execution history.",
          "command": "AppCompatCacheParser.exe -f C:\\kape_out\\C\\Windows\\AppCompat\\Programs\\AppCompatCache --csv C:\\parsed\\shimcache\\"
        }
      ]
    },
    {
      "id": "dd",
      "title": "dd",
      "order": 7,
      "icon": "fa-hard-drive",
      "commands": [
        {
          "id": "dd-acquire",
          "title": "Create Disk Image",
          "description": "Bit-for-bit copy of a source device to an image file.",
          "command": "sudo dd if=/dev/sdb of=/cases/disk.img bs=64k conv=noerror,sync status=progress"
        },
        {
          "id": "dd-hash",
          "title": "Image + SHA256 Hash",
          "description": "Create image and write SHA256 hash for chain of custody.",
          "command": "sudo dd if=/dev/sdb bs=64k conv=noerror,sync status=progress | tee /cases/disk.img | sha256sum | tee /cases/disk.img.sha256"
        },
        {
          "id": "dd-verify",
          "title": "Verify Image Hash",
          "description": "Confirm image integrity against a saved hash.",
          "command": "sha256sum /cases/disk.img && cat /cases/disk.img.sha256"
        }
      ]
    }
  ],
  "kql": [
    {
      "id": "device",
      "title": "Device",
      "icon": "fa-desktop",
      "defaultOpen": true,
      "commands": [
        {
          "id": "device-process-placeholder",
          "title": "Process creation - template",
          "description": "Placeholder. Replace filters with your hunt criteria.",
          "command": "DeviceProcessEvents\n| where Timestamp > ago(7d)\n| where ActionType == \"ProcessCreated\"\n| project Timestamp, DeviceName, InitiatingProcessFileName, FileName, ProcessCommandLine\n| take 100"
        },
        {
          "id": "device-network-placeholder",
          "title": "Outbound connection - template",
          "description": "Placeholder. Filter by remote IP, port, or process.",
          "command": "DeviceNetworkEvents\n| where Timestamp > ago(7d)\n| where RemotePort == 443\n| project Timestamp, DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort\n| take 100"
        }
      ]
    },
    {
      "id": "identity",
      "title": "Identity & Auth",
      "icon": "fa-user-shield",
      "commands": [
        {
          "id": "signin-failures-placeholder",
          "title": "Failed sign-ins - template",
          "description": "Placeholder. Add account, IP, or app filters as needed.",
          "command": "SigninLogs\n| where TimeGenerated > ago(24h)\n| where ResultType != 0\n| summarize FailedAttempts = count() by UserPrincipalName, IPAddress\n| order by FailedAttempts desc"
        },
        {
          "id": "risky-signin-placeholder",
          "title": "Risky sign-ins - template",
          "description": "Placeholder. Requires Entra ID P2 / Identity Protection.",
          "command": "AADIdentityProtectionSignInLogs\n| where TimeGenerated > ago(7d)\n| where RiskLevelDuringSignIn in (\"medium\", \"high\")\n| project TimeGenerated, UserPrincipalName, IPAddress, RiskLevelDuringSignIn, RiskDetail"
        }
      ]
    },
    {
      "id": "email",
      "title": "Email & Phishing",
      "icon": "fa-envelope",
      "commands": [
        {
          "id": "email-threat-placeholder",
          "title": "Malicious email - template",
          "description": "Placeholder. Defender for Office 365 / MDO required.",
          "command": "EmailEvents\n| where Timestamp > ago(7d)\n| where ThreatTypes has \"Phish\"\n| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, DeliveryAction"
        }
      ]
    },
    {
      "id": "hunting",
      "title": "Threat Hunting",
      "icon": "fa-crosshairs",
      "commands": [
        {
          "id": "powershell-encoded-placeholder",
          "title": "Encoded PowerShell - template",
          "description": "Placeholder. Hunt for common LOLBin abuse patterns.",
          "command": "DeviceProcessEvents\n| where Timestamp > ago(7d)\n| where FileName =~ \"powershell.exe\"\n| where ProcessCommandLine has_any (\"-enc\", \"-EncodedCommand\", \"FromBase64String\")\n| project Timestamp, DeviceName, AccountName, ProcessCommandLine"
        },
        {
          "id": "lolbin-schtasks-placeholder",
          "title": "Schtasks creation - template",
          "description": "Placeholder. Scheduled task creation via command line.",
          "command": "DeviceProcessEvents\n| where Timestamp > ago(7d)\n| where FileName =~ \"schtasks.exe\"\n| where ProcessCommandLine has \"Create\"\n| project Timestamp, DeviceName, AccountName, ProcessCommandLine"
        }
      ]
    }
  ]
};
