import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, RotateCcw } from "lucide-react";

export const GamePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem("orca_game_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    } catch {}
  }, []);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let localScore = 0;

    // Game state
    const player = {
      x: 60,
      y: canvas.height / 2,
      size: 16,
      targetY: canvas.height / 2,
      speed: 4,
    };

    interface Hazard {
      x: number;
      y: number;
      radius: number;
      speed: number;
      type: "net" | "squall" | "kelp";
    }

    const hazards: Hazard[] = [];
    let spawnTimer = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      player.targetY = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        player.targetY = e.touches[0].clientY - rect.top;
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Water background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#0369a1");
      grad.addColorStop(1, "#082f49");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Smooth player movement
      player.y += (player.targetY - player.y) * 0.1;
      player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

      // Draw Player Fish
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, player.size * 1.4, player.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail fin
      ctx.beginPath();
      ctx.moveTo(player.x - player.size, player.y);
      ctx.lineTo(player.x - player.size * 1.8, player.y - player.size * 0.8);
      ctx.lineTo(player.x - player.size * 1.8, player.y + player.size * 0.8);
      ctx.closePath();
      ctx.fillStyle = "#0284c7";
      ctx.fill();

      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(player.x + player.size * 0.6, player.y - player.size * 0.2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#082f49";
      ctx.beginPath();
      ctx.arc(player.x + player.size * 0.7, player.y - player.size * 0.2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Spawning hazards & kelp
      spawnTimer++;
      if (spawnTimer % 45 === 0) {
        const isBeneficial = Math.random() > 0.6;
        hazards.push({
          x: canvas.width + 20,
          y: Math.random() * (canvas.height - 40) + 20,
          radius: isBeneficial ? 10 : 14,
          speed: 3 + Math.random() * 2.5,
          type: isBeneficial ? "kelp" : Math.random() > 0.5 ? "net" : "squall",
        });
      }

      // Update & draw hazards
      for (let i = hazards.length - 1; i >= 0; i--) {
        const h = hazards[i];
        h.x -= h.speed;

        if (h.type === "kelp") {
          // Plankton/kelp: bonus points
          ctx.fillStyle = "#34d399";
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === "net") {
          // Ghost net: dangerous obstacle
          ctx.strokeStyle = "#f87171";
          ctx.lineWidth = 2;
          ctx.strokeRect(h.x - h.radius, h.y - h.radius, h.radius * 2, h.radius * 2);
          ctx.beginPath();
          ctx.moveTo(h.x - h.radius, h.y - h.radius);
          ctx.lineTo(h.x + h.radius, h.y + h.radius);
          ctx.stroke();
        } else {
          // Storm squall: dangerous whirlpool
          ctx.fillStyle = "#94a3b8";
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Collision detection
        const dx = player.x - h.x;
        const dy = player.y - h.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.size + h.radius) {
          if (h.type === "kelp") {
            localScore += 50;
            setScore(localScore);
            hazards.splice(i, 1);
            continue;
          } else {
            // Collision with hazard -> Game Over
            setGameOver(true);
            setGameStarted(false);
            if (localScore > highScore) {
              setHighScore(localScore);
              try {
                localStorage.setItem("orca_game_highscore", String(localScore));
              } catch {}
            }
            return;
          }
        }

        // Remove offscreen
        if (h.x < -30) {
          hazards.splice(i, 1);
          localScore += 5;
          setScore(localScore);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gameStarted, gameOver, highScore]);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-base hover:opacity-90">
            <Anchor className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ORCA</span>
          </Link>
          <span className="text-xs text-ink-muted">/ Marine Low-Bandwidth Arcade</span>
        </div>
        <Link to="/" className="text-xs text-primary hover:underline font-medium">
          &larr; Return to Base
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col items-center gap-6 text-center">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            Offline PWA Entertainment
          </span>
          <h1 className="text-3xl font-bold tracking-tight">SDG 14 Ocean Navigator</h1>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Navigate the coastal fish through safe nutrient channels. Avoid ghost fishing nets and storm squalls!
          </p>
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-8 text-sm font-mono bg-surface px-6 py-2.5 rounded-lg border border-border shadow-sm">
          <div>
            <span className="text-ink-muted text-xs block">Current Depth Score</span>
            <span className="text-xl font-bold text-primary">{score}</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-ink-muted text-xs block">Harbour Record</span>
            <span className="text-xl font-bold text-ink">{highScore}</span>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-card bg-[#082f49] w-full max-w-[640px] aspect-[16/9]">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full block cursor-none touch-none"
          />

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white space-y-4">
              <h2 className="text-2xl font-bold">Ready to Dive?</h2>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                Move your mouse or finger up and down to swim. Collect green nutrient plankton (+50) and avoid red ghost nets!
              </p>
              <Button onClick={startGame} size="lg" variant="primary">
                Start Swimming
              </Button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white space-y-4 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-rose-400">Tangled in Ghost Net!</h2>
              <p className="text-sm font-mono">Final Score: {score} meters</p>
              <div className="flex gap-3">
                <Button onClick={startGame} size="md" variant="primary" className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Dive Again
                </Button>
                <Link to="/explore">
                  <Button size="md" variant="secondary">
                    Back to Chart
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Educational Note */}
        <div className="p-4 rounded-lg bg-surface border border-border text-xs text-ink-muted max-w-lg text-left space-y-1">
          <p className="font-semibold text-ink">Marine Conservation Fact (SDG 14.1):</p>
          <p>
            Abandoned, lost or discarded fishing gear (ghost gear) makes up an estimated 10% of all marine litter by volume, trapping millions of marine animals annually.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6 text-xs text-ink-muted text-center">
        <p>© 2026 Project ORCA • Marine Ecosystem Reasoning for SDG 14</p>
      </footer>
    </div>
  );
};
