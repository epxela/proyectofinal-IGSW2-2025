from flask import Blueprint, request, jsonify
from app import db
from app.models import Alerta, Producto

alertas_bp = Blueprint('alertas', __name__)

@alertas_bp.route('', methods=['GET'])
def get_alertas():
    """Obtener alertas con filtros"""
    solo_pendientes = request.args.get('pendientes', 'true').lower() == 'true'
    tipo = request.args.get('tipo')
    
    query = Alerta.query
    
    if solo_pendientes:
        query = query.filter_by(leida=False)
    if tipo:
        query = query.filter_by(tipo=tipo)
    
    alertas = query.order_by(Alerta.fecha.desc()).all()
    return jsonify([a.to_dict() for a in alertas])


@alertas_bp.route('/count', methods=['GET'])
def get_alertas_count():
    """Contador de alertas pendientes"""
    count = Alerta.query.filter_by(leida=False).count()
    return jsonify({'pendientes': count})


@alertas_bp.route('/<int:id>/leer', methods=['PUT'])
def marcar_leida(id):
    """Marcar alerta como leída"""
    alerta = Alerta.query.get_or_404(id)
    alerta.leida = True
    db.session.commit()
    
    return jsonify(alerta.to_dict())


@alertas_bp.route('/leer-todas', methods=['PUT'])
def marcar_todas_leidas():
    """Marcar todas las alertas como leídas"""
    Alerta.query.filter_by(leida=False).update({'leida': True})
    db.session.commit()
    
    return jsonify({'message': 'Todas las alertas marcadas como leídas'})


@alertas_bp.route('/generar-stock-bajo', methods=['POST'])
def generar_alertas_stock():
    """Revisar todos los productos y generar alertas de stock bajo"""
    productos = Producto.query.filter(
        Producto.activo == True,
        Producto.stock_actual <= Producto.stock_minimo
    ).all()
    
    alertas_creadas = 0
    
    for producto in productos:
        # Verificar si ya existe alerta pendiente
        existe = Alerta.query.filter_by(
            producto_id=producto.id,
            leida=False,
            tipo='stock_bajo'
        ).first()
        
        if not existe:
            tipo = 'stock_critico' if producto.stock_actual == 0 else 'stock_bajo'
            alerta = Alerta(
                producto_id=producto.id,
                tipo=tipo,
                mensaje=f'{"SIN STOCK" if producto.stock_actual == 0 else "Stock bajo"} para {producto.nombre} (SKU: {producto.sku}). Actual: {producto.stock_actual}, Mínimo: {producto.stock_minimo}'
            )
            db.session.add(alerta)
            alertas_creadas += 1
    
    db.session.commit()
    
    return jsonify({
        'message': f'Se generaron {alertas_creadas} alertas',
        'alertas_creadas': alertas_creadas
    })
