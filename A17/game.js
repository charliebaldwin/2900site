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

var RATE = 15; //used for timer tick rate

var BG_COLOR = PS.COLOR_WHITE;

var timerID; //var that contains global timer name

var activeBeads; //array of which beads are currently colored

var CLICK_MAX = 3;

var origins;

PS.init = function( system, options ) {
	// Change this string to your team name
	// Use only ALPHABETIC characters
	// No numbers, spaces or punctuation!
	const TEAM = "iris";

	// Begin with essential setup
	// Establish initial grid size

	PS.gridSize( 32, 32 ); // or whatever size you want

	// Install additional initialization code
	// here as needed

	PS.border(PS.ALL, PS.ALL, 0);

	PS.data(PS.ALL, PS.ALL, false); //Set all beads as false, meaning they arent being colored and are able to.

	running = 0;

	PS.fade(PS.ALL, PS.ALL, 20);

	PS.statusText("Digital Kaleidoscope");

	PS.gridFade(100);

	color = [];
	activeBeads = [];
	origins = [];
	for(var d = 0; d < CLICK_MAX; d+=1) {
		color.push([]);
		activeBeads.push([]);
		origins.push([]);
	}

	// PS.dbLogin() must be called at the END
	// of the PS.init() event handler (as shown)
	// DO NOT MODIFY THIS FUNCTION CALL
	// except as instructed


	//
	// PS.dbLogin( "imgd2900", TEAM, function ( id, user ) {
	// 	if ( user === PS.ERROR ) {
	// 		return;
	// 	}
	// 	PS.dbEvent( TEAM, "startup", user );
	// 	PS.dbSend( TEAM, PS.CURRENT, { discard : true } );
	// }, { active : true } );


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

	// Does not support clicking grid corners. Checks global boolean to see if a color animation is in progress.
	// Only can do 1 color change at a time.
	if (running < 3) {
		if(running==0) {
			timerID = PS.timerStart(RATE, spread);
		}
		PS.data(x, y, true); //Data true means the bead is colored.
		for(var p = 0; p < CLICK_MAX; p+=1) {
			if (activeBeads[p].length == 0) {
				color[p] = [PS.random(256) - 1, PS.random(256) - 1, PS.random(256) - 1];
				BG_COLOR = [PS.random(256) - 1, PS.random(256) - 1, PS.random(256) - 1];

				PS.gridColor(BG_COLOR);
				origins[p] = [x,y];
				PS.debug("Origin values set are origin set " + p + " with values x:" + origins[p][0] + " and y:" + origins[p][1] + "\n");
				PS.color(x, y, color[p]);
				activeBeads[p] = [[x, y]]; // Sets current click as part of the active beads to be checked in spread()
				break;
			}
		}
		running += 1;
	}

};

var spread = function () {
	//PS.debug("Spread being called, MAX is " + CLICK_MAX + "\n");
	//var length = activeBeads.length;

	var tempArray = []; //A temporary array of new beads that are colored from active beads
	//PS.debug("I got past tempArray call and activeBeads is " + activeBeads.length + "\n");
	for (var z = 0; z < CLICK_MAX; z += 1) {
		PS.debug("Looping first loop\n");
		if(activeBeads[z].length!=0) {
			PS.debug("I got through activeBeads length!=0\n");
			for (var i = 0; i < activeBeads[z].length; i += 1) { //Goes through all currently active beads

				var x = activeBeads[z][i][0];
				var y = activeBeads[z][i][1];
				PS.debug("I am activeBeads " + z + " of size " + activeBeads[z].length + "\n");
				// skips checking up if bead is on top edge
				if (y > 0) {
					// check up
					PS.debug("Origin values are origin " + z + " with values x:" + origins[z][0] + " and y:" + origins[z][1] + "\n");
					if (origins[z][1] > y-1) {
						PS.color(x, y - 1, color[z]);
						//PS.data(x, y - 1, true);
						tempArray.push([x, y - 1]);
					}
				}

				// skips checking down if bead is on bottom edge
				if (y < PS.gridSize().height - 1) {
					//check down
					if (origins[z][1] < y+1) {
						PS.color(x, y + 1, color[z]);
						//PS.data(x, y + 1, true);
						tempArray.push([x, y + 1]);
					}
				}

				// skips checking right if bead is on right edge
				if (x < PS.gridSize().width - 1) {
					// check right
					if (origins[z][0] > x-1) {
						PS.color(x + 1, y, color[z]);
						//PS.data(x + 1, y, true);
						tempArray.push([x + 1, y]);
					}
				}

				//skips checking left if bead is on left edge
				if (x > 0) {
					// check left
					if (origins[z][0] < x+1) {
						PS.color(x - 1, y, color[z]);
						//PS.data(x - 1, y, true);
						tempArray.push([x - 1, y]);
					}
				}

				// reset color
				PS.color(x, y, BG_COLOR);
			}

			activeBeads[z] = tempArray; //Wipe out old active beads, set tempArray as new activeBeads

			if (activeBeads[z].length === 0) { //Checks if board is done transitioning, if it is, allow more clicks.
				running -= 1;
				origins[z] = [];
				PS.data(PS.ALL, PS.ALL, false);
				PS.audioPlay("fx_drip2", {volume: 0.1});
				if (running == 0) {
					PS.timerStop(timerID);
				}
			}
		}
	}
	//PS.debug("End of spread\n");
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

