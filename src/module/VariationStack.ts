import {hasSameNumberAndColor, isFirstMove, Move} from "./Move";
import {Variation} from "./Variation";

export class VariationStack {
    readonly stack: Variation[];

    constructor(){
        this.stack = [];
    }

    addVariation(variation: Variation){
        this.stack.push(new Variation({id: variation.id}));
    }

    addMove(name: string, number: number){
        const move = new Move({variationId: this.top().id, number, color: this.getCurrentColor(), name});
        this.top().moves.push(move);
    }

    addComment(comment: string){
        this.getCurrentMove().comment = comment;
    }

    getCurrentMove(){
        const moves = this.top().moves;
        return moves[moves.length - 1];
    }

    getPreviousMove(): Move|undefined {
        let moves = this.top().moves;
        let previousMove = moves[moves.length - 2];

        if (previousMove) {
            return previousMove;
        }

        moves = this.previous() ? this.previous().moves : [];
        previousMove = moves[moves.length - 1];

        return previousMove ? previousMove : undefined;
    }

    top(){
        return this.stack[this.stack.length - 1];
    }

    previous(){
        return this.stack[this.stack.length - 2];
    }

    getCurrentParent(): Move|undefined {
        if (!this.stack[this.stack.length - 2]) return undefined;

        const parentMoves = this.stack[this.stack.length - 2].moves;
        const parent = parentMoves[parentMoves.length - 2];
        const currentMove = this.getCurrentMove();

        if (currentMove && parent && isFirstMove(parent)) {
            return !hasSameNumberAndColor(parent, currentMove) ? parent : undefined;
        }

        return parent ? parent : undefined;
    }

    pop(): Variation {
        const variation = this.stack.pop();

        if (!variation) {
            throw new Error("Tried to pop an root stack.");
        }

        return variation;
    }

    size(){
        return this.stack.length;
    }

    private getCurrentColor(){
        const move = this.getCurrentMove();
        const previousMove = this.getPreviousMove();

        if (move) {
            return move.color === "white" ? "black" : "white";
        } else if(previousMove) {
            return previousMove.color;
        }

        return "white";
    }
}