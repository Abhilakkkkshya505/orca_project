"use client";

import React, { useEffect, useRef } from "react";

export interface LiquidFilmProps {
  /** Speed of the fluid displacement waves (default: 0.8) */
  speed?: number;
  /** Scale / frequency of fluid turbulence ripples (default: 2.5) */
  scale?: number;
  /** Iridescence intensity and luster multiplier (default: 0.85) */
  intensity?: number;
  /** Film interference thickness / color fringe density (default: 1.2) */
  filmThickness?: number;
  /** Dominant fluid base hue (hex, e.g. "#0284C7" or "#0F172A") */
  colorCore?: string;
  /** Iridescent highlight fringe tint (hex, e.g. "#38BDF8" or "#2DD4BF") */
  colorFringe?: string;
  /** Underlying background fill (hex or "transparent") */
  background?: string;
  /** Interactive mouse displacement ripples (default: true) */
  interactive?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Inline CSS styles */
  style?: React.CSSProperties;
}

const VS_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FS_SOURCE = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_colorCore;
uniform vec3 u_colorFringe;
uniform vec3 u_background;
uniform float u_hasBg;
uniform float u_speed;
uniform float u_scale;
uniform float u_intensity;
uniform float u_filmThickness;
uniform float u_interactive;

// Simplex-style pseudo noise and domain warping
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractional Brownian Motion for fluid surface turbulence
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.05;
    a *= 0.5;
  }
  return v;
}

// Thin-film interference cosine spectral palette
vec3 thinFilmColor(float t, vec3 core, vec3 fringe) {
  // Classic optical interference rainbow phase shifted by core and fringe tints
  vec3 phase = vec3(0.0, 0.33, 0.67);
  vec3 spectral = 0.5 + 0.5 * cos(6.28318 * (t + phase));
  
  // Blend with core ocean and fringe highlight tones
  vec3 tinted = mix(core, fringe, sin(t * 3.1415) * 0.5 + 0.5);
  return mix(tinted, spectral, 0.45);
}

void main() {
  vec2 aspect = vec2(max(1.0, u_resolution.x / u_resolution.y), 1.0);
  vec2 uv = (v_uv - 0.5) * aspect;
  float t = u_time * u_speed * 0.35;

  // Pointer ripple wave
  vec2 mouseNorm = (u_mouse / max(u_resolution, vec2(1.0)) - 0.5) * aspect;
  float distToMouse = distance(uv, mouseNorm);
  float ripple = 0.0;
  if (u_interactive > 0.5) {
    float waveDist = distToMouse * 14.0 - t * 4.0;
    ripple = sin(waveDist) * exp(-distToMouse * 3.2) * 0.08;
  }

  // Multi-tier domain warping simulating viscous liquid film sheen
  vec2 q = vec2(
    fbm(uv * u_scale + vec2(0.0, t * 0.2)),
    fbm(uv * u_scale + vec2(5.2, 1.3 - t * 0.15))
  );

  vec2 r = vec2(
    fbm(uv * u_scale + 4.0 * q + vec2(1.7, 9.2 + t * 0.3) + ripple),
    fbm(uv * u_scale + 4.0 * q + vec2(8.3, 2.8 - t * 0.25) + ripple)
  );

  float filmHeight = fbm(uv * u_scale + 4.0 * r);

  // Gradient slope / surface normal approximation for light reflection
  float delta = 0.015;
  float hX = fbm((uv + vec2(delta, 0.0)) * u_scale + 4.0 * r) - filmHeight;
  float hY = fbm((uv + vec2(0.0, delta)) * u_scale + 4.0 * r) - filmHeight;
  vec3 normal = normalize(vec3(-hX, -hY, delta * 3.5));

  // Virtual lighting
  vec3 lightDir = normalize(vec3(0.4, 0.6, 0.7));
  float diff = max(dot(normal, lightDir), 0.0);
  float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5);

  // Optical thickness variations
  float opticalThickness = (filmHeight * 1.8 + fresnel * 1.2) * u_filmThickness;
  vec3 iridescence = thinFilmColor(opticalThickness, u_colorCore, u_colorFringe);

  // Highlight specular sheen
  float spec = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 12.0);
  vec3 specularColor = vec3(0.9, 0.95, 1.0) * spec * 0.6;

  // Final composite
  vec3 finalColor = (iridescence * (0.6 + diff * 0.5) + specularColor) * u_intensity;
  float alpha = clamp((filmHeight * 0.75 + fresnel * 0.35 + spec * 0.3) * u_intensity, 0.0, 1.0);

  if (u_hasBg > 0.5) {
    vec3 mixed = mix(u_background, u_background + finalColor, alpha);
    fragColor = vec4(mixed, 1.0);
  } else {
    fragColor = vec4(finalColor, alpha);
  }
}
`;

function hexToRgb(hex: string): [number, number, number] {
  if (!hex || hex === "transparent") return [0, 0, 0];
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    return [
      parseInt(cleaned[0] + cleaned[0], 16) / 255,
      parseInt(cleaned[1] + cleaned[1], 16) / 255,
      parseInt(cleaned[2] + cleaned[2], 16) / 255,
    ];
  }
  if (cleaned.length === 6) {
    return [
      parseInt(cleaned.slice(0, 2), 16) / 255,
      parseInt(cleaned.slice(2, 4), 16) / 255,
      parseInt(cleaned.slice(4, 6), 16) / 255,
    ];
  }
  return [0, 0, 0];
}

export const LiquidFilm: React.FC<LiquidFilmProps> = ({
  speed = 0.8,
  scale = 2.4,
  intensity = 0.8,
  filmThickness = 1.2,
  colorCore = "#0284C7",
  colorFringe = "#38BDF8",
  background = "transparent",
  interactive = true,
  className = "",
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef<[number, number]>([-1000, -1000]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });

    if (!gl) return;

    // Compile Vertex Shader
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VS_SOURCE);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.warn("LiquidFilm VS compilation failed:", gl.getShaderInfoLog(vs));
      return;
    }

    // Compile Fragment Shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FS_SOURCE);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.warn("LiquidFilm FS compilation failed:", gl.getShaderInfoLog(fs));
      return;
    }

    // Link Program
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("LiquidFilm program linking failed:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Quad geometry covering NDC [-1, 1]
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uCore = gl.getUniformLocation(program, "u_colorCore");
    const uFringe = gl.getUniformLocation(program, "u_colorFringe");
    const uBg = gl.getUniformLocation(program, "u_background");
    const uHasBg = gl.getUniformLocation(program, "u_hasBg");
    const uSpd = gl.getUniformLocation(program, "u_speed");
    const uScl = gl.getUniformLocation(program, "u_scale");
    const uInt = gl.getUniformLocation(program, "u_intensity");
    const uThick = gl.getUniformLocation(program, "u_filmThickness");
    const uInter = gl.getUniformLocation(program, "u_interactive");

    const coreRgb = hexToRgb(colorCore);
    const fringeRgb = hexToRgb(colorFringe);
    const hasBg = background !== "transparent";
    const bgRgb = hexToRgb(background);

    gl.uniform3f(uCore, coreRgb[0], coreRgb[1], coreRgb[2]);
    gl.uniform3f(uFringe, fringeRgb[0], fringeRgb[1], fringeRgb[2]);
    gl.uniform3f(uBg, bgRgb[0], bgRgb[1], bgRgb[2]);
    gl.uniform1f(uHasBg, hasBg ? 1.0 : 0.0);
    gl.uniform1f(uSpd, speed);
    gl.uniform1f(uScl, scale);
    gl.uniform1f(uInt, intensity);
    gl.uniform1f(uThick, filmThickness);
    gl.uniform1f(uInter, interactive ? 1.0 : 0.0);

    // Resize handling with DPR clamp
    const handleResize = () => {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(container.clientWidth * dpr);
      const height = Math.floor(container.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(uRes, width, height);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // Mouse pointer listener
    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const x = (e.clientX - rect.left) * dpr;
      const y = (rect.height - (e.clientY - rect.top)) * dpr;
      mousePosRef.current = [x, y];
    };

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    // Animation Loop
    let startTime = performance.now();
    const render = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mousePosRef.current[0], mousePosRef.current[1]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      if (interactive) {
        window.removeEventListener("pointermove", handlePointerMove);
      }
      gl.deleteBuffer(posBuffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [
    speed,
    scale,
    intensity,
    filmThickness,
    colorCore,
    colorFringe,
    background,
    interactive,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: background === "transparent" ? undefined : background,
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none block"
      />
    </div>
  );
};

export default LiquidFilm;
