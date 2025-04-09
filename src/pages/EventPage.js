// src/pages/EventPage.js
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

function EventPage() {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');

  // Ensure user is signed in anonymously if not logged in
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error('Anonymous sign-in error:', error);
        });
      }
    });
  }, []);

  // Fetch the event data from Firestore
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEventData(docSnap.data());
        } else {
          console.log('No such event!');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  // Register the user for the event
  const handleRegister = async () => {
    if (!guestName) return;
    try {
      const docRef = doc(db, 'events', eventId);
      await updateDoc(docRef, {
        participants: arrayUnion(guestName),
      });
      alert('Erfolgreich registriert!!');
      setGuestName('');
      // Refresh local data
      const updatedSnap = await getDoc(docRef);
      setEventData(updatedSnap.data());
    } catch (error) {
      console.error('Fehler beim regestrieren:', error);
    }
  };

  if (loading) return <p>Lade event ...</p>;
  if (!eventData) return <p>Event nicht gefunden.</p>;

  const { title, date, time, maxParticipants, participants } = eventData;
  const remainingSlots = maxParticipants - (participants?.length || 0);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Event: {title}</h2>
      <p>
        Datum: {date}
        <br />
        Uhrzeit: {time}
        <br />
        Maximale Spielerzahl: {maxParticipants}
        <br />
        Bisher angemeldet: {participants?.length || 0}
      </p>
      {remainingSlots > 0 ? (
        <>
          <p>Noch {remainingSlots} freie Plätze!</p>
          <input
            type="text"
            placeholder="Hier könnte dein Name stehen"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
          <button onClick={handleRegister}>Anmelden</button>
        </>
      ) : (
        <p>Das Event ist voll!</p>
      )}
      <h3>Teilnehmer:</h3>
      <ul>
        {participants && participants.map((p, index) => <li key={index}>{p}</li>)}
      </ul>
    </div>
  );
}

export default EventPage;
