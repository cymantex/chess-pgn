import {VariationStack} from "./VariationStack";
import {Move} from "./Move";
import {isStandardNotation} from "./utils";

export class PgnMoveParser {
    private readonly moveText: string;
    private readonly moves: Move[];
    private comment: string;
    private token: string;
    private moveNumber: number;
    private variationStack: VariationStack;

    constructor(pgnMoveText: string) {
        this.moveText = pgnMoveText;
        this.variationStack = new VariationStack();
        this.moveNumber = 0;
        this.comment = "";
        this.token = "";
        this.moves = [];
    }

    public parse(): Move[] {
        this.moveText
            .split(" ")
            .forEach(token => {
                this.token = token;
                this.parseComment();
                this.parseVariation();
                this.parseMove();
            });

        return this.moves;
    }

    private parseComment(): void {
        if(this.isCommentStart()){
            this.comment = this.token.replace("{", "");

            if (this.comment.includes("}")) {
                this.variationStack.addComment(this.comment.split("}")[0]);
                this.token = this.token.replace(/.*}/, "");
                this.comment = "";
            } else {
                this.stopParsingToken();
            }
        } else if(this.isCommentEnd()){
            this.variationStack.addComment(this.comment + " " + this.token.split("}")[0]);
            this.token = this.token.replace(/.*}/, "");
            this.comment = "";
        } else if(this.comment){
            this.comment += " " + this.token;
            this.stopParsingToken();
        }
    }

    private parseVariation(): void {
        if(this.isVariationStart()){
            this.variationStack.addVariation();
        } else if(this.isVariationEnd()){
            const numberOfEndedVariations = this.token.split(")").length - 1;
            this.token = this.token.replace(/\)/g, "");
            this.parseMove();

            for(let i = 0; i < numberOfEndedVariations; i++){
                this.variationStack.pop();
            }

            this.stopParsingToken();
        }
    }

    private parseMove(): void {
        if(this.isMoveNumber()){
            this.moveNumber = this.parseMoveNumber();
        } else if(isStandardNotation(this.token)){
            this.variationStack.addMove(this.token, this.moveNumber);
            this.addMove(this.variationStack.getCurrentMove(), this.variationStack.getPreviousMove());
        } else if(this.token.length > 0) {
            const move = this.variationStack.getCurrentMove();
            move.annotation = move.annotation ? move.annotation + " " + this.token : this.token;
        }

        this.stopParsingToken();
    }

    private parseMoveNumber(): number {
        return parseInt(this.token.replace(/\W/g, ""), 10);
    }

    private addMove(nextMove: Move, previousMove: Move|null){
        if (this.variationStack.size() > 1) {
            if (previousMove && nextMove.color === previousMove.color) {
                previousMove.variations.push([nextMove]);
            } else {
                const parentVariations = this.variationStack.getCurrentParent().variations;
                parentVariations[parentVariations.length - 1].push(nextMove);
            }
        } else {
            this.moves.push(nextMove);
        }
    }

    private isMoveNumber(string = this.token): boolean {
        return /\d\./.test(string);
    }

    private isVariationStart(string = this.token): boolean {
        return string.startsWith("(");
    }

    private isVariationEnd(string = this.token): boolean {
        return string.endsWith(")");
    }

    private isCommentStart(string = this.token): boolean {
        return string.includes("{");
    }

    private isCommentEnd(string = this.token): boolean {
        return string.includes("}");
    }

    private stopParsingToken(): void {
        this.token = "";
    }
}

export default PgnMoveParser;