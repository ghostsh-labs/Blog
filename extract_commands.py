import re
import json
from pathlib import Path

base = Path(__file__).parent
html = (base / "Advanced Bug Hunting Toolkit.html").read_text(encoding="utf-8")

cat_pattern = re.compile(
    r'<h2 class="tool-category[^"]*" id="([^"]+)">\s*<i class="[^"]+"></i>\s*([^<\n]+)',
)
card_pattern = re.compile(
    r'<h3>([^<]+)</h3>.*?<div class="tool-description">\s*([^<]+).*?'
    r'<span class="command" id="([^"]+)">([^<]+)</span>',
    re.S,
)

categories = []
matches = list(cat_pattern.finditer(html))

for i, match in enumerate(matches):
    if match.group(1) == "methodologies":
        continue
    start = match.end()
    end = matches[i + 1].start() if i + 1 < len(matches) else len(html)
    section = html[start:end]
    commands = []
    for cm in card_pattern.finditer(section):
        title, desc, cid, cmd = cm.groups()
        commands.append(
            {
                "id": cid,
                "title": title.strip(),
                "description": desc.strip(),
                "command": cmd.replace("&gt;", ">")
                .replace("&lt;", "<")
                .replace("&amp;", "&"),
            }
        )
    if commands:
        categories.append(
            {
                "id": match.group(1),
                "title": match.group(2).strip(),
                "commands": commands,
            }
        )

(base / "js").mkdir(exist_ok=True)
(base / "js/offsec-commands.json").write_text(
    json.dumps(categories, indent=2), encoding="utf-8"
)
print(f"Categories: {len(categories)}")
print(f"Commands: {sum(len(c['commands']) for c in categories)}")