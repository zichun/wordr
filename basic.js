

var drop = new Vue({
  el: '#basic',
  data: {
    anagramresults: '',
    dropresults: '',
    equalcharresults: '',
    swapresults: ''
  },
  methods: {
    solve: function(event) {
      let solver = new Wordr.Solver({
        'wordList': SCRABBLE_LIST
      });
      firstWord = document.getElementById('matchingfirstword').value;
      firstIdx = parseInt(document.getElementById('matchingfirstindex').value, 10);
      secondIdx = parseInt(document.getElementById('matchingsecondindex').value, 10)
      secondWordLength = parseInt(document.getElementById('matchingsecondlength').value, 10);

      solver.add_word(Wordr.WordTypes.FixedLengthWord(firstWord.length));
      solver.add_word(Wordr.WordTypes.FixedLengthWord(secondWordLength));
      solver.add_relation(Wordr.RelationTypes.EqualChar(0, firstIdx-1, 1, secondIdx-1)); 
      
      let solutions = solver.solve([
          Wordr.make_pattern(firstWord),
          Wordr.make_pattern('?'.repeat(secondWordLength)),
      ]);
      
      this.equalcharresults = solutions[1].join(', ')
    }
  },
})

  