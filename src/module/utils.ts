import {Move} from "./Move";
import {Color} from "chess-fen/types";

export const filterMoves = (moves: Move[], predicate: (move: Move) => boolean): Move[] => {
    return moves
        .filter(move => predicate(move))
        .map(move => ({
            ...move,
            variations: move
                .variations
                .map(moves => filterMoves(moves, predicate))
        }))
};

export const traverseMoves = (moves: Move[], callback: (move: Move) => void): void => {
    moves.forEach(move => {
        callback(move);
        if(move.variations){
            move.variations.forEach(moves => traverseMoves(moves, callback));
        }
    });
};

export function mapMoves<T>(moves: Move[], callback: (move: Move) => T, replaceVariations = false): T[] {
    return moves.map(move => replaceVariations
        ? ({
            variations: move
                .variations
                .map(moves => mapMoves(moves, callback)),
            ...callback(move),
        })
        : ({
            ...callback(move),
            variations: move
                .variations
                .map(moves => mapMoves(moves, callback)),
        }));
}

export const findVariationParent = (moves: Move[], moveId: string): Move|null => {
    return findMove(moves, move => !!move.variations.find(variation => variation.find(move => move.id === moveId)));
};

export const findVariation = (moves: Move[], moveId: string): Move[] => {
    for(let i = 0; i < moves.length; i++){
        const move = moves[i];

        if (move.id === moveId) {
            return moves;
        }

        for(let j = 0; j < move.variations.length; j++){
            const variation = findVariation(move.variations[j], moveId);

            if(variation.length > 0) {
                return variation;
            }
        }
    }

    return [];
};

export const findMoveByPath = (moves: Move[], path: Partial<Move>[]): Move|null => {
    if(path.length === 0) {
        return null;
    }

    const root = moves.find(move => {
        const mergedMove = {...move, ...path[0]};

        return mergedMove.name === move.name &&
            mergedMove.number === move.number &&
            mergedMove.color === move.color &&
            mergedMove.annotation === move.annotation &&
            mergedMove.id === move.id &&
            mergedMove.comment === move.comment;
    });

    if (!root) {
        return null;
    } else if (path.length === 1) {
        return root ? root : null;
    }

    for(let i = 0; i < root.variations.length; i++){
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [head, ...pathTail] = path;
        const move = findMoveByPath(root.variations[i], pathTail);

        if (move) {
            return move;
        }
    }

    return null;
};

export const findMove = (moves: Move[], predicate: (move: Move) => boolean): Move|null => {
    for(let i = 0; i < moves.length; i++){
        const move = moves[i];

        if (predicate(move)) {
            return move;
        }

        for(let j = 0; j < move.variations.length; j++){
            const variation = move.variations[j];
            const variationMove = findMove(variation, predicate);

            if(variationMove) {
                return variationMove;
            }
        }
    }

    return null;
};

export const addMove = (moves: Move[], newMove: Move, previousMove: Move): Move[] => {
    return moves.reduce((accumulator: Move[], move: Move, i: number) => {
        if (move.id === previousMove.id) {
            return i !== moves.length - 1
                ? [...accumulator, {...previousMove, variations: [...previousMove.variations, [newMove]]}]
                : [...accumulator, previousMove, newMove];
        }

        return [
            ...accumulator,
            {
                ...move,
                variations: move.variations.map(variation => addMove(variation, newMove, previousMove))
            }
        ]
    }, []);
};

export const toggleColor = (color: Color): Color => {
    return color === "black" ? "white" : "black";
};

export const isStandardNotation = (string: string): boolean => {
    return /([NBRQK])?([a-h][1-8])[x-]?([a-h][1-8])?([NBRQ])?/.test(string) ||
        ["0-0", "0-0-0", "O-O", "O-O-O"].includes(string);
};