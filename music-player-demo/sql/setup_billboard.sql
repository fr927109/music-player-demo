-- Create billboard_chart table
CREATE TABLE IF NOT EXISTS billboard_chart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT NOT NULL,
  chart_date DATE NOT NULL,
  rank INT NOT NULL,
  last_week_rank INT,
  weeks_on_chart INT,
  FOREIGN KEY (song_id) REFERENCES songs(song_id),
  UNIQUE KEY unique_song_date (song_id, chart_date),
  INDEX idx_chart_date (chart_date),
  INDEX idx_rank (rank)
);

-- Insert sample Billboard Hot 100 data (using existing songs)
-- Get current date
SET @chart_date = CURDATE();

-- Insert top 10 songs from your database into Billboard chart
INSERT INTO billboard_chart (song_id, chart_date, rank, last_week_rank, weeks_on_chart)
SELECT 
  song_id,
  @chart_date,
  ROW_NUMBER() OVER (ORDER BY RAND()) as rank,
  FLOOR(1 + RAND() * 10) as last_week_rank,
  FLOOR(1 + RAND() * 20) as weeks_on_chart
FROM songs
LIMIT 100
ON DUPLICATE KEY UPDATE 
  rank = VALUES(rank),
  last_week_rank = VALUES(last_week_rank),
  weeks_on_chart = VALUES(weeks_on_chart);
