"""Build a post's interactive attack chain page from the attack-chain.html template.

    python make_chain.py <id>           writeups/chains/<id>.js -> writeups/<id>-chain.html
    python make_chain.py <id> --check   also open it headless and click every step (needs playwright)

writeups/chains/<id>.js holds only the `const CHAIN = {...};` object (schema: see the sample in
attack-chain.html). The template is never edited; the page is regenerated from it each time.
"""
import re
import sys
from pathlib import Path

BASE = Path(__file__).parent
TEMPLATE = BASE / "attack-chain.html"
CHAINS = BASE / "writeups" / "chains"

NAV = """<nav class="navbar" role="navigation">
  <a href="../index.html" class="logo" aria-label="GHOST"><i class="fas fa-ghost"></i><span>GHOST</span></a>
  <button class="menu-toggle" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
  <div class="mobile-overlay"></div>
  <div class="nav-links">
    <a href="../index.html">Home</a>
    <a href="../writeups.html" class="active">Writeups</a>
    <a href="../toolkit.html">Toolkit</a>
    <a href="../artifacts.html">Artifacts</a>
    <a href="../about.html">About</a>
  </div>
</nav>"""

# ghost.css uppercases body text and prefixes .prompt with a shell prompt; neither suits IOCs and KQL.
OVERRIDES = (
    "/* site overrides: keep evidence in its real case */\n"
    ".chain-hero .subtitle,.meta-chip,.node,.detail,.editor,.hint{text-transform:none}\n"
    ".meta-chip b{text-transform:uppercase}\n"
    ".detail .prompt::before{content:none}\n"
    ".container{max-width:%dpx}\n\n"
)


def sub_once(pattern: str, repl: str, text: str, what: str) -> str:
    text, n = re.subn(pattern, lambda m: repl, text, count=1, flags=re.DOTALL)
    if n != 1:
        sys.exit(f"template changed: could not find {what}")
    return text


def build(post_id: str) -> Path:
    src = CHAINS / f"{post_id}.js"
    if not src.exists():
        sys.exit(f"missing {src}")
    chain = src.read_text(encoding="utf-8").strip()
    if not chain.startswith("const CHAIN = {") or not chain.endswith("};"):
        sys.exit(f"{src.name} must be exactly: const CHAIN = {{ ... }};")
    title = re.search(r'title:\s*"((?:[^"\\]|\\.)*)"', chain)

    html = TEMPLATE.read_text(encoding="utf-8")
    html = sub_once(r"const CHAIN = \{.*?\n\};\n", chain + "\n", html, "CHAIN object")
    cols = max(5, len(re.findall(r"\bta:", chain)))  # 230px column + 68px gap, plus page padding
    html = sub_once(r"/\* =+ GHOST BASE.*?(?=/\* =+ ATTACK CHAIN)", OVERRIDES % (cols * 298 + 30),
                    html, "GHOST BASE css block")
    html = sub_once(r"<!--\s*TEMPLATE NOTES.*?-->\n", "", html, "template notes")
    html = sub_once(r"<style>", '<link rel="stylesheet" href="../css/ghost.css">\n<style>', html, "<style>")
    html = sub_once(r"<title>.*?</title>",
                    f"<title>GHOST - Attack chain: {title.group(1) if title else post_id}</title>", html, "<title>")
    html = sub_once(r'<nav class="navbar">.*?</nav>', NAV, html, "navbar")
    html = sub_once(r"\n<script>\n/\* ====", '\n<script src="../js/ghost-common.js"></script>\n<script>\n/* ====',
                    html, "script block")

    # ids that already end in -chain (ditto-delivery-chain) don't get the suffix twice
    out = BASE / "writeups" / ((post_id if post_id.endswith("-chain") else f"{post_id}-chain") + ".html")
    out.write_text(html, encoding="utf-8", newline="\n")
    print(f"wrote {out.relative_to(BASE)}")
    return out


def check(page: Path) -> int:
    from playwright.sync_api import sync_playwright

    errors: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge")
        pg = browser.new_page(viewport={"width": 1600, "height": 950})
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(page.resolve().as_uri())
        pg.wait_for_timeout(1200)
        nodes, edges = pg.locator(".node").count(), pg.locator("path.edge").count()
        wanted = pg.evaluate("CHAIN.edges.length")
        overflow = pg.evaluate(
            "[...document.querySelectorAll('.node')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.dataset.id)")
        opened = 0
        for i in range(nodes):
            pg.locator(".node").nth(i).click()
            pg.wait_for_timeout(100)
            opened += pg.locator("#detail.open").count()
            pg.keyboard.press("Escape")
        shot = page.with_suffix(".check.png")
        pg.screenshot(path=str(shot), full_page=True)
        browser.close()
    print(f"steps {nodes}, connectors {edges}/{wanted}, panels opened {opened}/{nodes}, "
          f"overflowing {overflow or 'none'}, console errors {errors or 'none'}")
    print(f"screenshot: {shot.name} (delete after looking; *.check.png is not for publishing)")
    return 0 if (nodes and edges == wanted and opened == nodes and not overflow and not errors) else 1


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    page = build(args[0])
    if "--check" in sys.argv:
        sys.exit(check(page))
