const { pool } = require('../config/database');

// GET /api/settings
async function getSettings(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT SettingKey, SettingValue, Description, UpdatedAt FROM Settings');
    const settingsObj = {};
    rows.forEach(r => {
      settingsObj[r.SettingKey] = r.SettingValue;
    });

    res.json({
      success: true,
      data: settingsObj,
      raw: rows
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/settings
async function updateSettings(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const settings = req.body;
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(settings)) {
      await connection.query(
        `INSERT INTO Settings (SettingKey, SettingValue) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE SettingValue = VALUES(SettingValue)`,
        [key, String(value)]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Library configuration settings updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getSettings,
  updateSettings
};
