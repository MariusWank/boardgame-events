import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import AdminPage from './pages/AdminPage';
import EventPage from './pages/EventPage';
import HomePage from './pages/HomePage';
import './App.css'; // Import the CSS file

function App() {
  const [user, setUser] = useState(null);

  // State for inline login form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle inline login from the navbar
  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // clear fields
      setEmail('');
      setPassword('');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Router>
      <nav className="navbar">
        {/* Left side: always visible */}
        <div className="nav-left">
          <Link to="/">Home</Link> <Link to="/admin">Admin</Link>
        </div>

        {/* Right side: inline login form if logged out; "Welcome, Admin!" + logout button if logged in */}
        <div className="nav-right">
          {!user ? (
            // Inline login form
            <form onSubmit={handleLogin} className="inline-login-form">
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
              <button type="submit">Login</button>
            </form>
          ) : (
            // Logged in
            <div className='LogoutBar'>
              <span className='WelcomeText'>Wilkommen, Brettspielfan!</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/event/:eventId" element={<EventPage />} />
      </Routes>
    </Router>
  );
}

export default App;
