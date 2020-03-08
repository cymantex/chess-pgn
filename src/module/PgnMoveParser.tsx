import {PlayerColor} from "chess-fen/types";
import {Move} from "./types";

interface VariationData {
    number: number,
    color: PlayerColor,
    variationId: number
}

export class PgnMoveParser {
    private moveText: string;
    private readonly moves: Move[];
    private currentMoveNumber: number;
    private currentMove: Move;
    private comment: string;
    private currentColor: PlayerColor;
    private token: string;
    private moveCount: number;
    private variationCount: number;
    private nestedVariations: number;
    private readonly variationData: {[key: number]: VariationData};

    constructor(pgnMoveText: string) {
        this.moveText = pgnMoveText;
        this.moves = [];
        this.currentMoveNumber = 0;
        this.nestedVariations = 0;
        this.variationData = {};
        this.currentMove = {
            id: 0,
            number: 0,
            color: PlayerColor.White,
            move: ""
        };
        this.comment = "";
        this.currentColor = PlayerColor.White;
        this.token = "";
        this.moveCount = 0;
        this.variationCount = 0;
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
    };

    private parseComment(): void {
        if(this.isCommentStart()){
            this.comment = this.token.replace("{", "");
            this.stopParsingToken();
        } else if(this.isCommentEnd()){
            this.comment = this.comment + " " + this.token.split("}")[0];
            this.addComment();
            this.token = this.token.replace(/.*}/, "");
        } else if(this.comment){
            this.comment += " " + this.token;
            this.stopParsingToken();
        }
    };

    private parseVariation(): void {
        if(this.isVariationStart()){
            this.variationCount++;
            this.updateVariationData();
            this.nestedVariations++;
        } else if(this.isVariationEnd()){
            this.token = this.token.replace(")", "");
            this.parseMove();
            this.nestedVariations--;
        }
    };

    private parseMove(): void {
        if(this.isMoveNumber()){
            this.updateMoveNumber();
        } else if(this.token.length > 1){
            this.addMove();
            this.updateColor();
        } else if(this.token.length === 1){
            this.currentMove.move += " " + this.token;
        }

        this.stopParsingToken();
    };

    private parseMoveNumber(): number {
        return parseInt(this.token.replace(/\W/g, ""), 10);
    };

    private updateVariationData(): void {
        if(this.isVariation()){
            this.variationData[this.nestedVariations + 1] = {
                ...this.variationData[this.nestedVariations],
                variationId: this.variationData[this.nestedVariations].variationId + 1,
                color: this.toggleColor()
            };
        } else {
            this.variationData[1] = {
                number: this.currentMoveNumber,
                color: this.toggleColor(),
                variationId: this.variationCount
            };
        }
    };

    private updateMoveNumber(): void {
        if(this.isVariation()){
            this.variationData[this.nestedVariations].number = this.parseMoveNumber();
        } else {
            this.currentMoveNumber = this.parseMoveNumber();
        }
    };

    private toggleColor(): PlayerColor {
        return this.getColor() === PlayerColor.White ? PlayerColor.Black : PlayerColor.White;
    };

    private updateColor(): void {
        if(this.isVariation()){
            this.variationData[this.nestedVariations].color = this.toggleColor();
        } else {
            this.currentColor = this.toggleColor();
        }
    };

    private addComment(moves = this.moves, comment = this.comment, nestedVariations = this.nestedVariations): void {
        if(nestedVariations === 0){
            moves[moves.length - 1].comment = comment;
            this.comment = "";
        } else {
            this.addComment(moves[moves.length - 1].variations, comment, nestedVariations - 1);
        }
    };

    private addMove(moves = this.moves, move = this.token, nestedVariations = this.nestedVariations): void {
        const createMove = () => {
            this.currentMove = {
                id: this.moveCount,
                number: this.getMoveNumber(),
                color: this.getColor(),
                move,
            };

            this.moveCount++;
            return this.currentMove;
        };

        if(nestedVariations === 0){
            moves.push(createMove());
        } else if(!moves[moves.length - 1].variations){
            moves[moves.length - 1].variations = [createMove()];
        } else {
            this.addMove(moves[moves.length - 1].variations, move, nestedVariations - 1);
        }
    };

    private getMoveNumber(): number {
        return this.isVariation() && this.variationData[this.nestedVariations].number
            ? this.variationData[this.nestedVariations].number
            : this.currentMoveNumber;
    };

    private getColor(): PlayerColor {
        return this.isVariation() && this.variationData[this.nestedVariations].color
            ? this.variationData[this.nestedVariations].color
            : this.currentColor;
    };

    private isMoveNumber(): boolean {
        return this.token.match(/\d\./) != null;
    };

    private isVariation(): boolean {
        return this.nestedVariations > 0;
    };

    private isVariationStart(): boolean {
        return this.token.startsWith("(");
    };

    private isVariationEnd(): boolean {
        return this.token.endsWith(")");
    };

    private isCommentStart(): boolean {
        return this.token.includes("{");
    };

    private isCommentEnd(): boolean {
        return this.token.includes("}");
    };

    private stopParsingToken(): void {
        this.token = "";
    };
}

export default PgnMoveParser;