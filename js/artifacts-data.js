window.GHOST_ARTIFACTS = [
  {
    id: "filesystem",
    title: "File System Artifacts",
    icon: "fa-hard-drive",
    artifacts: [
      {
        id: "mft",
        name: "$MFT",
        description: "Master File Table - records every file/dir on NTFS volume including timestamps and metadata.",
        paths: ["C:\\$MFT", "%SystemDrive%\\$MFT"],
        registry: null,
        parser: "MFTECmd, Autopsy, FTK",
        notes: "Locked while volume mounted. Collect from image or raw access."
      },
      {
        id: "usn-journal",
        name: "$UsnJrnl",
        description: "NTFS change journal - file create, delete, rename events.",
        paths: ["C:\\$Extend\\$UsnJrnl:$J", "%SystemDrive%\\$Extend\\$UsnJrnl:$J"],
        registry: null,
        parser: "MFTECmd (UsnJrnl), fsutil usn",
        notes: "Can be cleared by admin; size capped by OS."
      },
      {
        id: "prefetch",
        name: "Prefetch",
        description: "Execution evidence - program run count, last run times, files loaded.",
        paths: ["C:\\Windows\\Prefetch\\*.pf", "%SystemRoot%\\Prefetch\\"],
        registry: null,
        parser: "PECmd, PECmd (Eric Zimmerman)",
        notes: "Disabled on some SSD systems (SysMain). Win11 uses hash-based names."
      },
      {
        id: "lnk",
        name: "LNK Files (Shortcuts)",
        description: "Shortcut metadata - target path, volume serial, MAC times, network paths.",
        paths: [
          "%APPDATA%\\Microsoft\\Windows\\Recent\\*.lnk",
          "%APPDATA%\\Microsoft\\Office\\Recent\\*.lnk",
          "%USERPROFILE%\\Desktop\\*.lnk"
        ],
        registry: null,
        parser: "LECmd, LECmd (Eric Zimmerman)",
        notes: "Recent folder is high-value for user activity timeline."
      },
      {
        id: "jump-lists",
        name: "Jump Lists",
        description: "Recent files/apps per application - automatic and custom destinations.",
        paths: [
          "%APPDATA%\\Microsoft\\Windows\\Recent\\AutomaticDestinations-ms\\*.automaticDestinations-ms",
          "%APPDATA%\\Microsoft\\Windows\\Recent\\CustomDestinations-ms\\*.customDestinations-ms"
        ],
        registry: null,
        parser: "JLECmd",
        notes: "AppID maps to executable; critical for Office/browser activity."
      },
      {
        id: "thumbcache",
        name: "Thumbcache",
        description: "Thumbnail database - proves folder/image was viewed in Explorer.",
        paths: ["%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer\\thumbcache_*.db"],
        registry: null,
        parser: "ThumbcacheViewer, ThumbcacheParser",
        notes: "Multiple thumbcache_NN.db files by resolution."
      },
      {
        id: "recycle-bin",
        name: "$Recycle.Bin",
        description: "Deleted files with original path and deletion timestamp ($I/$R files).",
        paths: ["C:\\$Recycle.Bin\\<SID>\\$I*", "C:\\$Recycle.Bin\\<SID>\\$R*"],
        registry: null,
        parser: "RBCmd, Autopsy",
        notes: "Per-user SID subfolders. $I = metadata, $R = content."
      },
      {
        id: "pagefile",
        name: "Pagefile.sys",
        description: "Virtual memory - may contain process memory fragments and strings.",
        paths: ["C:\\pagefile.sys"],
        registry: null,
        parser: "Volatility, strings, bulk_extractor",
        notes: "Collect from powered-off image. Large file."
      },
      {
        id: "hiberfil",
        name: "Hiberfil.sys",
        description: "Hibernation file - compressed RAM snapshot of last hibernate.",
        paths: ["C:\\hiberfil.sys"],
        registry: null,
        parser: "Volatility 2 (hiberfil), decompress tools",
        notes: "Requires admin to access live. Full memory alternative."
      },
      {
        id: "srum",
        name: "SRUM (System Resource Usage Monitor)",
        description: "App resource usage, network bytes per app, user, timeframe.",
        paths: ["C:\\Windows\\System32\\sru\\SRUDB.dat"],
        registry: null,
        parser: "SrumECmd, srum-dump",
        notes: "ESE database. Requires SOFTWARE hive for context."
      }
    ]
  },
  {
    id: "registry-hives",
    title: "Registry Hives (Files)",
    icon: "fa-database",
    artifacts: [
      {
        id: "sam",
        name: "SAM",
        description: "Local account password hashes and account lockout info.",
        paths: ["C:\\Windows\\System32\\config\\SAM"],
        registry: null,
        parser: "regripper, secretsdump, Registry Explorer",
        notes: "Locked live. Collect from image or volume shadow copy."
      },
      {
        id: "security",
        name: "SECURITY",
        description: "LSA secrets, cached domain creds, audit policy.",
        paths: ["C:\\Windows\\System32\\config\\SECURITY"],
        registry: null,
        parser: "secretsdump, regripper",
        notes: "Required with SAM and SYSTEM for hash extraction."
      },
      {
        id: "software",
        name: "SOFTWARE",
        description: "OS install date, installed software, user SIDs, AmCache path ref.",
        paths: ["C:\\Windows\\System32\\config\\SOFTWARE"],
        registry: null,
        parser: "Registry Explorer, regripper",
        notes: "Machine-wide hive."
      },
      {
        id: "system",
        name: "SYSTEM",
        description: "Services, drivers, ShimCache, BAM/DAM, hostname, timezone.",
        paths: ["C:\\Windows\\System32\\config\\SYSTEM"],
        registry: null,
        parser: "Registry Explorer, ShimCacheParser, bam-parser",
        notes: "Select ControlSet00X based on CurrentControlSet."
      },
      {
        id: "ntuser",
        name: "NTUSER.DAT",
        description: "Per-user settings - UserAssist, RecentDocs, Run keys, typed paths.",
        paths: ["C:\\Users\\<username>\\NTUSER.DAT"],
        registry: null,
        parser: "Registry Explorer, regripper",
        notes: "Load as HKU\\<user> in forensic tools. Also in UsrClass for classes."
      },
      {
        id: "usrclass",
        name: "UsrClass.dat",
        description: "Per-user COM/class registration - ShellBags, MUICache, BagMRU.",
        paths: ["C:\\Users\\<username>\\AppData\\Local\\Microsoft\\Windows\\UsrClass.dat"],
        registry: null,
        parser: "ShellBags Explorer, SBECmd, Registry Explorer",
        notes: "Primary ShellBags location (Classes root)."
      },
      {
        id: "amcache",
        name: "AmCache.hve",
        description: "AmCache - program execution, file SHA1, compile times, install evidence.",
        paths: ["C:\\Windows\\AppCompat\\Programs\\Amcache.hve"],
        registry: null,
        parser: "AmcacheParser, Amcache.py, Registry Explorer",
        notes: "Replaced/paired with Amcache in Win8+. High-value execution artifact."
      },
      {
        id: "default",
        name: "DEFAULT",
        description: "Default user profile template hive.",
        paths: ["C:\\Windows\\System32\\config\\DEFAULT"],
        registry: null,
        parser: "Registry Explorer",
        notes: "Less common in investigations unless profiling default config."
      }
    ]
  },
  {
    id: "registry-keys",
    title: "Registry Keys (High Value)",
    icon: "fa-key",
    artifacts: [
      {
        id: "shellbags",
        name: "ShellBags",
        description: "Folder access history - window size, position, viewed folders (even deleted).",
        paths: ["UsrClass.dat → HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\BagMRU", "UsrClass.dat → ...\\Shell\\Bags"],
        registry: "HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\BagMRU",
        parser: "SBECmd, ShellBags Explorer, shellbags.sh",
        notes: "Stored in UsrClass.dat, not NTUSER.DAT. Proves folder was browsed."
      },
      {
        id: "shimcache",
        name: "ShimCache (AppCompatCache)",
        description: "Application compatibility cache - evidence of file execution (no timestamp on older Win).",
        paths: ["SYSTEM hive → ControlSet00X\\Control\\Session Manager\\AppCompatCache"],
        registry: "SYSTEM\\ControlSet001\\Control\\Session Manager\\AppCompatCache",
        parser: "ShimCacheParser, AppCompatCacheParser, regripper",
        notes: "Win8+ includes timestamps. Survives file deletion."
      },
      {
        id: "bam-dam",
        name: "BAM / DAM",
        description: "Background/Desktop Activity Moderator - process execution with last run timestamp.",
        paths: ["SYSTEM hive → Services\\bam\\State\\UserSettings\\<SID>", "SYSTEM hive → Services\\dam\\State\\UserSettings\\<SID>"],
        registry: "SYSTEM\\CurrentControlSet\\Services\\bam\\State\\UserSettings",
        parser: "bam-parser, Registry Explorer",
        notes: "Win10 1709+. Per-user SID subkeys. Very reliable execution evidence."
      },
      {
        id: "userassist",
        name: "UserAssist",
        description: "GUI program execution - run count, last executed (ROT13 encoded names).",
        paths: ["NTUSER.DAT → Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist"],
        registry: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist\\{GUID}\\Count",
        parser: "UserAssistView, regripper, Registry Explorer",
        notes: "Tracks Explorer-launched programs. Decode ROT13 for path."
      },
      {
        id: "muicache",
        name: "MUICache",
        description: "Executed program friendly names from Open/Save dialogs.",
        paths: ["UsrClass.dat → Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache"],
        registry: "HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache",
        parser: "Registry Explorer, regripper",
        notes: "Shows apps run via shell even if binary deleted."
      },
      {
        id: "run-keys",
        name: "Run / RunOnce Keys",
        description: "Persistence - programs set to run at logon.",
        paths: ["NTUSER.DAT + SOFTWARE hive"],
        registry: "HKCU/HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run | RunOnce",
        parser: "regripper, Autoruns",
        notes: "Check both HKCU and HKLM. Also RunOnceEx, Policies\\Explorer\\Run."
      },
      {
        id: "recentdocs",
        name: "RecentDocs",
        description: "Recently opened documents by extension and MRU list.",
        paths: ["NTUSER.DAT → Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs"],
        registry: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
        parser: "Registry Explorer, regripper",
        notes: "Subkeys per file extension (.doc, .pdf, etc.)."
      },
      {
        id: "typedpaths",
        name: "TypedPaths / TypedURLs",
        description: "User-typed paths in Explorer address bar and IE/legacy URL bar.",
        paths: ["NTUSER.DAT → ...\\Explorer\\TypedPaths", "NTUSER.DAT → ...\\Internet Explorer\\TypedURLs"],
        registry: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\TypedPaths",
        parser: "Registry Explorer",
        notes: "TypedURLs for IE; Modern Edge uses WebCache."
      },
      {
        id: "mountpoints",
        name: "MountedDevices",
        description: "USB/removable device connection history - volume GUID, serial hints.",
        paths: ["SYSTEM hive"],
        registry: "SYSTEM\\MountedDevices",
        parser: "USBDeview, regripper, Registry Explorer",
        notes: "Correlate with USBSTOR and setupapi.dev.log."
      },
      {
        id: "usbstor",
        name: "USBSTOR",
        description: "USB storage device enumeration - vendor, product, serial, install date.",
        paths: ["SYSTEM hive"],
        registry: "SYSTEM\\CurrentControlSet\\Enum\\USBSTOR",
        parser: "USBDeview, regripper",
        notes: "Serial number in device instance path when provided by device."
      },
      {
        id: "compatibility-assistant",
        name: "Program Compatibility Assistant (PCA)",
        description: "Tracks executables that triggered compatibility dialogs.",
        paths: ["C:\\Windows\\appcompat\\pca\\PcaAppLaunchDic.txt", "C:\\Windows\\appcompat\\pca\\PcaGeneralDb0.txt"],
        registry: null,
        parser: "Manual review, PcaParser",
        notes: "Win10+. Supplement to AmCache/Prefetch."
      }
    ]
  },
  {
    id: "execution",
    title: "Execution & Persistence",
    icon: "fa-terminal",
    artifacts: [
      {
        id: "tasks",
        name: "Scheduled Tasks",
        description: "Scheduled job definitions - persistence and execution timing.",
        paths: ["C:\\Windows\\System32\\Tasks\\", "C:\\Windows\\Tasks\\"],
        registry: "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache",
        parser: "autoruns, schtasks /query, TaskScheduler parser",
        notes: "XML task files under System32\\Tasks mirror registry cache."
      },
      {
        id: "services",
        name: "Windows Services",
        description: "Service binaries and start type - persistence via service install.",
        paths: ["C:\\Windows\\System32\\services.exe (live)", "SYSTEM hive → Services"],
        registry: "HKLM\\SYSTEM\\CurrentControlSet\\Services",
        parser: "autoruns, sc query, Registry Explorer",
        notes: "Check ImagePath for malicious binaries."
      },
      {
        id: "wmi",
        name: "WMI Repository",
        description: "WMI permanent event subscriptions - fileless persistence.",
        paths: ["C:\\Windows\\System32\\wbem\\Repository\\"],
        registry: "HKLM\\SOFTWARE\\Microsoft\\WBEM",
        parser: "Autoruns, wmiprvse analysis, PyWMIPersistence",
        notes: "Check __EventFilter, __EventConsumer, __FilterToConsumerBinding."
      },
      {
        id: "startup",
        name: "Startup Folder",
        description: "Programs launched at user logon via Start Menu startup.",
        paths: [
          "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\",
          "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\"
        ],
        registry: null,
        parser: "autoruns",
        notes: "Per-user and all-users locations."
      },
      {
        id: "powershell-history",
        name: "PowerShell Console History",
        description: "PSReadLine command history - typed PowerShell commands.",
        paths: ["%APPDATA%\\Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt"],
        registry: null,
        parser: "Manual review, MFTECmd",
        notes: "Per-user. Only persists if PSReadLine enabled (default Win10+)."
      },
      {
        id: "ps-transcripts",
        name: "PowerShell Transcripts",
        description: "Logged PS sessions when Start-Transcript enabled via GPO/policy.",
        paths: ["%USERPROFILE%\\Documents\\", "GPO-defined path"],
        registry: "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\Transcription",
        parser: "Manual review",
        notes: "Not enabled by default on most hosts."
      },
      {
        id: "sysmon",
        name: "Sysmon Event Log",
        description: "Process create, network connect, file create - if Sysmon installed.",
        paths: ["Microsoft-Windows-Sysmon/Operational.evtx"],
        registry: null,
        parser: "SysmonView, chainsaw, Event Log Explorer",
        notes: "Not default; gold if present. Config at C:\\Windows\\Sysmon.cfg or registry."
      }
    ]
  },
  {
    id: "logs",
    title: "Event Logs",
    icon: "fa-scroll",
    artifacts: [
      {
        id: "security-evtx",
        name: "Security.evtx",
        description: "Logons (4624/4625), process creation (4688), privilege use, object access.",
        paths: ["C:\\Windows\\System32\\winevt\\Logs\\Security.evtx"],
        registry: null,
        parser: "EvtxECmd, chainsaw, Event Log Explorer",
        notes: "4688 requires audit policy. Often overwritten when full."
      },
      {
        id: "system-evtx",
        name: "System.evtx",
        description: "Service/driver events, crashes, time changes, patch install.",
        paths: ["C:\\Windows\\System32\\winevt\\Logs\\System.evtx"],
        registry: null,
        parser: "EvtxECmd, chainsaw",
        notes: "Event 7045 = new service installed."
      },
      {
        id: "application-evtx",
        name: "Application.evtx",
        description: "Application errors and installs - MSI, app crashes.",
        paths: ["C:\\Windows\\System32\\winevt\\Logs\\Application.evtx"],
        registry: null,
        parser: "EvtxECmd",
        notes: null
      },
      {
        id: "powershell-evtx",
        name: "PowerShell Operational",
        description: "Script block logging (4104), module logging, engine start.",
        paths: ["C:\\Windows\\System32\\winevt\\Logs\\Microsoft-Windows-PowerShell%4Operational.evtx"],
        registry: null,
        parser: "EvtxECmd, chainsaw (Sigma)",
        notes: "Enable via GPO for 4104 script blocks - critical for IR."
      },
      {
        id: "defender-evtx",
        name: "Windows Defender",
        description: "Malware detections, quarantine, scan results.",
        paths: [
          "Microsoft-Windows-Windows Defender%4Operational.evtx",
          "Microsoft-Windows-Windows Defender%4WHC.evtx"
        ],
        registry: null,
        parser: "EvtxECmd, Defender UI",
        notes: "Quarantine files in C:\\ProgramData\\Microsoft\\Windows Defender\\Quarantine\\"
      },
      {
        id: "rdp-evtx",
        name: "TerminalServices / RDP",
        description: "RDP logon success/fail, reconnect, session disconnect.",
        paths: [
          "Microsoft-Windows-TerminalServices-LocalSessionManager%4Operational.evtx",
          "Microsoft-Windows-TerminalServices-RemoteConnectionManager%4Operational.evtx"
        ],
        registry: null,
        parser: "EvtxECmd, chainsaw",
        notes: "Event 1149 = successful RDP auth. Correlate with Security 4624 Type 10."
      },
      {
        id: "taskscheduler-evtx",
        name: "Task Scheduler Operational",
        description: "Task created, deleted, executed - ties to persistence.",
        paths: ["Microsoft-Windows-TaskScheduler%4Operational.evtx"],
        registry: null,
        parser: "EvtxECmd",
        notes: "Event 106 = registered, 140 = updated, 200/201 = execution."
      },
      {
        id: "setupapi",
        name: "setupapi.dev.log",
        description: "USB device install log - driver install timestamps per device.",
        paths: ["C:\\Windows\\inf\\setupapi.dev.log", "C:\\Windows\\setupapi.dev.log"],
        registry: null,
        parser: "USB Device Viewer, manual parse",
        notes: "Section headers === Device Install === with timestamp."
      }
    ]
  },
  {
    id: "user-activity",
    title: "User Activity & Applications",
    icon: "fa-user-clock",
    artifacts: [
      {
        id: "webcache",
        name: "WebCache / ESE Database",
        description: "Edge/IE browsing history, cookies, cache in Extensible Storage Engine DB.",
        paths: ["%LOCALAPPDATA%\\Microsoft\\Windows\\WebCache\\WebCacheV01.dat"],
        registry: null,
        parser: "ESEDatabaseView, NirSoft IEHistoryView, RBCmd",
        notes: "WebCacheV24.dat on newer builds. Lock live while browser open."
      },
      {
        id: "chrome",
        name: "Google Chrome",
        description: "History, downloads, cookies, logins (if not encrypted/synced).",
        paths: [
          "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\History",
          "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cookies",
          "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Downloads"
        ],
        registry: null,
        parser: "ChromeCacheView, Hindsight, SQLite browser",
        notes: "SQLite databases. Multiple profiles under User Data\\<Profile>."
      },
      {
        id: "firefox",
        name: "Mozilla Firefox",
        description: "Browsing history, downloads, form history.",
        paths: ["%APPDATA%\\Mozilla\\Firefox\\Profiles\\<profile>\\places.sqlite"],
        registry: null,
        parser: "SQLite browser, Hindsight",
        notes: "profiles.ini maps profile folders."
      },
      {
        id: "edge-chromium",
        name: "Microsoft Edge (Chromium)",
        description: "Same structure as Chrome - history, cookies, extensions.",
        paths: ["%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\History"],
        registry: null,
        parser: "Chrome-based forensic tools, Hindsight",
        notes: "Chromium-based; same SQLite schema as Chrome."
      },
      {
        id: "outlook",
        name: "Outlook PST/OST",
        description: "Email, attachments, calendar - local mail store.",
        paths: ["%LOCALAPPDATA%\\Microsoft\\Outlook\\*.ost", "%USERPROFILE%\\Documents\\Outlook Files\\*.pst"],
        registry: null,
        parser: "PST Viewer, AXIOM, FTK",
        notes: "OST is cached Exchange; PST is POP/IMAP/archive."
      },
      {
        id: "rdp-bitmap",
        name: "RDP Bitmap Cache",
        description: "Cached screen regions from RDP sessions - can reconstruct partial screenshots.",
        paths: ["%LOCALAPPDATA%\\Microsoft\\Terminal Server Client\\Cache\\bcache*.bmc"],
        registry: null,
        parser: "bmc-tools, RDP Bitmap Cache Parser",
        notes: "Also Default.rdp in same parent folder for saved connections."
      },
      {
        id: "default-rdp",
        name: "Default.rdp / RDP Config",
        description: "Saved RDP connection settings - hostnames, usernames.",
        paths: ["%USERPROFILE%\\Documents\\Default.rdp", "%USERPROFILE%\\Documents\\*.rdp"],
        registry: "HKCU\\Software\\Microsoft\\Terminal Server Client\\Servers",
        parser: "Manual review, Registry Explorer",
        notes: "Servers key stores MRU of connection hostnames."
      },
      {
        id: "wer",
        name: "Windows Error Reporting (WER)",
        description: "Crash reports - executable name, path, module, timestamp.",
        paths: [
          "C:\\ProgramData\\Microsoft\\Windows\\WER\\ReportArchive\\",
          "C:\\ProgramData\\Microsoft\\Windows\\WER\\ReportQueue\\"
        ],
        registry: null,
        parser: "WER parsing scripts, AppCrashView",
        notes: "Proves a program ran and crashed even if deleted."
      },
      {
        id: "timeline",
        name: "ActivitiesCache.db",
        description: "Windows Timeline / Activity History - app usage across devices.",
        paths: ["%LOCALAPPDATA%\\ConnectedDevicesPlatform\\<ID>\\ActivitiesCache.db"],
        registry: null,
        parser: "WxTCmd, SQLite browser",
        notes: "Win10 1803+. Synced if MS account linked."
      }
    ]
  },
  {
    id: "network",
    title: "Network & Remote Access",
    icon: "fa-network-wired",
    artifacts: [
      {
        id: "firewall-log",
        name: "Windows Firewall Log",
        description: "Allowed/blocked connections if logging enabled.",
        paths: ["%SystemRoot%\\System32\\LogFiles\\Firewall\\pfirewall.log"],
        registry: "HKLM\\SOFTWARE\\Policies\\Microsoft\\WindowsFirewall\\...\\Logging",
        parser: "Manual parse, LogParser",
        notes: "Disabled by default - check if policy enabled it."
      },
      {
        id: "hosts",
        name: "Hosts File",
        description: "Static DNS overrides - used in malware redirection.",
        paths: ["C:\\Windows\\System32\\drivers\\etc\\hosts"],
        registry: null,
        parser: "Manual review",
        notes: null
      },
      {
        id: "vpn-logs",
        name: "VPN Client Logs",
        description: "VPN connection history - vendor-specific paths.",
        paths: ["C:\\ProgramData\\<VPN Vendor>\\Logs\\", "%APPDATA%\\<VPN Vendor>\\"],
        registry: null,
        parser: "Vendor-specific",
        notes: "Check installed VPN (Cisco AnyConnect, GlobalProtect, etc.)."
      },
      {
        id: "zone-identifier",
        name: "Zone.Identifier (ADS)",
        description: "Mark-of-the-Web - proves file downloaded from internet.",
        paths: ["<file>:Zone.Identifier (NTFS Alternate Data Stream)"],
        registry: null,
        parser: "streams.exe, LECmd, PowerShell Get-Content -Stream Zone.Identifier",
        notes: "Not a single path - ADS attached to downloaded files."
      }
    ]
  },
  {
    id: "linux",
    title: "Linux Artifacts",
    icon: "fa-linux",
    artifacts: [
      {
        id: "linux-auth",
        name: "Auth / Syslog",
        description: "SSH logins, sudo usage, authentication failures.",
        paths: ["/var/log/auth.log", "/var/log/secure", "/var/log/syslog"],
        registry: null,
        parser: "grep, journalctl, log2timeline",
        notes: "Path varies by distro (Debian vs RHEL)."
      },
      {
        id: "linux-bash-history",
        name: "Bash History",
        description: "Interactive shell commands per user.",
        paths: ["~/.bash_history", "/root/.bash_history"],
        registry: null,
        parser: "Manual review",
        notes: "Can be unset (HISTFILE). Also .zsh_history for Zsh."
      },
      {
        id: "linux-cron",
        name: "Cron Jobs",
        description: "Scheduled task persistence.",
        paths: ["/etc/crontab", "/etc/cron.d/", "/var/spool/cron/crontabs/"],
        registry: null,
        parser: "Manual review, UAC",
        notes: "Per-user crontabs in /var/spool/cron/crontabs/<user>."
      },
      {
        id: "linux-systemd",
        name: "Systemd Units",
        description: "Service persistence via custom unit files.",
        paths: ["/etc/systemd/system/", "~/.config/systemd/user/"],
        registry: null,
        parser: "systemctl list-unit-files",
        notes: "Check timers as well as services."
      },
      {
        id: "linux-ssh-keys",
        name: "SSH Authorized Keys",
        description: "Persistence via trusted SSH public keys.",
        paths: ["~/.ssh/authorized_keys", "/root/.ssh/authorized_keys"],
        registry: null,
        parser: "Manual review",
        notes: "Also check /etc/ssh/sshd_config for AuthorizedKeysFile."
      },
      {
        id: "linux-utmp",
        name: "utmp / wtmp / btmp",
        description: "Login records, reboot history, failed login attempts.",
        paths: ["/var/log/wtmp", "/var/log/btmp", "/var/run/utmp"],
        registry: null,
        parser: "last, lastb, utmpdump",
        notes: "Binary format - use last/lastb commands."
      }
    ]
  }
];