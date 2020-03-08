import {Fen} from "chess-fen";
import {PlayerColor} from "chess-fen/types";
import PgnParser, {PgnData} from "./PgnParser";
import {Move, Tags} from "./types";

export interface PgnCloneArgs extends PgnData {
    tag?: Tags,
    move?: Move
}

export class Pgn {
    readonly fen: Fen;
    readonly tags: Tags;
    readonly result: string;
    readonly moves: Move[];

    constructor(args: PgnData|string = {}) {
        const parsedArgs = typeof args === "string" ? new PgnParser(args).parse() : args;
        const {fen, tags, result, moves} = {
            fen: Fen.startingPosition,
            tags: {},
            result: "*",
            moves: [],
            ...parsedArgs
        };
        this.fen = new Fen(fen);
        this.tags = tags;
        this.result = result;
        this.moves = moves;
    }

    public cloneWith(args: PgnCloneArgs = {}): Pgn {
        const defaults = {
            fen: this.fen.toString(),
            tags: this.tags,
            result: this.result,
            moves: this.moves,
            move: null,
            tag: null
        };
        const {fen, tags, result, moves, move, tag} = {...defaults, ...args};

        return new Pgn({
            fen,
            tags: tag ? {
                ...this.tags,
                ...tag
            } : tags,
            result: result,
            moves: move ? [
                ...this.moves,
                move
            ] : moves
        });
    }

    public addResult = (result: string): Pgn => this.cloneWith({result});

    public addTag = (key: string, value: string): Pgn => this.cloneWith({tag: {[key]: value}});

    public appendMove = (move: string, moves = this.moves): Pgn => {
        const lastMove = this.getLastMove(moves);

        return this.cloneWith({
            move: lastMove ? {
                id: lastMove.id + 1,
                number: lastMove.color === PlayerColor.Black ? lastMove.number + 1 : lastMove.number,
                color: lastMove.color === PlayerColor.Black ? PlayerColor.White : PlayerColor.Black,
                move
            } : {
                id: 0,
                number: 1,
                color: PlayerColor.White,
                move
            }
        });
    };

    public getLastMove = (moves = this.moves): Move => {
        return moves[moves.length - 1];
    };

    public toString = (): string => {
        const tags = Object
            .keys(this.tags)
            .map(tagKey => `[${tagKey} "${this.tags[tagKey]}"]`)
            .join("\n");
        return tags + "\n\n" + this.movesToString(this.moves) + " " + this.result;
    };

    public traverseMoves(callback: (move: Move) => any, moves: Move[] = this.moves): void {
        moves.forEach(move => {
            callback(move);
            if(move.variations){
                this.traverseMoves(callback, move.variations);
            }
        });
    };

    public mapMoves(callback: (move: Move) => Move, moves: Move[] = this.moves): Pgn {
        return this.cloneWith({
            moves: moves.map(move => move.variations ? {
                ...callback(move),
                variations: this.mapMoves(callback, move.variations).moves
            } : callback(move))
        });
    };

    public filterMoves(predicate: (move: Move) => boolean, moves: Move[] = this.moves): Pgn {
        return this.cloneWith({
            moves: moves
                .filter(predicate)
                .map(move => move.variations ? {
                    ...move,
                    variations: this.filterMoves(predicate, move.variations).moves
                } : move)
        });
    };

    public movesToString(moves: Move[] = this.moves): string {
        let previousHaveVariations = false;

        return moves
            .map(({move, color, number, variations, comment}, i) => {
                let variationsString = "";
                let moveString = "";

                if(variations && variations.length > 0){
                    variationsString = this.movesToString(variations);
                }

                if(color === PlayerColor.White){
                    moveString = `${number}. ${move}`;
                    moveString = (comment)
                        ? `${moveString} {${comment}}`
                        : moveString;
                    moveString = (variationsString)
                        ? `${moveString} (${variationsString})`
                        : moveString;
                } else if(color === PlayerColor.Black){
                    moveString = (previousHaveVariations)
                        ? `${number}... ${move}`
                        : move;
                    moveString = (comment)
                        ? `${moveString} {${comment}}`
                        : moveString;
                    moveString = (variationsString)
                        ? `${moveString} (${number}... ${variationsString})`
                        : moveString;
                }

                if(i !== moves.length - 1){
                    moveString += " ";
                }

                previousHaveVariations = variations !== undefined && variations.length > 0;
                return moveString;
            })
            .reduce((strings, string) => strings + string, "");
    };
}

export default Pgn;