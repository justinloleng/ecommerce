from marshmallow import Schema, fields, validate, ValidationError

class RegisterSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    phone = fields.Str(validate=validate.Length(max=20))
    address = fields.Str()

class LoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)

class ProductSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str()
    price = fields.Decimal(required=True, validate=validate.Range(min=0))
    stock_quantity = fields.Int(validate=validate.Range(min=0))
    category_id = fields.Int(required=True)
    image_url = fields.Str(validate=validate.Length(max=500))

class CategorySchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str()

class CartItemSchema(Schema):
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))

class CheckoutSchema(Schema):
    shipping_address = fields.Str(required=True, validate=validate.Length(min=10))
    phone = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    payment_method = fields.Str(required=True, validate=validate.OneOf(['cod', 'online']))

class OrderStatusSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(['Pending', 'Approved', 'Shipped', 'Delivered', 'Declined']))
    decline_reason = fields.Str()
