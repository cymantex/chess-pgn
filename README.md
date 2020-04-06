# chess-pgn
chess-pgn is a library which includes tools for working with Portable Game Notation (PGN) in an immutable manner.

## Installation
``npm install chess-pgn``

## Example usage
````javascript
// Each method call creates a new Pgn instance
const pgn = new Pgn()
    .addTag("Title", "Example pgn")
    .addTag("Description", "Shows how to add moves and variations")
    .move("e4")
    .comment("king's pawn")
    .variation("d4")
    .move("Nf6")
    .selectMove(move => move.name === "e4")
    .variation("c4")
    .move("e5")
    .selectMoveByPath({name: "e4"}, {name: "Nf6"})
    .move("c4")
    .previousMove()
    .move("Nf3")
    .move("g6");

console.log(pgn.toString());
// [Title "Example pgn"]
// [Description "Shows how to add moves and variations"]
//
// 1. e4 {king's pawn} (1. d4 Nf6 (2. Nf3 g6) 2. c4) (1. c4 e5) *
````