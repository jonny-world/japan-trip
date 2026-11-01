#!/usr/bin/env python3
"""Render crisp QR codes for every ticket payload in private/trip.json.

Each booking's tickets[].qr is the exact text the venue's own QR code holds
(decoded from the original). We redraw it large and clean, then decode our
own image to prove it round-trips before the build is allowed to use it.
"""
import json, sys, hashlib, pathlib
import cv2, numpy as np

import sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
# The private folder is passed in by build.mjs (it lives outside the repository).
PRIV = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'private'
trip = json.loads((PRIV / 'trip.json').read_text())
out_dir = PRIV / 'tickets' / 'qr'
out_dir.mkdir(parents=True, exist_ok=True)
det = cv2.QRCodeDetector()
bad = 0
for b in trip.get('bookings', []):
    for i, t in enumerate(b.get('tickets', [])):
        if not t.get('qr'):
            continue
        name = f"{b['id']}-{i + 1}-{hashlib.sha1(t['qr'].encode()).hexdigest()[:8]}.png"
        path = out_dir / name
        if not path.exists():
            p = cv2.QRCodeEncoder_Params(); p.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_M
            m = cv2.QRCodeEncoder_create(p).encode(t['qr'])          # 1 px per module, no margin
            m = cv2.copyMakeBorder(m, 4, 4, 4, 4, cv2.BORDER_CONSTANT, value=255)
            scale = max(1, 720 // m.shape[0])
            img = cv2.resize(m, (m.shape[1] * scale, m.shape[0] * scale), interpolation=cv2.INTER_NEAREST)
            cv2.imwrite(str(path), img, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        val, _, _ = det.detectAndDecode(cv2.imread(str(path)))
        if val != t['qr']:
            print(f"QR MISMATCH {b['id']} #{i + 1}: {val!r} != {t['qr']!r}"); bad += 1
        t['image'] = f"qr/{name}"
(PRIV / 'tickets' / 'qr' / 'index.json').write_text(json.dumps({b['id']: [t.get('image') for t in b.get('tickets', [])] for b in trip.get('bookings', [])}, indent=1))
sys.exit(1 if bad else 0)
