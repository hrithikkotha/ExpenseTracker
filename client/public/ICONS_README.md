# PWA Icons Guide

## Required Icons

The PWA requires the following icon files in the `public` directory:

### 1. App Icons

```
icon-192.png   (192×192px)  - Standard icon
icon-512.png   (512×512px)  - High-resolution icon
favicon.svg    (any size)   - Browser tab icon
```

### 2. Icon Specifications

**Format**: PNG with transparency  
**Color**: Should match app's primary color (#6366f1)  
**Safe Zone**: Keep important content within 80% of canvas (avoid edges)  
**Background**: Transparent or solid color

---

## Quick Icon Generation

### Option 1: Using Figma / Adobe Illustrator

1. Create a 512×512px canvas
2. Design your icon (e.g., wallet, dollar sign, expense tracker symbol)
3. Export as PNG at 512×512px → Save as `icon-512.png`
4. Resize to 192×192px → Save as `icon-192.png`
5. Export as SVG → Save as `favicon.svg`

### Option 2: Using Online Tools

**PWA Icon Generator**:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

**Steps**:
1. Upload your logo/icon (at least 512×512px)
2. Select "PWA Icons"
3. Download generated icons
4. Place in `public/` directory

### Option 3: Using Image Editing Software

**GIMP** (Free):
```
1. Create new image: 512×512px
2. Design icon
3. Export as PNG → icon-512.png
4. Scale to 192×192 (Image → Scale Image)
5. Export as PNG → icon-192.png
```

**Photoshop**:
```
1. New document: 512×512px
2. Design icon
3. File → Export → Export As → PNG → 512×512 → Save as icon-512.png
4. Image → Image Size → 192×192
5. Export as PNG → icon-192.png
```

---

## Icon Design Best Practices

### Do's ✅
- Use simple, recognizable symbols
- High contrast (visible on light and dark backgrounds)
- Avoid gradients (keep flat or minimal shading)
- Center important elements
- Test on different backgrounds
- Use app's brand colors

### Don'ts ❌
- Don't include text (icons should be symbolic)
- Don't use complex details (won't be visible at small sizes)
- Don't use photography (use illustrations/vectors)
- Don't leave edges unrounded (iOS will round automatically)
- Don't use pure white or black (#f8f8f8 or #111 instead)

---

## Testing Icons

### Chrome DevTools

1. Open DevTools (F12)
2. Application tab → Manifest
3. Check "Icons" section
4. All icons should have green checkmarks

### Browser

```
favicon.svg → Browser tab
icon-192.png → Install dialog, app drawer
icon-512.png → Splash screen, app store
```

---

## Maskable Icons (Optional Enhancement)

For better Android adaptive icon support, create maskable versions:

```
icon-maskable-192.png (192×192px)
icon-maskable-512.png (512×512px)
```

**Maskable Icon Requirements**:
- Icon content within 80% safe zone (center)
- Solid background (no transparency)
- Tested with maskable.app

**Update manifest.json**:
```json
{
  "src": "/icon-maskable-512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "maskable"
}
```

---

## Current Icon Placeholders

The app currently uses placeholder icons. Replace them with your custom icons:

### Temporary Icon Generation (for testing)

If you need quick placeholders:

```bash
# Using ImageMagick (if installed)
convert -size 512x512 xc:#6366f1 -gravity center -pointsize 200 -fill white -annotate +0+0 "$" icon-512.png
convert icon-512.png -resize 192x192 icon-192.png

# Using Node.js (sharp library)
npm install -g sharp-cli
sharp -i icon-512.png -o icon-192.png resize 192 192
```

---

## Icon Checklist

Before deploying:

- [ ] icon-192.png exists in `/public`
- [ ] icon-512.png exists in `/public`
- [ ] favicon.svg exists in `/public`
- [ ] Icons are properly sized (192×192 and 512×512)
- [ ] Icons are optimized (compressed PNG)
- [ ] Icons look good on light and dark backgrounds
- [ ] Icons appear correctly in manifest (DevTools → Application → Manifest)
- [ ] Install prompt shows correct icon
- [ ] Installed app shows correct icon

---

## Resources

- [PWA Icon Guide](https://web.dev/maskable-icon/)
- [Maskable Icon Editor](https://maskable.app/editor)
- [Icon Requirements (Android)](https://developer.android.com/training/multiscreen/screendensities)
- [Icon Requirements (iOS)](https://developer.apple.com/design/human-interface-guidelines/app-icons)

---

## Example Icon Ideas for Expense Tracker

1. **Wallet icon** 👛
2. **Dollar sign** $
3. **Piggy bank** 🐷
4. **Calculator** 🧮
5. **Pie chart** 📊
6. **Credit card** 💳
7. **Coin stack** 🪙
8. **Receipt** 🧾

Choose one that represents your app's brand and is easily recognizable at small sizes!
