const pool = require('./config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // 1. Create tables if they don't exist
    console.log('Creating tables if needed...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name_fr VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        icon VARCHAR(100) DEFAULT 'category'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS places (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name_fr VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        description_fr TEXT,
        description_ar TEXT,
        description_en TEXT,
        google_maps_url TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        image TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✓ Tables ready\n');

    // 2. Seed admin
    console.log('Seeding admin...');
    const [existingAdmin] = await pool.query('SELECT * FROM admins WHERE email = $1', ['admin@example.com']);
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const [result] = await pool.query(
        'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        ['Admin', 'admin@example.com', hashedPassword]
      );
      console.log(`  ✓ Admin created (id: ${result[0].id})`);
    } else {
      console.log('  - Admin already exists, skipping');
    }

    // 3. Seed categories
    console.log('\nSeeding categories...');
    const categories = [
      { name_fr: 'Restaurants', name_ar: 'مطاعم', name_en: 'Restaurants', icon: 'restaurant' },
      { name_fr: 'Hôtels', name_ar: 'فنادق', name_en: 'Hotels', icon: 'hotel' },
      { name_fr: 'Sites touristiques', name_ar: 'مواقع سياحية', name_en: 'Tourist Sites', icon: 'attractions' },
      { name_fr: 'Centres commerciaux', name_ar: 'مراكز تسوق', name_en: 'Shopping Centers', icon: 'shopping' },
      { name_fr: 'Mosquées', name_ar: 'مساجد', name_en: 'Mosques', icon: 'mosque' },
    ];

    for (const cat of categories) {
      const [existing] = await pool.query('SELECT * FROM categories WHERE name_en = $1', [cat.name_en]);
      if (existing.length === 0) {
        const [result] = await pool.query(
          'INSERT INTO categories (name_fr, name_ar, name_en, icon) VALUES ($1, $2, $3, $4) RETURNING id',
          [cat.name_fr, cat.name_ar, cat.name_en, cat.icon]
        );
        console.log(`  ✓ Created category: ${cat.name_en} (id: ${result[0].id})`);
      } else {
        console.log(`  - Category "${cat.name_en}" already exists, skipping`);
      }
    }

    // 4. Seed places
    console.log('\nSeeding places...');
    const [catRows] = await pool.query('SELECT id, name_en FROM categories');

    const places = [
      {
        category_id: catRows.find(c => c.name_en === 'Restaurants')?.id,
        name_fr: 'Le Jardin des Saveurs',
        name_ar: 'حديقة النكهات',
        name_en: 'The Garden of Flavors',
        description_fr: 'Un restaurant élégant proposant une cuisine internationale et mauritanienne.',
        description_ar: 'مطعم أنيق يقدم مأكولات عالمية وموريتانية.',
        description_en: 'An elegant restaurant offering international and Mauritanian cuisine.',
        google_maps_url: 'https://maps.google.com/?q=18.0858,-15.9785',
        latitude: 18.0858,
        longitude: -15.9785,
      },
      {
        category_id: catRows.find(c => c.name_en === 'Hotels')?.id,
        name_fr: 'Hôtel Azalaï',
        name_ar: 'فندق أزلاي',
        name_en: 'Azalaï Hotel',
        description_fr: 'Hôtel de luxe avec piscine, spa et vue panoramique sur Nouakchott.',
        description_ar: 'فندق فاخر مع مسبح ومنتجع صحي وإطلالة بانورامية على نواكشوط.',
        description_en: 'Luxury hotel with pool, spa, and panoramic view of Nouakchott.',
        google_maps_url: 'https://maps.google.com/?q=18.0865,-15.9755',
        latitude: 18.0865,
        longitude: -15.9755,
      },
      {
        category_id: catRows.find(c => c.name_en === 'Tourist Sites')?.id,
        name_fr: 'Port de Pêche',
        name_ar: 'ميناء الصيد',
        name_en: 'Fishing Port',
        description_fr: 'Le célèbre port de pêche de Nouakchott, idéal pour voir les pirogues colorées.',
        description_ar: 'ميناء الصيد الشهير في نواكشوط، مثالي لمشاهدة قوارب الصيد الملونة.',
        description_en: 'The famous fishing port of Nouakchott, ideal for seeing colorful fishing boats.',
        google_maps_url: 'https://maps.google.com/?q=18.0373,-15.9927',
        latitude: 18.0373,
        longitude: -15.9927,
      },
    ];

    for (const place of places) {
      if (!place.category_id) {
        console.log('  ✗ Skipping place (no matching category found)');
        continue;
      }
      const [existing] = await pool.query('SELECT * FROM places WHERE name_en = $1', [place.name_en]);
      if (existing.length === 0) {
        const [result] = await pool.query(
          `INSERT INTO places (category_id, name_fr, name_ar, name_en, description_fr, description_ar, description_en, google_maps_url, latitude, longitude, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE) RETURNING id`,
          [place.category_id, place.name_fr, place.name_ar, place.name_en, place.description_fr, place.description_ar, place.description_en, place.google_maps_url, place.latitude, place.longitude]
        );
        console.log(`  ✓ Created place: ${place.name_en} (id: ${result[0].id})`);
      } else {
        console.log(`  - Place "${place.name_en}" already exists, skipping`);
      }
    }

    console.log('\n--- SEED SUMMARY ---');
    const [admins] = await pool.query('SELECT COUNT(*) as count FROM admins');
    const [catCount] = await pool.query('SELECT COUNT(*) as count FROM categories');
    const [placeCount] = await pool.query('SELECT COUNT(*) as count FROM places');
    console.log(`  Admins:     ${admins[0].count}`);
    console.log(`  Categories: ${catCount[0].count}`);
    console.log(`  Places:     ${placeCount[0].count}`);
    console.log('\n✅ Seed completed successfully!');
    console.log('Login credentials:');
    console.log('  Email:    admin@example.com');
    console.log('  Password: admin123\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
