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


var player;

var coinsCollected = 0;
var coinCache = 0;

var sliding = false;
var slideTimer;
var slideDirection;

var SLIDE_SPEED = 3;

var levels = [];
var currentLevel = 0;
var levelFiles = ["map1.gif", "map2.gif", "map3.gif", "map4.gif", "map6.gif", "map7.gif", "map8.gif"];
var levelsUnlocked = [];
var loadingLevel = 0;

var state;

var delayTimer = "";


var GRID_WIDTH = 15;
var GRID_HEIGHT = 15;

var levelWidth;
var levelHeight;

var UP_GLYPH = "⮝";
var RIGHT_GLYPH = "⮞";
var DOWN_GLYPH = "⮟";
var LEFT_GLYPH = "⮜";
var DEATH_GLYPH = "☠";
var GOAL_GLYPH = "⚑";

// TILE COLORS
var BG_COLOR = PS.makeRGB(94, 223, 255);
var WALL_COLOR = 0xdbf1ff;
var WALL_BORDER_COLOR = 0x3a9cda;
var DEATH_COLOR = 0xff0000;
var GOAL_COLOR = 0x00ff00;
var ARROW_BG_COLOR = 0x285073;
var ARROW_COLOR = 0xffffff;
var PLAYER_COLOR = 0x734d28;
var COIN_COLOR = 0xffee00;
var COIN_GLYPH_COLOR = 0xa3990b;


// IMAGE PIXEL COLORS FOR MAPMAKING
var BG_PIXEL = 0x000000;
var GOAL_PIXEL = 0x00ff00;
var DEATH_PIXEL = 0xff0000;
var WALL_PIXEL = 0xffffff;
var COIN_PIXEL = 0xffff00;
var PLAYER_PIXEL = 0xff00ff;
var UP_PIXEL = 0x0000ff;
var RIGHT_PIXEL = 0x0066ff;
var DOWN_PIXEL = 0x00aaff;
var LEFT_PIXEL = 0x00ddff;
var PORTAL_PIXEL_1 = 0xff8800;
var PORTAL_PIXEL_2 = 0x5500ff;
var PORTAL_PIXEL_3 = 0x00ffff;

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.init = function( system, options ) {

	PS.imageLoad(levelFiles[loadingLevel], decodeImage, 1);


	PS.borderColor(PS.ALL, PS.ALL, BG_COLOR);

	PS.audioLoad("fx_swoosh");
	PS.audioLoad("fx_ding");
	PS.audioLoad("fx_blast2");
	PS.audioLoad("fx_squish");
	PS.audioLoad("fx_coin3");
	PS.audioLoad("fx_uhoh");
	PS.audioLoad("fx_tada");

	PS.gridSize( GRID_WIDTH, GRID_HEIGHT );

	player = PS.spriteSolid(1, 1);
	PS.spriteSolidColor(player, PLAYER_COLOR);
	PS.spritePlane(player, 5);


	PS.gridPlane(0);
	PS.color(PS.ALL, PS.ALL, BG_COLOR);
	PS.gridColor(BG_COLOR);
	PS.gridShadow(true, 0xffffff);

	// remove grid borders from sprite layer
	PS.gridPlane(5);
	PS.border(PS.ALL, PS.ALL, 0);
	PS.gridPlane(0);

	// create control button area
	// PS.color (PS.ALL, GRID_HEIGHT, 0xffffff);
	// PS.color (PS.ALL, GRID_HEIGHT + 1, 0xffffff);
	// PS.color (PS.ALL, GRID_HEIGHT + 2, 0xffffff);
	// PS.border(PS.ALL, GRID_HEIGHT, {top: 2});

	if (levelsUnlocked.length === 0) {
		levelsUnlocked.push(true);
	} else {
		levelsUnlocked.push(true);
	}

	state = 0;
	drawLevelSelect();



	// LOGIN CODE
	const TEAM = "iris";

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


PS.touch = function( x, y, data, options ) {
	var levelInt = parseInt(PS.glyph(x, y))-48;
	if ((levelInt >= 1 && levelInt <= levelFiles.length)){
		if (levelsUnlocked[levelInt - 1]) {
			currentLevel = parseInt(PS.glyph(x, y)) - 49;
			drawLevel(levels[currentLevel]);
			PS.audioPlay("fx_ding", {volume: 0.3});
		} else {
			PS.audioPlay("fx_uhoh", {volume: 0.5});
		}
	}
};

var decodeImage = function(mapImage) {
	var w = mapImage.width;
	var h = mapImage.height;
	var i = 0;

	var array = [];

	// 0 for bg, 1 for wall, 2 for death, 3 for goal, 4 for up, 5 for right, 6 for down, 7 for left, 8 for coin, 9 for player
	for (var y = 0; y < h; y += 1) {

		array.push([]);

		for (var x = 0; x < w; x += 1) {

			switch (mapImage.data[i]) {
				case BG_PIXEL:
					array[y].push(0);
					break;
				case WALL_PIXEL:
					array[y].push(1);
					break;
				case DEATH_PIXEL:
					array[y].push(2);
					break;
				case GOAL_PIXEL:
					array[y].push(3);
					break;
				case UP_PIXEL:
					array[y].push(4);
					break;
				case RIGHT_PIXEL:
					array[y].push(5);
					break;
				case DOWN_PIXEL:
					array[y].push(6);
					break;
				case LEFT_PIXEL:
					array[y].push(7);
					break;
				case COIN_PIXEL:
					array[y].push(8);
					break;
				case PLAYER_PIXEL:
					array[y].push(9);
					break;
			}

			i += 1;
		}

	}
	levels.push(array);

	if (loadingLevel < levelFiles.length - 1 ) {
		loadingLevel += 1;
		var levelLocation = levelFiles[loadingLevel]
		PS.imageLoad(levelLocation, decodeImage, 1);
	}

}


var drawLevel = function(map) {

	state = 1;

	PS.statusText("Icescape! (coins collected: " + coinsCollected + ")");

	levelHeight = map.length;
	levelWidth = map[0].length;

	PS.gridSize(levelWidth, levelHeight);

	PS.gridColor(BG_COLOR);

	for (var y = 0; y < levelHeight; y += 1) {
		for (var x = 0; x < levelWidth; x += 1) {
			switch (map[y][x]) {

				case 0: // ground
					var newColor = PS.unmakeRGB(BG_COLOR, []);

					newColor[0] += PS.random(10);
					newColor[1] += PS.random(10);
					newColor[2] -= PS.random(10);

					PS.color(x, y, newColor);
					PS.border(x, y, 0);
					break;

				case 1:  // wall
					var newColor = PS.unmakeRGB(WALL_COLOR, []);

					newColor[0] -= PS.random(10);
					newColor[1] -= PS.random(10);
					//newColor[2] -= PS.random(10);
					PS.color(x, y, newColor);
					PS.border(x, y, 2);
					PS.borderColor(x, y, WALL_BORDER_COLOR);
					PS.data(x, y, "wall");

					if (y > 0) {
						if (map[y-1][x] === 1) {
							PS.border(x, y, {top: 0});
						}
					}
					if (y < PS.gridSize().height-1) {
						if (map[y+1][x] === 1) {
							PS.border(x, y, {bottom: 0});
						}
					}
					if (x > 0) {
						if (map[y][x-1] === 1) {
							PS.border(x, y, {left: 0});
						}
					}
					if (x < PS.gridSize().width-1) {
						if (map[y][x+1] === 1) {
							PS.border(x, y, {right: 0});
						}
					}
					break;

				case 2:  // death
					PS.color(x, y, DEATH_COLOR);
					PS.glyph(x, y, DEATH_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.border(x, y, 2);
					PS.borderColor(x, y, ARROW_COLOR)
					break;

				case 3:  // goal
					PS.color(x, y, GOAL_COLOR);
					PS.glyph(x, y, GOAL_GLYPH);
					PS.radius(x, y, 10);
					PS.border(x, y, 2);
					PS.borderColor(x, y, 0x000000);
					break;

				case 4:  // up arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, UP_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.border(x, y, 0);
					PS.data(x, y, 1);
					break;

				case 5:  // right arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, RIGHT_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.data(x, y, 2);
					PS.border(x, y, 0);
					break;

				case 6:  // down arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, DOWN_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.border(x, y, 0);
					PS.data(x, y, 3);
					break;

				case 7:  // left arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, LEFT_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.border(x, y, 0);
					PS.data(x, y, 4);
					break;

				case 8: // coin
					PS.color(x, y, COIN_COLOR);
					PS.glyph(x, y, "$");
					PS.glyphColor(x, y, COIN_GLYPH_COLOR);
					PS.radius(x, y, 50);
					PS.borderColor(x, y, COIN_GLYPH_COLOR);
					PS.border(x, y, 2);
					break;

				case 9: // player
					PS.spriteMove(player, x, y);
					PS.alpha(x, y, 0);
					PS.border(x, y, 0);
					break;
			}
		}
	}
}



var drawLevelSelect = function() {

	if (delayTimer != "") {
		PS.timerStop(delayTimer);
	}

	PS.statusText("Select a level:");
	PS.gridSize(levelFiles.length, 1);
	for (var l = 0; l < levelFiles.length; l += 1) {
		PS.glyph(l, 0, (l+1).toString());
		PS.glyphColor(l, 0, 0x000000);
		PS.glyphAlpha(l, 0, PS.OPAQUE);

		if (levelsUnlocked[l]) {
			PS.color(l, 0, 0xffffff);
		} else {
			PS.color(l, 0, 0x444444);
		}
		PS.alpha(l, 0, 255);
	}

	PS.gridPlane(0);
	//PS.color(PS.ALL, PS.ALL, BG_COLOR);
	PS.gridColor(BG_COLOR);
	PS.gridShadow(true, 0xffffff);

}



var updateCoins = function() {
	PS.statusText("Icescape! (coins collected: " + coinsCollected + ")");
}



// slide in the specified direction until you hit a wall
var slide = function() {
	sliding = true;

	PS.glyphAlpha(PS.ALL, PS.ALL, 255);	// reset the glyph alphas to opaque, to undo the transparency that we're doing when the player moves over a bead with a glyph

	var x = PS.spriteMove(player).x;
	var y = PS.spriteMove(player).y;

	PS.glyphAlpha(x, y, 0); // make the current bead's glyph transparent, so it doesn't render on top of the player


	// arrow block
	if (PS.data(x, y) !== 0) {
		slideDirection = PS.data(x, y);
		PS.audioPlay("fx_swoosh", {volume: 0.3});
	}

	// death block
	if (PS.color(x, y) === DEATH_COLOR) {
		drawLevel(levels[currentLevel]);
		PS.audioPlay("fx_blast2", {volume: 0.2});
		sliding = false;
		slideDirection = 0;
		PS.glyphAlpha(x, y, 255);
		coinsCollected -= coinCache;
		coinCache = 0;
		if(coinsCollected <= 2) {
			coinsCollected = 0;
		}
		else {
			coinsCollected -= 2;
		}
		updateCoins();
	}

	// coin
	if (PS.color(x, y) === COIN_COLOR) {
		PS.color(x, y, BG_COLOR);
		PS.border(x, y, 0);
		PS.radius(x, y, 0);
		PS.glyph(x, y, "");
		PS.audioPlay("fx_coin3", {volume: 0.3});
		coinsCollected += 1;
		coinCache +=1;
		updateCoins();
	}

	// goal block
	if (PS.color(x, y) === GOAL_COLOR) {

		PS.audioPlay("fx_ding", {volume: 0.3});
		sliding = false;
		slideDirection = 0;
		PS.glyphAlpha(x, y, 255);
		levelsUnlocked[currentLevel] = true;
		coinCache = 0;

		if (currentLevel < levels.length - 1) {
			currentLevel += 1;
			drawLevel(levels[currentLevel]);
		} else {
			PS.timerStop(slideTimer);
			winGame();
			return;
		}
	}

	switch (slideDirection) {
		case 1: // up
			if (checkWall(x,  y - 1)) {
				PS.spriteMove(player, x, y - 1);
			} else {
				sliding = false;
			}
			break;
		case 2: // right
			if (checkWall(x + 1, y)) {
				PS.spriteMove(player, x + 1, y);
			} else {
				sliding = false;
			}
			break;
		case 3: // down
			if (checkWall(x, y + 1)) {
				PS.spriteMove(player, x, y + 1);
			} else {
				sliding = false;
			}
			break;
		case 4: // left
			if (checkWall(x - 1, y)) {
				PS.spriteMove(player, x - 1, y);
			} else {
				sliding = false;
			}
			break;
	}

	if (!sliding) {
		PS.timerStop(slideTimer);
	}

}

// if the new position is accessible, return true. if it's a wall or the edge of the board, return false
var checkWall = function (nx, ny) {
	if (nx < 0 || nx > GRID_WIDTH || ny < 0 || ny > GRID_HEIGHT || PS.data(nx, ny) === "wall") {
		PS.audioPlay("fx_squish", {volume: 0.2});
		return false;
	} else {
		return true;
	}
}

var winGame = function () {
	PS.statusText("You escaped the icy cave! Total coins: " + coinsCollected);
	PS.audioPlay("fx_tada");
	delayTimer = PS.timerStart(180, drawLevelSelect);

	//drawLevelSelect();
	state = 0;
}

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

 	if (!sliding && state === 1) {
		switch (key) {
			case PS.KEY_ARROW_UP:
			case 119:
			case 87: {
				slideDirection = 1;
				slideTimer = PS.timerStart(SLIDE_SPEED, slide);
				sliding = true;
				break;
			}

			case PS.KEY_ARROW_RIGHT:
			case 100:
			case 68: {
				slideDirection = 2;
				slideTimer = PS.timerStart(SLIDE_SPEED, slide);
				sliding = true;
				break;
			}
			case PS.KEY_ARROW_DOWN:
			case 115:
			case 83: {
				slideDirection = 3;
				slideTimer = PS.timerStart(SLIDE_SPEED, slide);
				sliding = true;
				break;
			}
			case PS.KEY_ARROW_LEFT:
			case 97:
			case 65: {
				slideDirection = 4;
				slideTimer = PS.timerStart(SLIDE_SPEED, slide);
				sliding = true;
				break;
			}

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

