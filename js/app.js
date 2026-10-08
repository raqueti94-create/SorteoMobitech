// ==============================================
// CONFIGURACIÓN — Ya NO se pone la contraseña aquí
// ==============================================
const CONFIG = {
    urlLogo: 'WhatsApp Image 2026-10-07 at 4.29.48 PM.jpeg', // Tu enlace de imagen
    premios: [
        '💰 $10.000 COP',
        '💰 $10.000 COP',
        '💰 $10.000 COP',
        '💰 $10.000 COP',
        '💰 $10.000 COP',
        '💰 $10.000 COP',
        '💵 $20.000 COP',
        '💵 $20.000 COP',
        '💵 $20.000 COP',
        '👑 $50.000 COP'
    ],
    firebase: {
        apiKey: "AIzaSyDUyRp66r4AwqVfT-1t8DTGPxoPrJf73Uo",
        authDomain: "sorteo-b5f23.firebaseapp.com",
        projectId: "sorteo-b5f23",
        storageBucket: "sorteo-b5f23.appspot.com",
        messagingSenderId: "951880297325",
        appId: "1:951880297325:web:c136fe8733cfeb5ac98864"
    }
};

// ==============================================
// INICIALIZACIÓN
// ==============================================
firebase.initializeApp(CONFIG.firebase);
const db = firebase.firestore();

let nombreUsuario = '';
let documentoUsuario = '';
let yaJugado = false;
let mesActual = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
let premiosMezclados = [];

// ==============================================
// VALIDACIÓN SEGURA — Lee la contraseña de Firebase
// ==============================================
async function validarClave() {
    const claveIngresada = document.getElementById('claveAdmin').value;
    const modal = document.getElementById('modalLogin');
    
    // Obtener la contraseña guardada en Firebase
    const docSeguridad = await db.collection('configuracion').doc('seguridad').get();
    
    if (!docSeguridad.exists) {
        alert('⚠️ Configuración no encontrada en Firebase');
        return;
    }
    
    const claveGuardada = docSeguridad.data().claveAdmin;
    
    if (claveIngresada === claveGuardada) {
        cerrarModal();
        await cargarTablaAdmin();
        mostrarPantalla('pantallaAdmin');
    } else {
        alert('❌ Contraseña incorrecta');
    }
}

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================
function mezclarPremios(lista) {
    const arr = [...lista];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function formatearFecha(fecha) {
    const d = fecha.getDate().toString().padStart(2,'0');
    const m = (fecha.getMonth()+1).toString().padStart(2,'0');
    const a = fecha.getFullYear();
    return `${d}/${m}/${a}`;
}

function formatearHora(fecha) {
    const h = fecha.getHours().toString().padStart(2,'0');
    const min = fecha.getMinutes().toString().padStart(2,'0');
    return `${h}:${min}`;
}

function limpiarEspacios(texto) {
    return texto.replace(/\s+/g, ' ').trim();
}

// ==============================================
// GESTIÓN DE PANTALLAS
// ==============================================
function mostrarPantalla(idPantalla) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(idPantalla).classList.add('activa');
}

function volverInicio() {
    nombreUsuario = '';
    documentoUsuario = '';
    yaJugado = false;
    premiosMezclados = [];
    document.getElementById('nombreUsuario').value = '';
    document.getElementById('documentoUsuario').value = '';
    document.getElementById('mensajeAviso').textContent = '';
    document.getElementById('cajaResultado').classList.remove('visible');
    mostrarPantalla('pantallaInicio');
}

function mostrarFormulario() {
    mostrarPantalla('pantallaFormulario');
}

function mostrarLoginAdmin() {
    document.getElementById('modalLogin').classList.remove('oculto');
}

function cerrarModal() {
    document.getElementById('modalLogin').classList.add('oculto');
    document.getElementById('claveAdmin').value = '';
}

// ==============================================
// VALIDACIONES DE USUARIO
// ==============================================
async function documentoYaParticipo(doc) {
    const snap = await db.collection('participantes')
        .where('documento', '==', doc)
        .where('mes', '==', mesActual)
        .get();
    return !snap.empty;
}

async function verificarYJugar() {
    // Limpiar y validar nombre
    nombreUsuario = limpiarEspacios(document.getElementById('nombreUsuario').value);
    documentoUsuario = limpiarEspacios(document.getElementById('documentoUsuario').value);
    const aviso = document.getElementById('mensajeAviso');

    if (!nombreUsuario) {
        aviso.textContent = '⚠️ Escribe tu nombre completo';
        return;
    }
    if (nombreUsuario.length < 5) {
        aviso.textContent = '⚠️ Escribe tu nombre completo, no iniciales';
        return;
    }
    if (!documentoUsuario) {
        aviso.textContent = '⚠️ Escribe tu número de documento';
        return;
    }
    // Solo números
    if (!/^\d+$/.test(documentoUsuario)) {
        aviso.textContent = '⚠️ Solo usa números, sin puntos ni espacios';
        return;
    }
    // Longitud válida en Colombia
    if (documentoUsuario.length < 6 || documentoUsuario.length > 12) {
        aviso.textContent = '⚠️ El documento debe tener entre 6 y 12 dígitos';
        return;
    }

    document.getElementById('cargando').style.display = 'block';
    aviso.textContent = '';

    const yaParticipo = await documentoYaParticipo(documentoUsuario);
    document.getElementById('cargando').style.display = 'none';

    if (yaParticipo) {
        aviso.textContent = '🚫 Este documento ya participó este mes';
        return;
    }

    premiosMezclados = mezclarPremios(CONFIG.premios);
    document.getElementById('saludoUsuario').textContent = `¡Hola, ${nombreUsuario}! 👋`;
    generarCartas();
    mostrarPantalla('pantallaJuego');
}
// ==============================================
// CARTAS Y JUEGO
// ==============================================
function generarCartas() {
    const contenedor = document.getElementById('contenedorCartas');
    contenedor.innerHTML = '';

    premiosMezclados.forEach((premio, indice) => {
        const carta = document.createElement('div');
        carta.className = 'carta';
        carta.dataset.indice = indice;
        carta.innerHTML = `
            <div class="carta-interior">
                <div class="carta-frente">
                    <img src="${CONFIG.urlLogo}" alt="Mobitech Group" class="logo-carta" loading="lazy"
                         onerror="this.style.display='none'">
                </div>
                <div class="carta-atras">
                    <span class="texto-premio">${premio}</span>
                </div>
            </div>
        `;
        carta.addEventListener('click', () => voltearCarta(carta, indice));
        contenedor.appendChild(carta);
    });
}

async function voltearCarta(carta, indice) {
    if (yaJugado || carta.classList.contains('volteada')) return;

    yaJugado = true;
    document.querySelectorAll('.carta').forEach(c => c.classList.add('desactivada'));
    carta.classList.remove('desactivada');
    carta.classList.add('volteada');

    const premioGanado = premiosMezclados[indice];
    const esMayor = premioGanado.includes('$50.000');

    if (esMayor) {
        lanzarConfeti();
    }

    await db.collection('participantes').add({
        nombre: nombreUsuario,
        documento: documentoUsuario,
        premio: premioGanado,
        fecha: new Date(),
        mes: mesActual
    });

    setTimeout(() => {
        const caja = document.getElementById('cajaResultado');
        caja.innerHTML = `🎉 ¡Felicidades, ${nombreUsuario}!<br>Ganaste: <strong>${premioGanado}</strong>`;
        caja.classList.add('visible');
        document.getElementById('estadoJuego').textContent = '✅ Premio registrado correctamente';
    }, 700);
}

// ==============================================
// PANEL DE ADMINISTRACIÓN
// ==============================================
async function cargarTablaAdmin() {
    const snap = await db.collection('participantes')
        .where('mes', '==', mesActual)
        .orderBy('fecha', 'desc')
        .get();

    const cuerpo = document.getElementById('cuerpoTabla');
    if (snap.empty) {
        cuerpo.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">Sin registros este mes</td></tr>';
        return;
    }

    cuerpo.innerHTML = '';
    snap.forEach(doc => {
        const d = doc.data();
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${d.nombre}</td>
            <td>${d.documento}</td>
            <td>${formatearFecha(d.fecha.toDate())}</td>
            <td>${formatearHora(d.fecha.toDate())}</td>
            <td>${d.premio}</td>
        `;
        cuerpo.appendChild(fila);
    });
}

async function confirmarReinicio() {
    if (confirm('⚠️ ¿Borrar TODOS los registros del mes? No se puede deshacer.')) {
        const snap = await db.collection('participantes').where('mes', '==', mesActual).get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        alert('✅ Mes reiniciado');
        await cargarTablaAdmin();
    }
}

// ==============================================
// EFECTOS VISUALES
// ==============================================
function lanzarConfeti() {
    const contenedor = document.createElement('div');
    contenedor.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(contenedor);

    const colores = ['#ffd700', '#ff4444', '#44ff44', '#4488ff', '#ffffff'];
    for (let i = 0; i < 120; i++) {
        const f = document.createElement('div');
        f.style.cssText = `
            position:absolute; width:10px; height:16px;
            background:${colores[Math.floor(Math.random()*colores.length)]};
            left:${Math.random()*100}%; top:-20px;
            animation: caer ${1.5+Math.random()}s linear forwards;
            animation-delay:${Math.random()*0.5}s;
        `;
        contenedor.appendChild(f);
    }

    const estilo = document.createElement('style');
    estilo.textContent = `
        @keyframes caer {
            to { transform: translateY(100vh) rotate(720deg); opacity:0; }
        }
    `;
    document.head.appendChild(estilo);
    setTimeout(() => { contenedor.remove(); estilo.remove(); }, 3000);
}

// Bloquear letras en el campo documento
document.getElementById('documentoUsuario').addEventListener('input', function(){
    this.value = this.value.replace(/\D/g, '');
});

// ==============================================
// EXPORTAR A EXCEL Y TOTAL DE PREMIOS
// ==============================================

// Calcular y mostrar el total de premios
function calcularTotalPremios(registros) {
    let total = 0;
    registros.forEach(fila => {
        const texto = fila.premio;
        const valor = texto.match(/\$([\d.]+)/);
        if (valor) {
            total += parseInt(valor[1].replace(/\./g, ''));
        }
    });
    
    const formato = new Intl.NumberFormat('es-CO').format(total);
    document.getElementById('totalPremios').innerHTML = `💰 Total premios: $${formato} COP`;
}

// Exportar la tabla a Excel
function exportarExcel() {
    const tabla = document.getElementById('cuerpoTabla');
    const filas = tabla.querySelectorAll('tr');
    
    let csv = 'Nombre,Documento,Fecha,Hora,Premio\n';
    
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length > 0) {
            const datos = Array.from(celdas).map(celda => `"${celda.textContent}"`);
            csv += datos.join(',') + '\n';
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `Sorteo_${mesActual}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
}

// Reescribir la función para incluir el cálculo del total
async function cargarTablaAdmin() {
    const snap = await db.collection('participantes')
        .where('mes', '==', mesActual)
        .orderBy('fecha', 'desc')
        .get();

    const cuerpo = document.getElementById('cuerpoTabla');
    const registros = [];
    
    if (snap.empty) {
        cuerpo.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">Sin registros este mes</td></tr>';
        calcularTotalPremios([]);
        return;
    }

    cuerpo.innerHTML = '';
    snap.forEach(doc => {
        const d = doc.data();
        registros.push(d);
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${d.nombre}</td>
            <td>${d.documento}</td>
            <td>${formatearFecha(d.fecha.toDate())}</td>
            <td>${formatearHora(d.fecha.toDate())}</td>
            <td>${d.premio}</td>
        `;
        cuerpo.appendChild(fila);
    });
    
    calcularTotalPremios(registros);
}

// ==============================================
// HISTORIAL DE MESES
// ==============================================

// Almacenar lista de meses disponibles
let mesesDisponibles = [];
let mesSeleccionado = mesActual;

// Obtener mes actual en formato "2026-10"
function obtenerMesActual() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
}

mesActual = obtenerMesActual();
mesSeleccionado = mesActual;

// Cargar todos los meses con registros
async function cargarSelectorMeses() {
    const snap = await db.collection('participantes').orderBy('fecha').get();
    const meses = new Set();
    
    snap.forEach(doc => {
        const fecha = doc.data().fecha.toDate();
        const etiquetaMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        meses.add(etiquetaMes);
    });
    
    // Convertir a lista y ordenar del más reciente al más antiguo
    mesesDisponibles = Array.from(meses).sort().reverse();
    
    // Si no hay meses, agregar el actual
    if (mesesDisponibles.length === 0) {
        mesesDisponibles.push(mesActual);
    }
    
    // Llenar el selector
    const selector = document.getElementById('selectorMes');
    selector.innerHTML = '';
    mesesDisponibles.forEach(m => {
        const opcion = document.createElement('option');
        opcion.value = m;
        opcion.textContent = formatearNombreMes(m);
        if (m === mesSeleccionado) opcion.selected = true;
        selector.appendChild(opcion);
    });
}

// Formatear mes para mostrar: "Octubre 2026"
function formatearNombreMes(codigo) {
    const [anio, mes] = codigo.split('-');
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${nombres[parseInt(mes)-1]} ${anio}`;
}

// Cambiar de mes y recargar tabla
async function cambiarMes() {
    const selector = document.getElementById('selectorMes');
    mesSeleccionado = selector.value;
    await cargarTablaAdmin();
}

// Reescribir cargarTablaAdmin para usar el mes seleccionado
async function cargarTablaAdmin() {
    const snap = await db.collection('participantes')
        .where('mes', '==', mesSeleccionado)
        .orderBy('fecha', 'desc')
        .get();

    const cuerpo = document.getElementById('cuerpoTabla');
    const registros = [];
    
    if (snap.empty) {
        cuerpo.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">Sin registros para este mes</td></tr>';
        calcularTotalPremios([]);
        return;
    }

    cuerpo.innerHTML = '';
    snap.forEach(doc => {
        const d = doc.data();
        registros.push(d);
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${d.nombre}</td>
            <td>${d.documento}</td>
            <td>${formatearFecha(d.fecha.toDate())}</td>
            <td>${formatearHora(d.fecha.toDate())}</td>
            <td>${d.premio}</td>
        `;
        cuerpo.appendChild(fila);
    });
    
    calcularTotalPremios(registros);
}

// Modificar el guardado para incluir el campo "mes"
const guardarRegistroOriginal = null; // Reemplazamos la función completa
async function guardarRegistro(nombre, documento, premio) {
    try {
        await db.collection('participantes').add({
            nombre: nombre,
            documento: documento,
            premio: premio,
            fecha: new Date(),
            mes: mesActual
        });
        return true;
    } catch (error) {
        console.error("Error al guardar:", error);
        return false;
    }
}

// Cargar meses al entrar al panel
const cargarPanelOriginal = null;
async function cargarPanelAdmin() {
    await cargarSelectorMeses();
    await cargarTablaAdmin();
}

// Actualizar la función de acceso para llamar la nueva carga
const validarClaveAnterior = validarClave;
async function validarClave() {
    const claveIngresada = document.getElementById('claveAdmin').value;
    try {
        const doc = await db.collection('configuracion').doc('seguridad').get();
        if (doc.exists && doc.data().claveAdmin === claveIngresada) {
            document.getElementById('modalLogin').classList.add('oculto');
            document.getElementById('pantallaInicio').classList.add('oculto');
            document.getElementById('pantallaAdmin').classList.remove('oculto');
            await cargarPanelAdmin(); // Carga meses + tabla
        } else {
            alert('🔑 Contraseña incorrecta');
        }
    } catch (error) {
        console.error("Error:", error);
        alert('⚠️ Error al verificar la contraseña');
    }
}
