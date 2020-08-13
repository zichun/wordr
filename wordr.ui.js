(() => {

    document.getElementById('add-word').addEventListener('click', () => {
        let letters = prompt('Number of letters');
        create_word(parseInt(letters, 10));
    });


    let words = [];
    let links = [];
    let in_link = false;
    let start_link = null;

    const LinkButton = document.getElementById('link');

    LinkButton.addEventListener('click', function() {
        if (!start_link) return;

        start_link.style.backgroundColor = '#fdd';
        in_link = true;

        LinkButton.innerText = 'select element to link to';
        LinkButton.setAttribute('disabled', 'disabled');
    });

    document.getElementById('solve').addEventListener('click', function() {
        let solver = new Wordr.Solver({
            'wordList': WORD_LIST
        });
        for (let i = 0; i < words.length; ++i) {
            solver.add_word(Wordr.WordTypes.FixedLengthWord(words[i].length));
        }
        for (let i = 0; i < links.length; ++i) {
            solver.add_relation(
                Wordr.RelationTypes.EqualChar(links[i].word_0,
                                              links[i].pos_0,
                                              links[i].word_1,
                                              links[i].pos_1));
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
        //        console.log(solutions);

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
    });

//    create_word(5);
//    create_word(5);

    function create_word(letters) {
        if (letters <= 0 || letters > 15) {
            throw 'Invalid number of letters';
        }

        const wordIndex = words.length; // todo: wordIndex has to be dynamic to support removal of words

        let wordElement = document.createElement('div');
        wordElement.className = 'word'

        for (let i = 0; i < letters; ++i) {
            let tb;
            wordElement.appendChild(tb = document.createElement('input'));
            tb.className = 'char';
            tb.setAttribute('maxLength', 1);

            tb.index = i;
            tb.word_index = wordIndex;

            tb.links = [];
            tb.is_link = false;
            tb.link_color = -1;
            tb.parent_link = tb;
            tb.id = 'char-' + wordIndex + '-' + i;

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
                let seen_word = null;

                function dfs(el) {
                    if (typeof visited[el.id] !== 'undefined') {
                        return;
                    }
                    if (!seen_word && el.value !== '') {
                        seen_word = el.value;
                    }
                    visited[el.id] = true;
                    for (let i = 0; i < el.links.length; ++i) {
                        if (links[el.links[i]].el_0 !== el) dfs(links[el.links[i]].el_0);
                        if (links[el.links[i]].el_1 !== el) dfs(links[el.links[i]].el_1);
                    }
                    if (seen_word) {
                        el.value = seen_word;
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
    }

    function root_of(el) {
        if (el.parent_link === el) {
            return el;
        }
        el.parent_link = root_of(el.parent_link);
        return el.parent_link;
    }
    let link_color = 0;

    function create_link(from, to) {
        if (root_of(from) === root_of(to)) {
            return;
        }

        from.is_link = to.is_link = true;
        from.links.push(links.length);
        to.links.push(links.length);

        links.push({
            word_0: from.word_index,
            pos_0: from.index,
            el_0: from,
            word_1: to.word_index,
            pos_1: to.index,
            el_1: to
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

        function colorize(el, color) {
            let visited = {};
            let seen_word = null;

            function dfs(el) {
                if (typeof visited[el.id] !== 'undefined') {
                    return;
                }
                if (!seen_word && el.value !== '') {
                    seen_word = el.value;
                }
                visited[el.id] = true;
                from.link_color = to.link_color = color;
                el.style.border = '3px solid hsl(' + color + ', 80%, 45%)'; // todo: color
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

        colorize(from, cur_link_color);
        root_of(to).parent_link = root_of(from);
    }

})();


