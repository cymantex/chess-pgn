import {v1 as uuid} from "uuid";
import {Move} from "./Move";

export interface VariationConstructor {
    id?: string,
    parentMoveId?: string,
    parentVariationId?: string,
    moves?: Move[]
}

export class Variation {
    readonly id: string;
    readonly parentVariationId?: string;
    readonly parentMoveId?: string;
    readonly moves: Move[];

    constructor({id, parentMoveId, parentVariationId, moves = []}: VariationConstructor = {}){
        this.id = id ? id : uuid();
        this.parentMoveId = parentMoveId;
        this.parentVariationId = parentVariationId;
        this.moves = moves;
    }

    public cloneWith({moves = this.moves}: Pick<VariationConstructor, "moves">) {
        return new Variation({
            id: this.id,
            parentMoveId: this.parentMoveId,
            parentVariationId: this.parentVariationId,
            moves
        });
    }
}