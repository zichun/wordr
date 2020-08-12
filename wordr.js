function Wordr(config) {

    function parse(wordList) {
        let wordListByLength = [];
        for (let i = 0; i < wordList.length; ++i) {
            wordListByLength[wordList[i].length] = wordList[i];
        }
        return wordListByLength;
    }

    this.WORD_LIST = parse(config.wordList || ['foo','bar','foobar']);
    this.words = [];

    return this;
}

Wordr.prototype.add_word = function(wordType) {
    if (wordType.hasOwnProperty('type') === false) {
        throw 'Invalid WordType';
    }

    switch (wordType.type) {

    case Wordr.WordTypes.FixedLengthWord:
        this.words.push(wordType);
        break;

    default:
        throw 'Unsupported word type';
        break;
    }
};

Wordr.prototype.solve = function() {
    const words = this.WORD_LIST;
    let solutions = [];

    return solutions;
};

Wordr.WordTypes = {
    FixedLengthWord: (len) => { // Static-Length words
        return {
            type: Wordr.WordTypes.FixedLengthWord,
            len: len
        };
    },
    VariableLengthWord: (min_len, max_len) => { // Variable-Length word
        return null;
    },
    Phrase: (min_words, max_words) => { // Phrase comprising multiple words
        return null;
    }
};

if (exports) {
    exports.Wordr = Wordr;
}
