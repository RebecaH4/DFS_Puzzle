// Estado inicial y objetivo
let INITIAL_STATE = [4, 2, 3, 1];
let GOAL_STATE = [1, 2, 3, 4];

// Función para obtener estado desde los inputs
function getStateFromInputs(prefix) {
    const state = [];
    for (let i = 0; i < 4; i++) {
        const value = parseInt(document.getElementById(`${prefix}${i}`).value);
        state.push(value);
    }
    return state;
}

// Función para forzar valores únicos en un conjunto de selects
function enforceUniqueSelection() {
    const initialValues = [];
    const goalValues = [];

    for (let i = 0; i < 4; i++) {
        initialValues.push(parseInt(document.getElementById(`initial${i}`).value));
        goalValues.push(parseInt(document.getElementById(`goal${i}`).value));
    }

    const goalSet = new Set(goalValues);

    for (let i = 0; i < 4; i++) {
        const selIni = document.getElementById(`initial${i}`);
        const currentIni = parseInt(selIni.value);
        const otherInitialSet = new Set(initialValues.filter((_, idx) => idx !== i));

        Array.from(selIni.options).forEach(option => {
            const val = parseInt(option.value);
            if (val === currentIni) {
                option.disabled = false;
            } else {
                option.disabled = otherInitialSet.has(val) || goalSet.has(val);
            }
        });

        const selGoal = document.getElementById(`goal${i}`);
        const currentGoal = parseInt(selGoal.value);
        const otherGoalSet = new Set(goalValues.filter((_, idx) => idx !== i));

        Array.from(selGoal.options).forEach(option => {
            const val = parseInt(option.value);
            if (val === currentGoal) {
                option.disabled = false;
            } else {
                option.disabled = otherGoalSet.has(val) || new Set(initialValues).has(val);
            }
        });
    }

    INITIAL_STATE = getStateFromInputs('initial');
    GOAL_STATE = getStateFromInputs('goal');

    renderState(INITIAL_STATE, 'initialState');
    renderState(GOAL_STATE, 'goalState');
}


// Función para renderizar un estado como una serie de cajas
function renderState(state, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    state.forEach((num) => {
        const box = document.createElement('div');
        box.className = 'bg-blue-100 text-blue-900 text-lg font-bold w-14 h-14 flex items-center justify-center rounded shadow';
        box.textContent = num;
        container.appendChild(box);
    });
}

// Función para renderizar un paso
function renderStep(step, index) {
    const stepElement = document.createElement('div');
    stepElement.className = 'bg-blue-50 p-4 rounded-lg border-2 border-blue-200 hover:shadow-md transition';
    stepElement.innerHTML = `
        <div class="flex items-center justify-between">
            <div>
                <span class="inline-block bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm mr-3">
                    ${index + 1}
                </span>
                <span class="font-semibold text-blue-900">Paso ${index + 1}</span>
            </div>
            <div class="flex gap-2">
                ${step.map((num) => `
                    <div class="bg-blue-400 text-white font-bold w-11 h-11 flex items-center justify-center rounded-lg shadow text-sm">
                        ${num}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    return stepElement;
}

// Función para mostrar error
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    document.getElementById('solutionContainer').classList.add('hidden');
}

// Función para limpiar error
function hideError() {
    document.getElementById('errorContainer').classList.add('hidden');
}

// Manejar el click del botón resolver
document.getElementById('solveBtn').addEventListener('click', async () => {
    hideError();
    document.getElementById('solveBtn').disabled = true;
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('solutionContainer').classList.add('hidden');
    
    // Obtener los valores de los inputs
    const initialState = getStateFromInputs('initial');
    const goalState = getStateFromInputs('goal');
    
    try {
        const response = await fetch('http://localhost:5000/calcular', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado_inicial: initialState,
                solucion: goalState
            })
        });
        
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const msg = (data && data.error) ? data.error : 'Error en la respuesta del servidor';
            throw new Error(msg);
        }

        if (data?.error) {
            throw new Error(data.error);
        }
        
        // Mostrar los pasos
        const stepsList = document.getElementById('stepsList');
        stepsList.innerHTML = '';
        
        if (!Array.isArray(data.pasos) || data.pasos.length === 0) {
            const noSteps = document.createElement('p');
            noSteps.className = 'text-gray-700';
            noSteps.textContent = 'No hay pasos disponibles para la configuración actual.';
            stepsList.appendChild(noSteps);
            document.getElementById('totalSteps').textContent = '0';
        } else {
            data.pasos.forEach((paso, index) => {
                const step = renderStep(paso, index);
                step.style.animation = `slideIn 0.3s ease-out ${index * 0.1}s both`;
                const li = document.createElement('li');
                li.className = 'mb-2';
                li.appendChild(step);
                stepsList.appendChild(li);
            });
            document.getElementById('totalSteps').textContent = data.total_pasos;
        }

        // Mostrar contenedor de solución
        document.getElementById('solutionContainer').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'No se pudo conectar con el servidor. Asegúrate que la API está ejecutándose en http://localhost:5000');
    } finally {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('solveBtn').disabled = false;
    }
});

// Inicializar la interfaz
document.addEventListener('DOMContentLoaded', () => {
    renderState(INITIAL_STATE, 'initialState');
    renderState(GOAL_STATE, 'goalState');

    for (let i = 0; i < 4; i++) {
        const iniSelect = document.getElementById(`initial${i}`);
        const goalSelect = document.getElementById(`goal${i}`);

        iniSelect.value = INITIAL_STATE[i];
        goalSelect.value = GOAL_STATE[i];

        iniSelect.addEventListener('change', enforceUniqueSelection);
        goalSelect.addEventListener('change', enforceUniqueSelection);
    }

    enforceUniqueSelection();

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Botón Limpiar clicado: recargando página');
            alert('Limpiar: recargando página.');
            window.location.reload(true); // forzar recarga completa
            // fallback en caso de que window.location.reload() no funcione
            setTimeout(() => {
                window.location.href = window.location.pathname;
            }, 50);
        });
    } else {
        console.error('clearBtn no encontrado. No se pudo asignar evento de recarga.');
    }

    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});
