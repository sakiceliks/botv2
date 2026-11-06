#!/usr/bin/env python3
"""mock-image görsel havuzu yenileyici (perceptual hash kırıcı).

`mock-image/` altındaki TÜM klasörleri ve alt klasörleri özyinelemeli tarar,
her görseli yerinde (in-place) yeniden üretir. Yazım atomiktir (tmp +
os.replace), işlem paraleldir (ProcessPoolExecutor) ve numpy gerektirmez.

Orijinal yedek (`mock-image/_source/`) varsayılan olarak SİLİNİR: tam bir
çalıştırma (tüm havuzlar) başarılı olduktan sonra eski orijinaller temizlenir.
Orijinalleri korumak isterseniz `--keep-source` kullanın; bu modda eksik
orijinaller `_source/` altına kopyalanır ve çalıştırma sonunda da bırakılır.

Kullanım:
    python3 mock-image/images.py                 # tüm görselleri işle + _source'u sil
    python3 mock-image/images.py --keep-source   # orijinal yedeği koru
    python3 mock-image/images.py --model xiaomi-17-pro-max
    python3 mock-image/images.py --model iphone-17-pro --model xiaomi-17-pro-max
    python3 mock-image/images.py --model iphone-17-pro/gumus
    python3 mock-image/images.py --dry-run        # yalnızca planı yazdır
    python3 mock-image/images.py --list           # havuzları JSON olarak yazdır

Çıktı: stdout'a tek satır JSON (son satır), ilerleme stderr'a.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import shutil
import sys
import time
import uuid
import zlib
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parent
SOURCE_DIR = ROOT / "_source"
MANIFEST_PATH = ROOT / ".refresh.json"

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"}

SUPPORTED_EXTS = (".jpg", ".jpeg", ".png", ".webp")


# ── keşif ────────────────────────────────────────────────────────────────────

def discover_pools(
    root: Path = ROOT,
    model_filters: Optional[List[str]] = None,
) -> Dict[str, List[Path]]:
    """{havuz göreli yolu: [görsel yolları]} — `mock-image/` altındaki her
    klasörü ve alt klasörü özyinelemeli tarar (`_source` ve gizli klasörler hariç).

    model_filters: boşsa tüm ağaç; doluysa yalnızca eşleşen alt ağaçlar."""
    pools: Dict[str, List[Path]] = {}

    for dirpath, dirnames, filenames in os.walk(root):
        # İleri düzey yürüyüşte tarama dışı bırakılan klasörler
        dirnames[:] = sorted(
            d for d in dirnames if not d.startswith(".") and d != "_source"
        )
        directory = Path(dirpath)
        files = sorted(
            directory / name
            for name in filenames
            if not name.startswith(".") and Path(name).suffix.lower() in IMAGE_EXT
        )
        if not files:
            continue
        rel = directory.relative_to(root)
        pools["." if str(rel) == "." else rel.as_posix()] = files

    if model_filters:
        keys = [m.strip("/").lower() for m in model_filters if m and m.strip()]
        pools = {
            name: files for name, files in pools.items()
            if any(
                name.lower() == key or name.lower().startswith(key + "/") or key == "."
                for key in keys
            )
        }

    return pools


# ── dönüştürme ───────────────────────────────────────────────────────────────

def _build_channel_lut(rng: random.Random) -> List[List[int]]:
    gains = [1.0 + rng.uniform(-0.012, 0.012) for _ in range(3)]
    offsets = [rng.randint(-3, 3) for _ in range(3)]
    luts: List[List[int]] = []
    for gain, offset in zip(gains, offsets):
        luts.append([min(255, max(0, int(i * gain + offset))) for i in range(256)])
    return luts


def _tweak_channels(img: Image.Image, rng: random.Random) -> Image.Image:
    r, g, b = img.split()
    lut_r, lut_g, lut_b = _build_channel_lut(rng)
    return Image.merge("RGB", (r.point(lut_r), g.point(lut_g), b.point(lut_b)))


def _add_noise(img: Image.Image, rng: random.Random, sigma: float) -> Image.Image:
    """PIL-only gaussian gürültü: sonuç = clip(img + (noise - 128)), noise ~ N(128, sigma)."""
    size = img.size
    noise = Image.merge(
        "RGB",
        (
            Image.effect_noise(size, sigma),
            Image.effect_noise(size, sigma),
            Image.effect_noise(size, sigma),
        ),
    )
    return ImageChops.add(img, noise, scale=1.0, offset=-128)


def _scale_pad_crop(img: Image.Image, rng: random.Random) -> Image.Image:
    orig_w, orig_h = img.size
    scale = rng.uniform(0.98, 1.02)
    new_w = max(1, int(round(orig_w * scale)))
    new_h = max(1, int(round(orig_h * scale)))
    if (new_w, new_h) == (orig_w, orig_h):
        new_w = max(1, orig_w + rng.choice((-1, 1)))
        new_h = max(1, orig_h + rng.choice((-1, 1)))
    scaled = img.resize((new_w, new_h), Image.LANCZOS)

    if new_w < orig_w or new_h < orig_h:
        canvas = Image.new("RGB", (orig_w, orig_h), (255, 255, 255))
        canvas.paste(scaled, ((orig_w - new_w) // 2, (orig_h - new_h) // 2))
        return canvas

    left = (new_w - orig_w) // 2
    top = (new_h - orig_h) // 2
    return scaled.crop((left, top, left + orig_w, top + orig_h))


def transform_image(src: Path, dst: Path, seed: int, sigma: float) -> None:
    rng = random.Random(seed)
    with Image.open(src) as opened:
        img = ImageOps.exif_transpose(opened)
        img = img.convert("RGB")

    img = _scale_pad_crop(img, rng)
    img = _tweak_channels(img, rng)
    img = _add_noise(img, rng, sigma)

    tmp = dst.with_name(f".{dst.stem}.{uuid.uuid4().hex}.tmp{dst.suffix.lower()}")
    try:
        ext = dst.suffix.lower()
        if ext in (".jpg", ".jpeg"):
            img.save(tmp, "JPEG", quality=rng.randint(82, 95), optimize=True)
        elif ext == ".png":
            img.save(tmp, "PNG", optimize=True)
        elif ext == ".webp":
            img.save(tmp, "WEBP", quality=rng.randint(82, 95))
        elif ext == ".gif":
            img.convert("P", palette=Image.ADAPTIVE).save(tmp, "GIF")
        else:
            img.save(tmp)
        os.replace(tmp, dst)
    finally:
        if tmp.exists():
            try:
                tmp.unlink()
            except OSError:
                pass


def _worker(task: Tuple[str, str, int, float]) -> Tuple[str, bool, Optional[str]]:
    src, dst, seed, sigma = task
    try:
        transform_image(Path(src), Path(dst), seed, sigma)
        return (dst, True, None)
    except Exception as exc:  # noqa: BLE001 — tek dosya hatası tüm işi düşürmemeli
        return (dst, False, f"{type(exc).__name__}: {exc}")


# ── snapshot ─────────────────────────────────────────────────────────────────

def ensure_source(pools: Dict[str, List[Path]], dry_run: bool, enabled: bool = True) -> int:
    """`--keep-source` modunda eksik orijinalleri `_source/` altına kopyalar.
    Kopyalanan adet (mod kapalıysa 0)."""
    if not enabled:
        return 0
    copied = 0
    for rel_dir, files in pools.items():
        for file in files:
            rel = file.relative_to(ROOT)
            source = SOURCE_DIR / rel
            if source.exists():
                continue
            copied += 1
            if not dry_run:
                source.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file, source)
    return copied


# ── manifest ─────────────────────────────────────────────────────────────────

def read_version() -> Optional[int]:
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        version = data.get("version")
        return int(version) if version else None
    except Exception:  # noqa: BLE001
        return None


def write_manifest(payload: dict) -> None:
    tmp = MANIFEST_PATH.with_name(f".{MANIFEST_PATH.name}.{uuid.uuid4().hex}.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, MANIFEST_PATH)


# ── ana akış ─────────────────────────────────────────────────────────────────

def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="mock-image havuzunu yeniler")
    parser.add_argument(
        "--model",
        action="append",
        dest="models",
        help="yalnızca bu havuzu işle (slug veya slug/renk); tekrarlanabilir",
    )
    parser.add_argument("--workers", type=int, default=max(1, min(8, (os.cpu_count() or 2) - 1)))
    parser.add_argument("--seed", type=int, default=None, help="rastgelelik tohumu (varsayılan: zaman)")
    parser.add_argument("--sigma", type=float, default=4.0, help="gürültü şiddeti (varsayılan: 4)")
    parser.add_argument("--dry-run", action="store_true", help="yazma, yalnızca planı yazdır")
    parser.add_argument(
        "--keep-source",
        action="store_true",
        help="eski orijinalleri (_source/) silme, ayrıca eksikleri oradan kopyala",
    )
    parser.add_argument("--list", action="store_true", help="havuzları JSON olarak yazdır ve çık")
    args = parser.parse_args(argv)

    pools = discover_pools(ROOT, args.models)
    total = sum(len(files) for files in pools.values())

    if args.list:
        print(json.dumps({
            "ok": True,
            "pools": {name: len(files) for name, files in pools.items()},
            "total": total,
        }, ensure_ascii=False))
        return 0

    if total == 0:
        # Kısmi yenilemede havuz eşleşmemesi "yapılacak bir şey yok" demektir.
        payload = {"ok": bool(args.models), "error": "no images matched", "models": args.models}
        print(json.dumps(payload, ensure_ascii=False))
        return 0 if args.models else 1

    started = time.time()
    seed_base = args.seed if args.seed is not None else int(started * 1000)

    if args.dry_run:
        print(json.dumps({
            "ok": True,
            "dryRun": True,
            "pools": {name: len(files) for name, files in pools.items()},
            "total": total,
            "workers": args.workers,
            "models": args.models,
        }, ensure_ascii=False))
        return 0

    new_source_files = ensure_source(pools, dry_run=False, enabled=args.keep_source)

    tasks: List[Tuple[str, str, int, float]] = []
    for rel_dir, files in pools.items():
        for file in files:
            rel = file.relative_to(ROOT)
            source = SOURCE_DIR / rel
            src = source if source.exists() else file
            seed = (seed_base ^ zlib.crc32(str(rel).encode("utf-8"))) & 0x7FFFFFFF
            tasks.append((str(src), str(file), seed, args.sigma))

    ok_count = 0
    failures: List[str] = []
    with ProcessPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = [pool.submit(_worker, task) for task in tasks]
        for idx, future in enumerate(as_completed(futures), start=1):
            dst, success, error = future.result()
            if success:
                ok_count += 1
            else:
                failures.append(f"{Path(dst).name}: {error}")
            if idx % 25 == 0 or idx == len(futures):
                print(f"[{idx}/{len(futures)}] işlendi", file=sys.stderr, flush=True)

    duration_ms = int((time.time() - started) * 1000)
    version = int(time.time() * 1000)

    # Tam (tüm ağaç) ve başarılı çalıştırmadan sonra eski orijinalleri sil.
    source_removed = False
    if len(failures) == 0 and not args.models and not args.keep_source and SOURCE_DIR.exists():
        shutil.rmtree(SOURCE_DIR, ignore_errors=True)
        source_removed = not SOURCE_DIR.exists()

    if ok_count > 0:
        write_manifest({
            "version": version,
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "durationMs": duration_ms,
            "imageCount": ok_count,
            "sourceSnapshotted": new_source_files,
            "sourceRemoved": source_removed,
            "pools": {name: len(files) for name, files in pools.items()},
        })

    print(json.dumps({
        "ok": len(failures) == 0,
        "version": version,
        "count": ok_count,
        "failed": len(failures),
        "errors": failures[:10],
        "durationMs": duration_ms,
        "sourceSnapshotted": new_source_files,
        "sourceRemoved": source_removed,
    }, ensure_ascii=False))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
