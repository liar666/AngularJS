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

app.controller('GameController', function($scope, $timeout, $log) {

    fgCanvas = document.getElementById("foreground");
    bgCanvas = document.getElementById("background");

    $scope.TERRAIN_CONFIG = {
        PIXEL_SIZE: 8,                      // Line-Width of each line to be drawn (±zoom)
        CANVAS_WIDTH: bgCanvas.width,       // Width of the game canvas
        CANVAS_HEIGHT: bgCanvas.height,     // Height of the game canvas
        TRACK_SIZE: bgCanvas.width/6,       // Size of the track where the player can move
        MOBILITY_RANGE: bgCanvas.width/24,  // Max shift of the new line w/r previous one
        FG_COLOR: "black",                  // Color of the foreground of the terrain
        BG_COLOR: "white"                   // Color of the background of the terrain
    };

    $scope.PLAYER_CONFIG = {
        COLOR: "red",                     // Color of the player
        WIDTH: 16,                        // The size of the player
        MIN_PLAYER_POS: 1,                // Leftmost position of the player
        MAX_PLAYER_POS: bgCanvas.width-1  // Rightmost position of the player
    };

    $scope.GAME_CONFIG = {
        SCORE_COLOR: "green",
        SPEED: 1500,           // Starting with slow speed of 1s between new line creation
        SPEED_DEC: 9.0/10.0,   // The amount of speed increase (in fact timeout decrease)
        SCORE_MOD: 15          // Every X score points, the speed increases
    };

    $scope.currentGame = {
        terrain: [],         // [ {newCenter, NewTrackWidth} ]
        lastCenter: {},
        playerPos: {},       // x position in the last line
        speed: {},           // theu current speed of the game
        paused: false,       // true if the game is paused
        dead: false,         // true if the player hit a wall
        score: 0             // the current score
    };

    // Create a new line for the terrain
    computeLine = function(lastCenter) {
        mobRange = $scope.TERRAIN_CONFIG.MOBILITY_RANGE;
        canWidth = $scope.TERRAIN_CONFIG.CANVAS_WIDTH;
        trSize   = $scope.TERRAIN_CONFIG.TRACK_SIZE;
        newCenter = Math.round(lastCenter+Math.random()*2*mobRange-mobRange);
        if (newCenter<mobRange) { newCenter = mobRange; }
        if (newCenter>(canWidth-mobRange)) { newCenter = canWidth-mobRange; }
        newTrackWidth = Math.round(trSize-trSize/4*Math.random());
        return({ center: newCenter, width: newTrackWidth });
    }

    // Initializes the terrain
    // Optimization: we store only the "centers" and "track_width" for each line
    initGame = function($scope) {
        $scope.currentGame.lastCenter = $scope.TERRAIN_CONFIG.CANVAS_WIDTH/2;
        for (var l=0 ; l<$scope.TERRAIN_CONFIG.CANVAS_HEIGHT/$scope.TERRAIN_CONFIG.PIXEL_SIZE ; l++) {
            newCenterAndTrackWidth = computeLine($scope.currentGame.lastCenter);
            $scope.currentGame.terrain.push(newCenterAndTrackWidth);
            $scope.currentGame.lastCenter = newCenterAndTrackWidth.center;
        }
        $scope.currentGame.playerPos = $scope.currentGame.lastCenter;

        $scope.currentGame.speed = $scope.GAME_CONFIG.SPEED;
        $scope.currentGame.dead = false;
        $scope.currentGame.paused = false;
    }

    // Draws the terrain on the window canvas
    drawTerrain = function($scope) {
        PSIZE = $scope.TERRAIN_CONFIG.PIXEL_SIZE;
        canvasCtxt = document.getElementById('background').getContext('2d');
        // Erase old terrain
        canvasCtxt.clearRect(0, 0,
                             $scope.TERRAIN_CONFIG.CANVAS_WIDTH,
                             $scope.TERRAIN_CONFIG.CANVAS_HEIGHT);
        // Draw current terrain
        for (var l=0 ; l<$scope.currentGame.terrain.length ; l++) {
            currCenterAndWidth = $scope.currentGame.terrain[l];
            canvasCtxt.beginPath();
            canvasCtxt.lineWidth = PSIZE;
            canvasCtxt.strokeStyle = $scope.TERRAIN_CONFIG.FG_COLOR;
            // rightmost part of the line
            canvasCtxt.moveTo(0, l*PSIZE);
            xmin=(currCenterAndWidth.center-currCenterAndWidth.width/2);
            canvasCtxt.lineTo(xmin, l*PSIZE);
            canvasCtxt.stroke();
            // leftmost part of the line
            canvasCtxt.beginPath();
            xmax=(currCenterAndWidth.center+currCenterAndWidth.width/2);
            canvasCtxt.moveTo(xmax, l*PSIZE);
            canvasCtxt.lineTo($scope.TERRAIN_CONFIG.CANVAS_WIDTH, l*PSIZE);
            canvasCtxt.stroke();
            canvasCtxt.closePath();
        }
    }

    // Draws the player
    drawPlayer = function($scope) {
        canvasCtxt = document.getElementById('background').getContext('2d');
        ppos = $scope.currentGame.playerPos;
        psiz = $scope.PLAYER_CONFIG.WIDTH;
        phei = $scope.TERRAIN_CONFIG.CANVAS_HEIGHT-$scope.TERRAIN_CONFIG.PIXEL_SIZE;
        canvasCtxt.beginPath();
        canvasCtxt.lineWidth = $scope.TERRAIN_CONFIG.PIXEL_SIZE;
        canvasCtxt.strokeStyle = $scope.PLAYER_CONFIG.COLOR;
        canvasCtxt.moveTo(ppos-psiz/2, phei);
        canvasCtxt.lineTo(ppos+psiz/2, phei);
        //$log.debug((ppos-psiz/2)+"/"+(ppos+psiz/2))
        canvasCtxt.stroke();
        canvasCtxt.closePath();
    }

    // Checks if player is dead
    checkPlayerDead = function($scope) {
        lastLine = $scope.currentGame.terrain[$scope.currentGame.terrain.length-1];
        pPos = $scope.currentGame.playerPos;
        if (lastLine.center-lastLine.width/2>=pPos ||
            lastLine.center+lastLine.width/2<=pPos) {
            //$log.debug("Player hit the wall !");
            $scope.currentGame.dead=true;
        } else {
            $scope.currentGame.score += 1;
            //$log.debug("New score="+$scope.currentGame.score);
            document.getElementById("score").innerHTML = "Score: " + $scope.currentGame.score;
            // Increase game speed if necessary
            if ($scope.currentGame.score % $scope.GAME_CONFIG.SCORE_MOD == 0) {
                $scope.currentGame.speed *= $scope.GAME_CONFIG.SPEED_DEC;
                //$log.debug("New speed: "+$scope.currentGame.speed);
                document.getElementById("speed").innerHTML = "Speed: " + $scope.currentGame.speed;
            }
        }
    }

    // Move the terrain downwards
    moveDown = function($scope) {
        nLine = computeLine($scope.currentGame.terrain[0].center); // generate a new line
        $scope.currentGame.terrain.splice($scope.currentGame.terrain.length-1, 1); // remove last line
        $scope.currentGame.terrain.splice(0, 0, nLine);            // add ne first line
    }

    // One simulation step
    simulationStep = function($scope) {
        if ($scope.currentGame.dead) { return; }
        if (!$scope.currentGame.paused) {
            moveDown($scope);
            drawTerrain($scope);
            drawPlayer($scope);
            checkPlayerDead($scope);
        }
        $timeout(simulationStep, $scope.currentGame.speed, false, $scope);
    }

    $scope.movePlayer = function(event) {
        $log.debug("Key pressed: "+event.keyCode);

        if (event.keyCode==37) { // Left key
            $scope.currentGame.playerPos -= $scope.TERRAIN_CONFIG.PIXEL_SIZE;
        }
        if (event.keyCode==39) { // Right key
            $scope.currentGame.playerPos += $scope.TERRAIN_CONFIG.PIXEL_SIZE;
        }

        // TODO: check if player if dead here? (here only??)
    }

    initGame($scope);
    drawTerrain($scope);
    drawPlayer($scope);
    simulationStep($scope);

    // $log.debug($scope.TERRAIN_CONFIG);
    // $log.debug($scope.PLAYER_CONFIG)
    // $log.debug($scope.GAME_CONFIG);
    // $log.debug($scope.currentGame);

});
