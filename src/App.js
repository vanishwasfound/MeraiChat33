import './App.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Correctly import Firebase auth
import 'firebase/compat/firestore'; // Correctly import Firebase Firestore
import { useState, useEffect, useRef } from 'react'; // Import useRef hook
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCb3zS3eGrku-Kg9n6LKU3z6TRCImRZAZk",
  authDomain: "chatweb-34959.firebaseapp.com",
  projectId: "chatweb-34959",
  storageBucket: "chatweb-34959.appspot.com",
  messagingSenderId: "436932697919",
  appId: "1:436932697919:web:30ea971e78c0b33fcdfd8a",
  measurementId: "G-78X71JSH61"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MeRai - RedBull is the best f1 team</h1>
        <SignOut />
      </header>
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button onClick={() => auth.signOut()} className="sign-out-btn">Sign Out</button>
  );
}

function ChatRoom() {
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt');
  const [messages, loading, error] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState('');
  const messagesEndRef = useRef(null); // Ref for scrolling to bottom

  // Scroll to bottom on messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Automatically delete messages after 50 entries
  useEffect(() => {
    const deleteExcessMessages = async () => {
      const snapshot = await messagesRef.get();
      const messageCount = snapshot.size;

      if (messageCount > 50) {
        const batch = firestore.batch();
        snapshot.docs.slice(0, messageCount - 50).forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    };

    deleteExcessMessages();
  }, [messagesRef]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    });

    setFormValue('');
  };

  if (loading) return <span>Loading...</span>;
  if (error) return <span>Error: {error.message}</span>;

  return (
    <>
      <div className="message-container">
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} /> {/* Ref element for scrolling to bottom */}
      </div>
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} />
        <button type='submit'>Send</button>
      </form>
    </>
  );
}

function ChatMessage({ message }) {
  const { text, uid, photoURL } = message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt="User Avatar" />
      <p>{text}</p>
    </div>
  );
}

export default App;
