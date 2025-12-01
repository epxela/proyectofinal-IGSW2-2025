from flask import Blueprint, request, jsonify
from app import db
from app.models import Cliente

clientes_bp = Blueprint('clientes', __name__)

@clientes_bp.route('', methods=['GET'])
def get_clientes():
    tipo = request.args.get('tipo')  # filtrar por tipo: minorista, corporativo
    
    query = Cliente.query.filter_by(activo=True)
    if tipo:
        query = query.filter_by(tipo=tipo)
    
    clientes = query.all()
    return jsonify([c.to_dict() for c in clientes])

@clientes_bp.route('/<int:id>', methods=['GET'])
def get_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    return jsonify(cliente.to_dict())

@clientes_bp.route('', methods=['POST'])
def create_cliente():
    data = request.get_json()
    
    cliente = Cliente(
        nombre=data['nombre'],
        nit=data.get('nit', 'CF'),
        telefono=data.get('telefono'),
        email=data.get('email'),
        tipo=data.get('tipo', 'minorista')
    )
    
    db.session.add(cliente)
    db.session.commit()
    
    return jsonify(cliente.to_dict()), 201

@clientes_bp.route('/<int:id>', methods=['PUT'])
def update_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    data = request.get_json()
    
    cliente.nombre = data.get('nombre', cliente.nombre)
    cliente.nit = data.get('nit', cliente.nit)
    cliente.telefono = data.get('telefono', cliente.telefono)
    cliente.email = data.get('email', cliente.email)
    cliente.tipo = data.get('tipo', cliente.tipo)
    cliente.activo = data.get('activo', cliente.activo)
    
    db.session.commit()
    
    return jsonify(cliente.to_dict())

@clientes_bp.route('/<int:id>', methods=['DELETE'])
def delete_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    cliente.activo = False
    db.session.commit()
    
    return jsonify({'message': 'Cliente eliminado'})
