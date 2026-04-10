// ─── Condition Keyword Matching ───────────────────────────────
// Maps clinical template split/subgroup pairs to keywords that are
// searched in a client's chronic_conditions, current_injuries,
// medications, goals, and notes fields to power the Suggested tab.

export type ConditionMatch = {
  split: string;
  subgroup: string;
  keywords: string[];
};

export const CONDITION_KEYWORDS: ConditionMatch[] = [
  // ── Metabolic & Chronic Disease ───────────────────────────
  {
    split: 'Metabolic & Chronic Disease',
    subgroup: 'Diabetes & Obesity',
    keywords: [
      'diabetes', 'diabetic', 'type 2', 'type2', 't2d', 'type 1', 'insulin',
      'hyperglycemia', 'blood sugar', 'glucose', 'obesity', 'obese',
      'overweight', 'metabolic syndrome', 'prediabetes', 'pre-diabetes',
      'hba1c', 'a1c', 'gestational diabetes',
    ],
  },
  {
    split: 'Metabolic & Chronic Disease',
    subgroup: 'Hypertension & High Cholesterol',
    keywords: [
      'hypertension', 'high blood pressure', 'hbp', 'hypertensive',
      'high cholesterol', 'cholesterol', 'hypercholesterolemia',
      'hyperlipidemia', 'dyslipidemia', 'triglycerides', 'ldl',
      'cardiovascular disease', 'statin', 'lisinopril', 'amlodipine',
      'beta blocker', 'ace inhibitor', 'antihypertensive',
    ],
  },
  {
    split: 'Metabolic & Chronic Disease',
    subgroup: 'Cardiac Rehabilitation',
    keywords: [
      'heart attack', 'myocardial infarction', 'mi', 'stemi', 'nstemi',
      'cardiac', 'heart disease', 'coronary', 'bypass', 'cabg',
      'stent', 'angioplasty', 'angina', 'arrhythmia', 'atrial fibrillation',
      'afib', 'heart failure', 'chf', 'cardiomyopathy', 'pacemaker',
      'valve replacement', 'cardiac rehab', 'post-cardiac',
    ],
  },
  {
    split: 'Metabolic & Chronic Disease',
    subgroup: 'COPD & Respiratory',
    keywords: [
      'copd', 'chronic obstructive pulmonary', 'emphysema', 'chronic bronchitis',
      'asthma', 'shortness of breath', 'dyspnea', 'respiratory', 'lung disease',
      'pulmonary', 'inhaler', 'nebulizer', 'bronchodilator', 'spirometry',
      'low oxygen', 'oxygen supplementation', 'fev1',
    ],
  },

  // ── Musculoskeletal & Orthopedic ──────────────────────────
  {
    split: 'Musculoskeletal & Orthopedic',
    subgroup: 'Sciatica & Lower Back Pain',
    keywords: [
      'sciatica', 'sciatic', 'lower back pain', 'low back pain', 'lumbar',
      'disc herniation', 'herniated disc', 'slipped disc', 'disc bulge',
      'back pain', 'spondylolisthesis', 'spondylosis', 'radiculopathy',
      'nerve pain', 'piriformis', 'sacroiliac', 'si joint', 'l4', 'l5', 's1',
      'degenerative disc', 'lumbago',
    ],
  },
  {
    split: 'Musculoskeletal & Orthopedic',
    subgroup: 'Arthritis & Joint Replacements',
    keywords: [
      'arthritis', 'osteoarthritis', 'rheumatoid arthritis', 'ra',
      'joint replacement', 'knee replacement', 'hip replacement', 'tkr', 'thr',
      'joint pain', 'joint inflammation', 'psoriatic arthritis', 'gout',
      'ankylosing spondylitis', 'joint degeneration', 'arthroplasty',
    ],
  },
  {
    split: 'Musculoskeletal & Orthopedic',
    subgroup: 'Osteoporosis',
    keywords: [
      'osteoporosis', 'osteopenia', 'low bone density', 'bone density',
      'dexa scan', 'fracture risk', 'calcium deficiency', 'vitamin d deficiency',
      'fragility fracture', 'compression fracture',
    ],
  },
  {
    split: 'Musculoskeletal & Orthopedic',
    subgroup: 'Shoulder Impingement & Rotator Cuff',
    keywords: [
      'shoulder impingement', 'rotator cuff', 'supraspinatus', 'shoulder pain',
      'shoulder injury', 'shoulder surgery', 'bursitis', 'tendinitis',
      'tendinopathy', 'slap tear', 'labral tear', 'ac joint', 'shoulder instability',
      'frozen shoulder', 'adhesive capsulitis', 'shoulder strain',
    ],
  },
  {
    split: 'Musculoskeletal & Orthopedic',
    subgroup: 'Knee Rehabilitation',
    keywords: [
      'acl', 'anterior cruciate ligament', 'acl tear', 'acl reconstruction',
      'meniscus', 'meniscal tear', 'knee injury', 'knee surgery', 'knee pain',
      'patellofemoral', 'patellar tendinopathy', 'knee replacement',
      'pcl', 'posterior cruciate', 'knee ligament', 'it band', 'chondromalacia',
    ],
  },

  // ── Postural Deviations ───────────────────────────────────
  {
    split: 'Postural Deviations',
    subgroup: 'Upper Crossed Syndrome',
    keywords: [
      'upper crossed syndrome', 'rounded shoulders', 'forward head posture',
      'kyphosis', 'hunched back', 'neck pain', 'cervical', 'thoracic kyphosis',
      'shoulder rounding', 'tight chest', 'weak upper back', 'desk posture',
      'forward head', 'head forward posture',
    ],
  },
  {
    split: 'Postural Deviations',
    subgroup: 'Lower Crossed Syndrome & Scoliosis',
    keywords: [
      'lower crossed syndrome', 'anterior pelvic tilt', 'scoliosis',
      'lumbar lordosis', 'swayback', 'hyperlordosis', 'flat back',
      'posterior pelvic tilt', 'pelvis tilt', 'tight hip flexors',
      'weak glutes', 'curved spine', 'spinal curvature',
    ],
  },

  // ── Special Populations ───────────────────────────────────
  {
    split: 'Special Populations',
    subgroup: 'Elderly (Seniors)',
    keywords: [
      'elderly', 'senior', 'older adult', 'age 65', 'age 70', 'age 75',
      'age 80', 'sarcopenia', 'muscle loss', 'fall prevention', 'balance issues',
      'frailty', 'functional decline', 'aging', 'retirement age',
    ],
  },
  {
    split: 'Special Populations',
    subgroup: 'Prenatal & Postpartum',
    keywords: [
      'pregnant', 'pregnancy', 'prenatal', 'postpartum', 'postnatal',
      'diastasis recti', 'pelvic floor', 'after birth', 'c-section',
      'caesarean', 'expecting', 'trimester', 'new mother', 'breastfeeding',
      'postpartum recovery',
    ],
  },
  {
    split: 'Special Populations',
    subgroup: 'Cancer Survivors',
    keywords: [
      'cancer', 'oncology', 'chemotherapy', 'chemo', 'radiation', 'radiotherapy',
      'cancer survivor', 'lymphoma', 'leukemia', 'breast cancer', 'prostate cancer',
      'colorectal cancer', 'lung cancer', 'lymphedema', 'cancer treatment',
      'immunotherapy', 'remission', 'in remission',
    ],
  },
  {
    split: 'Special Populations',
    subgroup: 'Hypermobility & EDS',
    keywords: [
      'hypermobility', 'hypermobile', 'ehlers-danlos', 'eds', 'heds',
      'joint hypermobility', 'hsd', 'hypermobility spectrum disorder',
      'loose joints', 'benign joint hypermobility', 'marfan',
      'connective tissue disorder', 'joint instability',
    ],
  },

  // ── Neurological & Mental Health ──────────────────────────
  {
    split: 'Neurological & Mental Health',
    subgroup: 'MS / Parkinson\'s / Fibromyalgia',
    keywords: [
      'multiple sclerosis', 'ms', 'parkinson', "parkinson's", 'fibromyalgia',
      'chronic pain', 'neuropathy', 'peripheral neuropathy', 'tremor',
      'balance disorder', 'fatigue syndrome', 'chronic fatigue', 'dysautonomia',
      'lupus', 'autoimmune', 'inflammatory condition',
    ],
  },
  {
    split: 'Neurological & Mental Health',
    subgroup: 'Anxiety & Depression',
    keywords: [
      'anxiety', 'depression', 'anxious', 'depressed', 'panic disorder',
      'panic attacks', 'ptsd', 'post-traumatic', 'ocd', 'bipolar',
      'mental health', 'stress', 'antidepressant', 'ssri', 'snri',
      'antianxiety', 'mood disorder', 'burnout', 'generalized anxiety',
    ],
  },
  {
    split: 'Neurological & Mental Health',
    subgroup: 'Chronic Fatigue & Post-COVID',
    keywords: [
      'chronic fatigue', 'me/cfs', 'cfs', 'myalgic encephalomyelitis',
      'post-covid', 'long covid', 'long hauler', 'post-viral',
      'fatigue', 'exhaustion', 'pem', 'post-exertional',
      'brain fog', 'low energy', 'covid recovery',
    ],
  },
];

// ─── Matching function ────────────────────────────────────────

export function getSuggestedSplits(intakeText: string): Set<string> {
  const lower = intakeText.toLowerCase();
  const matched = new Set<string>();
  for (const cond of CONDITION_KEYWORDS) {
    if (cond.keywords.some((kw) => lower.includes(kw))) {
      matched.add(`${cond.split}|||${cond.subgroup}`);
    }
  }
  return matched;
}
