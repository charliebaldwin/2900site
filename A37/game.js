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

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/
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

PS.init = function( system, options ) {
	PS.gridSize(GRID_WIDTH, GRID_HEIGHT);
	PS.border(PS.ALL, PS.ALL, 0);
	PS.statusText("");
	loadCutscenes();
	playIntro();
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

var loadCutscenes = function() {
	for(var e = 1; e < 49; e+=1) {
		introFiles.push(`Intro_Scene/intro${e}.png`);
	}
	PS.imageLoad(introFiles[introIndex],loadIntroImages);/*
	for(var f = 1; f < 49; f+=1) {
		outroFiles.push(`Outro_Scene/outro${e}.png`);
		PS.imageLoad(outroFiles[f-1],loadOutroImages);
	}*/
}

var loadIntroImages = function(image) {
	introImages.push(image);
	if(introIndex < 47) {
		introIndex+=1;
		PS.imageLoad(introFiles[introIndex],loadIntroImages);
	}
	else {
		introIndex = 0;
	}
}

var loadOutroImages = function(image) {
	outroImages.push(image);
}

var playIntro = function() {
	intro_time = PS.timerStart(30, introTimer);
}

var introTimer = function() {
	if(introIndex < introImages.length) {
		PS.imageBlit(introImages[introIndex], 0, 0);
		if(introIndex == 12) {
			PS.statusText("Athena: My child, for glory, you must fight.");
		}
		else if(introIndex == 21) {
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

var loadScene = function() {
	PS.keyRepeat(true, 10, 10);

	PS.gridPlane(1);

	PS.gridSize(GRID_WIDTH, GRID_HEIGHT+1);

	for (var x = 0; x < GRID_WIDTH; x += 1) {
		for (var y = 0; y < GRID_WIDTH; y += 1) {
			var colorVar = 255 - PS.random(10);
			PS.color(x, y, [colorVar, colorVar, colorVar]);
		}
	}

	PS.color(0, PS.ALL, PS.COLOR_BLACK);
	PS.color(PS.ALL, 0, PS.COLOR_BLACK);
	PS.color(GRID_WIDTH-1, PS.ALL, PS.COLOR_BLACK);
	PS.color(PS.ALL, GRID_HEIGHT-1, PS.COLOR_BLACK);
	PS.color(PS.ALL, GRID_HEIGHT, PS.COLOR_WHITE);


	//PS.border(PS.ALL, PS.ALL, {top: 1, left: 1, right: 0, bottom: 0});
	PS.border(PS.ALL, PS.ALL, 0);

	//powerup slots
	PS.border(POWER_PIERCE.slot.x, POWER_PIERCE.slot.y, 2);
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


	player = PS.spriteSolid(1, 1);
	PS.spriteSolidColor(player, PLAYER_COLOR);
	PS.spritePlane(player, 5);
	PS.spriteMove(player, 7, 7);
	PS.glyph(7, 7, UP_GLYPH);
	PS.glyphColor(7, 7, PS.COLOR_WHITE);

	//game_time = PS.timerStart(TICK_RATE, timer);
	PS.statusText("Athena's Blessing");


	PS.audioLoad("fx_swoosh");
	PS.audioLoad("fx_powerup4");
	PS.audioLoad("fx_powerup1");
	PS.audioLoad("fx_shoot8");
	PS.audioLoad("fx_shoot7");
	PS.audioLoad("fx_coin5");

	loadRound();
}

var loadRound = function () {

	// PS.debug("Round " + (currentRound + 1) + ": \n");
	// PS.debug("EnemyCount: " + rounds[currentRound].enemyCount + " \n");
	// PS.debug("EnemyCap: " + rounds[currentRound].enemyCap + " \n");
	// PS.debug("EnemyRate: " + rounds[currentRound].enemyRate + " \n");
	// PS.debug("EnemySpeed: " + rounds[currentRound].enemySpeed + " \n");

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


var createPowerUp = function (x, y, id) {
	PS.gridPlane(2);
	PS.audioPlay("fx_coin5", {volume: 0.2});

	PS.alpha(x, y, 255);
	PS.color(x, y, POWERUPS[id].color);
	PS.glyph(x, y, POWERUPS[id].glyph);
	PS.border(x, y, 1);
	PS.borderColor(x, y, 0x555555);
	PS.radius(x, y, 20);
	PS.data(x, y, id);

	PS.gridPlane(0);

}


// GLOBAL GAME LOOP
var timer = function() {
	if(isCutscene == false) {
		var x = PS.spriteMove(player).x;
		var y = PS.spriteMove(player).y;


		if (POWER_PIERCE.active) {
			POWER_PIERCE.timer += 1;
			if (POWER_PIERCE.timer >= POWER_PIERCE.duration) {
				POWER_PIERCE.active = false;
				POWER_PIERCE.timer = 0;
			}
		}
		if (POWER_RAPID.active) {
			POWER_RAPID.timer += 1;
			spearRate.max = POWERED_SPEAR_RATE;
			if (POWER_RAPID.timer >= POWER_RAPID.duration) {
				POWER_RAPID.active = false;
				spearRate.max = DEFAULT_SPEAR_RATE;
				POWER_RAPID.timer = 0;
			}
		}


		// CHECK FOR POWERUPS
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

			PS.audioPlay(POWERUPS[data].sound, {volume: 0.3});
			PS.data(x, y, 0);
		}
		PS.gridPlane(0);

// ~~~~~~ SPAWN ENEMIES ~~~~~~

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

			// push the enemy to the array, and initialize them with their next position to go to
			var enemy = {sprite: enemySprite, next: nextSpot};
			rounds[currentRound].enemiesSpawned += 1;
			enemies.push(enemy);

		}
		enemyRate.cooldown += 1;

// ~~~~~~ MOVE ENEMIES ~~~~~~

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


// ~~~~~~ MOVE SPEARS ~~~~~~
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


// ~~~~~~ THROW SPEARS ~~~~~~
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

		var enemies_keep = [];
		for (var g = 0; g < mark_delete_enemy.length; g++) {
			for (var h = 0; h < enemies.length; h++) {
				if (enemies[h].sprite !== mark_delete_enemy[g]) {
					enemies_keep.push(enemies[h]);
				} else {
					var ex = PS.spriteMove(enemies[h].sprite).x;
					var ey = PS.spriteMove(enemies[h].sprite).y;

					PS.spriteDelete(enemies[h].sprite);
					PS.audioPlay("fx_shoot7", {volume: 0.3});

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

		// update status text with percent
		percentComplete = (Math.floor((rounds[currentRound].enemiesSpawned / rounds[currentRound].enemyCount) * 100));
		if (!STATUS_MANAGER.locked) {
			PS.statusText("Round " + (currentRound + 1) + ": " + percentComplete + "% complete");
		}


// ~~~~~ DEATH ~~~~~
		if (resetGame) {
			playerControl = false;
			//PS.statusText("You died, restarting round...");
			updateStatus(DEATH_QUOTES[PS.random(DEATH_QUOTES.length) - 1]);
			PS.audioPlay("fx_shoot8", {volume: 0.3});
			restarting = PS.timerStart(180, loadRound);
			PS.spriteShow(player, false);
			PS.glyph(x, y, 0);
			PS.spriteMove(player, 7, 7);

			PS.timerStop(game_time);

		}

		if (STATUS_MANAGER.locked) {
			STATUS_MANAGER.cooldown += 1;
			if (STATUS_MANAGER.cooldown >= STATUS_MANAGER.max) {
				STATUS_MANAGER.locked = false;
				STATUS_MANAGER.cooldown = 0;

			}
		}


		if (rounds[currentRound].enemiesSpawned >= rounds[currentRound].enemyCount && enemies.length === 0 && currentRound < rounds.length) {
			updateStatus(WIN_QUOTES[PS.random(WIN_QUOTES.length) - 1]);
			currentRound += 1;
			if (currentRound >= rounds.length) {
				currentRound = 0;
			}
			PS.timerStop(game_time);
			playerControl = false;
			restarting = PS.timerStart(180, loadRound);
		}
	}
}

var updateStatus = function (text) {
	PS.statusText("Athena: " + text);
	STATUS_MANAGER.locked = true;
}

var spearCollide = function(s1, p1, s2, p2, type) {

	if (s2!=player) {
		if(type === PS.SPRITE_OVERLAP) {
			if (!POWER_PIERCE.active) {
				mark_delete_spear.push(s1);
			}
			mark_delete_enemy.push(s2);
		}
		else if(type === PS.SPRITE_TOUCH && POWER_PIERCE.active) {
			mark_delete_enemy.push(s2);
		}
	}
}

var enemyCollide = function(s1, p1, s2, p2, type) {
	if(s2===player && type == PS.SPRITE_OVERLAP) {
		resetGame = true;
	// } else if (s2 !== player && type === PS.SPRITE_TOUCH) {
	//
	// 	for (var e = 0; e < enemies.length; e+=1) {
	// 		if (enemies[e].sprite === s1) {
	// 			enemies[e].next = PS.spriteMove(s1);
	// 		}
	// 	}
	}
};

var restart = function() {

};

var resetting = function() {

};

PS.touch = function( x, y, data, options ) {
	//createPowerUp(x, y, PS.random(2));
};

PS.release = function( x, y, data, options ) {};

PS.enter = function( x, y, data, options ) {};

PS.exit = function( x, y, data, options ) {};

PS.exitGrid = function( options ) {};


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
					PS.glyph(x, y - 1, UP_GLYPH);
					PS.glyphColor(x, y - 1, PS.COLOR_WHITE);
					PS.spriteMove(player, x, y - 1);
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
					PS.glyph(x + 1, y, RIGHT_GLYPH);
					PS.glyphColor(x + 1, y, PS.COLOR_WHITE);

					PS.spriteMove(player, x + 1, y);
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
					PS.glyph(x, y + 1, DOWN_GLYPH);
					PS.glyphColor(x, y + 1, PS.COLOR_WHITE);
					PS.spriteMove(player, x, y + 1);
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
					PS.glyph(x - 1, y, LEFT_GLYPH);
					PS.glyphColor(x - 1, y, PS.COLOR_WHITE);
					PS.spriteMove(player, x - 1, y);
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


PS.keyUp = function( key, shift, ctrl, options ) {

	switch (key) {
		case PS.KEY_SPACE:
			player_shoot = false;
			break;
	}
};


PS.input = function( sensors, options ) {};

PS.shutdown = function( options ) {};

