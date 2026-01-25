# Neon Cabinet Design System

## Brand Story

Neon Cabinet is a late-night arcade: moody purple walls, neon tubes, and glowing UI accents. The interface should feel like a physical cabinet in a dark room, with sharp neon edges, soft light bleed, and smooth motion.

## Visual Tone

- Flashy, high-contrast neon on deep purple-black backgrounds.
- Subtle haze, glow, and soft drop shadows.
- Smooth motion and slow ambient animation, never harsh or jarring.

## Color System

### Core Backgrounds

- `--nc-bg-primary: #12081F` main background
- `--nc-bg-secondary: #1A0F2E` panels, cards, modals
- `--nc-bg-tertiary: #24123D` elevated surfaces, hover fills

### Primary Neon Green

- `--nc-neon-green: #39FF14` primary call-to-action
- `--nc-neon-green-soft: #7CFF6B` glow, highlights
- `--nc-neon-green-dark: #1FAF0E` hover/pressed

### Secondary Neon Purple

- `--nc-neon-purple: #B026FF` accents, outlines
- `--nc-neon-purple-soft: #D17CFF` soft glow
- `--nc-neon-purple-dark: #7A1FBF` hover/pressed

### Supporting Neons (sparingly)

- `--nc-neon-pink: #FF4FD8`
- `--nc-neon-yellow: #FFD84D`
- `--nc-neon-cyan: #3CF2FF`

### Text and Neutral UI

- `--nc-text-primary: #EDE9FF` main text
- `--nc-text-secondary: #B8A9E6` secondary text
- `--nc-text-muted: #7C6CA8` hints, placeholders

### Borders and Dividers

- `--nc-border-soft: #2E1A4A` subtle borders
- `--nc-border-neon: #39FF14` accent borders

## Typography

- Headline: geometric, sci-fi (e.g., Orbitron)
- Body: clean, modern sans (e.g., Inter)
- Hero headings should use all-caps or wide tracking.
- Use mild letter spacing on headings to evoke arcade signage.

## Layout and Spacing

- Max width: 1200-1280px for content.
- Use generous vertical spacing to let glow breathe.
- Card padding: 20-28px, with internal spacing at 12-16px steps.
- Corner radius: 10px (default), 14px for hero cards.

## Background and Imagery

- Base background: dark purple brick texture with a subtle gradient overlay for readability.
- Hero image: the Neon Cabinet branding artwork, used as the main focal point.
- Background should never overpower foreground; apply a dark overlay or gradient.

## Glow and Shadows

### Glow Style

- Glow is soft and wide; blur is more important than sharpness.
- Stack glows (small + medium) for neon elements.

### Suggested Glow Utilities

- Green glow: `0 0 12px rgba(57, 255, 20, 0.4)`
- Purple glow: `0 0 14px rgba(176, 38, 255, 0.4)`
- Card shadow: `0 12px 28px rgba(10, 0, 25, 0.45)`

## Motion and Animation

- Use smooth ease-out transitions.
- Durations: 200-300ms for hover, 600-1200ms for ambient glows.
- Add subtle float or shimmer to hero elements.
- Add slow pulse to neon borders to simulate light breathing.

## Component Guidelines

### Navbar

- Glassy background with blur.
- Neon hover on links.
- Logo text in neon green with subtle glow.

### Hero Section

- Large neon headline and short subcopy.
- Neon CTA with glow and hover shimmer.
- Hero image floats slightly and emits a soft purple glow.

### Buttons

- Primary: neon green background with dark text, glow on hover.
- Secondary: purple outline with neon text.
- Pressed state: darker neon with reduced glow.

### Game Cards

- Dark card body, neon border accent.
- Hover: increased glow, slight scale, image zoom.
- Subtitle in muted text.

### Game Canvas Frame

- Framed cabinet effect: neon outline, soft inner shadow.
- Slight ambient pulse around the container.

## Accessibility

- Maintain high contrast for text on dark backgrounds.
- Avoid flashing or rapid animation; keep glow pulses slow.
- Ensure focus rings are clearly visible with neon outlines.
