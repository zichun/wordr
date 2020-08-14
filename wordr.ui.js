(() => {

    document.getElementById('add-word').addEventListener('click', () => {
        let letters = prompt('Number of letters');
        create_word(parseInt(letters, 10));
    });

    let words = [];
    let links = [];
    let in_link = false;
    let start_link = null;
    let link_color = 0;

    const LinkButton = document.getElementById('link');

    LinkButton.addEventListener('click', function() {
        if (!start_link) return;

        start_link.style.backgroundColor = '#fdd';
        in_link = true;

        LinkButton.innerText = 'select element to link to';
        LinkButton.setAttribute('disabled', 'disabled');
    });

    document.getElementById('solve').addEventListener('click', function() {
        solve();
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
        localStorage.state = JSON.stringify(get_state());
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

    }
    function char_id(word_index, index) {
        return 'char-' + word_index + '-' + index;
    }
    function get_state() {
        let swords = [];
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
        return {
            'words': swords,
            'links': slinks
        };
    }

    function solve() {
        save_state();

        let solver = new Wordr.Solver({
            'wordList': SCRABBLE_LIST,
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

        let solutions = solver.solve(patterns);

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
        if (letters <= 0 || letters > 15) {
            throw 'Invalid number of letters';
        }

        prefill = prefill || [];

        const wordIndex = words.length; // todo: wordIndex has to be dynamic to support removal of words

        let wordElement = document.createElement('div');
        wordElement.className = 'word'

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
                    start_link = null;
                    in_link = false;

                    LinkButton.innerText = 'link';
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
        removeBtn.innerText = '[x] word[' + from.word_index + '][' + from.index + '] == word[' + to.word_index + '][' + to.index + ']';
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


