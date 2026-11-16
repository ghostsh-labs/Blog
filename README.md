# GHOST - DFIR & Threat Research

Live site: **https://ghostsh-labs.github.io/Blog/**

> Use the `/Blog/` URL - `https://ghostsh-labs.github.io/` alone will 404.

Writeups page: **https://ghostsh-labs.github.io/Blog/writeups.html**

<!-- writeups:start -->
- [ClickFix finger Lure to CastleLoader and a Hollowed node.exe Agent](https://ghostsh-labs.github.io/Blog/writeups.html#castleloader-finger-hollowed-agent)
- [A Signed Note App with a Backdoor in app.asar, Reused Across Campaigns](https://ghostsh-labs.github.io/Blog/writeups.html#flomo-asar-backdoor-reuse)
- [Teams ClickFix to a Sideloaded Backdoor and rclone Exfiltration](https://ghostsh-labs.github.io/Blog/writeups.html#teams-clickfix-sideload-rclone)
- [CastleRat Delivery Chain](https://ghostsh-labs.github.io/Blog/writeups.html#castle-rat-delivery-chain)
- [ClickFix to CLR RAT Delivery Chain](https://ghostsh-labs.github.io/Blog/writeups.html#clickfix-clr-rat)
- [Ditto DLL Side-Loading and Domain Compromise](https://ghostsh-labs.github.io/Blog/writeups.html#ditto-delivery-chain)
<!-- writeups:end -->

Incident writeups, IOCs and detections, plus a command toolkit and a DFIR artifact reference.

## Writeups

Source files live in [`writeups/`](writeups/). After editing a post:

```bash
python build_writeups.py
git add .
git commit -m "Add writeup"
git push
```

## Knowledge (hidden)

The Knowledge page exists but isn't linked from the nav or home page until it has a note.
To show it again, re-add the link to the `nav-links` block on each page and a card on `index.html`.
Source files live in [`knowledge/`](knowledge/). After adding or editing a note:

```bash
python build_knowledge.py
git add .
git commit -m "Add knowledge note"
git push
```

## Build

| Script | Output |
|--------|--------|
| `build_data.py` | `js/data.js` (toolkit commands) |
| `build_writeups.py` | `js/writeups-data.js` (writeups page) |
| `build_knowledge.py` | `js/knowledge-data.js` (knowledge page) |