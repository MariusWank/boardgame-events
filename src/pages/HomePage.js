// src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { parse, isValid, startOfDay, isAfter, isEqual, compareAsc } from 'date-fns';
import './HomePage.css';

function HomePage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const snapshot = await getDocs(collection(db, 'events'));
      const today = startOfDay(new Date());

      const pendingEvents = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const parsedDate = parse(data.date, 'dd.MM.yyyy', new Date());
          return {
            id: doc.id,
            ...data,
            parsedDate
          };
        })
        .filter(event =>
          isValid(event.parsedDate) &&
          (isEqual(startOfDay(event.parsedDate), today) || isAfter(event.parsedDate, today))
        )
        .sort((a, b) => compareAsc(a.parsedDate, b.parsedDate));

      setEvents(pendingEvents);
    };

    fetchEvents();
  }, []);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Wilkommen im Brettspiel-Paradies</h1>
        <h2>Bevorstehende Spieleabende</h2>
        {events.length === 0 ? (
          <p>Noch ist nichts geplant.</p>
        ) : (
          <ul className="event-list">
            {events.map((event) => (
              <li key={event.id}>
                <Link className="event-link" to={`/event/${event.id}`}>
                  {event.title} <span className="event-date">(am {event.date})</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default HomePage;
