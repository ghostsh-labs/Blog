<!--
  Writeup template. Not published: build_writeups.py skips this file.
  Copy it to a new lowercase-name.md (e.g. mynewpost.md) to start a post.
-->

# Style

A writeup answers four things: what happened, what I found, the attack
chain, and the IOCs. That's it. A ClickFix doesn't need 5,000 words.

- Tell it in the order it happened, in short plain sentences.
- Go deeper only on what's actually interesting (a novel C2 trick, a fast domain compromise). Everything else gets a sentence.
- No API-by-API walkthroughs, no pasted scripts, no ATT&CK tables. Show a snippet only if it's the evidence.
- Hedge once, where the evidence is thin.
- No filler ("it's worth noting", "furthermore", "in summary").
- Target 300-500 words of prose. IOCs, timeline and YARA don't count.

# Skeleton

Same order every post. Drop a section if it doesn't apply; don't rename it.

1. `# Title`
2. `## TL;DR`: 3-5 short bullets, then the quick-reference block:
   ```
   CLASS   :
   VECTOR  :
   IMPLANT :
   C2      :
   IMPACT  :
   ```
   Optional `TTC` line only with real timestamps.
3. `## Attack Chain`: the arrow diagram, kept tight.
4. `## What happened`: the story and what you found. Add one extra `##` section for the interesting part, if there is one (e.g. "The Steam dead drop").
5. `## Timeline`: only with real timestamps.
6. `## Detection`: 2-3 concrete bullets. Skip if there's nothing beyond the IOCs.
7. `## IOCs`: `### Network`, `### Hashes`, `### Host`, in code blocks so they copy cleanly. Skip empty ones.
8. `## YARA`: only if you wrote a rule.

# Frontmatter

```
---
id: short-url-slug
title: "Post Title"
summary: "One sentence for the card."
category: DFIR
date: YYYY-MM-DD
tags: [clickfix, rat, windows]
---
```

# Tags

`clickfix, vishing, quick-assist, dll-sideload, process-injection, rat,
ransomware, domain-compromise, delivery-chain, credential-access,
social-engineering, windows, malware`

Proper-noun tags (`donut`, `ditto`, `castle-rat`) are fine in addition to
these, not instead of them.
