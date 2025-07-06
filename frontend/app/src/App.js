import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FileUpload from './components/FileUpload';
import PacketTable from './components/PacketTable';
import Header from './components/Header';
import PacketDetails from './components/PacketDetails';

function App() {
  const [data, setData] = useState(null);
  const [packets, setPackets] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  const handleFileUpload = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://127.0.0.1:8000/upload', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.file_path) {
          const fileName = data.file_path.split('/').pop();
          fetch(`http://127.0.0.1:8000/process?file_name=${fileName}`, {
            method: 'POST',
          })
            .then(response => response.json())
            .then(processedData => {
              setPackets(processedData.packets || []);
              setFileUploaded(true);
            })
            .catch(error => console.error('Error processing file:', error));
        }
      })
      .catch(error => console.error('Error uploading file:', error));
  };

  return (
    <Router>
      <div className="App">
        <Header data={data} />
        <Routes>
          <Route
            path="/"
            element={
              <>
                {!fileUploaded && <FileUpload onFileUpload={handleFileUpload} />}
                {packets.length > 0 && <PacketTable packets={packets} setPackets={setPackets} />}
              </>
            }
          />
          <Route path="/packet/:id" element={<PacketDetails packets={packets} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
