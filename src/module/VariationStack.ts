import {Move} from "./Move";
import {Variation} from "./types";

export class VariationStack {
    readonly stack: Variation[];

    constructor(){
        this.stack = [{moves: []}];
    }

    addVariation(){
        const variation: Variation = {
            parentMoveId: this.getCurrentMove().id,
            moves: []
        };
        this.stack.push(variation);
    }

    addMove(name: string, number: number){
        const move = new Move({number, color: this.getCurrentColor(), name});
        this.top().moves.push(move);
    }

    addComment(comment: string){
        this.getCurrentMove().comment = comment;
    }

    getCurrentMove(){
        const moves = this.top().moves;
        const currentMove = moves[moves.length - 1];

        if(currentMove) {
            return currentMove;
        }

        return currentMove;
    }

    getPreviousMove(): Move|null {
        let moves = this.top().moves;
        let previousMove = moves[moves.length - 2];

        if (previousMove) {
            return previousMove;
        }

        moves = this.stack[this.stack.length - 2] ? this.stack[this.stack.length - 2].moves : [];
        previousMove = moves[moves.length - 1];

        return previousMove ? previousMove : null;
    }

    top(){
        return this.stack[this.stack.length - 1];
    }

    getCurrentParent(): Move {
        const moves = this.stack[this.stack.length - 2] ? this.stack[this.stack.length - 2].moves : [];
        return moves[moves.length - 1];
    }

    pop(): Variation {
        const variation = this.stack.pop();

        if (!variation) {
            throw new Error("Tried to pop an empty stack.");
        }

        return variation;
    }

    size(){
        return this.stack.length;
    }

    private getCurrentColor(){
        const move = this.getCurrentMove();

        if (move) {
            return move.color === "white" ? "black" : "white";
        } else if(this.size() > 1) {
            const parentMoves = this.stack[this.stack.length - 2].moves;
            const parentMove = parentMoves[parentMoves.length - 1];
            return parentMove.color;
        }

        return "white";
    }
}