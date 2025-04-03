import React, { useState, useEffect } from "react";
import "./ImageGallery.css";

const ImageGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching images from:", "http://localhost:5000/api/images");
      const response = await fetch("http://localhost:5000/api/images");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received data:", data);
      
      if (data.success) {
        setImages(data.images);
      } else {
        setError(data.message || "Failed to fetch images");
      }
    } catch (err) {
      console.error("Error fetching images:", err);
      if (err.message.includes("Failed to fetch")) {
        setError("Cannot connect to server. Please make sure the server is running.");
      } else {
        setError("Failed to fetch images. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation(); // Prevent modal from opening when clicking delete
    
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setDeletingId(imageId);
      console.log("Attempting to delete image with ID:", imageId);
      
      const response = await fetch(`http://localhost:5000/api/images/${imageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      const data = await response.json();
      console.log("Delete response:", data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        // Remove the deleted image from the state
        setImages(prevImages => prevImages.filter(img => img._id !== imageId));
        // If the deleted image was in the modal, close it
        if (selectedImage?._id === imageId) {
          setSelectedImage(null);
        }
      } else {
        throw new Error(data.message || "Failed to delete image");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      alert(`Failed to delete image: ${err.message}\nPlease check the console for more details.`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("Are you sure you want to delete all images? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      console.log("Sending cleanup request...");
      
      const response = await fetch("http://localhost:5000/api/images/cleanup", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      console.log("Cleanup response:", data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setImages([]);
        setSelectedImage(null); // Close modal if open
        alert(`Cleanup completed successfully!\nDeleted ${data.deletedFiles} files and ${data.deletedDbEntries} database entries.`);
      } else {
        throw new Error(data.message || "Failed to remove images");
      }
    } catch (err) {
      console.error("Error during cleanup:", err);
      alert(`Failed to remove images: ${err.message}\nPlease check the console for more details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchImages} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div className="gallery-header">
        <div className="header-content">
          <h2>Image Gallery</h2>
          <div className="header-stats">
            <span className="image-count">{images.length} images</span>
            {images.length > 0 && (
              <button onClick={handleCleanup} className="cleanup-button">
                Remove All
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="gallery-grid">
        {images.length > 0 ? (
          images.map((img) => (
            <div key={img._id} className="gallery-item">
              <div className="image-container" onClick={() => handleImageClick(img)}>
                <img
                  src={`http://localhost:5000/uploads/${img.filename}`}
                  alt={img.filename}
                  className="gallery-image"
                  onError={(e) => {
                    console.error("Error loading image:", img.filename);
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23666'%3EImage Not Found%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="image-overlay">
                  <button 
                    className={`delete-button ${deletingId === img._id ? 'deleting' : ''}`}
                    onClick={(e) => handleDeleteImage(img._id, e)}
                    disabled={deletingId === img._id}
                  >
                    {deletingId === img._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className="image-info">
                <span className="upload-date">
                  {new Date(img.uploadedAt).toLocaleDateString()}
                </span>
                <span className="filename">{img.filename}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-images">
            <div className="empty-state-icon">📸</div>
            <p>No images uploaded yet</p>
            <p className="empty-state-subtitle">Upload some images to get started!</p>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <img
              src={`http://localhost:5000/uploads/${selectedImage.filename}`}
              alt={selectedImage.filename}
              className="modal-image"
            />
            <div className="modal-info">
              <p>Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}</p>
              <p>Filename: {selectedImage.filename}</p>
              <button 
                className={`delete-button ${deletingId === selectedImage._id ? 'deleting' : ''}`}
                onClick={(e) => handleDeleteImage(selectedImage._id, e)}
                disabled={deletingId === selectedImage._id}
              >
                {deletingId === selectedImage._id ? 'Deleting...' : 'Delete Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
