---
id: ditto-delivery-chain
title: "Ditto DLL Side-Loading and Domain Compromise"
summary: "A vishing call and Quick Assist session led to a side-loaded RAT and a full domain compromise 30 minutes after first access."
category: DFIR
date: 2026-10-02
tags: [vishing, quick-assist, ditto, dll-sideload, rat, domain-compromise, delivery-chain, credential-access, social-engineering, windows, malware]
---

# Ditto DLL Side-Loading and Domain Compromise

## TL;DR

- Vishing call, then an accepted Quick Assist session gave the operator the keyboard
- First payload was blocked by EDR; the second, a RAT side-loaded through a fake `vcruntime140.dll` in a copy of Ditto, landed three minutes later
- C2 over UDP/53, encrypted, to `45.55.94.174`
- PetitPotam relay, then DCSync, then KRBTGT, 30 minutes after first access
- Three footholds by the 48-minute mark; no ransomware, so access looks like the goal

```
CLASS   : Domain intrusion / KRBTGT compromise
VECTOR  : Vishing + Microsoft Quick Assist
IMPLANT : Botan RAT (userenv.dll, then fake vcruntime140.dll under Ditto)
C2      : 45.55.94.174 (DNS-as-transport, UDP/53)
IMPACT  : KRBTGT compromise, lateral movement, persistent access
TTC     : ~30 min to KRBTGT, 48 min to multi-host persistence
```

## Attack Chain

```
Vishing call → Quick Assist session → recon
  → pd_53updates.msi → pdf24.exe + userenv.dll (blocked)
  → dt_53updates.msi → Ditto.exe + fake vcruntime140.dll
  → Botan RAT beacon (UDP/53)
  → PetitPotam → NTLM relay → DCSync → KRBTGT
  → RDP with a privileged service account → GetScreen + DWAgent
```

## What happened

The operator called the user and talked them into accepting a Quick Assist session. Two minutes of `whoami`, `ipconfig` and `net user /domain` later, they pulled an MSI from `45.61.163.226`. The first one tried to side-load a malicious `userenv.dll` under `pdf24.exe`, and EDR blocked it. The strings were enough to identify the family anyway: a Botan 3 AES-GCM RAT built with MinGW, with the C2 base64-encoded inside.

Three minutes later a second MSI worked. It installed a copy of Ditto, an open-source clipboard manager, under `%LOCALAPPDATA%\Ditto\`, with a fake `vcruntime140.dll` next to it and a Startup shortcut for persistence. Ditto loads the local DLL ahead of the System32 copy, so the implant runs inside a legitimate signed-looking process. Ditto is a good host because a clipboard manager already makes API calls that would look suspicious in anything else.

The implant beacons to `45.55.94.174` on UDP/53. It isn't a real resolver and the packets aren't valid DNS, so it's DNS-as-transport with an AES-256-GCM beacon inside.

## Straight to the domain

This is the part that matters. About nine minutes after the second MSI, a domain controller was coerced with PetitPotam to authenticate to `167.172.212.171`, and about eleven minutes later the workstation ran DCSync against that DC. That pulled `krbtgt` and privileged account hashes. A forged ticket works until KRBTGT is reset twice.

A Domain Admin service account with no logon restrictions made the rest trivial. The operator used it to RDP to two more servers and dropped GetScreen.me and DWAgent on each. By the end there were three footholds, and the blocked first payload cost them maybe ninety seconds.

## Timeline

Relative to the Quick Assist session starting.

```
T+0     Quick Assist session established
T+7     Stage 1 MSI downloaded
T+9     Stage 1 side-load blocked
T+10    Stage 2 MSI downloaded, Ditto installed
T+18    PetitPotam against the DC
T+30    DCSync observed
T+40    RDP to second host
T+45    RDP to third host
T+48    GetScreen / DWAgent persistence on both
```

## Detection

- EDR caught Stage 1 as a side-load. Stage 2 wasn't caught, so hunt for odd `vcruntime140.dll` / `mfc140u.dll` next to portable EXEs in `%LOCALAPPDATA%`.
- UDP/53 to a non-resolver IP is a cheap tell.
- An unsolicited call followed by a Quick Assist request should trigger a second verification step.
- After any KRBTGT exposure, reset it twice. One reset leaves forged tickets valid.

## IOCs

### Network

```
45.55.94.174        C2 (UDP/53)
45.61.163.226       MSI staging
167.172.212.171     NTLM relay endpoint
NDUuNTUuOTQuMTc0    Base64 of 45.55.94.174
```

### Hashes

```
dt_53updates.msi    849a2c808694426b2afb8848dcea00f9e64538a503b05543e38af1fdee9dd9f8
Ditto.exe           b120f170046b0ba5952d4957dd25e0a394ad28f743b47f2152c973e9fd94f08d
vcruntime140.dll    9d20d9f17dddedd3ea057b68e42ef2ca86ff7c776d59b045213f377ba1707291   (fake)
mfc140u.dll         27ebf5ed915a573aa10a4ec18b3626a297032f3c46afc2daf45d8bb1ffecfe66
msvcp140.dll        968bbd2a36b04cc5795c6fc99afe85e4d294ff9c28032ce0e870463827181799
vcruntime140u.dll   eb6a3a491efcc911f9dff457d42fed85c4c170139414470ea951b0dafe352829
ICU_Loader.dll      15a9c2550759eee371d57fa69e4d7d596235f2f061cd17ca123cba535a24fbcd
DittoUtil.dll       1ba47b26175855cba499ff8e951af5193e662319e96d497f4270daac440da1fd
```

### Host

```
%LOCALAPPDATA%\Ditto\                  (Ditto.exe, fake vcruntime140.dll, companion DLLs, Addins\DittoUtil.dll)
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Ditto.lnk
userenv.dll dropped next to pdf24.exe (Stage 1)
Implant GUID: 573d2149-b7b1-4d54-b0d4-403195f3984e
Build strings: Botan 3.0.0 (unreleased), AES-256/GCM, GCC: (GNU) 13-win32
```

## YARA

```
rule Ditto_BotanRAT_Implant
{
    meta:
        description = "Detects Ditto-side-loaded Botan RAT implant"
        author      = "ghostsh-labs"

    strings:
        $botan   = "Botan 3.0.0 (unreleased" ascii
        $aes     = "AES-256/GCM"             ascii
        $mlock   = "BOTAN_MLOCK_POOL_SIZE"   ascii
        $beacon  = "\"arch\": \"windows\""   ascii
        $ip_b64  = "NDUuNTUuOTQuMTc0"        ascii
        $guid    = "573d2149-b7b1-4d54-b0d4-403195f3984e" ascii
        $mingw   = "GCC: (GNU) 13-win32"     ascii
        $authtag = "Invalid authentication tag" ascii

    condition:
        uint16(0) == 0x5A4D and
        filesize < 8MB and
        (
            ($botan and $aes and ($mlock or $authtag)) and
            ($ip_b64 or $guid or $beacon) and
            $mingw
        )
}
```
