import {Move} from "./Move";
import {Color} from "chess-fen/types";

export const filter = (variations: Move[][], predicate: (move: Move) => boolean): Move[][] => {
    return variations
        .map(variation => variation.filter(predicate))
        .map(variation => variation.map(move => ({
            ...move,
            variations: filter(move.variations, predicate)
        })))
        .filter(variation => variation.length > 0);
};

export const traverse = (variations: Move[][], callback: (move: Move) => void): void => {
    variations.forEach(variation => {
        variation.forEach(move => {
            callback(move);
            traverse(move.variations, callback);
        });
    });
};

export function map<T>(variations: Move[][], callback: (move: Move) => T, replaceVariations = false): T[][] {
    return variations.map(variation => variation.map(move => replaceVariations
        ? ({
            variations: map(move.variations, callback, replaceVariations),
            ...callback(move),
        })
        : ({
            ...callback(move),
            variations: map(move.variations, callback, replaceVariations),
        })));
}

export const findMoveAfter = (variations: Move[][], moveId: string): Move|null => {
    for(let i = 0; i < variations.length; i++){
        const variation = variations[i];

        for(let j = 0; j < variation.length; j++){
            const move = variation[j];

            if (move.id === moveId) {
                return variation[j + 1];
            }

            const variationMove = findMoveAfter(move.variations, moveId);

            if(variationMove) {
                return variationMove;
            }
        }
    }

    return null;
};

export const findVariationParent = (variations: Move[][], moveId: string): Move|null => {
    return findMove(variations, move => !!move.variations.find(variation => variation.find(move => move.id === moveId)));
};

export const findVariation = (variations: Move[][], moveId: string): Move[] => {
    for(let i = 0; i < variations.length; i++){
        const variation = variations[i];

        for(let j = 0; j < variation.length; j++){
            const move = variation[j];

            if (move.id === moveId) {
                return variation;
            }

            const subVariation = findVariation(move.variations, moveId);

            if(subVariation.length > 0) {
                return subVariation;
            }
        }
    }

    return [];
};

export const findMove = (variations: Move[][], predicate: (move: Move) => boolean): Move|null => {
    for(let i = 0; i < variations.length; i++){
        const variation = variations[i];

        for(let j = 0; j < variation.length; j++){
            const move = variation[j];

            if (predicate(move)) {
                return move;
            }

            const variationMove = findMove(move.variations, predicate);

            if(variationMove) {
                return variationMove;
            }
        }
    }

    return null;
};

export const addMove = (variations: Move[][], newMove: Move, moveToInsertAfter: Move): Move[][] => {
    return variations.map(variation => variation.reduce((accumulator: Move[], move: Move, i: number) => {
        if (move.id === moveToInsertAfter.id) {
            if (i === variation.length - 1) {
                return [...accumulator, moveToInsertAfter, newMove];
            }

            const moveAlreadyExists = !![...moveToInsertAfter.variations, [variation[i + 1]]]
                .map(variation => variation[0].name)
                .find(name => name === newMove.name);

            return moveAlreadyExists
                ? [...accumulator, moveToInsertAfter]
                : [...accumulator, {...moveToInsertAfter, variations: [...moveToInsertAfter.variations, [newMove]]}];
        }

        return [
            ...accumulator,
            {
                ...move,
                variations: addMove(move.variations, newMove, moveToInsertAfter)
            }
        ]
    }, []));
};

export const toggleColor = (color: Color): Color => {
    return color === "black" ? "white" : "black";
};

export const isStandardNotation = (string: string): boolean => {
    return /([NBRQK])?([a-h][1-8])[x-]?([a-h][1-8])?([NBRQ])?/.test(string) ||
        ["0-0", "0-0-0", "O-O", "O-O-O"].includes(string);
};