window.GHOST_DATA = {
  "offsec": [
    {
      "id": "subdomain",
      "title": "Subdomain Enumeration",
      "commands": [
        {
          "id": "subfinder-basic",
          "title": "Basic Subdomain Discovery",
          "description": "Discovers subdomains using subfinder with recursive enumeration and saves results to a file.",
          "command": "subfinder -d example.com -all -recursive > subexample.com.txt"
        },
        {
          "id": "httpx-filter",
          "title": "Live Subdomain Filtering",
          "description": "Filters discovered subdomains using httpx and saves the alive ones to a file.",
          "command": "cat subexample.com.txt | httpx-toolkit -ports 80,443,8080,8000,8888 -threads 200 > subexample.coms_alive.txt"
        },
        {
          "id": "subzy-check",
          "title": "Subdomain Takeover Check",
          "description": "Checks for subdomain takeover vulnerabilities using subzy.",
          "command": "subzy run --targets subexample.coms.txt --concurrency 100 --hide_fails --verify_ssl"
        }
      ]
    },
    {
      "id": "urls",
      "title": "URL Collection",
      "commands": [
        {
          "id": "katana-passive",
          "title": "Passive URL Collection",
          "description": "Collects URLs from various sources and saves them to a file.",
          "command": "katana -u subexample.coms_alive.txt -d 5 -ps -pss waybackarchive,commoncrawl,alienvault -kf -jc -fx -ef woff,css,png,svg,jpg,woff2,jpeg,gif,svg -o allurls.txt"
        },
        {
          "id": "advanced-urls",
          "title": "Advanced URL Fetching",
          "description": "Collects URLs from various sources and saves them to a file.",
          "command": "echo example.com | katana -d 5 -ps -pss waybackarchive,commoncrawl,alienvault -f qurl | urldedupe >output.txtkatana -u https://example.com -d 5 | grep '=' | urldedupe | anew output.txtcat output.txt | sed 's/=.*/=/' >final.txt"
        },
        {
          "id": "gau-urls",
          "title": "GAU URL Collection",
          "description": "Collects URLs using GAU and saves them to a file.",
          "command": "echo example.com | gau --mc 200 | urldedupe >urls.txtcat urls.txt | grep -E \".php|.asp|.aspx|.jspx|.jsp\" | grep '=' | sort > output.txtcat output.txt | sed 's/=.*/=/' >final.txt"
        }
      ]
    },
    {
      "id": "sensitive",
      "title": "Sensitive Data Discovery",
      "commands": [
        {
          "id": "sensitive-files",
          "title": "Sensitive File Detection",
          "description": "Detects sensitive files on the web server.",
          "command": "cat allurls.txt | grep -E \"\\.xls|\\.xml|\\.xlsx|\\.json|\\.pdf|\\.sql|\\.doc|\\.docx|\\.pptx|\\.txt|\\.zip|\\.tar\\.gz|\\.tgz|\\.bak|\\.7z|\\.rar|\\.log|\\.cache|\\.secret|\\.db|\\.backup|\\.yml|\\.gz|\\.config|\\.csv|\\.yaml|\\.md|\\.md5\""
        },
        {
          "id": "info-dork",
          "title": "Information Disclosure Dork",
          "description": "Searches for information disclosure vulnerabilities using a dork.",
          "command": "site:*.example.com (ext:doc OR ext:docx OR ext:odt OR ext:pdf OR ext:rtf OR ext:ppt OR ext:pptx OR ext:csv OR ext:xls OR ext:xlsx OR ext:txt OR ext:xml OR ext:json OR ext:zip OR ext:rar OR ext:md OR ext:log OR ext:bak OR ext:conf OR ext:sql)"
        },
        {
          "id": "git-detection",
          "title": "Git Repository Detection",
          "description": "Detects Git repositories on the web server.",
          "command": "cat example.coms.txt | grep \"SUCCESS\" | gf urls | httpx-toolkit -sc -server -cl -path \"/.git/\" -mc 200 -location -ms \"Index of\" -probe"
        },
        {
          "id": "info-disclosure",
          "title": "Information Disclosure Scanner",
          "description": "Checks for information disclosure vulnerabilities using a scanner.",
          "command": "echo https://example.com | gau | grep -E \"\\.(xls|xml|xlsx|json|pdf|sql|doc|docx|pptx|txt|zip|tar\\.gz|tgz|bak|7z|rar|log|cache|secret|db|backup|yml|gz|config|csv|yaml|md|md5|tar|xz|7zip|p12|pem|key|crt|csr|sh|pl|py|java|class|jar|war|ear|sqlitedb|sqlite3|dbf|db3|accdb|mdb|sqlcipher|gitignore|env|ini|conf|properties|plist|cfg)$\""
        },
        {
          "id": "s3-buckets",
          "title": "AWS S3 Bucket Finder",
          "description": "Searches for AWS S3 buckets associated with the target.",
          "command": "s3scanner scan -d example.com"
        },
        {
          "id": "api-keys",
          "title": "API Key Finder",
          "description": "Searches for exposed API keys and tokens in JavaScript files.",
          "command": "cat allurls.txt | grep -E \"\\.js$\" | httpx-toolkit -mc 200 -content-type | grep -E \"application/javascript|text/javascript\" | cut -d' ' -f1 | xargs -I% curl -s % | grep -E \"(API_KEY|api_key|apikey|secret|token|password)\""
        }
      ]
    },
    {
      "id": "xss",
      "title": "XSS Testing",
      "commands": [
        {
          "id": "xss-pipeline",
          "title": "XSS Hunting Pipeline",
          "description": "Collects XSS vulnerabilities using various tools and saves them to a file.",
          "command": "echo https://example.com/ | gau | gf xss | uro | Gxss | kxss | tee xss_output.txt"
        },
        {
          "id": "dalfox-xss",
          "title": "XSS with Dalfox",
          "description": "Uses Dalfox to scan for XSS vulnerabilities.",
          "command": "cat xss_params.txt | dalfox pipe --blind https://your-collaborator-url --waf-bypass --silence"
        },
        {
          "id": "stored-xss",
          "title": "Stored XSS Finder",
          "description": "Finds potential stored XSS vulnerabilities by scanning forms.",
          "command": "cat urls.txt | grep -E \"(login|signup|register|forgot|password|reset)\" | httpx -silent | nuclei -t nuclei-templates/vulnerabilities/xss/ -severity critical,high"
        },
        {
          "id": "dom-xss",
          "title": "DOM XSS Detection",
          "description": "Detects potential DOM-based XSS vulnerabilities.",
          "command": "cat js_files.txt | Gxss -c 100 | sort -u | dalfox pipe -o dom_xss_results.txt"
        }
      ]
    },
    {
      "id": "lfi",
      "title": "LFI Testing",
      "commands": [
        {
          "id": "lfi-method",
          "title": "LFI Methodology",
          "description": "Tests for Local File Inclusion (LFI) vulnerabilities using various methods.",
          "command": "echo \"https://example.com/\" | gau | gf lfi | uro | sed 's/=.*/=/' | qsreplace \"FUZZ\" | sort -u | xargs -I{} ffuf -u {} -w payloads/lfi.txt -c -mr \"root:(x|\\*|\\$[^\\:]*):0:0:\" -v"
        }
      ]
    },
    {
      "id": "cors",
      "title": "CORS Testing",
      "commands": [
        {
          "id": "cors-check",
          "title": "Basic CORS Check",
          "description": "Checks the Cross-Origin Resource Sharing (CORS) policy of a website.",
          "command": "curl -H \"Origin: http://example.com\" -I https://example.com/wp-json/"
        },
        {
          "id": "corscanner",
          "title": "CORScanner",
          "description": "Fast CORS misconfiguration scanner that helps identify potential CORS vulnerabilities.",
          "command": "python3 CORScanner.py -u https://example.com -d -t 10"
        },
        {
          "id": "cors-nuclei",
          "title": "CORS Nuclei Scan",
          "description": "Uses Nuclei to scan for CORS misconfigurations across multiple domains.",
          "command": "cat example.coms.txt | httpx -silent | nuclei -t nuclei-templates/vulnerabilities/cors/ -o cors_results.txt"
        },
        {
          "id": "cors-reflection",
          "title": "CORS Origin Reflection Test",
          "description": "Tests for origin reflection vulnerability in CORS configuration.",
          "command": "curl -H \"Origin: https://evil.com\" -I https://example.com/api/data | grep -i \"access-control-allow-origin: https://evil.com\""
        }
      ]
    },
    {
      "id": "wordpress",
      "title": "WordPress Scanning",
      "commands": [
        {
          "id": "wpscan",
          "title": "Aggressive WordPress Scan",
          "description": "Scans a WordPress website for vulnerabilities and saves the results to a file.",
          "command": "wpscan --url https://example.com --disable-tls-checks --api-token YOUR_TOKEN -e at -e ap -e u --enumerate ap --plugins-detection aggressive --force"
        }
      ]
    },
    {
      "id": "network",
      "title": "Network Scanning",
      "commands": [
        {
          "id": "naabu",
          "title": "Naabu Scan",
          "description": "Scans for open ports and services using Naabu.",
          "command": "naabu -list ip.txt -c 50 -nmap-cli 'nmap -sV -SC' -o naabu-full.txt"
        },
        {
          "id": "nmap",
          "title": "Nmap Full Scan",
          "description": "Performs a full port scan using Nmap.",
          "command": "nmap -p- --min-rate 1000 -T4 -A example.com -oA fullscan"
        },
        {
          "id": "masscan",
          "title": "Masscan",
          "description": "Scans for open ports and services using Masscan.",
          "command": "masscan -p0-65535 example.com --rate 100000 -oG masscan-results.txt"
        }
      ]
    },
    {
      "id": "web-recon",
      "title": "Web Recon",
      "commands": [
        {
          "id": "nmap-web-ports",
          "title": "Nmap \u2014 Web Port Scan",
          "description": "Fast scan of common web and service ports on a target host.",
          "command": "nmap -sV -sC -p 80,443,8000,8080,8443,8888,3000,5000,9000 example.com -oA web-ports"
        },
        {
          "id": "nmap-http-scripts",
          "title": "Nmap \u2014 HTTP Enumeration Scripts",
          "description": "Run HTTP-specific NSE scripts for titles, headers, methods, and tech fingerprinting.",
          "command": "nmap -p 80,443 --script=http-title,http-headers,http-methods,http-server-header,http-enum -oA http-enum example.com"
        },
        {
          "id": "nmap-ssl-scan",
          "title": "Nmap \u2014 SSL/TLS Analysis",
          "description": "Enumerate SSL ciphers, cert details, and known vulnerabilities on HTTPS.",
          "command": "nmap -p 443 --script ssl-cert,ssl-enum-ciphers,ssl-heartbleed -oA ssl-scan example.com"
        },
        {
          "id": "gobuster-dir",
          "title": "Gobuster \u2014 Directory Brute Force",
          "description": "Discover hidden directories and files on a web server.",
          "command": "gobuster dir -u https://example.com -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,html,js,txt,bak -t 50 -o gobuster-dirs.txt"
        },
        {
          "id": "gobuster-vhost",
          "title": "Gobuster \u2014 Vhost Discovery",
          "description": "Brute force virtual hosts to find subdomains/sites on the same IP.",
          "command": "gobuster vhost -u https://example.com -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t 50 -o gobuster-vhosts.txt"
        },
        {
          "id": "gobuster-dns",
          "title": "Gobuster \u2014 DNS Subdomain Enum",
          "description": "Enumerate subdomains via DNS brute force.",
          "command": "gobuster dns -d example.com -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-110000.txt -t 50 -o gobuster-dns.txt"
        },
        {
          "id": "nuclei-single",
          "title": "Nuclei \u2014 Single Target Scan",
          "description": "Run all Nuclei templates against a single URL.",
          "command": "nuclei -u https://example.com -o nuclei-single.txt"
        },
        {
          "id": "nuclei-severity",
          "title": "Nuclei \u2014 Critical & High Only",
          "description": "Scan a target filtering to critical and high severity findings only.",
          "command": "nuclei -u https://example.com -severity critical,high -o nuclei-critical.txt"
        },
        {
          "id": "nuclei-tags",
          "title": "Nuclei \u2014 Tagged Templates (CVE/Exposure)",
          "description": "Run specific template tags \u2014 useful for focused CVE and misconfiguration hunts.",
          "command": "nuclei -u https://example.com -tags cve,exposure,misconfig -o nuclei-tagged.txt"
        },
        {
          "id": "nuclei-list",
          "title": "Nuclei \u2014 Scan URL List",
          "description": "Run Nuclei against a list of live URLs from recon output.",
          "command": "cat alive-urls.txt | nuclei -t nuclei-templates/ -severity medium,high,critical -c 50 -o nuclei-results.txt"
        },
        {
          "id": "web-recon-pipeline",
          "title": "Web Recon Pipeline",
          "description": "Full web recon chain \u2014 port scan, probe live hosts, directory brute, then Nuclei.",
          "command": "nmap -sV -p 80,443,8080,8443 example.com -oG - | awk '/Status: Open/{print $2}' | httpx -silent -o alive.txt && gobuster dir -u https://example.com -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -q -o gobuster.txt && nuclei -l alive.txt -severity critical,high -o nuclei.txt"
        },
        {
          "id": "httpx-nuclei",
          "title": "Httpx \u2192 Nuclei Quick Sweep",
          "description": "Probe subdomains for live web services then immediately scan with Nuclei.",
          "command": "cat subexample.coms_alive.txt | httpx -silent -status-code -title -tech-detect -o alive.txt && nuclei -l alive.txt -severity critical,high,medium -c 40 -o nuclei-sweep.txt"
        }
      ]
    },
    {
      "id": "parameters",
      "title": "Parameter Discovery",
      "commands": [
        {
          "id": "arjun-passive",
          "title": "Arjun Passive",
          "description": "Passively discovers parameters using Arjun.",
          "command": "arjun -u https://example.com/endpoint.php -oT arjun_output.txt -t 10 --rate-limit 10 --passive -m GET,POST --headers \"User-Agent: Mozilla/5.0\""
        },
        {
          "id": "arjun-wordlist",
          "title": "Arjun Wordlist",
          "description": "Uses Arjun to discover parameters using a custom wordlist.",
          "command": "arjun -u https://example.com/endpoint.php -oT arjun_output.txt -m GET,POST -w /usr/share/wordlists/seclists/Discovery/Web-Content/burp-parameter-names.txt -t 10 --rate-limit 10 --headers \"User-Agent: Mozilla/5.0\""
        }
      ]
    },
    {
      "id": "javascript",
      "title": "JavaScript Analysis",
      "commands": [
        {
          "id": "js-hunting",
          "title": "JS File Hunting",
          "description": "Collects JavaScript files from a website and analyzes them.",
          "command": "echo example.com | katana -d 5 | grep -E \"\\.js$\" | nuclei -t /path/to/nuclei-templates/http/exposures/ -c 30"
        },
        {
          "id": "js-analysis",
          "title": "JS File Analysis",
          "description": "Analyzes collected JavaScript files.",
          "command": "cat alljs.txt | nuclei -t /path/to/nuclei-templates/http/exposures/"
        }
      ]
    },
    {
      "id": "content-type",
      "title": "Content Type Filtering",
      "commands": [
        {
          "id": "content-check",
          "title": "Content Type Check",
          "description": "Checks the content type of URLs.",
          "command": "echo example.com | gau | grep -Eo '(\\/[^\\/]+)\\.(php|asp|aspx|jsp|jsf|cfm|pl|perl|cgi|htm|html)$' | httpx -status-code -mc 200 -content-type | grep -E 'text/html|application/xhtml+xml'"
        },
        {
          "id": "js-content",
          "title": "JavaScript Content Check",
          "description": "Checks for JavaScript content in URLs.",
          "command": "echo example.com | gau | grep '\\.js-php-jsp-other extens$' | httpx -status-code -mc 200 -content-type | grep 'application/javascript'"
        }
      ]
    },
    {
      "id": "shodan",
      "title": "Shodan Dorks",
      "commands": [
        {
          "id": "shodan-ssl",
          "title": "SSL Certificate Search",
          "description": "Searches for SSL certificates using Shodan.",
          "command": "Ssl.cert.subject.CN:\"example.com\" 200"
        }
      ]
    },
    {
      "id": "ffuf-request",
      "title": "FFUF Request File Method",
      "commands": [
        {
          "id": "ffuf-lfi",
          "title": "LFI with Request File",
          "description": "Uses FFUF to bruteforce LFI vulnerabilities using a request file.",
          "command": "ffuf -request lfi -request-proto https -w /root/wordlists/offensive\\ payloads/LFI\\ payload.txt -c -mr \"root:\""
        },
        {
          "id": "ffuf-xss",
          "title": "XSS with Request File",
          "description": "Uses FFUF to bruteforce XSS vulnerabilities using a request file.",
          "command": "ffuf -request xss -request-proto https -w /root/wordlists/xss-payloads.txt -c -mr \"<script>alert('XSS')</script>\""
        }
      ]
    },
    {
      "id": "advanced",
      "title": "Advanced Techniques",
      "commands": [
        {
          "id": "header-testing",
          "title": "XSS/SSRF Header Testing",
          "description": "Tests for XSS and SSRF vulnerabilities using various methods.",
          "command": "cat example.coms.txt | assetfinder --subs-only| httprobe | while read url; do xss1=$(curl -s -L $url -H 'X-Forwarded-For: xss.yourburpcollabrotor'|grep xss) xss2=$(curl -s -L $url -H 'X-Forwarded-Host: xss.yourburpcollabrotor'|grep xss) xss3=$(curl -s -L $url -H 'Host: xss.yourburpcollabrotor'|grep xss) xss4=$(curl -s -L $url --request-target http://burpcollaborator/ --max-time 2); echo -e \"\\e[1;32m$url\\e[0m\"\"\\n\"\"Method[1] X-Forwarded-For: xss+ssrf => $xss1\"\"\\n\"\"Method[2] X-Forwarded-Host: xss+ssrf ==> $xss2\"\"\\n\"\"Method[3] Host: xss+ssrf ==> $xss3\"\"\\n\"\"Method[4] GET http://xss.yourburpcollabrotor HTTP/1.1 \"\"\\n\";done"
        }
      ]
    }
  ],
  "dfir": [
    {
      "id": "memory",
      "title": "Memory Forensics",
      "icon": "fa-memory",
      "commands": [
        {
          "id": "vol3-info",
          "title": "Volatility 3 \u2014 System Info",
          "description": "Identify OS, kernel, and architecture from a memory dump.",
          "command": "vol -f memory.dmp windows.info"
        },
        {
          "id": "vol3-pslist",
          "title": "Volatility 3 \u2014 Process List",
          "description": "Enumerate running processes at time of capture.",
          "command": "vol -f memory.dmp windows.pslist"
        },
        {
          "id": "vol3-pstree",
          "title": "Volatility 3 \u2014 Process Tree",
          "description": "Visualize parent-child process relationships for anomaly detection.",
          "command": "vol -f memory.dmp windows.pstree"
        },
        {
          "id": "vol3-netscan",
          "title": "Volatility 3 \u2014 Network Connections",
          "description": "Extract active network connections and listening ports from memory.",
          "command": "vol -f memory.dmp windows.netscan"
        },
        {
          "id": "vol3-malfind",
          "title": "Volatility 3 \u2014 Malware Detection",
          "description": "Find injected code and suspicious memory regions.",
          "command": "vol -f memory.dmp windows.malfind"
        },
        {
          "id": "vol3-dumpfiles",
          "title": "Volatility 3 \u2014 Dump Suspicious Files",
          "description": "Extract files from process memory for further analysis.",
          "command": "vol -f memory.dmp windows.dumpfiles --pid 1234 --dump-dir ./dumps/"
        }
      ]
    },
    {
      "id": "disk",
      "title": "Disk & File Forensics",
      "icon": "fa-hard-drive",
      "commands": [
        {
          "id": "fls-inode",
          "title": "Sleuth Kit \u2014 List Deleted Files",
          "description": "List deleted files by inode on an NTFS/ext image.",
          "command": "fls -rd image.E01 | grep '(deleted)'"
        },
        {
          "id": "icat-extract",
          "title": "Sleuth Kit \u2014 Extract by Inode",
          "description": "Carve a file from a disk image using its inode number.",
          "command": "icat image.E01 128-128-4 > recovered_file.exe"
        },
        {
          "id": "mmls-partitions",
          "title": "Sleuth Kit \u2014 Partition Table",
          "description": "Display partition layout of a forensic image.",
          "command": "mmls image.E01"
        },
        {
          "id": "bulk-extractor",
          "title": "Bulk Extractor \u2014 Auto Carve",
          "description": "Automatically extract emails, URLs, credit cards, and more.",
          "command": "bulk_extractor -o bulk_out/ image.E01"
        },
        {
          "id": "find-suspicious",
          "title": "Find Suspicious Executables",
          "description": "Locate recently modified executables in a mounted image.",
          "command": "find /mnt/evidence -type f \\( -name '*.exe' -o -name '*.dll' -o -name '*.ps1' \\) -mtime -7"
        }
      ]
    },
    {
      "id": "evtx",
      "title": "Windows Event Logs",
      "icon": "fa-scroll",
      "commands": [
        {
          "id": "evtx-dump",
          "title": "Export All EVTX Logs",
          "description": "Export all Windows event logs to a review directory.",
          "command": "wevtutil epl Security C:\\forensics\\Security.evtx & wevtutil epl System C:\\forensics\\System.evtx & wevtutil epl \"Microsoft-Windows-PowerShell/Operational\" C:\\forensics\\PS.evtx"
        },
        {
          "id": "evtx-parse",
          "title": "Parse EVTX with EvtxECmd",
          "description": "Parse Security.evtx into CSV for timeline analysis.",
          "command": "EvtxECmd.exe -f C:\\forensics\\Security.evtx --csv C:\\forensics\\output\\"
        },
        {
          "id": "evtx-4624",
          "title": "Hunt Successful Logons (4624)",
          "description": "Filter Security log for successful authentication events.",
          "command": "Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} | Select TimeCreated, @{n='User';e={$_.Properties[5].Value}}, @{n='IP';e={$_.Properties[18].Value}}"
        },
        {
          "id": "evtx-4688",
          "title": "Hunt Process Creation (4688)",
          "description": "Find process creation events \u2014 key for detecting execution.",
          "command": "Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4688} | Where-Object {$_.Message -match 'powershell|cmd|wscript'} | Select TimeCreated, Message"
        },
        {
          "id": "chainsaw-hunt",
          "title": "Chainsaw \u2014 Sigma Hunt",
          "description": "Run Sigma rules against collected EVTX logs.",
          "command": "chainsaw hunt C:\\forensics\\evtx\\ --sigma rules/ --mapping mappings/sigma-event-logs-all.yml -o results/"
        }
      ]
    },
    {
      "id": "netforensics",
      "title": "Network Forensics",
      "icon": "fa-network-wired",
      "commands": [
        {
          "id": "tshark-http",
          "title": "Extract HTTP Hosts from PCAP",
          "description": "Pull HTTP host headers from a packet capture.",
          "command": "tshark -r capture.pcap -Y http.request -T fields -e http.host | sort -u"
        },
        {
          "id": "tshark-dns",
          "title": "Extract DNS Queries",
          "description": "List all DNS queries \u2014 useful for C2 domain identification.",
          "command": "tshark -r capture.pcap -Y dns.flags.response==0 -T fields -e dns.qry.name | sort -u"
        },
        {
          "id": "tshark-follow",
          "title": "Follow TCP Stream",
          "description": "Reconstruct a TCP conversation from a PCAP.",
          "command": "tshark -r capture.pcap -q -z follow,tcp,ascii,0"
        },
        {
          "id": "zeek-conn",
          "title": "Zeek \u2014 Connection Log Summary",
          "description": "Summarize connection logs from Zeek output.",
          "command": "cat conn.log | jq -r '[.ts, .id.orig_h, .id.resp_h, .id.resp_p, .proto] | @tsv' | sort -u"
        },
        {
          "id": "suricata-alerts",
          "title": "Suricata \u2014 Review Alerts",
          "description": "Parse Suricata fast.log for triggered IDS rules.",
          "command": "cat fast.log | grep -E 'ET |SURICATA' | awk '{print $NF}' | sort | uniq -c | sort -rn"
        }
      ]
    },
    {
      "id": "timeline",
      "title": "Timeline Analysis",
      "icon": "fa-clock",
      "commands": [
        {
          "id": "plaso-log2timeline",
          "title": "Plaso \u2014 Create Timeline",
          "description": "Generate a super timeline from a forensic image.",
          "command": "log2timeline.py --storage-file timeline.plaso image.E01"
        },
        {
          "id": "plaso-psort",
          "title": "Plaso \u2014 Export Timeline",
          "description": "Export timeline to CSV for review in Timeline Explorer.",
          "command": "psort.py -o l2tcsv -w timeline.csv timeline.plaso"
        },
        {
          "id": "mactime-bodyfile",
          "title": "Sleuth Kit \u2014 Mactime Bodyfile",
          "description": "Create a bodyfile for timeline generation with mactime.",
          "command": "fls -r -m C: image.E01 > bodyfile.txt && mactime -b bodyfile.txt -d > timeline.txt"
        },
        {
          "id": "kape-timeline",
          "title": "KAPE \u2014 Targeted Collection",
          "description": "Collect high-value forensic artifacts for rapid timeline building.",
          "command": "kape.exe --tsource C: --tdest C:\\kape_out --target !SANS_Triage --mdest C:\\kape_out --module !EZParser"
        }
      ]
    },
    {
      "id": "malware",
      "title": "Malware Analysis",
      "icon": "fa-biohazard",
      "commands": [
        {
          "id": "yara-scan",
          "title": "YARA \u2014 Scan Directory",
          "description": "Scan files against a YARA rule set.",
          "command": "yara -r rules/malware.yar /path/to/samples/"
        },
        {
          "id": "strings-extract",
          "title": "Extract Printable Strings",
          "description": "Pull ASCII/Unicode strings from a suspicious binary.",
          "command": "strings -el suspicious.exe | grep -iE 'http|password|cmd|powershell|registry'"
        },
        {
          "id": "pe-header",
          "title": "PE Header Analysis",
          "description": "Inspect PE headers with pefile for anomalies.",
          "command": "python3 -c \"import pefile; pe=pefile.PE('sample.exe'); print(pe.DOS_HEADER); print(pe.OPTIONAL_HEADER)\""
        },
        {
          "id": "hash-file",
          "title": "Hash Suspicious Files",
          "description": "Generate SHA256 hashes for IOC reporting and threat intel lookup.",
          "command": "sha256sum suspicious.exe | tee hashes.txt"
        },
        {
          "id": "floss-strings",
          "title": "FLOSS \u2014 Obfuscated Strings",
          "description": "Extract obfuscated strings from malware using Mandiant FLOSS.",
          "command": "floss --no-static-strings suspicious.exe > floss_output.txt"
        }
      ]
    },
    {
      "id": "winir",
      "title": "Windows IR Collection",
      "icon": "fa-windows",
      "commands": [
        {
          "id": "kape-triage",
          "title": "KAPE \u2014 SANS Triage",
          "description": "Rapid triage collection using KAPE SANS targets.",
          "command": "kape.exe --tsource C: --tdest \\\\share\\evidence --target !SANS_Triage"
        },
        {
          "id": "velociraptor",
          "title": "Velociraptor \u2014 Live Collection",
          "description": "Collect artifacts remotely via Velociraptor VQL.",
          "command": "SELECT * FROM Artifact.Windows.System.Pslist()"
        },
        {
          "id": "autoruns",
          "title": "Autoruns \u2014 Persistence Check",
          "description": "Enumerate autorun locations for persistence mechanisms.",
          "command": "autorunsc.exe -accepteula -a * -c -h -s -v -vt > autoruns.csv"
        },
        {
          "id": "prefetch",
          "title": "PECmd \u2014 Parse Prefetch",
          "description": "Parse Windows Prefetch files for execution evidence.",
          "command": "PECmd.exe -d C:\\Windows\\Prefetch --csv C:\\forensics\\prefetch\\"
        },
        {
          "id": "mft-parse",
          "title": "MFTECmd \u2014 Parse $MFT",
          "description": "Parse the Master File Table for file system timeline.",
          "command": "MFTECmd.exe -f C:\\$MFT --csv C:\\forensics\\mft\\"
        }
      ]
    },
    {
      "id": "linuxir",
      "title": "Linux IR",
      "icon": "fa-linux",
      "commands": [
        {
          "id": "linux-ps",
          "title": "Process Enumeration",
          "description": "List running processes with full command lines.",
          "command": "ps auxww | grep -v '\\[' | sort"
        },
        {
          "id": "linux-netstat",
          "title": "Active Connections",
          "description": "Show listening ports and established connections.",
          "command": "ss -tulpn && netstat -antp 2>/dev/null"
        },
        {
          "id": "linux-cron",
          "title": "Cron Persistence Check",
          "description": "Review cron jobs across users and system directories.",
          "command": "for u in $(cut -f1 -d: /etc/passwd); do echo \"=== $u ===\"; crontab -l -u $u 2>/dev/null; done; ls -la /etc/cron.*"
        },
        {
          "id": "linux-auth",
          "title": "Auth Log Review",
          "description": "Hunt failed SSH logins and privilege escalation in auth logs.",
          "command": "grep -E 'Failed password|Accepted password|sudo:' /var/log/auth.log | tail -100"
        },
        {
          "id": "linux-forensics",
          "title": "UAC \u2014 Live Response Collection",
          "description": "Collect Linux artifacts using UAC (Unix-like Artifact Collector).",
          "command": "./uac -p full /path/to/evidence"
        }
      ]
    }
  ]
};
