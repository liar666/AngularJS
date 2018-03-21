var app = angular.module('myGame', [ ]);

// app.constant('TERRAIN_CONFIG', {
//     PIXEL_SIZE: 4,                        // Width of each line drawn
//     CANVAS_WIDTH: document.getElementById("background").width, // Size of the game canvas
//     TRACK_SIZE: CANVAS_WIDTH/4,           // Size of the track where the player can move
//     MOBILITY_RANGE: TRACK_SIZE/2,         // Max shift of the new line w/r previous one
//     FG_COLOR: "black",                    // Color of the foreground of the terrain
//     BG_COLOR: "white"                     // Color of the background of the terrain
// });

// app.constant('PLAYER_CONFIG', {
//     COLOR: "red",                    // Color of the player
//     MIN_PLAYER_POS: 1,               // Leftmost position of the player
//     MAX_PLAYER_POS: CANVAS_WIDTH-1   // Rightmost position of the player
// });

// app.constant('GAME_CONFIG', {
//     SCORE_COLOR: "green",
//     SPEED: 1.0,            // Starting with slow speed of 1s between new line creation
//     SPEED_DEC: 8.0/10.0,   // The amount of speed increase (in fact timeout decrease)
//     SCORE_MOD: 15          // Every X score points, the speed increases
// });

app.controller('GameController', function($scope) {

    fgCanvas = document.getElementById("foreground");
    bgCanvas = document.getElementById("background");

    $scope.TERRAIN_CONFIG = {
        PIXEL_SIZE: 4,                        // Line-Width of each line to be drawn (±zoom)
        CANVAS_WIDTH: bgCanvas.width,         // Width of the game canvas
        CANVAS_HEIGHT: bgCanvas.height,       // Height of the game canvas
        TRACK_SIZE: bgCanvas.width/4,         // Size of the track where the player can move
        MOBILITY_RANGE: bgCanvas.width/6,     // Max shift of the new line w/r previous one
        FG_COLOR: "black",                    // Color of the foreground of the terrain
        BG_COLOR: "white"                     // Color of the background of the terrain
    };

    $scope.PLAYER_CONFIG = {
        COLOR: "red",                     // Color of the player
        MIN_PLAYER_POS: 1,                // Leftmost position of the player
        MAX_PLAYER_POS: bgCanvas.width-1  // Rightmost position of the player
    };

    $scope.GAME_CONFIG = {
        SCORE_COLOR: "green",
        SPEED: 1.0,            // Starting with slow speed of 1s between new line creation
        SPEED_DEC: 8.0/10.0,   // The amount of speed increase (in fact timeout decrease)
        SCORE_MOD: 15          // Every X score points, the speed increases
    };

    $scope.currentGame = {
        terrain: [],      // [ {newCenter, NewTrackWidth} ]
        lastCenter: {},
        playerPos: {},       // x position in the last line
        dead: false
    };

    // Create a new line for the terrain
    computeLine = function(lastCenter) {
        mobRange = $scope.TERRAIN_CONFIG.MOBILITY_RANGE;
        canWidth = $scope.TERRAIN_CONFIG.CANVAS_WIDTH;
        trSize   = $scope.TERRAIN_CONFIG.TRACK_SIZE;
        newCenter = Math.round(lastCenter+Math.random()*2*mobRange-mobRange);
        if (newCenter<mobRange) { newCenter = mobRange; }
        if (newCenter>(canWidth-mobRange)) { newCenter = canWidth-mobRange; }
        newTrackWidth = Math.round(trSize-4*Math.random());
        return({ center: newCenter, width: newTrackWidth });
    }

    // Initializes the terrain
    // Optimization: we store only the "centers" and "track_width" for each line
    initGame = function($scope) {
        lastCenter = $scope.TERRAIN_CONFIG.TRACK_SIZE/2;
        for (var l=0 ; l<$scope.TERRAIN_CONFIG.CANVAS_HEIGHT ; l++) {
            newCenterAndTrackWidth = computeLine(lastCenter);
            $scope.currentGame.terrain.push(newCenterAndTrackWidth);
            $scope.currentGame.lastCenter = newCenter;
            $scope.currentGame.playerPos = lastCenter;
        }
        $scope.currentGame.dead = false;
    }

    // Draws the terrain on the window canvas
    drawTerrain = function($scope) {
        PSIZE = $scope.TERRAIN_CONFIG.PIXEL_SIZE;
        canvasCtxt = document.getElementById('background').getContext('2d');
        for (var l=0 ; l<$scope.currentGame.terrain.length ; l++) {
            currCenterAndWidth = $scope.currentGame.terrain[l];
            canvasCtxt.beginPath();
            canvasCtxt.lineWidth = PSIZE;
            canvasCtxt.strokeStyle = $scope.TERRAIN_CONFIG.FG_COLOR;
            // rightmost part of the line
            canvasCtxt.moveTo(0, l*PSIZE);
            canvasCtxt.lineTo((currCenterAndWidth.center-currCenterAndWidth.width/2)*PSIZE, l*PSIZE);
            canvasCtxt.stroke();
            // leftmost part of the line
            canvasCtxt.beginPath();
            canvasCtxt.moveTo((currCenterAndWidth.center+currCenterAndWidth.width/2)*PSIZE, l*PSIZE);
            canvasCtxt.lineTo($scope.TERRAIN_CONFIG.CANVAS_WIDTH*PSIZE, l*PSIZE);
            canvasCtxt.stroke();
        }
    }

    initGame($scope);
    drawTerrain($scope);

});
