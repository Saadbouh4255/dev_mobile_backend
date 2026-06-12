const pool = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name_fr, name_ar, name_en, icon } = req.body;
    if (!name_fr || !name_ar || !name_en) {
      return res.status(400).json({ error: 'name_fr, name_ar, and name_en are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO categories (name_fr, name_ar, name_en, icon) VALUES (?, ?, ?, ?)',
      [name_fr, name_ar, name_en, icon || 'category']
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_fr, name_ar, name_en, icon } = req.body;
    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await pool.query(
      'UPDATE categories SET name_fr = ?, name_ar = ?, name_en = ?, icon = ? WHERE id = ?',
      [
        name_fr || existing[0].name_fr,
        name_ar || existing[0].name_ar,
        name_en || existing[0].name_en,
        icon || existing[0].icon,
        id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
