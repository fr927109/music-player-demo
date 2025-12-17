const express = require('express');
const router = express.Router();

// GET Billboard Hot 100 songs (simplified - using existing songs)
router.get('/hot100', async (req, res) => {
  try {
    const [songs] = await req.db.query(`
      SELECT 
        s.song_id,
        s.title,
        s.artist,
        s.album,
        ROW_NUMBER() OVER (ORDER BY s.song_id) as rank
      FROM songs s
      ORDER BY RAND()
      LIMIT 100
    `);
    
    res.json(songs);
  } catch (error) {
    console.error('Error fetching Billboard Hot 100:', error);
    res.status(500).json({ error: 'Failed to fetch Billboard Hot 100' });
  }
});

module.exports = router;
