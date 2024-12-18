/*
Noah Rothgaber
02134094
Gui Programming 1
Homework 5 One line scrabble
*/
let letterData = []; // For the JSON stuff
let score = 0;
const boardState = Array(15).fill(null); // Tracks placed tiles on the board, the image has 15 slots
// so we make an array with 15 empty slots

// Grab letter data from JSON https://api.jquery.com/jQuery.getJSON/
//https://developer.mozilla.org/en-US/docs/Glossary/Callback_function
function loadLetterData(callback) {
    // This might make more sense to view in context with the initialization at the bottom
    $.getJSON("pieces.json", function (data) {
        letterData = data.pieces;
        callback(); // I didn't set a  defined callback function, instead I call two functions in a lambda at the bottom
    }).fail(function () {
        console.error("Error loading letter data from pieces.json");
        // Pieces need to be in the same folder as the html
    });
}

// Function to clear all tiles and deal new ones
function newTiles() {
    $(".board-tile .tile").remove();
    $("#tile-rack").empty();
    boardState.fill(null); // Reset board
    score = 0;
    $("#score").text(`Score: ${score}`);
    dealTiles();
}

// Check if the tiles are next to eachother
function isPlacementValid(index) {
    // Check if theres already a tile
    if (boardState[index] !== null) {
        return false;
    }

    // Check if there is a tile to the left
    let left = false;
    if (index > 0 && boardState[index - 1] !== null) {
        left = true;
    }

    // Check if there is a tile to the right
    let right = false;
    if (index < 14 && boardState[index + 1] !== null) {
        right = true;
    }

    // If there is a tile to the left or right
    if (left || right) {
        return true;
    }

    // If the board is completely empty you can put the tile wherever
    let isBoardEmpty = true;
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== null) {
            isBoardEmpty = false;
            break;
        }
    }

    if (isBoardEmpty) {
        return true;
    }

    return false;
}


// Initialize the board with draggable/droppable working
function initializeBoard() {
    const boardTiles = [
        { id: "tile-1", type: "normal" },
        { id: "tile-2", type: "normal" },
        { id: "tile-3", type: "double-word" },
        { id: "tile-4", type: "normal" },
        { id: "tile-5", type: "normal" },
        { id: "tile-6", type: "normal" },
        { id: "tile-7", type: "double-letter" },
        { id: "tile-8", type: "normal" },
        { id: "tile-9", type: "double-letter" },
        { id: "tile-10", type: "normal" },
        { id: "tile-11", type: "normal" },
        { id: "tile-12", type: "normal" },
        { id: "tile-13", type: "double-word" },
        { id: "tile-14", type: "normal" },
        { id: "tile-15", type: "normal" }
    ];

    boardTiles.forEach((tile, index) => {
        $(`#${tile.id}`).droppable({
            accept: ".tile",
            drop: function (event, ui) {
                const droppedTile = ui.draggable;
                // I'd say this was the most challenging section to write
                // Didnt want to let the user just put the tiles wherever by default
                if (!isPlacementValid(index)) {
                    droppedTile.animate({ top: "0", left: "0" }, "fast"); //https://api.jquery.com/animate/
                    return;
                }

                // Check for double letter
                let scoreToAdd = droppedTile.data("value");
                if (tile.type === "double-letter") {
                    scoreToAdd *= 2;
                }

                // Place the tile in the right place
                boardState[index] = {
                    letter: droppedTile.data("letter"),
                    value: scoreToAdd,
                    type: tile.type
                };

                // Once tile is moved, you cant move it unless you clear the board
                droppedTile.css({ top: "0", left: "0", position: "absolute" });
                droppedTile.draggable("disable"); // Prevent dragging
                $(this).append(droppedTile);

                // Update total score
                const totalScore = calculateWordScore();
                $("#score").text(`Score: ${totalScore}`);
            }
        });
    });
}


// Function to calculate total word score
function calculateWordScore() {
    let wordScore = 0;
    let hasDoubleWord = false;

    // I check the whole board for scoring instead of when the tile is placed
    boardState.forEach(tile => {
        if (tile !== null) {
            wordScore += tile.value;
            if (tile.type === "double-word") {
                hasDoubleWord = true;
            }
        }
    });

    if (hasDoubleWord) {
        wordScore *= 2;
    }

    return wordScore;
}

function enableAllTiles() {
    // Had an annoying bug where if I dragged the tiles that were already placed
    // it would just keep adding their score, so I opted to disable them instead
    $(".tile").draggable("enable");
}

function shuffleTiles() {
    // sometimes its easier to just spam shuffle than to think lol 
    const tiles = $("#tile-rack .tile").toArray();
    tiles.sort(() => Math.random() - 0.5); // Shuffle the tile array
    tiles.forEach(tile => {
        $(tile).draggable("enable"); // Re-enable draggable for rack tiles ONLY
        // Can't use other function cause it enables it for every tile
        $("#tile-rack").append(tile);
    });
}
// Function to clear tiles back to the rack
function clearTiles() {
    enableAllTiles();
    $(".board-tile .tile").each(function () {
        const tile = $(this).detach();
        $("#tile-rack").append(tile.css({ top: "0", left: "0", position: "relative" }));
        // all my tiles were in a stack at some point because I had absolute here^ dummy. 
    });

    boardState.fill(null); // Reset board
    score = 0;
    $("#score").text(`Score: ${score}`);
}

// Function to display seven random tiles
function dealTiles() {
    enableAllTiles(); // Have to enable all the tiles so they can be dragged
    $("#tile-rack").empty();
    for (let i = 0; i < 7; i++) {
        const randomIndex = Math.floor(Math.random() * letterData.length);
        const tileData = letterData[randomIndex]; // grab random letter

        const tile = $(`
            <img src="Scrabble_Tiles/Scrabble_Tile_${tileData.letter}.jpg"
                class="tile"
                data-letter="${tileData.letter}" 
                data-value="${tileData.value}">
        `);
        // Make tile element by grabbing tile image from the folder and the appropriate scoring info then add it to the rack

        $("#tile-rack").append(tile);
        // Source - https://jqueryui.com/droppable/#revert
        tile.draggable({ revert: "invalid" }); // Return the tile back to where it was if you do an oopsie
    }
}


// Initialize the game
$(document).ready(function () {
    // This is techincally the call back function it is calling in the definition
    // It initializes the board and then deals the tiles at game start
    // Also adds button listeners
    loadLetterData(function () {
        initializeBoard();
        dealTiles();
    });
    // Button listener stuff
    $("#shuffle-tiles").on("click", shuffleTiles);
    $("#clear-tiles").on("click", clearTiles);
    $("#new-tiles").on("click", newTiles);
});
