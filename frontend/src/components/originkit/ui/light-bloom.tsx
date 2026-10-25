"use client";

import React, { useEffect, useRef } from "react";

export interface LightBloomProps {
  edge?: "bottom" | "top" | "left" | "right";
  styleVariant?: "bloom" | "shafts" | "both";
  color?: string;
  secondaryColor?: string;
  background?: string;
  intensity?: number;
  spread?: number;
  speed?: number;
  grain?: number;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const VS_SRC = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FS_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_colorCore;
uniform vec3 u_colorRamp;
uniform vec3 u_background;
uniform float u_intensity;
uniform float u_spread;
uniform int u_style; // 0: bloom, 1: shafts, 2: both
uniform int u_edge;  // 0: bottom, 1: top, 2: left, 3: right
uniform float u_grain;

// Hash and noise functions for procedural light shafts
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
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

float fbmShafts(vec2 uv, float t) {
  float v = 0.0;
  // Two octaves of drifting vertical shaft noise
  v += noise(vec2(uv.x * 6.0 + t * 0.15, uv.y * 1.5)) * 0.65;
  v += noise(vec2(uv.x * 14.0 - t * 0.25, uv.y * 3.0)) * 0.35;
  return v;
}

void main() {
  vec2 uv = v_uv;

  // Remap coordinates based on chosen emission edge
  if (u_edge == 1) { // top
    uv.y = 1.0 - uv.y;
  } else if (u_edge == 2) { // left
    uv = vec2(uv.y, uv.x);
  } else if (u_edge == 3) { // right
    uv = vec2(uv.y, 1.0 - uv.x);
  }

  // Pointer smoothing along origin edge
  float originX = u_mouse.x;
  float distToLight = length(vec2((uv.x - originX) * (u_resolution.x / u_resolution.y), uv.y));

  // Normalized exponential falloff glow
  float spreadFactor = max(0.05, u_spread);
  float falloff = exp(-distToLight / spreadFactor);

  // Secondary soft ambient rise
  float verticalGlow = exp(-uv.y / (spreadFactor * 1.6));

  float totalGlow = mix(falloff, verticalGlow, 0.35) * u_intensity;

  // Drifting light shafts
  float shafts = 1.0;
  if (u_style == 1 || u_style == 2) {
    float shaftNoise = fbmShafts(uv, u_time);
    shaftNoise = pow(shaftNoise, 1.8) * 1.6;
    // Mask off near the very origin so it doesn't flicker on the base
    float mask = smoothstep(0.02, 0.15, uv.y);
    shafts = mix(1.0, shaftNoise, mask * 0.7);
  }

  if (u_style == 1) {
    totalGlow *= shafts;
  } else if (u_style == 2) {
    totalGlow = totalGlow * 0.7 + (totalGlow * shafts) * 0.5;
  }

  // Two-stop color ramp: core light blend -> secondary ramp -> background
  vec3 rampColor = mix(u_colorRamp, u_colorCore, clamp(totalGlow, 0.0, 1.0));
  vec3 finalColor = mix(u_background, rampColor, clamp(totalGlow, 0.0, 1.0));

  // Core overdrive highlight
  finalColor += u_colorCore * pow(clamp(totalGlow - 0.4, 0.0, 1.0), 2.5) * 0.7;

  // High quality anti-banding dither + film grain
  float dither = (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) * (1.5 / 255.0);
  float grainNoise = (hash(gl_FragCoord.xy * 0.5 + fract(u_time * 1.2)) - 0.5) * (u_grain * 0.06);

  finalColor += dither + grainNoise;

  fragColor = vec4(finalColor, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

export default function LightBloom({
  edge = "bottom",
  styleVariant = "both",
  color = "#4DA3FF",
  secondaryColor = "#0F4C81",
  background = "#071A2F",
  intensity = 75,
  spread = 55,
  speed = 45,
  grain = 15,
  interactive = true,
  className = "",
  style = {},
}: LightBloomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, targetX: 0.5 });
  const isReducedMotion = useRef(false);

  useEffect(() => {
    isReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    // Create shader program
    const createShader = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, VS_SRC));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FS_SRC));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad geometry
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uColorCore = gl.getUniformLocation(program, "u_colorCore");
    const uColorRamp = gl.getUniformLocation(program, "u_colorRamp");
    const uBackground = gl.getUniformLocation(program, "u_background");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uSpread = gl.getUniformLocation(program, "u_spread");
    const uStyle = gl.getUniformLocation(program, "u_style");
    const uEdge = gl.getUniformLocation(program, "u_edge");
    const uGrain = gl.getUniformLocation(program, "u_grain");

    let animId = 0;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const edgeMap = { bottom: 0, top: 1, left: 2, right: 3 };
    const styleMap = { bloom: 0, shafts: 1, both: 2 };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      mouseRef.current.targetX = Math.max(0, Math.min(1, normX));
    };

    window.addEventListener("pointermove", onPointerMove);

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      if (!isReducedMotion.current) {
        accumulatedTime = (accumulatedTime + dt * (speed / 35)) % 3600;
      }

      // Smooth pointer slide with exponential dampening
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * (dt * 6.0);

      const coreRGB = hexToRgb(color);
      const rampRGB = hexToRgb(secondaryColor);
      const bgRGB = hexToRgb(background);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, accumulatedTime);
      gl.uniform2f(uMouse, mouseRef.current.x, 0.0);
      gl.uniform3f(uColorCore, coreRGB[0], coreRGB[1], coreRGB[2]);
      gl.uniform3f(uColorRamp, rampRGB[0], rampRGB[1], rampRGB[2]);
      gl.uniform3f(uBackground, bgRGB[0], bgRGB[1], bgRGB[2]);
      gl.uniform1f(uIntensity, intensity / 50.0);
      gl.uniform1f(uSpread, spread / 100.0);
      gl.uniform1i(uStyle, styleMap[styleVariant] ?? 2);
      gl.uniform1i(uEdge, edgeMap[edge] ?? 0);
      gl.uniform1f(uGrain, grain / 100.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(vbo);
      gl.deleteProgram(program);
    };
  }, [edge, styleVariant, color, secondaryColor, background, intensity, spread, speed, grain, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        minWidth: 0,
        minHeight: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
