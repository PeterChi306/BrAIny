export interface Subject {
  id: string
  name: string
  description: string
  category: string
  keywords: string[]
  aiContext: string
}

export const SUBJECTS: Subject[] = [
  // Mathematics
  {
    id: 'algebra',
    name: 'Algebra',
    description: 'Linear equations, polynomials, factoring, and functions',
    category: 'Mathematics',
    keywords: ['equations', 'variables', 'polynomials', 'functions', 'graphing'],
    aiContext: 'Algebraic expressions, linear equations, quadratic equations, polynomials, factoring, functions, graphing, systems of equations'
  },
  {
    id: 'calculus',
    name: 'Calculus',
    description: 'Derivatives, integrals, limits, and applications',
    category: 'Mathematics',
    keywords: ['derivatives', 'integrals', 'limits', 'continuity', 'optimization'],
    aiContext: 'Differential calculus, integral calculus, limits, derivatives, integrals, chain rule, optimization, related rates, area under curves'
  },
  {
    id: 'geometry',
    name: 'Geometry',
    description: 'Shapes, angles, proofs, and spatial reasoning',
    category: 'Mathematics',
    keywords: ['shapes', 'angles', 'proofs', 'triangles', 'circles'],
    aiContext: 'Euclidean geometry, triangles, circles, polygons, angles, proofs, coordinate geometry, transformations, area, volume'
  },
  {
    id: 'statistics',
    name: 'Statistics',
    description: 'Data analysis, probability, and statistical inference',
    category: 'Mathematics',
    keywords: ['probability', 'data', 'graphs', 'mean', 'median'],
    aiContext: 'Descriptive statistics, probability theory, hypothesis testing, regression, correlation, data visualization, statistical inference'
  },
  {
    id: 'trigonometry',
    name: 'Trigonometry',
    description: 'Triangles, trigonometric functions, and identities',
    category: 'Mathematics',
    keywords: ['sine', 'cosine', 'tangent', 'triangles', 'angles'],
    aiContext: 'Trigonometric functions, identities, triangles, unit circle, radians, degrees, law of sines, law of cosines'
  },

  // Science
  {
    id: 'biology',
    name: 'Biology',
    description: 'Living organisms, cells, genetics, and ecosystems',
    category: 'Science',
    keywords: ['cells', 'genetics', 'evolution', 'ecosystems', 'anatomy'],
    aiContext: 'Cell biology, genetics, evolution, ecology, anatomy, physiology, microbiology, botany, zoology, molecular biology'
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    description: 'Elements, compounds, reactions, and molecular structures',
    category: 'Science',
    keywords: ['elements', 'compounds', 'reactions', 'atoms', 'molecules'],
    aiContext: 'Atomic structure, chemical bonding, reactions, stoichiometry, periodic table, acids, bases, organic chemistry, biochemistry'
  },
  {
    id: 'physics',
    name: 'Physics',
    description: 'Forces, energy, motion, and natural laws',
    category: 'Science',
    keywords: ['forces', 'energy', 'motion', 'waves', 'electricity'],
    aiContext: 'Mechanics, thermodynamics, electromagnetism, waves, optics, quantum physics, relativity, energy, momentum'
  },
  {
    id: 'environmental-science',
    name: 'Environmental Science',
    description: 'Ecology, climate, and environmental systems',
    category: 'Science',
    keywords: ['climate', 'ecology', 'pollution', 'conservation', 'sustainability'],
    aiContext: 'Ecology, climate change, environmental systems, conservation, pollution, sustainability, biodiversity, ecosystems'
  },

  // Computer Science
  {
    id: 'programming',
    name: 'Programming',
    description: 'Coding, algorithms, and software development',
    category: 'Computer Science',
    keywords: ['coding', 'algorithms', 'software', 'development', 'debugging'],
    aiContext: 'Programming fundamentals, algorithms, data structures, software development, debugging, code optimization, version control'
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'HTML, CSS, JavaScript, and web technologies',
    category: 'Computer Science',
    keywords: ['html', 'css', 'javascript', 'web', 'frontend'],
    aiContext: 'HTML, CSS, JavaScript, React, web development, frontend, backend, databases, APIs, web design'
  },
  {
    id: 'data-science',
    name: 'Data Science',
    description: 'Machine learning, data analysis, and big data',
    category: 'Computer Science',
    keywords: ['machine learning', 'data', 'analytics', 'python', 'algorithms'],
    aiContext: 'Machine learning, data analysis, big data, Python, data visualization, statistical modeling, predictive analytics'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Network security, encryption, and digital protection',
    category: 'Computer Science',
    keywords: ['security', 'encryption', 'networks', 'hacking', 'protection'],
    aiContext: 'Network security, cryptography, ethical hacking, digital protection, malware analysis, security protocols'
  },

  // Languages
  {
    id: 'english',
    name: 'English',
    description: 'Grammar, literature, writing, and comprehension',
    category: 'Languages',
    keywords: ['grammar', 'writing', 'literature', 'essays', 'comprehension'],
    aiContext: 'English grammar, literature analysis, essay writing, reading comprehension, vocabulary, literary devices, creative writing'
  },
  {
    id: 'spanish',
    name: 'Spanish',
    description: 'Spanish language, grammar, and Hispanic culture',
    category: 'Languages',
    keywords: ['español', 'grammar', 'culture', 'conversation', 'vocabulary'],
    aiContext: 'Spanish grammar, vocabulary, conversation, Hispanic culture, verb conjugations, reading, writing, pronunciation'
  },
  {
    id: 'french',
    name: 'French',
    description: 'French language, grammar, and French culture',
    category: 'Languages',
    keywords: ['français', 'grammar', 'culture', 'conversation', 'vocabulary'],
    aiContext: 'French grammar, vocabulary, conversation, French culture, verb conjugations, reading, writing, pronunciation'
  },

  // History & Social Studies
  {
    id: 'world-history',
    name: 'World History',
    description: 'Global events, civilizations, and historical periods',
    category: 'History',
    keywords: ['civilizations', 'wars', 'ancient', 'modern', 'global'],
    aiContext: 'World civilizations, historical events, ancient history, modern history, wars, revolutions, cultural movements'
  },
  {
    id: 'us-history',
    name: 'US History',
    description: 'American history from colonization to present',
    category: 'History',
    keywords: ['america', 'colonization', 'revolution', 'civil war', 'modern'],
    aiContext: 'American history, colonization, revolution, Civil War, industrialization, modern America, political movements'
  },
  {
    id: 'geography',
    name: 'Geography',
    description: 'Countries, capitals, maps, and physical geography',
    category: 'History',
    keywords: ['countries', 'maps', 'capitals', 'climate', 'regions'],
    aiContext: 'Physical geography, political geography, countries, capitals, climate, maps, cultural regions, economic geography'
  },

  // Arts & Music
  {
    id: 'art',
    name: 'Art',
    description: 'Drawing, painting, art history, and visual design',
    category: 'Arts',
    keywords: ['drawing', 'painting', 'design', 'history', 'creativity'],
    aiContext: 'Visual arts, drawing, painting, art history, design principles, creativity techniques, famous artists, art movements'
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Music theory, instruments, and music history',
    category: 'Arts',
    keywords: ['theory', 'instruments', 'composition', 'history', 'performance'],
    aiContext: 'Music theory, instruments, composition, music history, performance, rhythm, harmony, melody, musical analysis'
  },

  // Business & Economics
  {
    id: 'economics',
    name: 'Economics',
    description: 'Supply and demand, markets, and economic systems',
    category: 'Business',
    keywords: ['supply', 'demand', 'markets', 'economy', 'finance'],
    aiContext: 'Microeconomics, macroeconomics, supply and demand, market systems, economic theory, finance, business cycles'
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Management, marketing, entrepreneurship, and finance',
    category: 'Business',
    keywords: ['management', 'marketing', 'entrepreneurship', 'finance', 'strategy'],
    aiContext: 'Business management, marketing strategies, entrepreneurship, financial planning, organizational behavior, business ethics'
  }
]

export const getSubjectById = (id: string): Subject | undefined => {
  return SUBJECTS.find(subject => subject.id === id)
}

export const getSubjectsByCategory = (category: string): Subject[] => {
  return SUBJECTS.filter(subject => subject.category === category)
}

export const searchSubjects = (query: string): Subject[] => {
  const lowercaseQuery = query.toLowerCase()
  return SUBJECTS.filter(subject => 
    subject.name.toLowerCase().includes(lowercaseQuery) ||
    subject.description.toLowerCase().includes(lowercaseQuery) ||
    subject.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
  )
}

export const getSubjectCategories = (): string[] => {
  return Array.from(new Set(SUBJECTS.map(subject => subject.category)))
}
