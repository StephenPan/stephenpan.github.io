#!/usr/bin/env python3
"""Assemble the offline release without rewriting the game source."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src"
MARKER = "<!-- INLINE_GAME_SCRIPTS -->"
SCRIPTS = ("learning-engine.js", "world-rules.js", "districts.js", "bell-room.js", "save-state.js", "neighborhood.js", "game.js")

template = (SOURCE / "game-template.html").read_text(encoding="utf-8")
if template.count(MARKER) != 1:
    raise ValueError("The game template must contain exactly one script marker")
scripts = []
for name in SCRIPTS:
    code = (SOURCE / name).read_text(encoding="utf-8")
    if "</script" in code.lower():
        raise ValueError(f"{name} contains an HTML script terminator")
    scripts.append(f"<script>\n{code.rstrip()}\n</script>")
output = template.replace(MARKER, "\n".join(scripts))
(ROOT / "index.html").write_text(output, encoding="utf-8")
print("wrote index.html", len(output), "chars")
