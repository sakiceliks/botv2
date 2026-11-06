#!/usr/bin/env python3
"""
Perceptual hash kırıcı — Sahibinden.com benzeri platformlarda
mükerrer görsel tespitini atlatmak için kullanılır.

Kullanım: python3 process_images.py
Girdi:  ./turuncu/
Çıktı:  ./turuncu_processed/
"""

import os
import random
import numpy as np
from PIL import Image

INPUT_DIR = "lacivert"
OUTPUT_DIR = "lacivert2"

SUPPORTED_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp')

def process_image(image_path: str, output_path: str) -> None:
    """
    Bir görseli perceptually farklılaştırıp kaydeder.
    Yöntemler:
    1) Rastgele yeniden boyutlandırma (%98–%102) + padding/crop
    2) Orijinal boyuta geri döndürme
    3) Piksel seviyesinde ±2 gürültü
    4) JPEG/PGN/WEBP optimize kaydetme
    """
    img = Image.open(image_path).convert("RGB")
    orig_w, orig_h = img.size

    # 1) Rastgele ölçeklendir
    scale = random.uniform(0.98, 1.02)
    new_w = max(1, int(orig_w * scale))
    new_h = max(1, int(orig_h * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)

    # 2) Orijinal boyuta döndür (crop veya padding ile)
    if scale < 1.0:
        # Küçüldü → beyaz padding ekle
        canvas = Image.new("RGB", (orig_w, orig_h), (255, 255, 255))
        px = (orig_w - new_w) // 2
        py = (orig_h - new_h) // 2
        canvas.paste(img, (px, py))
        img = canvas
    elif scale > 1.0:
        # Büyüdü → merkezden crop
        left = (new_w - orig_w) // 2
        top = (new_h - orig_h) // 2
        img = img.crop((left, top, left + orig_w, top + orig_h))

    # 3) ±2 gürültü ekle (insan gözü fark etmez, ama hash kırılır)
    pixels = np.array(img, dtype=np.int16)
    noise = np.random.randint(-2, 3, pixels.shape, dtype=np.int16)
    pixels = np.clip(pixels + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(pixels, "RGB")

    # 4) Format bazlı optimize kaydet
    ext = os.path.splitext(output_path)[1].lower()
    if ext in (".jpg", ".jpeg"):
        quality = random.randint(82, 95)
        img.save(output_path, "JPEG", quality=quality, optimize=True)
    elif ext == ".png":
        img.save(output_path, "PNG", optimize=True)
    elif ext == ".webp":
        quality = random.randint(82, 95)
        img.save(output_path, "WEBP", quality=quality)
    else:
        img.save(output_path)

def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    files = [
        f for f in os.listdir(INPUT_DIR)
        if f.lower().endswith(SUPPORTED_EXTENSIONS)
    ]

    if not files:
        print("❌ Görsel bulunamadı. 'turuncu/' klasörünü kontrol edin.")
        return

    for idx, filename in enumerate(files, start=1):
        src = os.path.join(INPUT_DIR, filename)
        dst = os.path.join(OUTPUT_DIR, filename)
        process_image(src, dst)
        print(f"[{idx:02d}/{len(files):02d}] {filename} ✓")

    print(f"\n✅ Tüm dosyalar '{OUTPUT_DIR}/' klasörüne kaydedildi.")
    print("   Bu dosyaları ilanlarınızda kullanabilirsiniz.")

if __name__ == "__main__":
    main()