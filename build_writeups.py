import hashlib
import html
import json
import re
from pathlib import Path

import markdown
from markdown.extensions.fenced_code import FencedCodeExtension
from markdown.extensions.tables import TableExtension

BASE = Path(__file__).parent
WRITEUPS_DIR = BASE / "writeups"
OUTPUT = BASE / "js" / "writeups-data.js"
WORDS_PER_MINUTE = 200

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
WIKI_IMAGE_RE = re.compile(r"!\[\[([^\]]+)\]\]")
WIKI_LINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")


def parse_frontmatter(text: str) -> tuple[dict, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text

    meta: dict = {}
    for line in match.group(1).splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if value.startswith("[") and value.endswith("]"):
            meta[key] = [item.strip().strip('"').strip("'") for item in value[1:-1].split(",") if item.strip()]
        else:
            meta[key] = value
    return meta, text[match.end() :]


def preprocess_obsidian(text: str) -> str:
    def image_replacer(match: re.Match[str]) -> str:
        filename = Path(match.group(1)).name
        return f"![{filename}](assets/{filename})"

    text = WIKI_IMAGE_RE.sub(image_replacer, text)
    text = WIKI_LINK_RE.sub(lambda m: m.group(2) or m.group(1), text)
    return text


def estimate_read_time(text: str) -> str:
    # IOC tables are reference material, not read linearly.
    text = re.split(r"\n## (?:IOCs|Indicators of Compromise)\b", text)[0]
    words = len(re.findall(r"\b\w+\b", text))
    minutes = max(1, round(words / WORDS_PER_MINUTE))
    return f"{minutes} min"


def slug_from_filename(path: Path) -> str:
    slug = path.stem.lower()
    return re.sub(r"[^a-z0-9]+", "-", slug).strip("-")


def infer_title(body: str) -> str:
    for line in body.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            subtitle = ""
            for subline in body.splitlines():
                if subline.startswith("## "):
                    subtitle = subline[3:].strip()
                    break
            return f"{title}: {subtitle}" if subtitle else title
    return "Untitled Writeup"


def md_to_html(body: str) -> str:
    return markdown.markdown(
        body,
        extensions=[FencedCodeExtension(), TableExtension()],
    )


CHAINS_DIR = WRITEUPS_DIR / "chains"
TYPE_LABEL = {"confirmed": "Confirmed", "suspected": "Suspected", "impact": "Impact", "detected": "Detection"}
# In the markdown, `<!-- chain -->` marks where the chain goes; the arrow diagram after it folds away.
CHAIN_MARK_RE = re.compile(r"<!-- chain -->\s*(<pre>.*?</pre>)?", re.DOTALL)
CHAIN_TEXT = '<details class="chain-text"><summary>Text version</summary>\n{pre}\n</details>\n'


def check_chain(post_id: str, chain: dict) -> None:
    ids = [n["id"] for n in chain["nodes"]]
    phases = {p["id"] for p in chain["phases"]}
    problems = [f"duplicate step id {i}" for i in set(ids) if ids.count(i) > 1]
    for n in chain["nodes"]:
        if n["phase"] not in phases:
            problems.append(f"{n['id']}: unknown phase {n['phase']}")
        if n["type"] not in TYPE_LABEL:
            problems.append(f"{n['id']}: unknown type {n['type']}")
        if len(n["label"]) > 25 or len(n.get("sub", "")) > 60:
            problems.append(f"{n['id']}: label over 25 or sub over 60 characters")
    for edge in chain["edges"]:
        problems += [f"edge names unknown step {x}" for x in edge[:2] if x not in ids]
    for msg in problems:
        print(f"CHAIN WARNING {post_id}: {msg}")


def render_chain(post_id: str, chain: dict) -> str:
    """One vertical flow in the article column: a numbered rail, one blob per step, details on click."""
    check_chain(post_id, chain)
    e = html.escape
    nodes = chain["nodes"]
    index = {n["id"]: i for i, n in enumerate(nodes)}
    phases = {p["id"]: p for p in chain["phases"]}
    incoming: dict[str, list[str]] = {}
    for edge in chain["edges"]:
        incoming.setdefault(edge[1], []).append(edge[0])

    kinds = list(dict.fromkeys(n["type"] for n in nodes))
    out = ['<div class="chain">',
           '<div class="chain-legend">'
           + "".join(f'<span class="chain-key t-{k}">{TYPE_LABEL[k]}</span>' for k in kinds)
           + '<span class="chain-hint">Click a step for evidence and IOCs</span></div>',
           '<ol class="chain-steps">']
    phase = None
    for i, n in enumerate(nodes):
        if n["phase"] != phase:
            phase = n["phase"]
            ph = phases[phase]
            out.append(f'<li class="chain-phase"><span>{e(ph["name"])}</span><small>{e(ph.get("ta", ""))}</small></li>')
        # A step that doesn't follow from the one above it says where it comes from.
        sources = incoming.get(n["id"], [])
        came_from = ""
        if sources and nodes[i - 1]["id"] not in sources:
            s = index[sources[0]]
            came_from = f'<span class="chain-from">continues from {s + 1:02d} {e(nodes[s]["label"])}</span>'
        badge = "" if n["type"] == "confirmed" else f'<span class="chain-badge">{TYPE_LABEL[n["type"]]}</span>'
        tech = n.get("technique", "")
        detail = [f'<p>{e(n["desc"])}</p>'] if n.get("desc") else []
        if n.get("iocs"):
            detail.append('<div class="chain-label">IOCs</div><ul class="chain-iocs">'
                          + "".join(f"<li><code>{e(v)}</code></li>" for v in n["iocs"]) + "</ul>")
        if n.get("notes"):
            detail.append(f'<div class="chain-label">Confidence and gaps</div><p class="chain-note">{e(n["notes"])}</p>')
        if tech:
            url = "https://attack.mitre.org/techniques/" + tech.replace(".", "/") + "/"
            detail.append(f'<p class="chain-mitre"><a href="{url}" target="_blank" rel="noopener">{e(tech)} on MITRE ATT&amp;CK</a></p>')
        out.append(
            f'<li class="chain-step t-{n["type"]}"><span class="chain-marker">{i + 1:02d}</span>'
            f'<details class="chain-blob"><summary>'
            f'<span class="chain-icon"><i class="fa-solid fa-{e(n.get("icon") or "circle")}"></i></span>'
            f'<span class="chain-head"><span class="chain-title">{e(n["label"])}{badge}</span>'
            f'<span class="chain-sub">{e(n.get("sub", ""))}</span>{came_from}</span>'
            f'<span class="chain-tags">{f"<span class=chain-tech>{e(tech)}</span>" if tech else ""}'
            f'<i class="fa-solid fa-chevron-down chain-chevron"></i></span>'
            f'</summary><div class="chain-detail">{"".join(detail)}</div></details></li>')
    out += ["</ol>", "</div>"]
    return "\n".join(out) + "\n"


def embed_chain(post_id: str, page: str) -> str:
    """Swap the post's chain marker for the rendered chain; the arrow diagram folds away under it."""
    src = CHAINS_DIR / f"{post_id}.json"

    def repl(m: re.Match[str]) -> str:
        if not src.exists():
            print(f"CHAIN WARNING {post_id}: no chains/{post_id}.json, showing the text diagram only")
            return m.group(1) or ""
        chain = render_chain(post_id, json.loads(src.read_text(encoding="utf-8")))
        return chain + (CHAIN_TEXT.format(pre=m.group(1)) if m.group(1) else "")
    return CHAIN_MARK_RE.sub(repl, page, count=1)


def stamp_versions() -> None:
    """Give the pages a fresh ?v= for each asset so browsers don't keep showing old data, styles or scripts."""
    for asset in ("js/writeups-data.js", "js/writeups.js", "js/home.js", "css/ghost.css"):
        version = hashlib.sha1((BASE / asset).read_bytes()).hexdigest()[:8]
        pattern = re.compile(re.escape(asset) + r"(\?v=[\w.-]*)?")
        for page in BASE.glob("*.html"):
            if page.name == "attack-chain.html":
                continue
            text = page.read_text(encoding="utf-8")
            new = pattern.sub(f"{asset}?v={version}", text)
            if new != text:
                page.write_text(new, encoding="utf-8", newline="\n")


def load_writeup(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(raw)
    body = preprocess_obsidian(body)

    writeup = {
        "id": meta.get("id", slug_from_filename(path)),
        "title": meta.get("title", infer_title(body)),
        "summary": meta.get("summary", ""),
        "category": meta.get("category", "DFIR"),
        "date": meta.get("date", ""),
        "readTime": meta.get("readTime", estimate_read_time(body)),
        "tags": meta.get("tags", []),
        # Posts link images relative to writeups/, but they render on writeups.html at the root.
        "content": re.sub(r'(src|href)="assets/', r'\1="writeups/assets/', md_to_html(body)),
    }

    writeup["content"] = embed_chain(writeup["id"], writeup["content"])

    if not writeup["summary"]:
        for line in body.splitlines():
            if line.strip() and not line.startswith(("#", ">", "`", "─", "│", "┌", "└", "---")):
                writeup["summary"] = line.strip()[:180]
                break

    return writeup


README = BASE / "README.md"
LIVE_URL = "https://ghostsh-labs.github.io/Blog/writeups.html"
INDEX_RE = re.compile(r"(<!-- writeups:start -->\n).*?(<!-- writeups:end -->)", re.DOTALL)


def update_readme_index(writeups: list[dict]) -> None:
    """Keep the README's post list in sync so it never drifts from writeups/."""
    if not README.exists():
        return
    text = README.read_text(encoding="utf-8")
    if not INDEX_RE.search(text):
        return
    lines = "".join(f"- [{w['title']}]({LIVE_URL}#{w['id']})\n" for w in writeups)
    README.write_text(INDEX_RE.sub(lambda m: m.group(1) + lines + m.group(2), text), encoding="utf-8")


def main() -> None:
    skip = {"readme.md", "template.md"}
    files = sorted(path for path in WRITEUPS_DIR.glob("*.md") if path.name.lower() not in skip)
    writeups = [load_writeup(path) for path in files]
    writeups.sort(key=lambda item: item.get("date", ""), reverse=True)

    content = "window.GHOST_WRITEUPS = " + json.dumps(writeups, indent=2, ensure_ascii=False) + ";\n"
    OUTPUT.write_text(content, encoding="utf-8")
    stamp_versions()
    update_readme_index(writeups)
    print(f"Built {OUTPUT.name} with {len(writeups)} writeup(s)")


if __name__ == "__main__":
    main()