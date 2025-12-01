from flask import Blueprint, request, jsonify
from app import db
from app.models import Producto, Categoria

productos_bp = Blueprint('productos', __name__)

@productos_bp.route('', methods=['GET'])
def get_productos():
    categoria_id = request.args.get('categoria_id', type=int)
    stock_bajo = request.args.get('stock_bajo', type=bool)
    
    query = Producto.query.filter_by(activo=True)
    
    if categoria_id:
        query = query.filter_by(categoria_id=categoria_id)
    
    if stock_bajo:
        query = query.filter(Producto.stock_actual <= Producto.stock_minimo)
    
    productos = query.all()
    return jsonify([p.to_dict() for p in productos])

@productos_bp.route('/<int:id>', methods=['GET'])
def get_producto(id):
    producto = Producto.query.get_or_404(id)
    return jsonify(producto.to_dict())

@productos_bp.route('/sku/<sku>', methods=['GET'])
def get_producto_by_sku(sku):
    producto = Producto.query.filter_by(sku=sku, activo=True).first_or_404()
    return jsonify(producto.to_dict())

@productos_bp.route('', methods=['POST'])
def create_producto():
    data = request.get_json()
    
    # Verificar SKU único
    if Producto.query.filter_by(sku=data['sku']).first():
        return jsonify({'error': 'SKU ya existe'}), 400
    
    producto = Producto(
        sku=data['sku'],
        nombre=data['nombre'],
        categoria_id=data.get('categoria_id'),
        precio_compra=data.get('precio_compra', 0),
        precio_venta=data['precio_venta'],
        stock_actual=data.get('stock_actual', 0),
        stock_minimo=data.get('stock_minimo', 5)
    )
    
    db.session.add(producto)
    db.session.commit()
    
    return jsonify(producto.to_dict()), 201

@productos_bp.route('/<int:id>', methods=['PUT'])
def update_producto(id):
    producto = Producto.query.get_or_404(id)
    data = request.get_json()
    
    # Verificar SKU único si cambió
    if 'sku' in data and data['sku'] != producto.sku:
        if Producto.query.filter_by(sku=data['sku']).first():
            return jsonify({'error': 'SKU ya existe'}), 400
        producto.sku = data['sku']
    
    producto.nombre = data.get('nombre', producto.nombre)
    producto.categoria_id = data.get('categoria_id', producto.categoria_id)
    producto.precio_compra = data.get('precio_compra', producto.precio_compra)
    producto.precio_venta = data.get('precio_venta', producto.precio_venta)
    producto.stock_minimo = data.get('stock_minimo', producto.stock_minimo)
    producto.activo = data.get('activo', producto.activo)
    
    db.session.commit()
    
    return jsonify(producto.to_dict())

@productos_bp.route('/<int:id>', methods=['DELETE'])
def delete_producto(id):
    producto = Producto.query.get_or_404(id)
    producto.activo = False
    db.session.commit()
    
    return jsonify({'message': 'Producto eliminado'})
