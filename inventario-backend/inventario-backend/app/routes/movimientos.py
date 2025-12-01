from flask import Blueprint, request, jsonify
from app import db
from app.models import MovimientoInventario, Producto, Alerta

movimientos_bp = Blueprint('movimientos', __name__)

@movimientos_bp.route('', methods=['GET'])
def get_movimientos():
    """Historial de movimientos con filtros"""
    producto_id = request.args.get('producto_id', type=int)
    tipo = request.args.get('tipo')  # entrada, salida
    motivo = request.args.get('motivo')  # compra, venta, devolucion, ajuste
    fecha_desde = request.args.get('fecha_desde')
    fecha_hasta = request.args.get('fecha_hasta')
    limit = request.args.get('limit', 100, type=int)
    
    query = MovimientoInventario.query
    
    if producto_id:
        query = query.filter_by(producto_id=producto_id)
    if tipo:
        query = query.filter_by(tipo=tipo)
    if motivo:
        query = query.filter_by(motivo=motivo)
    if fecha_desde:
        query = query.filter(MovimientoInventario.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(MovimientoInventario.fecha <= fecha_hasta)
    
    movimientos = query.order_by(MovimientoInventario.fecha.desc()).limit(limit).all()
    return jsonify([m.to_dict() for m in movimientos])


@movimientos_bp.route('/<int:id>', methods=['GET'])
def get_movimiento(id):
    movimiento = MovimientoInventario.query.get_or_404(id)
    return jsonify(movimiento.to_dict())


@movimientos_bp.route('/ajuste', methods=['POST'])
def crear_ajuste():
    """
    Crear ajuste manual de inventario
    
    Body esperado:
    {
        "producto_id": 1,
        "tipo": "entrada",  // entrada o salida
        "cantidad": 5,
        "observaciones": "Conteo físico"
    }
    """
    data = request.get_json()
    
    producto = Producto.query.get_or_404(data['producto_id'])
    stock_anterior = producto.stock_actual
    
    if data['tipo'] == 'entrada':
        stock_nuevo = stock_anterior + data['cantidad']
    else:
        stock_nuevo = stock_anterior - data['cantidad']
        if stock_nuevo < 0:
            return jsonify({'error': 'Stock insuficiente para el ajuste'}), 400
    
    producto.stock_actual = stock_nuevo
    
    movimiento = MovimientoInventario(
        producto_id=data['producto_id'],
        tipo=data['tipo'],
        motivo='ajuste',
        cantidad=data['cantidad'],
        stock_anterior=stock_anterior,
        stock_nuevo=stock_nuevo,
        observaciones=data.get('observaciones', 'Ajuste manual')
    )
    db.session.add(movimiento)
    
    # Alerta de stock bajo
    if stock_nuevo <= producto.stock_minimo:
        alerta = Alerta(
            producto_id=producto.id,
            tipo='stock_bajo',
            mensaje=f'Stock bajo para {producto.nombre}. Actual: {stock_nuevo}'
        )
        db.session.add(alerta)
    
    db.session.commit()
    
    return jsonify(movimiento.to_dict()), 201
