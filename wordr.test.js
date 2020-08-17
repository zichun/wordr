const { SCRABBLE_LIST } = require('./scrabble.js');
const Wordr = require('./wordr.js').Wordr;

let solver = new Wordr.Solver({
    'wordList': SCRABBLE_LIST
});

solver.add_word(Wordr.WordTypes.FixedLengthWord(7));
solver.add_word(Wordr.WordTypes.FixedLengthWord(6));
solver.add_word(Wordr.WordTypes.FixedLengthWord(5));
solver.add_word(Wordr.WordTypes.FixedLengthWord(4));

// solver.add_relation(Wordr.RelationTypes.EqualChar(0, 2, 0, 3)); 
// solver.add_relation(Wordr.RelationTypes.EqualChar(0, 2, 1, 0));// word[0][2] === word[1][0]. if we know word[0] === 'apple', then we know word[1]== 'p????'
// solver.add_relation(Wordr.RelationTypes.EqualChar(0, 2, 2, 4));
// solver.add_relation(Wordr.RelationTypes.EqualChar(1, 2, 2, 5));
// solver.add_relation(Wordr.RelationTypes.EqualChar(0, 6, 3, 2));
// solver.add_relation(Wordr.RelationTypes.EqualChar(0, 1, 3, 3));
// solver.add_relation(Wordr.RelationTypes.EqualChar(0, 1, 1, 1));

solver.add_relation(Wordr.RelationTypes.Anagram(0, 1));
solver.add_relation(Wordr.RelationTypes.Anagram(1, 2));
solver.add_relation(Wordr.RelationTypes.Anagram(2, 3));

// let solutions = solver.solve([
//     Wordr.make_pattern('??rrin?'),
//     Wordr.make_pattern('???'),
//     Wordr.make_pattern('l????d'),
//     Wordr.make_pattern('p?????')
// ]);

//let solutions = solver.solve([Wordr.make_pattern('insect')]);
let solutions = solver.solve([null, null, Wordr.make_pattern('delta'), null], 2);

console.log(solutions);
