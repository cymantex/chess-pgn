import {PgnParser} from "../module";
import {map} from "../module/utils";

const createTestPgn = () => {
    const pgnString = `
[Site "?"]
[Date "????.??.??"]

1. e4 (1. d4 Nf6 (1... d5) (1... f5)) (1. c4) 1... c5 0-1`.trim();
    return new PgnParser(pgnString).parse();
};


//TODO: Test comments including sensitive characters like ({, [, ()

describe("tags", () => {
    const pgn = createTestPgn();

    it("parses tags", () => {
        expect(pgn.tags.Site).toBe("?");
        expect(pgn.tags.Date).toBe("????.??.??");
    });

    it("parses tags in pgn without tags to root object", () => {
        expect(new PgnParser("1. e4").parse().tags).toEqual({});
    });
});

describe("result", () => {
    const pgn = createTestPgn();

    it("parses result", () => {
        expect(pgn.result).toBe("0-1");
    });

    it("parses pgn without result to *", () => {
        expect(new PgnParser("1. e4").parse().result).toBe("*");
    });
});

describe("moves", () => {
    const parseMoves = (pgn: string) => {
        const pgnData = new PgnParser(pgn).parse();
        const currentMove = pgnData.currentMove;

        if (!currentMove) return undefined;

        const tree = pgnData.variationMap.tree();

        return map(tree, ({number, name, color, variations, annotation, comment}) =>
            ({number, name, color, variations, annotation, comment}));
    };

    //TODO: Validation

    it("parses pgn without moves", () => {
        expect(parseMoves("")).toEqual([[]]);
    });

    it("parses single move", () => {
        expect(parseMoves("1. e4 {A reasonable first move}")).toEqual([[{
            number: 1,
            color: "white",
            name: "e4",
            comment: "A reasonable first move",
            variations: []
        }]]);
    });

    it("parses flat list of moves", () => {
        expect(parseMoves("1. e4 c5 2. Nf3")).toEqual([[
            {number: 1, color: "white", name: "e4", variations: []},
            {number: 1, color: "black", name: "c5", variations: []},
            {number: 2, color: "white", name: "Nf3", variations: []}
        ]]);
    });

    it("parses single nested moves", () => {
        expect(parseMoves("1. e4 (1. c4 {english} c5 {symmetrical} 2. g3 g6) (1. Nf3 N Nf6 {indian}) 1... e5 (1... c5) 2. Nf3 (2. c3)")).toEqual([
            [
                {
                    number: 1,
                    color: "white",
                    name: "e4",
                    variations: [
                        [
                            {number: 1, color: "black", name: "c5", variations: []}
                        ],
                    ]
                },
                {
                    number: 1,
                    color: "black",
                    name: "e5",
                    variations: [
                        [
                            {number: 2, color: "white", name: "c3", variations: []}
                        ]
                    ]
                },
                {number: 2, color: "white", name: "Nf3", variations: []}
            ],
            [
                {
                    "color": "white",
                    "comment": "english",
                    "name": "c4",
                    "number": 1,
                    "variations": []
                },
                {
                    "color": "black",
                    "comment": "symmetrical",
                    "name": "c5",
                    "number": 1,
                    "variations": []
                },
                {
                    "color": "white",
                    "name": "g3",
                    "number": 2,
                    "variations": []
                },
                {
                    "color": "black",
                    "name": "g6",
                    "number": 2,
                    "variations": []
                }
            ],
            [
                {
                    "annotation": "N",
                    "color": "white",
                    "name": "Nf3",
                    "number": 1,
                    "variations": []
                },
                {
                    "color": "black",
                    "comment": "indian",
                    "name": "Nf6",
                    "number": 1,
                    "variations": []
                }
            ]
        ]);
    });

    it("parses multiple nested moves", () => {
        expect(parseMoves("1. e4 (1. c4 c5 foo bar (1... e5 2. g3 {foo} (2. Nc3 {foo})) (1... Nf6)) 1... c5")).toEqual([
            [
                {
                    number: 1,
                    color: "white",
                    name: "e4",
                    variations: []
                },
                {
                    color: "black",
                    name: "c5",
                    number: 1,
                    variations: []
                }
            ],
            [
                {
                    number: 1, color: "white", name: "c4", variations: [
                        [
                            {
                                number: 1, color: "black", name: "e5", variations: [
                                    [{number: 2, color: "white", name: "Nc3", comment: "foo", variations: []}]
                                ]
                            },
                            {number: 2, color: "white", name: "g3", comment: "foo", variations: []}
                        ],
                        [{number: 1, color: "black", name: "Nf6", variations: []}]
                    ]
                },
                {
                    number: 1, color: "black", name: "c5", annotation: "foo bar", variations: []
                }
            ]
        ]);
    });

    it("sets variation ids correctly", () => {
        const moves = "1. e4 (1. c4 c5 foo bar (1... e5 2. g3 {foo} (2. Nc3 {foo})) (1... Nf6)) 1... c5";
        const variationMap = new PgnParser(moves).parse().variationMap;
        const e5 = variationMap.findMove(move => move.name === "e5");

        expect(e5).toBeDefined();

        if (e5) {
            const variation = variationMap.getVariation(e5.variationId);

            if (variation.parentMoveId && variation.parentVariationId) {
                expect(variationMap.getMove(variation.parentVariationId, variation.parentMoveId).name).toBe("c4");
            }
        }
    });
});