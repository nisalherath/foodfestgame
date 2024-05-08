import React, { useState, useEffect } from 'react';
import { collection, getFirestore, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './Highscore.css'; // Import CSS for styling
import bgimg1 from '../assets/kitty1.png';

function Highscore() {
  const [highscores, setHighscores] = useState([]);

  useEffect(() => {
    const fetchHighscores = async () => {
      try {
        const db = getFirestore();
        const scoresCollection = collection(db, 'nicknames');
        const scoresQuery = query(scoresCollection, orderBy('highscore', 'desc'), limit(5));
        const querySnapshot = await getDocs(scoresQuery);

        const highscoresData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setHighscores(highscoresData);

        console.log('Highscores updated:', highscoresData);
      } catch (error) {
        console.error('Error fetching highscores:', error);
      }
    };

    // Initial fetch
    fetchHighscores();

    // Fetch highscores every  minute
    const intervalId = setInterval(fetchHighscores, 1 * 60 * 1000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="highscore-container">
      <h2 id="toptext">Leaderboard <img src={bgimg1} alt="Form Pic" className="bgimg1" loading='lazy'/></h2>

      <div className="highscore-list">
        {highscores.length === 0 ? (
          <div className="note6" style={{ fontSize: '20px' }}>No Data</div>
        ) : (
          highscores.map((score, index) => (
            <div key={score.id} className={`highscore-entry ${index < 5 ? 'top-3' : ''}`} id="scorecard">
              <span className={`position ${index === 0 ? 'emoji-golden-crown' : ''} ${index === 1 ? 'emoji-silver-medal' : ''} ${index === 2 ? 'emoji-bronze-medal' : ''}`}>
                {index === 0 && '👑'} 
                {index === 1 && '🥈'} 
                {index === 2 && '🥉'} 
                {index >= 3 && '🪙'} 
              </span>
              <span className="nickname">{score.nickname}</span>
              <span className="score">{score.highscore}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Highscore;
