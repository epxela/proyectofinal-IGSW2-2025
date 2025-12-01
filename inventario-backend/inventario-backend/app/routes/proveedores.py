from flask import Blueprint, request, jsonify
from app import db
from app.models import Proveedor

proveedores_bp = Blueprint('proveedores', __name__)

@proveedores_bp.route('', methods=['GET'])
def get_proveedores():
    proveedores = Proveedor.query.filter_by(activo=True).all()
    return jsonify([p.to_dict() for p in proveedores])

@proveedores_bp.route('/<int:id>', methods=['GET'])
def get_proveedor(id):
    proveedor = Proveedor.query.get_or_404(id)
    return jsonify(proveedor.to_dict())

@proveedores_bp.route('', methods=['POST'])
def create_proveedor():
    data = request.get_json()
    
    proveedor = Proveedor(
        nombre=data['nombre'],
        telefono=data.get('telefono'),
        email=data.get('email')
    )
    
    db.session.add(proveedor)
    db.session.commit()
    
    return jsonify(proveedor.to_dict()), 201

@proveedores_bp.route('/<int:id>', methods=['PUT'])
def update_proveedor(id):
    proveedor = Proveedor.query.get_or_404(id)
    data = request.get_json()
    
    proveedor.nombre = data.get('nombre', proveedor.nombre)
    proveedor.telefono = data.get('telefono', proveedor.telefono)
    proveedor.email = data.get('email', proveedor.email)
    proveedor.activo = data.get('activo', proveedor.activo)
    
    db.session.commit()
    
    return jsonify(proveedor.to_dict())

@proveedores_bp.route('/<int:id>', methods=['DELETE'])
def delete_proveedor(id):
    proveedor = Proveedor.query.get_or_404(id)
    proveedor.activo = False
    db.session.commit()
    
    return jsonify({'message': 'Proveedor eliminado'})
