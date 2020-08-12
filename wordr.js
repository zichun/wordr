let Wordr = {};

Wordr.Solver = function(config) {

    function parse(wordList) {
        let wordListByLength = [];
        for (let i = 0; i < wordList.length; ++i) {
            if (typeof wordListByLength[wordList[i].length] === 'undefined') {
                wordListByLength[wordList[i].length] = [];
            }
            wordListByLength[wordList[i].length].push(wordList[i]);
        }

        return wordListByLength;
    }

    this.WORDS_BY_LENGTH = parse(config.wordList || ['foo','bar','foobar']);
    this.config = {
        maxCandidatesPerWord: config.maxCandidatesPerWord || 20
    };

    this.words = [];
    this.relationships = [];
    this.word_relationship = [];

    return this;
}

Wordr.Solver.prototype.add_word = function(wordType, template) {
    if (wordType.hasOwnProperty('type') === false) {
        throw 'Invalid word type';
    }

    function add_word_mixin(wordType, min_length, max_length) {
        wordType.get_type = () => wordType.type;
        wordType.min_length = () => min_length;
        wordType.max_length = () => max_length;

        return wordType;
    }

    switch (wordType.type) {

    case Wordr.WordTypes.FixedLengthWord:
        this.words.push(add_word_mixin(wordType, wordType.len, wordType.len));
        break;

    default:
        throw 'Unsupported word type';
        break;
    }
};

Wordr.Solver.prototype.add_relation = function(relationship) {
    if (relationship.hasOwnProperty('type') === false) {
        throw 'Invalid relationship';
    }

    const self = this;

    function add_word_relationship(words, relationship)
    {
        const ind = self.relationships.length;
        self.relationships.push(relationship);

        for (let i = 0; i < words.length; ++i) {
            if (typeof self.word_relationship[words[i]] === 'undefined') {
                self.word_relationship[words[i]] = [];
            }
            self.word_relationship[words[i]].push(ind);
        }
    }

    switch (relationship.type) {

    case Wordr.RelationTypes.EqualChar:
        assert(relationship.word_0 >= 0 && relationship.word_0 < this.words.length, "Invalid word_0 index");
        assert(relationship.word_1 >= 0 && relationship.word_1 < this.words.length, "Invalid word_1 index");

        add_word_relationship([relationship.word_0, relationship.word_1], relationship);

        break;

    default:
        throw 'Unsupported relationship';
        break;
    }
};

Wordr.Solver.prototype.solve = function(patterns) {
    const corpus = this.WORDS_BY_LENGTH;
    let constraints = [];
    let solutions = [];
    let candidates = [];
    let templates = [];

    for (let i = 0; i < this.words.length; ++i) {
        constraints.push([]);
        candidates.push([]);
        templates.push([]);

        for (let j = 0; j < this.words[i].max_length(); ++j) {
            templates[i].push(null);
        }
    }
    for (let i = 0; i < this.words.length; ++i) {
        if (patterns[i]) {
            constraints[i].push(...patterns[i]);

            for (let j = 0; j < patterns[i].length; ++j) {
                if (!patterns[i][j].augment_template(templates[i])) {
                    assert(false, 'Pattern causes contradiction');
                }
            }
        }
    }

    let recur = (word_index) => {
        const word_base = this.words[word_index];

        let is_candidate_viable = (str) => {
            for (let i = 0; i < constraints[word_index].length; ++i) {
                if (!constraints[word_index][i].validate(str)) {
                    return false;
                }
            }
            return true;
        };

        // todo: if constraints fully form a word, that should be the only candidate

        let first_blank = word_base.max_length();
        for (let i = 0; i < templates[word_index].length; ++i) {
            if (templates[word_index][i] === null) {
                first_blank = i;
                break;
            }
        }

        if (first_blank > word_base.min_length()) {
            process_candidate_word(word_base.join(''));
        }

        outerloop:
        for (let i = first_blank; i <= word_base.max_length(); ++i) {
            for (let j = 0; j < corpus[i].length; ++j) {
                const candidate = corpus[i][j];
                if (satisfied(candidate)) {

                    candidates[word_index].push(candidate);

                }
                if (candidates > this.config.maxCandidatesPerWord) {
                    break outerloop;
                }
            }
        }

    };

    recur(0);
    console.log(candidates);

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

Wordr.RelationTypes = {
    EqualChar: (word_0, pos_0, word_1, pos_1) => {
        // Two characters are identical
        return {
            type: Wordr.RelationTypes.EqualChar,
            word_0: word_0,
            pos_0: pos_0,
            word_1: word_1,
            pos_1: pos_1
        };
    },
    Anagram: (word_0, word_1) => {
        // Words are anagram of each other. If a word is shorter than the other,
        // then its characters bag will be a subset of that of the longer word.
    },
    CharacterDrop: (word_0, word_1) => {
        // word_1 is a subsequence of word_0, and its length is exactly one smaller than
        // word_0.
    },
    CharacterSwap: (word_0, word_1) => {
        // word_0 and word_1 are of the same length, and differ by exactly one character
    }
};

Wordr.Constraints = {
    SingleCharConstraint: (index, character) => {
        assert(index >= 0);
        return {
            'augment_template': (template) => {
                if (!template[index]) {
                    template[index] = character;
                }
                return template[index] === character;
            },
            'validate': (str) => {
                return str.length > index && str[index] === character;
            }
        };
    }
};

Wordr.make_pattern = function(pattern) {
    //
    // Takes in a string pattern and returns an array of constraints.
    // String pattern currently only supports ? as single-character wildcard
    // but should eventually support * (multi-characters wildcard).
    //

    let tr = [];
    for (let i = 0; i < pattern.length; ++i) {
        if (pattern[i] !== '?') {
            const asc = pattern.charCodeAt(i);
            assert(asc >= 97 && asc <= 122, 'Invalid character in pattern');

            tr.push(Wordr.Constraints.SingleCharConstraint(i, pattern[i]));
        }
    }
    return tr;
};

if (exports) {
    exports.Wordr = Wordr;
}

function assert(cond, message) {
    if (!cond) {
        throw new Error(message);
    }
}
