precision highp float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;
uniform float uColorMode; // 0.0 = monochrome, 1.0 = color

varying vec2 outTexCoord;

// Subtle CRT curvature (vector monitors still had slight curve)
vec2 curve(vec2 uv) {
    uv = (uv - 0.5) * 2.0;
    uv *= 1.05;
    uv.x *= 1.0 + pow((abs(uv.y) / 8.0), 2.0);
    uv.y *= 1.0 + pow((abs(uv.x) / 6.0), 2.0);
    uv = (uv / 2.0) + 0.5;
    uv = uv * 0.96 + 0.02;
    return uv;
}

// Bloom/glow effect for vector phosphor glow (Gaussian blur)
vec3 bloom(sampler2D tex, vec2 uv, vec2 res) {
    vec3 col = vec3(0.0);
    float total = 0.0;
    float bloomSize = 4.0;
    float sigma = 2.0;

    for (float x = -4.0; x <= 4.0; x += 1.0) {
        for (float y = -4.0; y <= 4.0; y += 1.0) {
            vec2 offset = vec2(x, y) * bloomSize / res;
            float weight = exp(-(x*x + y*y) / (2.0 * sigma * sigma));
            col += texture2D(tex, uv + offset).rgb * weight;
            total += weight;
        }
    }
    return col / total;
}

// Larger glow for intense phosphor persistence (Gaussian blur)
vec3 wideGlow(sampler2D tex, vec2 uv, vec2 res) {
    vec3 col = vec3(0.0);
    float total = 0.0;
    float glowSize = 8.0;
    float sigma = 3.0;

    for (float x = -5.0; x <= 5.0; x += 1.0) {
        for (float y = -5.0; y <= 5.0; y += 1.0) {
            vec2 offset = vec2(x, y) * glowSize / res;
            float weight = exp(-(x*x + y*y) / (2.0 * sigma * sigma));
            col += texture2D(tex, uv + offset).rgb * weight;
            total += weight;
        }
    }
    return col / total;
}

// Very wide glow for stars and bright objects (Gaussian blur)
vec3 starGlow(sampler2D tex, vec2 uv, vec2 res) {
    vec3 col = vec3(0.0);
    float total = 0.0;
    float starGlowSize = 14.0;
    float sigma = 4.0;

    for (float x = -6.0; x <= 6.0; x += 1.0) {
        for (float y = -6.0; y <= 6.0; y += 1.0) {
            vec2 offset = vec2(x, y) * starGlowSize / res;
            float weight = exp(-(x*x + y*y) / (2.0 * sigma * sigma));
            col += texture2D(tex, uv + offset).rgb * weight;
            total += weight;
        }
    }
    return col / total;
}

void main() {
    vec2 uv = outTexCoord;

    // Apply subtle CRT curvature
    vec2 curved = curve(uv);

    // Check if outside screen bounds
    if (curved.x < 0.0 || curved.x > 1.0 || curved.y < 0.0 || curved.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Sample original color
    vec3 color = texture2D(uMainSampler, curved).rgb;

    // Apply vector display phosphor color (blue-white like original Asteroids)
    // Original used P31 phosphor which had a blue-green tint
    vec3 phosphorColor = vec3(0.85, 0.95, 1.0);

    // Calculate luminance for glow intensity
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Branch based on color mode
    if (uColorMode < 0.5) {
        // Monochrome mode: convert to luminance and apply phosphor tint
        vec3 monoColor = luminance * phosphorColor;

        // Bloom effect - simulates phosphor glow
        vec3 bloomColor = bloom(uMainSampler, curved, uResolution);
        float bloomLum = dot(bloomColor, vec3(0.299, 0.587, 0.114));
        vec3 bloomMono = bloomLum * phosphorColor;

        // Wide glow for intense persistence effect
        vec3 wideGlowColor = wideGlow(uMainSampler, curved, uResolution);
        float wideGlowLum = dot(wideGlowColor, vec3(0.299, 0.587, 0.114));
        vec3 wideGlowMono = wideGlowLum * phosphorColor;

        // Star glow for very bright objects
        vec3 starGlowColor = starGlow(uMainSampler, curved, uResolution);
        float starGlowLum = dot(starGlowColor, vec3(0.299, 0.587, 0.114));
        vec3 starGlowMono = starGlowLum * phosphorColor;
        
        // Intensity-based glow - brighter pixels get more glow
        float glowIntensity = pow(luminance, 0.5);

        // Combine: sharp original + bloom + wide glow + star glow
        color = monoColor * 1.2 
              + bloomMono * (0.8 + glowIntensity * 0.4) 
              + wideGlowMono * (0.4 + glowIntensity * 0.3)
              + starGlowMono * (glowIntensity * 0.2);

        // Edge glow enhancement - brighter at edges of shapes
        float edgeGlow = abs(luminance - bloomLum) * 2.0;
        color += edgeGlow * phosphorColor * 0.3;
    } else {
        // Color mode: preserve RGB with subtle phosphor tint
        vec3 colorTinted = color * (1.0 + phosphorColor * 0.1);

        // Bloom effect - preserve color
        vec3 bloomColor = bloom(uMainSampler, curved, uResolution);
        vec3 bloomTinted = bloomColor * (1.0 + phosphorColor * 0.1);

        // Wide glow for intense persistence effect
        vec3 wideGlowColor = wideGlow(uMainSampler, curved, uResolution);
        vec3 wideGlowTinted = wideGlowColor * (1.0 + phosphorColor * 0.1);

        // Star glow for very bright objects
        vec3 starGlowColor = starGlow(uMainSampler, curved, uResolution);
        vec3 starGlowTinted = starGlowColor * (1.0 + phosphorColor * 0.1);
        
        // Intensity-based glow - brighter pixels get more glow
        float glowIntensity = pow(luminance, 0.5);

        // Combine: sharp original + bloom + wide glow + star glow
        color = colorTinted * 1.2 
              + bloomTinted * (0.8 + glowIntensity * 0.4) 
              + wideGlowTinted * (0.4 + glowIntensity * 0.3)
              + starGlowTinted * (glowIntensity * 0.2);

        // Edge glow enhancement - use luminance difference for intensity
        float bloomLum = dot(bloomColor, vec3(0.299, 0.587, 0.114));
        float edgeGlow = abs(luminance - bloomLum) * 2.0;
        color += edgeGlow * color * 0.3;
    }

    // Vignette: subtle darkening at edges
    float vignette = curved.x * curved.y * (1.0 - curved.x) * (1.0 - curved.y);
    vignette = clamp(pow(16.0 * vignette, 0.3), 0.0, 1.0);
    color *= vignette;

    // Subtle flicker (vector monitors had slight beam intensity variation)
    float flicker = 0.97 + 0.03 * sin(uTime * 8.0 + curved.y * 2.0);
    color *= flicker;

    // Slight noise to simulate analog imperfections
    float noise = fract(sin(dot(curved + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
    color += (noise - 0.5) * 0.015;

    // Ensure we don't exceed white
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
