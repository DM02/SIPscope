import React, { useState } from "react";
import "./FileUpload.css";

const FileUpload = ({ onFileUpload }) => {
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
      setFileUploaded(true);
    }
  };

  return (
    <div>
      {!fileUploaded && (
        <div className="upload-container">
          <label htmlFor="file-upload" className="upload-button">
            Select file
          </label>
          <input
            id="file-upload"
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;