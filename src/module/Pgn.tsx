import PgnParser, {PgnData} from "./PgnParser";
import {MoveArgs, MoveTree, Tags} from "./types";
import {Move} from "./Move";
import {Color} from "chess-fen/types";
import {VariationMap} from "./VariationMap";
import {indexOf, toggleColor} from "./utils";

export interface PgnCloneArgs extends Partial<PgnData> {}

//TODO: add delete variation / move
//TODO: add promoting/demoting variations?
//TODO: adds [undefined] in nextMoves from empty root
export class Pgn {
    readonly tags: Tags;
    readonly result: string;
    readonly currentMove: Move;
    private readonly variationMap: VariationMap;

    constructor(args?: PgnData | string) {
        const parsedArgs = typeof args === "string" ? new PgnParser(args).parse() : args;
        const {tags, result, variationMap, currentMove} = {
            tags: {},
            result: "*",
            variationMap: new VariationMap(),
            currentMove: Move.root(),
            ...parsedArgs
        };
        this.tags = tags;
        this.result = result;
        this.variationMap = variationMap;
        this.currentMove = currentMove;
    }

    public static parse(pgnList: string): Pgn[] {
        return pgnList
            .split("\n\n[")
            .map(pgn => !pgn.startsWith("[") ? "[" + pgn : pgn)
            .map(pgn => new Pgn(pgn));
    }

    public cloneWith(args: PgnCloneArgs): Pgn {
        return new Pgn({
            tags: this.tags,
            result: this.result,
            currentMove: this.currentMove,
            variationMap: this.variationMap.clone(),
            ...args
        });
    }

    public addResult = (result: string): Pgn => this.cloneWith({result});

    public addTag = (key: string, value: string): Pgn => this.cloneWith({tags: {...this.tags, [key]: value}});

    public move = (args: string | MoveArgs): Pgn => {
        const moveName = typeof args === "string" ? args : args.name;
        const nextMoveWithSameName = this.nextMoves().find(move => move.name === moveName);

        if (nextMoveWithSameName) {
            return this.cloneWith({currentMove: nextMoveWithSameName});
        }

        const currentMove = this.getCurrentMove();
        const newNumber = currentMove.color === "black" ? currentMove.number + 1 : currentMove.number;
        const newColor = toggleColor(currentMove.color);
        let variation = currentMove.variationId;
        const nextMove = this.getNextMove();

        if(Move.isRoot(this.currentMove)) {
            variation = this.variationMap.addVariation().id;
        } else if(nextMove) {
            variation = this.variationMap.addVariation(currentMove).id;
            currentMove.variations.push(variation);
        }

        const newMove = Pgn.createMove(args, variation, newNumber, newColor);
        this.variationMap.addMove(newMove);

        return this.cloneWith({currentMove: newMove});
    };

    public comment(comment: string) {
        return this.updateCurrentMove({comment});
    }

    public annotate(annotation: string) {
        return this.updateCurrentMove({annotation});
    }

    public selectMove(predicate: (move: Move) => boolean): Pgn {
        const move = this.find(predicate);

        if (move) {
            return this.cloneWith({currentMove: move});
        }

        return this;
    }

    public getCurrentMove(): Move {
        return this.currentMove;
    }

    public nextMove(): Pgn {
        const nextMove = this.getNextMove();
        return nextMove ? this.cloneWith({currentMove: nextMove}) : this;
    }

    public previousMove(): Pgn {
        return this.cloneWith({currentMove: this.getPreviousMove(this.currentMove)});
    }

    public lastMove(): Pgn {
        const currentMove = this.getCurrentMove();
        const currentVariation = this.variationMap.getMoves(currentMove.variationId);
        return this.cloneWith({currentMove: currentVariation[currentVariation.length - 1]});
    }

    public firstMove(): Pgn {
        const currentMove = this.getCurrentMove();
        const currentVariation = this.variationMap.getMoves(currentMove.variationId);
        return this.cloneWith({currentMove: currentVariation[0]});
    }

    public startingPosition(): Pgn {
        return this.cloneWith({currentMove: Move.root()});
    }

    public nextMoves(): Move[] {
        const currentMove = this.getCurrentMove();

        if (Move.isRoot(currentMove)) {
            return this
                .variationMap
                .getMainLines()
                .map(mainLine => mainLine[0])
                .filter(move => move);
        }

        const variation = this.variationMap.getVariation(currentMove.variationId);
        const i = indexOf(currentMove, variation.moves);
        let nextMove = variation.moves[i + 1];

        return nextMove
            ? [nextMove, ...currentMove.variations.map(variation => this.variationMap.getMoves(variation)[0])]
            : [];
    }

    public previousMoves(): Move[] {
        const previousMoves = [];
        let currentMove = this.currentMove;

        while(!Move.isRoot(currentMove)){
            previousMoves.push(currentMove);
            currentMove = this.getPreviousMove(currentMove);
        }

        return previousMoves.reverse();
    }

    public traverse(callback: (move: Move) => any): Pgn {
        this.variationMap.traverse(callback);
        return this;
    };

    public find(predicate: (move: Move) => boolean): Move|null {
        return this.variationMap.findMove(predicate);
    };

    public map(callback: (move: Move) => Move): Pgn {
        return this.cloneWith({
            variationMap: this.variationMap.map(callback)
        });
    };

    public filter(predicate: (move: Move) => boolean): Pgn {
        return this.cloneWith({
            variationMap: this.variationMap.filter(predicate)
        });
    };

    public toString = (): string => {
        const tags = Object
            .keys(this.tags)
            .map(tagKey => `[${tagKey} "${this.tags[tagKey]}"]`)
            .join("\n");
        const moves = this.variationsToString(this.variationMap.tree());

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

    public variationsToString(variations: MoveTree[][]): string {
        if (variations.length === 0) return "";

        const [mainVariation, ...subVariations] = variations;
        const [firstMove] = mainVariation;

        if (!firstMove) {
            return "";
        }

        const moveToString = ({number, name, annotation, comment, color}: MoveTree, addBlackMoveNumber = false) => {
            let moveString = "";

            if(color === "white"){
                moveString = `${number}. ${name}`;
                moveString = (annotation)
                    ? `${moveString} ${annotation}`
                    : moveString;
                moveString = (comment)
                    ? `${moveString} {${comment}}`
                    : moveString;
            } else if(color === "black"){
                moveString = addBlackMoveNumber
                    ? `${number}... ${name}`
                    : name;
                moveString = (annotation)
                    ? `${moveString} ${annotation}`
                    : moveString;
                moveString = (comment)
                    ? `${moveString} {${comment}}`
                    : moveString;
            }

            return moveString;
        };

        const variationToString = (variation: MoveTree[], addBlackMoveNumber?: (move: MoveTree) => boolean): string[] => {
            let previousMoveHadVariations = false;

            return variation.map((move, i) => {
                let variationsString = i > 0
                    ? variation[i - 1]
                        .variations
                        .map((variation) => variationToString(variation)
                            .reduce((strings, string) => strings + string, ""))
                        .reduce((strings, string, i) => i === 0 ? `(${string})` : `${strings} (${string})`, "")
                    : "";
                const addMoveNumber = (addBlackMoveNumber && addBlackMoveNumber(move));
                let moveString = moveToString(move, i === 0 || previousMoveHadVariations || addMoveNumber);
                moveString = (variationsString)
                    ? `${moveString} ${variationsString}`
                    : moveString;

                if(i !== variation.length - 1){
                    moveString += " ";
                }

                previousMoveHadVariations = variationsString.length > 0;

                return moveString;
            });
        };

        let variationsString = moveToString(firstMove);
        const subVariationString: string = subVariations
            .map((variation): string => variationToString(variation)
                .reduce((strings, string) => strings + string, ""))
            .reduce((strings, string, i) => i === 0 ? `(${string})` : `${strings} (${string})`, "");
        variationsString = subVariationString ? variationsString + " " + subVariationString : variationsString;
        const mainLineString = variationToString(mainVariation, (move) => {
            return subVariationString.length > 0 &&
                move.number === 1 &&
                !!mainVariation.find(mainMove => mainMove.id === move.id);
        }).reduce((strings, string, i) => i > 0 ? strings + string : "", "");
        variationsString = mainLineString ? variationsString + " " + mainLineString : variationsString;

        return variationsString;
    };

    private updateCurrentMove(move: Partial<Move>){
        const currentMove = this.getCurrentMove();
        const newCurrentMove: Move = {...currentMove, ...move};
        this.variationMap.updateMove(newCurrentMove);

        return this.cloneWith({currentMove: newCurrentMove});
    }

    private getNextMove(): Move|undefined {
        const currentMove = this.getCurrentMove();

        if(Move.isRoot(currentMove)){
            return this.variationMap.getTheMainLine()[0];
        }

        const variation = this.variationMap.getVariation(currentMove.variationId);
        const i = indexOf(currentMove, variation.moves);
        return variation.moves[i + 1];
    }

    private getPreviousMove(move: Move): Move {
        if (Move.isRoot(move)) {
            return move;
        }

        const variation = this.variationMap.getVariation(move.variationId);
        const i = indexOf(move, variation.moves);
        const previousMove = variation.moves[i - 1] ? variation.moves[i - 1] : this.variationMap.getParent(variation);
        return previousMove ? previousMove : Move.root();
    }

    private static createMove(args: string | MoveArgs, variationId: string, number: number, color: Color): Move {
        return typeof args === "string"
            ? new Move({name: args, number, color, variationId})
            : new Move({...args, number, color, variationId});
    }
}

export default Pgn;