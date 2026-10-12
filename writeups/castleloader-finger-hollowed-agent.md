---
id: castleloader-finger-hollowed-agent
title: "ClickFix finger Lure to CastleLoader and a Hollowed node.exe Agent"
summary: "A finger.exe ClickFix paste leads to CastleLoader, a Node.js launcher that hollows a second node.exe, and a Rust remote-access and stealer agent. Only two of five sandbox runs were given any tasks."
category: DFIR
date: 2026-10-12
tags: [clickfix, delivery-chain, process-injection, rat, malware, windows, castleloader, netsupport]
---

# ClickFix finger Lure to CastleLoader and a Hollowed node.exe Agent

*Lab analysis of vendor sandbox runs: no client data. IOCs shared for defensive use.*

## TL;DR

- A ClickFix paste runs `finger.exe`, and the lines it returns are executed: IronPython, then a Python stager, then shellcode, then the CastleLoader core
- The C2 decides what a sandbox sees: of five runs, two were handed tasks and three were handed nothing
- The tasks delivered NetSupport Manager and a Node.js package; its launcher starts a second `node.exe` and runs the agent there, so the agent never lives in the process that read `index.js`
- The agent is a 19.5 MB Rust remote-access and stealer tool. I couldn't find how it learned its server name

```
CLASS   : Loader / RAT / infostealer
VECTOR  : ClickFix (Win+R paste of a finger.exe one-liner)
IMPLANT : CastleLoader core; Rust agent onedriveupdater.exe inside a hollowed node.exe
C2      : elrianda[.]com (loader), homelygrill[.]com (agent, WebSocket)
IMPACT  : Keystroke capture, hidden-desktop remote control, browser, wallet and Telegram theft, NetSupport remote access
```

## Attack Chain

```
Win+R paste: cmd /c ... finger <id>@searperfect[.]com → returned lines run as a batch
  → curl IronPython from GitHub → ipyw32 -c (zlib + base64 Python)
  → hxxps://elrianda[.]com/<guid>/timer3 (XOR, shellcode from an executable heap)
  → stage 1 shellcode → GET /<guid>/v3 (RC4) → stage 2 → CastleLoader core
  → ChaCha20 get_tasks → three tasks
      ├─ obalakino[.]com .../default → RC4 → ZIP → NetSupport Manager, silent
      └─ kiriosyka[.]com .../sqr-viewertr3 → RC4 → ZIP → node.exe + index.js
           → two AES-GCM blobs → blob 1 hollows a second node.exe with blob 2
           → Rust agent → WebSocket to homelygrill[.]com
```

## What happened

The paste is a `cmd /c` one-liner that runs `finger.exe` against `searperfect[.]com` and executes what comes back. That is a batch script. It pulls IronPython 3.4.2 from GitHub, kills and restarts `explorer.exe`, and runs a zlib-compressed Python one-liner. The Python downloads `timer3` from `elrianda[.]com` with certificate checks off and `exec`s it. `timer3` hides its Base64 behind sprinkled Cyrillic letters, XORs out a shellcode with a 23-byte key and runs it from an executable heap.

The shellcode is a 6 KB downloader with hashed API lookups and stack-built strings. It fetches `/v3`, RC4-decrypts it with the file's own first 64 bytes and hands control over through a `ReplaceTextW` dialog hook. The next stage maps an embedded PE into its own process: the CastleLoader core. ANY.RUN, VirusTotal and Hybrid Analysis all tag it CastleLoader.

The core fetches its settings with a 31-character token as the `User-Agent`, then talks ChaCha20 over base64. The key and nonce are 44 constant bytes in the code, so every captured check-in decodes (I'm not printing them). It crashes itself on a CIS-language system unless a marker file exists, and, when the tasking enables the check, on VMware.

I have five sandbox runs. Two were given tasks. Three were not: a 404 from a fake internet and two 164-byte replies, one of which I decoded and reads `tasks: {}`. ANY.RUN #2, #3 and #4 ran the same way (live, no proxy), and only #4 got tasks. The server decided, and I don't know why.

### Inside the second stage

The three tasks name two payload hosts and one command. `obalakino[.]com` serves a ZIP of genuine NetSupport Manager files, set up silent, with two gateways on port 725. `kiriosyka[.]com` serves a 55 MB ZIP that unpacks to `C:\ProgramData\NodeView`: `node.exe`, an obfuscated `index.js`, the `ffi-rs` module and two GUID-named `.tmp` files.

`index.js` is only a launcher: it decrypts both files with AES-256-GCM, starts blob 1 as a thread and hands it blob 2. Blob 1 finds its APIs by hash. Hashing the export names of the DLLs on a Windows PC names all 49. They include process creation, writing into another process and thread contexts, which is process hollowing. ANY.RUN flagged the launcher `node.exe` as "Application launched itself", and five seconds later a second `node.exe index.js` appeared with 87 loaded modules against the launcher's 40. The theft and WebSocket detections belong to it, and the agent's own log says `injected host (node.exe)`. Blob 1 does more than I describe here.

Blob 2 is `onedriveupdater.exe`, a Rust agent built about 15 hours before the run. The server pushes keyboard-monitor rules for 35 process names: browsers, wallets, password managers. The agent offers a hidden-desktop remote viewer, webcam, a remote shell, and browser, wallet and Telegram theft uploaded as `data.zip` (read from the code; the sandbox flagged credential and wallet access). It starts copies of itself the same way, as `index.js --watch` and `--plnag`. The `--plnag` copy shows a fake Windows Phone Link first-run window whose buttons open the real app. It is probably meant to get a phone paired; I couldn't confirm that.

It persists with a logon task, `\WebViewNode`, and `\RuntimeUtil` every two hours, a reinstaller that re-downloads from `liokida[.]com`. It also contains a Steam dead-drop resolver: it can read a hex string from a Steam profile and decode a server name from it. It never fired. The agent's first DNS query was `homelygrill[.]com` itself: no Steam name and no `/health` probe before it. That name is not in the file in plain text, UTF-16, reversed, base64, hex, XOR or in pieces, so how the agent learned it is still open.

I worked this with an AI assistant and kept a list of its wrong calls. Cheap tests caught them, not its confidence.

## Timeline

T+0 is the first DNS lookup of the C2 in ANY.RUN #4.

```
T+46 s   cmd /c cd %ProgramData%\NodeView && node.exe index.js; the launcher node.exe starts
T+51 s   second node.exe starts; it starts the --watch and --plnag copies within a second
T+53 s   first DNS lookup of homelygrill[.]com
T+2 min  WebSocket upgrade; the server pushes the keyboard-monitor rules
T+6 min  NetSupport client32.exe starts from a scheduled task
T+16 min crypto-wallet access flagged by the sandbox
```

## How I know

- **Blob 1 hollows a second `node.exe`.** The 49 API names from the export-name wordlist, the call order in the code (suspended `CreateProcessW`, then memory writes, thread context, resume), and ANY.RUN #4's process list with module counts. High.
- **The blobs are what the launcher says.** I resolved the 32-number AES key in `index.js` with a parser that only accepts numbers and arithmetic, never running it. Both GCM tags verified, and a wrong key fails outright. High.
- **The sandbox log is this agent.** The run's log lines (`kbd watcher installed`, `task uploaded`), the version `0.2.109` and the reinstaller mutex are strings in the decrypted PE. High.
- **The server decided the tasking.** The raw capture decoded with the constant ChaCha key: the empty reply I decoded is `tasks: {}`, and the other differs only in being the same size. High that it was the server; why is unknown.
- **The family name.** Three services tag it CastleLoader and eleven details match published analysis. Moderate: I haven't seen a public write-up of the agent half.

## Detection

Written for Defender XDR Advanced Hunting. They also run in Sentinel where the Defender XDR connector streams the table.

```kql
// ClickFix: finger.exe fetching a script; it is rarely run on purpose
// Status: untested
DeviceProcessEvents
| where FileName =~ "finger.exe"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine,
          InitiatingProcessFileName, InitiatingProcessCommandLine
```

```kql
// node.exe in ProgramData starting another node.exe: launcher to hollowed child
// Status: untested
DeviceProcessEvents
| where FileName =~ "node.exe" and FolderPath startswith @"C:\ProgramData\"
| where InitiatingProcessFileName =~ "node.exe"
| project Timestamp, DeviceName, AccountName, FolderPath, ProcessCommandLine,
          InitiatingProcessCommandLine, InitiatingProcessParentFileName
```

- Compare a `node.exe` in memory with its file on disk: the agent's copies had far more loaded modules (87) than the launcher (40).
- A `node.exe` that opens a WebSocket to `/api/v1/agent/ws` on a rare domain is the agent talking.
- NetSupport `client32.exe` running from `C:\ProgramData\...\Network`, started by a scheduled task, with a gateway on port 725.

## ATT&CK

| ID | Technique | Where |
|----|-----------|-------|
| T1204.004 | User Execution: Malicious Copy and Paste | ClickFix `finger` paste |
| T1059.003 | Command and Scripting Interpreter: Windows Command Shell | the lure and the batch it returns |
| T1059.006 | Command and Scripting Interpreter: Python | IronPython stager and `timer3` |
| T1059.007 | Command and Scripting Interpreter: JavaScript | `index.js` launcher |
| T1620 | Reflective Code Loading | shellcode in an executable heap; stage 3 mapped in memory |
| T1105 | Ingress Tool Transfer | IronPython, `/v3`, both payloads |
| T1027.007 | Obfuscated Files or Information: Dynamic API Resolution | djb2 hashing in the shellcode, the loader and blob 1 |
| T1497.001 | Virtualization/Sandbox Evasion: System Checks | the VMware check |
| T1573.001 | Encrypted Channel: Symmetric Cryptography | ChaCha20 containers, RC4 payloads |
| T1071.001 | Application Layer Protocol: Web Protocols | HTTPS and WebSocket |
| T1055.012 | Process Injection: Process Hollowing | blob 1 into a second `node.exe` |
| T1219.002 | Remote Access Tools: Remote Desktop Software | NetSupport Manager |
| T1053.005 | Scheduled Task/Job: Scheduled Task | `\WebViewNode`, `\RuntimeUtil` |
| T1056.001 | Input Capture: Keylogging | keyboard monitor |
| T1555.003 | Credentials from Password Stores: Credentials from Web Browsers | browser theft |
| T1113 | Screen Capture | hidden-desktop viewer |
| T1125 | Video Capture | webcam |
| T1102.001 | Web Service: Dead Drop Resolver | Steam resolver (in the code, not seen used) |

## IOCs

### Network

```
searperfect[.]com                                   finger server (lure)
elrianda[.]com                                      C2: timer3, /v3, tasking (185[.]168[.]208[.]41, unverified)
kiriosyka[.]com                                     payload host (167[.]148[.]201[.]39)
obalakino[.]com                                     payload host (23[.]94[.]252[.]14)
homelygrill[.]com                                   agent C2, WebSocket /api/v1/agent/ws (89[.]185[.]80[.]28)
liokida[.]com                                       reinstall host
lepetitzincdetroit[.]com:725                        NetSupport gateway
screening-consulting[.]com:725                      NetSupport gateway
```

### Hashes

```
CastleLoader core   d5878ead5480e30c6e5fca5071064c1d7b40b85cfbcc26f30a293c8bc3515b63
default (ZIP)       5724d6213a8db24abdc1fbf7cc23ce845cb2de98f5fcc0ec3a4fdf365e2b0f9f
client32.exe        0bec75c57ab96bfa53861dcc582bfb6b204d3a83964fbb581371f27dd3fb7ee6
index.js            abf4071fd91db063b5b0a168022f0e63c53e81d59b181c92207eb608e113f878
blob 1 (.tmp)       a562c914bd83e551eecc60fcf53264dab955711121b32af3a6313b19cbfdb92d
blob 2 (.tmp)       c920606aa78ac40330dca86a8144d7a10419552a7774f5571552b9bd0f062710
blob 1 (decrypted)  7ef943cb1e04e6356d8beb522f3ad38b1119746c59182cb870da76ac4d528c24
blob 2 (decrypted)  05cbcd7f44f9c2ddff261d12cd65b2c71b5eacadf27207647532b69683a28ce3
```

### Host

```
C:\ProgramData\NodeView\               node.exe, index.js, ffi-rs, two GUID-named .tmp files
C:\ProgramData\Prodclear\Packages\Network\   NetSupport client32.exe
C:\ProgramData\wuboot.dbg, wuboot.diag  agent debug files
Scheduled tasks: \WebViewNode (logon), \RuntimeUtil (every 2 hours)
Mutex (reinstaller): Local\WUStateMgr_2f9a
Window classes: kplnagwnd, plnagctl
Agent PDB: onedriveupdater.pdb; imphash 2557566ebefe5ec575dac931a1095380; version 0.2.109
Launcher command: cmd /c cd %ProgramData%\NodeView && node.exe index.js
```
