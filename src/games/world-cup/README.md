# World Cup

Take five penalties past a goalkeeper who never stops moving.

## How to play

- Click inside the goal to kick the ball at that spot.
- The keeper runs from post to post. If the ball arrives within the keeper's
  reach, it's saved. If you aim outside the goal frame, it goes wide.
- You have 5 kicks. The game ends when the last kick lands.
- Click again on the game over screen to play another round.

## Scoring

| Where the ball goes in              | Points |
| ----------------------------------- | ------ |
| A corner: the outer 80 px each side | 20     |
| Anywhere else in the goal           | 10     |
| Saved or wide                       | 0      |

Your final score is saved to the carnival's score board when the game ends.

## Files

- `game.ts`: the game logic (`createState`, `kick`, `step`, `resultFor`,
  `scoreForGoal`) and the `worldCup` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
