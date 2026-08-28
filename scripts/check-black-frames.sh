#!/usr/bin/env bash
# Fail loudly if a rendered mp4 contains any black (or near-black) frames.
# Liam style hard rule: renders must never contain a black frame.
#
# Usage:
#   npm run check:black -- out/YourComp.mp4
#   ./scripts/check-black-frames.sh out/*.mp4
set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found — install it (brew install ffmpeg) to run the black-frame check." >&2
  exit 2
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: check-black-frames.sh <file.mp4> [more.mp4 ...]" >&2
  exit 2
fi

# Average-luma floor for the darkest frame (0=black, 255=white).
#
# Calibrated against real APPROVED renders, not guessed:
#   Bennett Merydian-dark series (shipped)   darkest YAVG 17.3 - 21.4
#   Liam white series (this repo, shipped)   darkest YAVG 200  - 241
#
# That measured overlap is the whole point: a deliberately dark approved beat and
# a dead frame with one glowing element BOTH land around YAVG 20, so average luma
# cannot separate them. Anything above ~8 is therefore reported, not failed --
# raising the floor into the 17-21 band would fail Bennett's entire shipped
# series. blackdetect stays the hard gate; this is the backstop for frames that
# slip under its 98%-of-pixels test, plus a warning band for human review.
YAVG_MIN="${BLACK_YAVG_MIN:-8}"
YAVG_WARN="${BLACK_YAVG_WARN:-16}"

fail=0
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "❌ not found: $f" >&2
    fail=1
    continue
  fi

  # blackdetect flags any span of near-black frames.
  # d=0.001  -> catch even a single frame (~1/1000s)
  # pic_th   -> fraction of pixels that must be black to call the frame black
  # pix_th   -> luminance threshold below which a pixel counts as black
  detect="$(ffmpeg -hide_banner -i "$f" \
    -vf "blackdetect=d=0.001:pic_th=0.98:pix_th=0.10" -an -f null - 2>&1 \
    | grep -i "black_start" || true)"

  # Cross-check the single darkest frame's average luma (0=black, 255=white).
  darkest="$(ffmpeg -hide_banner -i "$f" \
    -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -an -f null - 2>&1 \
    | awk -F= '/YAVG/{print $NF}' | sort -n | head -1)"

  if [ -n "$detect" ]; then
    echo "❌ BLACK FRAMES: $f"
    echo "$detect" | sed 's/^/     /'
    fail=1
    continue
  fi

  # blackdetect only fires when pic_th (98%) of pixels fall under pix_th. A frame
  # that is near-black but carries a gradient or a few glowing elements can hold
  # under that bar and still read as a dead frame on delivery. So gate on the
  # darkest frame's average luma too. Dark/spotlight beats are allowed, but they
  # must stay visibly above black.
  if [ -z "$darkest" ]; then
    echo "❌ could not measure luma (no YAVG from signalstats): $f" >&2
    fail=1
    continue
  fi

  verdict="$(awk -v d="$darkest" -v min="$YAVG_MIN" -v warn="$YAVG_WARN" 'BEGIN{
    if (d+0 < min+0) print "fail"; else if (d+0 < warn+0) print "warn"; else print "ok"
  }')"

  case "$verdict" in
    fail)
      echo "❌ NEAR-BLACK FRAME: $f  (darkest YAVG=$darkest, floor=$YAVG_MIN)"
      echo "     Passed blackdetect but is too dark to ship. Raise the base or add"
      echo "     a visible gradient/glow. Override with BLACK_YAVG_MIN if intended."
      fail=1
      ;;
    warn)
      echo "⚠️  no black frames: $f  (darkest YAVG=$darkest — close to the $YAVG_MIN floor)"
      ;;
    *)
      echo "✅ no black frames: $f  (darkest frame YAVG=$darkest)"
      ;;
  esac
done

exit "$fail"
