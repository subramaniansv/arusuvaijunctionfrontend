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


'Naripayir Ladoo': {
  nameTamil: 'நரிப்பயிறு லட்டு',
  description:
    'Naripayir Ladoo | Green Gram Ladoo | நரிப்பயிறு லட்டு\n\n' +
    'Traditional homemade ladoos made from roasted Naripayir. ' +
    'A protein-rich and wholesome sweet with earthy flavour and natural nutrition.',
  descriptionTamil:
    'நரிப்பயிறு லட்டு\n\n' +
    'வறுத்த நரிப்பயிறு கொண்டு தயாரிக்கப்படும் பாரம்பரிய வீட்டுமுறை லட்டு. ' +
    'புரதச்சத்து நிறைந்த சத்தான இனிப்பு.',
  ingredients: 'Naripayir, Jaggery, Ghee, Cardamom',
  ingredientsTamil: 'நரிப்பயிறு, வெல்லம், நெய், ஏலக்காய்',
},

'Thinai Ladoo': {
  nameTamil: 'திணை லட்டு',
  description:
    'Thinai Ladoo | Foxtail Millet Ladoo | திணை லட்டு\n\n' +
    'Healthy millet ladoos made from Thinai, a traditional Tamil millet known for its fibre and natural goodness. ' +
    'A light, nutritious sweet for everyday snacking.',
  descriptionTamil:
    'திணை லட்டு\n\n' +
    'நார்ச்சத்து நிறைந்த பாரம்பரிய தானியமான திணையால் தயாரிக்கப்படும் ஆரோக்கியமான லட்டு. ' +
    'தினசரி சிற்றுண்டிக்கு ஏற்ற சத்தான இனிப்பு.',
  ingredients: 'Thinai, Jaggery, Ghee, Cardamom',
  ingredientsTamil: 'திணை, வெல்லம், நெய், ஏலக்காய்',
},

'Kambu Ladoo': {
  nameTamil: 'கம்பு லட்டு',
  description:
    'Kambu Ladoo | Pearl Millet Ladoo | கம்பு லட்டு\n\n' +
    'Nutritious ladoos made from Kambu, a traditional pearl millet valued for strength and nourishment. ' +
    'A rustic, wholesome sweet with authentic homemade taste.',
  descriptionTamil:
    'கம்பு லட்டு\n\n' +
    'உடலுக்கு வலிமையும் சத்தும் தரும் பாரம்பரிய கம்பு கொண்டு தயாரிக்கப்படும் லட்டு. ' +
    'வீட்டுமுறை சுவையுடன் கூடிய ஆரோக்கியமான இனிப்பு.',
  ingredients: 'Kambu, Jaggery, Ghee, Cardamom',
  ingredientsTamil: 'கம்பு, வெல்லம், நெய், ஏலக்காய்',
},

'Varagu Arisi Ladoo': {
  nameTamil: 'வரகு அரிசி லட்டு',
  description:
    'Varagu Arisi Ladoo | Kodo Millet Ladoo | வரகு அரிசி லட்டு\n\n' +
    'Wholesome millet ladoos prepared with Varagu Arisi and natural jaggery. ' +
    'A traditional sweet with rich millet flavour and everyday nutrition.',
  descriptionTamil:
    'வரகு அரிசி லட்டு\n\n' +
    'வரகு அரிசி மற்றும் வெல்லம் சேர்த்து தயாரிக்கப்படும் சத்தான பாரம்பரிய லட்டு. ' +
    'மில்லெட் சுவையும் ஊட்டச்சத்தும் நிறைந்த இனிப்பு.',
  ingredients: 'Varagu Arisi, Jaggery, Ghee, Cardamom',
  ingredientsTamil: 'வரகு அரிசி, வெல்லம், நெய், ஏலக்காய்',
},

'Samai Arisi Ladoo': {
  nameTamil: 'சாமை அரிசி லட்டு',
  description:
    'Samai Arisi Ladoo | Little Millet Ladoo | சாமை அரிசி லட்டு\n\n' +
    'Traditional ladoos made from Samai Arisi, blended with jaggery and ghee. ' +
    'A soft, flavourful and nutritious millet sweet.',
  descriptionTamil:
    'சாமை அரிசி லட்டு\n\n' +
    'சாமை அரிசி, வெல்லம் மற்றும் நெய் சேர்த்து தயாரிக்கப்படும் பாரம்பரிய லட்டு. ' +
    'மென்மையான சுவையுடன் கூடிய சத்தான மில்லெட் இனிப்பு.',
  ingredients: 'Samai Arisi, Jaggery, Ghee, Cardamom',
  ingredientsTamil: 'சாமை அரிசி, வெல்லம், நெய், ஏலக்காய்',
},


'Garlic Pickle': {
  nameTamil: 'பூண்டு ஊறுகாய்',
  description:
    'Garlic Pickle | பூண்டு ஊறுகாய்\n\n' +
    'A bold and flavourful South Indian pickle made with fresh garlic cloves, traditional spices and gingelly oil. ' +
    'Perfect with curd rice, dosa, idli and everyday meals.',
  descriptionTamil:
    'பூண்டு ஊறுகாய்\n\n' +
    'புதிய பூண்டு பற்கள், பாரம்பரிய மசாலா மற்றும் நல்லெண்ணெய் சேர்த்து தயாரிக்கப்படும் காரசாரமான ஊறுகாய். ' +
    'தயிர் சாதம், தோசை, இட்லி மற்றும் தினசரி உணவுகளுடன் அருமையாக பொருந்தும்.',
  ingredients: 'Garlic, Gingelly Oil, Red Chilli Powder, Mustard Seeds, Fenugreek Powder, Turmeric Powder, Salt',
  ingredientsTamil: 'பூண்டு, நல்லெண்ணெய், மிளகாய்த்தூள், கடுகு, வெந்தயத்தூள், மஞ்சள்தூள், உப்பு',
},

'Citron Pickle': {
  nameTamil: 'நார்த்தங்காய் ஊறுகாய்',
  description:
    'Citron Pickle | Narthangai Pickle | நார்த்தங்காய் ஊறுகாய்\n\n' +
    'A traditional tangy and spicy citron pickle made with authentic South Indian spices. ' +
    'Its sharp citrus flavour makes it a perfect side for curd rice and simple homemade meals.',
  descriptionTamil:
    'நார்த்தங்காய் ஊறுகாய்\n\n' +
    'புளிப்பு மற்றும் கார சுவை நிறைந்த பாரம்பரிய நார்த்தங்காய் ஊறுகாய். ' +
    'தயிர் சாதம் மற்றும் வீட்டுமுறை உணவுகளுடன் சிறப்பாக பொருந்தும்.',
  ingredients: 'Citron, Gingelly Oil, Red Chilli Powder, Mustard Seeds, Fenugreek Powder, Turmeric Powder, Salt',
  ingredientsTamil: 'நார்த்தங்காய், நல்லெண்ணெய், மிளகாய்த்தூள், கடுகு, வெந்தயத்தூள், மஞ்சள்தூள், உப்பு',
},

'Vathakulambu': {
  nameTamil: 'வத்தக்குழம்பு',
  description:
    'Vathakulambu Mix | வத்தக்குழம்பு\n\n' +
    'A rich and traditional Tamil-style Vathakulambu mix made with tamarind, roasted spices and classic dried ingredients. ' +
    'Brings deep homemade flavour to rice with the authentic taste of Tamil kitchen cooking.',
  descriptionTamil:
    'வத்தக்குழம்பு\n\n' +
    'புளி, வறுத்த மசாலா மற்றும் பாரம்பரிய வத்தல் பொருட்களுடன் தயாரிக்கப்படும் தமிழ் வீட்டுமுறை வத்தக்குழம்பு கலவை. ' +
    'சாதத்துடன் சாப்பிட ஆழமான பாரம்பரிய சுவை தரும்.',
  ingredients: 'Tamarind, Sundakkai Vathal, Manathakkali Vathal, Garlic, Curry Leaves, Red Chilli, Coriander Seeds, Gingelly Oil, Salt',
  ingredientsTamil: 'புளி, சுண்டைக்காய் வத்தல், மணத்தக்காளி வத்தல், பூண்டு, கறிவேப்பிலை, காய்ந்த மிளகாய், கொத்தமல்லி விதை, நல்லெண்ணெய், உப்பு',
},
}

// ── 4. Fix one product's content (PUT JSON — UTF-8 safe) ─────────────────────
// We POST-created these products earlier, but the multipart POST path mangled
// the Tamil text (ISO-8859-1 decoding). The PUT path reads the raw JSON body,
// which Jackson decodes as UTF-8, so re-sending the content here repairs it.
// We spread the fetched product first so price / stock / category are kept.
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
    console.log(`✅  Fixed: ${product.name}`)
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
