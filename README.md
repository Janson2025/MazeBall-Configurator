# MazeBall Configurator

Play the 3D maze with the arrow keys, WASD, or the on-screen joystick. Use Twist maze to turn the board in the plane of the screen. The timer starts when the maze first moves, and your best race score for each maze is saved in the current browser. The Customize mode changes the maze pattern, color, and glass tint. All model and texture assets are served locally.

```sh
npm ci
npm run dev
```

Run `npm run lint` and `npm run build` to check the project. Serve the built `dist` directory with `npm run preview` to check the production build and its Content Security Policy locally. The existing `npm run deploy` command builds and publishes `dist` to GitHub Pages.

## Development plan

1. **Scored race.** Verify collision with the real rendered wall geometry, add screen-axis twist and wall sliding, and award 4,000 finish points plus 180 per pickup. Deduct a time penalty of 12 points per second plus 0.4 times seconds squared, rounded down. Keep personal bests per maze seed so different layouts do not share a record.
2. **Procedural levels.** Play starts on a 3 × 3 grid per face with a short route, then grows through 5, 7, 9, and 11 cells per side to a 13 × 13 cap. The sphere grows from 9 × 9 onward to keep passages wide enough for the player marble. The generator shares edges across six projected cube faces, carves seeded passages, and extrudes walls radially. The imported model remains in Customize.
3. **Terrain.** The first two tiers have clear floors. Mud arrives at 7 × 7 and halves rolling speed. Lava arrives at 9 × 9, cools for 3.5 seconds, then heats for 2.5 seconds per cycle. Active lava restarts the race. Gold arrives with patrols at 11 × 11 and gives six seconds of protection against them. Terrain avoids the start, finish, and pickup cells.
4. **Stealth and hazards.** Add more loops for alternate routes. Red marbles patrol until the player enters their visible cone. Walls and the sphere's curvature block sight. A fresh sighting briefly boosts the spotter and calls other patrols toward it until sight is lost. Enemy contact and active lava restart the run. A gold tile temporarily lets the blue player defeat a red marble.
5. **Themes and Customize.** Give each tier a themed palette and textures for three surfaces: the floor, wall sides, and wall tops. Preview any generated tier and set separate texture overrides in Customize. Play and Customize use the same materials, and the original model stays available in its own preview. Use the development panel in `npm run dev` to tune hazards and enemies in practice.
6. **Later difficulty.** Try ice, optional timed gates, and electric tiles once players can reliably read the existing hazards.
7. **Survival prototype.** Reuse the generator and controls. Start with a short countdown, grant time per collected marble, and place later batches in reachable cells. Verify that each batch is reachable before the countdown expires and keep survival records separate from race scores.

The grid follows the equiangular approach described by [Ronchi, Iacono, and Paolucci](https://sites.google.com/site/pierstanislaopaolucci/cubed-sphere-grid). The maze carving follows [Jamis Buck’s randomized depth-first backtracker](https://weblog.jamisbuck.org/2010/12/27/maze-generation-recursive-backtracking).

Run `node --test` to verify that the marble can follow generated routes across cube-face seams and reach the antipodal finish, and to check scoring.
