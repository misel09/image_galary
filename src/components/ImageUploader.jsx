import React, { useState } from "react";
import "./ImageUploader.css";

const ImageUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setMessage("Please select an image file");
        return;
      }

      setFile(selectedFile);
      setMessage("");
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Upload image
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select an image to upload.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage("Image uploaded successfully!");
        setFile(null);
        setPreview(null);
        if (onUploadSuccess) {
          onUploadSuccess(data.imageUrl);
        }
      } else {
        setMessage(data.message || "Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage("Error uploading image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-uploader">
      <h2>Upload Image</h2>
      <div className="upload-container">
        <div className="file-input-wrapper">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            Choose Image
          </label>
        </div>
        
        {preview && (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="preview-image" />
          </div>
        )}
        
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file}
          className={`upload-button ${uploading ? 'uploading' : ''}`}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      
      {message && (
        <p className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
