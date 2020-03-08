import Pgn from "../module/Pgn";
import Fen from "chess-fen/Fen";
import {PlayerColor} from "chess-fen/types";

const createTestPgn = ({event, date, fen, result = ""}: {event?: string, date?: string, fen?: string, result?: string}) => {
    const eventTag = event ? `[Event "${event}"]` : "";
    const dateTag = date ? `[Date "${date}"]` : "";
    const fenTag = fen ? `[FEN "${fen}"]` : "";

    return `
${eventTag}
${dateTag}
${fenTag}

1. Nf3 d5 2. d4 Bf5 3. c4 e6 4. Nc3 Nc6 5. cxd5 exd5 6. Bf4 Bd6 7. Bg3 (7. Nxd5
Be4 8. Nc3 Bxf3 9. Bxd6 Qxd6 10. gxf3 Qxd4 11. e3 Qf6 12. Nd5 Qd6 13. Qb3 Nge7
{Aronian,L (2795)-Li,C (2746) Moscow 2016}) 7... Nf6 8. e3 Ne7 N (8... O-O 9.
Be2 Ne7 10. O-O c6 11. Nd2 Nc8 12. a3 Bxg3 13. hxg3 Qe7 14. b4 a6 15. Qb3 b5 16.
Na2 Nb6 {Grunberg,M (2426)-Stevic,H (2616) Austria 2012}) 9. Bh4 Ne4 10. Bd3 c6
11. Qc2 Qa5 12. Bxe7 Bxe7 13. O-O Nxc3 14. Bxf5 Nb5 15. Ne5 Qc7 16. Bxh7 Bf6 17.
f4 O-O-O 18. Bd3 Nd6 19. Rac1 Kb8 20. b4 Qe7 21. a4 Rc8 22. Qb3?! {Allowing some
tactics based on the unprotected e-pawn.} (22. Qe2) 22... Bxe5! 23. dxe5 f6! 24.
Qc3 (24. exd6? Qxe3+ 25. Kh1 (25. Rf2 Qxc1+ 26. Kh2 Kh8 N) 25... Rxh2+ 26. Kxh2 Rh8+) 24...
Nf7 (24... fxe5) 25. Bf5 Rc7 26. exf6 gxf6 27. Rf3 Nd6 28. Bd3 Rd8 29. Qd4 Ne4
30. Rh3 a5 31. bxa5 c5 32. Qb2 c4 33. Bxe4 dxe4 34. Rh5? {He was still better,
but Kramnik again misses a tactic.} (34. Rg3) 34... c3! 35. Rxc3 Rd1+ 36. Kf2
Qd8! {Suddenly there's no defense.} 37. Kg3 Rd2 38. Qb3 Rg7+ 39. Kh3 Rgxg2 40.
Qf7 f5! ${result}
`;
};


describe("Pgn", () => {
    const event = "Levitov Chess Week Rapid";
    const date = "2019.08.05";
    const fen = Fen.emptyPosition;
    const result = "0-1";
    const pgnString = createTestPgn({event, date, fen, result});
    const pgn = new Pgn(pgnString);

    describe("Parsing tests", () => {
        it("Should parse tags", () => {
            expect(pgn.tags.Event).toBe(event);
            expect(pgn.tags.Date).toBe(date);
            expect(pgn.tags.FEN).toBe(fen);

            const pgnWithoutTags = new Pgn(createTestPgn({result}));
            expect(pgnWithoutTags.tags).toEqual({});
        });

        it("Should parse fen", () => {
            expect(pgn.fen.toString()).toBe(fen);

            const pgnWithoutFen = new Pgn(createTestPgn({event, date, result}));
            expect(pgnWithoutFen.fen.toString()).toBe(Fen.startingPosition);
        });

        it("Should parse result", () => {
            expect(pgn.result).toBe("0-1");

            const pgnWithoutResult = new Pgn(createTestPgn({event, date, fen}));
            expect(pgnWithoutResult.result).toBe("*");
        });

        it("Should parse moves", () => {
            expect(pgn.moves.length).toBe(80);

            const movesWithVariations = pgn.moves
                .filter(move => move.variations !== undefined && move.variations.length > 0);
            expect(movesWithVariations.length).toBe(6);
            const moveWithNestedVariationAndComment = movesWithVariations.find(move => move.number === 22);
            expect(moveWithNestedVariationAndComment).toBeDefined();

            if(moveWithNestedVariationAndComment){
                expect(moveWithNestedVariationAndComment.comment).toBeDefined();
                expect(moveWithNestedVariationAndComment.variations).toBeDefined();
                if(moveWithNestedVariationAndComment.variations){
                    expect(moveWithNestedVariationAndComment.variations.length).toBe(1);
                }
            }
        });
    });

    describe("toString", () => {
        it("tags", () => {
            const actualTags = pgn.toString().split("\n\n")[0];
            const expectedTags = pgnString.split("\n\n")[0].trim();
            expect(actualTags).toBe(expectedTags);
        });

        it("moves", () => {
            const actualMoveText = pgn.toString().split("\n\n")[1];
            const expectedMoveText = pgnString.split("\n\n")[1].replace(/\n/g, " ").trim();

            expect(actualMoveText).toBe(expectedMoveText);
        })
    });

    it("Should traverseMoves", () => {
        let moveCount = 0;
        pgn.traverseMoves(() => moveCount++);

        expect(moveCount).toBe(124);
    });

    it("Should mapMoves", () => {
        pgn.mapMoves(move => ({...move, color: PlayerColor.White})).traverseMoves(move => {
            expect(move.color).toBe(PlayerColor.White);
        });
    });

    it("Should filterMoves", () => {
        pgn.filterMoves(move => move.number <= 22).traverseMoves(move => {
            expect(move.number <= 22).toBeTruthy();
        });
    });

    it("Should convert movesToString", () => {
        const actualMoveText = pgn.movesToString();
        const expectedMoveText = pgnString.split("\n\n")[1].replace(/\n/g, " ").trim();

        expect(expectedMoveText.startsWith(actualMoveText)).toBeTruthy();
    });

    it("Should addResult", () => {
        expect(pgn.addResult("1-0").result).toBe("1-0");
    });

    it("Should appendMove", () => {
        const previousLastMove = pgn.getLastMove();
        const lastWhiteMove = pgn.appendMove("Ke1").getLastMove();
        const lastBlackMove = pgn.appendMove("Ke1").appendMove("Kd8").getLastMove();

        expect(lastWhiteMove).toBeDefined();
        expect(lastBlackMove).toBeDefined();
        expect(previousLastMove).toBeDefined();

        if(lastWhiteMove && lastBlackMove && previousLastMove){
            expect(lastWhiteMove.number).toBe(previousLastMove.number + 1);
            expect(lastWhiteMove.id).toBe(previousLastMove.id + 1);
            expect(lastWhiteMove.color).toBe(PlayerColor.White);
            expect(lastWhiteMove.move).toBe("Ke1");
            expect(lastBlackMove.id).toBe(previousLastMove.id + 2);
            expect(lastBlackMove.number).toBe(previousLastMove.number + 1);
            expect(lastBlackMove.color).toBe(PlayerColor.Black);
            expect(lastBlackMove.move).toBe("Kd8");
        }
    });

    it("Should addTag", () => {
        const tags = pgn.addTag("Foo", "foo").tags;
        expect(tags.Foo).toBe("foo");
    });

    it("Should handle empty PGN", () => {
        const emptyPgn = new Pgn();
        console.log(emptyPgn
            .appendMove("d4")
            .appendMove("d5")
            .appendMove("c4")
            .addTag("FEN", "fenstring")
            .addResult("1-0")
            .toString());
    });
});