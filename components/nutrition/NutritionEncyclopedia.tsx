import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────

type Seg          = string | { t: string; url: string };
type TopicSection = { heading: string; body: Seg[] };
type Topic        = {
  id: string; icon: string; title: string;
  subtitle: string; accent: string;
  sections: TopicSection[];
};

// ─── RichText component ───────────────────────────────────────

function RichText({ segs, style }: { segs: Seg[]; style?: object }) {
  return (
    <Text style={style as any}>
      {segs.map((seg, i) =>
        typeof seg === 'string' ? (
          <Text key={i}>{seg}</Text>
        ) : (
          <Text key={i} style={styles.inlineLink} onPress={() => Linking.openURL(seg.url)}>
            {seg.t}
          </Text>
        )
      )}
    </Text>
  );
}

// ─── Encyclopedia content ─────────────────────────────────────

const TOPICS: Topic[] = [
  {
    id: 'protein',
    icon: 'barbell-outline',
    title: 'Protein',
    subtitle: 'Amino acids, MPS & protein quality',
    accent: '#E07B54',
    sections: [
      {
        heading: 'What Is Protein?',
        body: [
          'Proteins are large biomolecules assembled from chains of ',
          { t: 'amino acids', url: 'https://en.wikipedia.org/wiki/Amino_acid' },
          ' linked by peptide bonds. They are the structural and functional foundation of every cell — from muscle fibres and enzymes to hormones and antibodies. Each gram of protein provides 4 kcal of energy, the same as carbohydrates, but protein plays a far broader biological role than mere energy supply.\n\nOf the 20 standard amino acids, 9 are ',
          { t: 'essential amino acids', url: 'https://en.wikipedia.org/wiki/Essential_amino_acid' },
          ' (EAA) that the body cannot synthesise: histidine, isoleucine, ',
          { t: 'leucine', url: 'https://en.wikipedia.org/wiki/Leucine' },
          ', lysine, methionine, phenylalanine, threonine, tryptophan, and valine. These must be obtained from food. The remaining 11 are non-essential (the body synthesises them) and 2 are conditionally essential — glutamine and arginine — meaning they become essential under physiological stress such as illness, surgery, or intense training.\n\nProteins are continually broken down and rebuilt in a process called ',
          { t: 'protein turnover', url: 'https://en.wikipedia.org/wiki/Protein_turnover' },
          '. Skeletal muscle alone turns over at roughly 1–2% per day. This constant flux means that dietary protein is not merely building new tissue but sustaining the entire dynamic pool of body proteins.',
        ],
      },
      {
        heading: 'Complete vs Incomplete Proteins',
        body: [
          'A ',
          { t: 'complete protein', url: 'https://en.wikipedia.org/wiki/Complete_protein' },
          ' contains all 9 essential amino acids in proportions that match human needs. Animal sources — meat, fish, eggs, and dairy — are universally complete. Most plant sources are incomplete; they lack or are very low in one or more EAA (e.g., lysine is the limiting amino acid in most grains; methionine is limiting in legumes).\n\nHowever, combining grains with legumes across the day (rice + beans, oats + lentil soup) supplies all EAA even if no single meal is complete. Exceptions include plant foods that are complete in isolation: ',
          { t: 'soy', url: 'https://en.wikipedia.org/wiki/Soy_protein' },
          ', ',
          { t: 'quinoa', url: 'https://en.wikipedia.org/wiki/Quinoa' },
          ', buckwheat, and hemp seed.\n\nProtein quality is also assessed by the ',
          { t: 'Digestible Indispensable Amino Acid Score', url: 'https://en.wikipedia.org/wiki/DIAAS' },
          ' (DIAAS), the gold-standard metric endorsed by the FAO. It accounts for both amino acid profile and true ileal digestibility. Whey protein scores above 1.0 (DIAAS >100%), indicating it exceeds human amino acid requirements. Pea and rice protein score lower (0.6–0.8) but can be blended to approach the profile of whey.',
        ],
      },
      {
        heading: 'Muscle Protein Synthesis',
        body: [
          { t: 'Muscle protein synthesis', url: 'https://en.wikipedia.org/wiki/Muscle_protein_synthesis' },
          ' (MPS) is the cellular process by which muscle fibres repair and grow in response to resistance training and dietary protein. It is regulated primarily by the ',
          { t: 'mTORC1 pathway', url: 'https://en.wikipedia.org/wiki/MTOR' },
          ' — a serine-threonine kinase that acts as the master switch for protein biosynthesis and cell growth in muscle.\n\n',
          { t: 'Leucine', url: 'https://en.wikipedia.org/wiki/Leucine' },
          ' — a ',
          { t: 'branched-chain amino acid', url: 'https://en.wikipedia.org/wiki/Branched-chain_amino_acid' },
          ' (BCAA) — is the key anabolic signal. It activates mTORC1 through multiple mechanisms, including binding to leucyl-tRNA synthetase and sestrin 2 proteins. Approximately 2–3 g of leucine per meal is required to maximally stimulate MPS in a well-fed adult. Whey protein concentrate provides 10–12 g of leucine per 100 g, making it the richest dietary source per gram of protein.\n\nFor hypertrophy, the evidence-backed recommendation is 1.6–2.2 g of protein per kg of bodyweight per day, distributed across 3–5 meals. Research suggests diminishing returns above 2.2 g/kg/day for natural athletes, though higher intakes (up to 3.1 g/kg/day) are safe and can assist during aggressive fat-loss phases by preserving lean mass.\n\nResistance exercise and protein intake are synergistic: exercise increases the sensitivity of muscle to amino acids for up to 24–48 hours post-session, meaning protein consumed well after training still contributes to net anabolism.',
        ],
      },
      {
        heading: 'Protein Sources & Supplementation',
        body: [
          '• ',
          { t: 'Whey protein', url: 'https://en.wikipedia.org/wiki/Whey_protein' },
          ': fast-digesting (peaks in blood at ~60 min), highest leucine content (~10–12%), ideal post-workout; concentrate, isolate, and hydrolysate forms differ mainly in fat/lactose content.\n• ',
          { t: 'Casein', url: 'https://en.wikipedia.org/wiki/Casein' },
          ': slow, sustained release (gastric emptying over 5–7 hrs); micellar casein before sleep (40 g) increases overnight MPS by ~22% and next-morning net protein balance.\n• Egg white: DIAAS ~1.48; excellent bioavailability; moderate leucine; versatile cooked or as supplement.\n• Collagen peptides: low in tryptophan; not a standalone muscle builder, but 10–15 g taken with vitamin C 30–60 min before exercise may improve tendon/ligament collagen synthesis by stimulating ',
          { t: 'fibroblast', url: 'https://en.wikipedia.org/wiki/Fibroblast' },
          ' activity and hydroxyproline production.\n• Soy: the most effective plant protein for MPS due to complete EAA profile; DIAAS ~0.91–1.0; contains ',
          { t: 'phytoestrogens', url: 'https://en.wikipedia.org/wiki/Phytoestrogen' },
          ' (isoflavones), but clinical evidence shows no harmful hormonal effects at typical intakes.\n• Pea + rice blend: approaching whey-comparable MPS response in recent trials; a practical option for vegans.',
        ],
      },
      {
        heading: 'Practical Distribution Strategy',
        body: [
          'Distributing protein evenly across meals maximises 24-hour MPS. A landmark 2012 study showed that consuming 4 × 20 g doses of whey over the day stimulated MPS more effectively than 2 × 40 g or 8 × 10 g doses. Target ~0.4 g/kg of bodyweight per meal.\n\nFor a 80 kg person: 4 meals × 32 g protein = 128 g/day — meeting the lower bound of the 1.6–2.2 g/kg range. Increasing total daily intake while maintaining distribution rather than loading single meals is the most practical upgrade.\n\nPre-sleep protein (casein or cottage cheese) deserves specific attention: sleep is the longest fasting period of the day. Ingesting 30–40 g of slow-digesting protein before sleep significantly elevates overnight muscle protein balance without impairing fat metabolism or morning appetite in most individuals.',
        ],
      },
    ],
  },
  {
    id: 'carbohydrates',
    icon: 'flash-outline',
    title: 'Carbohydrates',
    subtitle: 'Energy, glycogen & the glycaemic index',
    accent: '#E0A854',
    sections: [
      {
        heading: 'What Are Carbohydrates?',
        body: [
          "Carbohydrates are the body's preferred and most efficient fuel source for high-intensity work, providing 4 kcal per gram. Chemically they are polyhydroxy aldehydes or ketones and their derivatives, classified by chain length into monosaccharides (glucose, fructose), disaccharides (sucrose, lactose), oligosaccharides, and polysaccharides (starch, glycogen, cellulose).\n\nIngested carbohydrates are broken down to glucose, enter the bloodstream, and are taken up by cells for immediate energy or stored as ",
          { t: 'glycogen', url: 'https://en.wikipedia.org/wiki/Glycogen' },
          ' in the liver (~100 g) and skeletal muscle (~400 g in a 70 kg person). Muscle glycogen is the dominant fuel for exercise above ~65% VO2max and is indispensable for high-intensity sprint and resistance training.\n\nFibre — the third major carbohydrate category — is indigestible by human enzymes but is fermented by gut bacteria, yielding ',
          { t: 'short-chain fatty acids', url: 'https://en.wikipedia.org/wiki/Short-chain_fatty_acid' },
          ' (SCFAs) like butyrate, propionate, and acetate. These SCFAs nourish colonocytes, modulate immune function, and exert systemic metabolic effects including improving insulin sensitivity.',
        ],
      },
      {
        heading: 'Glycaemic Index & Insulin',
        body: [
          'The ',
          { t: 'glycaemic index', url: 'https://en.wikipedia.org/wiki/Glycemic_index' },
          ' (GI) ranks foods by how quickly they raise blood glucose compared to pure glucose (GI = 100). High-GI foods (white bread ~75, sports drinks ~78) trigger a sharp ',
          { t: 'insulin', url: 'https://en.wikipedia.org/wiki/Insulin' },
          ' spike. Insulin is the primary anabolic hormone: it drives glucose and amino acids into cells, suppresses fat breakdown (lipolysis), and promotes glycogen synthesis.\n\nGlycaemic load (GL) extends GI by accounting for portion size: GL = GI × grams of carbohydrate per serving ÷ 100. A food can have a high GI but low GL (watermelon: GI ~72, GL ~4 per typical serving). For blood glucose management and sustained energy, GL is the more practical metric.\n\nFor most meals, favour lower-GI sources — oats, legumes, most vegetables, basmati rice — that provide stable energy and support appetite regulation. Around training windows, higher-GI carbohydrates are beneficial: they accelerate ',
          { t: 'glycogen', url: 'https://en.wikipedia.org/wiki/Glycogen' },
          ' resynthesis because post-exercise muscle insulin sensitivity is temporarily elevated and the GI of the carbohydrate source matters less during this recovery phase.',
        ],
      },
      {
        heading: 'Dietary Fibre',
        body: [
          { t: 'Dietary fibre', url: 'https://en.wikipedia.org/wiki/Dietary_fiber' },
          ' is the indigestible fraction of plant carbohydrates, classified as soluble (dissolves in water, forms gel, fermented by gut bacteria) and insoluble (does not dissolve, adds bulk, speeds gut transit).\n\nSoluble fibre (beta-glucan in oats, pectin in fruit, inulin in chicory) lowers LDL cholesterol by binding bile acids in the intestine and forcing the liver to use cholesterol to make more. It also slows glucose absorption, blunting the glycaemic response of a meal. Insoluble fibre (cellulose, hemi-cellulose in wheat bran) promotes bowel regularity and reduces colorectal cancer risk.\n\nThe ',
          { t: 'prebiotic', url: 'https://en.wikipedia.org/wiki/Prebiotic_(nutrition)' },
          ' effect of fermentable fibre feeds beneficial gut bacteria (Bifidobacterium, Lactobacillus), which produce SCFAs and modulate systemic inflammation and immunity.\n\nRecommended daily intake: 25 g (women) to 38 g (men) per day in the USA; 30 g/day in the UK. Most Western populations consume only 15–17 g/day. Best sources: psyllium husk (~7 g/tbsp), oat bran (~4 g/30 g), lentils (~8 g/100 g cooked), split peas, chia seeds, artichoke, and most cruciferous vegetables.',
        ],
      },
      {
        heading: 'Carbs Around Training',
        body: [
          '• Pre-workout (1–2 hrs): 1–4 g/kg of moderate-GI carbohydrates with protein; avoid high fat or fibre, which delay gastric emptying and can cause GI distress. A higher dose (3–4 g/kg) is warranted for endurance events lasting >90 min.\n• Intra-workout: for sessions > 60 min at moderate-to-high intensity, 30–60 g/hr of fast carbohydrates (banana, sports drink, gels) maintains blood glucose and spares muscle glycogen. Using glucose + fructose mixtures allows absorption of up to 90 g/hr via independent intestinal transporters (SGLT1 for glucose, GLUT5 for fructose).\n• Post-workout: 1–1.2 g/kg within 30–60 min alongside 20–40 g of protein for rapid ',
          { t: 'glycogen', url: 'https://en.wikipedia.org/wiki/Glycogen' },
          ' resynthesis. Post-exercise muscle insulin sensitivity is elevated for 2–4 hours, so the glycaemic index of the carbohydrate source matters less during this window.\n• ',
          { t: 'Carbohydrate loading', url: 'https://en.wikipedia.org/wiki/Carbohydrate_loading' },
          ': consuming 10–12 g/kg/day for 36–72 hrs before an endurance event can supercompensate glycogen stores ~20% above baseline, delaying fatigue onset. Tapering training simultaneously ensures glycogen is not depleted during this period.',
        ],
      },
    ],
  },
  {
    id: 'fats',
    icon: 'water-outline',
    title: 'Dietary Fats',
    subtitle: 'Hormones, omega-3 & essential lipids',
    accent: '#54B0E0',
    sections: [
      {
        heading: 'Why Fats Are Essential',
        body: [
          'Dietary fats (lipids) provide 9 kcal/g — more than twice the caloric density of carbohydrates or protein. Despite being demonised in the low-fat era (1980s–1990s), fat is indispensable to human health and cannot be eliminated without serious physiological consequences.\n\nKey roles of dietary fat:\n• Synthesising ',
          { t: 'steroid hormones', url: 'https://en.wikipedia.org/wiki/Steroid_hormone' },
          ' (testosterone, oestrogen, cortisol, DHEA) — all derived from cholesterol\n• Absorbing fat-soluble vitamins A, D, E, and K (these require dietary fat for intestinal absorption and transport)\n• Constructing every cell membrane via the ',
          { t: 'phospholipid bilayer', url: 'https://en.wikipedia.org/wiki/Lipid_bilayer' },
          '\n• Insulating and protecting nerves via the ',
          { t: 'myelin sheath', url: 'https://en.wikipedia.org/wiki/Myelin' },
          ' (60% of the brain is fat)\n• Providing sustained fuel at low-to-moderate exercise intensities via ',
          { t: 'beta-oxidation', url: 'https://en.wikipedia.org/wiki/Beta_oxidation' },
          ' in the mitochondria\n• Synthesising ',
          { t: 'eicosanoids', url: 'https://en.wikipedia.org/wiki/Eicosanoid' },
          ' (prostaglandins, thromboxanes, leukotrienes) — potent local signalling molecules that regulate inflammation, platelet aggregation, and immune responses\n\nVery low-fat diets (< 15% of calories) are associated with suppression of testosterone production and disruption of menstrual cycles in female athletes.',
        ],
      },
      {
        heading: 'Types of Dietary Fat',
        body: [
          '• ',
          { t: 'Saturated fat', url: 'https://en.wikipedia.org/wiki/Saturated_fat' },
          ' (SFA): no carbon–carbon double bonds; solid at room temperature; animal fats, butter, coconut oil, palm oil. Structurally stable and resistant to oxidation — good for high-heat cooking. Moderate intake (~10% of calories) is considered safe; they raise both LDL and HDL; the relationship with cardiovascular disease is more nuanced than once believed and depends heavily on the food matrix.\n• ',
          { t: 'Monounsaturated fat', url: 'https://en.wikipedia.org/wiki/Monounsaturated_fat' },
          ' (MUFA): one double bond; liquid at room temperature; olive oil, avocado, almonds, macadamia. Consistently associated with reduced LDL without lowering HDL; the Mediterranean diet, rich in MUFAs, is among the most evidence-backed dietary patterns for cardiovascular health.\n• ',
          { t: 'Polyunsaturated fat', url: 'https://en.wikipedia.org/wiki/Polyunsaturated_fat' },
          ' (PUFA): multiple double bonds; omega-3 and omega-6 types; essential — must be obtained from diet; unstable and susceptible to oxidation at high heat.\n• ',
          { t: 'Trans fats', url: 'https://en.wikipedia.org/wiki/Trans_fat' },
          ': industrially produced by partial hydrogenation of vegetable oils; significantly raise LDL, lower HDL, promote systemic inflammation; strongly associated with cardiovascular disease; largely banned in the USA and EU but still present in some processed foods. Naturally occurring trans fats in ruminant dairy (conjugated linoleic acid, CLA) are structurally different and are not considered harmful.',
        ],
      },
      {
        heading: 'Omega-3 & Omega-6 Fatty Acids',
        body: [
          'Both omega-3 and omega-6 are essential polyunsaturated fats (PUFAs) the body cannot synthesise and must obtain from food.\n\n',
          { t: 'EPA', url: 'https://en.wikipedia.org/wiki/Eicosapentaenoic_acid' },
          ' (eicosapentaenoic acid) and ',
          { t: 'DHA', url: 'https://en.wikipedia.org/wiki/Docosahexaenoic_acid' },
          ' (docosahexaenoic acid) are the most biologically active ',
          { t: 'omega-3 fatty acids', url: 'https://en.wikipedia.org/wiki/Omega-3_fatty_acid' },
          '. They are found preformed in oily fish (salmon, mackerel, sardines) and algae oil. ALA (alpha-linolenic acid), found in flaxseed and walnuts, must be converted to EPA/DHA in the body, but conversion is inefficient (~5–10%), making direct marine sources far superior.\n\nOmega-3s compete with omega-6s for the same enzymes (COX, LOX) that produce eicosanoids. Higher omega-3 intake shifts eicosanoid production toward less inflammatory forms. The typical Western diet has an omega-6:omega-3 ratio of 15–20:1; an evidence-backed target is closer to 4:1 or lower.\n\nFDA-approved prescription omega-3 drugs (Vascepa, Lovaza) are used to reduce serum triglycerides. At 2–4 g/day, EPA+DHA reliably reduces triglycerides by 15–30%. Evidence for cardiovascular mortality reduction is strongest for EPA alone at pharmacological doses.\n\nFor athletes: EPA+DHA may reduce post-exercise muscle soreness and inflammation. The FDA considers up to 3 g/day from supplements safe for most adults. Algae-based omega-3 supplements are the most sustainable and vegan-appropriate source.',
        ],
      },
      {
        heading: 'Fat Intake Targets',
        body: [
          'Evidence-based recommendations for dietary fat:\n\n• Total fat: 20–35% of total daily calories is the widely accepted range; below 20% impairs fat-soluble vitamin absorption and hormone production.\n• Never go below 0.5 g/kg bodyweight per day — this threshold protects testosterone and reproductive hormone levels in both sexes.\n• SFA: keep below 10% of total calories; replace with MUFAs or PUFAs rather than refined carbohydrates.\n• Omega-3 (EPA+DHA): 2–3 g/day for athletes seeking anti-inflammatory benefits; minimum 250 mg/day for general population.\n• Omega-6 (LA): approximately 5–10% of calories; already abundant in most Western diets. Avoid dramatically increasing omega-6 intake (seed-oil heavy ultra-processed foods) as this worsens the omega-6:omega-3 ratio.\n• Prioritise fat quality over quantity: whole food fat sources (avocado, nuts, oily fish, extra virgin olive oil, eggs) carry co-occurring micronutrients, antioxidants, and superior fatty acid profiles compared to extracted oils and processed fat-containing foods.',
        ],
      },
    ],
  },
  {
    id: 'vitamins',
    icon: 'leaf-outline',
    title: 'Vitamins',
    subtitle: 'Fat-soluble & water-soluble essentials',
    accent: '#54C47E',
    sections: [
      {
        heading: 'Fat-Soluble Vitamins (A, D, E, K)',
        body: [
          'Fat-soluble vitamins are stored in adipose tissue and the liver. Because they accumulate, overdose is possible with excess supplementation — a consideration distinct from water-soluble vitamins.\n\n• ',
          { t: 'Vitamin A', url: 'https://en.wikipedia.org/wiki/Vitamin_A' },
          ' (retinol / beta-carotene): essential for vision (rhodopsin synthesis), epithelial cell differentiation, immune function, and embryonic development. Found preformed as retinol in liver, dairy, and eggs; as pro-vitamin A carotenoids in orange/yellow vegetables. Retinol is teratogenic in excess (>3,000 µg RAE/day); beta-carotene from plant foods is not.\n\n• ',
          { t: 'Vitamin D', url: 'https://en.wikipedia.org/wiki/Vitamin_D' },
          '3 (cholecalciferol): synthesised in the skin from UVB exposure; converted in the liver to 25(OH)D (storage form) and then in the kidney to the active hormone 1,25(OH)2D (calcitriol). Regulates calcium and phosphorus absorption for bone mineralisation, modulates over 200 genes including immune and muscle function genes. Globally over 1 billion people are deficient. Athletes with deficiency face elevated stress fracture risk and impaired muscle function; benefits plateau at serum levels of ~50 ng/mL. Typical supplementation dose: 1,000–4,000 IU/day; upper safe limit is 4,000 IU/day per US guidelines.\n\n• ',
          { t: 'Vitamin E', url: 'https://en.wikipedia.org/wiki/Vitamin_E' },
          ' (alpha-tocopherol): lipid-soluble ',
          { t: 'antioxidant', url: 'https://en.wikipedia.org/wiki/Antioxidant' },
          ' that protects PUFA-rich cell membranes from lipid peroxidation. Found in sunflower seeds, almonds, wheat germ oil, and avocado. Note: high-dose supplementation (>400 IU/day) may actually blunt beneficial cellular adaptations to exercise by reducing reactive oxygen species signalling.\n\n• ',
          { t: 'Vitamin K', url: 'https://en.wikipedia.org/wiki/Vitamin_K' },
          ': K1 (phylloquinone) from leafy greens activates clotting factors. K2 (menaquinone, MK-4 to MK-7) from fermented foods and animal liver activates osteocalcin (directs calcium into bone) and Matrix Gla Protein (prevents vascular calcification). K2 works synergistically with vitamin D3 — D3 increases calcium absorption while K2 ensures it is deposited in the right tissues.',
        ],
      },
      {
        heading: 'Water-Soluble Vitamins (B-complex & C)',
        body: [
          'Water-soluble vitamins are not stored in significant amounts (except B12 in the liver, 2–5 year reserve). Excess is excreted in urine, making daily intake important but overdose from food largely impossible.\n\n• ',
          { t: 'Vitamin B1', url: 'https://en.wikipedia.org/wiki/Thiamine' },
          ' (thiamine): cofactor in carbohydrate metabolism (pyruvate dehydrogenase, alpha-ketoglutarate dehydrogenase); critical for nerve function; deficiency causes beriberi and Wernicke encephalopathy.\n• B2 (riboflavin): component of FAD and FMN, essential for the electron transport chain and fatty acid oxidation; deficiency causes stomatitis and photophobia.\n• ',
          { t: 'B3 (niacin)', url: 'https://en.wikipedia.org/wiki/Niacin' },
          ': forms NAD+ and NADP+ — the most important cellular redox cofactors; participates in >400 enzymatic reactions including ATP synthesis, DNA repair, and sirtuins. Pharmacological doses (1–3 g/day) significantly raise HDL cholesterol.\n• B5 (pantothenic acid): component of coenzyme A; essential for the Krebs cycle and fatty acid synthesis.\n• B6 (pyridoxine): cofactor for >100 enzyme reactions in amino acid metabolism; essential for neurotransmitter synthesis (serotonin, dopamine, GABA) and haemoglobin production.\n• ',
          { t: 'Vitamin B9', url: 'https://en.wikipedia.org/wiki/Folate' },
          ' (folate): essential for one-carbon metabolism, DNA synthesis, methylation reactions, and cell division; deficiency during pregnancy causes neural tube defects; found in dark leafy greens, legumes, liver.\n• ',
          { t: 'Vitamin B12', url: 'https://en.wikipedia.org/wiki/Vitamin_B12' },
          ' (cobalamin): required for myelin sheath synthesis, red blood cell formation, and DNA methylation; found exclusively in animal products; vegans must supplement. Deficiency is insidious — it may take years to manifest as megaloblastic anaemia or neurological damage after the liver\'s B12 reserves are exhausted.\n• ',
          { t: 'Vitamin C', url: 'https://en.wikipedia.org/wiki/Vitamin_C' },
          ' (ascorbic acid): potent water-soluble ',
          { t: 'antioxidant', url: 'https://en.wikipedia.org/wiki/Antioxidant' },
          '; essential for ',
          { t: 'collagen', url: 'https://en.wikipedia.org/wiki/Collagen' },
          ' synthesis (hydroxylation of proline and lysine in collagen triple helix); enhances non-haem iron absorption (reduces Fe³⁺ → Fe²⁺); supports immune function; found in citrus, kiwi, bell peppers, broccoli. The RDA (75–90 mg/day) is sufficient to prevent scurvy; athletes and smokers may benefit from 200–500 mg/day.',
        ],
      },
      {
        heading: 'Vitamins for Athletic Performance',
        body: [
          'Certain vitamins deserve particular attention for individuals engaged in regular intense training:\n\n• Vitamin D: likely the highest-impact supplement for most athletes. Deficiency is widespread (especially in indoor athletes, dark-skinned individuals, and northern latitudes), impairs muscle function, immune defence, and bone resilience. Testing serum 25(OH)D and targeting 40–60 ng/mL is a practical approach.\n• B12 and folate: plant-based athletes are at substantial risk of deficiency. Both are critical for red blood cell production and optimal oxygen-carrying capacity — directly relevant to endurance performance.\n• Vitamin C: alongside collagen peptides before training, vitamin C may support connective tissue synthesis and reduce tendon/ligament injury risk — an emerging but promising area of sports nutrition research.\n• Antioxidant vitamins (C and E) in high supplemental doses: paradoxically may blunt some training adaptations by quenching the reactive oxygen species that trigger mitochondrial biogenesis and antioxidant enzyme upregulation. Obtaining antioxidants from whole foods is generally preferred over mega-dose supplements.',
        ],
      },
    ],
  },
  {
    id: 'minerals',
    icon: 'diamond-outline',
    title: 'Minerals',
    subtitle: 'Calcium, iron, magnesium & electrolytes',
    accent: '#A07FD0',
    sections: [
      {
        heading: 'Macrominerals',
        body: [
          'Macrominerals are required in amounts greater than 100 mg/day:\n\n• Calcium: the most abundant mineral in the body (~1 kg in a 70 kg adult; 99% in bones and teeth). Essential for bone mineralisation, muscle contraction, neurotransmitter release, and blood clotting. Dietary sources: dairy, fortified plant milks, tofu set with calcium sulfate, tinned salmon/sardines with bones, leafy greens (kale, bok choy). Absorption is enhanced by vitamin D and inhibited by oxalates (spinach, rhubarb) and phytates (unprocessed bran).\n\n• Phosphorus: second most abundant mineral; forms ATP, DNA, RNA, and phospholipid membranes; works with calcium in bone; found in virtually all protein-containing foods — deficiency is rare in adults.\n\n• ',
          { t: 'Magnesium', url: 'https://en.wikipedia.org/wiki/Magnesium_in_biology' },
          ': cofactor for over 300 enzymatic reactions including every reaction that uses or synthesises ATP (notably, ATP must bind a magnesium ion to be biologically active). Essential for DNA/RNA synthesis, muscle relaxation (calcium triggers contraction; magnesium triggers relaxation), insulin signalling, and protein synthesis. Research links adequate magnesium to significant gains in testosterone production (10 mg/kg bodyweight/day). Depleted by heavy sweating, diuretics, alcohol, and high caffeine intake. Rich sources: pumpkin seeds (~303 mg per ¼ cup), chia seeds, dark chocolate, almonds, spinach, buckwheat. Adult RDA: 400–420 mg/day (men), 310–320 mg/day (women).\n\n• Sodium and chloride: primary extracellular electrolytes; regulate fluid balance, blood pressure, and nerve signalling. Discussed further under electrolytes below.',
        ],
      },
      {
        heading: 'Trace Minerals for Athletes',
        body: [
          '• Iron: core component of ',
          { t: 'haemoglobin', url: 'https://en.wikipedia.org/wiki/Hemoglobin' },
          ' (transports O2 in red blood cells) and myoglobin (O2 storage in muscle). Iron deficiency is the world\'s most prevalent nutritional deficiency; female athletes, endurance athletes, and vegetarians are at highest risk. Haem iron (red meat, poultry, fish) has ~25–30% bioavailability; non-haem iron (plant foods, eggs) has 2–10% bioavailability but is significantly enhanced by simultaneous vitamin C intake and impaired by calcium, tannins (tea/coffee), and phytates. Ferritin (iron stores) should be tested routinely in high-training-volume athletes.\n\n• ',
          { t: 'Zinc', url: 'https://en.wikipedia.org/wiki/Zinc#Biological_role' },
          ': essential for testosterone biosynthesis, immune function, protein synthesis, wound healing, and >300 enzymatic reactions. Heavily athletes may lose zinc in sweat. Rich sources: oysters (highest per gram), beef, pumpkin seeds, cashews. Zinc and copper compete for absorption — chronic high-dose zinc supplementation can deplete copper.\n\n• Iodine: required for thyroid hormone synthesis (T3 and T4), which regulate metabolic rate, growth, and development. Deficiency impairs metabolism and, in pregnancy, causes cretinism. Main sources: iodised salt, seaweed, dairy, seafood.\n\n• Selenium: antioxidant via glutathione peroxidase; supports thyroid function; found in Brazil nuts (1–2 nuts = full daily requirement of ~55 µg), seafood, and organ meats.',
        ],
      },
      {
        heading: 'Electrolytes',
        body: [
          { t: 'Electrolytes', url: 'https://en.wikipedia.org/wiki/Electrolyte' },
          ' are minerals that carry an electrical charge when dissolved in body fluids. They govern:\n• Fluid distribution between intracellular and extracellular compartments (osmolarity)\n• Nerve impulse conduction (action potentials)\n• Muscle contraction and relaxation\n• Acid-base (pH) balance\n\nKey electrolytes and their primary roles:\n• Sodium (Na⁺): chief extracellular cation; controls blood volume and pressure; 400–2,400 mg/litre lost in sweat depending on sweat rate and acclimatisation status.\n• Potassium (K⁺): chief intracellular cation; maintains resting membrane potential; critical for cardiac rhythm; banana, avocado, potato, coconut water.\n• Magnesium (Mg²⁺): muscle relaxation, ATP activity, nerve signalling; often depleted in high-volume athletes.\n• Calcium (Ca²⁺): triggers muscle contraction and neurotransmitter release.\n• Chloride (Cl⁻): pairs with sodium; maintains osmotic balance.\n\nReplacing electrolytes — not just water — is critical for sessions > 60 min or exercise in heat, to prevent ',
          { t: 'hyponatraemia', url: 'https://en.wikipedia.org/wiki/Hyponatremia' },
          ' (dangerously low blood sodium). Exercise-associated hyponatraemia occurs when excessive plain water is consumed without sodium replacement, diluting plasma sodium below 135 mmol/L. Symptoms progress from headache and nausea to confusion, seizures, and coma. It affects approximately 10% of endurance event participants who over-hydrate. Drinking to thirst and using electrolyte drinks during prolonged exercise is the evidence-based prevention strategy.',
        ],
      },
    ],
  },
  {
    id: 'dieting',
    icon: 'trending-up-outline',
    title: 'Dieting Effectively',
    subtitle: 'TDEE, caloric balance & practical strategies',
    accent: '#E05454',
    sections: [
      {
        heading: 'Energy Balance & TDEE',
        body: [
          'Body weight is fundamentally governed by the energy balance equation: calories consumed vs. calories expended. A sustained caloric surplus leads to weight gain; a sustained deficit leads to weight loss. While the equation is conceptually simple, its components are variable and interact in complex ways.\n\nTotal Daily Energy Expenditure (TDEE) has four components:\n• ',
          { t: 'Basal metabolic rate', url: 'https://en.wikipedia.org/wiki/Basal_metabolic_rate' },
          ' (BMR): energy required at complete physiological rest; accounts for ~60–70% of TDEE. Calculated most accurately by the Mifflin-St Jeor equation (1990), which is ~5% more accurate than the older Harris-Benedict formula. The largest predictor of BMR is fat-free mass (lean body mass explains ~62% of variance in BMR).\n• ',
          { t: 'Thermic effect of food', url: 'https://en.wikipedia.org/wiki/Thermic_effect_of_food' },
          ' (TEF): energy cost of digesting, absorbing, and metabolising food; ~10% of TDEE. Protein has the highest TEF (25–30%), carbohydrates 5–10%, fat 0–3%. Eating more protein intrinsically increases daily caloric expenditure.\n• ',
          { t: 'NEAT', url: 'https://en.wikipedia.org/wiki/Non-exercise_activity_thermogenesis' },
          ' (Non-Exercise Activity Thermogenesis): all movement that is not formal exercise — walking, fidgeting, posture maintenance. NEAT varies by up to 2,000 kcal/day between individuals and is highly adaptive; during overfeeding it increases, and during underfeeding it dramatically decreases, making it the most important variable in ',
          { t: 'adaptive thermogenesis', url: 'https://en.wikipedia.org/wiki/Adaptive_thermogenesis' },
          '.\n• Exercise Activity Thermogenesis (EAT): formal structured training; 5–15% of TDEE for most exercising adults.\n\nFor fat loss: a 200–500 kcal/day deficit produces sustainable 0.2–0.5 kg/week loss. Deficits > 1,000 kcal/day risk disproportionate muscle catabolism, hormonal disruption, and dramatic NEAT reduction that blunts actual fat loss.',
        ],
      },
      {
        heading: 'Macronutrient Targets',
        body: [
          'Protein, carbohydrates, and fat each serve specific roles. Evidence-based starting macronutrient targets (adjust for training volume and individual response):\n\n• Protein: 1.6–2.2 g/kg/day for muscle retention and growth. In a caloric deficit, higher end (2.2–3.1 g/kg/day) further preserves lean mass. Protein has the highest satiety per calorie of the three macronutrients and the highest thermic effect — making it the most effective macro for body recomposition.\n• Fats: 20–35% of total calories; never below 0.5 g/kg bodyweight — below this threshold, testosterone and oestrogen production are measurably suppressed in both sexes.\n• Carbohydrates: fill remaining calories after protein and fat targets are set. Scale carbohydrate intake to training volume — higher on heavy training days, lower on rest days (carbohydrate periodisation). Carbohydrates are not inherently fattening; total caloric excess is.\n\nCarbohydrate cycling (higher carbs on training days: ~3–5 g/kg; lower on rest days: ~1–2 g/kg) is a practical strategy to fuel performance while maintaining a weekly caloric deficit, without sacrificing training quality.',
        ],
      },
      {
        heading: 'Meal Timing',
        body: [
          'Research has refined — and in some cases deflated — the importance of precise meal timing:\n\n• The "anabolic window" is far wider than the once-popular "30-minute post-workout rule." Net muscle protein balance is elevated for up to 24–48 hours following a resistance session. Consuming protein within 2 hours of training is sufficient for most people.\n• 3–5 meals per day optimally distributes protein across the day for maximal MPS (target ~0.4 g/kg per meal).\n• Pre-workout (1–2 hrs): moderate-GI carbohydrates + protein; avoid high fat or fibre immediately before training as they slow gastric emptying.\n• Post-workout: fast-absorbing protein (whey) + carbohydrates for glycogen recovery; the combination is more effective than either alone due to the insulin-mediated uptake of amino acids.\n• Pre-sleep: 30–40 g of casein or cottage cheese supports overnight MPS during the body\'s longest fasting and repair window.\n• ',
          { t: 'Intermittent fasting', url: 'https://en.wikipedia.org/wiki/Intermittent_fasting' },
          ' (16:8 or 5:2): can improve adherence for many individuals and is metabolically equivalent to continuous caloric restriction when total intake is matched. However, compressing all protein into a narrow eating window may limit the number of protein meals and therefore MPS stimulus frequency — a relevant consideration for muscle-focused athletes.',
        ],
      },
      {
        heading: 'Adherence & Long-Term Success',
        body: [
          '• Consistency beats perfection: a moderate deficit maintained over months outperforms aggressive short cuts followed by compensatory overeating. Compliance is the strongest predictor of diet outcome across all diet types.\n• The 80/20 rule: 80% whole, minimally processed foods; 20% flexible prevents restriction-driven binge cycles. All rigid diet approaches have lower long-term adherence than flexible dieting strategies.\n• Diet breaks: 1–2 weeks at maintenance every 8–12 weeks of dieting attenuates ',
          { t: 'adaptive thermogenesis', url: 'https://en.wikipedia.org/wiki/Adaptive_thermogenesis' },
          ' — the progressive downregulation of TDEE (particularly via NEAT reduction) that occurs during prolonged caloric restriction. Metabolic adaptation can reduce TDEE by 250–500 kcal/day beyond predicted values after 12+ weeks of dieting.\n• Sleep: growth hormone is secreted in pulses during slow-wave sleep. Poor sleep (< 7 hrs) significantly raises ',
          { t: 'ghrelin', url: 'https://en.wikipedia.org/wiki/Ghrelin' },
          ' (hunger hormone) and lowers ',
          { t: 'leptin', url: 'https://en.wikipedia.org/wiki/Leptin' },
          ' (satiety hormone), systematically driving excess caloric intake the following day. Studies show a 55% increase in hunger with sleep restriction; sleep loss also specifically increases cravings for calorie-dense, high-carbohydrate foods.\n• Stress and ',
          { t: 'cortisol', url: 'https://en.wikipedia.org/wiki/Cortisol' },
          ': chronic psychological stress elevates cortisol, which increases appetite, promotes visceral fat storage, impairs glucose regulation, and elevates the hedonic drive for hyper-palatable foods. Stress management is a legitimate component of an effective fat-loss programme.',
        ],
      },
    ],
  },
  {
    id: 'hydration',
    icon: 'water-outline',
    title: 'Hydration',
    subtitle: 'Water, electrolytes & performance',
    accent: '#54A8E0',
    sections: [
      {
        heading: 'Why Hydration Matters',
        body: [
          'Water constitutes approximately 60% of total body mass and is the universal solvent and medium for every biochemical reaction. It regulates body temperature (sweat evaporation), transports nutrients and oxygen, lubricates joints, and participates directly in hydrolysis reactions throughout metabolism.\n\nEven mild ',
          { t: 'dehydration', url: 'https://en.wikipedia.org/wiki/Dehydration' },
          ' of 1–2% of bodyweight has measurable performance consequences:\n• Aerobic capacity and endurance output begin declining at 2% dehydration\n• Cognitive function and reaction time are impaired at as little as 1–1.5% loss\n• Core temperature rises more steeply with dehydration, accelerating heat stress\n• Maximal strength output decreases by up to 10% at 2–3% dehydration\n• Blood viscosity increases, reducing cardiac output efficiency\n\n',
          { t: 'Blood plasma', url: 'https://en.wikipedia.org/wiki/Blood_plasma' },
          ' is ~90% water. Adequate hydration maintains plasma volume — ensuring efficient delivery of oxygen and substrates to working muscle and prompt clearance of metabolic waste products including lactate, hydrogen ions, and CO2. Plasma volume contraction is one of the fastest routes by which dehydration impairs exercise capacity.',
        ],
      },
      {
        heading: 'How Much to Drink',
        body: [
          '• Baseline: 35–45 mL/kg bodyweight/day from all fluid sources (food contributes ~20% of total daily water intake; fruits and vegetables are 85–95% water).\n• Exercise: add approximately 400–600 mL/hr of moderate exercise; more in heat, high humidity, or high sweat rate individuals. Sweat rates vary enormously: 0.5–2.5 L/hr depending on intensity, environment, and individual.\n• Urine colour is the most accessible real-time hydration gauge:\n  – Pale straw yellow (1–3 on the urine colour chart) = well hydrated\n  – Dark yellow / amber (4–6) = dehydrated; drink immediately\n  – Clear = potentially over-hydrated; ',
          { t: 'hyponatraemia', url: 'https://en.wikipedia.org/wiki/Hyponatremia' },
          ' risk in prolonged exercise\n  – Dark brown: severe dehydration or rhabdomyolysis; seek medical attention\n• Morning bodyweight is a practical chronic hydration check: a decrease of >1% overnight (beyond expected body composition changes) suggests inadequate rehydration the previous day.\n• Coffee and tea at moderate intake (up to 4–5 cups/day) contribute to daily fluid intake; their mild diuretic effect is offset by the fluid volume they deliver. Alcohol is a net diuretic and worsens recovery hydration.',
        ],
      },
      {
        heading: 'Electrolyte Replacement',
        body: [
          'For sessions exceeding 60 minutes, especially in heat, ',
          { t: 'electrolytes', url: 'https://en.wikipedia.org/wiki/Electrolyte' },
          ' must be replaced alongside water to maintain plasma osmolality and prevent performance decline or hyponatraemia.\n\n• Sodium (Na⁺): the primary electrolyte lost in sweat (approximately 400–2,400 mg/litre depending on the individual and acclimatisation). Sodium is critical for fluid retention — consuming sodium with fluids improves net fluid absorption vs. plain water. Target: 400–1,000 mg/hr during prolonged heavy sweating.\n• Potassium (K⁺): intracellular balance; muscle contraction; cardiac rhythm; replenish post-exercise with whole foods (banana, sweet potato, coconut water, avocado) rather than supplements.\n• Magnesium (Mg²⁺): muscle relaxation, ATP synthesis; often deficient in athletes due to sweat losses and inadequate dietary intake; magnesium glycinate or malate are well-absorbed forms.\n• Chloride (Cl⁻): always paired with sodium in sweat; replaced automatically when sodium is replaced.\n\nElectrolyte strategies by duration:\n• < 60 min: plain water is sufficient for most activities.\n• 60–120 min: 200–400 mg sodium/hr in fluids or solid food.\n• > 120 min or heat: 400–1,000 mg sodium/hr; electrolyte tablets or purpose-formulated sports drinks. Avoid very high-sugar drinks if GI comfort is a concern.',
        ],
      },
      {
        heading: 'Hydration & Recovery',
        body: [
          'Rehydration after exercise is often underestimated. Athletes lose more fluid than they perceive and rarely fully rehydrate before the next session.\n\n• Full rehydration post-exercise: drink 125–150% of fluid lost (measured by bodyweight change) within 4–6 hours. For example, a 1 kg bodyweight loss during training = consume 1,250–1,500 mL of fluid over 4–6 hours.\n• Adding sodium to recovery drinks significantly improves retention — plain water consumed in large volumes is excreted rapidly via the kidneys. A sodium concentration of 50–80 mmol/L (approximately 1 g salt/500 mL) in a recovery beverage improves rehydration efficiency.\n• Milk (cow\'s or soy) is an effective recovery drink: it provides protein, carbohydrate, electrolytes (sodium, potassium, calcium), and a slower gastric emptying rate that improves fluid retention compared to isotonic sports drinks.\n• Alcohol after training significantly impairs rehydration and post-exercise muscle protein synthesis — even moderate doses (1 g/kg bodyweight) meaningfully attenuate overnight recovery.',
        ],
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────

export function NutritionEncyclopedia() {
  const t = useTheme();
  const [topicId, setTopicId] = useState<string | null>(null);

  const topic = topicId ? TOPICS.find(tp => tp.id === topicId) ?? null : null;

  // ── Topic list ─────────────────────────────────────────────

  if (!topic) {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: t.background }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: t.textSecondary }]}>
          Select a topic to learn about nutrition science, practical dieting strategies, and the role of each nutrient in performance and health.
        </Text>

        {TOPICS.map(tp => (
          <TouchableOpacity
            key={tp.id}
            style={[styles.topicCard, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => setTopicId(tp.id)}
            activeOpacity={0.75}
          >
            <View style={[styles.topicIconWrap, { backgroundColor: tp.accent + '20' }]}>
              <Ionicons name={tp.icon as never} size={22} color={tp.accent} />
            </View>
            <View style={styles.topicCardBody}>
              <Text style={[styles.topicTitle, { color: t.textPrimary }]}>{tp.title}</Text>
              <Text style={[styles.topicSubtitle, { color: t.textSecondary }]} numberOfLines={1}>
                {tp.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ── Topic detail ───────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      {/* Header */}
      <View style={[styles.detailHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => setTopicId(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
        <View style={[styles.detailIconWrap, { backgroundColor: topic.accent + '20' }]}>
          <Ionicons name={topic.icon as never} size={18} color={topic.accent} />
        </View>
        <Text style={[styles.detailTitle, { color: t.textPrimary }]}>{topic.title}</Text>
      </View>

      {/* Sections */}
      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        {topic.sections.map(section => (
          <View key={section.heading} style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.sectionHeading, { color: topic.accent }]}>{section.heading}</Text>
            <RichText segs={section.body} style={[styles.sectionBody, { color: t.textPrimary }]} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Topic list
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  intro: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.xs },
  topicCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md,
  },
  topicIconWrap: {
    width: 42, height: 42, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  topicCardBody: { flex: 1, gap: 2 },
  topicTitle:    { ...typography.body, fontWeight: '700' },
  topicSubtitle: { ...typography.bodySmall },

  // Topic detail
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailIconWrap: {
    width: 30, height: 30, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  detailTitle: { ...typography.body, fontWeight: '700', flex: 1 },
  detailScroll: { flex: 1 },
  detailContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  section: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },
  sectionHeading: { ...typography.body, fontWeight: '700' },
  sectionBody:    { ...typography.body, lineHeight: 22, opacity: 0.92 },

  // Inline links
  inlineLink: { color: colors.primary, textDecorationLine: 'underline' },
});
