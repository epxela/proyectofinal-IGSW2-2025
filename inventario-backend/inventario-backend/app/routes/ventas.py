from flask import Blueprint, request, jsonify
from app import db
from app.models import Venta, VentaDetalle, Producto, MovimientoInventario, Alerta

ventas_bp = Blueprint('ventas', __name__)

def registrar_movimiento(producto_id, tipo, motivo, cantidad, referencia_id=None, observaciones=None):
    """Registra movimiento y actualiza stock"""
    producto = Producto.query.get(producto_id)
    stock_anterior = producto.stock_actual
    
    if tipo == 'entrada':
        stock_nuevo = stock_anterior + cantidad
    else:
        stock_nuevo = stock_anterior - cantidad
    
    producto.stock_actual = stock_nuevo
    
    movimiento = MovimientoInventario(
        producto_id=producto_id,
        tipo=tipo,
        motivo=motivo,
        cantidad=cantidad,
        stock_anterior=stock_anterior,
        stock_nuevo=stock_nuevo,
        referencia_id=referencia_id,
        observaciones=observaciones
    )
    db.session.add(movimiento)
    
    # Alerta de stock bajo
    if stock_nuevo <= producto.stock_minimo:
        alerta = Alerta(
            producto_id=producto_id,
            tipo='stock_bajo',
            mensaje=f'Stock bajo para {producto.nombre} (SKU: {producto.sku}). Actual: {stock_nuevo}, Mínimo: {producto.stock_minimo}'
        )
        db.session.add(alerta)
    
    return movimiento


@ventas_bp.route('', methods=['GET'])
def get_ventas():
    fecha_desde = request.args.get('fecha_desde')
    fecha_hasta = request.args.get('fecha_hasta')
    cliente_id = request.args.get('cliente_id', type=int)
    punto_venta = request.args.get('punto_venta')
    
    query = Venta.query
    
    if cliente_id:
        query = query.filter_by(cliente_id=cliente_id)
    if punto_venta:
        query = query.filter_by(punto_venta=punto_venta)
    if fecha_desde:
        query = query.filter(Venta.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Venta.fecha <= fecha_hasta)
    
    ventas = query.order_by(Venta.fecha.desc()).all()
    return jsonify([v.to_dict() for v in ventas])


@ventas_bp.route('/<int:id>', methods=['GET'])
def get_venta(id):
    venta = Venta.query.get_or_404(id)
    return jsonify(venta.to_dict())


@ventas_bp.route('', methods=['POST'])
def create_venta():
    """
    Crear venta y registrar salida de inventario automáticamente
    
    Body esperado:
    {
        "cliente_id": 1,  // opcional
        "punto_venta": "POS-01",
        "detalles": [
            {"producto_id": 1, "cantidad": 2, "precio_unitario": 150.00},
            {"producto_id": 2, "cantidad": 1, "precio_unitario": 300.00}
        ]
    }
    """
    data = request.get_json()
    
    # Verificar stock disponible
    for item in data['detalles']:
        producto = Producto.query.get(item['producto_id'])
        if not producto:
            return jsonify({'error': f'Producto {item["producto_id"]} no existe'}), 400
        if producto.stock_actual < item['cantidad']:
            return jsonify({
                'error': f'Stock insuficiente para {producto.nombre}. Disponible: {producto.stock_actual}'
            }), 400
    
    # Crear venta
    venta = Venta(
        cliente_id=data.get('cliente_id'),
        punto_venta=data.get('punto_venta')
    )
    db.session.add(venta)
    db.session.flush()
    
    total = 0
    
    for item in data['detalles']:
        subtotal = item['cantidad'] * item['precio_unitario']
        total += subtotal
        
        detalle = VentaDetalle(
            venta_id=venta.id,
            producto_id=item['producto_id'],
            cantidad=item['cantidad'],
            precio_unitario=item['precio_unitario'],
            subtotal=subtotal
        )
        db.session.add(detalle)
        
        # Registrar salida de inventario
        registrar_movimiento(
            producto_id=item['producto_id'],
            tipo='salida',
            motivo='venta',
            cantidad=item['cantidad'],
            referencia_id=venta.id,
            observaciones=f'Venta #{venta.id}'
        )
    
    venta.total = total
    db.session.commit()
    
    return jsonify(venta.to_dict()), 201


@ventas_bp.route('/<int:id>', methods=['DELETE'])
def delete_venta(id):
    """Cancelar venta y devolver stock"""
    venta = Venta.query.get_or_404(id)
    
    for detalle in venta.detalles:
        registrar_movimiento(
            producto_id=detalle.producto_id,
            tipo='entrada',
            motivo='ajuste',
            cantidad=detalle.cantidad,
            referencia_id=venta.id,
            observaciones=f'Cancelación de venta #{venta.id}'
        )
    
    db.session.delete(venta)
    db.session.commit()
    
    return jsonify({'message': 'Venta cancelada y stock restaurado'})
