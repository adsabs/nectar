import * as d3 from 'd3';

export const wordData = [
  {
    text: 'the',
    size: 100,
  },
  {
    text: 'of',
    size: 99,
  },
  {
    text: 'to',
    size: 60,
  },
  {
    text: 'and',
    size: 39,
  },
  {
    text: 'a',
    size: 38,
  },
  {
    text: 'be',
    size: 32,
  },
  {
    text: 'will',
    size: 26,
  },
  {
    text: 'that',
    size: 24,
  },
  {
    text: 'is',
    size: 23,
  },
  {
    text: 'we',
    size: 21,
  },
  {
    text: 'in',
    size: 20,
  },
  {
    text: 'freedom',
    size: 20,
  },
  {
    text: 'have',
    size: 20,
  },
  {
    text: 'as',
    size: 19,
  },
  {
    text: 'our',
    size: 17,
  },
  {
    text: 'from',
    size: 17,
  },
  {
    text: 'I',
    size: 15,
  },

  {
    text: 'with',
    size: 13,
  },
  {
    text: 'not',
    size: 13,
  },
  {
    text: 'this',
    size: 12,
  },
  {
    text: 'We',
    size: 12,
  },
  {
    text: 'ring',
    size: 12,
  },
  {
    text: 'nation',
    size: 11,
  },
  {
    text: 'day',
    size: 11,
  },
  {
    text: 'dream',
    size: 11,
  },
  {
    text: 'one',
    size: 10,
  },
  {
    text: 'come',
    size: 10,
  },
  {
    text: 'every',
    size: 10,
  },
  {
    text: 'today',
    size: 9,
  },
  {
    text: 'back',
    size: 9,
  },
  {
    text: 'go',
    size: 8,
  },
  {
    text: 'for',
    size: 8,
  },
  {
    text: 'their',
    size: 8,
  },
  {
    text: 'by',
    size: 8,
  },
  {
    text: 'are',
    size: 8,
  },
  {
    text: 'justice',
    size: 8,
  },
  {
    text: 'must',
    size: 8,
  },
  {
    text: 'Let',
    size: 8,
  },
  {
    text: 'satisfied',
    size: 8,
  },
  {
    text: 'able',
    size: 8,
  },
  {
    text: 'you',
    size: 7,
  },
  {
    text: 'This',
    size: 7,
  },
  {
    text: 's',
    size: 7,
  },
  {
    text: 'all',
    size: 7,
  },
  {
    text: 'together',
    size: 7,
  },
  {
    text: 'long',
    size: 6,
  },
  {
    text: 'men',
    size: 6,
  },
  {
    text: 'white',
    size: 6,
  },
  {
    text: 'cannot',
    size: 6,
  },
  {
    text: 'years',
    size: 5,
  },
  {
    text: 'great',
    size: 5,
  },
  {
    text: 'on',
    size: 5,
  },
  {
    text: 'check',
    size: 5,
  },
  {
    text: 'which',
    size: 5,
  },
  {
    text: 'America',
    size: 5,
  },
  {
    text: 'has',
    size: 5,
  },
  {
    text: 'time',
    size: 5,
  },
  {
    text: 'children',
    size: 5,
  },
  {
    text: 'shall',
    size: 5,
  },
  {
    text: 'faith',
    size: 5,
  },
  {
    text: 'when',
    size: 5,
  },
  {
    text: 'let',
    size: 5,
  },
  {
    text: 'down',
    size: 4,
  },
  {
    text: 'American',
    size: 4,
  },
  {
    text: 'hope',
    size: 4,
  },
  {
    text: 'who',
    size: 4,
  },
  {
    text: 'It',
    size: 4,
  },
  {
    text: 'But',
    size: 4,
  },
  {
    text: 'hundred',
    size: 4,
  },
  {
    text: 'later',
    size: 4,
  },
  {
    text: 'still',
    size: 4,
  },
  {
    text: 'free',
    size: 4,
  },
  {
    text: 'an',
    size: 4,
  },
  {
    text: 'black',
    size: 4,
  },
  {
    text: 'there',
    size: 4,
  },
  {
    text: 'us',
    size: 4,
  },
  {
    text: 'Now',
    size: 4,
  },
  {
    text: 'God',
    size: 4,
  },
  {
    text: 'until',
    size: 4,
  },
  {
    text: 'my',
    size: 4,
  },
  {
    text: 'into',
    size: 4,
  },
  {
    text: 'up',
    size: 4,
  },
  {
    text: 'can',
    size: 4,
  },
  {
    text: 'Mississippi',
    size: 4,
  },
  {
    text: 'at',
    size: 4,
  },
  {
    text: 'join',
    size: 3,
  },
  {
    text: 'stand',
    size: 3,
  },
  {
    text: 'injustice',
    size: 3,
  },
  {
    text: 'One',
    size: 3,
  },
  {
    text: 'his',
    size: 3,
  },
  {
    text: 'land',
    size: 3,
  },
  {
    text: 'So',
    size: 3,
  },
  {
    text: 'here',
    size: 3,
  },
  {
    text: 'words',
    size: 3,
  },
  {
    text: 'note',
    size: 3,
  },
  {
    text: 'rights',
    size: 3,
  },
  {
    text: 'people',
    size: 3,
  },
  {
    text: 'make',
    size: 3,
  },
  {
    text: 'rise',
    size: 3,
  },
  {
    text: 'valley',
    size: 3,
  },
  {
    text: 'brotherhood',
    size: 3,
  },
  {
    text: 'sweltering',
    size: 3,
  },
  {
    text: 'never',
    size: 3,
  },
  {
    text: 'New',
    size: 3,
  },
  {
    text: 'out',
    size: 3,
  },
  {
    text: 'where',
    size: 3,
  },
  {
    text: 'Alabama',
    size: 3,
  },
  {
    text: 'Georgia',
    size: 3,
  },
  {
    text: 'its',
    size: 3,
  },
  {
    text: 'state',
    size: 3,
  },
  {
    text: 'little',
    size: 3,
  },
  {
    text: 'made',
    size: 3,
  },
  {
    text: 'With',
    size: 3,
  },
  {
    text: 'sing',
    size: 3,
  },
  {
    text: 'last',
    size: 3,
  },
  {
    text: 'am',
    size: 2,
  },
  {
    text: 'history',
    size: 2,
  },
  {
    text: 'came',
    size: 2,
  },
  {
    text: 'slaves',
    size: 2,
  },
  {
    text: 'been',
    size: 2,
  },
  {
    text: 'end',
    size: 2,
  },
  {
    text: 'life',
    size: 2,
  },
  {
    text: 'segregation',
    size: 2,
  },
  {
    text: 'In',
    size: 2,
  },
  {
    text: 'cash',
    size: 2,
  },
  {
    text: 'When',
    size: 2,
  },
  {
    text: 'they',
    size: 2,
  },
  {
    text: 'promissory',
    size: 2,
  },
  {
    text: 'was',
    size: 2,
  },
  {
    text: 'would',
    size: 2,
  },
  {
    text: 'liberty',
    size: 2,
  },
  {
    text: 'color',
    size: 2,
  },
  {
    text: 'insufficient',
    size: 2,
  },
  {
    text: 'funds',
    size: 2,
  },
  {
    text: 'refuse',
    size: 2,
  },
  {
    text: 'believe',
    size: 2,
  },
  {
    text: 'urgency',
    size: 2,
  },
  {
    text: 'now',
    size: 2,
  },
  {
    text: 'no',
    size: 2,
  },
  {
    text: 'off',
    size: 2,
  },
  {
    text: 'racial',
    size: 2,
  },
  {
    text: 'but',
    size: 2,
  },
  {
    text: 'content',
    size: 2,
  },
  {
    text: 'if',
    size: 2,
  },
  {
    text: 'There',
    size: 2,
  },
  {
    text: 'The',
    size: 2,
  },
  {
    text: 'say',
    size: 2,
  },
  {
    text: 'struggle',
    size: 2,
  },
  {
    text: 'dignity',
    size: 2,
  },
  {
    text: 'allow',
    size: 2,
  },
  {
    text: 'creative',
    size: 2,
  },
  {
    text: 'physical',
    size: 2,
  },
  {
    text: 'force',
    size: 2,
  },
  {
    text: 'new',
    size: 2,
  },
  {
    text: 'brothers',
    size: 2,
  },
  {
    text: 'realize',
    size: 2,
  },
  {
    text: 'destiny',
    size: 2,
  },
  {
    text: 'walk',
    size: 2,
  },
  {
    text: 'police',
    size: 2,
  },
  {
    text: 'brutality',
    size: 2,
  },
  {
    text: 'cities',
    size: 2,
  },
  {
    text: 'vote',
    size: 2,
  },
  {
    text: 'York',
    size: 2,
  },
  {
    text: 'like',
    size: 2,
  },
  {
    text: 'mighty',
    size: 2,
  },
  {
    text: 'Some',
    size: 2,
  },
  {
    text: 'jail',
    size: 2,
  },
  {
    text: 'suffering',
    size: 2,
  },
  {
    text: 'work',
    size: 2,
  },
  {
    text: 'South',
    size: 2,
  },
  {
    text: 'knowing',
    size: 2,
  },
  {
    text: 'despair',
    size: 2,
  },
  {
    text: 'even',
    size: 2,
  },
  {
    text: 'live',
    size: 2,
  },
  {
    text: 'true',
    size: 2,
  },
  {
    text: 'meaning',
    size: 2,
  },
  {
    text: 'sons',
    size: 2,
  },
  {
    text: 'former',
    size: 2,
  },
  {
    text: 'heat',
    size: 2,
  },
  {
    text: 'boys',
    size: 2,
  },
  {
    text: 'girls',
    size: 2,
  },
  {
    text: 'hands',
    size: 2,
  },
  {
    text: 'hill',
    size: 2,
  },
  {
    text: 'mountain',
    size: 2,
  },
  {
    text: 'places',
    size: 2,
  },
  {
    text: 'it',
    size: 2,
  },
  {
    text: 'thee',
    size: 2,
  },
  {
    text: 'mountainside',
    size: 2,
  },
  {
    text: 'And',
    size: 2,
  },
  {
    text: 'Mountain',
    size: 2,
  },
  {
    text: 'happy',
    size: 1,
  },
  {
    text: 'what',
    size: 1,
  },
  {
    text: 'greatest',
    size: 1,
  },
  {
    text: 'demonstration',
    size: 1,
  },
  {
    text: 'Five',
    size: 1,
  },
  {
    text: 'score',
    size: 1,
  },
  {
    text: 'ago',
    size: 1,
  },
  {
    text: 'whose',
    size: 1,
  },
  {
    text: 'symbolic',
    size: 1,
  },
  {
    text: 'shadow',
    size: 1,
  },
  {
    text: 'signed',
    size: 1,
  },
  {
    text: 'Emancipation',
    size: 1,
  },
  {
    text: 'Proclamation',
    size: 1,
  },
  {
    text: 'momentous',
    size: 1,
  },
  {
    text: 'decree',
    size: 1,
  },
  {
    text: 'beacon',
    size: 1,
  },
  {
    text: 'light',
    size: 1,
  },
  {
    text: 'millions',
    size: 1,
  },
  {
    text: 'had',
    size: 1,
  },
  {
    text: 'seared',
    size: 1,
  },
  {
    text: 'flames',
    size: 1,
  },
  {
    text: 'withering',
    size: 1,
  },
  {
    text: 'joyous',
    size: 1,
  },
  {
    text: 'daybreak',
    size: 1,
  },
  {
    text: 'night',
    size: 1,
  },
  {
    text: 'captivity',
    size: 1,
  },
  {
    text: 'sadly',
    size: 1,
  },
  {
    text: 'crippled',
    size: 1,
  },
  {
    text: 'manacles',
    size: 1,
  },
  {
    text: 'chains',
    size: 1,
  },
  {
    text: 'discrimination',
    size: 1,
  },
  {
    text: 'lives',
    size: 1,
  },
  {
    text: 'lonely',
    size: 1,
  },
  {
    text: 'island',
    size: 1,
  },
  {
    text: 'poverty',
    size: 1,
  },
  {
    text: 'midst',
    size: 1,
  },
  {
    text: 'vast',
    size: 1,
  },
  {
    text: 'ocean',
    size: 1,
  },
  {
    text: 'material',
    size: 1,
  },
  {
    text: 'prosperity',
    size: 1,
  },
  {
    text: 'languishing',
    size: 1,
  },
  {
    text: 'corners',
    size: 1,
  },
  {
    text: 'society',
    size: 1,
  },
  {
    text: 'finds',
    size: 1,
  },
  {
    text: 'himself',
    size: 1,
  },
  {
    text: 'exile',
    size: 1,
  },
  {
    text: 'own',
    size: 1,
  },
  {
    text: 'dramatize',
    size: 1,
  },
  {
    text: 'shameful',
    size: 1,
  },
  {
    text: 'condition',
    size: 1,
  },
  {
    text: 'sense',
    size: 1,
  },
  {
    text: 'capital',
    size: 1,
  },
  {
    text: 'architects',
    size: 1,
  },
  {
    text: 'republic',
    size: 1,
  },
  {
    text: 'wrote',
    size: 1,
  },
  {
    text: 'magnificent',
    size: 1,
  },
  {
    text: 'Constitution',
    size: 1,
  },
  {
    text: 'Declaration',
    size: 1,
  },
  {
    text: 'Independence',
    size: 1,
  },
];
