import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState('crop');
  const [cropDimensions, setCropDimensions] = useState({
    x: 0, y: 0, width: 200, height: 200
  });
  const [rotationAngle, setRotationAngle] = useState(90);
  const [username, setUsername] = useState('');
  const [images, setImages] = useState([]);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const imageUrl = URL.createObjectURL(selectedFile);
      setImageUrl(imageUrl);
    }
  };

  const fetchImages = async (username) => {
    if (!username) return;
    try {
      const response = await fetch(`/list-images?username=${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error('Failed to fetch images');
      const data = await response.json();
      setImages(data.images);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !username) {
      alert('Please select an image and enter a username.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operation', operation);
    formData.append('username', username);

    if (operation === 'crop') {
      formData.append('x', cropDimensions.x);
      formData.append('y', cropDimensions.y);
      formData.append('width', cropDimensions.width);
      formData.append('height', cropDimensions.height);
    } else if (operation === 'rotate') {
      formData.append('angle', rotationAngle);
    }

    try {
      const response = await fetch('/images/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Server responded with an error');

      const blob = await response.blob();
      const newImageUrl = URL.createObjectURL(blob);
      setImageUrl(newImageUrl);
      const newFile = new File([blob], 'processed_image.jpg', { type: 'image/jpeg' });
      setFile(newFile);
      fetchImages(username);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = async (imageName) => {
    const fullUrl = `/static/uploads/${imageName}`;
    try {
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const loadedFile = new File([blob], imageName, { type: blob.type });
      setFile(loadedFile);
      setImageUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Failed to load image from server", err);
    }
  };

  useEffect(() => {
    if (username) fetchImages(username);
  }, [username]);

  return (
    <div style={{ margin: '20px' }}>
      <h1>Image Processing App</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 2 }}>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Username:&nbsp;
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              </label>
            </div><br />
            <div>
              <label>Select Image:&nbsp;
                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
              </label>
            </div><br />
            <div>
              <label>Operation:&nbsp;
                <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                  <option value="crop">Crop</option>
                  <option value="rotate">Rotate</option>
                  <option value="flip_h">Flip Horizontally</option>
                  <option value="flip_v">Flip Vertically</option>
                </select>
              </label>
            </div><br />
            {operation === 'crop' && (
              <div>
                {['x', 'y', 'width', 'height'].map((key) => (
                  <label key={key}>{key.toUpperCase()}:&nbsp;
                    <input type="number" value={cropDimensions[key]} onChange={(e) =>
                      setCropDimensions({ ...cropDimensions, [key]: parseInt(e.target.value) })} />
                    &nbsp;&nbsp;
                  </label>
                ))}
              </div>
            )}
            {operation === 'rotate' && (
              <div>
                <label>Angle (degrees):&nbsp;
                  <input type="number" value={rotationAngle}
                    onChange={(e) => setRotationAngle(parseInt(e.target.value))} />
                </label>
              </div>
            )}
            <br />
            <button type="submit" disabled={!file || loading}>
              {loading ? 'Processing...' : 'Process Image'}
            </button>
          </form>

          {imageUrl && (
            <div>
              <h2>{loading ? 'Processing...' : 'Processed Image'}</h2>
              <img src={imageUrl} alt="Processed" />
              {!loading && <a href={imageUrl} download="processed-image.jpg">Download</a>}
            </div>
          )}
        </div>

        <div style={{ flex: 1, marginLeft: '30px' }}>
          <h2>Previous Images</h2>
          <ul>
            {images.map((imgName, idx) => (
              <div key={idx}><br />
                <button onClick={() => handleImageClick(imgName)}>
                  {imgName.split("_")[1] + "_" + imgName.split("_")[2]}
                </button>
              </div>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
