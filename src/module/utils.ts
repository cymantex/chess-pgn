import {Color} from "chess-fen/types";
import {MoveTree} from "./types";
import {Move} from "./Move";

export const toggleColor = (color: Color): Color => {
    return color === "black" ? "white" : "black";
};

export const isStandardNotation = (string: string): boolean => {
    return /([NBRQK])?([a-h][1-8])[x-]?([a-h][1-8])?([NBRQ])?/.test(string) ||
        ["0-0", "0-0-0", "O-O", "O-O-O"].includes(string);
};

export function map<T>(moveTree: MoveTree[][], callback: (move: MoveTree) => T, replaceVariations = false): T[][] {
    return moveTree.map(variation => variation.map(move => replaceVariations
        ? ({
            variations: map(move.variations, callback, replaceVariations),
            ...callback(move),
        })
        : ({
            ...callback(move),
            variations: map(move.variations, callback, replaceVariations),
        })));
}

export const indexOf = (move: Move, moves: Move[]): number => {
    for(let i = 0; i < moves.length; i++){
        if(move.id === moves[i].id){
            return i;
        }
    }

    throw new Error("Could not indexOf move");
};