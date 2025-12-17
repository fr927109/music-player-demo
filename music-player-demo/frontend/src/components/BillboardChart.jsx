import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BillboardChart.css';

const BillboardChart = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBillboardChart();
  }, []);

  const fetchBillboardChart = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/billboard/hot100');
      console.log('Billboard data:', response.data); // Debug log
      setSongs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Billboard chart:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="billboard-chart"><div className="loading">Loading chart...</div></div>;
  if (error) return <div className="billboard-chart"><div className="error">Error: {error}</div></div>;
  if (!songs || songs.length === 0) return <div className="billboard-chart"><div className="no-data">No chart data available</div></div>;

  return (
    <div className="billboard-chart">
      <h2>Top Songs - Billboard Hot 100</h2>
      <div className="chart-list">
        {songs.slice(0, 10).map((song, index) => (
          <div key={song.song_id} className="chart-item">
            <div className="rank">{index + 1}</div>
            <div className="song-info">
              <div className="song-title">{song.title}</div>
              <div className="song-artist">{song.artist}</div>
            </div>
            <div className="chart-stats">
              <span className="lw">LW<br/>{song.last_week_rank || '-'}</span>
              <span className="wks">WKS<br/>{song.weeks_on_chart || '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillboardChart;
