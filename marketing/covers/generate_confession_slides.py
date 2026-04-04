from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap
import urllib.request

WIDTH = 1080
HEIGHT = 1920
DPI = (300, 300)

TOKENS = {
    "bg": "#FFF9F0",
    "ink": "#1A1A1A",
    "primary": "#FFD600",
    "secondary": "#00E0FF",
    "accent": "#FF4D00",
    "muted": "#8A8A8A",
}

ROOT = Path(__file__).resolve().parent
OUT_1 = ROOT / "slide_01_hook.png"
OUT_5 = ROOT / "slide_05_cta.png"
FONTS_DIR = ROOT / ".assets" / "fonts"
FONTS_DIR.mkdir(parents=True, exist_ok=True)

# Existing design token fonts from src/index.css:
# --font-display: "Space Grotesk"
# --font-sans: "Outfit"
SPACE_GROTESK_BOLD_URL = "https://github.com/google/fonts/raw/main/ofl/spacegrotesk/SpaceGrotesk-Bold.ttf"
OUTFIT_SEMIBOLD_URL = "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit-SemiBold.ttf"


def ensure_font(url: str, target: Path) -> Path:
    if target.exists():
        return target
    try:
        urllib.request.urlretrieve(url, str(target))
    except Exception:
        pass
    return target


def load_fonts():
    display_path = ensure_font(SPACE_GROTESK_BOLD_URL, FONTS_DIR / "SpaceGrotesk-Bold.ttf")
    sans_path = ensure_font(OUTFIT_SEMIBOLD_URL, FONTS_DIR / "Outfit-SemiBold.ttf")

    def _safe(path: Path, size: int):
        try:
            return ImageFont.truetype(str(path), size=size)
        except Exception:
            return ImageFont.load_default()

    return {
        "label": _safe(display_path, 42),
        "headline": _safe(display_path, 92),
        "url": _safe(display_path, 62),
        "small": _safe(sans_path, 34),
    }


def wrap_text_by_px(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> str:
    words = text.split()
    lines: list[str] = []
    current = ""

    for word in words:
        probe = (current + " " + word).strip()
        bbox = draw.textbbox((0, 0), probe, font=font)
        if (bbox[2] - bbox[0]) <= max_width:
            current = probe
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    return "\n".join(lines)


def draw_label(draw: ImageDraw.ImageDraw, text: str, fonts: dict[str, ImageFont.ImageFont], top: int):
    font = fonts["label"]
    pad_x = 28
    pad_y = 16
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    x = (WIDTH - (tw + pad_x * 2)) // 2
    y = top

    draw.rectangle(
        [x, y, x + tw + pad_x * 2, y + th + pad_y * 2],
        fill=TOKENS["secondary"],
        outline=TOKENS["ink"],
        width=4,
    )

    shadow_offset = 8
    draw.rectangle(
        [
            x + shadow_offset,
            y + shadow_offset,
            x + tw + pad_x * 2 + shadow_offset,
            y + th + pad_y * 2 + shadow_offset,
        ],
        outline=TOKENS["ink"],
        width=2,
    )

    draw.text((x + pad_x, y + pad_y), text, font=font, fill=TOKENS["ink"])


def draw_centered_block(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    top: int,
    max_width: int,
    fill: str,
    line_spacing: int = 14,
):
    wrapped = wrap_text_by_px(draw, text, font, max_width)
    bbox = draw.multiline_textbbox((0, 0), wrapped, font=font, spacing=line_spacing, align="center")
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (WIDTH - tw) // 2
    draw.multiline_text((x, top), wrapped, font=font, fill=fill, spacing=line_spacing, align="center")
    return top + th


def create_slide_01(fonts: dict[str, ImageFont.ImageFont]):
    img = Image.new("RGB", (WIDTH, HEIGHT), TOKENS["bg"])
    draw = ImageDraw.Draw(img)

    draw_label(draw, "UNROT CONFESSIONS 🕳️", fonts, top=110)

    headline = "people are anonymously confessing their screen addictions. and i can't stop reading them."
    end_y = draw_centered_block(
        draw,
        headline,
        fonts["headline"],
        top=520,
        max_width=910,
        fill=TOKENS["ink"],
        line_spacing=18,
    )

    draw.line([(130, end_y + 48), (950, end_y + 48)], fill=TOKENS["ink"], width=4)

    bottom_text = "swipe to read →"
    bbox = draw.textbbox((0, 0), bottom_text, font=fonts["small"])
    tw = bbox[2] - bbox[0]
    draw.text(((WIDTH - tw) // 2, HEIGHT - 190), bottom_text, font=fonts["small"], fill=TOKENS["muted"])

    img.save(OUT_1, format="PNG", dpi=DPI)


def create_slide_05(fonts: dict[str, ImageFont.ImageFont]):
    img = Image.new("RGB", (WIDTH, HEIGHT), TOKENS["bg"])
    draw = ImageDraw.Draw(img)

    draw_label(draw, "READY TO CONFESS?", fonts, top=110)

    headline = "drop yours anonymously. no account. no judgment."
    end_y = draw_centered_block(
        draw,
        headline,
        fonts["headline"],
        top=560,
        max_width=900,
        fill=TOKENS["ink"],
        line_spacing=18,
    )

    url_text = "unrot.space/confess"
    bbox = draw.textbbox((0, 0), url_text, font=fonts["url"])
    tw = bbox[2] - bbox[0]
    draw.text(((WIDTH - tw) // 2, end_y + 88), url_text, font=fonts["url"], fill=TOKENS["accent"])

    footer = "© unrot — cure brainrot"
    fb = draw.textbbox((0, 0), footer, font=fonts["small"])
    fw = fb[2] - fb[0]
    draw.text(((WIDTH - fw) // 2, HEIGHT - 190), footer, font=fonts["small"], fill=TOKENS["muted"])

    img.save(OUT_5, format="PNG", dpi=DPI)


def main():
    fonts = load_fonts()
    create_slide_01(fonts)
    create_slide_05(fonts)
    print(f"Created: {OUT_1}")
    print(f"Created: {OUT_5}")


if __name__ == "__main__":
    main()
