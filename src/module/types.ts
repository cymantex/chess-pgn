import {PlayerColor} from "chess-fen/types";

export interface Tags {
    [key: string]: string
}

export interface Move {
    id: number,
    number: number,
    color: PlayerColor,
    move: string,
    variations?: Move[],
    comment?: string
}