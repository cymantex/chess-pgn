import {Move} from "./Move";

export interface Tags {
    [key: string]: string
}

export interface MoveArgs {
    name: string,
    comment?: string
}

export interface Variation {
    parentMoveId?: string,
    moves: Move[]
}