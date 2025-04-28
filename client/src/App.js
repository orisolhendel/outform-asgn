import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);  // One state to handle both original and processed image
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState('crop');
  const [cropDimensions, setCropDimensions] = useState({
    x: 0, y: 0, width: 200, height: 200
  });
  const [rotationAngle, setRotationAngle] = useState(90);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const imageUrl = URL.createObjectURL(selectedFile); // Create an object URL for the selected image
      setImageUrl(imageUrl);  // Show the selected image immediately
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('operation', operation);

    // Add operation-specific parameters
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

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob); // Create a new URL for the processed image
      setImageUrl(imageUrl); // Update the displayed image with the processed one

      // Update the file state with the processed image to keep track of it
      setFile(blob); // This will make sure the new processed image is sent next time
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4" style={{margin: '20px'}}>
      <h1 className="text-2xl font-bold mb-4">Image Processing App</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block mb-2">
            Select Image: &nbsp;
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            /> &nbsp;
          </label>
          <br />&nbsp;
        </div>

        <div className="mb-4">
          <label className="block mb-2">
            Operation: &nbsp;
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            >
              <option value="crop">Crop</option>
              <option value="rotate">Rotate</option>
              <option value="flip_h">Flip Horizontally</option>
              <option value="flip_v">Flip Vertically</option>
            </select>
          </label>
          <br /> &nbsp;
        </div>

        {operation === 'crop' && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <label className="block">
              X:&nbsp;
              <input
                type="number"
                value={cropDimensions.x}
                onChange={(e) => setCropDimensions({...cropDimensions, x: parseInt(e.target.value)})}
                className="mt-1 block w-full p-2 border rounded"
              />
              &nbsp;&nbsp;
            </label>
            <label className="block">
              Y:&nbsp;
              <input
                type="number"
                value={cropDimensions.y}
                onChange={(e) => setCropDimensions({...cropDimensions, y: parseInt(e.target.value)})}
                className="mt-1 block w-full p-2 border rounded"
              />
              &nbsp;&nbsp;
            </label>
            <label className="block">
              Width:&nbsp;
              <input
                type="number"
                value={cropDimensions.width}
                onChange={(e) => setCropDimensions({...cropDimensions, width: parseInt(e.target.value)})}
                className="mt-1 block w-full p-2 border rounded"
              />
              &nbsp;&nbsp;
            </label>
            <label className="block">
              Height:&nbsp;
              <input
                type="number"
                value={cropDimensions.height}
                onChange={(e) => setCropDimensions({...cropDimensions, height: parseInt(e.target.value)})}
                className="mt-1 block w-full p-2 border rounded"
              />
            </label>
          </div>
        )}

        {operation === 'rotate' && (
          <div className="mb-4">
            <label className="block">
              Angle (degrees):
              <input
                type="number"
                value={rotationAngle}
                onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                className="mt-1 block w-full p-2 border rounded"
              />
            </label>
          </div>
        )}

        {(operation === 'flip_h' || operation === 'flip_v') && (
            <br />
        )}

        <br />
        <button
          type="submit"
          disabled={!file || loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Process Image'}
        </button>
      </form>

      <div className="mb-4">
        {imageUrl && (
          <div>
            <h2 className="text-lg font-semibold mb-2">{loading ? 'Processing...' : 'Processed Image'}</h2>
            <img
              src={imageUrl}
              alt="Processed"
              className="max-w-full h-auto border"
            />
            {!loading && (
              <div>
                  <a
                    href={imageUrl}
                    download="processed-image.jpg"
                    className="inline-block mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
                  >
                    Download
                  </a>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
