import React, { useState, useEffect } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { collection, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { format, isValid, toDate} from 'date-fns';
import './AdminPage.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import levenshtein from 'fast-levenshtein'; // Optional but better than string length diff

function AdminPage() {
  const [title, setTitle] = useState('');
  // For date, maintain a raw value for the controlled input and a formatted value if needed.
  const [rawDate, setRawDate] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [time, setTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const fetchBGGData = async (gameTitle) => {
    try {
      // 1. Search for all game matches
      const searchRes = await axios.get(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(gameTitle)}&type=boardgame`
      );
      const searchXml = await parseStringPromise(searchRes.data);
      const searchItems = searchXml.items.item;
      if (!searchItems || searchItems.length === 0) return null;
  
      // Step 2: Sort items by title similarity
      const sortedMatches = searchItems
      .map(item => {
        const name = Array.isArray(item.name) ? item.name[0].$.value : item.name.$.value;
        return {
          id: item.$.id,
          name,
          score: levenshtein.get(name.toLowerCase(), gameTitle.toLowerCase()),
        };
      })
      .sort((a, b) => a.score - b.score); // lower score = better match

      // Step 3: Pick top 5–10 closest matches
      const topMatches = sortedMatches.slice(0, 5);
      const ids = topMatches.map(g => g.id).join(',');
  
      // 4. Fetch full info for those games
      const detailRes = await axios.get(
        `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`
      );
      const detailXml = await parseStringPromise(detailRes.data);
      const games = detailXml.items.item;
  
      // 5. Pick the game with the best (lowest) boardgame rank
      let bestGame = null;
      let bestRank = Infinity;
  
      for (const game of games) {
        console.log(game.name?.[0])
        const ranks = game.statistics[0].ratings[0].ranks[0].rank;
        const overall = ranks.find(r => r.$.name === 'boardgame');
        const rankValue = parseInt(overall?.$?.value, 10);
        if (!isNaN(rankValue) && rankValue < bestRank) {
          bestRank = rankValue;
          bestGame = game;
        }
      }
  
      if (!bestGame) return null;
  
      // 6. Return relevant info
      return {
        image: bestGame.image?.[0],
        playtime: bestGame.playingtime?.[0]?.$?.value,
        complexity: Math.round(bestGame.statistics?.[0]?.ratings?.[0]?.averageweight?.[0]?.$?.value * 10) / 10,
        averageRating: Math.round(bestGame.statistics?.[0]?.ratings?.[0]?.average?.[0]?.$?.value * 10) / 10,
        categories: bestGame.link
          .filter((l) => l.$.type === 'boardgamecategory')
          .map((l) => l.$.value),
      };
  
    } catch (err) {
      console.error('BGG fetch failed:', err);
      return null;
    }
  };
  

  const handleTitleBlur = async () => {
    const data = await fetchBGGData(title);
    setGameInfo(data);
  };

  // New handler for the date change event.
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (isValid(new Date(value))){
      setRawDate(value);
      // Format the date if needed. Make sure not to pass the formatted string to the date input's value.
      setFormattedDate(format(new Date(value), 'dd.MM.yyyy'));
    }
    else {
      setRawDate("");
      setFormattedDate("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        title,
        // Use the formatted date for storage or display as needed.
        date: formattedDate,
        time,
        maxParticipants: Number(maxParticipants),
        participants: [],
        gameInfo,
      });
      await updateDoc(docRef, {
        participants: arrayUnion("Marius"),
      });
      navigate(`/event/${docRef.id}`);
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  if (!user) {
    return (
      <div className="login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Log in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <h2>Neues Event erstellen</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          required
        />
        {/* Update the date input to be controlled using rawDate */}
        <input
          type="date"
          value={rawDate}
          onChange={handleDateChange}
          required
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Spielerzahl"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          required
        />
        <button type="submit">Event erstellen</button>
        {gameInfo && (
          <div className="game-preview">
            <img src={gameInfo.image} alt="Game Box" className="bgg-game-image" />
            <p><strong>Genres:</strong> {gameInfo.categories.join(', ')}</p>
            <p><strong>Spielzeit:</strong> {gameInfo.playtime} min</p>
            <p><strong>Rating:</strong> {gameInfo.averageRating}/10</p>
            <p><strong>Komplexität:</strong> {gameInfo.complexity}/5</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default AdminPage;
