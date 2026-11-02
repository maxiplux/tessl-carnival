import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const KICKS = 5;
export const GOAL = { left: 220, right: 580, top: 90, bottom: 210 } as const;
export const SPOT = { x: WIDTH / 2, y: HEIGHT - 80 } as const;
/** Seconds the ball takes to reach the goal line. */
export const FLIGHT_TIME = 0.5;
export const KEEPER_SPEED = 240;
/** How far from the keeper's middle, in pixels, the keeper can reach the ball. */
export const KEEPER_REACH = 45;
/** The outer part of the goal, on each side, that counts as a corner. */
export const CORNER_WIDTH = 80;

export interface Ball {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  /** Seconds since the kick. */
  age: number;
}

export type KickResult = 'goal' | 'saved' | 'missed';

export interface WorldCupState {
  /** The middle of the keeper, on the goal line. */
  keeperX: number;
  /** Pixels per second; negative moves left. */
  keeperSpeed: number;
  ball: Ball | null;
  kicks: number;
  goals: number;
  score: number;
  lastResult: KickResult | null;
  phase: 'playing' | 'over';
}

export function createState(): WorldCupState {
  return {
    keeperX: WIDTH / 2,
    keeperSpeed: KEEPER_SPEED,
    ball: null,
    kicks: 0,
    goals: 0,
    score: 0,
    lastResult: null,
    phase: 'playing',
  };
}

/** A goal in a corner scores 20 points; anywhere else in the goal scores 10. */
export function scoreForGoal(x: number): number {
  const inCorner = x < GOAL.left + CORNER_WIDTH || x > GOAL.right - CORNER_WIDTH;
  return inCorner ? 20 : 10;
}

/** Where a ball that reaches `x`, `y` on the goal line ends up. */
export function resultFor(x: number, y: number, keeperX: number): KickResult {
  if (x < GOAL.left || x > GOAL.right || y < GOAL.top || y > GOAL.bottom) return 'missed';
  if (Math.abs(x - keeperX) <= KEEPER_REACH) return 'saved';
  return 'goal';
}

/** Kicks the ball towards the aim point. Returns false if nothing was kicked. */
export function kick(state: WorldCupState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.ball || state.kicks === KICKS) return false;
  state.ball = { x: SPOT.x, y: SPOT.y, targetX: aimX, targetY: Math.min(aimY, SPOT.y), age: 0 };
  state.kicks += 1;
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: WorldCupState, dt: number): void {
  state.keeperX += state.keeperSpeed * dt;
  const minX = GOAL.left + KEEPER_REACH / 2;
  const maxX = GOAL.right - KEEPER_REACH / 2;
  if (state.keeperX < minX) {
    state.keeperX = minX;
    state.keeperSpeed = Math.abs(state.keeperSpeed);
  } else if (state.keeperX > maxX) {
    state.keeperX = maxX;
    state.keeperSpeed = -Math.abs(state.keeperSpeed);
  }

  const ball = state.ball;
  if (ball) {
    ball.age += dt;
    const t = Math.min(ball.age / FLIGHT_TIME, 1);
    ball.x = SPOT.x + (ball.targetX - SPOT.x) * t;
    ball.y = SPOT.y + (ball.targetY - SPOT.y) * t;
    if (t === 1) {
      const result = resultFor(ball.targetX, ball.targetY, state.keeperX);
      if (result === 'goal') {
        state.goals += 1;
        state.score += scoreForGoal(ball.targetX);
      }
      state.lastResult = result;
      state.ball = null;
    }
  }

  if (state.kicks === KICKS && !state.ball) state.phase = 'over';
}

const RESULT_TEXT: Record<KickResult, string> = {
  goal: 'GOOOL!',
  saved: 'Saved!',
  missed: 'Wide!',
};

function draw(ctx: CanvasRenderingContext2D, state: WorldCupState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Pitch, with mown stripes.
  const band = (HEIGHT - GOAL.bottom) / 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors.stripeA;
    ctx.globalAlpha = i % 2 === 0 ? 1 : 0.85;
    ctx.fillRect(0, GOAL.bottom + i * band, WIDTH, band);
  }
  ctx.globalAlpha = 1;

  // Penalty box, spot and goal frame.
  ctx.strokeStyle = colors.stripeB;
  ctx.lineWidth = 3;
  ctx.strokeRect(GOAL.left - 100, GOAL.bottom, GOAL.right - GOAL.left + 200, 150);
  ctx.fillStyle = colors.stripeB;
  ctx.beginPath();
  ctx.arc(SPOT.x, SPOT.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  for (let x = GOAL.left; x <= GOAL.right; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, GOAL.top);
    ctx.lineTo(x, GOAL.bottom);
    ctx.stroke();
  }
  for (let y = GOAL.top; y <= GOAL.bottom; y += 20) {
    ctx.beginPath();
    ctx.moveTo(GOAL.left, y);
    ctx.lineTo(GOAL.right, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(GOAL.left, GOAL.bottom);
  ctx.lineTo(GOAL.left, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.bottom);
  ctx.stroke();

  // Keeper: arms out to their reach, body and head.
  const keeperTop = GOAL.bottom - 90;
  ctx.fillStyle = colors.accent;
  ctx.fillRect(state.keeperX - KEEPER_REACH, keeperTop + 22, KEEPER_REACH * 2, 10);
  ctx.fillRect(state.keeperX - 14, keeperTop + 16, 28, 50);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(state.keeperX - 12, keeperTop + 66, 10, 24);
  ctx.fillRect(state.keeperX + 2, keeperTop + 66, 10, 24);
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.arc(state.keeperX, keeperTop + 6, 11, 0, Math.PI * 2);
  ctx.fill();

  // Ball: it shrinks a little as it flies towards the goal.
  const ball = state.ball ?? { x: SPOT.x, y: SPOT.y, targetX: SPOT.x, targetY: SPOT.y, age: 0 };
  const radius = 12 - 5 * Math.min(ball.age / FLIGHT_TIME, 1);
  if (state.phase === 'playing') {
    ctx.fillStyle = colors.stripeB;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y - radius, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y - radius, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, 32);
  ctx.textAlign = 'right';
  ctx.fillText(`Kicks ${state.kicks}/${KICKS}`, WIDTH - 16, 32);

  if (state.lastResult && !state.ball && state.phase === 'playing') {
    ctx.textAlign = 'center';
    ctx.fillStyle = state.lastResult === 'goal' ? colors.accent : colors.danger;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(RESULT_TEXT[state.lastResult], WIDTH / 2, 60);
  }

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`${state.goals} of ${KICKS} in! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const worldCup: CarnivalGame = {
  id: 'world-cup',
  name: 'World Cup',
  description: 'Take five penalties past the keeper. Goals in the corners score double.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const onDown = (event: PointerEvent) => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      kick(
        state,
        ((event.clientX - rect.left) / rect.width) * WIDTH,
        ((event.clientY - rect.top) / rect.height) * HEIGHT,
      );
    };
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(worldCup.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default worldCup;
