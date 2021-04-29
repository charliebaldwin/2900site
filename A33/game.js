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

var enemies = [];
var enemy_spawn = 0;
var MAX_SPAWN_TIME = 15;
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

var tick_rate = 5;

var playerControl = true;

PS.init = function( system, options ) {
	// Uncomment the following code line
	// to verify operation:

	// PS.debug( "PS.init() called\n" );

	// This function should normally begin
	// with a call to PS.gridSize( x, y )
	// where x and y are the desired initial
	// dimensions of the grid.
	// Call PS.gridSize() FIRST to avoid problems!
	// The sample call below sets the grid to the
	// default dimensions (8 x 8).
	// Uncomment the following code line and change
	// the x and y parameters as needed.

	// PS.gridSize( 8, 8 );

	// This is also a good place to display
	// your game title or a welcome message
	// in the status line above the grid.
	// Uncomment the following code line and
	// change the string parameter as needed.

	// PS.statusText( "Game" );

	// Add any other initialization code you need here.



	PS.gridSize(GRID_WIDTH, GRID_HEIGHT);

	player = PS.spriteSolid(1, 1);
	PS.spriteSolidColor(player, PLAYER_COLOR);
	PS.spritePlane(player, 5);
	PS.spriteMove(player, 8, 8);
	game_time = PS.timerStart(tick_rate, timer);
	PS.statusText("Athena's Blessing");
	// Change this TEAM constant to your team name,
	// using ONLY alphabetic characters (a-z).
	// No numbers, spaces, punctuation or special characters!

	const TEAM = "teamiris";

	// This code should be the last thing
	// called by your PS.init() handler.
	// DO NOT MODIFY IT, except for the change
	// explained in the comment below.

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

/*
PS.touch ( x, y, data, options )
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

var timer = function() {
	var x = PS.spriteMove(player).x;
	var y = PS.spriteMove(player).y;

	if(enemy_spawn===MAX_SPAWN_TIME) {
		var enemySprite = PS.spriteSolid(1,1);
		PS.spriteSolidColor(enemySprite,ENEMY_COLOR);

		var firstSpot = PS.random(4);
		var secondSpot = PS.random(16)-1;

		switch(firstSpot) {
			case 1:
				PS.spriteMove(enemySprite,secondSpot,0);
				break;
			case 2:
				PS.spriteMove(enemySprite,GRID_WIDTH-1,secondSpot);
				break;
			case 3:
				PS.spriteMove(enemySprite,secondSpot,GRID_HEIGHT-1);
				break;
			case 4:
				PS.spriteMove(enemySprite,0,secondSpot);
				break;
		}
		var e_x = PS.spriteMove(enemySprite).x;
		var e_y = PS.spriteMove(enemySprite).y;
		var line = PS.line(e_x,e_y,x,y);
		var nextSpot = line[0];
		PS.spriteCollide(enemySprite, enemyCollide);
		var enemy = {sprite:enemySprite, next:nextSpot};
		enemies.push(enemy);
		enemy_spawn = 0;

		for(var z = 0; z < enemies.length; z++) {
			PS.spriteMove(enemies[z].sprite,enemies[z].next[0],enemies[z].next[1]);
			var x1 = PS.spriteMove(enemies[z].sprite).x;
			var y1 = PS.spriteMove(enemies[z].sprite).y;
			var line = PS.line(x1,y1,x,y);
			var nextSpot = line[0];
			enemies[z].next = nextSpot;
		}

	}

	enemy_spawn+=1;
	var spear_keep = [];

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

	if(player_shoot && spear_time === 0) {
		var spearSprite = PS.spriteSolid(1,1);
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
	game_time = PS.timerStart(tick_rate, timer);
};

PS.touch = function( x, y, data, options ) {
	// Uncomment the following code line
	// to inspect x/y parameters:

	// PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

	// Add code here for mouse clicks/touches
	// over a bead.
};

/*
PS.release ( x, y, data, options )
Called when the left mouse button is released, or when a touch is lifted, over bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.release = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse button/touch is released over a bead.
};

/*
PS.enter ( x, y, button, data, options )
Called when the mouse cursor/touch enters bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.enter = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.enter() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch enters a bead.
};

/*
PS.exit ( x, y, data, options )
Called when the mouse cursor/touch exits bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exit = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.exit() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch exits a bead.
};

/*
PS.exitGrid ( options )
Called when the mouse cursor/touch exits the grid perimeter.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exitGrid = function( options ) {
	// Uncomment the following code line to verify operation:

	// PS.debug( "PS.exitGrid() called\n" );

	// Add code here for when the mouse cursor/touch moves off the grid.
};

/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyDown = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:
	var x = PS.spriteMove(player).x;
	var y = PS.spriteMove(player).y;
	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );
	if(playerControl) {
		switch (key) {
			case PS.KEY_ARROW_UP:
			case 119:
			case 87: {
				if (PS.spriteMove(player).y > 0) {
					PS.spriteMove(player, x, y - 1);
				}
				player_direction = 1;
				break;
			}

			case PS.KEY_ARROW_RIGHT:
			case 100:
			case 68: {
				if (PS.spriteMove(player).x < GRID_WIDTH - 1) {
					PS.spriteMove(player, x + 1, y);
				}
				player_direction = 2;
				break;
			}
			case PS.KEY_ARROW_DOWN:
			case 115:
			case 83: {
				if (PS.spriteMove(player).y < GRID_HEIGHT - 1) {
					PS.spriteMove(player, x, y + 1);
				}
				player_direction = 3;
				break;
			}
			case PS.KEY_ARROW_LEFT:
			case 97:
			case 65: {
				if (PS.spriteMove(player).x > 0) {
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

/*
PS.keyUp ( key, shift, ctrl, options )
Called when a key on the keyboard is released.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyUp = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyUp(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is released.
	switch (key) {
		case PS.KEY_SPACE:
			player_shoot = false;
			break;
	}
};

/*
PS.input ( sensors, options )
Called when a supported input device event (other than those above) is detected.
This function doesn't have to do anything. Any value returned is ignored.
[sensors : Object] = A JavaScript object with properties indicating sensor status; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: Currently, only mouse wheel events are reported, and only when the mouse cursor is positioned directly over the grid.
*/

PS.input = function( sensors, options ) {
	// Uncomment the following code lines to inspect first parameter:

	//	 var device = sensors.wheel; // check for scroll wheel
	//
	//	 if ( device ) {
	//	   PS.debug( "PS.input(): " + device + "\n" );
	//	 }

	// Add code here for when an input event is detected.
};

/*
PS.shutdown ( options )
Called when the browser window running Perlenspiel is about to close.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: This event is generally needed only by applications utilizing networked telemetry.
*/

PS.shutdown = function( options ) {
	// Uncomment the following code line to verify operation:

	// PS.debug( "“Dave. My mind is going. I can feel it.”\n" );

	// Add code here to tidy up when Perlenspiel is about to close.
};

