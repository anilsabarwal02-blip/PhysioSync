import { useState } from 'react';
import { Sparkles, FileSignature, CheckCircle, Clock, AlertTriangle, CheckSquare, Printer, Sliders, Trash2, Plus, X } from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

const CLINICAL_PROTOCOLS = {
  knee: {
    summary: "8-Week Post-Op ACL Reconstruction & Knee Rehab Protocol",
    phases: [
      {
        phase: 'Weeks 1-2',
        title: 'Phase I: Edema Control & Quad Activation',
        goals: ['Full extension (0°)', 'Flexion to 90°', 'Quad activation (no lag on SLR)', 'Pain VAS score < 3/10'],
        exercises: [
          { name: 'Isometric Quad Sets', parameters: '3 sets x 10 reps (5s hold), 3x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Facilitates voluntary firing of the vastus medialis obliquus (VMO) without joint excursion, reducing reflex inhibition.' },
          { name: 'Straight Leg Raises (SLR)', parameters: '3 sets x 10 reps (brace at 0°), 2x daily', rpe: '4-5 (Moderate)', load: 'Low-Moderate', rationale: 'Strengthens hip flexors and proximal stabilizer muscles while keeping the knee locked in extension to prevent graft strain.' },
          { name: 'Patellar Mobilization', parameters: 'Superior/Inferior glides, 5 mins, daily', rpe: '2-3 (Very Light)', load: 'None', rationale: 'Restores glide in the suprapatellar pouch and prevents early tissue adhesions/arthrofibrosis.' },
          { name: 'Heel Slides (Active-Assisted)', parameters: '3 sets x 15 reps, daily', rpe: '4-5 (Moderate)', load: 'Low', rationale: 'Promotes controlled active-assisted ROM, utilizing hamstring activation to reciprocally inhibit quad guarding.' }
        ],
        restrictions: 'Brace locked in extension during walking. Avoid active extension 40° to 0°.'
      },
      {
        phase: 'Weeks 3-4',
        title: 'Phase II: Range of Motion & Gait Normalization',
        goals: ['Flexion to 120°', 'Normal symmetrical gait (no limp)', 'Single-leg stance balance for 15s'],
        exercises: [
          { name: 'Wall Slides', parameters: '3 sets x 12 reps, controlled tempo, 2x daily', rpe: '4-5 (Moderate)', load: 'Moderate', rationale: 'Uses wall friction support to guide safe closed-chain knee flexion under partial bodyweight.' },
          { name: 'Stationary Cycling (No Resistance)', parameters: '10-15 minutes, low seat, daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Encourages continuous joint lubrication, cyclic collagen modeling, and cardiovascular conditioning.' },
          { name: 'Mini Squats (0°-45°)', parameters: '3 sets x 10 reps, bodyweight only', rpe: '5-6 (Medium)', load: 'Moderate', rationale: 'Initiates early functional weight-bearing knee flexion, activating quads, glutes, and gastrocnemius in synergy.' },
          { name: 'Single-Leg Balance', parameters: '3 sets x 20 seconds, flat ground', rpe: '4-5 (Moderate)', load: 'Low-Moderate', rationale: 'Re-educates mechanoreceptors in the ankle and knee, improving static single-limb stance stability.' }
        ],
        restrictions: 'Limit weight-bearing flexion to 90°. Avoid pivoting, twisting, or lateral loading.'
      },
      {
        phase: 'Weeks 5-8',
        title: 'Phase III: Closed-Chain Strength & Proprioception',
        goals: ['Full active ROM', 'Single-leg balance on foam pad for 30s', 'Symmetrical squat depth to 90°'],
        exercises: [
          { name: 'Closed-Chain Leg Press', parameters: '3 sets x 12 reps, light-to-medium weight (45°-90°)', rpe: '6-7 (Hard)', load: 'High', rationale: 'Progressive hypertrophy stimulus for the quadriceps within a highly stable closed-chain environment.' },
          { name: 'Step-ups & Step-downs', parameters: '3 sets x 10 reps (4-inch step height)', rpe: '6-7 (Hard)', load: 'High', rationale: 'Re-establishes eccentric control of the quadriceps, which is critical for stair navigation and running preparation.' },
          { name: 'Theraband Lateral Walks', parameters: '3 sets x 15 steps left and right', rpe: '5-6 (Medium)', load: 'Moderate-High', rationale: 'Stimulates the gluteus medius to control knee valgus forces during dynamic lateral movements.' },
          { name: 'Proprioceptive Balance Board', parameters: '3 sets x 1 minute, controlled posture', rpe: '5-6 (Medium)', load: 'Moderate', rationale: 'Forces rapid neuro-muscular reactions, training the ACL graft and knee complex to handle unstable terrains.' }
        ],
        restrictions: 'No high-impact running, jumping, or loaded twisting. Avoid loading beyond 90°.'
      }
    ]
  },
  shoulder: {
    summary: "8-Week Rotator Cuff Tear Conservative Management Protocol",
    phases: [
      {
        phase: 'Weeks 1-2',
        title: 'Phase I: Passive Protection & Pain Mitigation',
        goals: ['Passive flexion to 120°', 'Passive external rotation (ER) to 30°', 'VAS Pain score < 3/10'],
        exercises: [
          { name: 'Passive Pendulum Hangs', parameters: '3 sets of 30 seconds, 3x daily', rpe: '2-3 (Very Light)', load: 'None', rationale: 'Uses traction force of gravity to gently separate the glenohumeral joint, relieving impingement and dispersing fluid.' },
          { name: 'Active-Assisted Pulley Flexion', parameters: '3 sets x 10 reps, 2x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Enables shoulder flexion range expansion without contracting the damaged rotator cuff tendons.' },
          { name: 'Isometric Internal/External Rotation', parameters: '3 sets x 10 reps (5s holds at neutral)', rpe: '3-4 (Light)', load: 'Low', rationale: 'Activates rotator cuff muscles at submaximal load in neutral positions to prevent atrophy while avoiding tissue friction.' }
        ],
        restrictions: 'No active elevation/abduction. No lifting > 1 lb. Keep arm supported in sling when fatigued.'
      },
      {
        phase: 'Weeks 3-4',
        title: 'Phase II: Active-Assisted ROM & Scapular Stability',
        goals: ['Active-assisted flexion to 150°', 'Active abduction to 90° without shrugging'],
        exercises: [
          { name: 'Scapular Squeezes', parameters: '3 sets x 15 reps, 2x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Activates middle trap and rhomboids to restore healthy scapular retraction and subacromial clearance.' },
          { name: 'Active-assisted Cane Exercises', parameters: '3 sets x 10 reps, daily', rpe: '4-5 (Moderate)', load: 'Low-Moderate', rationale: 'Translates active assistance to higher ranges, improving motor control in elevation and external rotation.' },
          { name: 'Theraband Scapular Retraction', parameters: '3 sets x 12 reps, controlled', rpe: '5-6 (Medium)', load: 'Moderate', rationale: 'Strengthens prime back pullers, providing a stable muscular base for rotator cuff loading in late phases.' }
        ],
        restrictions: 'Limit active elevation to 90°. Avoid sudden pushing/pulling, throwing, or heavy lifting.'
      },
      {
        phase: 'Weeks 5-8',
        title: 'Phase III: Active Strengthening & Cuff Conditioning',
        goals: ['Full active pain-free range of motion', 'Symmetrical scapulohumeral rhythm during elevation'],
        exercises: [
          { name: 'Theraband External Rotation', parameters: '3 sets x 12 reps, daily', rpe: '5-6 (Medium)', load: 'Moderate-High', rationale: 'Targets the infraspinatus and teres minor, enhancing lateral rotational endurance to centrate the humeral head.' },
          { name: 'Standing Dumbbell Rows', parameters: '3 sets x 10 reps (light weight: 2-5 lbs)', rpe: '6-7 (Hard)', load: 'High', rationale: 'Combines multi-joint posterior chain strengthening to support overhead reach mechanics.' },
          { name: 'Wall Walks / Wall Slides', parameters: '3 sets x 12 reps, controlled tempo', rpe: '5-6 (Medium)', load: 'Moderate-High', rationale: 'Promotes scapular stabilization and serratus anterior activation, helping the scapula rotate upward during arm elevation.' }
        ],
        restrictions: 'No overhead lifting or pushing (> 5 lbs). Avoid high-velocity throwing movements.'
      }
    ]
  },
  lumbar: {
    summary: "8-Week Lumbar Disc Herniation & Sciatica Recovery Protocol",
    phases: [
      {
        phase: 'Weeks 1-2',
        title: 'Phase I: Lumbar Protection & Centralization of Pain',
        goals: ['Centralization of radiating leg pain', 'Pain-free active extension', 'VAS Pain score < 4/10'],
        exercises: [
          { name: 'McKenzie Prone Press-ups', parameters: '3 sets x 10 reps (3s hold), 3x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Applies anterior-to-posterior force to lumbar disks, prompting herniated nucleus material to migrate anteriorly away from nerve roots.' },
          { name: 'Pelvic Tilts', parameters: '3 sets x 15 reps, 2x daily', rpe: '2-3 (Very Light)', load: 'Low', rationale: 'Gently mobilizes the lumbar spine, stimulating fluid exchange inside disc tissues without excessive mechanical stress.' },
          { name: 'Transversus Abdominis (TA) Activation', parameters: '3 sets x 10 reps (10s holds)', rpe: '3-4 (Light)', load: 'Low', rationale: 'Teaches voluntary abdominal drawing-in maneuver to build a natural corset support around unstable lumbar vertebrae.' }
        ],
        restrictions: 'Strictly avoid lumbar flexion (forward bending) and twisting. No lifting > 5 lbs. No sitting > 20 mins.'
      },
      {
        phase: 'Weeks 3-4',
        title: 'Phase II: Core Activation & Spine Stability',
        goals: ['Pain-free sitting for 45 minutes', 'Controlled core bracing during movements', 'Hamstring flexibility > 70°'],
        exercises: [
          { name: 'Bird-Dog Extensions', parameters: '3 sets x 10 reps per side, 2x daily', rpe: '4-5 (Moderate)', load: 'Moderate', rationale: 'Challenges spinal extension and cross-body motor control while minimizing lumbar shear stress.' },
          { name: 'Dead Bug Abdominal Bracing', parameters: '3 sets x 12 reps, controlled', rpe: '4-5 (Moderate)', load: 'Moderate', rationale: 'Teaches dynamic limb control while maintaining a flat, stable lumbar spine against pelvic rotation.' },
          { name: 'Side Planks from Knees', parameters: '3 sets of 20 seconds, daily', rpe: '5-6 (Medium)', load: 'Moderate-High', rationale: 'Strengthens the quadratus lumborum and obliques, which are crucial for resisting lateral lumbar forces.' }
        ],
        restrictions: 'Limit trunk flexion to neutral. No loaded twisting. Avoid jogging, jumping, or high-impact.'
      },
      {
        phase: 'Weeks 5-8',
        title: 'Phase III: Core Strength & Lumbo-Pelvic Control',
        goals: ['Full pain-free functional ADLs', 'Dynamic spine stability during hip hinges'],
        exercises: [
          { name: 'Glute Bridges (with band)', parameters: '3 sets x 15 reps, daily', rpe: '5-6 (Medium)', load: 'Moderate-High', rationale: 'Reinforces gluteus maximus extension strength to offset anterior pelvic tilt and lower back loading.' },
          { name: 'Controlled Bodyweight Squats', parameters: '3 sets x 12 reps, keep spine neutral', rpe: '6-7 (Hard)', load: 'High', rationale: 'Integrates core brace with primary leg drivers, simulating safe bending during functional lifting tasks.' },
          { name: 'Standing Theraband Anti-Rotation Holds', parameters: '3 sets x 10 reps (10s holds)', rpe: '5-6 (Medium)', load: 'Moderate-High', rationale: 'Trains core musculature to resist rotational torque (anti-rotation), protecting disc walls.' }
        ],
        restrictions: 'Avoid heavy lifting in flexed lumbar postures (always hinge hips). No heavy rotational loading.'
      }
    ]
  },
  cervical: {
    summary: "8-Week Cervical Radiculopathy & Spondylosis Recovery Protocol",
    phases: [
      {
        phase: 'Weeks 1-2',
        title: 'Phase I: Neck Decompression & Flexor Activation',
        goals: ['Reduction of radiating arm symptoms', 'Pain-free cervical chin tucks', 'Neck rotation to 45°'],
        exercises: [
          { name: 'Cervical Retraction (Chin Tucks)', parameters: '3 sets x 10 reps (5s hold), 3x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Decompresses the suboccipital region and opens cervical foraminal spaces, relieving nerve compression.' },
          { name: 'Gentle Passive Neck Rotation', parameters: '3 sets x 10 reps, pain-free range', rpe: '2-3 (Very Light)', load: 'None', rationale: 'Promotes range recovery without activating large stabilizing muscles, avoiding reflex neck muscle spasms.' },
          { name: 'Scapular Retractions', parameters: '3 sets x 12 reps, daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Strengthens upper back supports, helping shift head weight back over the shoulders.' }
        ],
        restrictions: 'Avoid neck extension (looking up) and lateral bending towards painful side. No overhead carry.'
      },
      {
        phase: 'Weeks 3-4',
        title: 'Phase II: Neck Stabilization & Postural Re-education',
        goals: ['Pain-free desk posture for 1 hour', 'Full active pain-free neck rotation (60°+)'],
        exercises: [
          { name: 'Isometric Cervical Rotation/Flexion', parameters: '3 sets x 10 reps (5s holds), daily', rpe: '4-5 (Moderate)', load: 'Low-Moderate', rationale: 'Recruits deep cervical flexors and extensors against mild resistance in neutral alignment to improve neck control.' },
          { name: 'Prone Scapular Cobra Stretch', parameters: '3 sets x 12 reps, controlled', rpe: '5-6 (Medium)', load: 'Moderate', rationale: 'Strengthens lower and mid trapezius while stretching the anterior chest, reversing forward-head posturing.' },
          { name: 'Chin Tucks (Head Lifted from towel)', parameters: '3 sets x 8 reps (3s holds)', rpe: '5-6 (Medium)', load: 'Moderate', rationale: 'Directly targets and builds endurance in the longus colli and longus capitis (deep neck flexors).' }
        ],
        restrictions: 'Avoid prolonged static neck flexion (no text-neck). Avoid lifting or pushing > 10 lbs.'
      },
      {
        phase: 'Weeks 5-8',
        title: 'Phase III: Dynamic Neck & Upper Quarter Strength',
        goals: ['Symmetrical neck active ROM', 'Postural endurance during daily tasks'],
        exercises: [
          { name: 'Standing Dumbbell Scaption', parameters: '3 sets x 10 reps (light weight: 1-3 lbs)', rpe: '6-7 (Hard)', load: 'High', rationale: 'Strengthens lower traps and serratus anterior, creating a stable platform for neck movements.' },
          { name: 'Face Pulls with Resistance Band', parameters: '3 sets x 12 reps, controlled', rpe: '6-7 (Hard)', load: 'High', rationale: 'Improves rear deltoid and rotator cuff strength, helping stabilize the cervical-thoracic junction.' },
          { name: 'Thoracic Extension Stretch on foam roller', parameters: '5 minutes, daily', rpe: '3-4 (Light)', load: 'None', rationale: 'Mobilizes the thoracic spine, restoring extension which directly decreases dynamic cervical extension demands.' }
        ],
        restrictions: 'Avoid high-impact vibration (off-road, etc.) and heavy overhead weight presses.'
      }
    ]
  },
  general: {
    summary: "8-Week General Musculoskeletal Rehabilitation Protocol",
    phases: [
      {
        phase: 'Weeks 1-2',
        title: 'Phase I: Pain Management & Active-Assisted ROM',
        goals: ['Decrease localized pain VAS < 3/10', 'Restore early active-assisted range of motion'],
        exercises: [
          { name: 'Passive Range of Motion Stretches', parameters: '3 sets of 30 seconds, 2x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Prevents joint tightness and encourages synovial fluid circulation without load stress.' },
          { name: 'Gentle Isometric Holds', parameters: '3 sets of 10 reps (5s hold)', rpe: '3-4 (Light)', load: 'Low', rationale: 'Maintains neuromuscular paths and limits disuse atrophy during the acute healing phase.' }
        ],
        restrictions: 'Avoid loading joint beyond comfort. No high-resistance training.'
      },
      {
        phase: 'Weeks 3-4',
        title: 'Phase II: Early Strengthening & Stabilization',
        goals: ['Symmetrical range of motion', 'Active muscle recruitment without compensation'],
        exercises: [
          { name: 'Active Free-Weight Exercises', parameters: '3 sets x 10 reps, controlled tempo', rpe: '5-6 (Medium)', load: 'Moderate', rationale: 'Applies dynamic concentric-eccentric tissue stimulus, rebuilding motor pathway consistency.' },
          { name: 'Closed-Kinetic Chain Balance Work', parameters: '3 sets of 30 seconds', rpe: '4-5 (Moderate)', load: 'Moderate', rationale: 'Enhances joint mechanoreceptor loops, improving positional awareness.' }
        ],
        restrictions: 'Avoid sudden explosive movements. Limit loads to 50% of 1RM.'
      },
      {
        phase: 'Weeks 5-8',
        title: 'Phase III: Functional Integration & Conditioning',
        goals: ['Return to full daily functional tasks', 'Restore muscle endurance and power'],
        exercises: [
          { name: 'Dynamic Resistance Band Drills', parameters: '3 sets x 12 reps, medium load', rpe: '6-7 (Hard)', load: 'Moderate-High', rationale: 'Simulates functional movement speeds, strengthening tissue elasticity.' },
          { name: 'Progressive Agility & Balance Stretches', parameters: '3 sets x 15 reps, daily', rpe: '5-6 (Medium)', load: 'Moderate-High', rationale: 'Optimizes reactive safety reflexes to prevent future micro-tears.' }
        ],
        restrictions: 'Avoid overloading tissue beyond clinical limits. Always warm up.'
      }
    ]
  }
};

const CLINICAL_DIETS = {
  knee: {
    summary: "High-Protein & Anti-Inflammatory ACL/Knee Healing Diet",
    calories: 2200,
    macros: { protein: 140, carbs: 240, fat: 75 },
    focus: "Tissue repair, joint lubrication, fluid control, and collagen synthesis.",
    hydration: "3.2 Liters daily (To reduce joint swelling and optimize metabolic transport)",
    recommendedFoods: {
      "Non-Veg": ["Grilled Salmon (Omega-3)", "Chicken Breast (High Protein)", "Bone Broth (Collagen)", "Eggs (Leucine & Amino Acids)", "Citrus Fruits (Vitamin C for graft synthesis)", "Blueberries (Antioxidants)", "Pumpkin Seeds (Zinc)"],
      "Veg": ["Greek Yogurt / Paneer (Protein)", "Tofu & Edamame", "Whey Protein Shake", "Bone Broth alternative", "Citrus Fruits (Vitamin C)", "Blueberries (Antioxidants)", "Pumpkin Seeds (Zinc)"],
      "Vegan": ["Tofu & Tempeh", "Lentil Soup / Chickpeas", "Soy Milk & Pea Protein", "Chia seeds (Omega-3)", "Citrus Fruits (Vitamin C)", "Blueberries (Antioxidants)", "Pumpkin Seeds (Zinc)"]
    },
    avoidFoods: ["Refined sugar (triggers inflammation)", "Trans fats (processed snacks)", "Excess sodium (increases knee edema/swelling)"],
    supplements: [
      { name: "Collagen Peptides", dose: "10-15g daily", timing: "30-60 mins before rehab sessions with Vitamin C", rationale: "Enhances collagen synthesis in tendon and ligament graft tissues." },
      { name: "Vitamin C", dose: "500mg daily", timing: "With breakfast", rationale: "Essential co-factor for collagen cross-linking and tissue repair." },
      { name: "Omega-3 Fish Oil", dose: "2000mg daily", timing: "With lunch", rationale: "Reduces inflammatory cytokines and joint swelling post-surgery." },
      { name: "Zinc Citrate", dose: "15mg daily", timing: "With dinner", rationale: "Speeds up cellular repair, tissue growth, and wound healing." }
    ]
  },
  shoulder: {
    summary: "Rotator Cuff & Tendon Repair Supporting Diet",
    calories: 2000,
    macros: { protein: 130, carbs: 210, fat: 70 },
    focus: "Tendon elasticity, cell membrane regeneration, and collagen synthesis.",
    hydration: "2.8 Liters daily (Optimizes tissue hydration and elasticity)",
    recommendedFoods: {
      "Non-Veg": ["Lean Beef (Iron & Zinc)", "Eggs (Choline & Protein)", "Pineapple (Bromelain for tendon swelling)", "Turmeric & Ginger (Anti-inflammatory)", "Walnuts (Healthy Fats)", "Spinach (Magnesium)"],
      "Veg": ["Cottage Cheese / Paneer", "Greek Yogurt", "Pineapple (Bromelain)", "Turmeric & Ginger", "Walnuts (Healthy Fats)", "Spinach & Kale (Magnesium)"],
      "Vegan": ["Tempeh / Soy chunks", "Walnuts & Chia seeds", "Pineapple (Bromelain)", "Turmeric & Ginger", "Spinach & Kale", "Pumpkin seeds & Chickpeas"]
    },
    avoidFoods: ["Alcohol (impairs protein synthesis)", "Saturated fats (increases systemic pain)", "Excess coffee/caffeine (restricts microcirculation to tendons)"],
    supplements: [
      { name: "Collagen Peptides", dose: "10g daily", timing: "With Vitamin C", rationale: "Promotes tendon cell proliferation and structural remodeling." },
      { name: "Bromelain", dose: "500mg daily", timing: "Between meals", rationale: "Natural pineapple enzyme that reduces tendon swelling and pain." },
      { name: "Curcumin (Turmeric Extract)", dose: "1000mg daily", timing: "With dinner", rationale: "Acts as a potent natural anti-inflammatory agent to reduce shoulder pain." }
    ]
  },
  lumbar: {
    summary: "Disc Hydration & Spinal Recovery Supporting Diet",
    calories: 2100,
    macros: { protein: 120, carbs: 230, fat: 75 },
    focus: "Spinal disc rehydration, nerve myelin sheath repair, and bone density.",
    hydration: "3.5 Liters daily (Critical for lumbar disc rehydration during rest/sleep)",
    recommendedFoods: {
      "Non-Veg": ["Mackerel / Sardines (B-Vitamins & Omega-3)", "Eggs (B12 & Protein)", "Greek Yogurt (Calcium)", "Dark Leafy Greens (Magnesium)", "Avocados (Healthy Fats)", "Bone Broth"],
      "Veg": ["Greek Yogurt (Calcium)", "Milk / Paneer", "Dark Leafy Greens (Magnesium)", "Avocados", "Chia & Flax Seeds (Omega-3)", "Almonds"],
      "Vegan": ["Fortified Soy Milk (Calcium/B12)", "Tofu & Tempeh", "Dark Leafy Greens", "Avocados", "Chia & Flax Seeds", "Almonds"]
    },
    avoidFoods: ["Sugary carbonated drinks (depletes bone calcium)", "Processed red meat (promotes disc degeneration)", "Gluten & simple carbs (can trigger back nerve sensitivity)"],
    supplements: [
      { name: "Vitamin D3", dose: "2000-4000 IU daily", timing: "With a fat-containing meal", rationale: "Optimizes calcium absorption and spinal bone mineral density." },
      { name: "Magnesium Glycinate", dose: "350mg daily", timing: "30-60 mins before bed", rationale: "Reduces painful spasms in lower back muscles and promotes deep sleep." },
      { name: "Vitamin B-Complex (with B12)", dose: "1 capsule daily", timing: "With breakfast", rationale: "Supports myelin sheath repair and reduces radiating sciatic nerve pain." }
    ]
  },
  cervical: {
    summary: "Neck Spine Health & Muscle Relieving Diet",
    calories: 1900,
    macros: { protein: 115, carbs: 200, fat: 70 },
    focus: "Cervical vertebrae support, muscle tension relief, and nervous system calm.",
    hydration: "2.8 Liters daily (Keeps neck muscles and cervical discs hydrated)",
    recommendedFoods: {
      "Non-Veg": ["Chicken Breast", "Wild Salmon (Astaxanthin & Omega-3)", "Avocado (Magnesium)", "Almonds (Vitamin E)", "Green Tea (Antioxidants)", "Bone Broth"],
      "Veg": ["Greek Yogurt (Calcium)", "Cottage Cheese / Tofu", "Avocado (Magnesium)", "Almonds", "Green Tea", "Chia Seeds"],
      "Vegan": ["Tofu / Edamame", "Soy Yogurt", "Avocado", "Almonds", "Green Tea", "Chia & Hemp Seeds"]
    },
    avoidFoods: ["Excess sodium (stiffens neck tissues)", "Trans fats", "High chemical preservative foods"],
    supplements: [
      { name: "Magnesium Malate", dose: "300mg daily", timing: "With dinner", rationale: "Specifically targets muscle tissue to alleviate neck and shoulder tension." },
      { name: "Vitamin D3 + K2", dose: "2000 IU / 45mcg", timing: "With breakfast", rationale: "Maintains cervical vertebrae strength and prevents calcium buildup in arteries." }
    ]
  },
  general: {
    summary: "Musculoskeletal Healing & General Recovery Diet",
    calories: 2000,
    macros: { protein: 120, carbs: 220, fat: 70 },
    focus: "Balanced macronutrients to preserve muscle mass and support tissue healing.",
    hydration: "2.5 Liters daily (Essential for overall recovery and tissue cell turnover)",
    recommendedFoods: {
      "Non-Veg": ["Lean Poultry", "Eggs", "Mixed Berries", "Oats & Quinoa", "Olive Oil", "Broccoli & Cauliflower"],
      "Veg": ["Cottage Cheese / Greek Yogurt", "Lentils & Beans", "Mixed Berries", "Oats & Quinoa", "Olive Oil", "Broccoli"],
      "Vegan": ["Tofu / Tempeh", "Lentils & Beans", "Mixed Berries", "Oats & Quinoa", "Olive Oil", "Broccoli"]
    },
    avoidFoods: ["Highly processed fast food", "Sugary beverages", "Excessive alcohol"],
    supplements: [
      { name: "Clinical Multivitamin", dose: "1 tablet daily", timing: "With breakfast", rationale: "Fills potential micro-nutritional gaps during recovery." }
    ]
  }
};

const TreatmentPlanner = () => {
  const [diagnosis, setDiagnosis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  
  const [refId, setRefId] = useState('');
  const [activeTab, setActiveTab] = useState('exercises');
  const [dietPreference, setDietPreference] = useState('Non-Veg');

  // Advanced Clinical State
  const [painScore, setPainScore] = useState(2);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [showRationales, setShowRationales] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Customization & Approval States
  const [isApproved, setIsApproved] = useState(false);
  const [modifyingPhaseIdx, setModifyingPhaseIdx] = useState(null);
  const [customExName, setCustomExName] = useState('');
  const [customExParams, setCustomExParams] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [tempPhases, setTempPhases] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenModifyModal = () => {
    if (!plan) return;
    setTempPhases(JSON.parse(JSON.stringify(plan.phases)));
    setShowModifyModal(true);
  };

  const handleSaveModifiedProtocol = async () => {
    const updatedPlan = { ...plan, phases: tempPhases };
    setPlan(updatedPlan);
    setIsApproved(false);

    let patientName = "Rahul Verma";
    if (diagnosis) {
      const text = diagnosis.toLowerCase();
      if (text.includes('acl') || text.includes('knee') || text.includes('ghutna')) {
        patientName = "Rahul Verma";
      } else if (text.includes('shoulder') || text.includes('rotator') || text.includes('kandha') || text.includes('dislocation')) {
        patientName = "Vikram Singh";
      } else if (text.includes('cervical') || text.includes('neck') || text.includes('gardan') || text.includes('spondylosis')) {
        patientName = "Priya Sharma";
      }
    }

    try {
      await api.saveProtocol({
        patient_name: patientName,
        pain_score: painScore,
        exercises: tempPhases,
        rpe_exertion: painScore,
        biomechanical_rationale: showRationales ? 1 : 0,
        phase_checklist: completedGoals,
        status: 'Pending'
      });
    } catch {
      // Offline fallback
    }

    setShowModifyModal(false);
    showToast("Protocol updated and saved successfully!");
  };

  const handleAddTempExercise = (phaseIdx) => {
    const updated = [...tempPhases];
    updated[phaseIdx].exercises.push({
      name: 'New Exercise',
      parameters: '3 sets x 10 reps',
      rpe: '4-5 (Moderate)',
      load: 'Moderate',
      rationale: 'Prescribed therapeutic exercise targeting the rehabilitation goal.'
    });
    setTempPhases(updated);
  };

  const handleRemoveTempExercise = (phaseIdx, exIdx) => {
    const updated = [...tempPhases];
    updated[phaseIdx].exercises = updated[phaseIdx].exercises.filter((_, i) => i !== exIdx);
    setTempPhases(updated);
  };

  const handleUpdateTempExercise = (phaseIdx, exIdx, field, value) => {
    const updated = [...tempPhases];
    updated[phaseIdx].exercises[exIdx] = {
      ...updated[phaseIdx].exercises[exIdx],
      [field]: value
    };
    setTempPhases(updated);
  };

  const handleAddCustomExercise = (phaseIdx) => {
    if (!customExName || !customExParams) return;
    
    const updatedPlan = { ...plan };
    updatedPlan.phases = plan.phases.map((phase, idx) => {
      if (idx === phaseIdx) {
        return {
          ...phase,
          exercises: [
            ...phase.exercises,
            {
              name: customExName,
              parameters: customExParams,
              rpe: '4-5 (Moderate)',
              load: 'Moderate',
              rationale: 'Custom user-prescribed therapeutic loading targeted for pathology.'
            }
          ]
        };
      }
      return phase;
    });

    setPlan(updatedPlan);
    setCustomExName('');
    setCustomExParams('');
    setModifyingPhaseIdx(null);
    setIsApproved(false); // Reset approval since the plan has changed
    showToast("Custom exercise added successfully! Plan updated.");
  };

  const handleApprovePlan = async () => {
    setIsApproved(true);

    let patientName = "Rahul Verma";
    let logId = "101";
    if (diagnosis) {
      const text = diagnosis.toLowerCase();
      if (text.includes('acl') || text.includes('knee') || text.includes('ghutna')) {
        patientName = "Rahul Verma";
        logId = "101";
      } else if (text.includes('shoulder') || text.includes('rotator') || text.includes('kandha') || text.includes('dislocation')) {
        patientName = "Vikram Singh";
        logId = "102";
      } else if (text.includes('cervical') || text.includes('neck') || text.includes('gardan') || text.includes('spondylosis')) {
        patientName = "Priya Sharma";
        logId = "103";
      }
    }

    try {
      await api.saveProtocol({
        patient_name: patientName,
        pain_score: painScore,
        exercises: plan.phases,
        rpe_exertion: painScore,
        biomechanical_rationale: showRationales ? 1 : 0,
        phase_checklist: completedGoals,
        status: 'Approved'
      });
    } catch {
      if (!getBackendStatus()) {
        localStorage.setItem(`patient_status_${patientName}`, 'Approved');
        localStorage.setItem(`log_status_${logId}`, 'Approved');
      }
    }

    setShowSuccessModal(true);
    showToast(`Protocol approved and synchronized to patient portal for ${patientName}!`);
  };

  const generatePlan = (e) => {
    e.preventDefault();
    if (!diagnosis) return;
    setIsGenerating(true);

    const text = diagnosis.toLowerCase();
    let patientName = "Rahul Verma";
    let selectedProtocol = CLINICAL_PROTOCOLS.general;
    let selectedDiet = CLINICAL_DIETS.general;

    if (text.includes('acl') || text.includes('knee') || text.includes('ghutna')) {
      selectedProtocol = CLINICAL_PROTOCOLS.knee;
      selectedDiet = CLINICAL_DIETS.knee;
      patientName = "Rahul Verma";
    } else if (text.includes('shoulder') || text.includes('rotator') || text.includes('kandha') || text.includes('dislocation')) {
      selectedProtocol = CLINICAL_PROTOCOLS.shoulder;
      selectedDiet = CLINICAL_DIETS.shoulder;
      patientName = "Vikram Singh";
    } else if (text.includes('lumbar') || text.includes('back') || text.includes('kamar') || text.includes('disc') || text.includes('sciatica')) {
      selectedProtocol = CLINICAL_PROTOCOLS.lumbar;
      selectedDiet = CLINICAL_DIETS.lumbar;
      patientName = "Rahul Verma";
    } else if (text.includes('cervical') || text.includes('neck') || text.includes('gardan') || text.includes('spondylosis')) {
      selectedProtocol = CLINICAL_PROTOCOLS.cervical;
      selectedDiet = CLINICAL_DIETS.cervical;
      patientName = "Priya Sharma";
    }

    setTimeout(async () => {
      try {
        const existingProto = await api.getProtocol(patientName);
        setPlan({
          summary: selectedProtocol.summary,
          phases: existingProto.exercises,
          diet: selectedDiet
        });
        setRefId(`PS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
        setPainScore(existingProto.pain_score);
        setCompletedGoals(existingProto.phase_checklist || []);
        setIsApproved(existingProto.status === 'Approved');
        if (existingProto.exercises?.[0]?.exercises?.[0]) {
          setSelectedExercise(existingProto.exercises[0].exercises[0]);
        }
      } catch {
        setPlan({
          ...selectedProtocol,
          diet: selectedDiet
        });
        setRefId(`PS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
        setCompletedGoals([]);
        setIsApproved(false);
        if (selectedProtocol?.phases?.[0]?.exercises?.[0]) {
          setSelectedExercise(selectedProtocol.phases[0].exercises[0]);
        } else {
          setSelectedExercise(null);
        }
      } finally {
        setIsGenerating(false);
        setModifyingPhaseIdx(null);
      }
    }, 1500);
  };

  const handleExerciseClick = (ex) => {
    setSelectedExercise(ex);
  };

  const getAdjustedParameters = (ex, pain) => {
    if (pain >= 7) {
      return {
        parameters: "Rest / Passive ROM only",
        load: "None",
        rpe: "RPE 1-2: Rest",
        alert: "⚠️ Pain score high (7+). Stop dynamic loading."
      };
    } else if (pain >= 4) {
      let orig = ex.parameters;
      let adj;
      if (orig.includes('3 sets x 10 reps')) {
        adj = orig.replace('3 sets x 10 reps', '2 sets x 8 reps').replace('5s hold', '8s hold');
      } else if (orig.includes('3 sets x 12 reps')) {
        adj = orig.replace('3 sets x 12 reps', '2 sets x 8 reps');
      } else if (orig.includes('3 sets x 15 reps')) {
        adj = orig.replace('3 sets x 15 reps', '2 sets x 10 reps');
      } else {
        adj = "2 sets x 8 reps (Reduced)";
      }
      return {
        parameters: adj + " (Isometric focus)",
        load: "Low (De-loaded)",
        rpe: "RPE 3-4: Light",
        alert: "ℹ️ Pain moderate (4-6). Parameters de-loaded by 30%."
      };
    } else {
      return {
        parameters: ex.parameters,
        load: ex.load || "Standard",
        rpe: ex.rpe || "Standard",
        alert: null
      };
    }
  };

  const handleToggleGoal = (goal) => {
    setCompletedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const renderDietTab = () => {
    if (!plan || !plan.diet) return null;
    const diet = plan.diet;

    // Calculate dynamic protein target based on bodyweight (mock adjusted by pain/severity score)
    const baseProtein = diet.macros.protein;
    const weightKg = 75; // mock patient weight
    // adjust protein slightly if pain/inflammation is higher
    const adjustedProtein = Math.round(baseProtein + (painScore * 1.5));
    const proteinGramsPerKg = (adjustedProtein / weightKg).toFixed(2);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'scaleIn 0.3s ease' }}>
        
        {/* Diet Overview & Preference Selector */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{diet.summary}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <strong>Clinical Recovery Focus:</strong> {diet.focus}
              </p>
            </div>
            
            {/* Preference Selector */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {['Non-Veg', 'Veg', 'Vegan'].map(pref => (
                <button
                  key={pref}
                  onClick={() => setDietPreference(pref)}
                  style={{
                    border: 'none',
                    background: dietPreference === pref ? 'var(--primary)' : 'transparent',
                    color: dietPreference === pref ? 'white' : 'var(--text-main)',
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* Hydration Tracker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.15)', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>💧</span>
            <div>
              <h5 style={{ margin: 0, color: '#0284c7', fontSize: '0.85rem', fontWeight: 'bold' }}>Target Hydration</h5>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-main)' }}>{diet.hydration}</p>
            </div>
          </div>
        </div>

        {/* Macros & Caloric Breakdown (Visual SVG ring / Progress bars) */}
        <div className="glass-panel responsive-grid-1-2" style={{ padding: '24px', alignItems: 'center' }}>
          
          {/* Caloric Circle Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="8" 
                strokeDasharray="314" 
                strokeDashoffset="75" 
                strokeLinecap="round" 
                transform="rotate(-90 60 60)" 
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{diet.calories}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kcal / Day</span>
            </div>
          </div>

          {/* Macronutrients Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>Macronutrient Target Distribution</h4>
            
            {/* Protein bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>Protein (Anti-inflammatory/Repair)</span>
                <span><strong>{adjustedProtein}g</strong> ({proteinGramsPerKg} g/kg)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (adjustedProtein / 150) * 100)}%`, height: '100%', background: '#10b981' }} />
              </div>
            </div>

            {/* Carbs bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>Carbohydrates (Energy Support)</span>
                <span><strong>{diet.macros.carbs}g</strong></span>
              </div>
              <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (diet.macros.carbs / 300) * 100)}%`, height: '100%', background: '#3b82f6' }} />
              </div>
            </div>

            {/* Fat bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>Fats (Hormonal & Joint Integrity)</span>
                <span><strong>{diet.macros.fat}g</strong></span>
              </div>
              <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (diet.macros.fat / 100) * 100)}%`, height: '100%', background: '#f59e0b' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Foods vs. Avoid Grid */}
        <div className="responsive-grid-2">
          
          {/* Recommended Foods */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981', background: 'var(--bg-card)' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#059669', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🟢 Recommended Foods ({dietPreference})
            </h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {diet.recommendedFoods[dietPreference].map((food, i) => (
                <span 
                  key={i} 
                  style={{ 
                    fontSize: '0.72rem', 
                    padding: '6px 10px', 
                    background: 'rgba(16, 185, 129, 0.06)', 
                    color: '#059669', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    fontWeight: '500'
                  }}
                >
                  {food}
                </span>
              ))}
            </div>
          </div>

          {/* Foods to Avoid */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #ef4444', background: 'var(--bg-card)' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔴 Foods to Avoid & Limit
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {diet.avoidFoods.map((food, i) => (
                <div 
                  key={i} 
                  style={{ 
                    fontSize: '0.74rem', 
                    color: 'var(--text-main)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}
                >
                  <span style={{ color: '#ef4444' }}>•</span>
                  <span>{food}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clinical Supplement Guide */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h5 style={{ margin: '0 0 12px 0', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
            ⚡ Clinical Recovery Supplement Prescription
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {diet.supplements.map((supp, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '12px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {supp.name}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(13, 148, 136, 0.08)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 'bold' }}>
                      {supp.dose}
                    </span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(168, 85, 247, 0.08)', color: '#a855f7', borderRadius: '4px', fontWeight: 'bold' }}>
                      🕒 {supp.timing}
                    </span>
                  </div>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <strong>Rationale:</strong> {supp.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="main-content">
      {/* Dynamic Printing Media Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <header className="dashboard-header">
        <div>
          <h1>AI Treatment Rx Planner 🧠</h1>
          <p>Generate, customize, and approve rehabilitation protocols for patients.</p>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3>Patient Diagnosis Input</h3>
            <form onSubmit={generatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <textarea
                className="search-bar"
                style={{ width: '100%', height: '100px', resize: 'none', borderRadius: '12px', padding: '16px' }}
                placeholder="e.g., 24yo male, Post-Op ACL Reconstruction (Right Knee), Week 1..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
              <button type="submit" className="glass-button" style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                <Sparkles size={18} /> {isGenerating ? 'Analyzing...' : 'Generate AI Protocol'}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '24px', minHeight: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Generated Protocol
              </h3>
              {plan && (
                <button 
                  className="glass-button" 
                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setShowPrintModal(true)}
                >
                  <Printer size={14} /> Print Report
                </button>
              )}
            </div>

            {isGenerating ? (
              <div style={{ marginTop: '30px', textAlign: 'center', color: 'var(--primary)' }}>
                <Clock size={32} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 10px' }} />
                <p>Scanning thousands of protocols...</p>
              </div>
            ) : plan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                
                {/* Adaptive Pain (VAS Score) Widget */}
                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={14} style={{ color: 'var(--primary)' }} /> Patient Pain Adaptability (VAS Score)
                    </span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold', 
                      padding: '2px 8px', 
                      borderRadius: '8px',
                      background: painScore >= 7 ? 'rgba(239, 68, 68, 0.15)' : painScore >= 4 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: painScore >= 7 ? '#dc2626' : painScore >= 4 ? '#d97706' : '#059669'
                    }}>
                      {painScore}/10 - {painScore >= 7 ? 'Severe' : painScore >= 4 ? 'Moderate' : 'Mild'}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={painScore} 
                    onChange={(e) => setPainScore(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: painScore >= 7 ? '#ef4444' : painScore >= 4 ? '#f59e0b' : '#0d9488',
                      cursor: 'pointer',
                      height: '6px',
                      borderRadius: '3px'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>0: Pain Free</span>
                    <span>5: Distracting Pain</span>
                    <span>10: Intolerable Pain</span>
                  </div>
                </div>

                {/* Protocol Summary Header Banner */}
                <div style={{ 
                  background: 'rgba(13, 148, 136, 0.05)', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(13, 148, 136, 0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Rehabilitation Plan</span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>{plan.summary}</h4>
                  </div>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                    color: isApproved ? '#059669' : '#d97706', 
                    borderRadius: '12px', 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    {isApproved ? 'Approved & Synced' : 'Pending Approval'}
                  </span>
                </div>

                {isApproved && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '0.75rem',
                    color: '#047857',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} style={{ color: '#10b981' }} /> Clinical approval completed. This protocol has been locked and synced to the patient logbook.
                  </div>
                )}

                {/* Tab Switcher */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('exercises')}
                    className="glass-button"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      background: activeTab === 'exercises' ? 'var(--primary)' : 'var(--glass-bg)',
                      color: activeTab === 'exercises' ? 'white' : 'var(--text-main)',
                      border: activeTab === 'exercises' ? 'none' : '1px solid var(--border)',
                      boxShadow: activeTab === 'exercises' ? '0 4px 12px var(--primary-glow)' : 'none',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Exercise Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('diet')}
                    className="glass-button"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      background: activeTab === 'diet' ? 'var(--primary)' : 'var(--glass-bg)',
                      color: activeTab === 'diet' ? 'white' : 'var(--text-main)',
                      border: activeTab === 'diet' ? 'none' : '1px solid var(--border)',
                      boxShadow: activeTab === 'diet' ? '0 4px 12px var(--primary-glow)' : 'none',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Diet & Nutrition Planner
                  </button>
                </div>

                {activeTab === 'exercises' ? (
                  <>
                    {/* Phased Cards */}
                    {plan.phases.map((phase, idx) => {
                      const phaseGoals = phase.goals;
                      const completedInPhase = phaseGoals.filter(g => completedGoals.includes(g)).length;
                      const readinessPercent = Math.round((completedInPhase / phaseGoals.length) * 100);

                      return (
                        <div key={idx} className="glass-panel" style={{ 
                          padding: '16px', 
                          borderLeft: '5px solid var(--primary)', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px',
                          background: 'var(--bg-card)'
                        }}>
                          {/* Phase Title */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{phase.phase}</span>
                              <h4 style={{ margin: '2px 0 0 0', fontSize: '0.95rem', color: 'var(--text-main)' }}>{phase.title}</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: readinessPercent === 100 ? '#059669' : 'var(--text-muted)' }}>
                                {readinessPercent === 100 ? '✅ Ready to Advance' : `Readiness: ${readinessPercent}%`}
                              </span>
                              <div style={{ width: '80px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${readinessPercent}%`, height: '100%', background: readinessPercent === 100 ? '#059669' : 'var(--primary)', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          </div>

                          {/* Exit Criteria / Goals */}
                          <div style={{ 
                            background: 'rgba(16, 185, 129, 0.04)', 
                            padding: '10px 12px', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(16, 185, 129, 0.1)' 
                          }}>
                            <h5 style={{ color: '#059669', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              <CheckSquare size={14} /> Exit Goals (Check to mark met)
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                              {phase.goals.map((g, i) => {
                                const isChecked = completedGoals.includes(g);
                                return (
                                  <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.72rem', color: isChecked ? 'var(--text-muted)' : 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked}
                                      onChange={() => handleToggleGoal(g)}
                                      style={{ marginTop: '2px', cursor: 'pointer' }}
                                    />
                                    <span style={{ textDecoration: isChecked ? 'line-through' : 'none' }}>{g}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Clinical Restrictions */}
                          <div style={{ 
                            background: 'rgba(239, 68, 68, 0.04)', 
                            padding: '10px 12px', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(239, 68, 68, 0.1)' 
                          }}>
                            <h5 style={{ color: '#dc2626', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              <AlertTriangle size={14} /> Contraindications & Limits
                            </h5>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{phase.restrictions}</p>
                          </div>

                          {/* Exercise Prescriptions */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <h5 style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>Exercise Prescriptions (Click to select & focus 3D)</h5>
                              <button 
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                                onClick={() => setModifyingPhaseIdx(modifyingPhaseIdx === idx ? null : idx)}
                              >
                                {modifyingPhaseIdx === idx ? 'Cancel' : '+ Add Custom'}
                              </button>
                            </div>

                            {/* Inline custom exercise adder */}
                            {modifyingPhaseIdx === idx && (
                              <div className="glass-panel" style={{ padding: '12px', background: 'rgba(13, 148, 136, 0.03)', border: '1px dashed var(--primary)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Exercise Name (e.g. Clamshells)" 
                                    value={customExName} 
                                    onChange={(e) => setCustomExName(e.target.value)}
                                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Parameters (e.g. 3x10)" 
                                    value={customExParams} 
                                    onChange={(e) => setCustomExParams(e.target.value)}
                                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}
                                  />
                                </div>
                                <button 
                                  type="button"
                                  className="glass-button" 
                                  style={{ padding: '6px', fontSize: '0.72rem', width: '100%' }}
                                  onClick={() => handleAddCustomExercise(idx)}
                                >
                                  Add Custom Exercise
                                </button>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {phase.exercises.map((ex, i) => {
                                const isSelected = selectedExercise?.name === ex.name;
                                const paramsObj = getAdjustedParameters(ex, painScore);
                                return (
                                  <div 
                                    key={i} 
                                    onClick={() => handleExerciseClick(ex)}
                                    style={{ 
                                      display: 'flex', 
                                      flexDirection: 'column',
                                      background: isSelected ? 'rgba(13, 148, 136, 0.05)' : 'var(--bg-main)', 
                                      padding: '10px 12px', 
                                      borderRadius: '8px', 
                                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                      boxShadow: isSelected ? '0 0 10px rgba(13, 148, 136, 0.1)' : 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      position: 'relative'
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.transform = 'none'; }}
                                  >
                                    <div className="exercise-item-header">
                                      <span style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-main)' }}>{ex.name}</span>
                                      <span className="exercise-params-badge" style={{ 
                                        fontSize: '0.75rem', 
                                        color: painScore >= 7 ? '#dc2626' : painScore >= 4 ? '#d97706' : 'var(--primary)', 
                                        fontWeight: 'bold', 
                                        background: painScore >= 7 ? 'rgba(239, 68, 68, 0.08)' : painScore >= 4 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(13, 148, 136, 0.08)', 
                                        padding: '2px 6px', 
                                        borderRadius: '4px',
                                        whiteSpace: 'nowrap'
                                      }}>{paramsObj.parameters}</span>
                                    </div>
                                    
                                    {paramsObj.alert && (
                                      <div style={{ fontSize: '0.65rem', color: painScore >= 7 ? '#dc2626' : '#b45309', fontWeight: '500', marginTop: '6px' }}>
                                        {paramsObj.alert}
                                      </div>
                                    )}

                                    {/* Expanded Clinical Details */}
                                    {isSelected && (
                                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(2, 132, 199, 0.08)', color: 'var(--secondary)', borderRadius: '4px', fontWeight: 'bold' }}>
                                            Target RPE: {paramsObj.rpe}
                                          </span>
                                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(168, 85, 247, 0.08)', color: '#a855f7', borderRadius: '4px', fontWeight: 'bold' }}>
                                            Tissue Load: {paramsObj.load}
                                          </span>
                                        </div>
                                        {showRationales && (
                                          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.35' }}>
                                            <strong>Physiological Rationale:</strong> {ex.rationale}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Rationale Toggle Control */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showRationales} 
                          onChange={() => setShowRationales(!showRationales)} 
                          style={{ cursor: 'pointer' }}
                        />
                        Show Biomechanical Rationales
                      </label>
                    </div>
                  </>
                ) : (
                  renderDietTab()
                )}

                {/* Approval Footer Action Buttons */}
                <div className="planner-footer-buttons">
                  <button 
                    className="glass-button" 
                    onClick={handleApprovePlan}
                    disabled={isApproved}
                    style={{ 
                      flex: 1, 
                      background: isApproved ? '#10b981' : 'var(--accent)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      padding: '10px', 
                      fontSize: '0.85rem',
                      cursor: isApproved ? 'default' : 'pointer',
                      boxShadow: isApproved ? 'none' : '0 4px 15px var(--primary-glow)'
                    }}
                  >
                    <CheckCircle size={16} /> {isApproved ? 'Approved' : 'Approve Plan'}
                  </button>
                  <button 
                    className="glass-button" 
                    onClick={handleOpenModifyModal}
                    style={{ 
                      flex: 1, 
                      background: 'var(--glass-bg)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      padding: '10px', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-main)', 
                      border: '1px solid var(--border)' 
                    }}
                  >
                    <FileSignature size={16} /> Modify Custom
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', minHeight: '150px' }}>
                <p>Enter diagnosis to see the AI-generated plan.</p>
              </div>
            )}
          </div>
        </div>

      {/* Printable Clinical Report Modal */}
      {showPrintModal && plan && (
        <div className="no-print-bg" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '700px',
            background: 'white',
            color: 'black',
            padding: '30px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Modal Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px', alignItems: 'center' }}>
              <h4 style={{ color: '#0f172a', margin: 0 }}>Printable Clinical Prescription</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="glass-button" 
                  style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                  onClick={() => window.print()}
                >
                  Print / Save to PDF
                </button>
                <button 
                  className="glass-button" 
                  style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1' }}
                  onClick={() => setShowPrintModal(false)}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Area Content */}
            <div id="printable-area" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", sans-serif' }}>
              {/* Header Letterhead */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0d9488', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0d9488', fontSize: '1.5rem', fontWeight: 'bold' }}>PhysioSync Clinical Workspace</h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Custom Interactive Rehabilitation Prescriptions</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}<br />
                  <strong>Ref ID:</strong> {refId}
                </div>
              </div>

              {/* Patient Meta Block */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '0.8rem' }}>
                <div>
                  <strong>Diagnosis / Case:</strong> {diagnosis || 'General Musculoskeletal Rehab'}<br />
                  <strong>Current Pain Score:</strong> {painScore}/10 (VAS)
                </div>
                <div>
                  <strong>Prescribed Plan:</strong> {plan.summary}<br />
                  <strong>Clinical Status:</strong> Active (Self-Corrective Adjustments Enabled)
                </div>
              </div>

              {/* Phased Report Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {plan.phases.map((phase, idx) => (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0d9488', textTransform: 'uppercase' }}>{phase.phase}</span>
                      <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', color: '#0f172a' }}>{phase.title}</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '0.75rem' }}>
                      <div>
                        <strong style={{ color: '#059669' }}>Target Exit Milestones:</strong>
                        <ul style={{ paddingLeft: '14px', margin: '4px 0 0 0' }}>
                          {phase.goals.map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                      <div>
                        <strong style={{ color: '#dc2626' }}>Safety Restrictions:</strong>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', lineHeight: '1.4' }}>{phase.restrictions}</p>
                      </div>
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.75rem' }}>Prescribed Exercises:</strong>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px', fontSize: '0.75rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Exercise Name</th>
                            <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Target Parameters</th>
                            <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>RPE Target</th>
                            <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Tissue Load</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phase.exercises.map((ex, i) => {
                            const paramsObj = getAdjustedParameters(ex, painScore);
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px', fontWeight: '500', border: '1px solid #cbd5e1' }}>{ex.name}</td>
                                <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{paramsObj.parameters}</td>
                                <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{paramsObj.rpe}</td>
                                <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{paramsObj.load}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clinical Nutrition & Supplement Prescription (Print Section) */}
              {plan.diet && (
                <div style={{ borderTop: '2px solid #0d9488', paddingTop: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ margin: 0, color: '#0d9488', fontSize: '1.2rem', fontWeight: 'bold' }}>Clinical Recovery Nutrition Prescription</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div>
                      <strong>Caloric Target:</strong> {plan.diet.calories} Kcal / Day<br />
                      <strong>Macronutrients:</strong><br />
                      • Protein: {Math.round(plan.diet.macros.protein + (painScore * 1.5))}g<br />
                      • Carbs: {plan.diet.macros.carbs}g<br />
                      • Fats: {plan.diet.macros.fat}g
                    </div>
                    <div>
                      <strong>Recovery Focus:</strong> {plan.diet.focus}<br />
                      <strong>Hydration Goal:</strong> {plan.diet.hydration}<br />
                      <strong>Diet Preference:</strong> {dietPreference}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#059669' }}>Recommended Recovery Foods ({dietPreference}):</strong>
                      <ul style={{ paddingLeft: '14px', margin: '4px 0 0 0' }}>
                        {plan.diet.recommendedFoods[dietPreference].map((food, i) => <li key={i}>{food}</li>)}
                      </ul>
                    </div>
                    <div>
                      <strong style={{ color: '#dc2626' }}>Foods to Limit/Avoid:</strong>
                      <ul style={{ paddingLeft: '14px', margin: '4px 0 0 0' }}>
                        {plan.diet.avoidFoods.map((food, i) => <li key={i}>{food}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <strong style={{ fontSize: '0.75rem' }}>Prescribed Supplements:</strong>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px', fontSize: '0.75rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                          <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Supplement</th>
                          <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Daily Dosage</th>
                          <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Timing</th>
                          <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Clinical Rationale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.diet.supplements.map((supp, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px', fontWeight: '500', border: '1px solid #cbd5e1' }}>{supp.name}</td>
                            <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{supp.dose}</td>
                            <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{supp.timing}</td>
                            <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{supp.rationale}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Report Footer */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Report generated by PhysioSync AI Engine</span>
                <span style={{ fontStyle: 'italic' }}>Authorized Clinician Signature: _______________________</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Protocol Modal */}
      {showModifyModal && (
        <div className="no-print-bg" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '800px',
            background: '#ffffff',
            color: '#0f172a',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSignature size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Modify Clinical Protocol</h3>
              </div>
              <button 
                onClick={() => setShowModifyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
              {tempPhases.map((phase, pIdx) => (
                <div key={pIdx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{phase.phase}</span>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a' }}>{phase.title}</h4>
                    </div>
                    <button 
                      className="glass-button"
                      style={{ padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleAddTempExercise(pIdx)}
                    >
                      <Plus size={12} /> Add Exercise
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {phase.exercises.map((ex, eIdx) => (
                      <div key={eIdx} style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Name and Params row */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Exercise Name</label>
                            <input 
                              type="text" 
                              value={ex.name} 
                              onChange={(e) => handleUpdateTempExercise(pIdx, eIdx, 'name', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#000000' }}
                            />
                          </div>
                          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Parameters</label>
                            <input 
                              type="text" 
                              value={ex.parameters} 
                              onChange={(e) => handleUpdateTempExercise(pIdx, eIdx, 'parameters', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#000000' }}
                            />
                          </div>
                          <button 
                            onClick={() => handleRemoveTempExercise(pIdx, eIdx)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: 'var(--danger)', 
                              padding: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              alignSelf: 'center',
                              marginBottom: '2px'
                            }}
                            title="Delete Exercise"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* RPE and Load row */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>RPE Target</label>
                            <input 
                              type="text" 
                              value={ex.rpe} 
                              onChange={(e) => handleUpdateTempExercise(pIdx, eIdx, 'rpe', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#000000' }}
                            />
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Tissue Load</label>
                            <select 
                              value={ex.load} 
                              onChange={(e) => handleUpdateTempExercise(pIdx, eIdx, 'load', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#000000', height: '31px' }}
                            >
                              <option value="Low">Low</option>
                              <option value="Moderate">Moderate</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                        </div>

                        {/* Rationale row */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Physiological Rationale</label>
                          <textarea 
                            value={ex.rationale} 
                            onChange={(e) => handleUpdateTempExercise(pIdx, eIdx, 'rationale', e.target.value)}
                            style={{ width: '100%', height: '50px', resize: 'none', padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#000000', fontFamily: 'inherit' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button 
                className="glass-button" 
                style={{ background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 16px', fontSize: '0.8rem' }}
                onClick={() => setShowModifyModal(false)}
              >
                Cancel
              </button>
              <button 
                className="glass-button" 
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                onClick={handleSaveModifiedProtocol}
              >
                Save & Update Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 2000,
          fontSize: '0.85rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle size={16} style={{ color: '#10b981' }} />
          {toastMessage}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="no-print-bg" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '450px',
            background: '#ffffff',
            color: '#0f172a',
            padding: '30px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            animation: 'scaleIn 0.3s ease'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <CheckCircle size={36} />
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: '#0f172a' }}>Plan Approved!</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                The rehabilitation protocol has been locked and successfully synchronized with the patient portal and the clinical logbook.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
              <button 
                className="glass-button" 
                style={{ flex: 1, background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px', fontSize: '0.85rem' }}
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
              <button 
                className="glass-button" 
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowPrintModal(true);
                }}
              >
                Print Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentPlanner;
