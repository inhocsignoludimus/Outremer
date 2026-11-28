#!/usr/bin/env python3
"""Gera meta.js (JSON inline) e js/wv_pix.js (data URIs das imagens
que o jogo lê com getImageData/toDataURL). Assim o WebView file://
com origin 'null' não precisa de fetch nem de canvas não-tainteado
via rede. Rode na raiz do jogo (Outremer-dawn)."""
from __future__ import annotations
import base64, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
JS = ROOT / "js"

META = [
    (ASSETS / "lote1/meta.json", "LOTE1_META"),
    (ASSETS / "lote2/meta.json", "LOTE2_META"),
    (ASSETS / "lote2/meta_monstros.json", "LOTE2_META_MONSTROS"),
    (ASSETS / "lote2/camadas/meta_camadas.json", "LOTE2_META_CAMADAS"),
    (ASSETS / "lote3/meta.json", "LOTE3_META"),
    (ASSETS / "lote5/landmarks/meta.json", "LOTE5_META"),
]

PIX_GLOBS = [
    "lote1/texturas/*.png",
    "lote2/camadas/corpos/*.png",
    "lote2/camadas/montarias/*.png",
    "lote3/texturas/*.png",
    "lote3/paredes/*.png",
    "lote3/janelas/*.png",
    "lote4/icons_*.png",
]

def write_meta(src: Path, global_name: str) -> None:
    data = json.loads(src.read_text(encoding="utf-8"))
    rel = src.relative_to(ROOT).as_posix()  # assets/lote1/meta.json
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    out = src.with_suffix(".js")
    out.write_text(
        "window.%s=%s;\n"
        "window.__JSON_ASSETS=window.__JSON_ASSETS||{};\n"
        "window.__JSON_ASSETS[%s]=window.%s;\n"
        % (global_name, body, json.dumps(rel), global_name),
        encoding="utf-8",
    )
    print("meta", out.relative_to(ROOT), "bytes", out.stat().st_size)

def main() -> int:
    for src, name in META:
        if not src.exists():
            print("MISSING", src, file=sys.stderr)
            return 1
        write_meta(src, name)

    entries = []
    total_png = 0
    for pattern in PIX_GLOBS:
        for p in sorted(ASSETS.glob(pattern)):
            raw = p.read_bytes()
            total_png += len(raw)
            rel = "assets/" + p.relative_to(ASSETS).as_posix()
            ext = p.suffix.lower().lstrip(".")
            mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                    "webp": "image/webp", "gif": "image/gif"}.get(ext, "application/octet-stream")
            entries.append((rel, "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode("ascii"))))

    parts = ["window.__FILE_ASSETS=Object.assign(window.__FILE_ASSETS||{},{\n"]
    for i, (rel, uri) in enumerate(entries):
        comma = "," if i < len(entries) - 1 else ""
        parts.append("%s:%s%s\n" % (json.dumps(rel), json.dumps(uri), comma))
    parts.append("});\n")
    out = JS / "wv_pix.js"
    out.write_text("".join(parts), encoding="utf-8")
    print("pix", out.relative_to(ROOT), "files", len(entries),
          "png_kb", total_png // 1024, "js_kb", out.stat().st_size // 1024)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
