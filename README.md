# Wada Wear

*Match your clothes to Sanzo Wada's curated color combinations.*
*将你的衣服匹配到和田三造的色彩组合。*

---

## What is this

Wada Wear is a personal, private PWA that helps you find harmonious color pairings for your clothing. Take a photo of any garment, and the app identifies its dominant color, matches it against the 159 colors from Sanzo Wada's 1930s masterpiece *A Dictionary of Colour Combinations*, and shows you all 348 curated palettes that include that color.

This is not a fashion app. It's a color reference tool disguised as a wardrobe companion. No accounts. No servers. No data leaves your phone.

Wada Wear 是一款个人私有的 PWA 工具。拍下任意一件衣服，应用会识别主色调，将其匹配到和田三造 1930 年代的经典著作《配色总鉴》中的 159 种颜色，并展示包含该颜色的全部 348 组配色方案。无需账号，无需服务器，数据不离开你的手机。

## How it works / 使用方式

1. **Photo Match / 拍照取色** — Select a photo from your camera roll. The app extracts the dominant color. Drag the pin to adjust. Choose from the 3 closest dataset matches.
2. **Browse Colors / 浏览色库** — Browse all 159 colors organized by 7 color families (Red, Orange, Yellow, Green, Blue, Purple, Neutral).
3. **My Colors / 我的色卡** — Save confirmed colors to your personal collection for future reference.
4. **Combinations / 配色组合** — View all curated palettes containing any selected color. Owned colors are visually marked.

## Tech / 技术

- Pure HTML + CSS + JS. No frameworks. No build tools. Zero npm dependencies.
- [chroma.js](https://vis4.net/chromajs/) (CDN, CIEDE2000 color difference)
- [Sanzo Wada color dataset](https://github.com/mattdesl/dictionary-of-colour-combinations) by Matt DesLauriers
- PWA: Service Worker offline caching, add to iPhone Home Screen
- Design system: [Impeccable](https://impeccable.style)
- Hosted on GitHub Pages

## Data / 数据

From Sanzo Wada's *A Dictionary of Colour Combinations* (配色総鑑), compiled by Dain M. Blodorn Kim, corrected and packaged by Matt DesLauriers. 159 colors, 348 combinations of 2–4 colors each, originally published in 1930s Japan.

## License / 许可

Source code: MIT. Color dataset: MIT (see [upstream](https://github.com/mattdesl/dictionary-of-colour-combinations)).
