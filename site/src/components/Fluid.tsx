'use client';

import { useEffect, useRef } from 'react';

// The hero cards' background: soft bands of navy, deep blue, indigo and dark purple flowing into each other,
// like slow rivers on near-black. One small fragment shader, no libraries.
// Kept cheap on purpose, so an old laptop stays cool:
//   it draws at a fraction of the screen's resolution (the bands are soft, so nobody can tell),
//   at about 30 frames a second, and only while the card is on screen and the tab is visible.
// With reduced motion, or `still`, it draws one frame and stops. Without WebGL, the CSS gradient under it stays.

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y * 1.5;
  float t = u_time * 0.05;

  // Bend the plane with a few sine waves of falling strength: this is what makes the bands snake.
  for (int i = 1; i < 4; i++) {
    float f = float(i);
    p.x += 0.6 / f * sin(f * 1.4 * p.y + t + 0.9 * f);
    p.y += 0.45 / f * cos(f * 1.2 * p.x - t * 0.8 + 1.7 * f);
  }

  // Three ribbons crossing at different angles and speeds. Each one is a soft-edged band.
  float a = sin(p.x * 1.5 + p.y * 0.45 + t * 0.7);
  float b = sin(p.y * 2.1 - p.x * 0.6 - t * 0.5 + 1.3);
  float c = sin((p.x + p.y) * 1.7 + t * 0.4 + 2.6);
  float r1 = smoothstep(-0.2, 0.9, a);
  float r2 = smoothstep(0.1, 0.95, b);
  float r3 = smoothstep(0.35, 1.0, c);

  vec3 col    = vec3(0.010, 0.012, 0.028); // near-black
  vec3 navy   = vec3(0.030, 0.060, 0.170);
  vec3 blue   = vec3(0.055, 0.130, 0.420);
  vec3 indigo = vec3(0.170, 0.150, 0.560);
  vec3 purple = vec3(0.250, 0.080, 0.390);
  col = mix(col, navy, r1);
  col = mix(col, blue, r1 * r1 * 0.85);
  col = mix(col, indigo, r2 * 0.7);
  col = mix(col, purple, r3 * 0.75);
  // A faint lit edge along each ribbon, like light catching a fold.
  col += indigo * 0.22 * exp(-abs(b - 0.15) * 9.0) + blue * 0.18 * exp(-abs(a + 0.1) * 9.0);

  // Darken towards the lower left, where the text sits, and towards the edges.
  float scrim = smoothstep(1.2, 0.0, length(uv * vec2(1.0, 1.5)));
  col *= 1.0 - 0.5 * scrim;
  col *= 1.0 - 0.4 * smoothstep(0.5, 1.1, length(uv - 0.5) * 1.4);

  // A little noise stops the gradients banding.
  col += (hash(gl_FragCoord.xy) - 0.5) / 160.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function Fluid({ still = false, time = 0, className = '' }: { still?: boolean; time?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const gl = c.getContext('webgl', { antialias: false, depth: false, stencil: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return; // The CSS gradient under the canvas stays.

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const moving = () => !still && !reduced.matches;
    // Under half of the screen's pixels, with the pixel ratio capped at 1.5, and never more than 900 pixels wide.
    // The bands are soft, so the browser's smoothing hides it, and a weak GPU has little to do.
    const resize = () => {
      const { width, height } = c.getBoundingClientRect();
      const scale = Math.min(Math.min(window.devicePixelRatio || 1, 1.5) * 0.4, 900 / Math.max(width, 1));
      c.width = Math.max(1, Math.round(width * scale));
      c.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, c.width, c.height);
      gl.uniform2f(uRes, c.width, c.height);
    };

    let raf = 0;
    let last = 0;
    let elapsed = time;
    let onScreen = true;
    const draw = () => {
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      c.dataset.ready = '';
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // about 30 frames a second is plenty for something this slow
      if (last) elapsed += Math.min(now - last, 100) / 1000;
      last = now;
      draw();
    };
    const start = () => {
      if (raf || !moving() || !onScreen || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    draw();
    start();

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) start(); else stop();
    });
    io.observe(c);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    const onMotion = () => (moving() ? start() : stop());
    reduced.addEventListener('change', onMotion);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', onMotion);
    };
  }, [still, time]);

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden fluid-fallback ${className}`}>
      <canvas ref={canvas} className="absolute inset-0 size-full opacity-0 transition-opacity duration-700 data-ready:opacity-100" />
    </div>
  );
}
