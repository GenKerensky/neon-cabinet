precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 outTexCoord;

// CRT curvature
vec2 curve(vec2 uv) {
    uv = (uv - 0.5) * 2.0;
    uv *= 1.1;
    uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
    uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
    uv = (uv / 2.0) + 0.5;
    uv = uv * 0.92 + 0.04;
    return uv;
}

// Simple blur for glow effect
vec3 blur(sampler2D tex, vec2 uv, vec2 res) {
    vec3 col = vec3(0.0);
    float total = 0.0;
    float blurSize = 6.0;

    for (float x = -3.0; x <= 3.0; x += 1.0) {
        for (float y = -3.0; y <= 3.0; y += 1.0) {
            vec2 offset = vec2(x, y) * blurSize / res;
            float weight = 1.0 - length(vec2(x, y)) / 4.5;
            col += texture2D(tex, uv + offset).rgb * weight;
            total += weight;
        }
    }
    return col / total;
}

void main() {
    vec2 uv = outTexCoord;

    // Apply CRT curvature
    vec2 curved = curve(uv);

    // Check if outside screen bounds
    if (curved.x < 0.0 || curved.x > 1.0 || curved.y < 0.0 || curved.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic aberration (RGB split)
    float aberration = 0.001;
    float r = texture2D(uMainSampler, vec2(curved.x + aberration, curved.y)).r;
    float g = texture2D(uMainSampler, curved).g;
    float b = texture2D(uMainSampler, vec2(curved.x - aberration, curved.y)).b;
    vec3 color = vec3(r, g, b);

    // Glow effect - blend blurred version with original
    vec3 glow = blur(uMainSampler, curved, uResolution);
    float glowStrength = 0.5;
    color += glow * glowStrength;

    // Scanlines
    // float scanline = sin(curved.y * uResolution.y * 1.5) * 0.04;
    // color -= scanline;

    // Vertical RGB stripes (like real CRT phosphors)
    // float stripe = mod(floor(curved.x * uResolution.x), 3.0);
    // if (stripe == 0.0) color.rb *= 0.95;
    // else if (stripe == 1.0) color.rg *= 0.95;
    // else color.gb *= 0.95;

    // Vignette: darken edges, keep center bright
    // Product x*y*(1-x)*(1-y) is 0 on edges, max 0.0625 at center (0.5, 0.5)
    float vignette = curved.x * curved.y * (1.0 - curved.x) * (1.0 - curved.y);
    // 16.0 normalizes center to 1.0. Lower exponent = steeper falloff (stronger vignette)
    float vignetteExponent = 0.25;
    vignette = clamp(pow(16.0 * vignette, vignetteExponent), 0.0, 1.0);
    color *= vignette;

    // Slight flicker
    color *= 0.98 + 0.02 * sin(uTime * 15.0);

    // Boost brightness slightly to compensate for darkening effects
    color *= 1.15;

    gl_FragColor = vec4(color, 1.0);
}
