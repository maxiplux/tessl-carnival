import { describe, expect, it } from 'vitest';
import {
  FLIGHT_TIME,
  GOAL,
  KEEPER_REACH,
  KICKS,
  createState,
  kick,
  resultFor,
  scoreForGoal,
  step,
  type WorldCupState,
} from './game';

/** Kicks at `x`, `y` with the keeper parked at `keeperX`, and lets the ball land. */
function shootAt(state: WorldCupState, x: number, y: number, keeperX: number) {
  kick(state, x, y);
  state.keeperSpeed = 0;
  state.keeperX = keeperX;
  step(state, FLIGHT_TIME);
}

describe('world cup', () => {
  it('starts with every kick left and no score', () => {
    const state = createState();
    expect(state.kicks).toBe(0);
    expect(state.goals).toBe(0);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('uses one kick per shot', () => {
    const state = createState();
    expect(kick(state, 400, 150)).toBe(true);
    expect(state.kicks).toBe(1);
    expect(state.ball).not.toBeNull();
  });

  it('cannot kick again while the ball is in the air', () => {
    const state = createState();
    kick(state, 400, 150);
    expect(kick(state, 400, 150)).toBe(false);
    expect(state.kicks).toBe(1);
  });

  it('scores 10 in the middle of the goal and 20 in a corner', () => {
    expect(scoreForGoal(400)).toBe(10);
    expect(scoreForGoal(GOAL.left + 10)).toBe(20);
    expect(scoreForGoal(GOAL.right - 10)).toBe(20);
  });

  it('calls a ball outside the frame a miss', () => {
    expect(resultFor(GOAL.left - 1, 150, 400)).toBe('missed');
    expect(resultFor(400, GOAL.top - 1, 400)).toBe('missed');
  });

  it('lets the keeper save a ball within reach', () => {
    expect(resultFor(400 + KEEPER_REACH, 150, 400)).toBe('saved');
    expect(resultFor(400 + KEEPER_REACH + 1, 150, 400)).toBe('goal');
  });

  it('adds the points when the ball goes in', () => {
    const state = createState();
    shootAt(state, GOAL.left + 10, 150, GOAL.right - 30);
    expect(state.ball).toBeNull();
    expect(state.lastResult).toBe('goal');
    expect(state.goals).toBe(1);
    expect(state.score).toBe(20);
  });

  it('adds nothing for a save', () => {
    const state = createState();
    shootAt(state, 400, 150, 400);
    expect(state.lastResult).toBe('saved');
    expect(state.score).toBe(0);
  });

  it('keeps the keeper between the posts', () => {
    const state = createState();
    for (let i = 0; i < 200; i++) {
      step(state, 0.05);
      expect(state.keeperX).toBeGreaterThanOrEqual(GOAL.left);
      expect(state.keeperX).toBeLessThanOrEqual(GOAL.right);
    }
  });

  it('ends once the last kick has landed', () => {
    const state = createState();
    for (let i = 0; i < KICKS - 1; i++) shootAt(state, 400, 150, 400);
    kick(state, 400, 150);
    step(state, FLIGHT_TIME / 2);
    expect(state.phase).toBe('playing');
    step(state, FLIGHT_TIME);
    expect(state.phase).toBe('over');
    expect(kick(state, 400, 150)).toBe(false);
  });
});
