/*
game.js for Perlenspiel 3.3.xd
Last revision: 2021-04-08 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-21 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.
*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Add code to the event handlers required by your project.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT delete this directive!


var GRID_HEIGHT = 15;
var GRID_WIDTH = 15;

var player;
var player_spears = [];
var mark_delete_spear = [];
var player_direction = 1;
var player_shoot = false;
var spear_time = 0;
var MAX_SPEAR_TIME = 5;

var UP_GLYPH = "⮝";
var RIGHT_GLYPH = "⮞";
var DOWN_GLYPH = "⮟";
var LEFT_GLYPH = "⮜";

var TICK_RATE = 1;

var isCutscene = true;

var DEFAULT_SPEAR_SPEED = 3;
var DEFAULT_SPEAR_RATE = 25;
var POWERED_SPEAR_RATE = 12;
var DEFAULT_ENEMY_SPEED = 50;
var DEFAULT_ENEMY_RATE = 70;

var spearSpeed = {cooldown: 0, max: DEFAULT_SPEAR_SPEED};
var spearRate = {cooldown: 0, max: DEFAULT_SPEAR_RATE};
var enemySpeed = {cooldown: 0, max: DEFAULT_ENEMY_SPEED};
var enemyRate = {cooldown: 0, max: DEFAULT_ENEMY_RATE};

var POWER_PIERCE = {color: 0xeeeeee, glyph: "↛", id: 1, duration: 600, timer: 0, active: false, slot: {x: 0, y: GRID_HEIGHT}, sound: "fx_powerup1", quotes: ["Pierce through the legions of foes."]};
var POWER_RAPID  = {color: 0xdddddd, glyph: "✥", id: 2, duration: 240, timer: 0, active: false, slot: {x: 1, y: GRID_HEIGHT}, sound: "fx_powerup4", quotes: ["Attack your foe with fury and haste."]};
var POWERUPS = [0, POWER_PIERCE, POWER_RAPID];

var POWERUP_CHANCE = 20;

var enemyCap = 6;
var enemies = [];
var mark_delete_enemy = [];

var ROUND_ONE =   {enemyCount: 10, enemyRate: DEFAULT_ENEMY_RATE + 5, enemyCap: 5, enemySpeed: DEFAULT_ENEMY_SPEED,     enemiesSpawned: 0};
var ROUND_TWO =   {enemyCount: 20, enemyRate: DEFAULT_ENEMY_RATE - 5,      enemyCap: 6, enemySpeed: DEFAULT_ENEMY_SPEED - 8, enemiesSpawned: 0};
var ROUND_THREE = {enemyCount: 25, enemyRate: DEFAULT_ENEMY_RATE - 15, enemyCap: 6, enemySpeed: DEFAULT_ENEMY_SPEED - 16, enemiesSpawned: 0};

var rounds = [ROUND_ONE, ROUND_TWO, ROUND_THREE];
var currentRound = 0;
var introFiles = [];
var introIndex = 0;
var introImages = [];
var outroFiles = [];
var outroIndex = 0;
var outroImages = [];

var DEATH_QUOTES = ["Though you suffer, you rise again.", "Don't fret my child, you will prevail.", "Death is a chance for a new life."];
var WIN_QUOTES = ["Your strength has grown tenfold.", "I am proud of you, my child.", "A well-fought victory."];

var STATUS_MANAGER = {locked: false, max: 200, cooldown: 0};

var percentComplete = 0;

var resetGame = false;

var PLAYER_COLOR = 0x333333;
var ENEMY_COLOR = 0x777777;
var SPEAR_COLOR = 0xbbbbbb;

var game_time = "";
var restarting = "";
var intro_time = "";
var outro_time = "";

var playerControl = true;


// INIT
// Loads the necessary audio files, sets the initial display state of the game, and triggers LoadCutscenes() to start the first cutscene
PS.init = function( system, options ) {
	PS.gridSize(GRID_WIDTH, GRID_HEIGHT);
	PS.border(PS.ALL, PS.ALL, 0);
	PS.statusText("");


	PS.audioLoad("fx_swoosh");
	PS.audioLoad("fx_powerup4");
	PS.audioLoad("fx_powerup1");
	PS.audioLoad("fx_shoot8");
	PS.audioLoad("fx_shoot7");
	PS.audioLoad("fx_coin5");
	PS.audioLoad("fx_shoot3");
	PS.audioLoad("footstep1", {path: "audio/", fileTypes: ["mp3", "ogg"]});
	PS.audioLoad("footstep2", {path: "audio/", fileTypes: ["mp3", "ogg"]});
	PS.audioLoad("stab", {path: "audio/", fileTypes: ["mp3", "ogg"]});
	PS.audioLoad("death", {path: "audio/", fileTypes: ["mp3", "ogg"]});
	PS.audioLoad("angel", {path: "audio/", fileTypes: ["mp3", "ogg"]});
	PS.audioLoad("paper_crumple", {path: "audio/", fileTypes: ["mp3", "ogg"]});

	loadCutscenes();
	const TEAM = "teamiris";

	PS.dbLogin( "imgd2900", TEAM, function ( id, user ) {
		if ( user === PS.ERROR ) {
			return;
		}
		PS.dbEvent( TEAM, "startup", user );
		PS.dbSend( TEAM, PS.CURRENT, { discard : true } );
	}, { active : false } );
	
	// Change the false in the final line above to true
	// before deploying the code to your Web site.
};


// LOAD CUTSCENES
// loops through the provided animation frames for the intro scene (49 in total), generating the file names and adding them to an array. Then loads the first frame
var loadCutscenes = function() {
	for(var e = 1; e < 49; e+=1) {
		introFiles.push(`Intro_Scene/intro${e}.png`);
	}
	PS.imageLoad(introFiles[introIndex],loadIntroImages);
	for(var f = 1; f < 31; f+=1) {
		outroFiles.push(`Outro_Scene/outro${f}.png`);
	}
	PS.imageLoad(outroFiles[outroIndex],loadOutroImages);
}


// LOAD INTRO IMAGES
// Loads images for the first cutscene. Originally called when the first image is loaded, then chains off itself for the rest of the images so no images get loaded out of order.
// The frame images are sent in order to an array that is used to blit each image in order
// Once the last image is loaded, calls PlayIntro() to start the cutscene
var loadIntroImages = function(image) {
	introImages.push(image);
	if(introIndex < 47) {
		introIndex+=1;
		PS.imageLoad(introFiles[introIndex],loadIntroImages);
	}
	else {
		introIndex = 0;
		playIntro();
	}
}


// LOAD OUTRO IMAGES
// Same as the previous function, but for the ending cutscene
var loadOutroImages = function(image) {
	outroImages.push(image);
	if(outroIndex < 29) {
		outroIndex+=1;
		PS.imageLoad(outroFiles[outroIndex],loadOutroImages);
	}
	else {
		outroIndex = 0;
	}
}


// PLAY INTRO
// Plays the opening cutscene by starting the timer loop for it. Interval is 30 as each frame was designed to have 0.5 seconds of delay, or 2fps
var playIntro = function() {
	intro_time = PS.timerStart(30, introTimer);
}


// INTRO TIMER
// The exec function for the intro cutscene's timer. At each step it loads the next frame in the intro images array, and at specific intervals changes the status text
// for dialogue or plays sounds effects to enhance the cutscene
// Once it reaches the last frame, calls LoadScene() to set up the grid for gameplay
var introTimer = function() {
	if(introIndex < introImages.length) {
		PS.imageBlit(introImages[introIndex], 0, 0);
		if (introIndex >= 1 && introIndex <= 7 || introIndex == 35 || introIndex == 37 || introIndex == 39) {
			playFootstep()
		}
		if (introIndex == 8) {
			PS.audioPlay("angel", {path: "audio/", fileTypes: ["mp3", "ogg"], volume: 0.3});
		}
		if(introIndex == 12) {
			PS.statusText("Athena: My child, for glory, you must fight.");
		}
		else if(introIndex == 23) {
			PS.statusText("Destroy these barbarians and become legend.");
		}
		else if(introIndex == 36) {
			PS.statusText("Raise your spear, the enemy approaches.");
		}
		introIndex+=1;
		PS.timerStop(intro_time);
		playIntro();
	}
	else {
		isCutscene = false;
		PS.timerStop(intro_time);
		loadScene();
	}
}


// PLAY OUTRO
// Same as PlayIntro(), but for the ending cutscene
var playOutro = function() {
	outro_time = PS.timerStart(30, outroTimer);
}


// OUTRO TIMER
// Same as IntroTimer(), but for the ending cutscene
var outroTimer = function() {
	if(outroIndex < outroImages.length) {
		PS.imageBlit(outroImages[outroIndex], 0, 0);
		if(outroIndex == 9) {
			PS.statusText("Child: Daddy? Have you seen my daddy?");
		}
		else if(outroIndex == 18) {
			PS.statusText("Where is he? He was just protecting us...\n");
		}

		if (outroIndex == 0 || outroIndex == 2 || outroIndex == 4 || outroIndex == 6 || outroIndex == 8) {
			PS.audioPlay("footstep1", {path: "audio/", fileTypes: ["mp3", "ogg"], volume: 0.4});
		}

		outroIndex+=1;
		PS.timerStop(outro_time);
		playOutro();
	}
	else {
		PS.statusText("Game over.");
		isCutscene = false;
		PS.timerStop(outro_time);
	}
}


// LOAD SCENE
// Called when the intro cutscene finishes. Sets up the grid for gameplay, ensuring all the right beads/borders/glyphs are in place,
// and that the player sprite is created and can move around
var loadScene = function() {
	PS.keyRepeat(true, 10, 10);

	PS.gridPlane(1);

	PS.gridSize(GRID_WIDTH, GRID_HEIGHT+1);

	// slight ground color variation
	for (var x = 0; x < GRID_WIDTH; x += 1) {
		for (var y = 0; y < GRID_WIDTH; y += 1) {
			var colorVar = 255 - PS.random(20);
			PS.color(x, y, [colorVar, colorVar, colorVar]);
		}
	}

	PS.border(PS.ALL, PS.ALL, 0);

	// creates the border around the walkable area
	PS.border(0, PS.ALL, {right: 2});
	PS.border(PS.ALL, 0, {bottom: 2});
	PS.border(GRID_WIDTH-1, PS.ALL, {left: 2});
	PS.border(PS.ALL, GRID_HEIGHT-1, {top: 2, bottom: 2});
	PS.border(0, 0, 0);
	PS.border(0, GRID_HEIGHT-1, {right: 0, left: 0, top: 0, bottom: 2});
	PS.border(GRID_WIDTH-1, 0, 0);
	PS.border(GRID_WIDTH-1, GRID_HEIGHT-1, {right: 0, left: 0, top: 0, bottom: 2});
	PS.border(GRID_WIDTH-1, GRID_HEIGHT, 0);
	PS.color(PS.ALL, GRID_HEIGHT, PS.COLOR_WHITE);



	//powerup slots
	PS.border(POWER_PIERCE.slot.x, POWER_PIERCE.slot.y, {top: 2, left: 2, right: 2, bottom: 2});
	PS.color(POWER_PIERCE.slot.x,  POWER_PIERCE.slot.y, 0x000000);
	PS.border(POWER_RAPID.slot.x, POWER_RAPID.slot.y, 2);
	PS.color(POWER_RAPID.slot.x,  POWER_RAPID.slot.y, 0x000000);
	PS.gridPlane(2);
	PS.color(POWER_PIERCE.slot.x,  POWER_PIERCE.slot.y, POWER_PIERCE.color);
	PS.glyph(POWER_PIERCE.slot.x,  POWER_PIERCE.slot.y, POWER_PIERCE.glyph);
	PS.alpha(POWER_PIERCE.slot.x,  POWER_PIERCE.slot.y, 0);

	PS.color(POWER_RAPID.slot.x,  POWER_RAPID.slot.y, POWER_RAPID.color);
	PS.glyph(POWER_RAPID.slot.x,  POWER_RAPID.slot.y, POWER_RAPID.glyph);
	PS.alpha(POWER_RAPID.slot.x,  POWER_RAPID.slot.y, 0);
	PS.gridPlane(1);

	// create player sprite
	player = PS.spriteSolid(1, 1);
	PS.spriteSolidColor(player, PLAYER_COLOR);
	PS.spritePlane(player, 5);
	PS.spriteMove(player, 7, 7);
	PS.glyph(7, 7, UP_GLYPH);
	PS.glyphColor(7, 7, PS.COLOR_WHITE);

	//game_time = PS.timerStart(TICK_RATE, timer);
	PS.statusText("Athena's Blessing");

	loadRound();
}


// LOAD ROUND
// Loads the first/next round. Rounds are only distinguished by their difficulty settings, and by keeping track of the number of enemies slain, so this function
// sets those variables as designated by the respective object in rounds[], and resets the kill count.
// Also starts the main game loop timer
var loadRound = function () {

	if (restarting !== "") {
		PS.timerStop(restarting);
	}

	var round = rounds[currentRound];

	enemySpeed.max = round.enemySpeed;
	enemyRate.max = round.enemyRate;
	enemyCap = round.enemyCap;

	percentComplete = 0;
	PS.statusText("Round " + (currentRound + 1) + ": " + percentComplete + "% complete");
	for(var x = 0; x < enemies.length; x++) {
		PS.spriteDelete(enemies[x].sprite);
	}
	for(var y = 0; y < player_spears.length; y++) {
		PS.spriteDelete(player_spears[y].sprite);
	}

	PS.spriteShow(player, true);

	PS.glyph(7, 7, UP_GLYPH);
	PS.glyphColor(7, 7, PS.COLOR_WHITE);
	player_direction = 1;


	enemies = [];
	player_spears = [];
	rounds[currentRound].enemiesSpawned = 0;
	resetGame = false;
	playerControl = true;


	game_time = PS.timerStart(TICK_RATE, timer);
}


// CREATE POWERUP
// Generates a powerup at the given position. Called occasionally when an enemy dies, a random ID of 1 or 2 is sent to this function to determine which
// powerup will get created. Powerups aren't sprites, they are identified only by their bead data, which directly correlates to the powerup's ID
var createPowerUp = function (x, y, id) {
	PS.gridPlane(2);
	//PS.audioPlay("fx_coin5", {volume: 0.2});

	PS.alpha(x, y, 255);
	PS.color(x, y, POWERUPS[id].color);
	PS.glyph(x, y, POWERUPS[id].glyph);
	PS.border(x, y, 1);
	PS.borderColor(x, y, 0x555555);
	PS.radius(x, y, 20);
	PS.data(x, y, id);

	PS.gridPlane(0);

}


// TIMER
// The global game loop. This timer function runs once per tick, so all timed functions are called here, and each event uses it's own cooldown tracker to ensure
// that it is called at the rate that we specify
var timer = function() {
	if(isCutscene == false) {
		var x = PS.spriteMove(player).x;
		var y = PS.spriteMove(player).y;


		// Increment cooldown for Pierce powerup
		if (POWER_PIERCE.active) {
			POWER_PIERCE.timer += 1;
			if (POWER_PIERCE.timer >= POWER_PIERCE.duration) {
				POWER_PIERCE.active = false;
				POWER_PIERCE.timer = 0;
				//PS.audioPlay("fx_shoot3", {volume: 0.2});
			}
		}
		// Increments cooldown for Rapid powerup, and changes the fire rate while it's active
		if (POWER_RAPID.active) {
			POWER_RAPID.timer += 1;
			spearRate.max = POWERED_SPEAR_RATE;
			if (POWER_RAPID.timer >= POWER_RAPID.duration) {
				POWER_RAPID.active = false;
				spearRate.max = DEFAULT_SPEAR_RATE;
				POWER_RAPID.timer = 0;
				//PS.audioPlay("fx_shoot3", {volume: 0.2});
			}
		}


		// Check the player's current position for powerups
		PS.gridPlane(2);
		var data = PS.data(x, y);
		if (data > 0) {
			PS.alpha(x, y, 0);
			PS.radius(x, y, 0);
			PS.border(x, y, 0);
			POWERUPS[data].active = true;
			POWERUPS[data].timer = 0;

			PS.fade(POWERUPS[data].slot.x, POWERUPS[data].slot.y, 0);
			PS.alpha(POWERUPS[data].slot.x, POWERUPS[data].slot.y, 255);
			PS.fade(POWERUPS[data].slot.x, POWERUPS[data].slot.y, POWERUPS[data].duration);
			PS.alpha(POWERUPS[data].slot.x, POWERUPS[data].slot.y, 0);

			updateStatus(POWERUPS[data].quotes[PS.random(POWERUPS[data].quotes.length) - 1]);

			PS.audioPlay("paper_crumple", {path: "audio/", fileTypes: ["mp3", "ogg"], volume: 0.5});
			PS.data(x, y, 0);
		}
		PS.gridPlane(0);


		// Spawns enemies at random positions along the edge of the board. The rate that enemies spawn is determined by the current round's settings
		if (enemyRate.cooldown >= enemyRate.max && enemies.length < enemyCap && rounds[currentRound].enemiesSpawned < rounds[currentRound].enemyCount) {
			enemyRate.cooldown = 0;

			//create the sprite
			var enemySprite = PS.spriteSolid(1, 1);
			PS.spritePlane(enemySprite, 3);
			PS.spriteSolidColor(enemySprite, ENEMY_COLOR);

			// pick a spot to spawn at
			var edge = PS.random(4);  // which edge to spawn on (up/right/down/left)
			var position = PS.random(GRID_HEIGHT) - 1; // which bead on that edge to spawn at

			var nextSpot = [0, 0];

			switch (edge) {
				case 1:
					PS.spriteMove(enemySprite, position, 0);
					nextSpot = [position, 0];
					break;
				case 2:
					PS.spriteMove(enemySprite, GRID_WIDTH - 1, position);
					nextSpot = [GRID_WIDTH - 1, position];
					break;
				case 3:
					PS.spriteMove(enemySprite, position, GRID_HEIGHT - 1);
					nextSpot = [position, GRID_HEIGHT - 1];
					break;
				case 4:
					PS.spriteMove(enemySprite, 0, position);
					nextSpot = [0, position]
					break;
			}

			// push the enemy to the enemies array, and initialize them with their next position to go to
			var enemy = {sprite: enemySprite, next: nextSpot};
			rounds[currentRound].enemiesSpawned += 1;
			enemies.push(enemy);

		}
		enemyRate.cooldown += 1;


		// Move enemies. Each cycle, the enemy draws a line towards the player, picks the first position in the line, and moves to it.
		// Since the player is always moving, we only need to keep track of the first position, as the line will get recalculated next cycle anyways
		if (enemySpeed.cooldown >= enemySpeed.max) {

			enemySpeed.cooldown = 0;

			for (var z = 0; z < enemies.length; z++) {

				var sprite = enemies[z].sprite;
				var x1 = PS.spriteMove(sprite).x;
				var y1 = PS.spriteMove(sprite).y;
				var line = PS.line(x1, y1, x, y);
				var nextSpot = line[0];

				for (var e = 0; e < enemies.length; e += 1) {
					var otherSpot = [PS.spriteMove(enemies[e].sprite).x, PS.spriteMove(enemies[e].sprite).y];

					if (nextSpot === enemies[e].next || nextSpot === otherSpot) {
						nextSpot = [x1, y1];
					}
				}
				enemies[z].next = nextSpot;

				PS.spriteCollide(sprite, enemyCollide);

				PS.spriteMove(sprite, enemies[z].next[0], enemies[z].next[1]);
			}
		}
		enemySpeed.cooldown += 1;


		// Move spears. Each spear stores its direction, and moves one space in that direction every cycle
		var spear_keep = [];
		if (spearSpeed.cooldown >= spearSpeed.max) {
			spearSpeed.cooldown = 0;

			for (var i = 0; i < player_spears.length; i++) {
				var spear_x = PS.spriteMove(player_spears[i].sprite).x;
				var spear_y = PS.spriteMove(player_spears[i].sprite).y;
				switch (player_spears[i].direction) {
					case 1:
						if (spear_y > 0) {
							PS.spriteMove(player_spears[i].sprite, spear_x, spear_y - 1);
							spear_keep.push(player_spears[i]);
						} else {
							PS.spriteDelete(player_spears[i].sprite);
						}
						break;
					case 2:
						if (spear_x < GRID_WIDTH - 1) {
							PS.spriteMove(player_spears[i].sprite, spear_x + 1, spear_y);
							spear_keep.push(player_spears[i]);
						} else {
							PS.spriteDelete(player_spears[i].sprite);
						}
						break;
					case 3:
						if (spear_y < GRID_HEIGHT - 1) {
							PS.spriteMove(player_spears[i].sprite, spear_x, spear_y + 1);
							spear_keep.push(player_spears[i]);
						} else {
							PS.spriteDelete(player_spears[i].sprite);
						}
						break;
					case 4:
						if (spear_x > 0) {
							PS.spriteMove(player_spears[i].sprite, spear_x - 1, spear_y);
							spear_keep.push(player_spears[i]);
						} else {
							PS.spriteDelete(player_spears[i].sprite);
						}
						break;
				}
			}

			player_spears = spear_keep;
		}
		spearSpeed.cooldown += 1;


		// Throw spears. Throws at the default rate without powerups, or at an increased rate, and in all directions, if Rapid is active. Also checks for collision with enemies
		if (spearRate.cooldown >= spearRate.max && player_shoot) {
			spearRate.cooldown = 0;

			PS.audioPlay("fx_swoosh", {volume: 0.2});
			if (!POWER_RAPID.active) {
				var spearSprite = PS.spriteSolid(1, 1);
				PS.spritePlane(spearSprite, 3);
				PS.spriteSolidColor(spearSprite, SPEAR_COLOR);
				if (player_direction === 1) {
					PS.spriteMove(spearSprite, x, y - 1);
				} else if (player_direction === 2) {
					PS.spriteMove(spearSprite, x + 1, y);
				} else if (player_direction === 3) {
					PS.spriteMove(spearSprite, x, y + 1);
				} else {
					PS.spriteMove(spearSprite, x - 1, y);
				}
				PS.spriteCollide(spearSprite, spearCollide);
				var spear = {sprite: spearSprite, direction: player_direction};
				player_spears.push(spear);
			} else if (POWER_RAPID.active) {
				for (var d = 1; d < 5; d += 1) {
					var spearSprite1 = PS.spriteSolid(1, 1);
					PS.spritePlane(spearSprite1, 3);
					PS.spriteSolidColor(spearSprite1, SPEAR_COLOR);
					if (d === 1) {
						PS.spriteMove(spearSprite1, x, y - 1);
					} else if (d === 2) {
						PS.spriteMove(spearSprite1, x + 1, y);
					} else if (d === 3) {
						PS.spriteMove(spearSprite1, x, y + 1);
					} else {
						PS.spriteMove(spearSprite1, x - 1, y);
					}
					PS.spriteCollide(spearSprite1, spearCollide);
					var spear = {sprite: spearSprite1, direction: d};
					player_spears.push(spear);
				}
			}
			spear_time = MAX_SPEAR_TIME;

		}
		spearRate.cooldown += 1;

		// All active spears are stored in an array. If a spear hasn't collided, it's added to a "spear_keep" array, otherwise it isn't. The main array is then replaced with the
		// "spear_keep" array at the end of the cycle, effectively deleting any spears that collided (while Pierce is inactive)
		for (var e = 0; e < mark_delete_spear.length; e++) {
			spear_keep = [];
			for (var f = 0; f < player_spears.length; f++) {
				if (player_spears[f].sprite !== mark_delete_spear[e]) {
					spear_keep.push(player_spears[f]);
				} else {
					PS.spriteDelete(player_spears[f].sprite);
				}
			}
			player_spears = spear_keep;
			spear_keep = [];
		}


		// Same as the spear_keep array, if an enemy wasn't hit, they'll be kept for the next cycle, otherwise they will be cleared from the array
		var enemies_keep = [];
		for (var g = 0; g < mark_delete_enemy.length; g++) {
			for (var h = 0; h < enemies.length; h++) {
				if (enemies[h].sprite !== mark_delete_enemy[g]) {
					enemies_keep.push(enemies[h]);
				} else {
					var ex = PS.spriteMove(enemies[h].sprite).x;
					var ey = PS.spriteMove(enemies[h].sprite).y;

					PS.spriteDelete(enemies[h].sprite);

					// Chance to generate a powerup upon enemy death
					if (ex > 0 && ex < GRID_WIDTH - 1 && ey > 0 && ey < GRID_HEIGHT - 1) {
						if (PS.random(100) < POWERUP_CHANCE) {
							var power = PS.random(POWERUPS.length - 1);
							createPowerUp(ex, ey, power);
						}
					}
				}
			}
			enemies = enemies_keep;
			enemies_keep = [];
		}

		if (spear_time > 0) {
			spear_time -= 1;
		}

		// update status text with percent of enemies spawned
		percentComplete = (Math.floor((rounds[currentRound].enemiesSpawned / rounds[currentRound].enemyCount) * 100));
		if (!STATUS_MANAGER.locked) {
			PS.statusText("Round " + (currentRound + 1) + ": " + percentComplete + "% complete");
		}


		// Triggered upon enemy death. Resets the current round
		if (resetGame) {
			playerControl = false;
			//PS.statusText("You died, restarting round...");
			updateStatus(DEATH_QUOTES[PS.random(DEATH_QUOTES.length) - 1]);
			POWER_RAPID.active = false;
			POWER_PIERCE.active = false;
			POWER_RAPID.timer = 0;
			POWER_PIERCE.timer = 0;
			PS.audioPlay("death", {path: "audio/", fileTypes: ["mp3", "ogg"]});
			restarting = PS.timerStart(180, loadRound);
			PS.spriteShow(player, false);
			PS.glyph(x, y, 0);
			PS.spriteMove(player, 7, 7);

			PS.timerStop(game_time);

		}

		// Keeps track of how long the status line has been locked for as per UpdateStatus()
		if (STATUS_MANAGER.locked) {
			STATUS_MANAGER.cooldown += 1;
			if (STATUS_MANAGER.cooldown >= STATUS_MANAGER.max) {
				STATUS_MANAGER.locked = false;
				STATUS_MANAGER.cooldown = 0;

			}
		}

		// Called when a round is finished. Clears the grid of enemies and spears, and loads the next round. If this was the last round, loads the outro instead
		if (rounds[currentRound].enemiesSpawned >= rounds[currentRound].enemyCount && enemies.length === 0 && currentRound < rounds.length) {
			updateStatus(WIN_QUOTES[PS.random(WIN_QUOTES.length) - 1]);
			currentRound += 1;
			if (currentRound >= rounds.length) {
				isCutscene = true;
				PS.gridSize(GRID_WIDTH, GRID_HEIGHT);
				PS.border(PS.ALL, PS.ALL, 0);
				PS.statusText("");
				PS.spriteShow(player, false);
				for(var x = 0; x < enemies.length; x++) {
					PS.spriteDelete(enemies[x].sprite);
				}
				for(var y = 0; y < player_spears.length; y++) {
					PS.spriteDelete(player_spears[y].sprite);
				}
				playOutro();
			}
			PS.timerStop(game_time);
			playerControl = false;
			if(isCutscene == false) {
				restarting = PS.timerStart(180, loadRound);
			}
		}
	}
}

// UPDATE STATUS
// Used to display Athena's quotes in the status line. Locks the status line for a moment when Athena speaks, so the dialogue is not overwritten by the percent completion counter
var updateStatus = function (text) {
	PS.statusText("Athena: " + text);
	STATUS_MANAGER.locked = true;
}


// SPEAR COLLIDE
// The collision exec function for when a spear hits an enemy. Marks the enemy for deletion, and marks the spear unless Pierce is active
var spearCollide = function(s1, p1, s2, p2, type) {

	if (s2!=player) {
		if(type === PS.SPRITE_OVERLAP || (type === PS.SPRITE_TOUCH && POWER_PIERCE.active)) {
			if (!POWER_PIERCE.active) {
				mark_delete_spear.push(s1);
			}
			mark_delete_enemy.push(s2);
			PS.audioPlay("stab", {path: "audio/", fileTypes: ["mp3", "ogg"], volume: 0.75});

		}

	}
}


// ENEMY COLLIDE
// The collision exec function for when an enemy touches the player. Triggers ResetGame which causes the player to die
var enemyCollide = function(s1, p1, s2, p2, type) {
	if(s2===player && type == PS.SPRITE_OVERLAP) {
		resetGame = true;
	}
};

PS.touch = function( x, y, data, options ) {
	//createPowerUp(x, y, PS.random(2)); // a dev tool for spawning powerups on click, for easier testing
};

PS.release = function( x, y, data, options ) {};

PS.enter = function( x, y, data, options ) {};

PS.exit = function( x, y, data, options ) {};

PS.exitGrid = function( options ) {};


// KEY DOWN
// Keeps track of player inputs. If the player is not in a cutscene, allows them to move with WASD and enable firing by holding Space
// Also keeps track of the player's arrow glyph, changing the direction to match movement, and moving it off of old squares and onto the player's current square
PS.keyDown = function( key, shift, ctrl, options ) {

	if(playerControl && isCutscene == false) {
		var x = PS.spriteMove(player).x;
		var y = PS.spriteMove(player).y;
		switch (key) {
			case PS.KEY_ARROW_UP:
			case 119:
			case 87: {
				if (PS.spriteMove(player).y > 1) {
					PS.glyph(x, y, 0);
					PS.glyphColor(x, y, PS.DEFAULT);
					if(PS.glyph(x, y - 1) === 0) {
						PS.glyph(x, y - 1, UP_GLYPH);
						PS.glyphColor(x, y - 1, PS.COLOR_WHITE);
					}
					PS.spriteMove(player, x, y - 1);
					playFootstep();
				}
				player_direction = 1;
				break;
			}

			case PS.KEY_ARROW_RIGHT:
			case 100:
			case 68: {
				if (PS.spriteMove(player).x < GRID_WIDTH - 2) {
					PS.glyph(x, y, 0);
					PS.glyphColor(x, y, PS.DEFAULT);
					if(PS.glyph(x + 1, y) === 0) {
						PS.glyph(x + 1, y, RIGHT_GLYPH);
						PS.glyphColor(x + 1, y, PS.COLOR_WHITE);
					}

					PS.spriteMove(player, x + 1, y);
					playFootstep();
				}
				player_direction = 2;
				break;
			}
			case PS.KEY_ARROW_DOWN:
			case 115:
			case 83: {
				if (PS.spriteMove(player).y < GRID_HEIGHT - 2) {
					PS.glyph(x, y, 0);
					PS.glyphColor(x, y, PS.DEFAULT);
					if(PS.glyph(x, y + 1) === 0) {
						PS.glyph(x, y + 1, DOWN_GLYPH);
						PS.glyphColor(x, y + 1, PS.COLOR_WHITE);
					}
					PS.spriteMove(player, x, y + 1);
					playFootstep();
				}
				player_direction = 3;
				break;
			}
			case PS.KEY_ARROW_LEFT:
			case 97:
			case 65: {
				if (PS.spriteMove(player).x > 1) {
					PS.glyph(x, y, 0);
					PS.glyphColor(x, y, PS.DEFAULT);
					if(PS.glyph(x - 1, y) === 0) {
						PS.glyph(x - 1, y, LEFT_GLYPH);
						PS.glyphColor(x - 1, y, PS.COLOR_WHITE);
					}
					PS.spriteMove(player, x - 1, y);
					playFootstep();
				}
				player_direction = 4;
				break;
			}
			case PS.KEY_SPACE:
				player_shoot = true;
				break;
		}

	}
};

// PLAY FOOTSTEP
// Randomly plays one of the two footstep sounds effects for variation
var playFootstep = function () {
	if (PS.random(10) > 5) {
		PS.audioPlay("footstep1", {path: "audio/", fileTypes: ["mp3", "ogg"], volume: 0.3});
	} else {
		PS.audioPlay("footstep2", {path: "audio/", fileTypes: ["mp3", "ogg"], volume: 0.3});
	}
}

// KEY UP
// When Space is released, disable firing
PS.keyUp = function( key, shift, ctrl, options ) {

	switch (key) {
		case PS.KEY_SPACE:
			player_shoot = false;
			break;
	}
};


PS.input = function( sensors, options ) {};

PS.shutdown = function( options ) {};

