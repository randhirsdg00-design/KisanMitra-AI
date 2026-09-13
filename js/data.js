/* =========================================================
   KisanMitra AI — Agronomy Data & Knowledge Base
   ========================================================= */

export const SAMPLES = [
  {
    id: 'sample-tomato',
    crop: 'Tomato',
    cropScientific: 'Solanum lycopersicum',
    disease: 'Early Blight',
    pathogen: 'Alternaria solani',
    severity: 'severe',
    severityLabel: 'Severe Infection',
    confidence: '96.8%',
    image: 'assets/samples/tomato_early_blight.jpg',
    description: 'Concentric target-like rings surrounded by chlorotic yellow halos on lower foliage, indicating active fungal spore germination.',
    symptoms: [
      'Circular brown spots with distinct target-like concentric rings',
      'Yellow chlorotic halos surrounding necrotic lesion areas',
      'Premature defoliation starting from lower foliage upward'
    ],
    organicTreatment: [
      'Spray Neem Oil (Cold-pressed, 10,000 ppm) @ 4-5 ml/L water every 7 days.',
      'Apply Trichoderma viride biological bio-fungicide @ 5g/L around root zones.',
      'Ensure prompt removal and deep burial of all lower infected leaves.'
    ],
    chemicalTreatment: [
      'Spray Mancozeb 75% WP @ 2.5g per litre of water at first symptom appearance.',
      'Alternatively apply Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L.',
      'Observe a 5-day pre-harvest interval (PHI) following treatment.'
    ],
    prevention: [
      'Use drip irrigation instead of overhead sprinklers to minimize leaf wetness.',
      'Maintain 60cm row spacing to promote dry canopy air circulation.',
      'Practice 3-year crop rotation avoiding Solanaceae family members (potatoes, eggplants).'
    ]
  },
  {
    id: 'sample-wheat',
    crop: 'Wheat',
    cropScientific: 'Triticum aestivum',
    disease: 'Brown Leaf Rust',
    pathogen: 'Puccinia triticina',
    severity: 'warning',
    severityLabel: 'Moderate Concern',
    confidence: '94.2%',
    image: 'assets/samples/wheat_leaf_rust.jpg',
    description: 'Scattered oval-to-elongated orange-brown uredinial pustules rupturing the leaf epidermis, impeding photosynthetic efficiency.',
    symptoms: [
      'Small, round-to-oval reddish-orange pustules scattered on upper leaf surface',
      'Chlorotic yellow blotches around pustule clusters',
      'Reduced kernel size and premature leaf senescence'
    ],
    organicTreatment: [
      'Foliar spray of 5% Fermented Cow Urine + Garlic extract every 10 days.',
      'Dust sulfur powder (micronized 80% WP) @ 2 kg/acre in calm morning air.'
    ],
    chemicalTreatment: [
      'Spray Propiconazole 25% EC (Tilt) @ 1 ml/L of water at flag-leaf emergence.',
      'Alternatively Tebuconazole 25.9% m/m EC @ 1.25 ml/L of water.'
    ],
    prevention: [
      'Plant rust-resistant certified cultivars (e.g., HD-2967, PBW-550).',
      'Avoid excessive nitrogen fertilization during high humidity periods.',
      'Sow wheat within the recommended regional window (first fortnight of November).'
    ]
  },
  {
    id: 'sample-potato',
    crop: 'Potato',
    cropScientific: 'Solanum tuberosum',
    disease: 'Late Blight',
    pathogen: 'Phytophthora infestans',
    severity: 'severe',
    severityLabel: 'High Alert',
    confidence: '98.1%',
    image: 'assets/samples/potato_late_blight.jpg',
    description: 'Irregular dark brown-to-black water-soaked lesions bordered by fine white downy fungal mildew on leaf undersides under humid conditions.',
    symptoms: [
      'Water-soaked circular lesions on leaflets rapidly turning brown-black',
      'Faint white fungal cottony growth on leaf undersides in humid mornings',
      'Rapid systemic collapse of foliar stems within 48-72 hours'
    ],
    organicTreatment: [
      'Spray Copper Oxychloride 50% WP (organic permitted) @ 3g/L water.',
      'Pseudomonas fluorescens 1% WP @ 5g/L preventive foliar application.'
    ],
    chemicalTreatment: [
      'Apply Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2.5g/L water immediately.',
      'Follow up with Cymoxanil 8% + Mancozeb 64% WP @ 3g/L after 10 days.'
    ],
    prevention: [
      'Ensure proper ridge earthing-up to prevent tuber infection from runoff wash.',
      'Destroy volunteer potato plants and cull piles before the planting season.',
      'Utilize certified disease-free seed tubers from trusted state nurseries.'
    ]
  },
  {
    id: 'sample-cotton',
    crop: 'Cotton',
    cropScientific: 'Gossypium hirsutum',
    disease: 'Healthy Crop',
    pathogen: 'None (Optimal Plant Health)',
    severity: 'completed',
    severityLabel: 'Vibrant & Healthy',
    confidence: '99.4%',
    image: 'assets/samples/healthy_cotton_leaf.jpg',
    description: 'Deep green foliage with turgid leaf veins, no visible signs of pathogen spores, lesions, or sap-sucking pest infestations.',
    symptoms: [
      'Uniform deep emerald pigmentation across all leaf lobes',
      'Well-defined, unbroken vascular vein structure with balanced leaf turgor',
      'Zero chlorosis, rust pustules, or necrotic leaf margins'
    ],
    organicTreatment: [
      'Maintain routine foliar Jeevamrut or seaweed liquid bio-stimulant @ 2 ml/L.',
      'Regular prophylactic yellow sticky traps (15 traps/acre) for whitefly monitoring.'
    ],
    chemicalTreatment: [
      'No chemical fungicide or bactericide intervention required.',
      'Continue regular soil fertility program with balanced NPK.'
    ],
    prevention: [
      'Inspect field margins twice weekly for early thrips or aphid population spikes.',
      'Maintain regular irrigation intervals during square formation and boll development.'
    ]
  }
];

export const INITIAL_ACTIVITY = [
  {
    id: 'act-1',
    title: 'Tomato leaf analysis',
    crop: 'Tomato',
    disease: 'Early Blight',
    timeAgo: '2 hours ago',
    status: 'severe',
    statusText: 'Analysis completed',
    confidence: '96.8%',
    sampleId: 'sample-tomato'
  },
  {
    id: 'act-2',
    title: 'Wheat crop analysis',
    crop: 'Wheat',
    disease: 'Leaf Rust',
    timeAgo: 'Yesterday',
    status: 'warning',
    statusText: 'Analysis completed',
    confidence: '94.2%',
    sampleId: 'sample-wheat'
  },
  {
    id: 'act-3',
    title: 'Potato leaf diagnosis',
    crop: 'Potato',
    disease: 'Late Blight',
    timeAgo: '3 days ago',
    status: 'severe',
    statusText: 'Analysis completed',
    confidence: '98.1%',
    sampleId: 'sample-potato'
  },
  {
    id: 'act-4',
    title: 'Cotton crop health check',
    crop: 'Cotton',
    disease: 'Healthy Crop',
    timeAgo: '5 days ago',
    status: 'completed',
    statusText: 'Analysis completed',
    confidence: '99.4%',
    sampleId: 'sample-cotton'
  }
];

export const INITIAL_PLOTS = [
  {
    id: 'plot-1',
    name: 'North Field A',
    crop: 'Wheat',
    variety: 'Sonalika',
    area: 5.0,
    unit: 'Acres',
    season: 'Rabi',
    sownDate: '2025-11-12',
    sownDateDisplay: '12 Nov 2025',
    stage: 'Tillering Stage',
    status: 'Growing',
    progress: 45,
    health: 'Healthy (Optimal)',
    moisture: '68% (Optimal)',
    soil: 'Alluvial Loam (pH 7.1)',
    notes: '2nd Irrigation & Urea Top-Dressing scheduled in 3 days',
    nextAction: '2nd Irrigation & Urea Top-Dressing in 3 days'
  },
  {
    id: 'plot-2',
    name: 'East Field B',
    crop: 'Tomato',
    variety: 'Abhinav Hybrid',
    area: 3.5,
    unit: 'Acres',
    season: 'Rabi',
    sownDate: '2025-12-02',
    sownDateDisplay: '02 Dec 2025',
    stage: 'Early Flowering',
    status: 'Flowering',
    progress: 32,
    health: 'Alert (Early Blight Spotted)',
    moisture: '54% (Moderate)',
    soil: 'Sandy Loam (pH 6.8)',
    notes: 'Foliar Neem/Mancozeb spray scheduled tomorrow',
    nextAction: 'Foliar Neem/Mancozeb Spray Scheduled Tomorrow'
  },
  {
    id: 'plot-3',
    name: 'South Field C',
    crop: 'Paddy',
    variety: 'Pusa Basmati 1121',
    area: 4.0,
    unit: 'Acres',
    season: 'Kharif',
    sownDate: '2025-10-15',
    sownDateDisplay: '15 Oct 2025',
    stage: 'Grain Hardening',
    status: 'Maturing',
    progress: 90,
    health: 'Healthy (Normal)',
    moisture: '42% (Field Drying)',
    soil: 'Clay Loam (pH 7.4)',
    notes: 'Harvesting scheduled in 12 days',
    nextAction: 'Harvesting scheduled in 12 days'
  }
];

export const SCHEMES = [
  {
    id: 'scheme-pmkisan',
    title: 'PM-KISAN Samman Nidhi',
    category: 'Income Support',
    categoryLabel: 'Direct Support',
    scope: 'Central Government',
    benefit: '₹6,000 per year in 3 equal installments of ₹2,000 directly via DBT.',
    objective: 'Provides supplementary financial income support to landholding farmer families across India for buying seeds, fertilizers, and farm inputs.',
    eligibilitySummary: 'Small and marginal landholding farmers with Aadhaar-linked land records and completed e-KYC.',
    eligibility: [
      'All landholding small and marginal farmer families possessing cultivable land.',
      'Land records must be linked with active Aadhaar numbers.',
      'e-KYC verified via PM-KISAN portal or biometric CSC center.'
    ],
    documents: ['Aadhaar Card', 'Land Ownership Records (Khatauni/7/12)', 'Bank Passbook linked with Aadhaar'],
    applicationProcess: 'Register online at pmkisan.gov.in under Farmers Corner or visit the nearest Common Service Centre (CSC) with land and bank passbook details.',
    lastUpdated: 'Current Active (FY 2024-25)',
    officialUrl: 'https://pmkisan.gov.in'
  },
  {
    id: 'scheme-pmfby',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'Insurance',
    categoryLabel: 'Crop Insurance',
    scope: 'Central & State Partnership',
    benefit: 'Comprehensive crop insurance coverage with ultra-low farmer premium (1.5% for Rabi, 2% for Kharif, 5% for commercial/horticulture).',
    objective: 'Financial safety net against unforeseen non-preventable natural calamities, pests, hailstorms, unseasonal rains, and crop failure.',
    eligibilitySummary: 'All loanee and non-loanee farmers growing notified crops in declared insurance blocks.',
    eligibility: [
      'All farmers cultivating notified crops in notified insurance units.',
      'Both loanee farmers (via KCC) and non-loanee farmers eligible.',
      'Crop loss must be reported within 72 hours via PMFBY app or helpline.'
    ],
    documents: ['Land Record Certificate', 'Sowing Declaration Certificate', 'Aadhaar Card', 'Bank Account Details'],
    applicationProcess: 'Automatic enrollment through loanee bank branches, or self-enrollment on pmfby.gov.in or designated insurance representative before cutoff dates.',
    lastUpdated: 'Current Active (FY 2024-25)',
    officialUrl: 'https://pmfby.gov.in'
  },
  {
    id: 'scheme-soilhealth',
    title: 'Soil Health Card Scheme',
    category: 'Soil & Water',
    categoryLabel: 'Soil Health',
    scope: 'Central Government',
    benefit: 'Comprehensive 12-parameter soil fertility analysis issued free of cost every 2 years with custom fertilizer dosage guidelines.',
    objective: 'Empowers farmers to reduce excess fertilizer expenses and boost productivity through scientifically balanced NPK + micronutrient application.',
    eligibilitySummary: 'All agricultural landowners in all districts across India.',
    eligibility: [
      'Available to all farming landholders across all districts in India.',
      'Soil samples collected by local agriculture extension officers from farmer fields.'
    ],
    documents: ['Farmer Aadhaar Card', 'Field Survey / Khasra Number'],
    applicationProcess: 'Contact local Gram Panchayat Agriculture Officer, Krishi Vigyan Kendra (KVK), or track testing progress on the national soil health portal.',
    lastUpdated: 'Current Active (FY 2024-25)',
    officialUrl: 'https://soilhealth.dac.gov.in'
  },
  {
    id: 'scheme-pmksy',
    title: 'PM Krishi Sinchayee Yojana (Per Drop More Crop)',
    category: 'Irrigation',
    categoryLabel: 'Micro-Irrigation',
    scope: 'Central & State Partnership',
    benefit: 'Up to 55% capital subsidy for small/marginal farmers (45% for others) on drip and micro-sprinkler irrigation systems.',
    objective: 'Promoting precision water conservation, maximizing crop yields per drop, and boosting fertilizer absorption efficiency through fertigation.',
    eligibilitySummary: 'Farmers with verified agricultural land and assured irrigation water source.',
    eligibility: [
      'Farmers with guaranteed agricultural land ownership and assured irrigation water source (well/borewell/pond).',
      'Priority given to water-stressed and rainfed blocks.'
    ],
    documents: ['Electricity bill / water source proof', 'Land possession certificate', 'Aadhaar & Bank details'],
    applicationProcess: 'Apply online through state agriculture/horticulture department portal or submit proposal through the District Horticulture Officer.',
    lastUpdated: 'Current Active (FY 2024-25)',
    officialUrl: 'https://pmksy.gov.in'
  },
  {
    id: 'scheme-kcc',
    title: 'Kisan Credit Card (KCC) Scheme',
    category: 'Income Support',
    categoryLabel: 'Credit & Finance',
    scope: 'Central Government',
    benefit: 'Hassle-free crop loans up to ₹3,00,000 at an effective subsidized interest rate of only 4% (with 3% prompt repayment incentive).',
    objective: 'Ensures timely credit access for seasonal cultivation requirements, seeds, crop protection chemicals, and post-harvest maintenance.',
    eligibilitySummary: 'Individual farmers, tenant cultivators, sharecroppers, and SHG/JLG farmer groups.',
    eligibility: [
      'Individual agricultural landowners, tenant farmers, oral lessees, and sharecroppers.',
      'Self Help Groups (SHGs) and Joint Liability Groups (JLGs) of farmers.'
    ],
    documents: ['Land record proof', 'Aadhaar Card', 'Passport photo', 'No-dues certificate from nearby banks'],
    applicationProcess: 'Submit the simplified 1-page KCC application form at your local commercial bank, Regional Rural Bank (RRB), or cooperative society.',
    lastUpdated: 'Current Active (FY 2024-25)',
    officialUrl: 'https://www.myscheme.gov.in/schemes/kcc'
  },
  {
    id: 'scheme-smam',
    title: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    category: 'Equipment',
    categoryLabel: 'Machinery Subsidy',
    scope: 'Central & State Partnership',
    benefit: '40% to 50% subsidy on modern farm machinery including laser levelers, rotavators, power tillers, and tractor attachments.',
    objective: 'Reduces manual drudgery, solves seasonal labor shortages, and modernizes smallholder farm operations.',
    eligibilitySummary: 'Small, marginal, and progressive farmers, custom hiring centers, and FPOs.',
    eligibility: [
      'Small, marginal, and progressive farmers.',
      'Custom Hiring Centers (CHCs) and Farmer Producer Organizations (FPOs).'
    ],
    documents: ['Aadhaar Card', 'Tractor Registration Certificate (for tractor-driven equipment)', 'Bank passbook'],
    applicationProcess: 'Register on the Direct Benefit Transfer in Agricultural Mechanization portal (agrimachinery.nic.in) with Aadhaar and bank details.',
    lastUpdated: 'Current Active (FY 2024-25)',
    officialUrl: 'https://agrimachinery.nic.in'
  }
];

export const MITRA_KNOWLEDGE_BASE = [
  {
    keywords: ['tomato', 'early blight', 'blight', 'yellow leaves', 'black spots', 'टमाटर'],
    response: `🌿 **Tomato Early Blight Management (Alternaria solani):**
• **Symptoms:** Concentric target-like rings with yellow chlorotic borders on lower leaves.
• **Immediate Organic Remedy:** Spray cold-pressed Neem Oil (10,000 ppm) @ 4-5 ml per litre of water mixed with 1ml liquid soap. Prune all lower leaves touching soil.
• **Chemical Treatment:** Spray **Mancozeb 75% WP** @ 2.5g/L or **Azoxystrobin 18.2% + Difenoconazole 11.4% SC** @ 1 ml/L.
• **Watering Advice:** Switch to drip irrigation. Keep foliage dry to stop fungal spores from spreading.`
  },
  {
    keywords: ['wheat', 'rust', 'yellow rust', 'brown rust', 'गेहूं', 'रतुआ'],
    response: `🌾 **Wheat Rust Diagnostic & Spray Schedule:**
• **Symptoms:** Elongated orange-brown pustules on wheat leaves powdery to the touch.
• **Treatment:** Immediately apply **Propiconazole 25% EC (Tilt)** @ 1 ml per litre of water (200 ml in 200L water per acre) using a knapsack sprayer.
• **Repeat:** If high humidity and temperatures between 15-22°C persist, repeat spray after 12-15 days.
• **Agronomy Tip:** Stop excessive urea top-dressing during active rust outbreaks.`
  },
  {
    keywords: ['fertilizer', 'urea', 'dose', 'nitrogen', 'npk', 'खाद', 'यूरिया'],
    response: `🧪 **Scientific Fertilizer Application Guidelines:**
• **Wheat (at 40-45 days):** Top-dress second split of Urea @ 45-50 kg/acre immediately before or after the 2nd irrigation (Late Tillering stage).
• **Tomato:** Apply N:P:K 19:19:19 @ 3-5 g/L through drip fertigation every 10 days during vegetative growth. At flowering, switch to 0:52:34 (Monopotassium phosphate) @ 4 g/L.
• **Tip:** Always perform a Soil Health Card test before adding phosphorus and potassium.`
  },
  {
    keywords: ['pm kisan', 'installment', 'scheme', 'pm-kisan', 'पैसे', 'सम्मान निधि'],
    response: `💰 **PM-KISAN Samman Nidhi Assistance:**
• Beneficiary farmers receive ₹6,000 annually in 3 equal installments of ₹2,000 directly via Aadhaar-linked DBT.
• **Check Your Status:** Visit the official portal [pmkisan.gov.in](https://pmkisan.gov.in) -> Click **'Know Your Status'** -> Enter Registration Number.
• **Mandatory Requirements:** Ensure (1) e-KYC is completed, (2) Bank account is Aadhaar-seeded, and (3) Land details are marked green.`
  },
  {
    keywords: ['mandi', 'price', 'rates', 'market', 'bhav', 'मंडी', 'भाव'],
    response: `📈 **Today's Estimated Mandi Price Ranges (Punjab & Haryana Region):**
• **Wheat (Sharbati/Mill Quality):** ₹2,450 – ₹2,620 per Quintal (MSP: ₹2,425)
• **Basmati Paddy (Pusa 1121):** ₹3,850 – ₹4,200 per Quintal
• **Mustard Seed (42% Oil):** ₹5,150 – ₹5,400 per Quintal
• **Tomato (Hybrid):** ₹1,400 – ₹1,800 per Quintal (Wholesale crates ₹350-450/25kg)
*Prices fluctuate daily based on moisture content and local arrivals.*`
  },
  {
    keywords: ['weather', 'rain', 'temperature', 'मौसम', 'बारिश'],
    response: `🌤️ **Current Weather & Agronomic Advisory (Ludhiana Region):**
• **Current Condition:** 28°C, Partly Cloudy, Relative Humidity: 62%
• **Wind:** 8 km/h NW (Calm)
• **Rainfall Outlook:** Zero rain forecast for the next 48-72 hours.
• **Field Recommendation:** Favorable window for foliar pesticide and nutrient spraying. Ensure early morning or late afternoon application to prevent rapid evaporation.`
  }
];

export const TRANSLATIONS = {
  en: {
    brandSubtitle: 'AI',
    navHome: 'Home',
    navFarm: 'My Farm',
    navHistory: 'History',
    navSchemes: 'Schemes',
    greetingPrefix: 'Good afternoon, Farmer',
    greetingSubtitle: 'Your intelligent agriculture assistant',
    scanHeroTitle: 'Check your crop',
    scanHeroDesc: 'Upload a crop photo and get an AI-powered analysis with immediate biological and chemical treatment solutions.',
    btnScanCrop: 'Scan Crop',
    quickActionsTitle: 'Quick Actions',
    actionMitraTitle: 'AI Mitra',
    actionMitraDesc: 'Ask a question about farming',
    actionFarmTitle: 'My Farm',
    actionFarmDesc: 'Manage your farm',
    actionHistoryTitle: 'History',
    actionHistoryDesc: 'View previous scans',
    actionSchemesTitle: 'Government Schemes',
    actionSchemesDesc: 'Explore farmer subsidies',
    recentActivityTitle: 'Recent Activity',
    viewAll: 'View all',
    needHelpTitle: 'Need help?',
    needHelpDesc: 'Get instant answers about crops, weather, fertilizer doses, or government schemes from AI Mitra.',
    btnAskMitra: 'Ask AI Mitra',
    langToggleText: 'हिन्दी'
  },
  hi: {
    brandSubtitle: 'एआई',
    navHome: 'होम',
    navFarm: 'मेरा खेत',
    navHistory: 'इतिहास',
    navSchemes: 'सरकारी योजनाएं',
    greetingPrefix: 'नमस्ते, किसान भाई',
    greetingSubtitle: 'आपका बुद्धिमान कृषि सहायक',
    scanHeroTitle: 'अपनी फसल की जांच करें',
    scanHeroDesc: 'फसल की पत्ती का फोटो अपलोड करें और तुरंत एआई जांच रिपोर्ट पाएं।',
    btnScanCrop: 'फसल स्कैन करें',
    quickActionsTitle: 'त्वरित सेवाएं',
    actionMitraTitle: 'एआई मित्र',
    actionMitraDesc: 'खेती-बाड़ी का कोई भी सवाल पूछें',
    actionFarmTitle: 'मेरा खेत',
    actionFarmDesc: 'अपने खेतों और फसलों का प्रबंधन करें',
    actionHistoryTitle: 'इतिहास',
    actionHistoryDesc: 'पिछली स्कैन रिपोर्ट देखें',
    actionSchemesTitle: 'सरकारी योजनाएं',
    actionSchemesDesc: 'किसान सब्सिडी और योजनाओं की जांच करें',
    recentActivityTitle: 'हाल की गतिविधियां',
    viewAll: 'सभी देखें',
    needHelpTitle: 'मदद चाहिए?',
    needHelpDesc: 'फसल रोग, खाद की मात्रा, मौसम या सरकारी योजनाओं के बारे में तुरंत उत्तर पाएं।',
    btnAskMitra: 'एआई मित्र से पूछें',
    langToggleText: 'English'
  }
};
