<!--
  Writeup template. Not published: build_writeups.py skips this file.
  Copy it to a new lowercase-name.md (e.g. mynewpost.md) to start a post.
-->

# Style

Short, narrative, human. Tell it in the order it happened, in plain
sentences. Every sentence should be something only someone who worked the
case could write. Target a 4-5 minute read.

- Prose carries the explanation, code blocks carry evidence. Don't restate a code block in prose.
- Go deeper only on what's actually interesting. Everything else gets a sentence.
- No API-by-API walkthroughs, no pasted scripts, no background ("what is ClickFix"), no generic advice.
- Hedge once, where the evidence is thin. Label unknowns in a clause ("unconfirmed", "didn't recover"). Don't invent.
- No filler ("it's worth noting", "furthermore", "in summary").

# Confidentiality (do this first)

These are sanitized from real cases. Remove client or org names, hostnames,
usernames, domain or tenant names, internal IPs, ticket numbers, and
absolute incident dates and times (use T+ relative times). Generalize
weaknesses in the victim's environment ("an over-privileged service
account"). Attacker infrastructure and hashes stay.

# Skeleton

Same order every post. Drop a section if it doesn't apply; don't rename it.

1. `# Title`, then the line: *Sanitized: no client-identifying details. IOCs shared for defensive use.*
2. `## TL;DR`: 3-5 short bullets, then the quick-reference block:
   ```
   CLASS   :
   VECTOR  :
   IMPLANT :
   C2      :
   IMPACT  :
   ```
   Optional `TTC` line only with real timestamps.
3. `## Attack Chain`: the chain link line, then the arrow diagram, kept tight. On the site the build swaps the link line for the interactive chain, shown inside the post, and folds the arrow diagram under "Text version".
   ```
   **[Open the interactive attack chain](<id>-chain.html)**: click a step for its evidence and IOCs.
   ```
   Copy `chains/castleloader-finger-hollowed-agent.js` to `chains/<id>.js` (`<id>` is the frontmatter id), fill it in, run `python make_chain.py <id> --check` inside `blog\`. It must report no errors. (An id that already ends in `-chain` builds `<id>.html`, not `<id>-chain.html`.)
   - Same facts as the post, nothing new. IOCs and ATT&CK IDs are copied from the post, defanged.
   - Columns are ATT&CK tactics, left to right in the order it happened. Steps are numbered in list order.
   - `confirmed` needs evidence in the post. Anything unproven is `suspected`, with a note saying what would confirm it. `impact` is the damage, `detected` is where a detection fired.
   - `label` under 25 characters, `sub` under 60.
4. `## What happened`: the story and what you found. Add one extra `##` section for the interesting part, if there is one.
5. `## Timeline`: only with real timestamps, in a code block, as `T+7 min` / `T+6 h 20 min`. Say what T is.
6. `## How I know`: 3-5 bullets. Each one: evidence, tool or data source, finding, confidence. Confidence is `High`, `Medium` or `Low`; write `Open:` for what you couldn't answer.
7. `## Detection`: 3-5 bullets. Each is a behavior from this case a defender could hunt or alert on, specific enough to act on (process, path, command line, port). No generic advice. No KQL unless it has been run against real data; then one query, commented, marked `Status: tested against case data`.
8. `## ATT&CK`: `| ID | Technique | Where |`. Verify every ID on attack.mitre.org; IDs get merged (T1574.002 is now T1574.001).
9. `## IOCs`: `### Network`, `### Hashes`, `### Host`, in code blocks. Defang everywhere, including prose and the attack chain: `hxxp://`, `1.2.3[.]4`, `example[.]com`. Leave hashes as-is.

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

`date` is the publish date, not the incident date.

# Tags

`clickfix, vishing, quick-assist, dll-sideload, process-injection, rat,
ransomware, domain-compromise, delivery-chain, credential-access,
social-engineering, windows, malware`

Proper-noun tags (`donut`, `ditto`, `castle-rat`) are fine in addition to
these, not instead of them.
