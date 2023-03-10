// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithRedirect,
    signInAnonymously,
    onAuthStateChanged,
    GoogleAuthProvider,
    signOut,
    inMemoryPersistence,
    setPersistence
} from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
} from "firebase/firestore";
import { html, render } from "lit-html";
import { sketch } from 'p5js-wrapper';

console.log(localStorage.getItem('uid'))

var allBlocks = [];
var width = 0;
var height = 0;
var currColor = 0;
const gridSize = 8;
var diameter;
var newBlockChecker = false;
var newGameCheck = false
let button;
var boolean = false;

var gameBoard = [];
var currBlock;
var firstGame = true;

var numBlocksStacked = 0;

function getRandomInt(max) {
    return Math.floor(Math.random() * (max));
}



//Makes a new block for the user and stores the previous block into memory 
function makeNewBlock() {
    // generates a random color

    currColor = generateRandomColor();
    fill(currColor)

    //generates a random starting position for the block
    let startingXPos = diameter * Math.round(getRandomInt(gridSize - 4));
    let yPos = 0;

    currBlock = {}
    var coordArr = [];

    width = Math.round(getRandomInt(2)) + 1;
    height = Math.round(getRandomInt(3)) + 1;

    //generates a block by randomly choosing the amount of rectangles it will have
    for (let j = 0; j < 2; j++) {
        let xPos = startingXPos;
        for (let i = 0; i < 1; i++) {

            var singeBlock = {};
            singeBlock["xPos"] = xPos;
            singeBlock["yPos"] = yPos;

            rect(xPos, yPos, diameter, diameter)
            xPos += diameter;

            coordArr.push(singeBlock);
        }
        yPos += diameter;
    }
    currBlock['blocks'] = coordArr;
    currBlock['color'] = currColor;

    //}
}

function gameBoardUpdater() {
    let b = currBlock.blocks
    /*console.log(gameBoard)
    for (var j = 0; j < b.length; j++) {
        let blockYPos = b[j].yPos / diameter - 1
        let blockXPos = b[j].xPos / diameter
        for (var i = 0; i < gridSize; i++) {
            console.log("[y: " + ", x: " + blockXPos + ", i " + i)
            if (blockYPos == 0 && gameBoard[1][i] && gameBoard[blockXPos] == i) {
                startNewGame();
                return;
            }
        }
    }*/
    for (let z = 0; z < b.length; z++) {
        let y = Math.round(b[z].yPos / diameter)
        let x = Math.round(b[z].xPos / diameter)
        if (y == gridSize) {
            newBlockChecker = true;
        } else if (gameBoard[y][x]) {
            newBlockChecker = true;
            numBlocksStacked++
        }
    }

    if (newBlockChecker) {
        newBlockChecker = false;
        for (let j = 0; j < currBlock.blocks.length; j++) {
            let y2 = Math.round(currBlock.blocks[j].yPos / diameter) - 1
            let x2 = Math.round(currBlock.blocks[j].xPos / diameter)

            gameBoard[y2][x2] = true;
            if (y2 == 0) {
                startNewGame();
                return;
            }
        }
        allBlocks.push(currBlock)
        makeNewBlock();
        return;
    }


}


// Continously draws the gameboard on the canvas. Also checks if any blocks have reached the top 
// of the grid, and if so starts a new game
function drawGameBoard() {
    stroke(5);
    fill('gray')
    let y = 0;

    for (var i = 0; i < gridSize; i++) {
        let x = 0;

        for (var j = 0; j < gridSize; j++) {
            square(x, y, diameter);
            x += diameter;
        }

        y += diameter;
    }
}

function drawAllBlocks() {
    for (let i = 0; i < allBlocks.length; i++) {
        let blockItr = allBlocks[i];
        let coords = blockItr.blocks
        fill(blockItr.color)

        for (let j = 0; j < coords.length; j++) {
            rect(coords[j].xPos, coords[j].yPos - diameter, diameter, diameter)

        }
    }
}

//function to generate the 2d array representation of the gameboard
function generateGameboard() {
    gameBoard = new Array(gridSize - 1);
    for (var i = 0; i < gridSize; i++) {
        gameBoard[i] = new Array(gridSize - 1);

        for (var j = 0; j < gridSize; j++) {
            gameBoard[i][j] = false
        }

    }
    return gameBoard;
}

// prints out a string representation of the 2d array gameboard
function gameBoardToString(gameBoard) {
    for (var i = 0; i < gameBoard.length; i++) {
        for (var j = 0; j < gameBoard.length; j++) {
            console.log(gameBoard[i][j] + " ");
        }
        console.log("\n");
    }
}

// shifts the current block along the x-axis depending on user input
function shiftCurrBlock(shiftX) {

    // Figures out what the starting and ending x coordinaes of our block, 
    // used to check if shifting the block would move it out of the grids bounds
    let blockStartX = currBlock.blocks[0].xPos / diameter
    let blockEndX = currBlock.blocks[currBlock.blocks.length - 1].xPos / diameter
    let bottomY = currBlock.blocks[currBlock.blocks.length - 1].yPos / diameter - 1
    console.log("start x: " + blockStartX + ", end x: " + blockEndX + ", bottom y: " + bottomY)


    if (((blockStartX != 0 && shiftX == -1) ||
        (blockEndX != gridSize - 1 && shiftX == 1)) &&
        (bottomY != gridSize && bottomY != gridSize - 1) &&
        ((!gameBoard[bottomY + 1][blockEndX + 1] && shiftX == 1) ||
            (!gameBoard[bottomY + 1][blockStartX - 1] && shiftX == -1))) {



        drawGameBoard();
        frameRate(10)
        let blocks = currBlock.blocks
        var list = []
        var list2 = []
        for (var i = 0; i < blocks.length; i++) {
            list.push(blocks[i].xPos / diameter)
            blocks[i].xPos += diameter * shiftX
            list2.push(blocks[i].xPos / diameter)
            rect(blocks[i].xPos, blocks[i].yPos, diameter, diameter)
        }

        if (((gameBoard[bottomY - 1][blockEndX] && shiftX == 1) ||
            (gameBoard[bottomY - 1][blockStartX] && shiftX == -1))) {
            boolean = true;
            allBlocks.push(currBlock)
            makeNewBlock();
        }



    }
}

function generateRandomColor() {
    let h = Math.ceil(Math.random() * 255)
    let v = Math.ceil(Math.random() * 255)
    let s = Math.ceil(Math.random() * 255)
    return color(h, s, v)
}


function startNewGame() {
    newGameCheck = false
    drawGameBoard();
    currBlock = {};
    allBlocks = [];
    firstGame = false;

    for (let i = 0; i < gridSize; i++) {

        for (let z = 0; z < gridSize; z++) {
            gameBoard[i][z] = false
        }
    }

    makeNewBlock();
    numBlocksStacked = 0


}


/*keyPressed = (event) => {
    if (keyCode == 39) {
        shiftCurrBlock( 1)
    } else if (keyCode == 37) {
        shiftCurrBlock( -1)
    }
};*/

sketch.keyPressed = (event) => {
    if (keyCode == 39) {
        shiftCurrBlock(1)
    } else if (keyCode == 37) {
        shiftCurrBlock(-1)
    }
};

function stop() {
    sketch.noLoop();
}

sketch.setup = function () {
    createCanvas(windowWidth, windowHeight)

    gameBoard = generateGameboard();
    currColor = generateRandomColor()
    diameter = Math.min(windowWidth, windowHeight) / gridSize;

    drawGameBoard();
    makeNewBlock();

    sketch.button = createButton('debugger me');
    sketch.button.position(0, 0);
    sketch.button.mousePressed(stop);

}


sketch.draw = function () {
    frameRate(.5)
    drawGameBoard();
    drawAllBlocks();
    //creates the block the player is currently controlling and continuosly shifts it down
    let blocks = currBlock.blocks
    fill(currColor);

    if (!boolean) {
        boolean = false

        for (let i = 0; i < blocks.length; i++) {
            rect(blocks[i].xPos, blocks[i].yPos, diameter, diameter)
            blocks[i].yPos += diameter
        }
    }
    gameBoardUpdater();
}


