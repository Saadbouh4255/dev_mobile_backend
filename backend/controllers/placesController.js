const pool = require('../config/db');

exports.getPlaces = async (req, res) => {
  try {
    let query = `
      SELECT p.*, c.name_fr as category_name_fr, c.name_ar as category_name_ar, c.name_en as category_name_en
      FROM places p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (req.query.category_id) {
      query += ' AND p.category_id = ?';
      params.push(req.query.category_id);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching places:', err);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
};

exports.getPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, c.name_fr as category_name_fr, c.name_ar as category_name_ar, c.name_en as category_name_en
       FROM places p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching place:', err);
    res.status(500).json({ error: 'Failed to fetch place' });
  }
};

exports.createPlace = async (req, res) => {
  try {
    const { category_id, name_fr, name_ar, name_en, description_fr, description_ar, description_en, google_maps_url, latitude, longitude } = req.body;
    if (!category_id || !name_fr || !name_ar || !name_en) {
      return res.status(400).json({ error: 'category_id, name_fr, name_ar, and name_en are required' });
    }
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO places (category_id, name_fr, name_ar, name_en, description_fr, description_ar, description_en, google_maps_url, latitude, longitude, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [category_id, name_fr, name_ar, name_en, description_fr || null, description_ar || null, description_en || null, google_maps_url || null, latitude || null, longitude || null, image]
    );
    const [rows] = await pool.query('SELECT * FROM places WHERE id = ?', [result[0].id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating place:', err);
    res.status(500).json({ error: 'Failed to create place' });
  }
};

exports.updatePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM places WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }
    const { category_id, name_fr, name_ar, name_en, description_fr, description_ar, description_en, google_maps_url, latitude, longitude, is_active } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : existing[0].image;
    await pool.query(
      `UPDATE places SET category_id = ?, name_fr = ?, name_ar = ?, name_en = ?, description_fr = ?, description_ar = ?, description_en = ?, google_maps_url = ?, latitude = ?, longitude = ?, image = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        category_id || existing[0].category_id,
        name_fr || existing[0].name_fr,
        name_ar || existing[0].name_ar,
        name_en || existing[0].name_en,
        description_fr !== undefined ? description_fr : existing[0].description_fr,
        description_ar !== undefined ? description_ar : existing[0].description_ar,
        description_en !== undefined ? description_en : existing[0].description_en,
        google_maps_url !== undefined ? google_maps_url : existing[0].google_maps_url,
        latitude !== undefined ? latitude : existing[0].latitude,
        longitude !== undefined ? longitude : existing[0].longitude,
        image,
        is_active !== undefined ? is_active : existing[0].is_active,
        id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM places WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating place:', err);
    res.status(500).json({ error: 'Failed to update place' });
  }
};

exports.deletePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM places WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }
    await pool.query('DELETE FROM places WHERE id = ?', [id]);
    res.json({ message: 'Place deleted successfully' });
  } catch (err) {
    console.error('Error deleting place:', err);
    res.status(500).json({ error: 'Failed to delete place' });
  }
};
