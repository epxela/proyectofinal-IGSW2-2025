from flask import Blueprint, request, jsonify
from app import db
from app.models import Compra, CompraDetalle, Producto, MovimientoInventario, Alerta
from datetime import datetime

compras_bp = Blueprint('compras', __name__)

def registrar_movimiento(producto_id, tipo, motivo, cantidad, referencia_id=None, observaciones=None):
    """Registra movimiento y actualiza stock"""
    producto = Producto.query.get(producto_id)
    stock_anterior = producto.stock_actual
    
    if tipo == 'entrada':
        stock_nuevo = stock_anterior + cantidad
    else:
        stock_nuevo = stock_anterior - cantidad
    
    # Actualizar stock
    producto.stock_actual = stock_nuevo
    
    # Crear movimiento
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
    
    # Verificar alerta de stock bajo
    if stock_nuevo <= producto.stock_minimo:
        alerta = Alerta(
            producto_id=producto_id,
            tipo='stock_bajo',
            mensaje=f'Stock bajo para {producto.nombre} (SKU: {producto.sku}). Actual: {stock_nuevo}, Mínimo: {producto.stock_minimo}'
        )
        db.session.add(alerta)
    
    return movimiento


@compras_bp.route('', methods=['GET'])
def get_compras():
    fecha_desde = request.args.get('fecha_desde')
    fecha_hasta = request.args.get('fecha_hasta')
    proveedor_id = request.args.get('proveedor_id', type=int)
    
    query = Compra.query
    
    if proveedor_id:
        query = query.filter_by(proveedor_id=proveedor_id)
    if fecha_desde:
        query = query.filter(Compra.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Compra.fecha <= fecha_hasta)
    
    compras = query.order_by(Compra.fecha.desc()).all()
    return jsonify([c.to_dict() for c in compras])


@compras_bp.route('/<int:id>', methods=['GET'])
def get_compra(id):
    compra = Compra.query.get_or_404(id)
    return jsonify(compra.to_dict())


@compras_bp.route('', methods=['POST'])
def create_compra():
    """
    Crear compra y registrar entrada de inventario automáticamente
    
    Body esperado:
    {
        "proveedor_id": 1,
        "numero_documento": "FAC-001",
        "detalles": [
            {"producto_id": 1, "cantidad": 10, "precio_unitario": 100.00},
            {"producto_id": 2, "cantidad": 5, "precio_unitario": 200.00}
        ]
    }
    """
    data = request.get_json()
    
    # Crear compra
    compra = Compra(
        proveedor_id=data['proveedor_id'],
        numero_documento=data.get('numero_documento')
    )
    db.session.add(compra)
    db.session.flush()  # Para obtener el ID
    
    total = 0
    
    # Procesar detalles
    for item in data['detalles']:
        subtotal = item['cantidad'] * item['precio_unitario']
        total += subtotal
        
        detalle = CompraDetalle(
            compra_id=compra.id,
            producto_id=item['producto_id'],
            cantidad=item['cantidad'],
            precio_unitario=item['precio_unitario'],
            subtotal=subtotal
        )
        db.session.add(detalle)
        
        # Registrar entrada de inventario
        registrar_movimiento(
            producto_id=item['producto_id'],
            tipo='entrada',
            motivo='compra',
            cantidad=item['cantidad'],
            referencia_id=compra.id,
            observaciones=f'Compra #{compra.id}'
        )
    
    compra.total = total
    db.session.commit()
    
    return jsonify(compra.to_dict()), 201


@compras_bp.route('/<int:id>', methods=['DELETE'])
def delete_compra(id):
    """Eliminar compra (solo si es reciente y revierte el inventario)"""
    compra = Compra.query.get_or_404(id)
    
    # Revertir movimientos de inventario
    for detalle in compra.detalles:
        registrar_movimiento(
            producto_id=detalle.producto_id,
            tipo='salida',
            motivo='ajuste',
            cantidad=detalle.cantidad,
            referencia_id=compra.id,
            observaciones=f'Reversión de compra #{compra.id}'
        )
    
    db.session.delete(compra)
    db.session.commit()
    
    return jsonify({'message': 'Compra eliminada y stock revertido'})
