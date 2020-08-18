const { SCRABBLE_LIST } = require('./scrabble.js');
const Wordr = require('./wordr.js').Wordr;

function assert(cond, message) {
    if (!cond) {
        throw new Error(message);
    }
}

function manualtest_anagram() {
    let solver = new Wordr.Solver({
        'wordList': SCRABBLE_LIST
    });
    solver.add_word(Wordr.WordTypes.FixedLengthWord(7));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(6));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(5));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));

    solver.add_relation(Wordr.RelationTypes.Anagram(0, 1));
    solver.add_relation(Wordr.RelationTypes.Anagram(1, 2));
    solver.add_relation(Wordr.RelationTypes.Anagram(2, 3));

    let solutions = solver.solve([null, null, Wordr.make_pattern('delta'), null], 2);
    console.log(solutions);
}

function manualtest_characterswap() {
    let solver = new Wordr.Solver({
        'wordList': ['dorm','firm','hate','fore','port','film','form','hare','pore','fare']
    });

    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));
    solver.add_word(Wordr.WordTypes.FixedLengthWord(4));

    solver.add_relation(Wordr.RelationTypes.CharacterSwap(0, 1));
    solver.add_relation(Wordr.RelationTypes.CharacterSwap(1, 2));
    solver.add_relation(Wordr.RelationTypes.CharacterSwap(2, 3));

    solver.add_relation(Wordr.RelationTypes.CharacterSwap(4, 2));

    solver.add_relation(Wordr.RelationTypes.CharacterSwap(5, 6));
    solver.add_relation(Wordr.RelationTypes.CharacterSwap(3, 6));
    solver.add_relation(Wordr.RelationTypes.CharacterSwap(3, 7));

    solver.add_relation(Wordr.RelationTypes.CharacterSwap(8, 9));
    solver.add_relation(Wordr.RelationTypes.CharacterSwap(9, 7));

    let solutions = solver.solve([]);

    assert(solutions.length === 10);
    for (let i = 0; i < solutions.length; ++i) {
        assert(solutions[i].length === 1);
    }
    assert(solutions[0][0] === 'film');
    assert(solutions[1][0] === 'firm');
    assert(solutions[2][0] === 'form');
    assert(solutions[3][0] === 'fore');
    assert(solutions[4][0] === 'dorm');
    assert(solutions[5][0] === 'port');
    assert(solutions[6][0] === 'pore');
    assert(solutions[7][0] === 'fare');
    assert(solutions[8][0] === 'hate');
    assert(solutions[9][0] === 'hare');
}

manualtest_characterswap();
