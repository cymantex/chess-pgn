import {Color} from "chess-fen/types";
import {v1 as uuid} from "uuid";

export interface ConstructorArgs {
    number: number,
    color: Color,
    name: string,
    next?: Move,
    comment?: string,
    variations?: Move[][],
    annotation?: string
}

export class Move {
    id: string;
    number: number;
    color: Color;
    name: string;
    comment?: string;
    variations: Move[][];
    annotation?: string;

    constructor({number, color, name, comment, annotation, variations = []}: ConstructorArgs) {
        this.id = uuid();
        this.number = number;
        this.color = color;
        this.name = name;
        this.comment = comment;
        this.annotation = annotation;
        this.variations = variations;
    }

    static empty(): Move {
        return new Move({number: 0, color: "black", name: ""})
    }
}