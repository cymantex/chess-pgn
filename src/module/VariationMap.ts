import {Move} from "./Move";
import {Variation} from "./Variation";
import {MoveTree} from "./types";

//TODO: Think about mutation handling
export class VariationMap {
    private readonly variationMap: Map<string, Variation> = new Map<string, Variation>();

    constructor(map?: Map<string, Variation>){
        this.variationMap = map ? new Map<string, Variation>(map) : new Map<string, Variation>();
    }

    public clone(): VariationMap {
        return new VariationMap(this.variationMap);
    }

    public addVariation(parent?: Move): Variation {
        const variation = new Variation(parent ? {parentMoveId: parent.id, parentVariationId: parent.variationId} : {});
        this.variationMap.set(variation.id, variation);
        return variation;
    }

    public getVariation(variationId: string): Variation {
        const variation = this.variationMap.get(variationId);

        if (!variation) {
            throw new Error(`Unknown variation id ${variationId}`);
        }

        return variation;
    }

    public removeVariation(variationId: string): boolean {
        // Not this simple. Needs to recursively delete all following references

        // What happens when main line is deleted?
        const variation = this.getVariation(variationId);

        return this.variationMap.delete(variationId);
    }

    public addMove(move: Move): void {
        this.getMoves(move.variationId).push(move);
    }

    public updateMove(move: Move): void {
        const variation = this.getVariation(move.variationId);

        this.variationMap.set(move.variationId, variation.cloneWith({
            moves: variation.moves.map(variationMove => variationMove.id === move.id ? move : variationMove)
        }));
    }

    public getParent(variation: Variation): Move|null {
        if (!variation.parentVariationId || !variation.parentMoveId) return null;

        return this.getMove(variation.parentVariationId, variation.parentMoveId);
    }

    public getMove(variationId: string, moveId: string) {
        const move: Move|undefined = this.getMoves(variationId).find(variationMove => variationMove.id === moveId);

        if (!move) {
            throw new Error(`Could not find move id ${moveId} in variation ${variationId}`);
        }

        return move;
    }

    public findMove(predicate: (move: Move) => boolean): Move|null {
        for (const [, variation] of this.variationMap) {
            const foundMove = variation.moves.find(predicate);
            if (foundMove) return foundMove;
        }

        return null;
    }

    public getMoves(variationId: string): Move[] {
        return this.getVariation(variationId).moves;
    }

    public getTheMainLine(): Move[] {
        const mainLine = this.getMainLines()[0];
        return mainLine ? mainLine : [];
    }

    public getMainLines(): Move[][] {
        const moves: Move[][] = [];

        this.variationMap.forEach(variation => {
            if (!variation.parentMoveId) {
                moves.push(variation.moves);
            }
        });

        return moves;
    }

    public variations(): Move[][] {
        const variations = [];

        for (const variation of this.variationMap.values()) {
            variations.push(variation.moves)
        }

        return variations;
    }

    public traverse(callback: (move: Move) => void): void {
        this.variationMap.forEach((variation) => {
            variation.moves.forEach(callback);
        });
    }

    public map(callback: (move: Move) => Move): VariationMap {
        const newMap = new Map<string, Variation>();

        this.variationMap.forEach((variation) => {
            const moves = variation.moves.map(callback);
            newMap.set(variation.id, variation.cloneWith({moves}));
        });

        return new VariationMap(newMap);
    }

    public filter(predicate: (move: Move) => boolean): VariationMap {
        const newMap = new Map<string, Variation>();

        this.variationMap.forEach((variation) => {
            const moves = variation.moves.filter(predicate);
            newMap.set(variation.id, variation.cloneWith({moves}));
        });

        return new VariationMap(newMap);
    }

    public size(): number {
        return this.variationMap.size;
    }

    public tree(): MoveTree[][] {
        const mainLines = this.getMainLines();

        return mainLines.map(moves => moves.map(move => ({
            ...move,
            variations: this.toTree(move.variations)
        })));
    }

    private toTree(variationIds: string[]): MoveTree[][] {
        return variationIds.map(variationId => this.getMoves(variationId).map(move => ({
            ...move,
            variations: this.toTree(move.variations)
        })));
    }
}