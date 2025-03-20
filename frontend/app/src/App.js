import React, { useEffect, useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import PacketTable from './components/PacketTable';
import Header from './components/Header';

function App() {
  const [data, setData] = useState(null);
  const [packets, setPackets] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  const handleFileUpload = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    // Wywołanie endpointu /upload
    fetch('http://127.0.0.1:8000/upload', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.file_path) {
          // Automatyczne wywołanie endpointu /process
          const fileName = data.file_path.split('/').pop(); // Pobierz nazwę pliku
          fetch(`http://127.0.0.1:8000/process?file_name=${fileName}`, {
            method: 'POST',
          })
            .then(response => response.json())
            .then(processedData => {
              // Obsługa przetworzonych danych
              setPackets(processedData.packets || []);
            })
            .catch(error => console.error('Error processing file:', error));
        }
      })
      .catch(error => console.error('Error uploading file:', error));
  };

  return (
    <div className="App">
      <Header data={data} />
      <FileUpload onFileUpload={handleFileUpload} />
      {packets.length > 0 && <PacketTable packets={packets} />}
    </div>
  );
}

export default App;
