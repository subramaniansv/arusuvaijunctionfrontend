/**
 * seed-product-content.mjs
 * Logs in as admin and PUTs enriched description + ingredients for every product.
 * Run: node scripts/seed-product-content.mjs
 */

const BASE = 'https://arusuvaijunctionbackend.onrender.com/arusuvai'

// ── 1. Auth ───────────────────────────────────────────────────────────────────
async function login() {
  const res = await fetch(`${BASE}/auth?isLogin=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mariappan.sv@arusuvaijunction.com', passwordHash: 'Admin@123' }),
  })
  const json = await res.json()
  if (!json.success) throw new Error('Login failed: ' + JSON.stringify(json))
  const token = json.data?.token || json.data?.accessToken || json.token
  if (!token) throw new Error('No token in response: ' + JSON.stringify(json))
  return token
}

// ── 2. Fetch ALL products using limit/offset pagination ───────────────────────
async function fetchProducts(token) {
  const all = []
  const PAGE = 50
  let offset = 0

  while (true) {
    const res = await fetch(`${BASE}/api/product?limit=${PAGE}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    const page = json.data || []
    all.push(...page)
    console.log(`    Page offset=${offset}: got ${page.length} products`)
    if (page.length < PAGE) break   // last page
    offset += PAGE
  }

  return all
}

// ── 3. Content map (keyed by exact product name from DB) ─────────────────────
const CONTENT = {
  // ── Ladoo ──────────────────────────────────────────────────────────────────

  'Atti fruit Ladoo': {
    nameTamil: 'அத்தி பழம் லட்டு',
    description:
      'Atti Pazham Ladoo | Cluster Fig Ladoo | அத்தி பழம் லட்டு\n\n' +
      'A traditional ladoo made from dried cluster fig (atti pazham), revered in Siddha medicine for centuries. ' +
      'Rich in dietary fibre, iron, and antioxidants — supports healthy digestion, boosts immunity, and helps regulate blood sugar. ' +
      'No refined sugar; naturally sweetened with jaggery.',
    descriptionTamil:
      'அத்தி பழம் லட்டு\n\n' +
      'உலர்த்திய அத்தி பழத்தால் தயாரிக்கப்படும் பாரம்பரிய லட்டு. ' +
      'நார்ச்சத்து, இரும்புச்சத்து மற்றும் ஆன்டிஆக்ஸிடன்ட்ஸ் நிறைந்தது. ' +
      'செரிமானம் சீராகவும் நோய் எதிர்ப்பு சக்தியும் அதிகரிக்கும். ' +
      'இரத்த சர்க்கரையை இயற்கையாகவே கட்டுக்குள் வைக்கும். ' +
      'சித்த மருத்துவத்தில் பெரிதும் போற்றப்படும் அத்தி பழம்.',
    ingredients: 'Dried Cluster Fig (Atti Pazham), Jaggery, Ghee, Cardamom',
    ingredientsTamil: 'உலர் அத்தி பழம், வெல்லம், நெய், ஏலக்காய்',
  },

  'Poongar Arisi Ladoo': {
    nameTamil: 'பூங்கார் அரிசி லட்டு',
    description:
      'Poongar Arisi Ladoo | Poongar Rice Ladoo | பூங்கார் அரிசி லட்டு\n\n' +
      'Made from Poongar — a rare reddish-pink heirloom rice variety native to Tamil Nadu, cultivated for over 2,000 years. ' +
      'Revered in Tamil tradition for women\'s health: rich in phytoestrogens, it supports hormonal balance and is traditionally given to postpartum mothers to enhance breast milk production. ' +
      'High in iron, zinc, fibre, and antioxidants with a low glycemic index — gentle on blood sugar, nourishing for the body.',
    descriptionTamil:
      'பூங்கார் அரிசி லட்டு\n\n' +
      'பூங்கார் — தமிழ்நாட்டின் பழம்பெரும் நெல் வகைகளில் ஒன்று. இளஞ்சிவப்பு நிற தவிட்டுடன் கூடிய இந்த நாட்டு அரிசி 2,000 ஆண்டுகளுக்கும் மேலாக விவசாயிகளால் பாதுகாக்கப்பட்டு வருகிறது. ' +
      'பால் சுரப்பை அதிகரிக்கும் தன்மை கொண்டதால் பிரசவித்த தாய்மார்களுக்கு பாரம்பரியமாக கொடுக்கப்படுகிறது. ' +
      'இரும்புச்சத்து, துத்தநாகம், நார்ச்சத்து நிறைந்தது. குறைந்த கிளைசெமிக் குறியீடு கொண்டது — சர்க்கரை நோயாளிகளுக்கும் நல்லது.',
    ingredients: 'Poongar Rice, Jaggery, Ghee, Cardamom',
    ingredientsTamil: 'பூங்கார் அரிசி, வெல்லம், நெய், ஏலக்காய்',
  },

  'Karuppu Kavunii Ladoo': {
    nameTamil: 'கருப்பு கவுனி அரிசி லட்டு',
    description:
      'Karuppu Kavunii Ladoo | Black Kavuni Rice Ladoo | கருப்பு கவுனி அரிசி லட்டு\n\n' +
      'Made from kavuni arisi — a prized black sticky rice variety bursting with anthocyanins. ' +
      'This potent antioxidant pigment fights free radicals, supports heart health, and strengthens bones. ' +
      'Traditionally used in Tamil Nadu for postpartum recovery and as a daily strength-building food. Naturally gluten-free.',
    descriptionTamil:
      'கருப்பு கவுனி அரிசி லட்டு\n\n' +
      'கவுனி அரிசியில் உள்ள அந்தோசயனின் சக்திவாய்ந்த ஆன்டிஆக்ஸிடன்ட். ' +
      'இதயம் மற்றும் எலும்புகளுக்கு வலுவூட்டுகிறது. ' +
      'பிரசவத்திற்குப் பிந்தைய உணவாகவும் தினசரி வலிமை தரும் உணவாகவும் பாரம்பரியமாக பயன்படுத்தப்படுகிறது. ' +
      'இயற்கையிலேயே குளூட்டன் இல்லாதது.',
    ingredients: 'Black Kavuni Rice, Jaggery, Ghee, Grated Coconut, Cardamom',
    ingredientsTamil: 'கருப்பு கவுனி அரிசி, வெல்லம், நெய், தேங்காய், ஏலக்காய்',
  },

  'Mapillai Samba Ladoo': {
    nameTamil: 'மாப்பிள்ளை சம்பா லட்டு',
    description:
      'Mapillai Samba Ladoo | Warrior Rice Ladoo | மாப்பிள்ளை சம்பா லட்டு\n\n' +
      'Mapillai Samba — literally "Bridegroom\'s Rice" — is an ancient heirloom Tamil warrior variety revered for building stamina, strength, and vitality. ' +
      'Naturally high in iron and zinc, it was traditionally given to grooms, soldiers, and athletes. ' +
      'These ladoos capture the full nutritional power of this rare heritage grain.',
    descriptionTamil:
      'மாப்பிள்ளை சம்பா லட்டு\n\n' +
      'மாப்பிள்ளை சம்பா அரிசி — ஒரு பழங்கால தமிழ் வீர அரிசி வகை. ' +
      'வலிமையையும் சகிப்புத்தன்மையையும் அதிகரிக்கும். ' +
      'இரும்புச்சத்து மற்றும் துத்தநாகம் நிறைந்தது. ' +
      'மணமகன்களுக்கும் வீரர்களுக்கும் பாரம்பரியமாக வழங்கப்பட்ட சிறந்த தானியம்.',
    ingredients: 'Mapillai Samba Rice, Jaggery, Ghee, Cardamom, Grated Coconut',
    ingredientsTamil: 'மாப்பிள்ளை சம்பா அரிசி, வெல்லம், நெய், ஏலக்காய், தேங்காய்',
  },

  'Ellu Ladoo': {
    nameTamil: 'எள்ளு லட்டு',
    description:
      'Ellu Ladoo | Sesame Seed Ladoo | எள்ளு லட்டு\n\n' +
      'A timeless South Indian sweet made from toasted sesame seeds. ' +
      'Ellu (sesame) is a calcium powerhouse — excellent for bones and joints. ' +
      'Packed with healthy fats, vitamin E, magnesium, and lignans. ' +
      'Traditionally consumed in winter for warmth and by women for hormonal balance and bone density.',
    descriptionTamil:
      'எள்ளு லட்டு\n\n' +
      'வறுத்த எள்ளிலிருந்து செய்யப்படும் பாரம்பரிய தமிழ் இனிப்பு. ' +
      'கால்சியம் மற்றும் ஆரோக்கியமான கொழுப்புகள் நிறைந்தது. ' +
      'எலும்பு மற்றும் மூட்டு ஆரோக்கியத்திற்கு சிறந்தது. ' +
      'பெண்களுக்கு ஹார்மோன் சமநிலைக்கு உதவும். குளிர்காலத்தில் உடலை சூடாக வைக்கும்.',
    ingredients: 'Sesame Seeds (Ellu), Jaggery, Ghee, Cardamom',
    ingredientsTamil: 'எள், வெல்லம், நெய், ஏலக்காய்',
  },

  'Groundnut Ladoo': {
    nameTamil: 'வேர்க்கடலை லட்டு',
    description:
      'Groundnut Ladoo | Peanut Ladoo | வேர்க்கடலை லட்டு\n\n' +
      'Made from roasted peanuts (groundnuts) — a protein-rich snack beloved across Tamil Nadu. ' +
      'Groundnuts are loaded with monounsaturated fats, vitamin B3, folate, and resveratrol — an antioxidant linked to heart health. ' +
      'A satisfying energy boost for children, athletes, and anyone needing a wholesome snack.',
    descriptionTamil:
      'வேர்க்கடலை லட்டு\n\n' +
      'வறுத்த வேர்க்கடலையிலிருந்து செய்யப்படும் புரதச்சத்து நிறைந்த இனிப்பு. ' +
      'மோனோஅன்சாச்சுரேட்டட் கொழுப்புகள், வைட்டமின் B3 மற்றும் ஃபோலேட் நிறைந்தது. ' +
      'குழந்தைகள் முதல் பெரியவர்கள் வரை அனைவருக்கும் சக்தி தரும் சத்தான சிற்றுண்டி.',
    ingredients: 'Roasted Groundnuts (Peanuts), Jaggery, Ghee, Cardamom',
    ingredientsTamil: 'வறுத்த வேர்க்கடலை, வெல்லம், நெய், ஏலக்காய்',
  },

  'Nei Vilanga': {
    nameTamil: 'நெய் விலங்கா',
    description:
      'Nei Vilanga | Ghee Sweet Ball | நெய் விலங்கா\n\n' +
      'A pure and simple traditional sweet made with generous amounts of pure cow ghee — the essence of classic Tamil home cooking. ' +
      'Ghee is rich in fat-soluble vitamins A, D, E and K, supports gut health, enhances brain function, and is easily digested. ' +
      'A nourishing treat that brings warmth, energy, and the taste of tradition.',
    descriptionTamil:
      'நெய் விலங்கா\n\n' +
      'தூய பசும் நெய்யை முக்கிய பொருளாக கொண்டு தயாரிக்கப்படும் பாரம்பரிய தமிழ் இனிப்பு. ' +
      'நெய்யில் வைட்டமின் A, D, E மற்றும் K நிறைந்துள்ளது. ' +
      'செரிமான சக்தியை மேம்படுத்தும், மூளை செயல்பாட்டை ஆதரிக்கும். ' +
      'உடலுக்கு சூடும் ஆற்றலும் தரும் பாரம்பரிய சுவை.',
    ingredients: 'Rice Flour, Pure Cow Ghee (Nei), Jaggery, Cardamom',
    ingredientsTamil: 'அரிசி மாவு, தூய பசும் நெய், வெல்லம், ஏலக்காய்',
  },

  // ── Malt ───────────────────────────────────────────────────────────────────

  'Beetroot Malt': {
    nameTamil: 'பீட்ரூட் மால்ட்',
    description:
      'Beetroot Malt | Beetroot Health Malt | பீட்ரூட் மால்ட்\n\n' +
      'A nutritious health malt made from roasted beetroot blended with traditional grains. ' +
      'Beetroot is nature\'s nitric oxide booster — improves blood circulation, enhances stamina, supports liver health, and is rich in folate, potassium, and iron. ' +
      'Mix 2 tsp in warm milk or water for a wholesome morning or evening drink.',
    descriptionTamil:
      'பீட்ரூட் மால்ட்\n\n' +
      'வறுத்த பீட்ரூட்டை பாரம்பரிய தானியங்களுடன் சேர்த்து தயாரிக்கப்படும் சத்தான மால்ட். ' +
      'இரத்த ஓட்டத்தை மேம்படுத்தும், சகிப்புத்தன்மையை அதிகரிக்கும். ' +
      'கல்லீரல் ஆரோக்கியத்திற்கு நன்மை. ஃபோலேட், பொட்டாசியம் மற்றும் இரும்புச்சத்து நிறைந்தது. ' +
      '2 தேக்கரண்டி சூடான பாலில் அல்லது தண்ணீரில் கலந்து அருந்தலாம்.',
    ingredients: 'Beetroot Powder, Ragi (Finger Millet), Wheat, Dates, Cardamom, Jaggery',
    ingredientsTamil: 'பீட்ரூட் பொடி, ராகி, கோதுமை, பேரீச்சம் பழம், ஏலக்காய், வெல்லம்',
  },

  'ABC Malt': {
    nameTamil: 'ஆப்பிள் பீட்ரூட் கேரட் மால்ட்',
    description:
      'ABC Malt | Apple Beetroot Carrot Malt | ஆப்பிள் பீட்ரூட் கேரட் மால்ட்\n\n' +
      'ABC — Apple, Beetroot, Carrot — the celebrated power trio of detox nutrition. ' +
      'Combines the anti-inflammatory and cleansing properties of all three to support liver detox, boost immunity, improve skin glow, and increase haemoglobin levels. ' +
      'Ideal for anaemia, post-illness recovery, and daily vitality. Mix 2 tsp in warm milk.',
    descriptionTamil:
      'ஆப்பிள் பீட்ரூட் கேரட் மால்ட்\n\n' +
      'ஆப்பிள், பீட்ரூட், கேரட் — மூன்றின் ஒன்றிணைந்த சக்தி. ' +
      'கல்லீரலை சுத்தப்படுத்தும், நோய் எதிர்ப்பு சக்தியை அதிகரிக்கும். ' +
      'சருமத்திற்கு பொலிவு கொடுக்கும், ஹீமோகுளோபின் அளவை உயர்த்தும். ' +
      'இரத்தசோகை, களைப்பு மற்றும் நோய்க்கு பிறகான மீட்சிக்கு சிறந்தது. ' +
      '2 தேக்கரண்டி சூடான பாலில் கலந்து அருந்தலாம்.',
    ingredients: 'Apple Powder, Beetroot Powder, Carrot Powder, Ragi, Wheat, Jaggery, Cardamom',
    ingredientsTamil: 'ஆப்பிள் பொடி, பீட்ரூட் பொடி, கேரட் பொடி, ராகி, கோதுமை, வெல்லம், ஏலக்காய்',
  },

  // ── Podi ───────────────────────────────────────────────────────────────────

  'Muligiai Sukku Coffee Podi': {
    nameTamil: 'முளகு சுக்கு காப்பி பொடி',
    description:
      'Muligiyam Sukku Coffee Podi | Pepper Dry Ginger Coffee Powder | முளகு சுக்கு காப்பி பொடி\n\n' +
      'A traditional Tamil medicine-inspired coffee blend made with black pepper (milagu), dry ginger (sukku), and warming spices. ' +
      'Used for centuries to relieve colds, coughs, indigestion, and fatigue. ' +
      'Sukku kaapi is a powerful immunity booster — anti-inflammatory, carminative, and deeply warming. ' +
      'Brew with milk or water for a healing aromatic cup.',
    descriptionTamil:
      'முளகு சுக்கு காப்பி பொடி\n\n' +
      'மிளகு, சுக்கு மற்றும் மசாலாக்களைக் கொண்டு தயாரிக்கப்படும் பாரம்பரிய தமிழ் மருத்துவ காப்பி பொடி. ' +
      'சளி, இருமல், செரிமான கோளாறு மற்றும் சோர்வை குணப்படுத்த நூற்றாண்டுகளாக பயன்படுத்தப்படுகிறது. ' +
      'நோய் எதிர்ப்பு சக்தியை வலுப்படுத்தும், உடலை சூடுபடுத்தும். ' +
      'பால் அல்லது தண்ணீரில் கலந்து குடிக்கலாம்.',
    ingredients: 'Dry Ginger (Sukku), Black Pepper (Milagu), Cumin, Coriander Seeds, Jaggery, Coffee',
    ingredientsTamil: 'சுக்கு, மிளகு, சீரகம், கொத்தமல்லி விதை, வெல்லம், காப்பி',
  },

  'Mudavathukaal Kilangu Soup podi': {
    nameTamil: 'முடவாத்துக்கால் கிழங்கு சூப் பொடி',
    description:
      'Mudavathukaal Kilangu Soup Podi | Medicinal Root Soup Powder | முடவாத்துக்கால் கிழங்கு சூப் பொடி\n\n' +
      'A traditional Siddha medicine soup powder made from mudavathukaal kilangu — a rare medicinal tuber used for centuries to treat joint pain, arthritis, and bone weakness. ' +
      'Rich in anti-inflammatory compounds, it soothes stiff joints, improves mobility, and strengthens bones. ' +
      'Dissolve in warm water or broth and consume daily for best results.',
    descriptionTamil:
      'முடவாத்துக்கால் கிழங்கு சூப் பொடி\n\n' +
      'முடவாத்துக்கால் கிழங்கு — மூட்டு வலி, மூட்டு வீக்கம் மற்றும் எலும்பு பலவீனத்திற்கு சித்த மருத்துவத்தில் பயன்படுத்தப்படும் அரிய மருத்துவ கிழங்கு. ' +
      'வீக்கத்தை குறைக்கும் தன்மை கொண்டது. மூட்டுகளை வலுப்படுத்தும், இயக்கத்தை மேம்படுத்தும். ' +
      'சூடான தண்ணீரில் அல்லது கஞ்சியில் கலந்து தினமும் அருந்தலாம்.',
    ingredients: 'Mudavathukaal Kilangu (Medicinal Root), Pepper, Cumin, Dry Ginger, Rock Salt',
    ingredientsTamil: 'முடவாத்துக்கால் கிழங்கு, மிளகு, சீரகம், சுக்கு, கல் உப்பு',
  },

  'Pirandai podi': {
    nameTamil: 'பிரண்டை பொடி',
    description:
      'Pirandai Podi | Adamant Creeper Powder | பிரண்டை பொடி\n\n' +
      'Made from pirandai (Cissus quadrangularis) — an ancient Siddha medicine herb nicknamed "bone setter" for its remarkable ability to accelerate fracture healing and strengthen bones. ' +
      'Rich in calcium, phosphorus, and carotenoids. Used to treat osteoporosis, joint pain, and digestive issues. ' +
      'Mix with rice, curd rice, or idli for a daily bone-health boost.',
    descriptionTamil:
      'பிரண்டை பொடி\n\n' +
      'பிரண்டை (Cissus quadrangularis) — "எலும்பு கூட்டும் மூலிகை" என்று சித்த மருத்துவத்தில் போற்றப்படும் அரிய தாவரம். ' +
      'எலும்பு முறிவை விரைவாக ஆற்றும் தன்மை கொண்டது. கால்சியம், பாஸ்பரஸ் நிறைந்தது. ' +
      'எலும்புப்புரையோசி, மூட்டு வலி மற்றும் செரிமான கோளாறுகளுக்கு சிறந்தது. ' +
      'சாதம், தயிர் சாதம் அல்லது இட்லியுடன் சேர்த்து சாப்பிடலாம்.',
    ingredients: 'Pirandai (Cissus quadrangularis), Urad Dal, Sesame Seeds, Red Chilli, Salt, Asafoetida',
    ingredientsTamil: 'பிரண்டை, உளுத்தம் பருப்பு, எள், சிவப்பு மிளகாய், உப்பு, பெருங்காயம்',
  },

  'Ellu Idli podi': {
    nameTamil: 'எள் இட்லி பொடி',
    description:
      'Ellu Idli Podi | Sesame Idli Powder | எள் இட்லி பொடி\n\n' +
      'A flavour-packed idli podi enriched with roasted sesame seeds (ellu). ' +
      'Sesame is loaded with calcium, healthy fats, and lignans that support hormonal balance and bone health. ' +
      'The perfect companion for idli, dosa, and rice — simply mix with gingelly oil or ghee and enjoy.',
    descriptionTamil:
      'எள் இட்லி பொடி\n\n' +
      'வறுத்த எள்ளுடன் தயாரிக்கப்படும் சுவையான இட்லி பொடி. ' +
      'கால்சியம், ஆரோக்கியமான கொழுப்புகள் மற்றும் லிக்னான்கள் நிறைந்தது. ' +
      'எலும்பு ஆரோக்கியம் மற்றும் ஹார்மோன் சமநிலைக்கு நல்லது. ' +
      'இட்லி, தோசை மற்றும் சாதத்துடன் நல்லெண்ணெய் அல்லது நெய் கலந்து சாப்பிடலாம்.',
    ingredients: 'Sesame Seeds (Ellu), Urad Dal, Chana Dal, Red Chilli, Curry Leaves, Salt, Asafoetida',
    ingredientsTamil: 'எள், உளுத்தம் பருப்பு, கடலை பருப்பு, சிவப்பு மிளகாய், கறிவேப்பிலை, உப்பு, பெருங்காயம்',
  },

  'Idli podi': {
    nameTamil: 'இட்லி பொடி',
    description:
      'Idli Podi | Traditional Gunpowder | இட்லி பொடி\n\n' +
      'The classic South Indian idli podi — a bold, coarse chutney powder made from roasted lentils, sesame, and red chillies. ' +
      'A staple in every Tamil kitchen. Protein-rich from lentils, iron from sesame, antioxidants from chilli. ' +
      'Mix with gingelly oil or ghee and serve with hot idli or dosa.',
    descriptionTamil:
      'இட்லி பொடி\n\n' +
      'பாரம்பரிய தமிழ் இட்லி பொடி — வறுத்த பருப்புகள், எள் மற்றும் சிவப்பு மிளகாயால் தயாரிக்கப்படும் காரமான சட்னி பொடி. ' +
      'ஒவ்வொரு தமிழ் சமையலறையிலும் இடம்பெறும் அத்தியாவசிய பொடி. ' +
      'நல்லெண்ணெய் அல்லது நெய்யுடன் கலந்து சூடான இட்லி, தோசையுடன் பரிமாறலாம்.',
    ingredients: 'Urad Dal, Chana Dal, Red Chilli, Sesame Seeds, Curry Leaves, Salt, Asafoetida, Pepper',
    ingredientsTamil: 'உளுத்தம் பருப்பு, கடலை பருப்பு, சிவப்பு மிளகாய், எள், கறிவேப்பிலை, உப்பு, பெருங்காயம், மிளகு',
  },

  'Murungai Kirai Idli podi': {
    nameTamil: 'முருங்கை கீரை இட்லி பொடி',
    description:
      'Murungai Kirai Idli Podi | Drumstick Leaves Idli Powder | முருங்கை கீரை இட்லி பொடி\n\n' +
      'Idli podi supercharged with moringa (murungai keerai) — one of the most nutrient-dense plants on earth. ' +
      'Moringa leaves contain 7× more vitamin C than oranges, 4× more calcium than milk, and 2× more protein than yoghurt. ' +
      'Boosts immunity, energy, and iron levels. A delicious way to add greens to every meal.',
    descriptionTamil:
      'முருங்கை கீரை இட்லி பொடி\n\n' +
      'முருங்கை கீரை (மோரிங்கா) சேர்க்கப்பட்ட சத்தான இட்லி பொடி. ' +
      'முருங்கை கீரை — ஆரஞ்சை விட 7 மடங்கு வைட்டமின் C, பாலை விட 4 மடங்கு கால்சியம், தயிரை விட 2 மடங்கு புரதம் கொண்டது. ' +
      'நோய் எதிர்ப்பு சக்தி, ஆற்றல் மற்றும் இரும்புச்சத்து அதிகரிக்கும். ' +
      'தினசரி உணவில் கீரையை சேர்க்க சுலபமான வழி.',
    ingredients: 'Moringa Leaves (Murungai Keerai), Urad Dal, Chana Dal, Red Chilli, Sesame Seeds, Salt, Asafoetida',
    ingredientsTamil: 'முருங்கை கீரை, உளுத்தம் பருப்பு, கடலை பருப்பு, சிவப்பு மிளகாய், எள், உப்பு, பெருங்காயம்',
  },

  'karuvaepillai Idli podi': {
    nameTamil: 'கறிவேப்பிலை இட்லி பொடி',
    description:
      'Karuvaepillai Idli Podi | Curry Leaves Idli Powder | கறிவேப்பிலை இட்லி பொடி\n\n' +
      'Idli podi infused with the bold flavour and medicinal power of curry leaves (karuvaepillai). ' +
      'Curry leaves are packed with carbazole alkaloids — potent antioxidants that protect the liver, lower cholesterol, improve hair health, and regulate blood sugar. ' +
      'A fragrant, healthy podi for idli, dosa, and rice.',
    descriptionTamil:
      'கறிவேப்பிலை இட்லி பொடி\n\n' +
      'கறிவேப்பிலையின் மருத்துவ குணங்களுடன் தயாரிக்கப்படும் சுவையான இட்லி பொடி. ' +
      'கறிவேப்பிலை கல்லீரலைப் பாதுகாக்கும், கொலஸ்ட்ராலை குறைக்கும், முடி உதிர்வை தடுக்கும். ' +
      'இரத்த சர்க்கரையை கட்டுப்படுத்தும் ஆன்டிஆக்ஸிடன்ட் நிறைந்தது. ' +
      'இட்லி, தோசை மற்றும் சாதத்துடன் அருமையாக பொருந்தும்.',
    ingredients: 'Curry Leaves (Karuvaepillai), Urad Dal, Chana Dal, Red Chilli, Sesame Seeds, Salt, Asafoetida',
    ingredientsTamil: 'கறிவேப்பிலை, உளுத்தம் பருப்பு, கடலை பருப்பு, சிவப்பு மிளகாய், எள், உப்பு, பெருங்காயம்',
  },

  'Idii Sambar Podi': {
    nameTamil: 'இட்லி சாம்பார் பொடி',
    description:
      'Idli Sambar Podi | Idli Sambar Masala Powder | இட்லி சாம்பார் பொடி\n\n' +
      'A carefully blended aromatic sambar masala specifically crafted for the lighter, thinner idli sambar. ' +
      'Made from hand-selected spices including coriander, cumin, black pepper, and dried red chillies. ' +
      'Each spice brings anti-inflammatory, digestive, and antioxidant benefits. ' +
      'Just a few spoonfuls transform a simple toor dal broth into a deeply flavourful idli sambar.',
    descriptionTamil:
      'இட்லி சாம்பார் பொடி\n\n' +
      'இட்லி சாம்பாருக்காக சிறப்பாக தயாரிக்கப்பட்ட மசாலா பொடி. ' +
      'கொத்தமல்லி, சீரகம், மிளகு மற்றும் சிவப்பு மிளகாயை உள்ளடக்கிய தேர்ந்தெடுக்கப்பட்ட மசாலாக்கள். ' +
      'ஒவ்வொரு மசாலாவும் வீக்கம் குறைக்கும், செரிமானத்தை மேம்படுத்தும் குணம் கொண்டது. ' +
      'சாதாரண பருப்பு கலவையை சுவையான இட்லி சாம்பாராக மாற்றும்.',
    ingredients: 'Coriander Seeds, Cumin, Black Pepper, Red Chilli, Chana Dal, Urad Dal, Turmeric, Curry Leaves, Asafoetida',
    ingredientsTamil: 'கொத்தமல்லி விதை, சீரகம், மிளகு, சிவப்பு மிளகாய், கடலை பருப்பு, உளுத்தம் பருப்பு, மஞ்சள், கறிவேப்பிலை, பெருங்காயம்',
  },

  'Paruppu Podi': {
    nameTamil: 'பருப்பு பொடி',
    description:
      'Paruppu Podi | Lentil Powder | பருப்பு பொடி\n\n' +
      'A simple, wholesome South Indian staple made from roasted lentils and spices. ' +
      'Lentils are an excellent source of plant protein, fibre, and folate — supporting muscle health, digestion, and heart health. ' +
      'Mix generously with ghee and hot rice for a comforting everyday meal.',
    descriptionTamil:
      'பருப்பு பொடி\n\n' +
      'வறுத்த பருப்புகள் மற்றும் மசாலாக்களால் தயாரிக்கப்படும் எளிமையான தெற்கிந்திய உணவு. ' +
      'தாவர புரதம், நார்ச்சத்து மற்றும் ஃபோலேட் நிறைந்தது. ' +
      'தசை ஆரோக்கியம், செரிமானம் மற்றும் இதய ஆரோக்கியத்தை மேம்படுத்தும். ' +
      'நெய் மற்றும் சூடான சாதத்துடன் கலந்து சாப்பிட மிகவும் சுவையாக இருக்கும்.',
    ingredients: 'Toor Dal, Chana Dal, Red Chilli, Pepper, Cumin, Curry Leaves, Salt, Asafoetida, Ghee',
    ingredientsTamil: 'துவரம் பருப்பு, கடலை பருப்பு, சிவப்பு மிளகாய், மிளகு, சீரகம், கறிவேப்பிலை, உப்பு, பெருங்காயம், நெய்',
  },

  'Idli Podi': {
    nameTamil: 'இட்லி பொடி',
    description:
      'Idli Podi | Classic South Indian Chutney Powder | இட்லி பொடி\n\n' +
      'The iconic South Indian condiment — a coarse, spicy-nutty powder made from roasted lentils, sesame, and chillies. ' +
      'A protein and iron-rich everyday accompaniment for idli, dosa, and steamed rice. ' +
      'Mix with gingelly (sesame) oil or ghee to create the perfect sidekick for your breakfast.',
    descriptionTamil:
      'இட்லி பொடி\n\n' +
      'தென்னிந்தியாவின் பிரபலமான சட்னி பொடி — வறுத்த பருப்புகள், எள் மற்றும் மிளகாயால் தயாரிக்கப்படும் கரகரப்பான, காரமான பொடி. ' +
      'புரதம் மற்றும் இரும்புச்சத்து நிறைந்த தினசரி துணை உணவு. ' +
      'நல்லெண்ணெய் அல்லது நெய்யுடன் கலந்து இட்லி, தோசையுடன் சாப்பிட மிகவும் சுவையாக இருக்கும்.',
    ingredients: 'Urad Dal, Chana Dal, Red Chilli, Sesame Seeds, Curry Leaves, Salt, Asafoetida, Black Pepper',
    ingredientsTamil: 'உளுத்தம் பருப்பு, கடலை பருப்பு, சிவப்பு மிளகாய், எள், கறிவேப்பிலை, உப்பு, பெருங்காயம், மிளகு',
  },
}


// ── 4. Update one product ─────────────────────────────────────────────────────
async function updateProduct(token, product) {
  const content = CONTENT[product.name]
  if (!content) {
    console.warn(`⚠  No content mapping for "${product.name}" — skipping`)
    return
  }

  const payload = {
    ...product,
    nameTamil: content.nameTamil,
    description: content.description,
    descriptionTamil: content.descriptionTamil,
    ingredients: content.ingredients,
    ingredientsTamil: content.ingredientsTamil,
  }

  const res = await fetch(`${BASE}/api/product`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json()
  if (json.success) {
    console.log(`✅  Updated: ${product.name}`)
  } else {
    console.error(`❌  Failed:  ${product.name} — ${JSON.stringify(json)}`)
  }
}

// ── 5. Main ───────────────────────────────────────────────────────────────────
;(async () => {
  try {
    console.log('🔐  Logging in…')
    const token = await login()
    console.log('✅  Authenticated\n')

    console.log('📦  Fetching products…')
    const products = await fetchProducts(token)
    console.log(`    Found ${products.length} products\n`)

    for (const product of products) {
      await updateProduct(token, product)
    }

    console.log('\n🎉  Done!')
  } catch (err) {
    console.error('Fatal:', err.message)
    process.exit(1)
  }
})()
