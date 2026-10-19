import { describe, it, expect } from "vitest";

// Pure functions extracted from offline mini-game logic
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  return Math.hypot(x1 - x2, y1 - y2) < r1 + r2;
}

export function calculateScore(currentScore: number, itemType: "plankton" | "bubble"): number {
  return currentScore + (itemType === "plankton" ? 10 : 25);
}

export function calculateDifficultyLevel(score: number): number {
  return Math.floor(score / 100) + 1;
}

export function updateHighScore(currentScore: number, currentHigh: number): number {
  return Math.max(currentScore, currentHigh);
}

describe("Offline Underwater Mini-Game Pure Logic", () => {
  it("detects circle collisions accurately when objects overlap", () => {
    // Fish at (50, 50, r=12), Hazard at (60, 50, r=10) -> distance = 10, sum r = 22 -> Collision
    expect(checkCircleCollision(50, 50, 12, 60, 50, 10)).toBe(true);

    // Distant objects: (50, 50, r=12) and (100, 100, r=10) -> distance = ~70.7 > 22 -> No collision
    expect(checkCircleCollision(50, 50, 12, 100, 100, 10)).toBe(false);
  });

  it("calculates score increments for plankton and bubble collectibles", () => {
    expect(calculateScore(0, "plankton")).toBe(10);
    expect(calculateScore(10, "bubble")).toBe(35);
  });

  it("scales difficulty level proportionally to score milestones", () => {
    expect(calculateDifficultyLevel(0)).toBe(1);
    expect(calculateDifficultyLevel(90)).toBe(1);
    expect(calculateDifficultyLevel(100)).toBe(2);
    expect(calculateDifficultyLevel(250)).toBe(3);
    expect(calculateDifficultyLevel(500)).toBe(6);
  });

  it("updates high score when current score exceeds previous high score", () => {
    expect(updateHighScore(150, 100)).toBe(150);
    expect(updateHighScore(80, 100)).toBe(100);
  });
});
