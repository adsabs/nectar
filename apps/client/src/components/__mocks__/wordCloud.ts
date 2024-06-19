import { scaleLog } from 'd3-scale';

const colorRange = ['#80E6FF', '#7575FF', '#7575FF', '#47008F'];

export const fill = scaleLog<string>().domain([1, 100]);
fill
  .domain([0, 0.25, 0.5, 0.75, 1].map((v) => fill.invert(v)))
  .range(colorRange)
  .clamp(true);

export const wordData = [
  {
    text: 'singularity',
    size: 30,
    selected: false,
    origSize: 0.9641227733998463,
  },
  {
    text: 'effect',
    size: 30.032215762770175,
    selected: false,
    origSize: 0.9646767198009611,
  },
  {
    text: 'study',
    size: 30.651251775045637,
    selected: false,
    origSize: 0.9753830063150397,
  },
  {
    text: 'nature',
    size: 30.651251775045637,
    selected: false,
    origSize: 0.9753830063150397,
  },
  {
    text: 'Relativity',
    size: 30.830943463226244,
    selected: false,
    origSize: 0.978512984527335,
  },
  {
    text: 'mechanic',
    size: 31.300687513285805,
    selected: false,
    origSize: 0.9867427998117191,
  },
  {
    text: 'problem',
    size: 31.658248943712522,
    selected: false,
    origSize: 0.9930535642958533,
  },
  {
    text: 'physical',
    size: 31.658248943712522,
    selected: false,
    origSize: 0.9930535642958533,
  },
  {
    text: 'physics',
    size: 31.831191557750255,
    selected: false,
    origSize: 0.9961203730243295,
  },
  {
    text: 'General',
    size: 31.889510143552172,
    selected: false,
    origSize: 0.9971566762893941,
  },
  {
    text: 'consider',
    size: 31.983869926752927,
    selected: false,
    origSize: 0.9988357043966705,
  },
  {
    text: 'find',
    size: 32.19985568661544,
    selected: false,
    origSize: 1.002689582007143,
  },
  {
    text: 'mass',
    size: 32.36710695639256,
    selected: false,
    origSize: 1.0056840927622037,
  },
  {
    text: 'equation',
    size: 33.0075885547404,
    selected: false,
    origSize: 1.0172343743303378,
  },
  {
    text: 'state',
    size: 33.40661124767085,
    selected: false,
    origSize: 1.0244972175192217,
  },
  {
    text: 'particular',
    size: 33.55506627520797,
    selected: false,
    origSize: 1.0272125488915627,
  },
  {
    text: 'examine',
    size: 33.55506627520797,
    selected: false,
    origSize: 1.0272125488915627,
  },
  {
    text: 'hole',
    size: 34.2664166677662,
    selected: false,
    origSize: 1.0403237704530925,
  },
  {
    text: 'discuss',
    size: 34.437205451010826,
    selected: false,
    origSize: 1.0434964888015035,
  },
  {
    text: 'Book',
    size: 34.437205451010826,
    selected: false,
    origSize: 1.0434964888015035,
  },
  {
    text: 'Review',
    size: 34.437205451010826,
    selected: false,
    origSize: 1.0434964888015035,
  },
  {
    text: 'different',
    size: 34.77537833662978,
    selected: false,
    origSize: 1.0498072532856377,
  },
  {
    text: 'describe',
    size: 34.93178142169237,
    selected: false,
    origSize: 1.0527388404715816,
  },
  {
    text: 'lead',
    size: 35.23642506711349,
    selected: false,
    origSize: 1.0584725413130998,
  },
  {
    text: 'term',
    size: 35.287838593475364,
    selected: false,
    origSize: 1.0594432709969275,
  },
  {
    text: 'result',
    size: 35.655765482461874,
    selected: false,
    origSize: 1.0664160636439288,
  },
  {
    text: 'new',
    size: 35.76212496246935,
    selected: false,
    origSize: 1.0684402802664854,
  },
  {
    text: 'complex',
    size: 36.335130666480254,
    selected: false,
    origSize: 1.0794119270451297,
  },
  {
    text: 'provide',
    size: 36.92450923039004,
    selected: false,
    origSize: 1.09081462624688,
  },
  {
    text: 'black',
    size: 37.02612216836393,
    selected: false,
    origSize: 1.0927926690338479,
  },
  {
    text: 'twistor',
    size: 37.416075444661566,
    selected: false,
    origSize: 1.1004170262631892,
  },
  {
    text: 'structure',
    size: 38.073613651030676,
    selected: false,
    origSize: 1.1133938615659114,
  },
  {
    text: 'conformal',
    size: 38.21464028892885,
    selected: false,
    origSize: 1.1161969599867119,
  },
  {
    text: 'cosmology',
    size: 39.29319386480257,
    selected: false,
    origSize: 1.1378693739562582,
  },
  {
    text: 'show',
    size: 39.963334783457285,
    selected: false,
    origSize: 1.1515465971286054,
  },
  {
    text: 'gravity',
    size: 40.07449431447048,
    selected: false,
    origSize: 1.153831148432661,
  },
  {
    text: 'give',
    size: 42.30248844789351,
    selected: false,
    origSize: 1.2005888473999453,
  },
  {
    text: 'field',
    size: 42.962483256561526,
    selected: false,
    origSize: 1.214800181602505,
  },
  {
    text: 'Time',
    size: 43.339786575725014,
    selected: false,
    origSize: 1.2229999074409346,
  },
  {
    text: 'Einstein',
    size: 43.61271061294505,
    selected: false,
    origSize: 1.2289656918948375,
  },
  {
    text: 'Space',
    size: 44.336237979502144,
    selected: false,
    origSize: 1.2449223239885752,
  },
  {
    text: 'present',
    size: 47.16417194564438,
    selected: false,
    origSize: 1.309301965733208,
  },
  {
    text: 'relativity',
    size: 47.818612254569466,
    selected: false,
    origSize: 1.324668939228724,
  },
  {
    text: 'quantum',
    size: 49.33027879274821,
    selected: false,
    origSize: 1.3608575073142641,
  },
  {
    text: 'Quantum',
    size: 49.544107275128916,
    selected: false,
    origSize: 1.3660556547229923,
  },
  {
    text: 'general',
    size: 52.15204020467278,
    selected: false,
    origSize: 1.4310750911743808,
  },
  {
    text: 'gravitational',
    size: 53.91591444040165,
    selected: false,
    origSize: 1.4767964678754173,
  },
  {
    text: 'theory',
    size: 62.56685483850642,
    selected: false,
    origSize: 1.7230883466332167,
  },
  {
    text: 'time',
    size: 69.80912245348621,
    selected: false,
    origSize: 1.9605894333264338,
  },
  {
    text: 'space',
    size: 70,
    selected: false,
    origSize: 1.9672732260649628,
  },
];
