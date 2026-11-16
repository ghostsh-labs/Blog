import hashlib
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


# The post's link line to its chain page, plus the text arrow diagram that follows it.
CHAIN_LINK_RE = re.compile(
    r'<p>(?:(?!</p>).)*?href="(writeups/[a-z0-9-]+-chain\.html)"(?:(?!</p>).)*?</p>\s*(<pre>.*?</pre>)?', re.DOTALL)
CHAIN_EMBED = (
    '<iframe class="chain-embed" src="{src}?embed=1" title="Interactive attack chain" '
    "onload=\"try{{this.style.height=(this.contentDocument.querySelector('.container').offsetHeight+4)+'px'}}catch(e){{}}\"></iframe>\n"
)
CHAIN_TEXT = '<details class="chain-text"><summary>Text version</summary>\n{pre}\n</details>\n'


def embed_chain(html: str) -> str:
    """Show the interactive chain inside the post itself; the arrow diagram folds away under it."""
    def repl(m: re.Match[str]) -> str:
        out = CHAIN_EMBED.format(src=m.group(1))
        return out + (CHAIN_TEXT.format(pre=m.group(2)) if m.group(2) else "")
    return CHAIN_LINK_RE.sub(repl, html, count=1)


def stamp_data_version(content: str) -> None:
    """Point the pages at a fresh ?v= so browsers don't keep showing the old post data."""
    version = hashlib.sha1(content.encode("utf-8")).hexdigest()[:8]
    for page in BASE.glob("*.html"):
        text = page.read_text(encoding="utf-8")
        new = re.sub(r"js/writeups-data\.js(\?v=[\w.-]*)?", f"js/writeups-data.js?v={version}", text)
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
        # Same for the interactive chain pages (writeups/<id>-chain.html).
        "content": embed_chain(re.sub(r'(src|href)="(assets/|[a-z0-9-]+-chain\.html")', r'\1="writeups/\2', md_to_html(body))),
    }

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
    stamp_data_version(content)
    update_readme_index(writeups)
    print(f"Built {OUTPUT.name} with {len(writeups)} writeup(s)")


if __name__ == "__main__":
    main()