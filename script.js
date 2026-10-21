//Recolector inteligente. Se enfoca en ir a buscar el dato del formulario, limpiarlo y si no encuentra nada usa el "Plan B". id= nombre de la caja fallback= plan B =""=Si no se le dice que colocar de respaldo se deja el espacio vacío.
function val(id, fallback = '') {
    //Le dice al navegador: busca en el HTML el elemento que tenfa el id que le pasamos
    const element = document.getElementById(id);
    //element &&= pregunta si encontró la caja / element.value.trim()= hay texto adentro? / .trim()= le quita los espacio en blanco que sobran al principio y final / element.value.trim() : fallback= Esto es el operador ternario, si la primera respuesta es Sí (devuelve texto), si la respuesta es No, la caja no existe o está vacía (devuelve el fallback (el respaldo))
    return element && element.value.trim() ? element.value.trim() : fallback;
}

//Esta función es como un procesador:
//split(',')= es el cortador, si se tiene HTML, CSS, JavaScript (es un bloque gigante junto), la función .split corta vez que ve una cosa y queda separado en 3 pero así: 1-."HTML", 2-." CSS" (con un espacio al principio), 3-." JavaScript"(con un espacio al principio) .trim() se los quita/ .map(s => s.trim())= es la limpiadora, map significa recorre cada pedacito de la lista y hazle lo mismo a todos. /La variable s es cada pedacito que sacó la cortadora /  .trim()= le quita los espacio en blanco que sobran al principio y final / .filter(Boolean)= Es el filtro de calidad, los valores que no deja pasar: 1. "" (Cadena vacía): Está vacío ->Rechazado. 2. null: No existe. ->Rechazado. 3. undefined: No estás invitado. ->Rechazado. 4. 0: Cero. ->Rechazado. 5. false: Falso. ->Obviamente rechazado. Los valores que además de raro deja pasar: * Ejemplo:"HTML" (cualquier texto con letras) -> Aceptado. * " " (solo un espacio) -> Aceptado (aunque sea un espacio, técnicamente tiene contenido). * 100, -5 (números distintos de cero) -> Aceptado. * [ ] (un array) -> Aceptado. 
//Primero se limpia con .trim() y luego .filter(Boolean) verifica que el resultado no esté totalmente vacío ("").
function toList(raw) {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}


//Esta función se llama esc de escape, debe convertir caracteres "peligrosos" como < o > en texto plano para que no se rompa el PDF o PPT. Si se le pasa  <b>hola</b>, él no lee el texto tal cual, sino que piensa: es un código de formato. Cambia a negrita y lo ejecuta (lo transforma), pero en este casi se quiere que se muestre el texto tan cual se envía.
function esc(str) {
    //document.createElement('div')= Se crea una caja invisible (un div), aquí es donde mete el dato sin que nadie se de cuenta.
    const d = document.createElement('div');
    //usar textContent en ver de innerHTML (es el truco). Se le dice al navegador que se le va a pasar sólo texto plano, que no lo modifique, sólo que lo guarde sin ejecutarlo. 
    d.textContent = str;
    //Finalmente se le pide al navegador que muestre lo que hay y loe scribe en un formayo que no se pueda ejecutar como código, el navegador toma el signo menor < y lo traduce a su código seguro &lt. Ejemplo: el usuario escribe esto en el input de interés: Me gustan los productos <b>en oferta</b>. *Sin esta función: El PDF intenta hacer "me gustan los productos EN OFERTA (negrita)" y se rompe porque es código suelto.*   Con esta función: El PDF muestra: Me gustan los productos &lt;b&gt;en oferta&lt;/b&gt;.
    return d.innerHTML;
}

//nota: textContent (El Lector Literal) Lo que ve: Todo es texto plano. Lo que hace: Muestra exactamente lo que escribiste, símbolos y todo. Resultado en pantalla: <b>¡Hola!</b> (Se ve el símbolo menor y el "b", todo está en letra normal) /  innerHTML (El Ingeniero/Constructor) Lo que ve: Busca etiquetas HTML (<, >, b, i, img). Lo que hace: Intenta "renderizar" (ejecutar) lo que ve. Al ver <b>, piensa: "¡Ah! Esto es para ponerlo en negrita". Resultado en pantalla:¡Hola!(Se ve en negrita, porque el navegador ejecutó la orden del <b>).

// --------------------------
// VISTA PREVIA EN PANTALLA
// --------------------------
//Esta función tiene como trabajo ir a recolectar toda la información del formulario, limpiarla, protegerla y prepararla para meterla al PDF o PPTX. Hay 3 grupos: 
//1- Recogida de datos (las primeras líneas): const emp, const fecha, const loc y const contacto. Va al HTML, busca las cajas por ID y lo guarda en la variable. Fallback, si la casa esta vacía, usa el plan B: "por definir". La variable loc no tiene fallbacl, por lo que si no se escribe nada, queda vacía.
//2- Protecctón y formato: val(...) Recoge datos del formulario. esc(...) Lo protege. .replace(/\n/g, '<br>' es la parte "mágica para los saltos de líneas", el usuuario puede escribir en el cuadro de texto y presionar "Enter", el código "Enter" se guarda como un símbolo incisible llamado \n, cámbialo por <br>. Cuando el texto se imprime se ven los saltos de líneas como se escribió.
//Conversión a Lista: const techList = toList(val('tech')); const teamList = toList(val('equipo')); acá toman un texto separados por , y lo convierte en un Array (lista de elementos individuales). Luego el código necesita saber cuántos elementos hay para ponerlos en tarjetas separadas o líneas diferentes del PPTX.

function generarBrief() {
    const emp      = val('empresa', 'Empresa');
    const fecha    = val('fecha', 'Por definir');
    const loc      = val('ubicacion');
    const contacto = val('contacto', 'Contacto por definir');
    const traying  = esc(val('trayectoria', 'Sin información de trayectoria.')).replace(/\n/g, '<br>');
    const empinfo  = esc(val('empresaInfo', 'Sin descripción de la empresa.')).replace(/\n/g, '<br>');
    const teamList = toList(val('equipo'));
    const oportunidadesRaw = val('oportunidadesInfo');
    const objetivo = esc(val('objetivoReunion', 'Sin información.')).replace(/\n/g, '<br>');

    // "Nombre - Cargo" -> nombre y cargo por separado (igual que en el PPTX)
    const partes = contacto.split(/\s+[-–—|]\s+|\s*,\s*/);
    const nombre = partes[0];
    const cargo  = partes.slice(1).join(' - ');

    // El nombre es el enlace a LinkedIn solo si empieza con http(s):// (evita "javascript:..." y enlaces rotos)
    const linkedinRaw = val('linkedinLead');
    const nombreHTML = /^https?:\/\//i.test(linkedinRaw)
        ? `<a href="${esc(linkedinRaw).replace(/"/g, '&quot;')}" target="_blank" rel="noopener">${esc(nombre)}</a>`
        : esc(nombre);

    // Devuelve la etiqueta <img> de un input de archivo (o '' si no hay foto)
    function imagen(inputId, clase) {
        const input = document.getElementById(inputId);
        if (!input || !input.files[0]) return '';
        const url = URL.createObjectURL(input.files[0]);
        return `<img src="${url}" class="${clase}" alt="" onload="URL.revokeObjectURL(this.src)">`;
    }

    const logoHTML = imagen('logoCliente', 'ficha-logo');
    const fotoClienteHTML = imagen('fotoCliente', 'ficha-foto-cliente');

    // Participantes: la foto i va con el nombre i de la lista del equipo (máximo 3)
    let participantesHTML = '';
    const n = Math.min(Math.max(teamList.length, 1), 3);
    for (let i = 1; i <= n; i++) {
        const foto = imagen(`participante_${i}`, 'ficha-participante-foto');
        const nom = teamList[i - 1] ? esc(teamList[i - 1]) : '';
        if (foto || nom) {
            participantesHTML += `<div class="ficha-participante">${foto}<span>${nom}</span></div>`;
        }
    }
    // Con 1-2 personas la etiqueta va al lado de las fotos; con 3, encima (igual que en el PPTX)
    const claseEquipo = n <= 2 ? 'eq-lado' : 'eq-arriba';
    const equipoHTML = participantesHTML
        ? `<span class="ficha-equipo-label">Equipo Stefanini:</span>
           <div class="ficha-participantes">${participantesHTML}</div>`
        : '';

    const seccion = (titulo, texto) => `
        <div class="ficha-section">
            <h3>${titulo}</h3>
            <p>${texto}</p>
        </div>`;

    // La ficha mide lo mismo que la diapositiva del PPTX (7.5" x 10.8"); todo se coloca en pulgadas como allá
    const html = `
        <div class="ficha ${claseEquipo}">
            ${logoHTML}
            ${fotoClienteHTML}
            <div class="ficha-linea"></div>
            <h2 class="ficha-title">Agenda ${esc(emp)}</h2>
            <div class="ficha-meta">${esc(fecha)}${loc ? `<br><strong>${esc(loc)}</strong>` : ''}</div>
            ${equipoHTML}

            <p class="ficha-lead">
                <strong>Nombre: ${nombreHTML}</strong>${cargo ? `<br><strong>Cargo: ${esc(cargo)}</strong>` : ''}
            </p>
            <p class="ficha-trayectoria">${traying}</p>

            ${seccion('Sobre la empresa:', empinfo)}
            ${seccion('Objetivos de agenda:', objetivo)}
            ${oportunidadesRaw ? seccion('Oportunidades anteriores:', esc(oportunidadesRaw).replace(/\n/g, '<br>')) : ''}
        </div>
    `;

    document.getElementById('preview-area').innerHTML = html;
    document.getElementById('preview-area').style.display = 'block';
    document.getElementById('btn-imprimir').disabled = false;
    document.getElementById('preview-area').scrollIntoView({ behavior: 'smooth' });
}

// ------------------------------------------------------------
//  DESCARGA COMO POWERPOINT (editable) - replica la ficha de la web
//  Reemplaza tu función descargarPPTX() completa por esta.
//  Usa las funciones val() y toList() que ya tienes.
// ------------------------------------------------------------

// Lee la foto de un <input type="file"> y la devuelve en Base64.
// Si no hay archivo, devuelve null (así no se rompe cuando no subes foto).
function leerFoto(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.files || !input.files[0]) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(input.files[0]);
    });
}

async function descargarPPTX() {
    // ---------- 1) Datos (los mismos que usa la vista web) ----------
    const emp      = val('empresa', 'Empresa');
    const fecha    = val('fecha', 'Por definir');
    const loc      = val('ubicacion');
    const contacto = val('contacto', 'Contacto por definir');
    const traying  = val('trayectoria', 'Sin información de trayectoria.');
    const empinfo  = val('empresaInfo', 'Sin descripción de la empresa.');
    const objetivo = val('objetivoReunion', 'Sin información.');
    const oportunidades = val('oportunidadesInfo');   // opcional: si está vacío no se dibuja la sección
    const linkedin = val('linkedinLead');
    const teamList = toList(val('equipo'));

    // "Nombre - Cargo" -> nombre y cargo por separado (separadores: " - ", " – ", " — ", " | " o coma)
    const partes = contacto.split(/\s+[-–—|]\s+|\s*,\s*/);
    const nombre = partes[0];
    const cargo  = partes.slice(1).join(' - ');

    // ---------- 2) Fotos (se esperan todas antes de armar la diapositiva) ----------
    const fotoCliente = await leerFoto('fotoCliente');
    const logoCliente = await leerFoto('logoCliente');
    const fotosParticipantes = [];            // la posición i corresponde al participante i (puede ser null)
    for (let i = 1; i <= 3; i++) {
        fotosParticipantes.push(await leerFoto(`participante_${i}`));
    }

    // ---------- 3) Colores y fuente ----------
    const NEGRO  = '000000';
    const AZUL   = '0563C1';   // enlace de LinkedIn
    const FUENTE = 'Calibri';

    // ---------- 4) Medidas de la hoja ----------
    const ANCHO_HOJA = 7.5;
    const XI = 0.4;                  // margen izquierdo
    const XD = ANCHO_HOJA - 0.4;     // borde derecho
    const ANCHO = XD - XI;           // ancho útil
    const X_BLOQUE = 4.3;            // donde empieza el bloque de título / fecha / equipo
    const FS = 11;                   // tamaño del texto de los párrafos

    // Altura estimada de un texto (el alto de una caja de pptx no se ajusta sola)
    const CHARS_LINEA = 95, ALTO_LINEA = 0.19;
    const altoTexto = t => t.split('\n')
        .reduce((n, p) => n + Math.max(1, Math.ceil(p.length / CHARS_LINEA)), 0) * ALTO_LINEA + 0.05;

    // ---------- 5) Flujo vertical: cada sección empieza donde termina la anterior ----------
    const Y_NOMBRE = 3.0;
    const H_NOMBRE = cargo ? 0.42 : 0.21;
    const secciones = [];
    let y = Y_NOMBRE + H_NOMBRE + 0.05;
    const hTray = altoTexto(traying);
    secciones.push({ tipo: 'cuerpo', texto: traying, y: y, h: hTray });
    y += hTray + 0.3;
    [['Sobre la empresa:', empinfo], ['Objetivos de agenda:', objetivo], ['Oportunidades anteriores:', oportunidades]]
        .filter(([, t]) => t)
        .forEach(([titulo, t]) => {
            const h = altoTexto(t);
            secciones.push({ tipo: 'titulo', texto: titulo, y: y });
            secciones.push({ tipo: 'cuerpo', texto: t, y: y + 0.24, h: h });
            y += 0.24 + h + 0.3;
        });
    const ALTO_HOJA = Math.max(10.8, y + 0.5);   // la hoja crece si hay mucho texto

    // ---------- 6) Presentación ----------
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'FICHA', width: ANCHO_HOJA, height: ALTO_HOJA });
    pptx.layout = 'FICHA';
    const slide = pptx.addSlide();

    // --- Logo (arriba a la izquierda) ---
    if (logoCliente) {
        slide.addImage({
            data: logoCliente, x: XI, y: 0.15, w: 1.7, h: 1.8,
            sizing: { type: 'contain', w: 1.7, h: 1.8 }
        });
    }

    // --- Foto del cliente (circular, al lado del logo) ---
    if (fotoCliente) {
        slide.addImage({
            data: fotoCliente, x: 2.2, y: 0.8, w: 1.6, h: 1.6,
            sizing: { type: 'cover', w: 1.6, h: 1.6 },
            rounding: true
        });
    }

    // --- Línea vertical con punto arriba (separador) ---
    slide.addShape(pptx.ShapeType.line, { x: 4.09, y: 1.05, w: 0, h: 1.4, line: { color: NEGRO, width: 1.5 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: 4.05, y: 1.0, w: 0.08, h: 0.08, fill: { color: NEGRO }, line: { color: NEGRO, width: 0.5 } });

    // --- Título, fecha y ubicación ---
    slide.addText('Agenda ' + emp, {
        x: X_BLOQUE, y: 0.28, w: XD - X_BLOQUE, h: 0.4, isTextBox: true,
        fontSize: 18, bold: true, color: '303336', fontFace: FUENTE,
        align: 'left', valign: 'middle', margin: 0, fit: 'shrink'
    });
    const metaRuns = [{ text: fecha, options: { breakLine: !!loc } }];
    if (loc) metaRuns.push({ text: loc, options: { bold: true } });
    slide.addText(metaRuns, {
        x: X_BLOQUE, y: 0.78, w: XD - X_BLOQUE, h: 0.5, isTextBox: true,
        fontSize: 10, color: NEGRO, fontFace: FUENTE,
        align: 'left', valign: 'top', margin: 0
    });

    // --- Equipo Stefanini: "Equipo Stefanini:" + foto circular con el nombre debajo ---
    const n = Math.min(Math.max(teamList.length, fotosParticipantes.filter(Boolean).length), 3);
    if (n > 0) {
        const D = 0.65;                              // diámetro de la foto
        const SLOT = n <= 2 ? 0.97 : 0.95;           // ancho reservado para cada participante
        const beside = n <= 2;                       // con 1-2 personas, la etiqueta va al lado de las fotos
        const xFotos = beside ? 5.2 : X_BLOQUE;
        const yFotos = beside ? 1.58 : 1.68;
        slide.addText('Equipo Stefanini:', {
            x: X_BLOQUE, y: beside ? 1.45 : 1.35, w: 1.2, h: 0.22, isTextBox: true,
            fontSize: 10, color: NEGRO, fontFace: FUENTE, margin: 0, valign: 'middle'
        });
        for (let i = 0; i < n; i++) {
            const cx = xFotos + i * SLOT + SLOT / 2;
            if (fotosParticipantes[i]) {
                slide.addImage({
                    data: fotosParticipantes[i], x: cx - D / 2, y: yFotos, w: D, h: D,
                    sizing: { type: 'cover', w: D, h: D },
                    rounding: true
                });
            }
            if (teamList[i]) {
                slide.addText(teamList[i], {
                    x: cx - SLOT / 2, y: yFotos + D + 0.05, w: SLOT, h: 0.2, isTextBox: true,
                    fontSize: 7, italic: true, color: NEGRO, fontFace: FUENTE,
                    align: 'center', valign: 'top', margin: 0
                });
            }
        }
    }

    // --- Nombre y cargo del lead (el nombre es el enlace a LinkedIn) ---
    const esUrl = /^https?:\/\//i.test(linkedin);
    const nombreOpts = esUrl
        ? { color: AZUL, underline: { style: 'sng' }, hyperlink: { url: linkedin } }
        : { color: NEGRO };
    const nombreRuns = [
        { text: 'Nombre: ', options: { bold: true, color: NEGRO, breakLine: false } },
        { text: nombre, options: Object.assign({ bold: true, breakLine: !!cargo }, nombreOpts) }
    ];
    if (cargo) {
        nombreRuns.push({ text: 'Cargo: ', options: { bold: true, color: NEGRO } });
        nombreRuns.push({ text: cargo, options: { bold: true, color: NEGRO } });
    }
    slide.addText(nombreRuns, {
        x: XI, y: Y_NOMBRE, w: ANCHO, h: H_NOMBRE, isTextBox: true,
        fontSize: FS, fontFace: FUENTE, margin: 0, valign: 'top'
    });

    // --- Trayectoria y secciones de texto (ancho completo, una debajo de otra) ---
    secciones.forEach(s => {
        if (s.tipo === 'titulo') {
            slide.addText(s.texto, {
                x: XI, y: s.y, w: ANCHO, h: 0.22, isTextBox: true,
                fontSize: FS, bold: true, color: NEGRO, fontFace: FUENTE, margin: 0, valign: 'middle'
            });
        } else {
            slide.addText(s.texto, {
                x: XI, y: s.y, w: ANCHO, h: s.h, isTextBox: true,
                fontSize: FS, color: NEGRO, fontFace: FUENTE,
                align: 'justify', valign: 'top', margin: 0
            });
        }
    });

    // ---------- 7) Nombre del archivo y descarga ----------
    const safe = s => s.replace(/[^\w\sáéíóúñ-]/gi, '').replace(/\s+/g, '_');
    const nombreArchivo = safe(contacto) + '_' + safe(emp) + '.pptx';

    await pptx.writeFile({ fileName: nombreArchivo });
}


// ------------------------------------------------------------
//  ZONAS PARA ARRASTRAR IMÁGENES
//  Cada <input type="file"> se convierte en una zona donde se puede:
//   - arrastrar un archivo desde el escritorio o una imagen directo desde otra página (sin descargarla),
//   - pegar una imagen copiada (Ctrl+V) con la zona seleccionada,
//   - o hacer clic para elegir el archivo como antes.
//  El <input> original se conserva (oculto), así val()/leerFoto()/generarBrief() siguen funcionando igual.
// ------------------------------------------------------------
function initDropzones() {
    const TEXTO_VACIO = 'Arrastra una imagen aquí, pégala (Ctrl+V) o haz clic';

    document.querySelectorAll('input[type="file"]').forEach(input => {
        const zone  = document.createElement('div');
        const thumb = document.createElement('img');
        const hint  = document.createElement('span');
        const clear = document.createElement('button');
        zone.className  = 'dropzone';
        zone.tabIndex   = 0;
        thumb.className = 'dropzone-thumb';
        thumb.alt = '';
        hint.className  = 'dropzone-hint';
        clear.type = 'button';
        clear.className = 'dropzone-clear';
        clear.textContent = '×';
        clear.title = 'Quitar imagen';

        input.parentNode.insertBefore(zone, input);
        zone.append(thumb, hint, clear, input);
        input.style.display = 'none';

        // Refleja en la zona lo que hay en el input (miniatura + nombre del archivo)
        function actualizar(mensaje) {
            const file = input.files[0];
            if (thumb.src.startsWith('blob:')) URL.revokeObjectURL(thumb.src);
            zone.classList.toggle('has-file', !!file);
            zone.classList.toggle('has-error', !!mensaje);
            if (file) thumb.src = URL.createObjectURL(file); else thumb.removeAttribute('src');
            hint.textContent = mensaje || (file ? file.name : TEXTO_VACIO);
        }

        function ponerArchivo(file) {
            if (!file || !file.type.startsWith('image/')) return actualizar('Solo se aceptan imágenes.');
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            actualizar();
        }

        // Imagen arrastrada desde otra página: no hay archivo, solo una URL que se descarga en memoria
        async function desdeUrl(url) {
            try {
                const blob = await (await fetch(url)).blob();
                const nombre = decodeURIComponent((url.split('?')[0].split('/').pop() || 'imagen').slice(0, 60));
                ponerArchivo(new File([blob], nombre, { type: blob.type }));
            } catch (err) {
                actualizar('Esa página no deja copiar la imagen. Cópiala y pégala con Ctrl+V, o descárgala.');
            }
        }

        zone.addEventListener('click', e => { if (e.target !== clear) input.click(); });
        zone.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
        });
        input.addEventListener('change', () => actualizar());
        clear.addEventListener('click', e => {
            e.stopPropagation();
            input.value = '';
            actualizar();
        });

        ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => {
            e.preventDefault();
            zone.classList.add('dragover');
        }));
        ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => {
            e.preventDefault();
            zone.classList.remove('dragover');
        }));

        zone.addEventListener('drop', e => {
            const dt = e.dataTransfer;
            if (dt.files.length) return ponerArchivo(dt.files[0]);
            let url = dt.getData('text/uri-list').split('\n').find(l => l && !l.startsWith('#'));
            if (!url) {
                const m = /<img[^>]+src=["']([^"']+)["']/i.exec(dt.getData('text/html'));
                url = m && m[1];
            }
            if (url) desdeUrl(url.trim()); else actualizar('No se encontró ninguna imagen.');
        });

        zone.addEventListener('paste', e => {
            const item = [...e.clipboardData.items].find(it => it.type.startsWith('image/'));
            if (item) { e.preventDefault(); ponerArchivo(item.getAsFile()); }
        });

        actualizar();
    });

    // Si se suelta una imagen fuera de una zona, el navegador no debe abandonar la página para abrirla
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => e.preventDefault());
}

initDropzones();
