import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { parse, isValid, startOfDay, isAfter, isEqual } from 'date-fns';

function HomePage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const snapshot = await getDocs(collection(db, 'events'));

      const today = startOfDay(new Date()); // today at midnight

      const pendingEvents = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(event => {
          // Parse event.date from "dd.MM.yyyy" format
          const eventDate = parse(event.date, 'dd.MM.yyyy', new Date());

          // Only keep if valid and today or later
          return (
            isValid(eventDate) &&
            (isEqual(startOfDay(eventDate), today) || isAfter(eventDate, today))
          );
        });

      setEvents(pendingEvents);
    };

    fetchEvents();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to Boardgame Events</h1>
      <h2>Upcoming Events</h2>
      {events.length === 0 ? (
        <p>No upcoming events found.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <Link to={`/event/${event.id}`}>
                {event.title} (am {event.date})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HomePage;
