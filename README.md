# chess-pgn
chess-pgn is a library which includes tools for working with Portable Game Notation (PGN).

## Installation
``npm install chess-pgn``

## Example usage
````javascript
const pgn = new Pgn()
    .addTag("Title", "Example pgn")
    .addTag("Description", "Shows how to add tags, moves, variations and comments")
    .move("e4")
    .comment("king's pawn")
    .startingPosition()
    .move("d4")
    .move("Nf6")
    .firstMove()
    .move("d5")
    .selectMove(move => move.name === "e4")
    .move("e5")
    .previousMove()
    .move("c5");

console.log(pgn.toString());
// [Title "Example pgn"]
// [Description "Shows how to add tags, moves, variations and comments"]
//
// 1. e4 {king's pawn} (1. d4 Nf6 (1... d5)) 1... e5 (1... c5) *
````