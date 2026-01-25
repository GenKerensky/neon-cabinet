## How It Worked

The original Asteroids (1979) used a Digital Vector Generator (DVG) with an XY monitor, not a raster display.

**Technical Process:**

- The DVG used Digital-to-Analog Converters (DACs) to convert 10-bit digital coordinates into analog voltage signals
- The electron beam was positioned directly to draw lines, not scanned row-by-row
- The 6502 processor stored vector commands in ROM that the DVG executed to trace connected lines
- Objects were drawn as complete wireframe shapes by tracing their outlines

**Key Difference:** Instead of illuminating a pixel grid, the beam only visited points that needed to be drawn, skipping dark areas entirely.

## Visual Effect

**Appearance:**

- Bright, sharp lines with high contrast against a black background
- Monochrome display (typically green or blue-white phosphor, like P31)
- Phosphor glow: lines had a visible glow/persistence as the beam traced them
- Wireframe aesthetic: objects appeared as outlined shapes, not filled
- Minimal flicker: the beam only drew what was needed, so less flicker than raster displays
- "Dancing" effect: objects appeared to move smoothly as the beam redrew them

**Characteristic Look:**

- Bright, glowing lines that stood out sharply
- Smooth motion without pixelation
- Distinctive monochrome vector graphics style
- Slight phosphor persistence creating a subtle trail/glow effect

**Sources:**

- [The Secret Life of Vector Generators](https://jmargolin.com/vgens/vgens.htm)
- [Vector Monitor (Wikipedia)](https://en.wikipedia.org/wiki/Vector_monitor)
- [Asteroids Disassembly](https://6502disassembly.com/va-asteroids/)

## Modern Color Vector Display Technologies

**1. Laser Projectors**

- Use RGB lasers to draw vector graphics in full color
- Draw smooth lines directly, similar to classic vector displays
- Support gradients and color transitions along lines
- Used in laser shows and installations
- Software: ILD Render, MadLaser, Pangolin QuickShow

**2. OLED Displays**

- Can render vector graphics with per-pixel color control
- High contrast and color accuracy
- Software rendering can simulate vector drawing

**3. High-Resolution Displays with Software Rendering**

- Modern GPUs can render vector graphics in real time
- Support full color, gradients, and effects
- Your shader approach could be extended to color

## What It Would Look Like

**Visual Characteristics:**

- Bright, sharp colored lines (not just monochrome)
- Smooth gradients along lines (e.g., red-to-yellow flames, blue-to-cyan energy)
- Color-coded elements (e.g., different asteroid types, weapon colors)
- Enhanced depth perception through color
- Phosphor-style glow effects in color (e.g., green energy, red explosions)

**Compared to Original:**

- Original: monochrome green/white wireframes
- Modern color: full spectrum with gradients, maintaining the sharp line aesthetic
- Can preserve the vector look while adding color information

**Historical Note:** Color vector displays existed (Tempest, Star Wars arcade) but used RGB shadow masks and had visual artifacts. Modern tech avoids those issues.

**Sources:**

- [ILD Render - Color Vector Graphics](https://ildrender.automatic-brain.de/)
- [Vector Monitor (Wikipedia)](https://en.wikipedia.org/wiki/Vector_monitor)
- [Bézier Splatting for Vector Graphics](https://arxiv.org/html/2503.16424v3)

## Implementation

We want this game to evoke the same feeling as the original with crips, bright, geometic graphics. Every vector sprite and texture drawn should adhere to this deisgn. We also want to do things the original vector displays couldn't, like color and gradients. The game should have two graphical modes, color and monochrome and all assets should work seemlessly between them, maintianing appropriate shade and contrast with other elements while in monocrhome mode.
