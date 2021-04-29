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

var SPEAR_SPEED = {cooldown: 0, max: 3};
var SPEAR_RATE = {cooldown: 0, max: 20};
var ENEMY_SPEED = {cooldown: 0, max: 30};
var ENEMY_RATE = {cooldown: 0, max: 75};

var MAX_ENEMY_COUNT = 6;
var enemies = [];
var mark_delete_enemy = [];

var GRID_HEIGHT = 16;
var GRID_WIDTH = 16;

var resetGame = false;

var PLAYER_COLOR = 0xd10000;
var ENEMY_COLOR = 0x0a60c9;
var SPEAR_COLOR = 0x8a7738;

var game_time;
var restarting;
var refresh;


var playerControl = true;

PS.init = function( system, options ) {

	PS.gridSize(GRID_WIDTH, GRID_HEIGHT);

	PS.color(0, PS.ALL, PS.COLOR_BLACK);
	PS.color(PS.ALL, 0, PS.COLOR_BLACK);
	PS.color(GRID_WIDTH-1, PS.ALL, PS.COLOR_BLACK);
	PS.color(PS.ALL, GRID_HEIGHT-1, PS.COLOR_BLACK);

	PS.border(PS.ALL, PS.ALL, {top: 1, left: 1, right: 0, bottom: 0});

	player = PS.spriteSolid(1, 1);
	PS.spriteSolidColor(player, PLAYER_COLOR);
	PS.spritePlane(player, 5);
	PS.spriteMove(player, 8, 8);
	PS.glyph(8, 8, UP_GLYPH);
	PS.glyphColor(8, 8, PS.COLOR_WHITE);

	game_time = PS.timerStart(TICK_RATE, timer);
	PS.statusText("Athena's Blessing");





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


// GLOBAL GAME LOOP
var timer = function() {
	var x = PS.spriteMove(player).x;
	var y = PS.spriteMove(player).y;



// ~~~~~~ SPAWN ENEMIES ~~~~~~

	if(ENEMY_RATE.cooldown >= ENEMY_RATE.max && enemies.length < MAX_ENEMY_COUNT) {
		ENEMY_RATE.cooldown = 0;

		//create the sprite
		var enemySprite = PS.spriteSolid(1,1);
		PS.spritePlane(enemySprite, 3);
		PS.spriteSolidColor(enemySprite,ENEMY_COLOR);

		// pick a spot to spawn at
		var edge = PS.random(4);  // which edge to spawn on (up/right/down/left)
		var position = PS.random(GRID_HEIGHT)-1; // which bead on that edge to spawn at

		var nextSpot = [0, 0];

		switch(edge) {
			case 1:
				PS.spriteMove(enemySprite,position,0);
				nextSpot = [position, 0];
				break;
			case 2:
				PS.spriteMove(enemySprite,GRID_WIDTH-1,position);
				nextSpot = [GRID_WIDTH-1, position];
				break;
			case 3:
				PS.spriteMove(enemySprite,position,GRID_HEIGHT-1);
				nextSpot = [position, GRID_HEIGHT-1];
				break;
			case 4:
				PS.spriteMove(enemySprite,0,position);
				nextSpot = [0, position]
				break;
		}

		// push the enemy to the array, and initialize them with their next position to go to
		var enemy = {sprite:enemySprite, next:nextSpot};
		enemies.push(enemy);
	}
	ENEMY_RATE.cooldown += 1;



// ~~~~~~ MOVE ENEMIES ~~~~~~

	if (ENEMY_SPEED.cooldown >= ENEMY_SPEED.max) {

		ENEMY_SPEED.cooldown = 0;

		for(var z = 0; z < enemies.length; z++) {
			var sprite = enemies[z].sprite;

			PS.spriteCollide(sprite, enemyCollide);

			// move the sprite to their next set position
			PS.spriteMove(sprite, enemies[z].next[0],enemies[z].next[1]);
			// find the next position to move to based on a line from the enemy to the player, and set it for the next cycle
			var x1 = PS.spriteMove(sprite).x;
			var y1 = PS.spriteMove(sprite).y;
			var line = PS.line(x1,y1,x,y);
			var nextSpot = line[0];
			enemies[z].next = nextSpot;
		}
	}
	ENEMY_SPEED.cooldown += 1;



// ~~~~~~ MOVE SPEARS ~~~~~~
	var spear_keep = [];
	if (SPEAR_SPEED.cooldown >= SPEAR_SPEED.max) {
		SPEAR_SPEED.cooldown = 0;

		for(var i = 0; i < player_spears.length; i++) {
			var spear_x = PS.spriteMove(player_spears[i].sprite).x;
			var spear_y = PS.spriteMove(player_spears[i].sprite).y;
			switch(player_spears[i].direction) {
				case 1:
					if(spear_y > 0) {
						PS.spriteMove(player_spears[i].sprite, spear_x, spear_y-1);
						spear_keep.push(player_spears[i]);
					}
					else {
						PS.spriteDelete(player_spears[i].sprite);
					}
					break;
				case 2:
					if(spear_x < GRID_WIDTH-1) {
						PS.spriteMove(player_spears[i].sprite, spear_x+1, spear_y);
						spear_keep.push(player_spears[i]);
					}
					else {
						PS.spriteDelete(player_spears[i].sprite);
					}
					break;
				case 3:
					if(spear_y < GRID_HEIGHT-1) {
						PS.spriteMove(player_spears[i].sprite, spear_x, spear_y+1);
						spear_keep.push(player_spears[i]);
					}
					else {
						PS.spriteDelete(player_spears[i].sprite);
					}
					break;
				case 4:
					if(spear_x > 0) {
						PS.spriteMove(player_spears[i].sprite, spear_x-1, spear_y);
						spear_keep.push(player_spears[i]);
					}
					else {
						PS.spriteDelete(player_spears[i].sprite);
					}
					break;
			}
		}

		player_spears = spear_keep;
	}
	SPEAR_SPEED.cooldown += 1;



// ~~~~~~ THROW SPEARS ~~~~~~
	if (SPEAR_RATE.cooldown >= SPEAR_RATE.max && player_shoot) {
		SPEAR_RATE.cooldown = 0;

		var spearSprite = PS.spriteSolid(1,1);
		PS.spritePlane(spearSprite, 3);
		PS.spriteSolidColor(spearSprite, SPEAR_COLOR);
		if(player_direction===1) {
			PS.spriteMove(spearSprite,x,y-1);
		}
		else if(player_direction===2) {
			PS.spriteMove(spearSprite,x+1,y);
		}
		else if(player_direction===3) {
			PS.spriteMove(spearSprite,x,y+1);
		}
		else {
			PS.spriteMove(spearSprite,x-1,y);
		}
		PS.spriteCollide(spearSprite, spearCollide);
		var spear = {sprite:spearSprite, direction:player_direction};
		player_spears.push(spear);
		spear_time = MAX_SPEAR_TIME;

	}
	SPEAR_RATE.cooldown += 1;



	for(var e = 0; e < mark_delete_spear.length; e++) {
		spear_keep = [];
		for(var f = 0; f < player_spears.length; f++) {
			if(player_spears[f].sprite !== mark_delete_spear[e]) {
				spear_keep.push(player_spears[f]);
			}
			else {
				PS.spriteDelete(player_spears[f].sprite);
			}
		}
		player_spears = spear_keep;
		spear_keep = [];
	}
	var enemies_keep = [];
	for(var g = 0; g < mark_delete_enemy.length; g++) {
		for(var h = 0; h < enemies.length; h++) {
			if(enemies[h].sprite !== mark_delete_enemy[g]) {
				enemies_keep.push(enemies[h]);
			}
			else {
				PS.spriteDelete(enemies[h].sprite);
			}
		}
		enemies = enemies_keep;
		enemies_keep = [];
	}

	if(spear_time > 0) {
		spear_time -= 1;
	}

	if(resetGame) {
		playerControl = false;
		PS.timerStop(game_time);
		PS.statusText("You died, restarting");
		restarting = PS.timerStart(180, restart);
	}

}

var spearCollide = function(s1, p1, s2, p2, type) {
	if(s2!=player && type===PS.SPRITE_OVERLAP) {
		mark_delete_spear.push(s1);
		mark_delete_enemy.push(s2);
	}
}

var enemyCollide = function(s1, p1, s2, p2, type) {
	if(s2===player && type == PS.SPRITE_OVERLAP) {
		resetGame = true;
	}
};

var restart = function() {
	PS.timerStop(restarting);
	refresh = PS.timerStart(1,resetting);
};

var resetting = function() {
	PS.statusText("Athena's Blessing");
	PS.spriteMove(player, 8, 8);
	for(var x = 0; x < enemies.length; x++) {
		PS.spriteDelete(enemies[x].sprite);
	}
	for(var y = 0; y < player_spears.length; y++) {
		PS.spriteDelete(player_spears[y].sprite);
	}
	enemies = [];
	player_spears = [];
	resetGame = false;
	PS.timerStop(refresh);
	playerControl = true;
	game_time = PS.timerStart(TICK_RATE, timer);
};

PS.touch = function( x, y, data, options ) {};

PS.release = function( x, y, data, options ) {};

PS.enter = function( x, y, data, options ) {};

PS.exit = function( x, y, data, options ) {};

PS.exitGrid = function( options ) {};


PS.keyDown = function( key, shift, ctrl, options ) {

	var x = PS.spriteMove(player).x;
	var y = PS.spriteMove(player).y;

	if(playerControl) {

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

