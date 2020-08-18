(() => {

    document.getElementById('add-word').addEventListener('click', () => {
        let letters = prompt('Number of letters');
        create_word(parseInt(letters, 10));
    });

    let words = [];
    let links = [];
    let word_links = [];
    let in_link = false;
    let start_link = null;
    let link_color = 0;
    let word_link_color = 0;

    const LinkButton = document.getElementById('link');

    LinkButton.addEventListener('click', function() {
        if (!start_link) return;

        start_link.style.backgroundColor = '#fdd';
        in_link = true;

        LinkButton.oldText = LinkButton.innerText;
        LinkButton.innerText = 'Select element to link to';
        LinkButton.setAttribute('disabled', 'disabled');
    });

/*    document.getElementById('solve').addEventListener('click', function() {
        solve(0);
        });*/

    const word_lists = {
        'SCRABBLE_LIST': SCRABBLE_LIST,
        '<empty_list>': [],
        'BIRD_LIST': BIRD_LIST,
        'HOUSERELATED_LIST': HOUSERELATED_LIST,
        'LANDFORMS_LIST': LANDFORMS_LIST,
        'SEWING_LIST': SEWING_LIST,
        'CLOTHES_LIST': CLOTHES_LIST,
        'COOKINGTERMS_LIST': COOKINGTERMS_LIST,
        'DANCES_LIST': DANCES_LIST,
        'MUSICTHEORY_LIST': MUSICTHEORY_LIST,
        'VALENTINESDAY_LIST': VALENTINESDAY_LIST,
        'FARM_LIST': FARM_LIST,
        'SCIENCES_LIST': SCIENCES_LIST,
        'MILITARY_LIST': MILITARY_LIST,
        'ELEMENTS_LIST': ELEMENTS_LIST,
        'PLANTS_LIST': PLANTS_LIST,
        'COLUMBUSDAY_LIST': COLUMBUSDAY_LIST,
        'ADVERBS_LIST': ADVERBS_LIST,
        'LEGALTERMS_LIST': LEGALTERMS_LIST,
        'ROCKSANDMINERALS_LIST': ROCKSANDMINERALS_LIST,
        'CASTLES_LIST': CASTLES_LIST,
        'MONEY_LIST': MONEY_LIST,
        'PREPOSITIONS_LIST': PREPOSITIONS_LIST,
        'KITCHEN_LIST': KITCHEN_LIST,
        'DOLCHWORDS_LIST': DOLCHWORDS_LIST,
        'WINTER_LIST': WINTER_LIST,
        'ANIMAL_LIST': ANIMAL_LIST,
        'WEATHER_LIST': WEATHER_LIST,
        'DRIVING_LIST': DRIVING_LIST,
        'BEACH_LIST': BEACH_LIST,
        'PRONOUNS_LIST': PRONOUNS_LIST,
        'SCHOOL_LIST': SCHOOL_LIST,
        'INSECTANDBUG_LIST': INSECTANDBUG_LIST,
        'MAPS_LIST': MAPS_LIST,
        'ELECTION_LIST': ELECTION_LIST,
        'POSTOFFICE_LIST': POSTOFFICE_LIST,
        'HUMANBODY_LIST': HUMANBODY_LIST,
        'FRUIT_LIST': FRUIT_LIST,
        'TIME_LIST': TIME_LIST,
        'CARPARTS_LIST': CARPARTS_LIST,
        'VEGETABLESANDLEGUMES_LIST': VEGETABLESANDLEGUMES_LIST,
        'THANKSGIVING_LIST': THANKSGIVING_LIST,
        'CRAFTS_LIST': CRAFTS_LIST,
        'THEATER_LIST': THEATER_LIST,
        'GEOGRAPHY_LIST': GEOGRAPHY_LIST,
        'STPATRICKSDAY_LIST': STPATRICKSDAY_LIST,
        'FOODANDEATING_LIST': FOODANDEATING_LIST,
        'SPORTS_LIST': SPORTS_LIST,
        'SHOES_LIST': SHOES_LIST,
        'SHAPES_LIST': SHAPES_LIST,
        'DOCTORORDENTIST_LIST': DOCTORORDENTIST_LIST,
        'STORESANDPUBLICBUILDINGS_LIST': STORESANDPUBLICBUILDINGS_LIST,
        'HOUSINGANDDWELLINGS_LIST': HOUSINGANDDWELLINGS_LIST,
        'AMPHIBIAN_LIST': AMPHIBIAN_LIST,
        'HALLOWEEN_LIST': HALLOWEEN_LIST,
        'PIRATE_LIST': PIRATE_LIST,
        'COLORS_LIST': COLORS_LIST,
        'FALLANDAUTUMN_LIST': FALLANDAUTUMN_LIST,
        'ASTRONOMY_LIST': ASTRONOMY_LIST,
        'DOGANDDOGBREEDS_LIST': DOGANDDOGBREEDS_LIST,
        'FISH_LIST': FISH_LIST,
        'FLOWERS_LIST': FLOWERS_LIST,
        'BASEBALL_LIST': BASEBALL_LIST,
        'LANDSCAPE_LIST': LANDSCAPE_LIST,
        'ATMOSPHERE_LIST': ATMOSPHERE_LIST,
        'CAMPING_LIST': CAMPING_LIST,
        'FURNITURE_LIST': FURNITURE_LIST,
        'REPTILESTURTLESANDTORTOISES_LIST': REPTILESTURTLESANDTORTOISES_LIST,
        'GROUNDHOGDAY_LIST': GROUNDHOGDAY_LIST,
        'BATHROOM_LIST': BATHROOM_LIST,
        'SUMMER_LIST': SUMMER_LIST,
        'RESTAURANT_LIST': RESTAURANT_LIST,
        'ARTS_LIST': ARTS_LIST,
        'MUSIC_LIST': MUSIC_LIST,
        'CONTAINER_LIST': CONTAINER_LIST,
        'CIRCUSANDFAIRS_LIST': CIRCUSANDFAIRS_LIST,
        'ARCHITECTURE_LIST': ARCHITECTURE_LIST,
        'MUSICALINSTRUMENTS_LIST': MUSICALINSTRUMENTS_LIST,
        'DESSERTSANDSWEETS_LIST': DESSERTSANDSWEETS_LIST,
        'SCIENCE_LIST': SCIENCE_LIST,
        'FAMILY_LIST': FAMILY_LIST,
        'BIRTHDAY_LIST': BIRTHDAY_LIST,
        'USSTATES_LIST': USSTATES_LIST,
        'ADJECTIVES_LIST': ADJECTIVES_LIST,
        'FIREFIGHTING_LIST': FIREFIGHTING_LIST,
        'BOAT_LIST': BOAT_LIST,
        'SPRING_LIST': SPRING_LIST
    };

    const wordListEl = document.getElementById('wordlist');
    for (let a in word_lists) {
        if (!word_lists.hasOwnProperty(a)) {
            continue;
        }
        const optEl = document.createElement('option');
        optEl.innerText = a + ' (' + word_lists[a].length + ')';
        optEl.value = a;
        wordListEl.appendChild(optEl);
    }

    document.getElementById('clearboard').addEventListener('click', function() {
        localStorage.state = null;
        window.location.reload();
    });

    document.getElementById('importexport').addEventListener('click', function() {
        const div = document.getElementById('importexport-div');
        div.style.display = div.style.display === '' ? 'block' : '';
    });

    document.getElementById('customword').addEventListener('click', function() {
        const div = document.getElementById('customword-div');
        div.style.display = div.style.display === '' ? 'block' : '';
    });

    document.getElementById('importexport-button').addEventListener('click', function() {
        localStorage.state = document.getElementById('importexport-text').value;
        window.location.reload();
    });

    // create_word(5);
    // create_word(8);

    // let chars = document.querySelectorAll('.char');
    // create_link(chars[3], chars[8]);
    // create_link(chars[10], chars[11]);

    if (localStorage.state) {
        load_state(localStorage.state);
    }

    function save_state() {
        const state = JSON.stringify(get_state());
        localStorage.state = state;
        document.getElementById('importexport-text').value = state;
    }
    function load_state(state_str) {
        let state = JSON.parse(state_str);
        if (!state) {
            return;
        }

        for (let i = 0; i < state.words.length; ++i) {
            create_word(state.words[i].length, state.words[i]);
        }

        for (let i = 0; i < state.links.length; ++i) {
            const link = state.links[i];
            create_link(document.getElementById(char_id(link[0], link[1])),
                        document.getElementById(char_id(link[2], link[3])));
        }
        for (let i = 0; i < state.wordlinks.length; ++i) {
            const link = state.wordlinks[i];
            create_link_words(document.getElementById(word_id(link[0])),
                              document.getElementById(word_id(link[1])),
                              link[2]);
        }

        document.getElementById('customword-text').value = state.customword.join(' ');

    }
    function word_id(word_index) {
        return 'word-' + word_index;
    }
    function char_id(word_index, index) {
        return 'char-' + word_index + '-' + index;
    }
    function get_state() {
        let swords = [];
        let wlinks = [];

        for (let i = 0; i < words.length; ++i) {
            let pattern = [];
            const el = words[i].el;
            let chars = el.querySelectorAll('.char');
            for (let i = 0; i < chars.length; ++i) {
                pattern.push(chars[i].value);
            }
            swords.push(pattern);
        }
        let slinks = [];
        for (let i = 0; i < links.length; ++i) {
            if (links[i].active) {
                slinks.push([links[i].word_0, links[i].pos_0, links[i].word_1, links[i].pos_1]);
            }
        }

        for (let i = 0; i < word_links.length; ++i) {
            if (word_links[i].active) {
                wlinks.push([word_links[i].from, word_links[i].to, word_links[i].type]);
            }
        }
        return {
            'words': swords,
            'links': slinks,
            'wordlinks': wlinks,
            'customword': get_custom_words()
        };
    }

    function get_custom_words() {
        return document.getElementById('customword-text').value.toLowerCase().trim().match(/\S+/g) || [];
    }
    function solve(solve_from_index) {
        save_state();

        const customword = get_custom_words();

//        console.log(wordListEl.value);
        let solver = new Wordr.Solver({
            'wordList': customword.concat(word_lists[wordListEl.value]),
            'maxTimeInSeconds': 8,
            'maxRecurDepth': 6
        });
        for (let i = 0; i < words.length; ++i) {
            solver.add_word(Wordr.WordTypes.FixedLengthWord(words[i].length));
        }
        for (let i = 0; i < links.length; ++i) {
            if (links[i].active)
            {
                solver.add_relation(
                    Wordr.RelationTypes.EqualChar(links[i].word_0,
                                                  links[i].pos_0,
                                                  links[i].word_1,
                                                  links[i].pos_1));
            }
        }
        for (let i = 0; i < word_links.length; ++i) {
            if (word_links[i].active)
            {
                switch (word_links[i].type) {
                case 'Anagram':
                    solver.add_relation(Wordr.RelationTypes.Anagram(word_links[i].from, word_links[i].to));
                    break;
                case 'CharacterSwap':
                    solver.add_relation(Wordr.RelationTypes.CharacterSwap(word_links[i].from, word_links[i].to));
                    break;
                default:
                    throw 'Unsupported word_link';
                }
            }
        }

        let patterns = [];
        for (let i = 0; i < words.length; ++i) {
            const el = words[i].el;
            let chars = el.querySelectorAll('.char');
            let pattern = '';
            for (let i = 0; i < chars.length; ++i)
            {
                if (chars[i].value) {
                    pattern += chars[i].value;
                } else {
                    pattern += '?';
                }
            }
            patterns.push(Wordr.make_pattern(pattern));
        }

        let solutions = solver.solve(patterns, solve_from_index);

        for (let i = 0; i < words.length; ++i) {
            const el = words[i].el;
            const soln = solutions[i];
            const solnsEl = el.querySelector('.solutions');

            solnsEl.innerHTML = '';
            for (let j = 0; j < soln.length; ++j) {
                let solnEl = document.createElement('div');
                solnEl.className = 'solution';
                solnEl.innerText = soln[j];
                solnsEl.appendChild(solnEl);

                solnEl.word_index = i;

                if (customword.indexOf(soln[j]) >= 0) {
                    solnEl.className += ' custom';
                }

                solnEl.addEventListener('click', function() {
                    const el = words[this.word_index].el;
                    const candidate = this.innerText;

                    let chars = el.querySelectorAll('.char');
                    for (let i = 0; i < chars.length; ++i)
                    {
                        chars[i].value = candidate[i];
                        chars[i].dispatchEvent(new Event('change'));
                    }
                });
            }
        }
    }

    function create_word(letters, prefill) {
        if (letters <= 0 || letters > 20 || isNaN(letters)) {
            throw 'Invalid number of letters';
        }

        prefill = prefill || [];

        const wordIndex = words.length; // todo: wordIndex has to be dynamic to support removal of words

        let wordElement = document.createElement('div');
        wordElement.className = 'word'
        wordElement.word_index = wordIndex;
        wordElement.id = word_id(wordIndex);

        for (let i = 0; i < letters; ++i) {
            let tb;
            wordElement.appendChild(tb = document.createElement('input'));
            if (prefill[i]) {
                tb.value = prefill[i];
            }
            tb.className = 'char';
            tb.setAttribute('maxLength', 1);

            tb.index = i;
            tb.word_index = wordIndex;

            tb.links = [];
            tb.is_link = false;
            tb.link_color = -1;
            tb.parent_link = tb;
            tb.id = char_id(wordIndex, i);

            tb.addEventListener('focus', function() {
                if (!in_link) {
                    start_link = this;
                }
                else
                {
                    if (start_link !== this)
                    {
                        create_link(start_link, this);
                    }

                    start_link.style.backgroundColor = '';
                    start_link = this;
                    in_link = false;

                    LinkButton.innerText = LinkButton.oldText;
                    LinkButton.removeAttribute('disabled');
                }
            });

            tb.addEventListener('change', function() {
                let self = this;
                let visited = {};
                let seen_word = this.value;

                function dfs(el) {
                    if (typeof visited[el.id] !== 'undefined') {
                        return;
                    }
                    el.value = seen_word;

                    visited[el.id] = true;
                    for (let i = 0; i < el.links.length; ++i) {
                        if (links[el.links[i]].el_0 !== el) dfs(links[el.links[i]].el_0);
                        if (links[el.links[i]].el_1 !== el) dfs(links[el.links[i]].el_1);
                    }
                }
                dfs(self);
            });
        }

        let solutions = document.createElement('div');
        solutions.className = 'solutions';
        wordElement.appendChild(solutions);

        document.getElementById('words').appendChild(wordElement);

        let solveBtn = document.createElement('button');
        solveBtn.className = 'solve-button';
        solveBtn.innerText = 'Solve';
        solveBtn.addEventListener('click', function() {
            solve(wordIndex);
        });

        let clearBtn = document.createElement('button');
        clearBtn.className = 'clear-button';
        clearBtn.innerText = 'Clear';
        clearBtn.addEventListener('click', function() {
            let chars = wordElement.querySelectorAll('.char');
            for (let i = 0; i < chars.length; ++i)
            {
                chars[i].value = '';
                chars[i].dispatchEvent(new Event('change'));
            }
            save_state();
        });

        let btnDiv = document.createElement('div');
        btnDiv.className = 'button-div';
        btnDiv.appendChild(solveBtn);
        btnDiv.appendChild(clearBtn);

        ['Anagram', 'CharacterSwap'].forEach( link_type => {
            let linkBtn = document.createElement('button');
            linkBtn.className = 'link-button';
            linkBtn.innerText = 'Link ' + link_type;

            linkBtn.addEventListener('click', function(evt) {
                const wordsEl = document.getElementById('words');

                if (wordElement.linkbutton) {
                    wordElement.linkbutton.innerText = wordElement.linkbutton.prevText;
                    wordElement.linkbutton.removeAttribute('disabled');
                }

                for (let i = 0; i < wordsEl.childNodes.length; ++i) {
                    if (wordsEl.childNodes[i] !== wordElement) {
                        wordsEl.childNodes[i].className += ' selectable';
                        wordsEl.childNodes[i].linkfrom = wordElement;
                        wordsEl.childNodes[i].linktype = link_type;
                    }

                    wordsEl.childNodes[i].linkbutton = this;
                }

                wordElement.className = 'word';
                wordElement.linkfrom = null;
                this.setAttribute('disabled','disabled');
                this.prevText = this.innerText;
                this.innerText = 'Click word to link';

                evt.stopPropagation();
                return false;
            });

            btnDiv.appendChild(linkBtn);
        });

        wordElement.addEventListener('click', function(evt) {
            if (this.linkfrom) {
                create_link_words(this.linkfrom, this, this.linktype);
            }

            if (this.linkbutton) {
                const wordsEl = document.getElementById('words');

                this.linkbutton.innerText = this.linkbutton.prevText;
                this.linkbutton.removeAttribute('disabled');

                for (let i = 0; i < wordsEl.childNodes.length; ++i) {
                    wordsEl.childNodes[i].className = 'word';
                    wordsEl.childNodes[i].linkfrom = null;
                    wordsEl.childNodes[i].linktype = '';
                    wordsEl.childNodes[i].linkbutton = null;
                }
            }
        });

        wordElement.appendChild(btnDiv);

        let wordlinksDiv = document.createElement('div');
        wordlinksDiv.className = 'wordlinks';
        wordElement.appendChild(wordlinksDiv);

        words.push({
            length: letters,
            el: wordElement
        });

        save_state();
    }

    function root_of(el) {
        if (el.parent_link === el) {
            return el;
        }
        el.parent_link = root_of(el.parent_link);
        return el.parent_link;
    }

    function remove_link(link_index) {
        const link = links[link_index];
        const from = link.el_0;
        const to = link.el_1;

        from.links.splice(from.links.indexOf(link_index), 1);
        to.links.splice(to.links.indexOf(link_index), 1);

        let cur_link_color = link_color;
        link_color = (link_color + 79) % 360;

        if (from.links.length > 0 && to.links.length > 0) {
            colorize_link(from, cur_link_color);
        }

        if (to.links.length > 0) {
            colorize_link(to, to.link_color, true);
        }
        if (from.links.length > 0) {
            colorize_link(from, from.link_color, true);
        }

        if (from.links.length === 0) {
            from.link_color = -1;
            from.style.border = '0px';
            from.parent_link = from;
        }

        if (to.links.length === 0) {
            to.link_color = -1;
            to.style.border = '0px';
            to.parent_link = to;
        }

        from.removeAttribute('remove');
        to.removeAttribute('remove');
        links[link_index].active = false;

        save_state();
    }

    function colorize_link(el, color, reroot) {
        let visited = {};
        let seen_word = null;
        const root = el;

        function dfs(el) {
            if (typeof visited[el.id] !== 'undefined') {
                return;
            }
            if (!seen_word && el.value !== '') {
                seen_word = el.value;
            }
            visited[el.id] = true;
            el.link_color = color;
            el.style.border = '3px solid hsl(' + color + ', 80%, 45%)';
            if (reroot) {
                el.parent_link = root;
            }
            for (let i = 0; i < el.links.length; ++i) {
                if (links[el.links[i]].el_0 !== el) dfs(links[el.links[i]].el_0);
                if (links[el.links[i]].el_1 !== el) dfs(links[el.links[i]].el_1);
            }
            if (seen_word) {
                el.value = seen_word;
            }
        }
        dfs(el);
    }

    function create_link_words(from, to, type) {
        const wordLinkIndex = word_links.length;
        const typeChar = type[0];
        const hoverLinks = [];

        [from, to].forEach( el => {
            const wordLinks = el.querySelector('.wordlinks')
            let wordLink = document.createElement('div');
            wordLink.className = 'wordlink';
            wordLink.innerText = typeChar;
            wordLink.style.backgroundColor = 'hsl(' + word_link_color + ', 80%, 75%)';
            wordLink.link_color = word_link_color;
            wordLinks.appendChild(wordLink);

            hoverLinks.push(wordLink);
        });

        word_link_color = (word_link_color + 79) % 360;

        word_links.push({
            from: from.word_index,
            to: to.word_index,
            type: type,
            active: true
        });

        let removeBtn = document.createElement('button');
        removeBtn.className = 'removeButton';
        removeBtn.innerText = '[X] ' + type + ' word[' + from.word_index + '] :: word[' + to.word_index + ']';
        removeBtn.addEventListener('click', function() {
            word_links[wordLinkIndex].active = false;

            hoverLinks.forEach( el => {
                el.parentElement.removeChild(el);
            });

            this.parentElement.removeChild(this);
            save_state();
        });
        removeBtn.addEventListener('mouseover', function() {
            hoverLinks.forEach( el => {
                el.style.backgroundColor = 'hsl(' + el.link_color + ', 60%, 55%)';
            });
        });
        removeBtn.addEventListener('mouseout', function() {
            hoverLinks.forEach( el => {
                el.style.backgroundColor = 'hsl(' + el.link_color + ', 80%, 75%)';
            });
        });
        document.getElementById('relations').appendChild(removeBtn);

        save_state();
    }

    function create_link(from, to) {
        if (root_of(from) === root_of(to)) {
            return;
        }

        const link_index = links.length;
        from.is_link = to.is_link = true;
        from.links.push(link_index);
        to.links.push(link_index);

        links.push({
            word_0: from.word_index,
            pos_0: from.index,
            el_0: from,
            word_1: to.word_index,
            pos_1: to.index,
            el_1: to,
            active: true
        });

        //
        // Union and re-colorize / re-word linked nodes.
        //

        let cur_link_color = link_color;

        if (from.link_color >= 0) {
            cur_link_color = from.link_color;
        } else {
            link_color = (link_color + 79) % 360;
        }

        colorize_link(from, cur_link_color);
        root_of(to).parent_link = root_of(from);

        let removeBtn = document.createElement('button');
        removeBtn.className = 'removeButton';
        removeBtn.innerText = '[X] word[' + from.word_index + '][' + from.index + '] == word[' + to.word_index + '][' + to.index + ']';
        removeBtn.addEventListener('click', function() {
            remove_link(link_index);
            this.parentElement.removeChild(this);
        });
        removeBtn.addEventListener('mouseover', function() {
            const a = links[link_index].el_0;
            const b = links[link_index].el_1;
            a.setAttribute('remove','remove');
            b.setAttribute('remove','remove');
        });
        removeBtn.addEventListener('mouseout', function() {
            const a = links[link_index].el_0;
            const b = links[link_index].el_1;
            a.removeAttribute('remove');
            b.removeAttribute('remove');
        });
        document.getElementById('relations').appendChild(removeBtn);

        save_state();
    }

})();


