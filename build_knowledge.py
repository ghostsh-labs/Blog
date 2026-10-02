import json
import re
from pathlib import Path

import markdown
from markdown.extensions.fenced_code import FencedCodeExtension
from markdown.extensions.tables import TableExtension

BASE = Path(__file__).parent
KNOWLEDGE_DIR = BASE / "knowledge"
OUTPUT = BASE / "js" / "knowledge-data.js"
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
    words = len(re.findall(r"\b\w+\b", text))
    minutes = max(1, round(words / WORDS_PER_MINUTE))
    return f"{minutes} min"


def slug_from_filename(path: Path) -> str:
    slug = path.stem.lower()
    return re.sub(r"[^a-z0-9]+", "-", slug).strip("-")


def infer_title(body: str) -> str:
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "Untitled Note"


def md_to_html(body: str) -> str:
    return markdown.markdown(
        body,
        extensions=[FencedCodeExtension(), TableExtension()],
    )


def load_entry(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(raw)
    body = preprocess_obsidian(body)

    entry = {
        "id": meta.get("id", slug_from_filename(path)),
        "title": meta.get("title", infer_title(body)),
        "summary": meta.get("summary", ""),
        "category": meta.get("category", "Notes"),
        "date": meta.get("date", ""),
        "readTime": meta.get("readTime", estimate_read_time(body)),
        "tags": meta.get("tags", []),
        "content": md_to_html(body),
    }

    if not entry["summary"]:
        for line in body.splitlines():
            if line.strip() and not line.startswith(("#", ">", "`", "─", "│", "┌", "└", "---")):
                entry["summary"] = line.strip()[:180]
                break

    return entry


def main() -> None:
    skip = {"readme.md", "template.md"}
    files = sorted(path for path in KNOWLEDGE_DIR.glob("*.md") if path.name.lower() not in skip)
    entries = [load_entry(path) for path in files]
    entries.sort(key=lambda item: item.get("date", ""), reverse=True)

    content = "window.GHOST_KNOWLEDGE = " + json.dumps(entries, indent=2, ensure_ascii=False) + ";\n"
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Built {OUTPUT.name} with {len(entries)} note(s)")


if __name__ == "__main__":
    main()
