import Pgn from "../module/Pgn";

const createTestPgn = ({event, date, result = ""}: {event?: string, date?: string, fen?: string, result?: string}) => {
    const eventTag = event ? `[Event "${event}"]` : "";
    const dateTag = date ? `[Date "${date}"]` : "";

    return (
`${eventTag}
${dateTag}

1. Nf3 d5 2. d4 Bf5 3. c4 e6 4. Nc3 Nc6 5. cxd5 exd5 6. Bf4 Bd6 7. Bg3 (7. Nxd5 Be4 8. Nc3 Bxf3 9. Bxd6 Qxd6 10. gxf3 Qxd4 11. e3 Qf6 12. Nd5 Qd6 13. Qb3 Nge7 {Aronian,L (2795)-Li,C (2746) Moscow 2016}) 7... Nf6 8. e3 Ne7 N (8... O-O 9. Be2 Ne7 10. O-O c6 11. Nd2 Nc8 12. a3 Bxg3 13. hxg3 Qe7 14. b4 a6 15. Qb3 b5 16. Na2 Nb6 {Grunberg,M (2426)-Stevic,H (2616) Austria 2012}) 9. Bh4 Ne4 10. Bd3 c6 11. Qc2 Qa5 12. Bxe7 Bxe7 13. O-O Nxc3 14. Bxf5 Nb5 15. Ne5 Qc7 16. Bxh7 Bf6 17. f4 O-O-O 18. Bd3 Nd6 19. Rac1 Kb8 20. b4 Qe7 21. a4 Rc8 22. Qb3?! {Allowing some tactics based on the unprotected e-pawn.} (22. Qe2) 22... Bxe5! 23. dxe5 f6! 24. Qc3 (24. exd6? Qxe3+ 25. Kh1 (25. Rf2 Qxc1+ 26. Kh2 Kh8 N) 25... Rxh2+ 26. Kxh2 Rh8+) 24... Nf7 (24... fxe5) 25. Bf5 Rc7 26. exf6 gxf6 27. Rf3 Nd6 28. Bd3 Rd8 29. Qd4 Ne4 30. Rh3 a5 31. bxa5 c5 32. Qb2 c4 33. Bxe4 dxe4 34. Rh5? {He was still better, but Kramnik again misses a tactic.} (34. Rg3) 34... c3! 35. Rxc3 Rd1+ 36. Kf2 Qd8! {Suddenly there's no defense.} 37. Kg3 Rd2 38. Qb3 Rg7+ 39. Kh3 Rgxg2 40. Qf7 f5! ${result}`)
};


const event = "Levitov Chess Week Rapid";
const date = "2019.08.05";
const result = "0-1";
const pgnString = createTestPgn({event, date, result});
const pgn = new Pgn(pgnString);

describe("Parsing tests", () => {
    it("parses tags", () => {
        expect(pgn.tags.Event).toBe(event);
        expect(pgn.tags.Date).toBe(date);

        const pgnWithoutTags = new Pgn(createTestPgn({result}));
        expect(pgnWithoutTags.tags).toEqual({});
    });

    it("parses result", () => {
        expect(pgn.result).toBe("0-1");

        const pgnWithoutResult = new Pgn(createTestPgn({event, date}));
        expect(pgnWithoutResult.result).toBe("*");
    });

    it("parses root PGN", () => {
        const emptyPgn = new Pgn();
        const queensGambitPgn = emptyPgn
            .move("d4")
            .move("d5")
            .move("c4")
            .addTag("FEN", "fenstring")
            .addResult("1-0")
            .toString();

        expect(`[FEN "fenstring"]\n\n1. d4 d5 2. c4 1-0`).toBe(queensGambitPgn.toString())
    });
});

describe("methods", () => {
    const pgn = new Pgn()
        .addTag("Title", "Example pgn")
        .addTag("Description", "Shows how to add tags, moves, variations and comments")
        .move("e4")
        .comment("king's pawn")
        .startingPosition()
        .move("d4")
        .move("Nf6")
        .firstMove()
        .move("d5")
        .selectMove(move => move.name === "e4")
        .move("e5")
        .previousMove()
        .move("c5");

    console.log(pgn.toString());

    describe("toString", () => {
        it("converts tags to string", () => {
            const actualTags = pgn.toString().split("\n\n")[0];
            const expectedTags = pgnString.split("\n\n")[0].trim();
            expect(actualTags).toBe(expectedTags);
        });

        it("converts moves to string", () => {
            const actualMoveText = pgn.toString().split("\n\n")[1];
            const expectedMoveText = pgnString.split("\n\n")[1].replace(/\n/g, " ").trim();

            expect(actualMoveText).toBe(expectedMoveText);
        });

        it("converts single move to string", () => {
            const moves = "1. e4 {A reasonable first move} *";
            expect(new Pgn(moves).toString()).toBe(moves);
        });

        it("converts flat nextMoves of moves to string", () => {
            const moves = "1. e4 c5 2. Nf3 *";
            expect(new Pgn(moves).toString()).toBe(moves);
        });

        it("converts single nested moves to string", () => {
            const moves = "1. e4 (1. c4 {english} c5 {symmetrical} 2. g3 g6) (1. Nf3 N Nf6 {indian}) 1... e5 (1... c5) 2. Nf3 (2. c3) *";
            expect(new Pgn(moves).toString()).toBe(moves);
        });

        it("converts multiple nested variations with annotations and comments to string", () => {
            const moves = "1. e4 (1. c4 c5 foo bar (1... e5 2. g3 {foo} (2. Nc3 {foo})) (1... Nf6)) 1... c5 *";

            expect(new Pgn(moves).toString()).toBe(moves);
        });

        it("converts empty string", () => {
            expect(new Pgn("").toString()).toBe("*");
        });
    });

    it("should traverse", () => {
        let moveCount = 0;
        new Pgn("1. e4 c5 (1... e5 2. g3 (2. Nc3))").traverse(() => moveCount++);

        expect(moveCount).toBe(5);
    });

    it("should map", () => {
        pgn.map(move => ({...move, color: "white"})).traverse(move => {
            expect(move.color).toBe("white");
        });
    });

    it("should filter", () => {
        pgn.filter(move => move.number <= 22).traverse(move => {
            expect(move.number <= 22).toBeTruthy();
        });
    });

    it("should find", () => {
        const pgn = new Pgn("1. e4 1. c5 (1... e5 2. g3 (2. Nc3))");
        const nc3 = pgn.find(move => move.name === "Nc3");

        expect(nc3).toBeDefined();
        if (nc3) expect(nc3.name).toBe("Nc3");
        expect(pgn.find(move => move.name === "foo")).toBeNull();
    });

    it("should addResult", () => {
        expect(pgn.addResult("1-0").result).toBe("1-0");
    });

    it("should find nextMoves", () => {
        const nextMoves = new Pgn("1. e4 c5 (1... Nf6) (1... e5)")
            .selectMove(move => move.name === "e4")
            .nextMoves()
            .map(move => move.name);

        expect(nextMoves).toEqual(["c5", "Nf6", "e5"]);
    });

    it("should find previousMoves", () => {
        const nextMoves = new Pgn("1. e4 c5 (1... Nf6 2. e5 (2. Nc3))")
            .selectMove(move => move.name === "Nc3")
            .previousMoves()
            .map(move => move.name);

        expect(nextMoves).toEqual(["e4", "Nf6", "Nc3"]);
    });

    describe("move", () => {
        it("adds new move if next move does not exist", () => {
            const pgn = new Pgn().move("d4").move("d5");

            expect(pgn.toString()).toBe("1. d4 d5 *");
        });

        it("adds variation if the next move already exist", () => {
            const pgn = new Pgn()
                .move("e4")
                .move("e5")
                .previousMove()
                .move("c5")
                .previousMove()
                .move("e6");

            expect(pgn.toString()).toBe("1. e4 e5 (1... c5) (1... e6) *");
        });

        it("adds variation if the next move already exist from starting position", () => {
            const pgn = new Pgn()
                .move("d4")
                .startingPosition()
                .move("e4")
                .startingPosition()
                .move("Nf3")
                .startingPosition()
                .move("e4");

            expect(pgn.toString()).toBe("1. d4 (1. e4) (1. Nf3) *");
            expect(pgn.getCurrentMove().name).toBe("e4");
        });

        it("does not add move if given move exists among next moves", () => {
            const pgn = new Pgn("1. e4 e6 (1... c5) *")
                .selectMove(move => move.name === "e4")
                .move("c5")
                .previousMove()
                .move("e6");

            expect(pgn.toString()).toBe("1. e4 e6 (1... c5) *");
            expect(pgn.getCurrentMove().name).toBe("e6");
        });
    });


    it("should comment", () => {
        const pgnString = new Pgn().move("d4").comment("A nice first move").toString();

        expect(pgnString).toBe("1. d4 {A nice first move} *");
    });

    it("should annotate", () => {
        const pgnString = new Pgn().move("d4").annotate("foo");

        expect(pgnString.toString()).toBe("1. d4 foo *");
    });

    it("should addTag", () => {
        const tags = pgn.addTag("Foo", "foo").tags;
        expect(tags.Foo).toBe("foo");
    });

    it("should selectMove", () => {
        const pgn = new Pgn("1. e4 (1. c4 e5 (1... c5 2. g3 g6))").selectMove(move => move.name === "g6");

        expect(pgn.getCurrentMove().name).toBe("g6");
    });

    it("should go to nextMove", () => {
        const pgn = new Pgn("1. e4 (1. c4 e5 (1... c5 2. g3 g6))")
            .selectMove(move => move.name === "c5");

        expect(pgn.nextMove().getCurrentMove().name).toBe("g3");
        expect(pgn.nextMove().nextMove().getCurrentMove().name).toBe("g6");
        expect(pgn.nextMove().nextMove().nextMove().getCurrentMove().name).toBe("g6");
        expect(pgn.startingPosition().nextMove().getCurrentMove().name).toBe("e4");
    });

    describe("previousMove", () => {
        it("should go to previousMove in root variation", () => {
            const pgn = new Pgn("1. e4 (1. c4 e5 (1... c5 2. g3))")
                .selectMove(move => move.name === "g3");

            const c5 = pgn.previousMove();
            const c4 = c5.previousMove();
            const root = c4.previousMove();

            expect(c5.getCurrentMove().name).toBe("c5");
            expect(c4.getCurrentMove().name).toBe("c4");
            expect(root.getCurrentMove().name).toBe("root");
            expect(root.previousMove().getCurrentMove().name).toBe("root");
        });

        it("should go to previousMove in main variation", () => {
            const d4 = new Pgn("1. e4 e5 (1... c5) (1... e6 2. d4)")
                .selectMove(move => move.name === "d4");

            const e6 = d4.previousMove();
            const e4 = e6.previousMove();
            const root = e4.previousMove();

            expect(e6.getCurrentMove().name).toBe("e6");
            expect(e4.getCurrentMove().name).toBe("e4");
            expect(root.getCurrentMove().name).toBe("root");
        });
    });

    it("should go to firstMove in variation", () => {
        const pgn = new Pgn("1. e4 (1. c4 e5 2. g3) 1... e6 (1... c5)")
            .selectMove(move => move.name === "g3")
            .firstMove();

        expect(pgn.getCurrentMove().name).toBe("c4");
    });

    it("should go to lastMove in variation", () => {
        const pgn = new Pgn("1. e4 (1. c4 e5 2. g3) 1... e6 (1... c5)")
            .selectMove(move => move.name === "e4")
            .lastMove();

        expect(pgn.getCurrentMove().name).toBe("e6");
    });

    it("should parse list of pgns", () => {
        const games = [
            createTestPgn({event, date, result}),
            createTestPgn({event, date, result})
        ].join("\n\n");

        const pgnList = Pgn.parse(games);
        expect(pgnList.map(pgn => pgn.toString()).join("\n\n")).toBe(games);
    });
});