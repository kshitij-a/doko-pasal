"""Build labeled contact sheets from E:/tmp/opencode/verify for visual QA. Re-runnable."""
import json
import os
import sys
from PIL import Image, ImageDraw

VDIR = sys.argv[1] if len(sys.argv) > 1 else "E:/tmp/opencode/verify"
COLS, PER, TW, TH = 5, 10, 320, 320

with open(os.path.join(VDIR, "ids.txt")) as f:
    ids = [l.strip() for l in f if l.strip()]
have = [i for i in ids if os.path.exists(os.path.join(VDIR, i.replace("photo-", "") + ".jpg"))]
mapping = [{"idx": n, "id": i} for n, i in enumerate(have)]
with open(os.path.join(VDIR, "map.json"), "w") as f:
    json.dump(mapping, f)

for s in range((len(mapping) + PER - 1) // PER):
    sheet = Image.new("RGB", (COLS * TW, 2 * (TH + 26)), "black")
    d = ImageDraw.Draw(sheet)
    for k in range(PER):
        n = s * PER + k
        if n >= len(mapping):
            break
        im = Image.open(os.path.join(VDIR, mapping[n]["id"].replace("photo-", "") + ".jpg")).convert("RGB")
        im.thumbnail((TW, TH))
        x, y = (k % COLS) * TW, (k // COLS) * (TH + 26)
        sheet.paste(im, (x, y))
        d.text((x + 6, y + TH + 4), str(n), fill="white")
    sheet.save(os.path.join(VDIR, f"sheet{s}.png"))
print(f"SHEETS={(len(mapping) + PER - 1) // PER} IMAGES={len(mapping)}")
