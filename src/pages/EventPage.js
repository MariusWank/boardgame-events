import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './EventPage.css';

function EventPage() {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [user, setUser] = useState(null); // Add user state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setEventData(docSnap.data());
        else console.log('No such event!');
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Add auth state observer
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async () => {
    if (!guestName) return;
    try {
      const docRef = doc(db, 'events', eventId);
      await updateDoc(docRef, {
        participants: arrayUnion(guestName),
      });
      const updatedSnap = await getDoc(docRef);
      setEventData(updatedSnap.data());
      setGuestName('');
    } catch (error) {
      console.error('Fehler beim registrieren:', error);
    }
  };

  const removeParticipants = async (participant) => {
    const confirmDelete = window.confirm(`Sicher, dass du ${participant} entfernen willst?`);
    if (!confirmDelete) return;
    try{
      const docRef = doc(db, 'events', eventId);
      await updateDoc(docRef, {
        participants: arrayRemove(participant),
      });
      const updatedSnap = await getDoc(docRef);
      setEventData(updatedSnap.data());
    }
    catch (error) {
      console.error('Fehler beim entfernen des Nutzers:', error);
    }
  }

  const deleteEvent = async () => {
    const confirmDelete = window.confirm("Sicher, dass du das Event löschen willst?");
    if (!confirmDelete) return;
    try{
      const docRef = doc(db, 'events', eventId);
      await deleteDoc(docRef);
      setEventData(null);
      navigate('/')
    }
    catch (error) {
      console.error('Fehler beim entfernen des Nutzers:', error);
    }
  }

  if (loading) return <p className="center">Lade event ...</p>;
  if (!eventData) return <p className="center">Event nicht gefunden.</p>;

  const { title, date, time, maxParticipants, participants, gameInfo } = eventData;
  const remainingSlots = maxParticipants - (participants?.length || 0);

  return (
    <div className="event-container">
      <div className="event-content">
        <h2>Event: {title}</h2>
        <div className="event-details">
          <p>Datum: {date}<br />Uhrzeit: {time}<br />Maximale Spielerzahl: {maxParticipants}<br />Bisher angemeldet: {participants?.length || 0}</p>
        </div>

        {remainingSlots > 0 ? (
          <>
            <p>Noch {remainingSlots} freie Plätze!</p>
            <input type="text" placeholder="Hier könnte dein Name stehen" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            <button onClick={handleRegister}>Anmelden</button>
          </>
        ) : (
          <p>Das Event ist voll!</p>
        )}

        <h3>Teilnehmer:</h3>
        <ul>
          {participants && 
            participants.map((p, index) => (
              <li key={index}>
                  {p}
                  {user && (
                    <button onClick={ () => removeParticipants(p)} className='RemoveButton'>❌</button>
                  )}
              </li>))}
        </ul>
        {gameInfo && (
          <div className="game-details">
            <img src={gameInfo.image} alt="Game Box" className="bgg-game-image" />
            <p><strong>Genres:</strong> {gameInfo.categories.join(', ')}</p>
            <p><strong>Spielzeit:</strong> {gameInfo.playtime} min</p>
            <p><strong>Rating:</strong> {Math.round(gameInfo.averageRating * 10) / 10}/10</p>
            <p><strong>Komplexität:</strong> {Math.round(gameInfo.complexity * 10) / 10}/5</p>
          </div>
        )}
        {user && (
          <button className='delete-button'
            onClick={deleteEvent}> DELETE EVENT
          </button>
        )}
      </div>
    </div>
  );
}

export default EventPage;
