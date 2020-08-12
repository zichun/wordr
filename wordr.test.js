const WORD_LIST = require('./wordlist.js').WORD_LIST;
const Wordr = require('./wordr.js').Wordr;

let solver = new Wordr({
    'wordList': WORD_LIST
});

solver.add_word(Wordr.WordTypes.FixedLengthWord(5));

let solutions = solver.solve();
