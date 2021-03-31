/*
game.js for Perlenspiel 3.3.x
Last revision: 2021-03-24 (BM)

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
var color, running, originX, originY;

var RATE = 2;

var BG_COLOR = PS.COLOR_WHITE;

var timerID;

var activeBeads;

PS.init = function( system, options ) {
	// Change this string to your team name
	// Use only ALPHABETIC characters
	// No numbers, spaces or punctuation!

	const TEAM = "teamiris";

	// Begin with essential setup
	// Establish initial grid size

	PS.gridSize( 32, 32 ); // or whatever size you want

	//PS.timerStart(20,);

	PS.border(PS.ALL, PS.ALL, 0);

	PS.data(PS.ALL, PS.ALL, false);

	running = false;

	PS.fade(PS.ALL, PS.ALL, 20);

	PS.gridFade(100);
















	// Install additional initialization code
	// here as needed

	// PS.dbLogin() must be called at the END
	// of the PS.init() event handler (as shown)
	// DO NOT MODIFY THIS FUNCTION CALL
	// except as instructed

	PS.dbLogin( "imgd2900", TEAM, function ( id, user ) {
		if ( user === PS.ERROR ) {
			return PS.dbErase( TEAM );
		}
		PS.dbEvent( TEAM, "startup", user );
		PS.dbSave( TEAM, PS.CURRENT, { discard : true } );
	}, { active : false } );


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


	if (!running) {
		color = [PS.random(256) - 1, PS.random(256) - 1, PS.random(256) - 1];
		BG_COLOR = [PS.random(256) - 1, PS.random(256) - 1, PS.random(256) - 1];

		PS.gridColor(BG_COLOR);

		PS.color(x, y, color);

		PS.data(x, y, true);

		activeBeads = [[x, y]];

		running = true;

		timerID = PS.timerStart(RATE, spread);


	}

};

var spread = function () {

	var length = activeBeads.length;

	var tempArray = [];

	for (var i = 0; i < length; i += 1) {

		var x = activeBeads[i][0];
		var y = activeBeads[i][1];

		if (y > 0 && y < PS.gridSize().height - 1) {

			// check up
			if (PS.data(x, y - 1) === false) {
				PS.color(x, y - 1, color);
				PS.data(x, y - 1, true);

				tempArray.push([x, y - 1]);
			}
			//check down
			if (PS.data(x, y + 1) === false) {
				PS.color(x, y + 1, color);
				PS.data(x, y + 1, true);

				tempArray.push([x, y + 1]);
			}
		}

		if (x > 0 && x < PS.gridSize().width - 1) {
			// check left
			if (PS.data(x + 1, y) === false) {
				PS.color(x + 1, y, color);
				PS.data(x + 1, y, true);

				tempArray.push([x + 1, y]);
			}
			// check right
			if (PS.data(x - 1, y) === false) {
				PS.color(x - 1, y, color);
				PS.data(x - 1, y, true);

				tempArray.push([x - 1, y]);
			}
		}

		// reset color
		PS.color(x, y, BG_COLOR);
	}

	activeBeads = tempArray;

	if (activeBeads.length === 0) {
		running = false;
		PS.data(PS.ALL, PS.ALL, false);
		PS.timerStop(timerID);
	}

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

	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is pressed.
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

