# API Usage Examples

## New Features Usage Guide

### 1. Sales Report Generation

#### Generate PDF Sales Report

**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/reports/sales/generate \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "period": "monthly",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }' \
  --output sales_report_monthly.pdf
```

**Parameters:**
- `format`: "pdf" or "docx" (required)
- `period`: "daily", "weekly", or "monthly" (required)
- `start_date`: ISO date format "YYYY-MM-DD" (optional)
- `end_date`: ISO date format "YYYY-MM-DD" (optional)

#### Generate DOCX Sales Report

**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/reports/sales/generate \
  -H "Content-Type: application/json" \
  -d '{
    "format": "docx",
    "period": "weekly"
  }' \
  --output sales_report_weekly.docx
```

#### Using Python requests

```python
import requests

url = "http://localhost:5000/api/admin/reports/sales/generate"
payload = {
    "format": "pdf",
    "period": "monthly",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    with open("sales_report.pdf", "wb") as f:
        f.write(response.content)
    print("Report generated successfully!")
else:
    print(f"Error: {response.json()}")
```

#### Using JavaScript/Fetch

```javascript
async function generateReport() {
    const response = await fetch('http://localhost:5000/api/admin/reports/sales/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            format: 'pdf',
            period: 'daily',
            start_date: '2024-01-01',
            end_date: '2024-12-31'
        })
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sales_report.pdf';
        a.click();
    } else {
        const error = await response.json();
        console.error('Error:', error);
    }
}
```

### 2. Product Image Upload

#### Upload Image via cURL

**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/products/1/upload-image \
  -F "image_file=@/path/to/product_image.jpg"
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "image_url": "/static/uploads/products/a1b2c3d4e5f6.jpg"
}
```

#### Using Python requests

```python
import requests

url = "http://localhost:5000/api/admin/products/1/upload-image"

with open("product_image.jpg", "rb") as f:
    files = {"image_file": f}
    response = requests.post(url, files=files)

if response.status_code == 200:
    data = response.json()
    print(f"Image uploaded: {data['image_url']}")
else:
    print(f"Error: {response.json()}")
```

#### Using JavaScript/FormData

```javascript
async function uploadProductImage(productId, file) {
    const formData = new FormData();
    formData.append('image_file', file);

    const response = await fetch(`http://localhost:5000/api/admin/products/${productId}/upload-image`, {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Image uploaded:', data.image_url);
        return data.image_url;
    } else {
        const error = await response.json();
        console.error('Error:', error);
        throw new Error(error.error);
    }
}

// Usage with file input
const fileInput = document.getElementById('productImage');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const imageUrl = await uploadProductImage(1, file);
            console.log('Image URL:', imageUrl);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    }
});
```

#### React Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function ProductImageUpload({ productId }) {
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image_file', file);

        setUploading(true);
        try {
            const response = await axios.post(
                `http://localhost:5000/api/admin/products/${productId}/upload-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            setImageUrl(response.data.image_url);
            alert('Image uploaded successfully!');
        } catch (error) {
            alert('Upload failed: ' + error.response?.data?.error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                accept="image/png,image/jpg,image/jpeg,image/gif"
                onChange={handleFileUpload}
                disabled={uploading}
            />
            {uploading && <p>Uploading...</p>}
            {imageUrl && (
                <div>
                    <p>Image uploaded!</p>
                    <img 
                        src={`http://localhost:5000${imageUrl}`} 
                        alt="Product" 
                        style={{ maxWidth: '200px' }}
                    />
                </div>
            )}
        </div>
    );
}

export default ProductImageUpload;
```

### 3. Create Product with Image

You can create a product with an image in two ways:

#### Option 1: Create product with image URL
```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 29.99,
    "category_id": 1,
    "stock_quantity": 100,
    "image_url": "https://example.com/image.jpg"
  }'
```

#### Option 2: Create product, then upload image
```bash
# 1. Create product
PRODUCT_ID=$(curl -X POST http://localhost:5000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 29.99,
    "category_id": 1,
    "stock_quantity": 100
  }' | jq -r '.product_id')

# 2. Upload image
curl -X POST http://localhost:5000/api/admin/products/$PRODUCT_ID/upload-image \
  -F "image_file=@product.jpg"
```

### 4. Update Product with Image

#### Update product with new image URL
```bash
curl -X PUT http://localhost:5000/api/admin/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "image_url": "https://example.com/new-image.jpg"
  }'
```

#### Upload new image for existing product
```bash
curl -X POST http://localhost:5000/api/admin/products/1/upload-image \
  -F "image_file=@new_product_image.jpg"
```

### 5. View Uploaded Images

After uploading an image, you can access it via the static file endpoint:

**URL Pattern:**
```
http://localhost:5000/static/uploads/products/{filename}
```

**Example:**
```
http://localhost:5000/static/uploads/products/a1b2c3d4e5f6.jpg
```

**In HTML:**
```html
<img src="http://localhost:5000/static/uploads/products/a1b2c3d4e5f6.jpg" alt="Product">
```

## Testing the Refactored Backend

### 1. Start the Backend
```bash
cd backend
python backend.py
```

### 2. Test Health Check
```bash
curl http://localhost:5000/api/health
```

### 3. Test Products Endpoint (Blueprint)
```bash
curl http://localhost:5000/api/products/categories
```

### 4. Test Cart Endpoint (Blueprint)
```bash
curl http://localhost:5000/api/cart?user_id=1
```

### 5. Test Orders Endpoint (Blueprint)
```bash
curl http://localhost:5000/api/orders/user/1
```

### 6. Test Admin Endpoint (Blueprint)
```bash
curl http://localhost:5000/api/admin/users
```

### 7. Run Validation Tests
```bash
cd backend
python test_refactoring.py
```

## Error Handling

### Common Errors

#### 1. Invalid File Type
**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/products/1/upload-image \
  -F "image_file=@document.pdf"
```

**Response:**
```json
{
  "error": "Invalid file type. Allowed: png, jpg, jpeg, gif"
}
```

#### 2. No File Provided
**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/products/1/upload-image
```

**Response:**
```json
{
  "error": "No image file provided"
}
```

#### 3. Product Not Found
**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/products/9999/upload-image \
  -F "image_file=@image.jpg"
```

**Response:**
```json
{
  "error": "Product not found"
}
```

#### 4. Invalid Report Format
**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/reports/sales/generate \
  -H "Content-Type: application/json" \
  -d '{"format": "xlsx", "period": "daily"}'
```

**Response:**
```json
{
  "error": "Invalid format. Use pdf or docx"
}
```

## Best Practices

### 1. Image Upload
- Always validate file size on client side before uploading
- Use accepted image formats: png, jpg, jpeg, gif
- Handle upload progress for better UX
- Show preview before uploading
- Compress large images before uploading

### 2. Sales Report Generation
- Specify date ranges for better performance
- Use appropriate period (daily/weekly/monthly) based on data volume
- Cache generated reports when possible
- Generate reports asynchronously for large datasets

### 3. Static File Access
- Use CDN for production environments
- Implement image caching headers
- Consider image optimization/resizing
- Add authentication for sensitive files

## Production Considerations

### 1. Security
- Add authentication middleware for admin routes
- Implement rate limiting
- Validate and sanitize all file uploads
- Use HTTPS in production
- Add CSRF protection

### 2. Performance
- Implement caching for static files
- Use async task queue for report generation
- Compress images on upload
- Add database indexes for report queries

### 3. Storage
- Use cloud storage (S3, CloudFlare R2) for uploaded files
- Implement file cleanup for old/unused images
- Set up backup strategy for uploaded files
- Monitor storage usage

### 4. Monitoring
- Add logging for all admin actions
- Track API usage and errors
- Monitor file upload sizes and types
- Set up alerts for failures
