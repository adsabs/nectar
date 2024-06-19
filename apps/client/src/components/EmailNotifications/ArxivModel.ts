type Cat = { key: string; label: string; children?: { [key in string]: Cat } };

export const arxivModel: { [key in string]: Cat } = {
  'astro-ph': {
    key: 'astro-ph',
    label: 'Astrophysics',

    children: {
      'astro-ph.CO': {
        key: 'astro-ph.CO',
        label: 'Cosmology and Nongalactic Astrophysics',
      },
      'astro-ph.EP': {
        key: 'astro-ph.EP',
        label: 'Earth and Planetary Astrophysics',
      },
      'astro-ph.GA': {
        key: 'astro-ph.GA',
        label: 'Astrophysics of Galaxies',
      },
      'astro-ph.HE': {
        key: 'astro-ph.HE',
        label: 'High Energy Astrophysical Phenomena',
      },
      'astro-ph.IM': {
        key: 'astro-ph.IM',
        label: 'Instrumentation and Methods for Astrophysics',
      },
      'astro-ph.SR': {
        key: 'astro-ph.SR',
        label: 'Solar and Stellar Astrophysics',
      },
    },
  },
  'cond-mat': {
    key: 'cond-mat',
    label: 'Condensed Matter',

    children: {
      'cond-mat.dis-nn': {
        key: 'cond-mat.dis-nn',
        label: 'Disordered Systems and Neural Networks',
      },
      'cond-mat.mtrl-sci': {
        key: 'cond-mat.mtrl-sci',
        label: 'Materials Science',
      },
      'cond-mat.mes-hall': {
        key: 'cond-mat.mes-hall',
        label: 'Mesoscopic Systems and Quantum Hall Effect',
      },
      'cond-mat.other': {
        key: 'cond-mat.other',
        label: 'Other',
      },
      'cond-mat.quant-gas': {
        key: 'cond-mat.quant-gas',
        label: 'Quantum Gases',
      },
      'cond-mat.soft': {
        key: 'cond-mat.soft',
        label: 'Soft Condensed Matter',
      },
      'cond-mat.stat-mech': {
        key: 'cond-mat.stat-mech',
        label: 'Statistical Mechanics',
      },
      'cond-mat.str-el': {
        key: 'cond-mat.str-el',
        label: 'Strongly Correlated Electrons',
      },
      'cond-mat.supr-con': {
        key: 'cond-mat.supr-con',
        label: 'Superconductivity',
      },
    },
  },
  'gr-qc': {
    key: 'gr-qc',
    label: 'General Relativity and Quantum Cosmology',

    children: {},
  },
  'hep-ex': {
    key: 'hep-ex',
    label: 'High Energy Physics (Experiment)',

    children: {},
  },
  'hep-lat': {
    key: 'hep-lat',
    label: 'High Energy Physics (Lattice)',

    children: {},
  },
  'hep-ph': {
    key: 'hep-ph',
    label: 'High Energy Physics (Phenomenology)',

    children: {},
  },
  'hep-th': {
    key: 'hep-th',
    label: 'High Energy Physics (Theory)',

    children: {},
  },
  'math-ph': {
    key: 'math-ph',
    label: 'Mathematical Physics',

    children: {},
  },
  'nucl-ex': {
    key: 'nucl-ex',
    label: 'Nuclear Experiment',

    children: {},
  },
  'nucl-th': {
    key: 'nucl-th',
    label: 'Nuclear Theory',

    children: {},
  },
  econ: {
    key: 'econ',
    label: 'Economics',

    children: {
      'econ.EM': {
        key: 'econ.EM',
        label: 'Econometrics',
      },
      'econ.GN': {
        key: 'econ.GN',
        label: 'General Economics',
      },
      'econ.TH': {
        key: 'econ.TH',
        label: 'Theoretical Economics',
      },
    },
  },
  eess: {
    key: 'eess',
    label: 'Electrical Engineering and Systems Science',

    children: {
      'eess.AS': {
        key: 'eess.AS',
        label: 'Audio and Speech Processing',
      },
      'eess.IV': {
        key: 'eess.IV',
        label: 'Image and Video Processing',
      },
      'eess.SP': {
        key: 'eess.SP',
        label: 'Signal Processing',
      },
      'eess.SY': {
        key: 'eess.SY',
        label: 'Systems and Control',
      },
    },
  },
  physics: {
    key: 'physics',
    label: 'Physics',

    children: {
      'physics.acc-ph': {
        key: 'physics.acc-ph',
        label: 'Accelerator Physics',
      },
      'physics.app-ph': {
        key: 'physics.app-ph',
        label: 'Applied Physics',
      },
      'physics.ao-ph': {
        key: 'physics.ao-ph',
        label: 'Atmospheric and Oceanic Physics',
      },
      'physics.atom-ph': {
        key: 'physics.atom-ph',
        label: 'Atomic Physics',
      },
      'physics.atm-clus': {
        key: 'physics.atm-clus',
        label: 'Atomic and Molecular Clusters',
      },
      'physics.bio-ph': {
        key: 'physics.bio-ph',
        label: 'Biological Physics',
      },
      'physics.chem-ph': {
        key: 'physics.chem-ph',
        label: 'Chemical Physics',
      },
      'physics.class-ph': {
        key: 'physics.class-ph',
        label: 'Classical Physics',
      },
      'physics.comp-ph': {
        key: 'physics.comp-ph',
        label: 'Computational Physics',
      },
      'physics.data-an': {
        key: 'physics.data-an',
        label: 'Data Analysis, Statistics and Probability',
      },
      'physics.flu-dyn': {
        key: 'physics.flu-dyn',
        label: 'Fluid Dynamics',
      },
      'physics.gen-ph': {
        key: 'physics.gen-ph',
        label: 'General Physics',
      },
      'physics.geo-ph': {
        key: 'physics.geo-ph',
        label: 'Geophysics',
      },
      'physics.hist-ph': {
        key: 'physics.hist-ph',
        label: 'History and Philosophy of Physics',
      },
      'physics.ins-det': {
        key: 'physics.ins-det',
        label: 'Instrumentation and Detectors',
      },
      'physics.med-ph': {
        key: 'physics.med-ph',
        label: 'Medical Physics',
      },
      'physics.optics': {
        key: 'physics.optics',
        label: 'Optics',
      },
      'physics.ed-ph': {
        key: 'physics.ed-ph',
        label: 'Physics Education',
      },
      'physics.soc-ph': {
        key: 'physics.soc-ph',
        label: 'Physics and Society',
      },
      'physics.plasm-ph': {
        key: 'physics.plasm-ph',
        label: 'Plasma Physics',
      },
      'physics.pop-ph': {
        key: 'physics.pop-ph',
        label: 'Popular Physics',
      },
      'physics.space-ph': {
        key: 'physics.space-ph',
        label: 'Space Physics',
      },
    },
  },
  'quant-ph': {
    key: 'quant-ph',
    label: 'Quantum Physics',

    children: {},
  },
  math: {
    key: 'math',
    label: 'Mathematics',

    children: {
      'math.AG': {
        key: 'math.AG',
        label: 'Algebraic Geometry',
      },
      'math.AT': {
        key: 'math.AT',
        label: 'Algebraic Topology',
      },
      'math.AP': {
        key: 'math.AP',
        label: 'Analysis of PDEs',
      },
      'math.CT': {
        key: 'math.CT',
        label: 'Category Theory',
      },
      'math.CA': {
        key: 'math.CA',
        label: 'Classical Analysis and ODEs',
      },
      'math.CO': {
        key: 'math.CO',
        label: 'Combinatorics',
      },
      'math.AC': {
        key: 'math.AC',
        label: 'Commutative Algebra',
      },
      'math.CV': {
        key: 'math.CV',
        label: 'Complex Variables',
      },
      'math.DG': {
        key: 'math.DG',
        label: 'Differential Geometry',
      },
      'math.DS': {
        key: 'math.DS',
        label: 'Dynamical Systems',
      },
      'math.FA': {
        key: 'math.FA',
        label: 'Functional Analysis',
      },
      'math.GM': {
        key: 'math.GM',
        label: 'General Mathematics',
      },
      'math.GN': {
        key: 'math.GN',
        label: 'General Topology',
      },
      'math.GT': {
        key: 'math.GT',
        label: 'Geometric Topology',
      },
      'math.GR': {
        key: 'math.GR',
        label: 'Group Theory',
      },
      'math.HO': {
        key: 'math.HO',
        label: 'History and Overview',
      },
      'math.IT': {
        key: 'math.IT',
        label: 'Information Theory',
      },
      'math.KT': {
        key: 'math.KT',
        label: 'K-Theory and Homology',
      },
      'math.LO': {
        key: 'math.LO',
        label: 'Logic',
      },
      'math.MP': {
        key: 'math.MP',
        label: 'Mathematical Physics',
      },
      'math.MG': {
        key: 'math.MG',
        label: 'Metric Geometry',
      },
      'math.NT': {
        key: 'math.NT',
        label: 'Number Theory',
      },
      'math.NA': {
        key: 'math.NA',
        label: 'Numerical Analysis',
      },
      'math.OA': {
        key: 'math.OA',
        label: 'Operator Algebras',
      },
      'math.OC': {
        key: 'math.OC',
        label: 'Optimization and Control',
      },
      'math.PR': {
        key: 'math.PR',
        label: 'Probability',
      },
      'math.QA': {
        key: 'math.QA',
        label: 'Quantum Algebra',
      },
      'math.RT': {
        key: 'math.RT',
        label: 'Representation Theory',
      },
      'math.RA': {
        key: 'math.RA',
        label: 'Rings and Algebras',
      },
      'math.SP': {
        key: 'math.SP',
        label: 'Spectral Theory',
      },
      'math.ST': {
        key: 'math.ST',
        label: 'Statistics Theory',
      },
      'math.SG': {
        key: 'math.SG',
        label: 'Symplectic Geometry',
      },
    },
  },
  nlin: {
    key: 'nlin',
    label: 'Nonlinear Sciences',

    children: {
      'nlin.AO': {
        key: 'nlin.AO',
        label: 'Adaptation and Self-Organizing Systems',
      },
      'nlin.CG': {
        key: 'nlin.CG',
        label: 'Cellular Automata and Lattice Gases',
      },
      'nlin.CD': {
        key: 'nlin.CD',
        label: 'Chaotic Dynamics',
      },
      'nlin.SI': {
        key: 'nlin.SI',
        label: 'Exactly Solvable and Integrable Systems',
      },
      'nlin.PS': {
        key: 'nlin.PS',
        label: 'Pattern Formation and Solitons',
      },
    },
  },
  cs: {
    key: 'cs',
    label: 'Computer Science',

    children: {
      'cs.AR': {
        key: 'cs.AR',
        label: 'Hardware Architecture',
      },
      'cs.AI': {
        key: 'cs.AI',
        label: 'Artificial Intelligence',
      },
      'cs.CL': {
        key: 'cs.CL',
        label: 'Computation and Language',
      },
      'cs.CC': {
        key: 'cs.CC',
        label: 'Computational Complexity',
      },
      'cs.CE': {
        key: 'cs.CE',
        label: 'Computational Engineering',
      },
      'cs.CG': {
        key: 'cs.CG',
        label: 'Computational Geometry',
      },
      'cs.GT': {
        key: 'cs.GT',
        label: 'Computer Science and Game Theory',
      },
      'cs.CV': {
        key: 'cs.CV',
        label: 'Computer Vision and Pattern Recognition',
      },
      'cs.CY': {
        key: 'cs.CY',
        label: 'Computers and Society',
      },
      'cs.CR': {
        key: 'cs.CR',
        label: 'Cryptography and Security',
      },
      'cs.DS': {
        key: 'cs.DS',
        label: 'Data Structures and Algorithms',
      },
      'cs.DB': {
        key: 'cs.DB',
        label: 'Databases',
      },
      'cs.DL': {
        key: 'cs.DL',
        label: 'Digital Libraries',
      },
      'cs.DM': {
        key: 'cs.DM',
        label: 'Discrete Mathematics',
      },
      'cs.DC': {
        key: 'cs.DC',
        label: 'Distributed',
      },
      'cs.ET': {
        key: 'cs.ET',
        label: 'Emerging Technologies',
      },
      'cs.FL': {
        key: 'cs.FL',
        label: 'Formal Languages and Automata Theory',
      },
      'cs.GL': {
        key: 'cs.GL',
        label: 'General Literature',
      },
      'cs.GR': {
        key: 'cs.GR',
        label: 'Graphics',
      },
      'cs.HC': {
        key: 'cs.HC',
        label: 'Human-Computer Interaction',
      },
      'cs.IR': {
        key: 'cs.IR',
        label: 'Information Retrieval',
      },
      'cs.IT': {
        key: 'cs.IT',
        label: 'Information Theory',
      },
      'cs.LG': {
        key: 'cs.LG',
        label: 'Machine Learning',
      },
      'cs.LO': {
        key: 'cs.LO',
        label: 'Logic in Computer Science',
      },
      'cs.MS': {
        key: 'cs.MS',
        label: 'Mathematical Software',
      },
      'cs.MA': {
        key: 'cs.MA',
        label: 'Multiagent Systems',
      },
      'cs.MM': {
        key: 'cs.MM',
        label: 'Multimedia',
      },
      'cs.NI': {
        key: 'cs.NI',
        label: 'Networking and Internet Architecture',
      },
      'cs.NE': {
        key: 'cs.NE',
        label: 'Neural and Evolutionary Computing',
      },
      'cs.NA': {
        key: 'cs.NA',
        label: 'Numerical Analysis',
      },
      'cs.OS': {
        key: 'cs.OS',
        label: 'Operating Systems',
      },
      'cs.OH': {
        key: 'cs.OH',
        label: 'Other',
      },
      'cs.PF': {
        key: 'cs.PF',
        label: 'Performance',
      },
      'cs.PL': {
        key: 'cs.PL',
        label: 'Programming Languages',
      },
      'cs.RO': {
        key: 'cs.RO',
        label: 'Robotics',
      },
      'cs.SE': {
        key: 'cs.SE',
        label: 'Software Engineering',
      },
      'cs.SD': {
        key: 'cs.SD',
        label: 'Sound',
      },
      'cs.SC': {
        key: 'cs.SC',
        label: 'Symbolic Computation',
      },
      'cs.SI': {
        key: 'cs.SI',
        label: 'Social and Information Networks',
      },
      'cs.SY': {
        key: 'cs.SY',
        label: 'Systems and Control',
      },
    },
  },
  'q-bio': {
    key: 'q-bio',
    label: 'Quantitative Biology',

    children: {
      'q-bio.BM': {
        key: 'q-bio.BM',
        label: 'Biomolecules',
      },
      'q-bio.CB': {
        key: 'q-bio.CB',
        label: 'Cell Behavior',
      },
      'q-bio.GN': {
        key: 'q-bio.GN',
        label: 'Genomics',
      },
      'q-bio.MN': {
        key: 'q-bio.MN',
        label: 'Molecular Networks',
      },
      'q-bio.NC': {
        key: 'q-bio.NC',
        label: 'Neurons and Cognition',
      },
      'q-bio.OT': {
        key: 'q-bio.OT',
        label: 'Other Quantitative Biology',
      },
      'q-bio.PE': {
        key: 'q-bio.PE',
        label: 'Populations and Evolution',
      },
      'q-bio.QM': {
        key: 'q-bio.QM',
        label: 'Quantitative Methods',
      },
      'q-bio.SC': {
        key: 'q-bio.SC',
        label: 'Subcellular Processes',
      },
      'q-bio.TO': {
        key: 'q-bio.TO',
        label: 'Tissues and Organs',
      },
    },
  },
  'q-fin': {
    key: 'q-fin',
    label: 'Quantitative Finance',

    children: {
      'q-fin.CP': {
        key: 'q-fin.CP',
        label: 'Computational Finance',
      },
      'q-fin.EC': {
        key: 'q-fin.EC',
        label: 'Economics',
      },
      'q-fin.GN': {
        key: 'q-fin.GN',
        label: 'General Finance',
      },
      'q-fin.MF': {
        key: 'q-fin.MF',
        label: 'Mathematical Finance',
      },
      'q-fin.PM': {
        key: 'q-fin.PM',
        label: 'Portfolio Management',
      },
      'q-fin.PR': {
        key: 'q-fin.PR',
        label: 'Pricing of Securities',
      },
      'q-fin.RM': {
        key: 'q-fin.RM',
        label: 'Risk Management',
      },
      'q-fin.ST': {
        key: 'q-fin.ST',
        label: 'Statistical Finance',
      },
      'q-fin.TR': {
        key: 'q-fin.TR',
        label: 'Trading and Market Microstructure',
      },
    },
  },
  stat: {
    key: 'stat',
    label: 'Statistics',

    children: {
      'stat.AP': {
        key: 'stat.AP',
        label: 'Applications',
      },
      'stat.CO': {
        key: 'stat.CO',
        label: 'Computation',
      },
      'stat.ML': {
        key: 'stat.ML',
        label: 'Machine Learning',
      },
      'stat.ME': {
        key: 'stat.ME',
        label: 'Methodology',
      },
      'stat.TH': {
        key: 'stat.TH',
        label: 'Theory',
      },
      'stat.OT': {
        key: 'stat.OT',
        label: 'Other Statistics',
      },
    },
  },
};
