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
        maxCandidatesPerWord: config.maxCandidatesPerWord || 20,
        maxTimeInSeconds: config.maxTimeInSeconds || 30,
        maxRecurDepth: config.maxRecurDepth || 1000,
        uniqueWords: config.uniqueWords || true
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

    case Wordr.RelationTypes.Anagram:
        assert(relationship.word_0 >= 0 && relationship.word_0 < this.words.length, "Invalid word_0 index");
        assert(relationship.word_1 >= 0 && relationship.word_1 < this.words.length, "Invalid word_1 index");

        add_word_relationship([relationship.word_0, relationship.word_1], relationship);

        break;

    case Wordr.RelationTypes.CharacterSwap:
        assert(relationship.word_0 >= 0 && relationship.word_0 < this.words.length, "Invalid word_0 index");
        assert(relationship.word_1 >= 0 && relationship.word_1 < this.words.length, "Invalid word_1 index");
        if (this.words[relationship.word_0].min_length() != this.words[relationship.word_1].min_length() ||
            this.words[relationship.word_0].max_length() != this.words[relationship.word_1].max_length()) {
            console.log("words length differ");
            return false;
        }

        add_word_relationship([relationship.word_0, relationship.word_1], relationship);

        break;

    default:
        throw 'Unsupported relationship';
        break;
    }

    return true;
};

Wordr.Solver.prototype.solve = function(patterns, solve_from) {
    const corpus = this.WORDS_BY_LENGTH;
    let constraints = [];
    let candidates = [];
    let templates = [];
    let visited = [];

    const start_time = new Date();

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

    let short_circuit = false;
    let candidates_so_far = [];

    let recur = (word_index, visit_next, depth) => {
        const word_base = this.words[word_index];

        if (depth > this.config.maxRecurDepth) {
            return true;
        }

        const elapsed_seconds = ((new Date()) - start_time) / 1000;
        if (short_circuit || elapsed_seconds > this.config.maxTimeInSeconds) {
            short_circuit = true;
            return false;
        }

        let viable = false;
        visited[word_index] = true;

        if (!visit_next) {
            visit_next = [];
        }
        let my_visit_next = visit_next.concat([]);
        // TODO: possible optimization when constraint has a fully formed word

        outerloop:
        for (let i = word_base.min_length(); i <= word_base.max_length(); ++i) {
            for (let j = 0; j < corpus[i].length; ++j) {
                if (short_circuit) {
                    return false;
                }

                const candidate = corpus[i][j];
                if (this.config.uniqueWords) {
                    if (candidates_so_far.indexOf(candidate) >= 0) {
                        continue;
                    }
                }

                let constraint_satisfied = true;

                if (constraints[word_index].satisfied(candidate)) {

                    constraints[word_index].set_word(candidate);
                    candidates_so_far.push(candidate);

                    let index_constraint_added = [];
                    let characters_bag_constraint_added = [];
                    let characterswap_constraint_added = [];

                    if (typeof this.word_relationship[word_index] === 'undefined') {
                        this.word_relationship[word_index] = [];
                    }

                    //
                    // future cleanup: relations should be expressed as a constraint modifier directly, and the
                    // actual semantics of relationships should be encapsulated away from solve.
                    //
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

                                if (constraints[other_word_index].has_set_word === false && my_visit_next.indexOf(other_word_index) < 0) {
                                    my_visit_next.push(other_word_index);
                                }
                            }

                            break;

                        case Wordr.RelationTypes.Anagram:

                            if (!constraints[other_word_index].add_characters_bag_constraint(candidate)) {
                                constraint_satisfied = false;
                                break add_relationship_loop;
                            } else {

                                characters_bag_constraint_added.push(other_word_index);
                                if (constraints[other_word_index].has_set_word === false && my_visit_next.indexOf(other_word_index) < 0) {
                                    my_visit_next.push(other_word_index);
                                }
                            }
                            break;

                        case Wordr.RelationTypes.CharacterSwap:

                            if (!constraints[other_word_index].add_characterswap_constraint(candidate)) {
                                constraint_satisfied = false;
                                break add_relationship_loop;
                            } else {
                                characterswap_constraint_added.push(other_word_index);

                                if (constraints[other_word_index].has_set_word === false && my_visit_next.indexOf(other_word_index) < 0) {
                                    my_visit_next.push(other_word_index);
                                }
                            }
                            break;
                        }
                    }

                    if (constraint_satisfied) {
                        if (my_visit_next.length === 0 ||
                            (recur(my_visit_next[0], my_visit_next.slice(1), depth + 1)))
                        {

                            if (candidates[word_index].indexOf(candidate) < 0) {
                                candidates[word_index].push(candidate);
                            }
                            viable = true;
                        }
                    }

                    for (let c = 0; c < index_constraint_added.length; ++c) {
                        constraints[index_constraint_added[c][0]].remove_index_constraint(index_constraint_added[c][1]);
                    }

                    for (let c = 0; c < characters_bag_constraint_added.length; ++c) {
                        constraints[characters_bag_constraint_added[c]].remove_characters_bag_constraint();
                    }

                    for (let c = 0; c < characterswap_constraint_added.length; ++c) {
                        constraints[characterswap_constraint_added[c]].remove_characterswap_constraint();
                    }

                    constraints[word_index].unset_word(candidate);
                    candidates_so_far.pop();
                }

                if (viable && candidates[word_index].length > this.config.maxCandidatesPerWord) {
                    break outerloop;
                }
            }
        }

        return viable;

    };

    solve_from = solve_from || 0;
    for (let i = solve_from; i < solve_from + this.words.length; ++i) {
        const ind = i % this.words.length;
        if (!visited[ind]) {
            recur(ind, null, 1);
        }
    }

    return candidates;
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

        return {
            type: Wordr.RelationTypes.Anagram,
            word_0: word_0,
            word_1: word_1
        };
    },
    CharacterDrop: (word_0, word_1) => {
        // word_1 is a subsequence of word_0, and its length is exactly one smaller than
        // word_0.
    },
    CharacterSwap: (word_0, word_1) => {
        // word_0 and word_1 are of the same length, and differ by exactly one character

        return {
            type: Wordr.RelationTypes.CharacterSwap,
            word_0: word_0,
            word_1: word_1
        };
    }
};

Wordr.Constraint = function(min_length, max_length) {
    assert(min_length <= max_length, "Constraint's max_length smaller than min_length");
    assert(min_length >= 1, "Constraint's min_length has to be at least 1");

    this.base_min_length = this.min_length = min_length;
    this.base_max_length = this.max_length = max_length;

    this.known_characters = 0;
    this.first_unknown_index = 0;

    this.character_bags = [];
    this.characterswap = [];

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
        assert(this.add_index_constraint(i, word[i], i < word.length - 1));
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

Wordr.contradict_bags = function(bag_0, bag_1) {
    let big, small;
    if (bag_0.length > bag_1.length) {
        big = bag_0;
        small = bag_1;
    } else {
        big = bag_1;
        small = bag_0;
    }

    for (let i = 0, j = 0; i < small.length; ++i) {
        while (small[i] !== big[j] && j < big.length) {
            ++j;
        }

        if (j >= big.length) {
            return true;
        }
        ++j;
    }
    return false;
}

Wordr.Constraint.prototype.contradict_characters_bag = function(new_bag) {
    for (let i = 0; i < this.character_bags.length; ++i) {
        if (Wordr.contradict_bags(this.character_bags[i], new_bag)) {
            return true;
        }
    }
    return false;
};

Wordr.Constraint.prototype.add_characterswap_constraint = function(str) {
    let diff = 0;
    for (let i = 0; i < this.template.length && i < str.length; ++i) {
        if (this.template[i].count > 0) {
            if (str[i] !== this.template[i].char) {
                ++diff;

                if (diff > 1) {
                    return false;
                }
            }
        }
    }

    for (let i = 0; i < this.characterswap.length; ++i) {
        if (str.length !== this.characterswap[i].length) {
            return false;
        }
        let diff = 0;
        for (let j = 0; j < str.length; ++j) {
            if (str[j] !== this.characterswap[i][j]) {
                ++diff;
                if (diff > 2) {
                    return false;
                }
            }
        }
    }

    this.characterswap.push(str);
    return true;
};

Wordr.Constraint.prototype.remove_characterswap_constraint = function() {
    assert(this.characterswap.length > 0);
    this.characterswap.pop();
};

Wordr.Constraint.prototype.remove_characters_bag_constraint = function() {
    assert(this.character_bags.length > 0);

    this.character_bags.pop();
};

Wordr.Constraint.prototype.add_characters_bag_constraint = function(str) {
    const new_bag = str.split('').sort();

    if (this.contradict_characters_bag(new_bag)) {
        return false;
    }

    let template_bag = [];
    for (let i = 0; i < this.template.length; ++i) {
        if (this.template[i].count > 0) {
            template_bag.push(this.template[i].char);
        }
    }
    template_bag.sort();

    if (Wordr.contradict_bags(template_bag, new_bag)) {
        return false;
    }

    this.character_bags.push(new_bag);
    return true;
};

Wordr.Constraint.prototype.add_index_constraint = function(index, char, skip_character_bag_check) {
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
    }

    if (!skip_character_bag_check) {
        let template_bag = [];
        for (let i = 0; i < this.template.length; ++i) {
            if (this.template[i].count > 0) {
                template_bag.push(this.template[i].char);
            }
        }
        if (this.template[index].count === 0) {
            template_bag.push(char);
        }
        template_bag.sort();

        if (this.contradict_characters_bag(template_bag)) {
            return false;
        }
    }

    if (this.template[index].count === 0) {
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

    const new_bag = candidate.split('').sort();

    if (this.contradict_characters_bag(new_bag)) {
        return false;
    }

    for (let i = 0; i < this.characterswap.length; ++i) {
        let found_diff = false;
        if (candidate.length !== this.characterswap[i].length) {
            return false;
        }
        for (let j = 0; j < candidate.length; ++j) {
            if (candidate[j] !== this.characterswap[i][j]) {
                if (found_diff) {
                    return false;
                }
                found_diff = true;
            }
        }

        if (found_diff === false) {
            return false;
        }
    }

    for (let i = 0; i < candidate.length; ++i) {
        if (this.template[i].count > 0 && this.template[i].char !== candidate[i]) {
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



if (typeof exports !== 'undefined') {
    exports.Wordr = Wordr;
}

function assert(cond, message) {
    if (!cond) {
        throw new Error(message);
    }
}
