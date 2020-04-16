import {Color} from "chess-fen/types";

export interface Tags {
    [key: string]: string
}

export interface MoveArgs {
    name: string,
    comment?: string,
    annotation?: string
}

export interface MoveInterface<Variations> {
    readonly id: string;
    readonly variationId: string;
    number: number;
    color: Color;
    name: string;
    comment?: string;
    variations: Variations;
    annotation?: string;
}

export interface MoveTree extends MoveInterface<MoveTree[][]> {}