import PgnParser, {PgnData} from "./PgnParser";
import {MoveArgs, Tags} from "./types";
import {Move} from "./Move";
import {
    filterMoves,
    findMove,
    findVariationParent,
    findVariation,
    mapMoves,
    toggleColor,
    traverseMoves,
    findMoveByPath, addMove
} from "./utils";
import {Color} from "chess-fen/types";

export interface PgnCloneArgs extends Partial<PgnData> {}

export class Pgn {
    readonly tags: Tags;
    readonly result: string;
    readonly moves: Move[];
    readonly currentVariation: Move[];
    readonly currentMove: Move;

    constructor(args?: PgnData | string) {
        const parsedArgs = typeof args === "string" ? new PgnParser(args).parse() : args;
        const {tags, result, moves, currentMove} = {
            tags: {},
            result: "*",
            moves: [],
            currentMove: Move.empty(),
            ...parsedArgs
        };
        this.tags = tags;
        this.result = result;
        this.moves = moves;
        this.currentMove = currentMove;
        this.currentVariation = this.moves;
    }

    public static parse(pgnList: string): Pgn[] {
        return pgnList
            .split("\n\n[")
            .map(pgn => !pgn.startsWith("[") ? "[" + pgn : pgn)
            .map(pgn => new Pgn(pgn));
    }

    public cloneWith(args: PgnCloneArgs): Pgn {
        return new Pgn({...this, ...args});
    }

    public addResult = (result: string): Pgn => this.cloneWith({result});

    public addTag = (key: string, value: string): Pgn => this.cloneWith({tags: {...this.tags, [key]: value}});

    public move = (args: string | MoveArgs): Pgn => {
        const newNumber = this.currentMove.color === "black" ? this.currentMove.number + 1 : this.currentMove.number;
        const newColor = toggleColor(this.currentMove.color);
        const newMove = this.createMove(args, newNumber, newColor);

        return this.cloneWith({
            moves: this.moves.length === 0 ? [newMove] : addMove(this.moves, newMove, this.currentMove),
            currentMove: newMove
        });
    };

    public variation(args: string | MoveArgs): Pgn {
        const newMove = this.createMove(args, this.currentMove.number, this.currentMove.color);
        const newCurrentMove = {
            ...this.currentMove,
            variations: [...this.currentMove.variations, [newMove]]
        };

        return this.cloneWith({
            moves: this.map(move => move.id === this.currentMove.id ? newCurrentMove : move, true).moves,
            currentMove: newMove
        });
    }

    public comment(comment: string) {
        return this.updateCurrentMove({comment});
    }

    public annotate(annotation: string) {
        return this.updateCurrentMove({annotation});
    }

    public selectMoveByPath(...path: Partial<Move>[]){
        const move = findMoveByPath(this.moves, Array.from(path));

        if (move) {
            return this.cloneWith({currentMove: move ? move : this.currentMove});
        }

        return this;
    }

    public selectMove(predicate: (move: Move) => boolean): Pgn {
        const move = this.find(predicate);

        if (move) {
            return this.cloneWith({currentMove: move ? move : this.currentMove});
        }

        return this;
    }

    public nextMove(): Pgn {
        const currentVariation = findVariation(this.moves, this.currentMove.id);

        for(let i = 0; i < currentVariation.length; i++){
            if (currentVariation[i].id === this.currentMove.id) {
                return this.cloneWith({
                    currentMove: currentVariation[i + 1] ? currentVariation[i + 1] : this.currentMove
                });
            }
        }

        return this;
    }

    public previousMove(): Pgn {
        const currentVariation = findVariation(this.moves, this.currentMove.id);

        for(let i = 0; i < currentVariation.length; i++){
            if (currentVariation[i].id === this.currentMove.id) {
                const previousMove = currentVariation[i - 1];

                if (previousMove) {
                    return this.cloneWith({currentMove: previousMove});
                }
            }
        }

        const parent = findVariationParent(this.moves, this.currentMove.id);

        return parent ? this.cloneWith({currentMove: parent}) : this;
    }

    public lastMove(): Pgn {
        const currentVariation = findVariation(this.moves, this.currentMove.id);
        return this.cloneWith({currentMove: currentVariation[currentVariation.length - 1]});
    }

    public firstMove(): Pgn {
        const currentVariation = findVariation(this.moves, this.currentMove.id);
        return this.cloneWith({currentMove: currentVariation[0]});
    }

    public toString = (): string => {
        const tags = Object
            .keys(this.tags)
            .map(tagKey => `[${tagKey} "${this.tags[tagKey]}"]`)
            .join("\n");
        const moves = this.movesToString(this.moves);

        let pgnString = "";

        if(tags && moves){
            pgnString = `${tags}\n\n${moves}`;
        } else if(tags){
            pgnString = tags;
        } else if(moves){
            pgnString = moves;
        }

        if(this.result && moves){
            pgnString += ` ${this.result}`;
        } else {
            pgnString += this.result;
        }

        return pgnString;
    };

    public traverse(callback: (move: Move) => any): Pgn {
        traverseMoves(this.moves, callback);
        return this;
    };

    public find(predicate: (move: Move) => boolean): Move|null {
        return findMove(this.moves, predicate);
    };

    public map(callback: (move: Move) => Move, replaceVariations = false): Pgn {
        return this.cloneWith({
            moves: mapMoves<Move>(this.moves, callback, replaceVariations)
        });
    };

    public filter(predicate: (move: Move) => boolean): Pgn {
        return this.cloneWith({
            moves: filterMoves(this.moves, predicate)
        });
    };

    public movesToString(moves: Move[] = this.moves, isVariation = false): string {
        let previousHaveVariations = false;

        return moves
            .map(({name, color, number, variations, comment, annotation}, i) => {
                let variationsString = "";
                let moveString = "";

                if(variations.length > 0){
                    variationsString = variations
                        .map(moves => `(${this.movesToString(moves, true)})`)
                        .reduce((strings, string, i) => i === 0
                            ? strings + string
                            : `${strings} ${string}`, "");
                }

                if(color === "white"){
                    moveString = `${number}. ${name}`;
                    moveString = (annotation)
                        ? `${moveString} ${annotation}`
                        : moveString;
                    moveString = (comment)
                        ? `${moveString} {${comment}}`
                        : moveString;
                    moveString = (variationsString)
                        ? `${moveString} ${variationsString}`
                        : moveString;
                } else if(color === "black"){
                    moveString = ((isVariation && i === 0) || (previousHaveVariations))
                        ? `${number}... ${name}`
                        : name;
                    moveString = (annotation)
                        ? `${moveString} ${annotation}`
                        : moveString;
                    moveString = (comment)
                        ? `${moveString} {${comment}}`
                        : moveString;
                    moveString = (variationsString)
                        ? `${moveString} ${variationsString}`
                        : moveString;
                }

                if(i !== moves.length - 1){
                    moveString += " ";
                }

                previousHaveVariations = variations.length > 0;

                return moveString;
            })
            .reduce((strings, string) => strings + string, "");
    };

    private updateCurrentMove(move: Partial<Move>){
        const newCurrentMove = {...this.currentMove, ...move};

        return this.cloneWith({
            moves: this.map(move => move.id === this.currentMove.id
                    ? newCurrentMove : move, move.variations !== undefined).moves,
            currentMove: newCurrentMove
        });
    }

    private createMove(args: string | MoveArgs, number: number, color: Color): Move {
        return typeof args === "string"
            ? new Move({name: args, number, color})
            : new Move({...args, number, color});
    }
}

export default Pgn;