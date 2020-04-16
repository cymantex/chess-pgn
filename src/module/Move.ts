import {Color} from "chess-fen/types";
import {v1 as uuid} from "uuid";
import {MoveInterface} from "./types";

export interface MoveConstructor extends Partial<MoveInterface<string[]>> {
    variationId: string,
    number: number,
    color: Color,
    name: string,
}

export const isFirstMove = (move: Move): boolean => {
    return move.number === 1 && move.color === "white";
};

export const hasSameNumberAndColor = (move1: Move, move2: Move): boolean => {
    return move1.number === move2.number && move1.color === move2.color;
};

export class Move implements MoveInterface<string[]> {
    readonly id: string;
    readonly variationId: string;
    number: number;
    color: Color;
    name: string;
    comment?: string;
    variations: string[];
    annotation?: string;

    constructor({variationId, number, color, name, comment, annotation, variations = []}: MoveConstructor) {
        this.id = uuid();
        this.variationId = variationId;
        this.number = number;
        this.color = color;
        this.name = name;
        this.comment = comment;
        this.annotation = annotation;
        this.variations = variations;
    }

    static isRoot(move: Move): boolean {
        return move.name === "root";
    }

    static root(): Move {
        return new Move({number: 0, color: "black", variationId: "", name: "root"})
    }
}