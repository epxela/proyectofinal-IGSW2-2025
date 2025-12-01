from flask import Blueprint, request, jsonify
from app import db
from app.models import Categoria

categorias_bp = Blueprint('categorias', __name__)

# GET - Listar todas
@categorias_bp.route('', methods=['GET'])
def get_categorias():
    categorias = Categoria.query.filter_by(activo=True).all()
    return jsonify([c.to_dict() for c in categorias])

# GET - Obtener una
@categorias_bp.route('/<int:id>', methods=['GET'])
def get_categoria(id):
    categoria = Categoria.query.get_or_404(id)
    return jsonify(categoria.to_dict())

# POST - Crear
@categorias_bp.route('', methods=['POST'])
def create_categoria():
    data = request.get_json()
    
    categoria = Categoria(
        nombre=data['nombre']
    )
    
    db.session.add(categoria)
    db.session.commit()
    
    return jsonify(categoria.to_dict()), 201

# PUT - Actualizar
@categorias_bp.route('/<int:id>', methods=['PUT'])
def update_categoria(id):
    categoria = Categoria.query.get_or_404(id)
    data = request.get_json()
    
    categoria.nombre = data.get('nombre', categoria.nombre)
    categoria.activo = data.get('activo', categoria.activo)
    
    db.session.commit()
    
    return jsonify(categoria.to_dict())

# DELETE - Eliminar (soft delete)
@categorias_bp.route('/<int:id>', methods=['DELETE'])
def delete_categoria(id):
    categoria = Categoria.query.get_or_404(id)
    categoria.activo = False
    db.session.commit()
    
    return jsonify({'message': 'Categoría eliminada'})
