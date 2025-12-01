from flask import Blueprint, request, jsonify
from app import db
from app.models import Devolucion, DevolucionDetalle, Producto, MovimientoInventario, Alerta

devoluciones_bp = Blueprint('devoluciones', __name__)

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
    
    return movimiento


@devoluciones_bp.route('', methods=['GET'])
def get_devoluciones():
    tipo = request.args.get('tipo')  # cliente, proveedor
    
    query = Devolucion.query
    if tipo:
        query = query.filter_by(tipo=tipo)
    
    devoluciones = query.order_by(Devolucion.fecha.desc()).all()
    return jsonify([d.to_dict() for d in devoluciones])


@devoluciones_bp.route('/<int:id>', methods=['GET'])
def get_devolucion(id):
    devolucion = Devolucion.query.get_or_404(id)
    return jsonify(devolucion.to_dict())


@devoluciones_bp.route('', methods=['POST'])
def create_devolucion():
    """
    Crear devolución
    
    Body esperado:
    {
        "tipo": "cliente",  // cliente o proveedor
        "referencia_id": 1,  // id de venta o compra original (opcional)
        "motivo": "Producto defectuoso",
        "detalles": [
            {"producto_id": 1, "cantidad": 1, "precio_unitario": 150.00}
        ]
    }
    """
    data = request.get_json()
    
    devolucion = Devolucion(
        tipo=data['tipo'],
        referencia_id=data.get('referencia_id'),
        motivo=data['motivo']
    )
    db.session.add(devolucion)
    db.session.flush()
    
    total = 0
    
    for item in data['detalles']:
        detalle = DevolucionDetalle(
            devolucion_id=devolucion.id,
            producto_id=item['producto_id'],
            cantidad=item['cantidad'],
            precio_unitario=item['precio_unitario']
        )
        db.session.add(detalle)
        total += item['cantidad'] * item['precio_unitario']
        
        # Devolución de cliente = entrada de inventario
        # Devolución a proveedor = salida de inventario
        if data['tipo'] == 'cliente':
            registrar_movimiento(
                producto_id=item['producto_id'],
                tipo='entrada',
                motivo='devolucion',
                cantidad=item['cantidad'],
                referencia_id=devolucion.id,
                observaciones=f'Devolución cliente #{devolucion.id}'
            )
        else:  # proveedor
            registrar_movimiento(
                producto_id=item['producto_id'],
                tipo='salida',
                motivo='devolucion',
                cantidad=item['cantidad'],
                referencia_id=devolucion.id,
                observaciones=f'Devolución a proveedor #{devolucion.id}'
            )
    
    devolucion.total = total
    db.session.commit()
    
    return jsonify(devolucion.to_dict()), 201
