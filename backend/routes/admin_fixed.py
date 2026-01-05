import os
import uuid
from datetime import datetime
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from PIL import Image
import io

# Configuration constants
UPLOAD_BASE_DIR = 'static/uploads/products'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
IMAGE_MAX_WIDTH = 2000
IMAGE_MAX_HEIGHT = 2000
THUMBNAIL_SIZE = (300, 300)

admin_blueprint = Blueprint('admin', __name__, url_prefix='/api/admin')


def ensure_upload_directory():
    """Ensure the upload directory exists, create if necessary."""
    try:
        os.makedirs(UPLOAD_BASE_DIR, exist_ok=True)
        return True
    except OSError as e:
        raise Exception(f"Failed to create upload directory: {str(e)}")


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_image_file(file):
    """
    Validate uploaded file for security and format.
    
    Args:
        file: Flask FileStorage object
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not file or file.filename == '':
        return False, "No file selected for uploading"
    
    if not allowed_file(file.filename):
        return False, f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File size exceeds maximum limit of {MAX_FILE_SIZE / (1024*1024):.1f}MB"
    
    if file_size == 0:
        return False, "File is empty"
    
    # Validate image format
    try:
        img = Image.open(io.BytesIO(file.read()))
        img.verify()
        file.seek(0)  # Reset file pointer
        
        # Check image dimensions
        img = Image.open(io.BytesIO(file.read()))
        width, height = img.size
        
        if width > IMAGE_MAX_WIDTH or height > IMAGE_MAX_HEIGHT:
            return False, f"Image dimensions exceed maximum ({IMAGE_MAX_WIDTH}x{IMAGE_MAX_HEIGHT})"
        
        file.seek(0)  # Reset file pointer again
        return True, None
        
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"


def optimize_image(file, filename):
    """
    Optimize image by resizing if necessary and converting to efficient format.
    
    Args:
        file: Flask FileStorage object
        filename: Original filename
        
    Returns:
        tuple: (optimized_image_bytes, optimized_filename)
    """
    try:
        img = Image.open(io.BytesIO(file.read()))
        
        # Convert RGBA to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Resize if necessary
        if img.size[0] > IMAGE_MAX_WIDTH or img.size[1] > IMAGE_MAX_HEIGHT:
            img.thumbnail((IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT), Image.Resampling.LANCZOS)
        
        # Save optimized image
        output = io.BytesIO()
        # Convert to JPEG for better compression
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        # Update filename to .jpg
        name, _ = os.path.splitext(filename)
        optimized_filename = f"{name}.jpg"
        
        return output.getvalue(), optimized_filename
        
    except Exception as e:
        raise Exception(f"Failed to optimize image: {str(e)}")


def generate_unique_filename(original_filename):
    """
    Generate unique filename with timestamp and UUID.
    
    Args:
        original_filename: Original uploaded filename
        
    Returns:
        str: Unique filename
    """
    name, ext = os.path.splitext(secure_filename(original_filename))
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}_{name}{ext}"


def save_uploaded_file(file_content, filename):
    """
    Save file to upload directory.
    
    Args:
        file_content: File content (bytes)
        filename: Filename to save
        
    Returns:
        tuple: (success, filepath, error_message)
    """
    try:
        ensure_upload_directory()
        filepath = os.path.join(UPLOAD_BASE_DIR, filename)
        
        # Ensure unique filename if exists
        if os.path.exists(filepath):
            name, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(os.path.join(UPLOAD_BASE_DIR, f"{name}_{counter}{ext}")):
                counter += 1
            filepath = os.path.join(UPLOAD_BASE_DIR, f"{name}_{counter}{ext}")
            filename = f"{name}_{counter}{ext}"
        
        with open(filepath, 'wb') as f:
            f.write(file_content)
        
        return True, filepath, None
        
    except Exception as e:
        return False, None, f"Failed to save file: {str(e)}"


def generate_image_urls(filename):
    """
    Generate image URLs for different contexts.
    
    Args:
        filename: Saved filename
        
    Returns:
        dict: URLs for different views
    """
    base_url = f"/static/uploads/products/{filename}"
    
    return {
        'admin_url': base_url,
        'customer_url': base_url,
        'thumbnail_url': base_url,
        'full_path': base_url
    }


@admin_blueprint.route('/upload-product-image', methods=['POST'])
def upload_product_image():
    """
    Upload product image with comprehensive error handling.
    
    Endpoint: POST /api/admin/upload-product-image
    
    Form Data:
        - file: Image file to upload
        - product_id (optional): Associated product ID
        
    Returns:
        JSON response with upload status and image URLs
    """
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided',
                'code': 'NO_FILE'
            }), 400
        
        file = request.files['file']
        
        # Validate file
        is_valid, error_msg = validate_image_file(file)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error_msg,
                'code': 'INVALID_FILE'
            }), 400
        
        # Optimize image
        try:
            optimized_content, optimized_filename = optimize_image(file, file.filename)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'code': 'OPTIMIZATION_FAILED'
            }), 500
        
        # Generate unique filename
        unique_filename = generate_unique_filename(optimized_filename)
        
        # Save file
        success, filepath, error = save_uploaded_file(optimized_content, unique_filename)
        if not success:
            return jsonify({
                'success': False,
                'error': error,
                'code': 'SAVE_FAILED'
            }), 500
        
        # Generate image URLs
        urls = generate_image_urls(unique_filename)
        
        return jsonify({
            'success': True,
            'message': 'Image uploaded successfully',
            'filename': unique_filename,
            'file_path': filepath,
            'urls': urls,
            'url': urls['customer_url'],  # Main URL for backward compatibility
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Unexpected error in upload_product_image: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e),
            'code': 'INTERNAL_ERROR'
        }), 500


@admin_blueprint.route('/product-image/<filename>', methods=['GET'])
def get_product_image(filename):
    """
    Retrieve product image metadata and validation.
    
    Args:
        filename: Image filename
        
    Returns:
        JSON response with image information
    """
    try:
        filepath = os.path.join(UPLOAD_BASE_DIR, secure_filename(filename))
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': 'Image not found',
                'code': 'NOT_FOUND'
            }), 404
        
        file_size = os.path.getsize(filepath)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'file_size': file_size,
            'exists': True,
            'urls': generate_image_urls(filename)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'code': 'ERROR'
        }), 500


@admin_blueprint.route('/delete-product-image/<filename>', methods=['DELETE'])
def delete_product_image(filename):
    """
    Delete product image from server.
    
    Args:
        filename: Image filename to delete
        
    Returns:
        JSON response with deletion status
    """
    try:
        secure_name = secure_filename(filename)
        filepath = os.path.join(UPLOAD_BASE_DIR, secure_name)
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': 'Image not found',
                'code': 'NOT_FOUND'
            }), 404
        
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': 'Image deleted successfully',
            'filename': secure_name
        }), 200
        
    except PermissionError:
        return jsonify({
            'success': False,
            'error': 'Permission denied to delete file',
            'code': 'PERMISSION_DENIED'
        }), 403
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Failed to delete image: {str(e)}",
            'code': 'DELETE_FAILED'
        }), 500


@admin_blueprint.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify upload directory.
    
    Returns:
        JSON response with health status
    """
    try:
        ensure_upload_directory()
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'upload_dir': UPLOAD_BASE_DIR,
            'upload_dir_exists': os.path.exists(UPLOAD_BASE_DIR),
            'is_writable': os.access(UPLOAD_BASE_DIR, os.W_OK)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500


# Configuration function to register blueprint
def register_admin_routes(app):
    """
    Register admin blueprint with Flask app.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(admin_blueprint)
    ensure_upload_directory()
