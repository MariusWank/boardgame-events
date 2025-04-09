import React, { useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';


function AdminPage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  
  // For login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Keep track of whether user is logged in
  const [user, setUser] = useState(null);

  // Check if user is logged in or not on component mount
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Clears the login fields upon success
      setEmail('');
      setPassword('');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  // Handle event creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        title,
        date,
        time,
        maxParticipants: Number(maxParticipants),
        participants: []
      });
      alert(`Event created with ID: ${docRef.id}`);
      // Reset fields
      setTitle('');
      setDate('');
      setTime('');
      setMaxParticipants('');
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  // If user is not logged in, show login form
  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Email:</label><br/>
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          <div>
            <label>Password:</label><br/>
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit">Log in</button>
        </form>
      </div>
    );
  }

  // If user is logged in, show event creation form
  return (
    <div style={{ padding: '20px' }}>
      <h2>Create a New Event</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Game Title:</label><br />
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>
        <div>
        <label>Datum:</label><br />
        <input 
            type="date"
            onChange={(e) => {
            const rawValue = e.target.value;
            const parsedDate = new Date(rawValue);
            const formatted = format(parsedDate, 'dd.MM.yyyy');
            setDate(formatted);
            }}
            required
        />
        </div>
        <div>
          <label>Time:</label><br />
          <input 
            type="time" 
            value={time} 
            onChange={(e) => setTime(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Max Participants:</label><br />
          <input
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
}

export default AdminPage;
