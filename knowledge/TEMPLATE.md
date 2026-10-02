<!--
  ghostsh knowledge note template & style guide
  Not published — build_knowledge.py skips any file that isn't a real note,
  but keep this out of the knowledge grid by leaving it without a valid
  frontmatter id, or just don't copy it in as a new note.
-->

# Style guide (read this first)

These are reference notes, not incident writeups: "how I do X" - a
methodology, a workflow, a tool setup, a lesson learned that's reusable
across cases. Voice: concise, direct, second-pass-ready. Skip the framing
you'd use to open a writeup ("in this post I'll cover...") and just state
the thing.

Rules:
- **Prose explains, code blocks show.** A command, config snippet, or
  script goes in a fenced block - don't retype it in the paragraph above.
- **Bullets over prose for steps and checklists.**
- **Say why, not just what**, wherever the "why" isn't obvious from the
  step itself - that's the part worth writing down.
- **Every note gets the same section skeleton** (below). Drop a section
  that doesn't apply; don't rename or reshape it.

# Frontmatter

```
---
id: short-kebab-slug
title: "Note Title"
summary: "One sentence - what this note covers and when you'd reach for it."
category: Methodology
date: 2026-09-15
tags: [triage, powershell]
---
```

`category` is free-form - use whatever groups your notes sensibly
(Methodology, Tooling, Workflow, OpSec, Analysis, ...).

# Section skeleton

1. `# Title`

2. `## Why / When` - a couple sentences on the problem this solves and
   when to reach for it. Skip if the title already says it all.

3. `## Method` - the actual steps, tool, or approach. Numbered steps or
   bullets, code blocks for anything you'd copy-paste.

4. `## Gotchas` - optional. Things that bit you, edge cases, "don't do
   X because Y". Skip if there's nothing here yet.

5. `## Related` - optional. Links to writeups or other knowledge notes
   this connects to.

# Tags - pull from this list; add a new one here only when nothing fits

`methodology, tooling, workflow, opsec, automation, triage, reporting,
powershell, python, windows, linux`

# What NOT to do

- Don't write a writeup-style narrative here - that belongs in
  `writeups/`. This is the reusable "how I do it" reference.
- Don't leave a section in with nothing under it - drop it instead.
- Don't duplicate a full writeup's content - link to it under Related.
