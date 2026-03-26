# Retro Space Shooter Game

## Goal

Make a retro game inspired by the iconic 1980s game Elite. The game is a space shooter.
The player has a cockpit view from a spaceship with a radar view and energy.
The arrow keys control motion: left and right for roll, up and down for pitch. Space to fire.
No speed controls; the player always moves at a constant speed.
The player is in a dogfight with another ship controlled by the computer.
The objective is to defeat the computer.
Create the game phase by phase as instructed.

## Technology

All Typescript, Vite, all in browser. Use three.js and any other packages that are popular and useful.
For Graphics, have a modernized version of Elite: use filled in 3d shapes with modern 3d graphics, not the original wire-frame style from the 80s.
Full color, filled in polygon style graphics, but with good detail on the shapes.

## Phases

Phase 1: Setup. Create the Vite project. Add dependencies. Create the default view. Add a .gitignore with the right start for this project.
Create a test harness so that you can run the game, take screenshots and examine them, apply key commands to try the game.
It's crucial that you invest time in a powerful test harness that allows you to fully play the game, view the graphics, experience and test the gameplay.
Use Playwright, and have it so that you can automatically play through games, screenshot, investigate as you build this.

Phase 2: Solo flight.
Write the game so that the user can navigate around space. Stars show to give a sense of the motion.
The stars spin when the user rolls, and moves as the user pitches, and are constantly moving, as with the original elite.
Test carefully.

Phase 3: Computer player.
Add the computer to the Arena. No battle yet; just have the computer be able to fly, have it show on the radar.
Ensure that the radar shows the position and vertical separation with the enemy, in a nod to the original elite.
Have the computer follow a reasonable path.
The computer spaceship can show in a simplified way.

Phase 4: Shooting.
Allow the human and computer to shoot at each other. Record energy, record kills.

Phase 5: Improvements.
Improve the graphics of the cockpit so it looks great - a nod to the retro past, but a modernized version.
Improve the graphics of the enemy ship so it looks amazing - scary, exciting.
Improve the graphics of the shooting experience.
Imporve the graphics of the dashboard so it looks exciting.
After a kill, players respawn and add a kill count.
When the computer is killed, the new computer is slightly more skilled. When the human is killed, the computer is less skilled.

Phase 6: Iterate
Play 5 games, using your test harness to inspect what is happening. Improve the graphics and the gameplay.
Ensure after respawning that players are separated.

Phase 7: Final touches
Play another 3 games with your test harness. Final tweaks to make this ready to go.
Touch up the detail of the ship, enemy space and cockpit to make it look detailed and exciting.
Ensure the game mechanics are good; it's possible to steer the ship around to kill the enemy.