"""Render a writeup's attack chain as a PNG in the site theme.

Specs live in writeups/chains/<writeup id>.toml (copy TEMPLATE.toml). Output
goes to writeups/assets/<writeup id>-chain.png. Colors and fonts come from
css/ghost.css; headless Chrome or Edge (via Playwright) takes the screenshot.

    python build_chain.py               # every spec
    python build_chain.py <id> [<id>]   # just these
"""

import html
import re
import sys
import tempfile
import tomllib
from pathlib import Path

from playwright.sync_api import sync_playwright

from build_writeups import WRITEUPS_DIR, parse_frontmatter

BASE = Path(__file__).parent
CHAINS_DIR = WRITEUPS_DIR / "chains"
ASSETS_DIR = WRITEUPS_DIR / "assets"
THEME_CSS = BASE / "css" / "ghost.css"
WIDTH = 760  # CSS px. Rendered at 2x, shown in the 700px reading column.
SCALE = 2
FOOTER_URL = "ghostsh-labs.github.io/Blog"

# One fixed color per group so every post reads the same. Keys are ATT&CK tactics.
PHASES = {
    "access": ("Initial Access", "var(--warning)"),
    "execution": ("Execution", "var(--primary)"),
    "evasion": ("Defense Evasion", "#4d94ff"),
    "privesc": ("Privilege Escalation", "#4d94ff"),
    "persistence": ("Persistence", "var(--accent)"),
    "discovery": ("Discovery", "#ff7a45"),
    "credential": ("Credential Access", "#ff7a45"),
    "lateral": ("Lateral Movement", "#ff7a45"),
    "c2": ("Command & Control", "#b48cff"),
    "collection": ("Collection", "var(--danger)"),
    "exfil": ("Exfiltration", "var(--danger)"),
    "impact": ("Impact", "var(--danger)"),
}

# Defender-side events. Always green, always marked with a shield.
DEFENDER = {
    "blocked": "Blocked",
    "detected": "Detected",
    "response": "Response",
}
DEFENDER_COLOR = "var(--success)"

# Anything that still looks live. Defang it: hxxp://, 1.2.3[.]4, example[.]com.
FANGED = [
    re.compile(r"\bhttps?://", re.I),
    re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    re.compile(
        r"\b[a-z0-9-]+\.(?:com|net|org|io|top|xyz|ru|cn|info|biz|cc|co|me|app|dev|site|online|shop|live|pro|club)\b",
        re.I,
    ),
]

CSS = """
body { background: var(--darker); }

.chain {
    width: %(width)spx;
    padding: 26px 30px 16px;
    font-family: var(--font-body);
    color: var(--light);
    background:
        radial-gradient(circle at 0 0, rgba(0, 212, 255, 0.09), transparent 40%%),
        linear-gradient(rgba(0, 212, 255, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 212, 255, 0.04) 1px, transparent 1px),
        var(--darker);
    background-size: auto, 40px 40px, 40px 40px, auto;
}

.head {
    position: relative;
    padding-bottom: 14px;
    margin-bottom: 18px;
    border-bottom: 1px solid var(--card-border);
}

.head-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.head::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -1px;
    width: 180px;
    height: 1px;
    background: linear-gradient(90deg, var(--primary), transparent);
}

.kicker {
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--primary);
}

.head h1 {
    margin-top: 8px;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.3;
    color: #e6edf3;
}

.sub {
    margin-top: 6px;
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--muted);
}

.brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--primary);
    text-shadow: var(--glow);
    white-space: nowrap;
}

.stages { list-style: none; }

.stage {
    position: relative;
    display: grid;
    grid-template-columns: 92px 16px 1fr;
    column-gap: 10px;
    padding-bottom: 10px;
}

.stage:last-child { padding-bottom: 0; }

.time {
    padding-top: 9px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.35;
    color: var(--muted);
    text-align: right;
    white-space: nowrap;
}

.rail { position: relative; }

.dot {
    position: absolute;
    top: 12px;
    left: 50%%;
    z-index: 1;
    width: 11px;
    height: 11px;
    margin-left: -5.5px;
    border: 2px solid var(--c);
    border-radius: 50%%;
    background: var(--darker);
    box-shadow: 0 0 10px var(--c);
}

/* Runs from this dot to the next one, fading between their colors. */
.rail::after {
    content: '';
    position: absolute;
    left: 50%%;
    top: 17px;
    bottom: -28px;
    width: 2px;
    margin-left: -1px;
    background: linear-gradient(var(--c), var(--n));
    opacity: 0.5;
}

.stage:last-child .rail::after { display: none; }

.card {
    padding: 8px 14px 9px;
    border: 1px solid var(--card-border);
    border-left: 2px solid var(--c);
    border-radius: 6px;
    background: rgba(13, 17, 23, 0.92);
}

.top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.phase {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-display);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--c);
    white-space: nowrap;
}

.tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px;
}

.tags span {
    padding: 0 5px;
    border: 1px solid rgba(107, 122, 143, 0.35);
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 9.5px;
    line-height: 16px;
    color: var(--muted);
}

.tags .when {
    border-color: transparent;
    padding: 0;
}

.title {
    margin-top: 2px;
    font-size: 14.5px;
    font-weight: 600;
    line-height: 1.35;
    color: #e6edf3;
}

.detail {
    margin-top: 2px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.55;
    color: rgba(184, 197, 214, 0.82);
    overflow-wrap: anywhere;
}

.card code {
    padding: 0 4px;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 0.92em;
    color: var(--primary);
    background: rgba(0, 212, 255, 0.08);
}

.title code { font-size: 0.85em; }

.side {
    position: relative;
    margin: 7px 0 0 22px;
    padding: 6px 12px 7px;
    border: 1px dashed color-mix(in srgb, var(--c) 55%%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--c) 5%%, rgba(13, 17, 23, 0.92));
}

.side::before {
    content: '';
    position: absolute;
    left: -16px;
    top: -9px;
    width: 14px;
    height: 24px;
    border-left: 1px dashed color-mix(in srgb, var(--c) 60%%, transparent);
    border-bottom: 1px dashed color-mix(in srgb, var(--c) 60%%, transparent);
    border-bottom-left-radius: 4px;
}

.side .title { font-size: 13px; }

.foot {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px solid var(--card-border);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.5px;
    color: var(--muted);
}
""" % {"width": WIDTH}


class SpecError(Exception):
    pass


def fmt(text: str) -> str:
    """Escape, then turn `backticks` into code spans like the writeup body."""
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", html.escape(text))


def as_lines(value) -> list[str]:
    if value is None:
        return []
    return [value] if isinstance(value, str) else list(value)


def style_of(item: dict, where: str) -> tuple[str, str, bool]:
    """Return (label, color, is_defender) for a stage or side box."""
    if "defender" in item:
        kind = item["defender"]
        if kind not in DEFENDER:
            raise SpecError(f"{where}: defender must be one of {', '.join(DEFENDER)}, got {kind!r}")
        return DEFENDER[kind], DEFENDER_COLOR, True
    phase = item.get("phase")
    if phase not in PHASES:
        raise SpecError(f"{where}: phase must be one of {', '.join(PHASES)}, got {phase!r}")
    label, color = PHASES[phase]
    return label, color, False


def render_box(item: dict, where: str, css_class: str, time_in_tags: bool) -> tuple[str, str]:
    if not item.get("title"):
        raise SpecError(f"{where}: missing title")
    label, color, defender = style_of(item, where)
    icon = '<i class="fas fa-shield-halved"></i>' if defender else ""

    tags = "".join(f"<span>{html.escape(tid)}</span>" for tid in item.get("attack", []))
    if time_in_tags and item.get("time"):
        tags = f'<span class="when">{html.escape(item["time"])}</span>' + tags

    detail = "".join(f'<div class="detail">{fmt(line)}</div>' for line in as_lines(item.get("detail")))
    box = (
        f'<div class="{css_class}" style="--c: {color}">'
        f'<div class="top"><span class="phase">{icon}{html.escape(label)}</span>'
        f'<span class="tags">{tags}</span></div>'
        f'<div class="title">{fmt(item["title"])}</div>{detail}</div>'
    )
    return box, color


def render(spec: dict, title: str) -> str:
    stages = spec.get("stage", [])
    if not stages:
        raise SpecError("no [[stage]] entries")

    colors = [style_of(stage, f"stage {i + 1}")[1] for i, stage in enumerate(stages)]
    rows = []
    for i, stage in enumerate(stages):
        where = f"stage {i + 1} ({stage.get('title', '?')})"
        card, color = render_box(stage, where, "card", time_in_tags=False)
        sides = "".join(
            render_box(side, f"{where} side {j + 1}", "side", time_in_tags=True)[0]
            for j, side in enumerate(stage.get("side", []))
        )
        next_color = colors[i + 1] if i + 1 < len(colors) else color
        rows.append(
            f'<li class="stage" style="--c: {color}; --n: {next_color}">'
            f'<div class="time">{html.escape(stage.get("time", ""))}</div>'
            f'<div class="rail"><span class="dot"></span></div>'
            f"<div>{card}{sides}</div></li>"
        )

    subtitle = f'<div class="sub">{fmt(spec["subtitle"])}</div>' if spec.get("subtitle") else ""
    return f"""<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="{THEME_CSS.resolve().as_uri()}">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>{CSS}</style></head>
<body><div class="chain">
<div class="head"><div class="head-row"><div class="kicker">ATTACK CHAIN</div>
<div class="brand"><i class="fas fa-ghost"></i>GHOST</div></div>
<h1>{fmt(title)}</h1>{subtitle}</div>
<ol class="stages">{"".join(rows)}</ol>
<div class="foot"><span>{fmt(spec.get("t0", ""))}</span><span>{FOOTER_URL}</span></div>
</div></body></html>"""


def writeup_for(chain_id: str) -> tuple[dict, str] | None:
    for path in WRITEUPS_DIR.glob("*.md"):
        meta, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        if meta.get("id") == chain_id:
            return meta, body
    return None


def lint(chain_id: str, spec: dict, body: str | None) -> list[str]:
    warnings = []
    text_items = [spec.get("title", ""), spec.get("subtitle", "")]
    attack_ids = []
    for stage in spec.get("stage", []):
        for item in [stage, *stage.get("side", [])]:
            text_items += [item.get("title", ""), *as_lines(item.get("detail"))]
            attack_ids += item.get("attack", [])

    for text in text_items:
        for pattern in FANGED:
            match = pattern.search(text)
            if match:
                warnings.append(f"not defanged: {match.group(0)!r} in {text!r}")

    if body is not None:
        table_ids = set(re.findall(r"^\|\s*(T\d{4}(?:\.\d{3})?)\s*\|", body, re.M))
        for tid in attack_ids:
            if tid not in table_ids:
                warnings.append(f"{tid} is not in the writeup's ATT&CK table")
    return warnings


def launch(playwright):
    for channel in ("chrome", "msedge", None):
        try:
            return playwright.chromium.launch(channel=channel)
        except Exception:
            continue
    raise SystemExit("No Chromium found: install Chrome or Edge, or run `playwright install chromium`")


def build(page, spec_path: Path, workdir: Path) -> None:
    chain_id = spec_path.stem
    spec = tomllib.loads(spec_path.read_text(encoding="utf-8"))
    writeup = writeup_for(chain_id)
    if writeup is None:
        print(f"  ! {chain_id}: no writeup with this id, linting without it")
    title = spec.get("title") or (writeup[0].get("title") if writeup else "") or chain_id

    try:
        page_html = render(spec, title)
    except SpecError as err:
        raise SystemExit(f"{spec_path.name}: {err}")

    html_path = workdir / f"{chain_id}.html"
    html_path.write_text(page_html, encoding="utf-8")
    page.goto(html_path.as_uri(), wait_until="networkidle")
    page.evaluate("document.fonts.ready.then(() => true)")

    loaded = page.evaluate("[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family)")
    loaded = {family.strip('"') for family in loaded}
    missing = [f for f in ("Orbitron", "Inter", "JetBrains Mono") if f not in loaded]

    out = ASSETS_DIR / f"{chain_id}-chain.png"
    ASSETS_DIR.mkdir(exist_ok=True)
    page.locator(".chain").screenshot(path=str(out))
    print(f"Built {out.relative_to(BASE)}")

    for warning in lint(chain_id, spec, writeup[1] if writeup else None):
        print(f"  ! {warning}")
    if missing:
        print(f"  ! fonts did not load ({', '.join(missing)}): check your connection and rebuild")


def main() -> None:
    if len(sys.argv) > 1:
        specs = [CHAINS_DIR / f"{name.removesuffix('.toml')}.toml" for name in sys.argv[1:]]
        for spec in specs:
            if not spec.exists():
                raise SystemExit(f"No spec at {spec.relative_to(BASE)}")
    else:
        specs = sorted(p for p in CHAINS_DIR.glob("*.toml") if not p.stem.upper().startswith("TEMPLATE"))

    with sync_playwright() as playwright, tempfile.TemporaryDirectory() as tmp:
        browser = launch(playwright)
        page = browser.new_page(viewport={"width": WIDTH, "height": 800}, device_scale_factor=SCALE)
        for spec_path in specs:
            build(page, spec_path, Path(tmp))
        browser.close()


if __name__ == "__main__":
    main()
