from flask import Flask, request, send_from_directory, send_file
from flask_cors import CORS
from PIL import Image
import io
import os
from datetime import datetime

app = Flask(__name__, static_folder='client/build', static_url_path='/')
CORS(app)

UPLOAD_FOLDER = os.path.join(app.root_path, 'client', 'build', 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/static/uploads/<path:filename>')
def serve_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/images/process', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    operation = request.form.get('operation', 'crop')
    img = Image.open(file.stream)

    if operation == 'crop':
        try:
            x = int(request.form.get('x', 0))
            y = int(request.form.get('y', 0))
            width = int(request.form.get('width', 100))
            height = int(request.form.get('height', 100))
            img_width, img_height = img.size
            x = max(0, min(x, img_width - 1))
            y = max(0, min(y, img_height - 1))
            width = max(1, min(width, img_width - x))
            height = max(1, min(height, img_height - y))
            img = img.crop((x, y, x + width, y + height))
        except ValueError:
            return 'Invalid crop parameters', 400

    elif operation == 'rotate':
        try:
            angle = float(request.form.get('angle', 90))
            img = img.rotate(angle, expand=True)
        except ValueError:
            return 'Invalid rotation angle', 400

    elif operation == 'flip_h':
        img = img.transpose(Image.FLIP_LEFT_RIGHT)

    elif operation == 'flip_v':
        img = img.transpose(Image.FLIP_TOP_BOTTOM)

    else:
        return f'Unknown operation: {operation}', 400

    img_io = io.BytesIO()
    img_format = file.filename.split('.')[-1].upper()
    if img_format not in ['JPEG', 'JPG', 'PNG', 'GIF']:
        img_format = 'JPEG'
    if img_format == 'JPG':
        img_format = 'JPEG'
    img.save(img_io, format=img_format)
    img_io.seek(0)

    username = request.form.get('username', 'anonymous')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_filename = f"{username}_{timestamp}_{file.filename}"
    save_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    img.save(save_path)

    return send_file(img_io, mimetype=f'image/{img_format.lower()}', as_attachment=True,
                     download_name=f'processed_{file.filename}')

@app.route('/list-images')
def list_images():
    username = request.args.get('username')
    if not username:
        return {'error': 'Username is required'}, 400
    all_files = os.listdir(UPLOAD_FOLDER)
    user_files = [f for f in all_files if f.startswith(username + "_")]
    user_files.sort()
    return {'images': user_files}

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

