import {Move} from "./Move";
import {Variation} from "./types";

export class VariationStack {
    readonly stack: Variation[];
    readonly root: Move;

    constructor(root: Move){
        this.root = root;
        this.stack = [{moves: [root]}];
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
        return moves[moves.length - 1];
    }

    getPreviousMove(): Move|null {
        let moves = this.top().moves;
        let previousMove = moves[moves.length - 2];

        if (previousMove) {
            return previousMove;
        }

        moves = this.previous() ? this.previous().moves : [];
        previousMove = moves[moves.length - 1];

        return previousMove ? previousMove : null;
    }

    top(){
        return this.stack[this.stack.length - 1];
    }

    previous(){
        return this.stack[this.stack.length - 2];
    }

    getCurrentParent(): Move {
        const parentMoves = this.stack[this.stack.length - 2].moves;
        return parentMoves[parentMoves.length - 2] ? parentMoves[parentMoves.length - 2] : this.root;
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
            if(previousMove.name === "root") {
                return "white";
            }

            return previousMove.color;
        }

        return "white";
    }
}