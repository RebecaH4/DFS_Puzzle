# Puzzle Lineal con Búsqueda en Profundidad
from arbol import Nodo
from flask import Flask, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

def buscar_solucion_DFS(estado_inicial, solucion):
    solucionado = False
    nodos_visitados = []
    nodos_frontera = []
    nodo_inicial = Nodo(estado_inicial)
    nodos_frontera.append(nodo_inicial)
    while (not solucionado) and len(nodos_frontera) != 0:
        nodo = nodos_frontera.pop()
        # Extraer nodo y añadirlo a visitados 
        nodos_visitados.append(nodo)
        if nodo.get_datos()== solucion:
            # Solución encontrada
            solucionado = True
            return nodo
        else:
            # Expandir nodos hijo
            dato_nodo = nodo.get_datos()
            
            # Operador Izquierdo
            hijo = [dato_nodo[1], dato_nodo[0], dato_nodo[2], dato_nodo[3]]
            hijo_izquierdo = Nodo(hijo)
            if not hijo_izquierdo.en_lista(nodos_visitados) and not hijo_izquierdo.en_lista(nodos_frontera):
                nodos_frontera.append(hijo_izquierdo)
                
            # Operador Central
            hijo = [dato_nodo[0], dato_nodo[2], dato_nodo[1], dato_nodo[3]]
            hijo_central = Nodo(hijo)
            if not hijo_central.en_lista(nodos_visitados) and not hijo_central.en_lista(nodos_frontera):
                nodos_frontera.append(hijo_central)
                
            # Operador Derecho
            hijo = [dato_nodo[0], dato_nodo[1], dato_nodo[3], dato_nodo[2]]
            hijo_derecho = Nodo(hijo)
            if not hijo_derecho.en_lista(nodos_visitados) and not hijo_derecho.en_lista(nodos_frontera):
                nodos_frontera.append(hijo_derecho)
                
        nodo.set_hijos([hijo_izquierdo, hijo_central, hijo_derecho])

@app.route('/calcular', methods=['POST'])

def calcular():
    # Obtener datos del request
    data = request.get_json()
    estado_inicial = data.get('estado_inicial')
    solucion = data.get('solucion')
    
    nodo_solucion = buscar_solucion_DFS(estado_inicial, solucion)
    if nodo_solucion is None:
        return {
            'estado_inicial': estado_inicial,
            'estado_objetivo': solucion,
            'pasos': [],
            'total_pasos': 0,
            'error': 'No se encontró solución para el estado inicial y objetivo dados.'
        }, 404

    #Mostrar Resultado
    resultado = []
    nodo = nodo_solucion
    while nodo.get_padre() is not None:
        resultado.append(nodo.get_datos())
        nodo = nodo.get_padre()
    
    resultado.append(estado_inicial)
    resultado.reverse()
    print(resultado)
    
    return {
        'estado_inicial': estado_inicial,
        'estado_objetivo': solucion,
        'pasos': resultado,
        'total_pasos': len(resultado)
    }

@app.route('/')
def serve_index():
    return send_from_directory('app', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('app', path)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')