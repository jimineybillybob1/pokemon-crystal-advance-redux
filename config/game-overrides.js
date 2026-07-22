window.GUIDE_OVERRIDES = {
  spriteFallbacks: {},
  formSpriteFallbacks: {},
  // The workbook has separate species rows and learnsets for Dex 29 and 32.
  // Preserve their gender identity in searches, encounters and build pickers.
  pokemonAliases: {
    nidoranfemale: 29,
    nidoranmale: 32
  },
  displayNames: {
    'Nidoran♀': 'Nidoran (Female)',
    'Nidoran♂': 'Nidoran (Male)'
  },
  formLabels: {},
  // Workbook SE Starter placeholders plus the documented player-choice relationship supplied for this guide.
  rivalStarterCounters: {
    Chikorita: ['Cyndaquil', 'Quilava', 'Typhlosion'],
    Cyndaquil: ['Totodile', 'Croconaw', 'Feraligatr'],
    Totodile: ['Chikorita', 'Bayleef', 'Meganium']
  },
  // The official feature list offers both protagonists from generations 1-4, plus Ash.
  trainerCostumes: [
    {id:'red', name:'Red', gender:'male', sprite:'assets/trainers/red.png'},
    {id:'leaf', name:'Leaf', gender:'female', sprite:'assets/trainers/leaf.png'},
    {id:'ethan', name:'Ethan', gender:'male', sprite:'assets/trainers/ethan.png'},
    {id:'kris', name:'Kris', gender:'female', sprite:'assets/trainers/kris.png'},
    {id:'brendan', name:'Brendan', gender:'male', sprite:'assets/trainers/brendan.png'},
    {id:'may', name:'May', gender:'female', sprite:'assets/trainers/may.png'},
    {id:'lucas', name:'Lucas', gender:'male', sprite:'assets/trainers/lucas.png'},
    {id:'dawn', name:'Dawn', gender:'female', sprite:'assets/trainers/dawn.png'},
    {id:'ash', name:'Ash', gender:'male', sprite:'assets/trainers/ash.png'}
  ],
  sharedLearnsets: [],
  acquisitionNotes: {},
  mapPositions: {}
};
