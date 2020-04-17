import {VariationStack} from "./VariationStack";
import {Move} from "./Move";
import {isStandardNotation} from "./utils";
import {VariationMap} from "./VariationMap";

export class PgnMoveParser {
    private readonly moveText: string;
    private comment: string;
    private token: string;
    private moveNumber: number;
    private readonly variationStack: VariationStack;
    private readonly variationMap: VariationMap;
    rootMove?: Move;

    constructor(pgnMoveText: string) {
        this.moveText = pgnMoveText;

        this.variationMap = new VariationMap();

        this.variationStack = new VariationStack();

        if (this.moveText.includes("1.")) {
            this.variationStack.addVariation(this.variationMap.addVariation());
        }

        this.moveNumber = 0;
        this.comment = "";
        this.token = "";
    }

    public mapVariations(): VariationMap {
        this.moveText
            .split(" ")
            .forEach(token => {
                this.token = token;
                this.parseComment();
                this.parseVariation();
                this.parseMove();
            });

        return this.variationMap;
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
            const previousMove = this.variationStack.getPreviousMove();
            const currentMove = this.variationStack.getCurrentMove();

            if (currentMove) {
                const variation = this.variationMap.addVariation(previousMove);
                this.variationStack.addVariation(variation);
            } else {
                throw new Error("Encountered variation before any main move");
            }
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
            this.addMove(this.variationStack.getCurrentMove(), this.variationStack.getCurrentParent());
        } else if(this.token.length > 0) {
            const move = this.variationStack.getCurrentMove();
            move.annotation = move.annotation ? move.annotation + " " + this.token : this.token;
        }

        this.stopParsingToken();
    }

    private parseMoveNumber(): number {
        return parseInt(this.token.replace(/\W/g, ""), 10);
    }

    private addMove(nextMove: Move, parent?: Move){
        if (!this.rootMove) {
            this.rootMove = nextMove;
        }

        if(parent && this.isNewVariation(parent)) {
            parent.variations.push(nextMove.variationId);
        }

        this.variationMap.addMove(nextMove);
    }

    private isNewVariation(parent: Move): boolean {
        const nextMove = this.variationStack.getCurrentMove();

        return nextMove.color !== parent.color && (
            (parent.color === "white" && nextMove.number === parent.number) ||
            (parent.color === "black" && nextMove.number === parent.number + 1)
        );
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