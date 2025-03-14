import React, { useEffect, useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';

function App() {
  const [data, setData] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [packets, setPackets] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  const fetchCurrentDate = () => {
    fetch('http://127.0.0.1:8000/current-date')
      .then(response => response.json())
      .then(data => setCurrentDate(data.current_date));
  };

  const handleFileUpload = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://127.0.0.1:8000/upload', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => setPackets(data.packets || []))
      .catch(error => console.error('Error:', error));
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {data ? data.Hello : "Loading..."}
        </p>
        <button onClick={fetchCurrentDate}>Get Current Date</button>
        {currentDate && <p>Current Date: {currentDate}</p>}
        <FileUpload onFileUpload={handleFileUpload} />
        {packets.length > 0 && (
          <div>
            <h2>Packets</h2>
            <ul>
              {packets.map((packet, index) => (
                <li key={index}>{packet}</li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
