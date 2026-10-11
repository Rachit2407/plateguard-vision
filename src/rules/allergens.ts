/**
 * Allergen knowledge base (Role C).
 *
 * Every allergen has:
 *  - direct:   words that name the allergen itself or an unambiguous source (casein, whey, almond...)
 *  - hidden:   foods that usually CONTAIN the allergen but do not name it (soy sauce -> wheat, pesto -> tree nuts).
 *              These produce a "may contain" finding, not a certain one.
 *  - excludes: phrases that look like a match but are not (almond milk is not dairy, rice flour is not gluten).
 *
 * This is a decision-support list, not a medical reference. When in doubt we err towards warning.
 */

export type AllergenId =
  | 'peanut'
  | 'tree_nut'
  | 'gluten'
  | 'dairy'
  | 'shellfish'
  | 'fish'
  | 'egg'
  | 'soy'
  | 'sesame'
  | 'mustard'
  | 'sulfites';

export interface AllergenDef {
  id: AllergenId;
  /** Name spoken aloud and shown in the UI. */
  label: string;
  direct: string[];
  hidden: string[];
  excludes: string[];
}

export const ALLERGENS: Record<AllergenId, AllergenDef> = {
  peanut: {
    id: 'peanut',
    label: 'Peanuts',
    direct: ['peanut', 'groundnut', 'goober', 'arachis', 'monkey nut', 'beer nut'],
    hidden: ['satay', 'pad thai', 'mole', 'nougat', 'praline', 'egg roll', 'spring roll', 'african stew'],
    excludes: [],
  },
  tree_nut: {
    id: 'tree_nut',
    label: 'Tree Nuts',
    direct: [
      'almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'filbert', 'pistachio', 'brazil nut',
      'macadamia', 'pine nut', 'pignoli', 'chestnut', 'praline', 'marzipan', 'nutella', 'gianduja',
      'tree nut', 'mixed nuts', 'nut butter', 'nut paste',
    ],
    hidden: ['pesto', 'baklava', 'nougat', 'frangipane', 'amaretto', 'granola', 'muesli', 'trail mix'],
    // FDA no longer lists coconut as a tree nut; nutmeg / butternut squash / water chestnut are unrelated.
    excludes: ['nutmeg', 'butternut', 'water chestnut', 'coconut', 'peanut butter'],
  },
  gluten: {
    id: 'gluten',
    label: 'Gluten / Wheat',
    direct: [
      'wheat', 'gluten', 'barley', 'rye', 'malt', 'semolina', 'spelt', 'farro', 'kamut', 'durum',
      'couscous', 'bulgur', 'seitan', 'triticale', 'einkorn', 'graham', 'brewer s yeast',
      'bread', 'breadcrumb', 'bun', 'pasta', 'spaghetti', 'macaroni', 'ramen', 'udon', 'noodle',
      'pizza dough', 'dough', 'tortilla', 'pita', 'naan', 'roti', 'chapati', 'paratha', 'cracker',
      'biscuit', 'cookie', 'cake', 'pastry', 'croissant', 'flour', 'bleached flour', 'enriched flour',
      'all purpose flour', 'maida', 'atta', 'crouton', 'panko', 'tempura', 'batter',
    ],
    hidden: [
      'soy sauce', 'teriyaki', 'hoisin', 'miso', 'oats', 'rolled oats', 'oat', 'granola', 'muesli',
      'beer', 'ale', 'lager', 'gravy', 'roux', 'imitation crab', 'surimi', 'meatball', 'sausage',
      'soba', 'modified food starch', 'dumpling', 'wonton',
    ],
    // Gluten-free flours and grains that contain the word "flour", "noodle" etc.
    excludes: [
      'rice flour', 'almond flour', 'coconut flour', 'corn flour', 'cornflour', 'chickpea flour', 'gram flour',
      'besan', 'tapioca flour', 'potato flour', 'buckwheat flour', 'rice noodle', 'rice noodles', 'glass noodle',
      'shirataki noodle', 'konjac noodle', 'mung bean noodle', 'kelp noodle', 'cellophane noodle', 'rice pasta', 'corn pasta', 'chickpea pasta', 'lentil pasta', 'quinoa pasta', 'zucchini noodle', 'zoodle', 'cauliflower crust', 'rice paper',
      'cornbread', 'corn tortilla', 'rice cake', 'rice cracker', 'sweet potato noodle', 'rice vermicelli',
    ],
  },
  dairy: {
    id: 'dairy',
    label: 'Dairy / Milk',
    direct: [
      'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'curd', 'whey', 'casein', 'caseinate',
      'lactose', 'ghee', 'paneer', 'khoya', 'mozzarella', 'cheddar', 'parmesan', 'parmigiano', 'ricotta',
      'mascarpone', 'feta', 'gouda', 'brie', 'camembert', 'provolone', 'gruyere', 'halloumi', 'custard',
      'ice cream', 'gelato', 'kefir', 'buttermilk', 'milk powder', 'skim milk', 'whole milk', 'condensed milk',
      'evaporated milk', 'lassi', 'raita', 'dahi', 'malai', 'kheer', 'cheese sauce', 'alfredo',
    ],
    hidden: ['pepperoni pizza', 'pizza', 'quiche', 'lasagna', 'carbonara', 'mac and cheese', 'bechamel', 'white sauce', 'creamy'],
    excludes: [
      'almond milk', 'coconut milk', 'coconut cream', 'oat milk', 'soy milk', 'rice milk', 'cashew milk',
      'hemp milk', 'cocoa butter', 'peanut butter', 'almond butter', 'shea butter', 'nut butter', 'sunflower butter',
      'butter bean', 'butternut', 'cream of tartar', 'vegan cheese', 'cashew cheese', 'milk thistle', 'cream soda',
    ],
  },
  shellfish: {
    id: 'shellfish',
    label: 'Shellfish',
    direct: [
      'shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'crawfish', 'langoustine', 'scampi', 'krill',
      'clam', 'mussel', 'oyster', 'scallop', 'cockle', 'abalone', 'squid', 'calamari', 'octopus', 'cuttlefish',
      'snail', 'escargot', 'shellfish', 'mollusc', 'mollusk', 'crustacean', 'shrimp paste', 'belacan', 'oyster sauce',
    ],
    hidden: ['seafood', 'paella', 'bouillabaisse', 'surimi', 'imitation crab', 'fish sauce', 'tom yum', 'cioppino'],
    excludes: ['crab apple', 'crabapple'],
  },
  fish: {
    id: 'fish',
    label: 'Fish',
    direct: [
      'fish', 'salmon', 'tuna', 'cod', 'haddock', 'tilapia', 'trout', 'mackerel', 'sardine', 'anchovy', 'anchovies',
      'herring', 'bass', 'snapper', 'halibut', 'pollock', 'catfish', 'carp', 'eel', 'swordfish', 'mahi', 'sole',
      'fish sauce', 'fish oil', 'fish stock', 'dashi', 'bonito', 'katsuobushi', 'surimi', 'roe', 'caviar', 'nam pla',
      'worcestershire',
    ],
    hidden: ['caesar dressing', 'caesar salad', 'tom yum', 'thai curry', 'pad thai', 'paella', 'bouillabaisse', 'nuoc cham', 'oyster sauce', 'ramen broth'],
    excludes: ['fishless', 'starfish', 'jellyfish', 'swedish fish', 'goldfish cracker'],
  },
  egg: {
    id: 'egg',
    label: 'Eggs',
    direct: [
      'egg', 'eggs', 'albumen', 'albumin', 'mayonnaise', 'mayo', 'meringue', 'ovalbumin', 'lysozyme',
      'egg white', 'egg yolk', 'omelette', 'omelet', 'frittata', 'quiche', 'custard', 'aioli', 'hollandaise',
      'eggnog', 'egg noodle', 'egg wash', 'ovomucoid', 'livetin',
    ],
    hidden: ['pad thai', 'fried rice', 'ramen', 'brioche', 'challah', 'tempura', 'pancake', 'waffle', 'cake', 'cookie', 'marshmallow', 'carbonara', 'ranch'],
    excludes: ['eggplant', 'eggless', 'vegan egg', 'egg replacer'],
  },
  soy: {
    id: 'soy',
    label: 'Soy',
    direct: [
      'soy', 'soya', 'soybean', 'edamame', 'tofu', 'tempeh', 'miso', 'natto', 'tamari', 'shoyu', 'soy sauce',
      'soy lecithin', 'soy protein', 'textured vegetable protein', 'tvp', 'soy milk', 'yuba',
    ],
    hidden: ['teriyaki', 'hoisin', 'vegetable broth', 'worcestershire', 'ramen broth', 'tonkotsu', 'marinade', 'imitation meat'],
    excludes: [],
  },
  sesame: {
    id: 'sesame',
    label: 'Sesame',
    direct: ['sesame', 'tahini', 'tahina', 'gingelly', 'benne', 'halvah', 'halva', 'gomashio', 'hummus', 'za atar', 'dukkah'],
    hidden: ['falafel', 'bagel', 'burger bun', 'hamburger bun', 'baba ganoush', 'sushi', 'stir fry sauce', 'furikake'],
    excludes: [],
  },
  mustard: {
    id: 'mustard',
    label: 'Mustard',
    direct: ['mustard', 'dijon', 'mustard seed', 'mustard oil', 'wholegrain mustard', 'piccalilli'],
    hidden: ['vinaigrette', 'barbecue sauce', 'bbq sauce', 'pickle', 'curry powder', 'ketchup', 'marinade', 'hot dog'],
    excludes: ['mustard green', 'mustard greens'],
  },
  sulfites: {
    id: 'sulfites',
    label: 'Sulfites',
    direct: [
      'sulfite', 'sulphite', 'sulfur dioxide', 'sulphur dioxide', 'sodium metabisulfite', 'potassium metabisulfite',
      'sodium bisulfite', 'metabisulphite', 'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228',
    ],
    hidden: ['wine', 'dried apricot', 'dried fruit', 'raisin', 'vinegar', 'pickle', 'sauerkraut', 'molasses', 'cider', 'beer', 'grape juice'],
    excludes: [],
  },
};

export const ALLERGEN_IDS = Object.keys(ALLERGENS) as AllergenId[];

/**
 * Turn the free-text allergy strings stored in a profile ("Peanuts", "Gluten / Wheat", "nuts") into ids.
 * Unknown strings are ignored. A bare "nuts" is ambiguous, so it is treated as BOTH peanut and tree nut (safer).
 */
export function profileAllergiesToIds(allergies: string[]): AllergenId[] {
  const out = new Set<AllergenId>();
  for (const raw of allergies) {
    const s = raw.toLowerCase();
    const bareNuts = /\bnuts?\b/.test(s) && !/tree/.test(s);
    if (/peanut|groundnut/.test(s) || bareNuts) out.add('peanut');
    if (/tree\s*nut|almond|cashew|walnut|pecan|hazelnut|pistachio|macadamia/.test(s) || bareNuts) out.add('tree_nut');
    if (/gluten|wheat|celiac|coeliac/.test(s)) out.add('gluten');
    if (/dairy|milk|lactose|casein|whey/.test(s) && !/lactose intol/.test(s)) out.add('dairy');
    if (/shellfish|shrimp|prawn|crab|lobster|crustacean|mollusc|mollusk/.test(s)) out.add('shellfish');
    if (/\bfish\b/.test(s) && !/shellfish/.test(s)) out.add('fish');
    if (/\begg/.test(s)) out.add('egg');
    if (/\bsoy|soya/.test(s)) out.add('soy');
    if (/sesame|tahini/.test(s)) out.add('sesame');
    if (/mustard/.test(s)) out.add('mustard');
    if (/sulfite|sulphite/.test(s)) out.add('sulfites');
  }
  return [...out];
}
