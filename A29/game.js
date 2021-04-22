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
var levelFiles = ["map1.gif", "map2.gif", "map3.gif", "map4.gif", "map5.gif", "map6.gif", "map7.gif", "map8.gif", "map9.gif", "map10.gif", "map11.gif", "map12.gif", "map13.gif"];
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
var PORTAL_GLYPH = "◎";

// TILE COLORS
var BG_COLOR = PS.makeRGB(94, 223, 255);
var WALL_COLOR = 0xdbf1ff;
var WALL_BORDER_COLOR = 0x3a9cda;
var DEATH_COLOR = 0xa50c3e;
var DEATH_GLYPH_COLOR = 0xff6b83;
var GOAL_COLOR = 0x008241;
var GOAL_GLYPH_COLOR = 0x44ffa1;
var ARROW_BG_COLOR = 0x285073;
var ARROW_COLOR = 0xffffff;
var PLAYER_COLOR = 0x734d28;
var COIN_COLOR = 0xfcce43;
var COIN_GLYPH_COLOR = 0x553a0e;
var PORTAL_COLOR_1 = 0xff671c;
var PORTAL_COLOR_2 = 0xf553cd;
var PORTAL_GLYPH_COLOR = 0xffffff;

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
	PS.audioLoad("fx_powerup8");
	PS.audioLoad("fx_click");

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
	PS.gridPlane(0); //e


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


PS.touch = function( x, y, data, options ) {

	if (state === 0) {
		var levelInt = PS.data(x, y);
		if ((levelInt <= levelFiles.length)) {

			if (levelsUnlocked[levelInt]) {    // REAL VERSION
			//if (true) {                              // DEBUG VERSION
				currentLevel = levelInt;
				drawLevel();

				PS.audioPlay("fx_ding", {volume: 0.3});
			} else {
				PS.audioPlay("fx_uhoh", {volume: 0.5});
			}
		}
	} else {
		if (PS.glyph(x, y) === 11119 && !sliding) {  // RESTART

			PS.audioPlay("fx_click", {volume: 0.2});
			coinsCollected -= coinCache;
			slideDirection = 0;
			drawLevel();
			sliding = false;

		} else if (PS.glyph(x, y) === 11176 && !sliding) {  // LEVEL SELECT

			PS.audioPlay("fx_click", {volume: 0.2});
			coinsCollected = 0;
			drawLevelSelect();
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
				case PORTAL_PIXEL_1:
					array[y].push(10);
					break;
				case PORTAL_PIXEL_2:
					array[y].push(11);
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


var drawLevel = function() {

	if (delayTimer !== "") {
		PS.timerStop(delayTimer);
		delayTimer = "";
	}

	var map = levels[currentLevel];

	coinCache = 0;


	state = 1;
	sliding = false;

	updateCoins();

	levelHeight = map.length;
	levelWidth = map[0].length + 1;



	PS.gridSize(levelWidth, levelHeight);

	PS.gridColor(BG_COLOR);

	PS.border(levelWidth-1, PS.ALL, 0);
	PS.color(levelWidth-1, PS.ALL, 0x3a3a3a);

	PS.border(levelWidth-1, 0, 3);
	PS.color(levelWidth-1, 0, 0xc9c9c9);
	PS.glyph(levelWidth-1, 0, "⭯");
	PS.border(levelWidth-1, 1, 3);
	PS.color(levelWidth-1, 1, 0xc9c9c9);
	PS.glyph(levelWidth-1, 1, "⮨");


	var portalCoord1_1 = 0;
	var portalCoord1_2 = 0;
	var portalCoord2_1 = 0;
	var portalCoord2_2 = 0;

	for (var y = 0; y < levelHeight; y += 1) {
		for (var x = 0; x < levelWidth; x += 1) {
			PS.gridPlane(0);
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
					PS.glyphColor(x, y, DEATH_GLYPH_COLOR);
					PS.radius(x, y, 10);
					PS.border(x, y, 2);
					PS.borderColor(x, y, DEATH_GLYPH_COLOR)
					break;

				case 3:  // goal
					PS.color(x, y, GOAL_COLOR);
					PS.glyph(x, y, GOAL_GLYPH);
					PS.glyphColor(x, y, GOAL_GLYPH_COLOR);
					PS.radius(x, y, 10);
					PS.border(x, y, 2);
					PS.borderColor(x, y, GOAL_GLYPH_COLOR);
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

				case 10: // portal 1
					PS.color(x, y, PORTAL_COLOR_1);
					PS.glyph(x, y, PORTAL_GLYPH);
					PS.glyphColor(x, y, PORTAL_GLYPH_COLOR);
					PS.radius(x, y, 50);

					if (portalCoord1_1 === 0) {
						portalCoord1_1 = [x, y];
					} else {
						portalCoord1_2 = [x, y];
					}
					break;

				case 11: // portal 2
					PS.color(x, y, PORTAL_COLOR_2);
					PS.glyph(x, y, PORTAL_GLYPH);
					PS.glyphColor(x, y, PORTAL_GLYPH_COLOR);
					PS.radius(x, y, 50);

					if (portalCoord2_1 === 0) {
						portalCoord2_1 = [x, y];
					} else {
						portalCoord2_2 = [x, y];
					}
					break;

			}
		}
	}

	var pos = PS.spriteMove(player);
	PS.spriteMove(player, 0, 0);
	PS.spriteMove(player, pos.x, pos.y);

	if (portalCoord1_1 !== 0) {
		var x1 = portalCoord1_1[0];
		var y1 = portalCoord1_1[1];
		var x2 = portalCoord1_2[0];
		var y2 = portalCoord1_2[1];

		PS.data(x1, y1, portalCoord1_2);
		PS.data(x2, y2, portalCoord1_1);
	}
	if (portalCoord2_1 !== 0) {
		var x1 = portalCoord2_1[0];
		var y1 = portalCoord2_1[1];
		var x2 = portalCoord2_2[0];
		var y2 = portalCoord2_2[1];

		PS.data(x1, y1, portalCoord2_2);
		PS.data(x2, y2, portalCoord2_1);
	}

	//sliding = false;
}


var drawLevelSelect = function() {

	state = 0;

	if (delayTimer != "") {
		PS.timerStop(delayTimer);
		delayTimer = "";

	}

	PS.statusText("Select a level:");
	PS.gridSize(levelFiles.length, 1);

	for (var l = 0; l < levelFiles.length; l += 1) {

			PS.glyph(l, 0, (l+1).toString(16));
			PS.glyphColor(l, 0, 0x000000);
			PS.glyphAlpha(l, 0, PS.OPAQUE);
			PS.data(l, 0, l);

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
	PS.statusText("WASD/Arrow Keys | Coins Collected: " + coinsCollected);
}


var slide = function() { // slide in the specified direction until you hit a wall
	sliding = true;

	PS.glyphAlpha(PS.ALL, PS.ALL, 255);	// reset the glyph alphas to opaque, to undo the transparency that we're doing when the player moves over a bead with a glyph

	var x = PS.spriteMove(player).x;
	var y = PS.spriteMove(player).y;

	PS.glyphAlpha(x, y, 0); // make the current bead's glyph transparent, so it doesn't render on top of the player


	// arrow block
	if (PS.data(x, y) >= 1 && PS.data(x, y) <= 4) {
		slideDirection = PS.data(x, y);
		PS.audioPlay("fx_swoosh", {volume: 0.3});
	}

	// death block
	if (PS.color(x, y) === DEATH_COLOR) {

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
		delayTimer = PS.timerStart(40, drawLevel);
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
		levelsUnlocked[currentLevel + 1] = true;
		coinCache = 0;

		if (currentLevel < levels.length - 1) {
			currentLevel += 1;
			delayTimer = PS.timerStart(40, drawLevel);
		} else {
			winGame();

		}
		sliding = false;
		PS.timerStop(slideTimer);
		return;
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

	// portals
	if (PS.color(x, y) === PORTAL_COLOR_1 || PS.color(x, y) === PORTAL_COLOR_2) {

		PS.audioPlay("fx_powerup8", {volume: 0.3});
		PS.glyphAlpha(x, y, 255);

		var nx = PS.data(x, y)[0];
		var ny = PS.data(x, y)[1];

		switch(slideDirection) {
			case 1:
				ny -= 1;
				break;
			case 2:
				nx += 1;
				break;
			case 3:
				ny += 1;
				break;
			case 4:
				nx -= 1;
				break;
		}

		PS.spriteMove(player, nx, ny);
		sliding = true;
	}

	if (!sliding) {
		PS.timerStop(slideTimer);
	}

}


var checkWall = function (nx, ny) { // if the new position is accessible, return true. if it's a wall or the edge of the board, return false
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
}


PS.release = function( x, y, data, options ) {};


PS.enter = function( x, y, data, options ) {};


PS.exit = function( x, y, data, options ) {};


PS.exitGrid = function( options ) {};


PS.keyDown = function( key, shift, ctrl, options ) {

 	if (!sliding && state === 1 && delayTimer === "") {
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


PS.keyUp = function( key, shift, ctrl, options ) {};


PS.input = function( sensors, options ) {};


PS.shutdown = function( options ) {};

