# Japan

An offline travel companion, installed from Safari as a home-screen app. Once opened on wifi it works in airplane mode.

Everything personal is encrypted in `docs/data.bin` (AES-256-GCM, key derived from a passphrase with PBKDF2, 600,000 rounds). This repository only holds the app shell, so it can be public.

## Layout

- `src/` is the app source: HTML, CSS, JS, service worker and icon.
- `scripts/build.mjs` turns the private data plus `src/` into `docs/`, which GitHub Pages serves.
- The private data lives in a separate folder next to this one, `../japan-trip-private/`, which is not part of any repository. It holds the trip data, tickets, passphrase and salt.

## Install on a phone

1. Open the GitHub Pages link in Safari.
2. Tap Share › Add to Home Screen.
3. Open the app from the home screen while on wifi and enter the passphrase.
4. Turn on airplane mode, force-quit and reopen to check.
