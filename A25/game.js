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

var sliding = false;
var slideTimer;
var slideDirection;

var SLIDE_SPEED = 3;

// 0 for bg, 1 for wall, 2 for death, 3 for goal, 4 for up, 5 for right, 6 for down, 7 for left
var MAP = [
	[0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 1, 0],
	[0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 3, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 7, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 4, 0, 7, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0]
];

var INITIAL_X = 1;
var INITIAL_Y = 12;

var GRID_WIDTH = 15;
var GRID_HEIGHT = 15;

var UP_GLYPH = "˄";
var RIGHT_GLYPH = "❯";
var DOWN_GLYPH = "˅";
var LEFT_GLYPH = "❮";
var DEATH_GLYPH = "☠";
var GOAL_GLYPH = "⚐";

var BG_COLOR = PS.makeRGB(94, 223, 255);
var WALL_COLOR = 0xdbf1ff;
var WALL_BORDER_COLOR = 0x3a9cda;
var DEATH_COLOR = 0xff0000;
var GOAL_COLOR = 0x00ff00;
var ARROW_BG_COLOR = 0x285073;
var ARROW_COLOR = 0xffffff;
var PLAYER_COLOR = 0x734d28;

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

	PS.statusText("Icescape");

	PS.borderColor(PS.ALL, PS.ALL, BG_COLOR);

	PS.audioLoad("fx_swoosh");
	PS.audioLoad("fx_ding");
	PS.audioLoad("fx_blast2");
	PS.audioLoad("fx_squish");

	PS.gridSize( GRID_WIDTH, GRID_HEIGHT );


	player = PS.spriteSolid(1, 1);
	PS.spriteSolidColor(player, PLAYER_COLOR);
	PS.spriteMove(player, INITIAL_X, INITIAL_Y);
	PS.spritePlane(player, 5);


	PS.gridPlane(0);
	PS.color(PS.ALL, PS.ALL, BG_COLOR);
	PS.gridColor(BG_COLOR);
	PS.gridShadow(true, 0xffffff);
	PS.alpha(INITIAL_X, INITIAL_Y, 255);

	for (var x = 0; x < GRID_WIDTH; x += 1) {
		for (var y = 0; y < GRID_HEIGHT; y += 1) {
			var newColor = PS.unmakeRGB(BG_COLOR, {});

			newColor.r += PS.random(30);
			newColor.g += PS.random(20);
			newColor.b -= PS.random(25);
			//PS.debug("new color: " + newColor.r + ", " + newColor.g + ", " + newColor.b + "\n");

			PS.color(x, y, newColor);
		}
	}

	PS.gridPlane(5);
	PS.border(PS.ALL, PS.ALL, 0);
	PS.gridPlane(0);



	for (var y = 0; y < GRID_HEIGHT; y += 1) {
		for (var x = 0; x < GRID_WIDTH; x += 1) {
			switch (MAP[y][x]) {

				case 1:  // wall
					PS.color(x, y, WALL_COLOR);
					PS.border(x, y, 2);
					PS.borderColor(x, y, WALL_BORDER_COLOR);
					PS.data(x, y, "wall");
					break;

				case 2:  // death
					PS.color(x, y, DEATH_COLOR);
					PS.glyph(x, y, DEATH_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					break;

				case 3:  // goal
					PS.color(x, y, GOAL_COLOR);
					PS.glyph(x, y, GOAL_GLYPH);

					break;

				case 4:  // up arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, UP_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.data(x, y, 1);
					break;

				case 5:  // right arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, RIGHT_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.data(x, y, 2);
					break;

				case 6:  // down arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, DOWN_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.data(x, y, 3);
					break;

				case 7:  // left arrow
					PS.color(x, y, ARROW_BG_COLOR);
					PS.glyph(x, y, LEFT_GLYPH);
					PS.glyphColor(x, y, ARROW_COLOR);
					PS.radius(x, y, 10);
					PS.data(x, y, 4);
					break;
			}
		}
	}


	// This is also a good place to display
	// your game title or a welcome message
	// in the status line above the grid.
	// Uncomment the following code line and
	// change the string parameter as needed.

	// PS.statusText( "Game" );

	// Add any other initialization code you need here.

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

PS.touch = function( x, y, data, options ) {
	// Uncomment the following code line
	// to inspect x/y parameters:

	// PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

	// Add code here for mouse clicks/touches
	// over a bead.
};

// slide in the specified direction until you hit a wall
var slide = function() {
	sliding = true;

	PS.glyphAlpha(PS.ALL, PS.ALL, 255);

	var x = PS.spriteMove(player).x;
	var y = PS.spriteMove(player).y;

	PS.glyphAlpha(x, y, 0);


	// arrow block
	if (PS.data(x, y) !== 0) {
		slideDirection = PS.data(x, y);
		PS.audioPlay("fx_swoosh", {volume: 0.3});
	}

	// death block
	if (PS.color(x, y) === DEATH_COLOR) {
		PS.spriteMove(player, INITIAL_X, INITIAL_Y);
		PS.audioPlay("fx_blast2", {volume: 0.2});
		sliding = false;
		slideDirection = 0;
		PS.glyphAlpha(x, y, 255);
	}

	// goal block
	if (PS.color(x, y) === GOAL_COLOR) {
		PS.spriteMove(player, INITIAL_X, INITIAL_Y);
		PS.audioPlay("fx_ding", {volume: 0.3});
		sliding = false;
		slideDirection = 0;
		PS.glyphAlpha(x, y, 255);
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
	if (nx < 0 || nx >= GRID_WIDTH || ny < 0 || ny >= GRID_HEIGHT || PS.data(nx, ny) === "wall") {
		PS.audioPlay("fx_squish", {volume: 0.2});
		return false;
	} else {
		return true;
	}
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
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is pressed.
 	if (!sliding) {
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

