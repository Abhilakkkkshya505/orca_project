"use client";

import React, { useEffect, useRef } from "react";

export interface LightfallProps {
  /** Speed of the falling light streams (default: 30) */
  speed?: number;
  /** Density / count of streams (default: 40) */
  density?: number;
  /** Primary ray streak color (e.g., "#0284C7" or "#38BDF8") */
  color?: string;
  /** Secondary highlight streak color (e.g., "#0D9488" or "#7DD3FC") */
  secondaryColor?: string;
  /** Background fill (default: "transparent") */
  background?: string;
  /** Light ray intensity multiplier (default: 1.0) */
  intensity?: number;
  /** Light stream length / warp factor (default: 1.0) */
  warp?: number;
  /** Interactive mouse repulsion / bending (default: true) */
  interactive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom CSS properties */
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
uniform vec3 u_colorPrimary;
uniform vec3 u_colorSecondary;
uniform vec3 u_background;
uniform float u_hasBg;
uniform float u_intensity;
uniform float u_warp;
uniform float u_density;

// Pseudo-random hash
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 2D Noise
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

void main() {
  vec2 uv = v_uv;
  vec2 mouseNorm = u_mouse / max(u_resolution, vec2(1.0));

  // Pointer distance and bending effect
  float distToMouse = distance(uv, mouseNorm);
  vec2 mouseDir = uv - mouseNorm;
  
  // Interactive stream deflection
  float bend = smoothstep(0.4, 0.0, distToMouse) * 0.15;
  uv.x += mouseDir.x * bend;

  // Vertical lightfall streams
  float t = u_time * 0.8;
  float streams = 0.0;
  
  // Multiple stratified layers of falling light rays
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float colScale = u_density * (0.8 + fi * 0.4);
    float colIndex = floor(uv.x * colScale);
    float colSeed = hash(vec2(colIndex, fi * 17.13));

    // Individual stream drop speed and stagger
    float streamSpeed = 1.0 + colSeed * 1.5;
    float streamOffset = colSeed * 6.28;
    float yPos = uv.y * 1.2 + t * streamSpeed + streamOffset;

    // Glowing comet / light shaft streak calculation
    float streakY = fract(yPos);
    float streakHead = pow(smoothstep(0.0, 0.25, streakY), 2.0);
    float streakTail = exp(-streakY * 4.0 * (1.0 / max(u_warp, 0.2)));
    float streakIntensity = streakHead * streakTail;

    // Horizontal ray width & softness
    float colCenter = (colIndex + 0.5) / colScale;
    float distFromCenter = abs(uv.x - colCenter);
    float rayWidth = (0.015 + colSeed * 0.02) * (1.0 + bend * 2.0);
    float beam = smoothstep(rayWidth, 0.0, distFromCenter);

    // Layer contribution
    float layerWeight = (i == 0) ? 0.6 : (i == 1 ? 0.3 : 0.15);
    streams += beam * streakIntensity * (0.4 + colSeed * 0.6) * layerWeight;
  }

  // Subtle ambient light shimmer in the background
  float shimmer = noise(vec2(uv.x * 4.0, uv.y * 2.0 - t * 0.3)) * 0.15;
  streams += shimmer * 0.25;

  // Color blending
  vec3 rayColor = mix(u_colorPrimary, u_colorSecondary, sin(uv.y * 3.0 + t) * 0.5 + 0.5);
  vec3 finalRgb = rayColor * streams * u_intensity * 2.2;

  // Background and alpha compositing
  float alpha = clamp(streams * u_intensity * 1.4, 0.0, 1.0);

  if (u_hasBg > 0.5) {
    vec3 comp = mix(u_background, u_background + finalRgb, alpha);
    fragColor = vec4(comp, 1.0);
  } else {
    fragColor = vec4(finalRgb, alpha);
  }
}
`;

function hexToRgb(hex: string): [number, number, number] {
  if (!hex || hex === "transparent") return [0, 0, 0];
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    const g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    const b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
    return [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;
    return [r, g, b];
  }
  return [0.1, 0.5, 0.9];
}

export const Lightfall: React.FC<LightfallProps> = ({
  speed = 30,
  density = 35,
  color = "#38BDF8",
  secondaryColor = "#7DD3FC",
  background = "transparent",
  intensity = 1.0,
  warp = 1.0,
  interactive = true,
  className = "",
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });

    if (!gl) return;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    gl.shaderSource(vs, VS_SOURCE);
    gl.compileShader(vs);

    gl.shaderSource(fs, FS_SOURCE);
    gl.compileShader(fs);

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);

    // Quad geometry
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uColorPrimary = gl.getUniformLocation(program, "u_colorPrimary");
    const uColorSecondary = gl.getUniformLocation(program, "u_colorSecondary");
    const uBg = gl.getUniformLocation(program, "u_background");
    const uHasBg = gl.getUniformLocation(program, "u_hasBg");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uWarp = gl.getUniformLocation(program, "u_warp");
    const uDensity = gl.getUniformLocation(program, "u_density");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 300;
      const h = canvas.clientHeight || 200;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    const render = () => {
      resize();
      const elapsed = (performance.now() - startTime) * 0.001 * (speed / 30);

      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(
        uMouse,
        mousePos.current.x * canvas.width,
        (1.0 - mousePos.current.y) * canvas.height,
      );

      const [r1, g1, b1] = hexToRgb(color);
      gl.uniform3f(uColorPrimary, r1, g1, b1);

      const [r2, g2, b2] = hexToRgb(secondaryColor);
      gl.uniform3f(uColorSecondary, r2, g2, b2);

      const hasBg = background && background !== "transparent";
      gl.uniform1f(uHasBg, hasBg ? 1.0 : 0.0);
      if (hasBg) {
        const [rb, gb, bb] = hexToRgb(background);
        gl.uniform3f(uBg, rb, gb, bb);
      } else {
        gl.uniform3f(uBg, 0, 0, 0);
      }

      gl.uniform1f(uIntensity, intensity);
      gl.uniform1f(uWarp, warp);
      gl.uniform1f(uDensity, density);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (interactive) window.removeEventListener("pointermove", handlePointerMove);
      gl.deleteBuffer(vbo);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [speed, density, color, secondaryColor, background, intensity, warp, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none ${className}`}
      style={{
        display: "block",
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default Lightfall;
