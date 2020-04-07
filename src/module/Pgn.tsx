import PgnParser, {PgnData} from "./PgnParser";
import {MoveArgs, Tags} from "./types";
import {Move} from "./Move";
import {
    addMove,
    filter,
    findMove,
    findVariation,
    findVariationParent,
    map,
    toggleColor,
    traverse
} from "./utils";
import {Color} from "chess-fen/types";

export interface PgnCloneArgs extends Partial<PgnData> {}

//TODO: add support for empty string
//TODO: add support for delete remaining moves
export class Pgn {
    readonly tags: Tags;
    readonly result: string;
    readonly moveTree: Move;
    readonly currentMove: Move;

    constructor(args?: PgnData | string) {
        const parsedArgs = typeof args === "string" ? new PgnParser(args).parse() : args;
        const defaultRoot = Move.root();
        const {tags, result, moveTree, currentMove} = {
            tags: {},
            result: "*",
            moveTree: defaultRoot,
            currentMove: defaultRoot,
            ...parsedArgs
        };
        this.tags = tags;
        this.result = result;
        this.moveTree = moveTree;
        this.currentMove = currentMove;
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

        if (this.getVariations().length === 0) {
            return this.cloneWith({
                moveTree: {...this.moveTree, variations: [[newMove]]},
                currentMove: newMove
            });
        } else if (this.currentMove.name === "root") {
            const variationsIncludesMove = this
                .moveTree
                .variations
                .map(variation => variation[0].name)
                .find(name => name === newMove.name);

            const variations = variationsIncludesMove
                ? this.moveTree.variations
                : [...this.moveTree.variations, [newMove]];

            return this.cloneWith({
                moveTree: {...this.moveTree, variations},
                currentMove: variationsIncludesMove ? this.currentMove : newMove
            });
        }

        const variations = addMove(this.getVariations(), newMove, this.currentMove);
        const addedMove = findMove(variations, ({id}) => id === newMove.id);

        return this.cloneWith({
            moveTree: {...this.moveTree, variations},
            currentMove: addedMove ? newMove : this.currentMove
        });
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

    public nextMove(): Pgn {
        const currentVariation = findVariation(this.getVariations(), this.currentMove.id);

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
        const currentVariation = findVariation(this.getVariations(), this.currentMove.id);

        for(let i = 0; i < currentVariation.length; i++){
            if (currentVariation[i].id === this.currentMove.id) {
                const previousMove = currentVariation[i - 1];

                if (previousMove) {
                    return this.cloneWith({currentMove: previousMove});
                }
            }
        }

        const parent = findVariationParent(this.getVariations(), this.currentMove.id);

        return parent
            ? this.cloneWith({currentMove: parent})
            : this.startingPosition();
    }

    public lastMove(): Pgn {
        const currentVariation = findVariation(this.getVariations(), this.currentMove.id);
        return this.cloneWith({currentMove: currentVariation[currentVariation.length - 1]});
    }

    public firstMove(): Pgn {
        const currentVariation = findVariation(this.getVariations(), this.currentMove.id);
        return this.cloneWith({currentMove: currentVariation[0]});
    }

    public startingPosition(): Pgn {
        return this.cloneWith({currentMove: Move.root()});
    }

    public toString = (): string => {
        const tags = Object
            .keys(this.tags)
            .map(tagKey => `[${tagKey} "${this.tags[tagKey]}"]`)
            .join("\n");
        const moves = this.variationsToString(this.getVariations());

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
        traverse(this.getVariations(), callback);
        return this;
    };

    public find(predicate: (move: Move) => boolean): Move|null {
        return findMove(this.getVariations(), predicate);
    };

    public map(callback: (move: Move) => Move, replaceVariations = false): Pgn {
        return this.cloneWith({
            moveTree: {
                ...this.moveTree,
                variations: map<Move>(this.getVariations(), callback, replaceVariations)
            }
        });
    };

    public filter(predicate: (move: Move) => boolean): Pgn {
        return this.cloneWith({
            moveTree: {
                ...this.moveTree,
                variations: filter(this.getVariations(), predicate)
            }
        });
    };
    
    public getVariations(){
        return this.moveTree.variations;
    }

    public variationsToString(variations: Move[][]): string {
        const [mainVariation, ...subVariations] = variations;
        const [firstMove] = mainVariation;

        if (!firstMove) {
            return "";
        }

        const moveToString = ({number, name, annotation, comment, color}: Move, addBlackMoveNumber = false) => {
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

        const variationToString = (variation: Move[], addBlackMoveNumber?: (move: Move) => boolean): string[] => {
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
        const newCurrentMove = {...this.currentMove, ...move};

        return this.cloneWith({
            moveTree: this.map(move => move.id === this.currentMove.id
                ? newCurrentMove : move, move.variations !== undefined).moveTree,
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