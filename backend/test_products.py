import requests

BASE_URL = "http://127.0.0.1:5000/api"

def test_products_api():
    print("🔍 Testing Products API...")
    
    # Test categories
    print("\n1. Testing /api/products/categories")
    r = requests.get(BASE_URL + "/products/categories")
    print(f"   Status: {r.status_code}")
    categories = r.json()
    print(f"   Found {len(categories)} categories")
    for cat in categories:
        print(f"     - {cat['name']}")
    
    # Test products
    print("\n2. Testing /api/products")
    r = requests.get(BASE_URL + "/products?page=1&per_page=5")
    print(f"   Status: {r.status_code}")
    data = r.json()
    print(f"   Total products: {data['total']}")
    print(f"   Page: {data['page']}")
    print(f"   Showing {len(data['products'])} products")
    
    # Test single product
    if data['products']:
        print("\n3. Testing /api/products/1")
        r = requests.get(BASE_URL + "/products/1")
        print(f"   Status: {r.status_code}")
        product = r.json()
        print(f"   Product: {product.get('name')}")
        print(f"   Price: ${product.get('price')}")
    
    print("\n✅ Products API is working!")

if __name__ == "__main__":
    test_products_api()