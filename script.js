document.addEventListener('DOMContentLoaded', () => {
    // --- Variables Globales ---
    const insumoForm = document.getElementById('insumoForm');
    const servicioForm = document.getElementById('servicioForm');
    const calculadoraBtn = document.getElementById('calcularPrecioBtn');
    const selectServicioCalc = document.getElementById('selectServicioCalc');
    const insumosServicioContainer = document.getElementById('insumosServicioContainer');
    const addInsumoToServiceBtn = document.getElementById('addInsumoToService');

    let insumos = []; // Array para almacenar los insumos
    let servicios = []; // Array para almacenar los servicios

    // --- Funciones de Almacenamiento (localStorage) ---
    function cargarDatos() {
        const storedInsumos = localStorage.getItem('insumos');
        if (storedInsumos) {
            insumos = JSON.parse(storedInsumos);
        }
        const storedServicios = localStorage.getItem('servicios');
        if (storedServicios) {
            servicios = JSON.parse(storedServicios);
        }
        renderizarInsumos();
        renderizarServicios();
        cargarServiciosEnCalculadora();
        cargarInsumosEnSelects();
    }

    function guardarDatos() {
        localStorage.setItem('insumos', JSON.stringify(insumos));
        localStorage.setItem('servicios', JSON.stringify(servicios));
    }

    // --- Gestión de Pestañas ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Recargar selects si cambiamos a la pestaña de servicios o calculadora
            if (tabId === 'servicios') {
                cargarInsumosEnSelects();
            } else if (tabId === 'calculadora') {
                cargarServiciosEnCalculadora();
            }
        });
    });

    // --- Gestión de Insumos ---
    insumoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('insumoNombre').value.trim();
        const costoUnitario = parseFloat(document.getElementById('insumoCostoUnitario').value);
        const unidadMedida = document.getElementById('insumoUnidadMedida').value.trim();

        if (nombre && !isNaN(costoUnitario) && unidadMedida) {
            const nuevoInsumo = {
                id: Date.now(), // Un ID único para cada insumo
                nombre: nombre,
                costoUnitario: costoUnitario,
                unidadMedida: unidadMedida
            };
            insumos.push(nuevoInsumo);
            guardarDatos();
            renderizarInsumos();
            insumoForm.reset();
            cargarInsumosEnSelects(); // Actualizar selects de insumos en el formulario de servicios
        } else {
            alert('Por favor, completa todos los campos del insumo.');
        }
    });

    function renderizarInsumos() {
        const listaInsumos = document.getElementById('listaInsumos');
        listaInsumos.innerHTML = '';
        if (insumos.length === 0) {
            listaInsumos.innerHTML = '<li>No hay insumos guardados.</li>';
            return;
        }
        insumos.forEach(insumo => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${insumo.nombre} - $${insumo.costoUnitario.toFixed(2)} / ${insumo.unidadMedida}
                <button data-id="${insumo.id}">Eliminar</button>
            `;
            li.querySelector('button').addEventListener('click', (e) => {
                eliminarInsumo(parseInt(e.target.dataset.id));
            });
            listaInsumos.appendChild(li);
        });
    }

    function eliminarInsumo(id) {
        // Verificar si el insumo está siendo usado en algún servicio
        const insumoEnUso = servicios.some(servicio =>
            servicio.insumosUsados.some(iu => iu.insumoId === id)
        );

        if (insumoEnUso) {
            alert('Este insumo está siendo utilizado en uno o más servicios. Por favor, elimínalo de los servicios antes de borrarlo.');
            return;
        }

        insumos = insumos.filter(insumo => insumo.id !== id);
        guardarDatos();
        renderizarInsumos();
        cargarInsumosEnSelects(); // Actualizar selects
    }

    // --- Gestión de Servicios ---
    addInsumoToServiceBtn.addEventListener('click', () => {
        agregarCampoInsumoServicio();
    });

    function agregarCampoInsumoServicio(insumoId = '', cantidad = 0) {
        const div = document.createElement('div');
        div.classList.add('insumo-servicio-item');
        const uniqueId = Date.now() + Math.random().toString(36).substring(2, 9); // ID más único

        div.innerHTML = `
            <label for="insumoSelect-${uniqueId}">Insumo:</label>
            <select class="insumo-select" id="insumoSelect-${uniqueId}"></select>
            <label for="cantidadInsumo-${uniqueId}">Cantidad:</label>
            <input type="number" class="cantidad-insumo" id="cantidadInsumo-${uniqueId}" step="0.01" value="${cantidad}">
            <button type="button" class="remove-insumo">X</button>
        `;
        insumosServicioContainer.appendChild(div);
        cargarInsumosEnSelects(div.querySelector('.insumo-select'), insumoId);

        div.querySelector('.remove-insumo').addEventListener('click', () => {
            if (insumosServicioContainer.children.length > 1) { // No eliminar el último
                div.remove();
            } else {
                alert('Debe haber al menos un insumo en el servicio.');
            }
        });
    }

    function cargarInsumosEnSelects(selectElement = null, selectedId = '') {
        const selects = selectElement ? [selectElement] : document.querySelectorAll('.insumo-select');
        selects.forEach(select => {
            // Guardar el valor actual si no es el primer carga y existe un valor
            const currentValue = select.value;
            select.innerHTML = '<option value="">Selecciona un Insumo</option>';
            insumos.forEach(insumo => {
                const option = document.createElement('option');
                option.value = insumo.id;
                option.textContent = `${insumo.nombre} ($${insumo.costoUnitario}/${insumo.unidadMedida})`;
                select.appendChild(option);
            });
            // Restaurar el valor o seleccionar el pasado por parámetro
            if (selectedId) {
                select.value = selectedId;
            } else if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    servicioForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('servicioNombre').value.trim();
        const tiempo = parseFloat(document.getElementById('servicioTiempo').value);
        const costoManoObraPorHora = parseFloat(document.getElementById('servicioCostoManoObra').value);
        const margenGanancia = parseFloat(document.getElementById('servicioMargenGanancia').value);

        const insumosUsados = [];
        let isValid = true;
        document.querySelectorAll('.insumo-servicio-item').forEach(item => {
            const insumoId = parseInt(item.querySelector('.insumo-select').value);
            const cantidad = parseFloat(item.querySelector('.cantidad-insumo').value);

            if (isNaN(insumoId) || !insumoId || isNaN(cantidad) || cantidad <= 0) {
                isValid = false;
                alert('Por favor, selecciona un insumo y una cantidad válida para todos los insumos utilizados.');
                return;
            }
            insumosUsados.push({ insumoId, cantidad });
        });

        if (!isValid || !nombre || isNaN(tiempo) || isNaN(costoManoObraPorHora) || isNaN(margenGanancia) || insumosUsados.length === 0) {
            alert('Por favor, completa todos los campos del servicio y asegura que los insumos tengan cantidades válidas.');
            return;
        }

        const nuevoServicio = {
            id: Date.now(),
            nombre,
            tiempo,
            costoManoObraPorHora,
            margenGanancia,
            insumosUsados
        };

        servicios.push(nuevoServicio);
        guardarDatos();
        renderizarServicios();
        servicioForm.reset();
        // Resetear los campos de insumos en el formulario de servicio
        insumosServicioContainer.innerHTML = '';
        agregarCampoInsumoServicio(); // Agregar un campo vacío inicial
        cargarServiciosEnCalculadora(); // Actualizar selects de servicios en la calculadora
    });

    function renderizarServicios() {
        const listaServicios = document.getElementById('listaServicios');
        listaServicios.innerHTML = '';
        if (servicios.length === 0) {
            listaServicios.innerHTML = '<li>No hay servicios guardados.</li>';
            return;
        }
        servicios.forEach(servicio => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${servicio.nombre} (${servicio.tiempo} min) - Margen: ${servicio.margenGanancia}%
                <button data-id="${servicio.id}">Eliminar</button>
            `;
            li.querySelector('button').addEventListener('click', (e) => {
                eliminarServicio(parseInt(e.target.dataset.id));
            });
            listaServicios.appendChild(li);
        });
    }

    function eliminarServicio(id) {
        servicios = servicios.filter(servicio => servicio.id !== id);
        guardarDatos();
        renderizarServicios();
        cargarServiciosEnCalculadora(); // Actualizar selects
    }

    // --- Funciones de Cálculo ---
    function cargarServiciosEnCalculadora() {
        selectServicioCalc.innerHTML = '<option value="">Selecciona un Servicio</option>';
        servicios.forEach(servicio => {
            const option = document.createElement('option');
            option.value = servicio.id;
            option.textContent = servicio.nombre;
            selectServicioCalc.appendChild(option);
        });
    }

    calculadoraBtn.addEventListener('click', () => {
        const servicioId = parseInt(selectServicioCalc.value);
        if (isNaN(servicioId)) {
            alert('Por favor, selecciona un servicio para calcular.');
            return;
        }

        const servicioSeleccionado = servicios.find(s => s.id === servicioId);
        if (!servicioSeleccionado) {
            alert('Servicio no encontrado.');
            return;
        }

        let costoTotalInsumos = 0;
        servicioSeleccionado.insumosUsados.forEach(insumoUso => {
            const insumo = insumos.find(i => i.id === insumoUso.insumoId);
            if (insumo) {
                costoTotalInsumos += insumo.costoUnitario * insumoUso.cantidad;
            } else {
                console.warn(`Insumo con ID ${insumoUso.insumoId} no encontrado. Puede que haya sido eliminado.`);
                // Opcional: mostrar un mensaje al usuario o manejar el error
            }
        });

        const costoManoObra = (servicioSeleccionado.tiempo / 60) * servicioSeleccionado.costoManoObraPorHora;
        const costoTotalServicio = costoTotalInsumos + costoManoObra; // Aquí podrías sumar costos fijos prorrateados si los implementas

        // Precio Sugerido = Costo Total / (1 - Margen de Ganancia / 100)
        const margenDecimal = servicioSeleccionado.margenGanancia / 100;
        const precioSugerido = costoTotalServicio / (1 - margenDecimal);
        const precioFinalVenta = Math.round(precioSugerido / 100) * 100; // Redondear a la centena más cercana

        document.getElementById('costoInsumosCalc').textContent = `$${costoTotalInsumos.toFixed(2)}`;
        document.getElementById('costoManoObraCalc').textContent = `$${costoManoObra.toFixed(2)}`;
        document.getElementById('costoTotalServicioCalc').textContent = `$${costoTotalServicio.toFixed(2)}`;
        document.getElementById('precioSugeridoCalc').textContent = `$${precioSugerido.toFixed(2)}`;
        document.getElementById('precioFinalCalc').textContent = `$${precioFinalVenta.toFixed(2)}`;
    });

    // --- Inicialización ---
    cargarDatos(); // Carga los datos al iniciar la página
    agregarCampoInsumoServicio(); // Agrega el primer campo de insumo al formulario de servicio al cargar
});