let Wordr = {};
let DEBUG = false;
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

    function add_word_mixin(wordType, min_length, max_length, word_count) {
        wordType.get_type = () => wordType.type;
        wordType.min_length = () => min_length;
        wordType.max_length = () => max_length;
        wordType.word_count = () => word_count;

        return wordType;
    }

    switch (wordType.type) {

    case Wordr.WordTypes.FixedLengthWord:
        this.words.push(add_word_mixin(wordType, wordType.len, wordType.len, 1));
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

    function add_relationship_mixin(relationship) {
        relationship.get_type = () => relationship.type;
        relationship.get_other = (index) => {
            for (let i = 0; i < relationship.word_indices.length; ++i) {
                if (relationship.word_indices[i] !== index) {
                    return relationship.word_indices[i];
                }
            }
            return relationship.word_indices[0];
        };

        return relationship;
    }

    function add_word_relationship(words, relationship)
    {
        const ind = self.relationships.length;
        relationship.word_indices = words;
        self.relationships.push(add_relationship_mixin(relationship));

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
    let visited = [];

    for (let i = 0; i < this.words.length; ++i) {
        candidates.push([]);
        visited.push(false);
        constraints.push(
            new Wordr.Constraint(this.words[i].min_length(),
                                 this.words[i].max_length()));
    }

    //
    // Add given patterns, which are expressed as constraint modifiers, as constraints.
    //
    for (let i = 0; i < this.words.length; ++i) {
        if (patterns[i]) {
            for (let j = 0; j < patterns[i].length; ++j) {
                patterns[i][j](constraints[i]);
            }
        }
    }

    let recur = (word_index, visit_next) => {
        const word_base = this.words[word_index];

        let viable = false;
        visited[word_index] = true;

        if (!visit_next) {
            visit_next = [];
        }
        // TODO: possible optimization when constraint has a fully formed word

        outerloop:
        for (let i = word_base.min_length(); i <= word_base.max_length(); ++i) {
            for (let j = 0; j < corpus[i].length; ++j) {
                const candidate = corpus[i][j];
                let constraint_satisfied = true;

                if (constraints[word_index].satisfied(candidate)) {

                    constraints[word_index].set_word(candidate);

                    let index_constraint_added = [];

                    add_relationship_loop:
                    for (let r = 0; r < this.word_relationship[word_index].length; ++r) {
                        const relationship = this.relationships[this.word_relationship[word_index][r]];
                        const other_word_index = relationship.get_other(word_index);

                        switch (relationship.get_type()) {
                        case Wordr.RelationTypes.EqualChar:
                            let this_pos = relationship.pos_0;
                            let that_pos = relationship.pos_1;

                            if (relationship.word_0 !== word_index) {
                                this_pos = relationship.pos_1;
                                that_pos = relationship.pos_0;
                            }

                            if (!constraints[other_word_index].add_index_constraint(that_pos, candidate[this_pos])) {

                                constraint_satisfied = false;
                                break add_relationship_loop;
                            } else {
                                index_constraint_added.push([other_word_index, that_pos]);

                                if (constraints[other_word_index].has_set_word === false && visit_next.indexOf(other_word_index) < 0) {
                                    visit_next.push(other_word_index);
                                }
                            }

                            break;
                        }
                    }

                    if (constraint_satisfied) {
                        if (visit_next.length === 0 ||
                            (recur(visit_next.pop(), visit_next)))
                        {
                            candidates[word_index].push(candidate);
                            viable = true;
                        }
                    }

                    for (let c = 0; c < index_constraint_added.length; ++c) {
                        constraints[index_constraint_added[c][0]].remove_index_constraint(index_constraint_added[c][1]);
                    }

                    constraints[word_index].unset_word(candidate);
                }

                if (viable && candidates[word_index].length > this.config.maxCandidatesPerWord) {
                    break outerloop;
                }
            }
        }

        return viable;

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

Wordr.Constraint = function(min_length, max_length) {
    assert(min_length <= max_length, "Constraint's max_length smaller than min_length");
    assert(min_length >= 1, "Constraint's min_length has to be at least 1");

    this.base_min_length = this.min_length = min_length;
    this.base_max_length = this.max_length = max_length;

    this.known_characters = 0;
    this.first_unknown_index = 0;

    this.has_set_word = false;

    this.template = [];
    for (let i = 0; i < this.max_length; ++i) {
        this.template.push({
            'char': '',
            'count': 0
        });
    }
};

Wordr.Constraint.prototype.set_word = function(word) {
    //
    // Set current word as the base word. The current implementation
    // enumerates the entire word and adds each character as index constraints.
    // It's possible to go with a more efficient implementation instead of re-using
    // existing construct, but that is left as a possible optimization in the future.
    //

    assert(this.has_set_word === false, "Cannot call set_word when constraint already has another word set");
    this.has_set_word = word;
    this.min_length = this.max_length = word.length;

    for (let i = 0; i < word.length; ++i) {
        this.add_index_constraint(i, word[i]);
    }
};

Wordr.Constraint.prototype.unset_word = function() {
    assert(this.has_set_word !== false, "Cannot call unset_word when constraint hasn't set word");

    for (let i = 0; i < this.has_set_word.length; ++i) {
        this.remove_index_constraint(i);
    }

    this.has_set_word = false;
    this.min_length = this.base_min_length;
    this.max_length = this.base_max_length;
};

Wordr.Constraint.prototype.add_index_constraint = function(index, char) {
    //
    // Adds an index constraint, which specifies that the character at the given index
    // of the word must match the given character. Returns true if constraint can be added
    // and false if constraint contradicts with previous constraints.
    //
    if (index < 0 || index >= this.max_length) {
        return false;
    }

    if (this.template[index].count > 0) {
        if (this.template[index].char !== char) {
            return false;
        }
    } else {
        this.known_characters += 1;
        while (this.template[this.first_unknown_index].count > 0) {
            this.first_unknown_index++;
        }
    }

    this.template[index].char = char;
    this.template[index].count += 1;

    return true;
};

Wordr.Constraint.prototype.remove_index_constraint = function(index) {
    assert(index >= 0 && index < this.max_length);
    assert(this.template[index].count > 0);

    this.template[index].count -= 1;

    if (this.template[index].count === 0) {
        this.template[index].char = '';
        this.known_characters -= 1;
        if (index < this.first_unknown_index) {
            this.first_unknown_index = index;
        }
    }
};

Wordr.Constraint.prototype.satisfied = function(candidate) {
    //
    // Validates if the given candidate string fulfills all constraints.
    //
    if (candidate.length < this.min_length || candidate.length > this.max_length) {
        return false;
    }

    for (let i = 0; i < candidate.length; ++i) {
        if (this.template[i].count > 0 && this.template[i].char != candidate[i]) {
            return false;
        }
    }

    return true;
};

Wordr.ConstraintModifiers = {
    SingleCharConstraintModifier: (index, character) => {
        assert(index >= 0, "SingleCharConstraint has to have a non-negative index");
        return (constraint) => {
            assert(constraint.add_index_constraint(index, character), "Pattern contradiction, failed to add index constraint");
        };
    }
};

Wordr.make_pattern = function(pattern) {
    //
    // Takes in a string pattern and returns an array of constraint modifiers.
    // String pattern currently only supports ? as single-character wildcard
    // but should eventually support * (multi-characters wildcard).
    //

    let tr = [];
    for (let i = 0; i < pattern.length; ++i) {
        if (pattern[i] !== '?') {
            const asc = pattern.charCodeAt(i);
            assert(asc >= 97 && asc <= 122, 'Invalid character in pattern');

            tr.push(Wordr.ConstraintModifiers.SingleCharConstraintModifier(i, pattern[i]));
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
