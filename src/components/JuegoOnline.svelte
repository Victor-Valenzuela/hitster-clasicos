<script>
  import { onMount, onDestroy } from "svelte";
  import { crearControlAudio, buscarAudioDeezer } from "../lib/audio.js";
  import {
    validarPosicion,
    insertarEnLinea,
    guardarJugada,
  } from "../lib/gameLogic.js";
  import {
    escucharSala,
    actualizarSala,
    obtenerSala,
    salirDeSala,
    eliminarSala,
  } from "../lib/salas.js";
  import { sonidoAcierto, sonidoFallo, sonidoSaltar, sonidoPoder, sonidoDesafio, sonidoGanarPoder } from "../lib/sfx.js";
  import { conectarAudio, resumirContexto } from "../lib/visualizer.js";
  import {
    calcularPoder,
    validarTexto,
    puedeUsarPoder,
    gastarPoder,
    generarPista,
    PODERES,
  } from "../lib/poderes.js";
  import { createEventDispatcher } from "svelte";

  import CartaActual from "./CartaActual.svelte";
  import Coleccion from "./Coleccion.svelte";
  import Marcador from "./Marcador.svelte";
  import PanelPoderes from "./avanzado/PanelPoderes.svelte";
  import CartaActualAvanzada from "./avanzado/CartaActualAvanzada.svelte";
  import SelectorJugador from "./avanzado/SelectorJugador.svelte";
  import SelectorCarta from "./avanzado/SelectorCarta.svelte";
  import PopupDesafio from "./avanzado/PopupDesafio.svelte";
  import PopupBloqueo from "./avanzado/PopupBloqueo.svelte";
  import NotificacionAlerta from "./avanzado/NotificacionAlerta.svelte";
  import TutorialAvanzado from "./avanzado/TutorialAvanzado.svelte";
  import TutorialOriginal from "./avanzado/TutorialOriginal.svelte";

  const dispatch = createEventDispatcher();

  export let codigoSala = "";
  export let miNombre = "";

  let sala = null;
  let unsub;
  let audioPlayer;
  let isPlaying = false;
  let cargandoAudio = false;
  let cancionCargada = "";
  let portadaLocal = "";
  let audioSrcLocal = "";
  let audioReady = false;
  let procesando = false;
  let mostrarConfirmacion = false;
  let viendoColeccionDe = "";

  // Avanzado
  let faseAvanzada = ""; // '', 'validando', 'poder-selector', 'poder-carta', 'desafio', 'bloqueo'
  let poderEnUso = "";
  let jugadorObjetivo = "";
  let pistaTexto = "";
  let desafioActivo = null; // { desafiante, ... }
  let bloqueoActivo = null; // { atacante, poder }
  let poderesUsadosEsteTurno = [];
  let alertaModoDificil = false;
  let alertaMostrada = false;
  let alertaModoDificilPor = '';
  let mostrarTutorial = false;
  let tutorialManual = false;
  let tutorialYaVisto = false;

  // Original mode
  let mostrarValidacionOriginal = false;
  let inputArtistaOriginal = '';
  let inputCancionOriginal = '';
  let hitsterPopupVisible = false;
  let notificacionCanje = '';
  let notificacionCanjeTimeout = null;

  // Verificar si el tutorial ya fue marcado como "no mostrar"
  try { tutorialYaVisto = localStorage.getItem('hitster_tutorial_visto') === 'true'; } catch (e) {}

  let tutorialOriginalYaVisto = false;
  try { tutorialOriginalYaVisto = localStorage.getItem('hitster_tutorial_original_visto') === 'true'; } catch (e) {}
  let mostrarTutorialOriginal = false;
  let tutorialOriginalManual = false;

  // Sincronizar poderes usados desde Firestore al reconectar
  $: if (miJugador?.poderesUsadosTurno) {
    poderesUsadosEsteTurno = miJugador.poderesUsadosTurno;
  }

  function pedirSalir() {
    mostrarConfirmacion = true;
  }

  async function eliminarSalaYFin(jugadoresData) {
    if (unsub) { unsub(); unsub = null; }
    try { await eliminarSala(codigoSala); } catch (err) {}
    dispatch("fin", jugadoresData);
  }

  function cancelarSalir() {
    mostrarConfirmacion = false;
  }
  async function confirmarSalir() {
    mostrarConfirmacion = false;
    audio.pause();
    isPlaying = false;
    if (unsub) unsub();
    await salirDeSala(codigoSala, miNombre);
    dispatch("salir");
  }

  $: jugadores = sala?.jugadores || [];
  $: turnoActual = sala?.turnoActual || 0;
  $: cancionActual = sala?.cancionActual || null;
  $: revelada = sala?.revelada || false;
  $: resultado = sala?.resultado || null;
  $: esMiTurno = jugadores[turnoActual]?.nombre === miNombre;
  $: miJugador = jugadores.find((j) => j.nombre === miNombre) || null;
  $: jugadorActivo = jugadores[turnoActual] || null;
  $: esAvanzado = sala?.modo === "avanzado";
  $: esOriginal = sala?.modo === "original";
  $: mazoRestante = sala?.mazo?.length || 0;
  $: audio = crearControlAudio(
    () => audioPlayer,
    (v) => (isPlaying = v),
  );

  let cancionConPortada = null;
  let ultimaCancionKey = "";
  $: {
    const key =
      cancionActual?.titulo + "|" + portadaLocal + "|" + audioSrcLocal;
    if (key !== ultimaCancionKey) {
      ultimaCancionKey = key;
      cancionConPortada = cancionActual
        ? {
            ...cancionActual,
            portada: portadaLocal || cancionActual.portada,
            audio: audioSrcLocal || cancionActual.audio,
          }
        : null;
    }
  }

  function onVerJugador(e) {
    const nombre = e.detail;
    if (viendoColeccionDe === nombre) {
      viendoColeccionDe = "";
    } else {
      viendoColeccionDe = nombre;
    }
  }

  $: jugadorViendo = viendoColeccionDe
    ? jugadores.find((j) => j.nombre === viendoColeccionDe)
    : null;

  const PUNTOS_PARA_GANAR = 10;

  onMount(async () => {
    unsub = await escucharSala(codigoSala, (data) => {
      if (!data) {
        // Sala fue borrada (todos salieron)
        dispatch("salir");
        return;
      }

      const prevTitulo = sala?.cancionActual?.titulo;
      const prevTurno = sala?.turnoActual;
      sala = data;

      if (data.estado === "fin") {
        // Eliminar sala directamente antes de despachar
        if (unsub) { unsub(); unsub = null; }
        eliminarSalaYFin(data.jugadores);
        return;
      }

      // Fase tutorial: mostrar tutorial si no lo ha visto
      if (data.estado === "tutorial" && data.modo === "avanzado" && !mostrarTutorial) {
        const miDatosTut = data.jugadores.find(j => j.nombre === miNombre);
        if (miDatosTut && !miDatosTut.tutorialListo) {
          if (tutorialYaVisto) {
            cerrarTutorial();
          } else {
            mostrarTutorial = true;
          }
        }
      }

      if (data.estado === "tutorial" && data.modo === "original" && !mostrarTutorialOriginal) {
        const miDatosTut = data.jugadores.find(j => j.nombre === miNombre);
        if (miDatosTut && !miDatosTut.tutorialListo) {
          if (tutorialOriginalYaVisto) {
            cerrarTutorialOriginal();
          } else {
            mostrarTutorialOriginal = true;
          }
        }
      }

      const esmiturnoAhora =
        data.jugadores[data.turnoActual]?.nombre === miNombre;
      const cancionCambio =
        data.cancionActual?.titulo !== prevTitulo ||
        data.turnoActual !== prevTurno;

      if (cancionCambio) {
        isPlaying = false;
        portadaLocal = "";
        audioSrcLocal = "";
        cancionCargada = "";
        audioReady = false;
        pistaTexto = "";
        faseAvanzada = "";
        poderesUsadosEsteTurno = [];
        // Solo resetear alerta cuando cambia el turno, no al saltar
        if (data.turnoActual !== prevTurno) {
          alertaMostrada = false;
        }
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.removeAttribute("src");
          audioPlayer.load();
        }
        // Guardar canción para evitar repeticiones en futuras partidas
        if (data.cancionActual) {
          guardarJugada(data.cancionActual.titulo, data.cancionActual.artista);
        }
        if (esmiturnoAhora && data.cancionActual) {
          cargarAudioCancion(data.cancionActual);
          // Mostrar alerta de modo difícil al inicio del turno
          const miDatos = data.jugadores.find(j => j.nombre === miNombre);
          if (miDatos && miDatos.modoDificil && !alertaMostrada) {
            alertaModoDificil = true;
            alertaMostrada = true;
            alertaModoDificilPor = miDatos.modoDificilPor || 'Tu oponente';
          }
        }
      }
    });
  });

  onDestroy(() => {
    if (unsub) unsub();
  });

  async function cargarAudioCancion(cancion) {
    const key = `${cancion.titulo}|${cancion.artista}`;
    if (cancionCargada === key || cargandoAudio) return;

    cargandoAudio = true;
    audioReady = false;
    try {
      let srcAudio = cancion.previewUrl || null;
      let srcPortada = cancion.portada || '';

      // Si no tiene audio local, buscar en Deezer
      if (!srcAudio || !srcAudio.startsWith('/audio/')) {
        const datos = await buscarAudioDeezer(cancion.titulo, cancion.artista);
        if (datos) {
          srcAudio = datos.previewUrl;
          if (!srcPortada && datos.portada) srcPortada = datos.portada;
        }
      }

      if (srcAudio && audioPlayer) {
        audioSrcLocal = srcAudio;
        portadaLocal = srcPortada;
        audioPlayer.src = srcAudio;
        cancionCargada = key;
        await new Promise((resolve) => {
          audioPlayer.oncanplaythrough = () => {
            audioReady = true;
            resolve();
          };
          audioPlayer.onerror = () => {
            audioReady = false;
            resolve();
          };
        });
      }
    } catch (e) {
      console.error("Error cargando audio:", e);
    }
    cargandoAudio = false;
  }

  function onToggle() {
    if (!esMiTurno || !audioReady) return;
    resumirContexto();
    if (audioPlayer) conectarAudio(audioPlayer);
    audio.toggle(isPlaying);
  }

  async function onSeleccionar(e) {
    if (!esMiTurno || revelada) return;
    await actualizarSala(codigoSala, { indiceSeleccionado: e.detail });
  }

  // Jugador avanzado presionó CONFIRMAR POSICIÓN -> pasa a bonus
  async function onRespondiendo() {
    await actualizarSala(codigoSala, { faseAvanzada: "respondiendo" });
  }

  async function onValidar() {
    if (!esMiTurno) return;
    const miLinea = miJugador.linea;
    const correcto = validarPosicion(
      miLinea,
      sala.indiceSeleccionado,
      cancionActual.year,
    );
    const res = correcto ? "correcto" : "incorrecto";

    if (correcto) sonidoAcierto();
    else { sonidoFallo(); audio.pause(); isPlaying = false; }

    await actualizarSala(codigoSala, { revelada: true, resultado: res });
  }

  async function onValidarAvanzado(e) {
    if (!esMiTurno) return;
    const { acertoArtista, acertoCancion, poderGanado } = e.detail;

    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;

    const miLinea = miJugador.linea;
    let correcto = validarPosicion(
      miLinea,
      salaFresca.indiceSeleccionado,
      cancionActual.year,
    );
    let res = correcto ? "correcto" : "incorrecto";

    const jugAct = salaFresca.jugadores.map((j) => ({ ...j }));
    const idx = jugAct.findIndex((j) => j.nombre === miNombre);

    // Modo difícil: debe acertar artista O canción además del año
    if (correcto && jugAct[idx].modoDificil) {
      if (!(acertoArtista || acertoCancion)) {
        correcto = false;
        res = "incorrecto";
        jugAct[idx].motivoFallo = "modoDificil";
      }
      jugAct[idx].modoDificil = false;
    }

    // Doble o nada: debe acertar año + algo del bonus
    if (correcto && jugAct[idx].dobleONada) {
      if (!(acertoArtista || acertoCancion)) {
        correcto = false;
        res = "incorrecto";
        jugAct[idx].motivoFallo = "dobleONada";
      }
    }

    // Fallo de año con doble o nada activo
    if (!correcto && jugAct[idx].dobleONada && !jugAct[idx].motivoFallo) {
      jugAct[idx].motivoFallo = "ano+dobleONada";
    }

    // Fallo normal de año
    if (!correcto && !jugAct[idx].motivoFallo) {
      jugAct[idx].motivoFallo = "ano";
    }

    if (correcto) {
      sonidoAcierto();
      jugAct[idx].motivoFallo = null;
    } else {
      sonidoFallo();
      audio.pause();
      isPlaying = false;
    }

    // Sumar poderes si acertó el año
    if (correcto && poderGanado > 0) {
      jugAct[idx].poderes = (jugAct[idx].poderes || 0) + poderGanado;
      sonidoGanarPoder();
    }

    // Revisar desafíos - recoger todos los desafiantes ordenados por quien apretó primero
    const desafiantes = jugAct
      .filter((j) => j.desafioActivo && j.nombre !== miNombre)
      .sort((a, b) => (a.desafioTimestamp || 0) - (b.desafioTimestamp || 0));

    if (!correcto && desafiantes.length > 0) {
      // Fallo + hay desafíos: pasar al primer desafiante
      const colaDesafiantes = desafiantes.map(j => j.nombre);
      await actualizarSala(codigoSala, {
        faseAvanzada: "desafio",
        desafianteNombre: colaDesafiantes[0],
        colaDesafiantes: colaDesafiantes,
        resultado: res,
        jugadores: jugAct,
      });
    } else {
      // Limpiar desafíos no usados
      jugAct.forEach((j) => {
        j.desafioActivo = false;
      });
      await actualizarSala(codigoSala, {
        revelada: true,
        resultado: res,
        faseAvanzada: "",
        jugadores: jugAct,
      });
    }
  }

  // Desafiante responde
  async function onDesafioRespuesta(e) {
    const {
      inputArtista,
      inputCancion,
      indiceSeleccionado: idxCarta,
    } = e.detail;
    const acertoArtista = validarTexto(inputArtista, cancionActual.artista);
    const acertoCancion = validarTexto(inputCancion, cancionActual.titulo);
    const acertoBonus = acertoArtista || acertoCancion;

    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;

    const jugAct = salaFresca.jugadores.map((j) => ({
      ...j,
      linea: [...(j.linea || [])],
    }));

    const idxDesafiante = jugAct.findIndex((j) => j.nombre === miNombre);
    const lineaDes = jugAct[idxDesafiante].linea;
    const acertoAno = validarPosicion(lineaDes, idxCarta, cancionActual.year);
    const gano = acertoAno && acertoBonus;

    if (gano) {
      const cancionConDatos = { ...salaFresca.cancionActual };
      jugAct[idxDesafiante].linea = insertarEnLinea(
        lineaDes,
        idxCarta,
        cancionConDatos,
      );
      jugAct[idxDesafiante].puntos += 1;
      sonidoAcierto();

      // Verificar victoria del desafiante
      if (jugAct[idxDesafiante].puntos >= PUNTOS_PARA_GANAR) {
        jugAct.forEach((j) => { j.desafioActivo = false; });
        await actualizarSala(codigoSala, {
          estado: "fin",
          jugadores: jugAct,
        });
        await eliminarSalaYFin(jugAct);
        return;
      }
    } else {
      sonidoFallo();
    }

    // Limpiar desafío del desafiante actual
    jugAct[idxDesafiante].desafioActivo = false;

    // Verificar si hay más desafiantes en la cola
    const cola = salaFresca.colaDesafiantes || [];
    const colaRestante = cola.filter(n => n !== miNombre);

    if (!gano && colaRestante.length > 0) {
      // Falló, pasar al siguiente desafiante. Guardar que este ya respondió.
      const resueltos = salaFresca.desafiantesResueltos || [];
      resueltos.push({ nombre: miNombre, resultado: "fallo" });
      await actualizarSala(codigoSala, {
        desafianteNombre: colaRestante[0],
        colaDesafiantes: colaRestante,
        jugadores: jugAct,
        resultadoDesafio: "fallo",
        desafiantesResueltos: resueltos,
      });
    } else {
      // Ganó o no hay más desafiantes, revelar y terminar
      jugAct.forEach((j) => { j.desafioActivo = false; });
      await actualizarSala(codigoSala, {
        revelada: true,
        faseAvanzada: "",
        jugadores: jugAct,
        resultadoDesafio: gano ? "acierto" : "fallo",
        desafianteNombre: gano ? miNombre : (salaFresca.desafianteNombre || ''),
        colaDesafiantes: [],
        desafiantesResueltos: [],
      });
    }
  }

  async function onContinuar() {
    if (!esMiTurno || procesando) return;
    procesando = true;

    try {
      // Leer sala fresca para evitar conflictos
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) {
        procesando = false;
        return;
      }

      const jugadoresActualizados = salaFresca.jugadores.map((j) => ({
        ...j,
        linea: [...(j.linea || [])],
      }));
      const idx = jugadoresActualizados.findIndex((j) => j.nombre === miNombre);
      jugadoresActualizados[idx].motivoFallo = null;
      jugadoresActualizados[idx].poderesUsadosTurno = [];
      jugadoresActualizados[idx].modoDificil = false;
      jugadoresActualizados[idx].modoDificilPor = null;

      if (salaFresca.resultado === "correcto") {
        const cancionConDatos = {
          ...salaFresca.cancionActual,
          portada: portadaLocal,
          audio: audioSrcLocal,
        };
        jugadoresActualizados[idx].linea = insertarEnLinea(
          jugadoresActualizados[idx].linea,
          salaFresca.indiceSeleccionado,
          cancionConDatos,
        );
        let puntosGanados = 1;
        if (esAvanzado && jugadoresActualizados[idx].dobleONada)
          puntosGanados = 2;
        jugadoresActualizados[idx].puntos += puntosGanados;
        if (jugadoresActualizados[idx].dobleONada)
          jugadoresActualizados[idx].dobleONada = false;

        if (jugadoresActualizados[idx].puntos >= PUNTOS_PARA_GANAR) {
          await actualizarSala(codigoSala, {
            estado: "fin",
            jugadores: jugadoresActualizados,
          });
          procesando = false;
          await eliminarSalaYFin(jugadoresActualizados);
          return;
        }
      } else if (esAvanzado && jugadoresActualizados[idx].dobleONada) {
        // Doble o nada: fallo = pierde una carta
        if (jugadoresActualizados[idx].linea.length > 1) {
          jugadoresActualizados[idx].linea.pop();
          jugadoresActualizados[idx].puntos = Math.max(
            0,
            jugadoresActualizados[idx].puntos - 1,
          );
        }
        jugadoresActualizados[idx].dobleONada = false;
      }

      const nuevoTurno =
        (salaFresca.turnoActual + 1) % jugadoresActualizados.length;
      const nuevoMazo = [...salaFresca.mazo];
      const nuevaCancion = nuevoMazo.pop() || null;

      if (!nuevaCancion) {
        await actualizarSala(codigoSala, {
          estado: "fin",
          jugadores: jugadoresActualizados,
        });
        procesando = false;
        await eliminarSalaYFin(jugadoresActualizados);
        return;
      }

      await actualizarSala(codigoSala, {
        jugadores: jugadoresActualizados,
        turnoActual: nuevoTurno,
        cancionActual: nuevaCancion,
        mazo: nuevoMazo,
        revelada: false,
        indiceSeleccionado: null,
        resultado: null,
        faseAvanzada: "",
        desafianteNombre: null,
        colaDesafiantes: [],
        desafiantesResueltos: [],
        resultadoDesafio: null,
      });
    } catch (e) {
      console.error("Error en continuar:", e);
    }
    procesando = false;
  }

  async function onSaltar() {
    if (!esMiTurno || procesando) return;

    // En modo avanzado, saltar cuesta 1⚡
    if (esAvanzado) {
      if (!puedeUsarPoder(miJugador, "saltar")) return;
    } else {
      if (miJugador.saltos <= 0) return;
    }

    procesando = true;

    try {
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) {
        procesando = false;
        return;
      }

      const jugadoresActualizados = salaFresca.jugadores.map((j) => ({
        ...j,
        linea: [...(j.linea || [])],
      }));
      const idx = jugadoresActualizados.findIndex((j) => j.nombre === miNombre);

      if (esAvanzado) {
        jugadoresActualizados[idx] = gastarPoder(
          jugadoresActualizados[idx],
          "saltar",
        );
        jugadoresActualizados[idx].linea =
          jugadoresActualizados[idx].linea || [];
      } else {
        if (jugadoresActualizados[idx].saltos <= 0) {
          procesando = false;
          return;
        }
        jugadoresActualizados[idx].saltos -= 1;
      }

      sonidoSaltar();
      audio.pause();
      isPlaying = false;

      const nuevoMazo = [...salaFresca.mazo];
      const nuevaCancion = nuevoMazo.pop() || null;

      if (!nuevaCancion) {
        await actualizarSala(codigoSala, {
          estado: "fin",
          jugadores: jugadoresActualizados,
        });
        procesando = false;
        await eliminarSalaYFin(jugadoresActualizados);
        return;
      }

      await actualizarSala(codigoSala, {
        jugadores: jugadoresActualizados,
        cancionActual: nuevaCancion,
        mazo: nuevoMazo,
        revelada: false,
        indiceSeleccionado: null,
        resultado: null,
      });
    } catch (e) {
      console.error("Error en saltar:", e);
    }
    procesando = false;
  }

  // === PODERES ===
  async function onUsarPoder(e) {
    const poderKey = e.detail;
    if (!esMiTurno || !esAvanzado || !puedeUsarPoder(miJugador, poderKey))
      return;
    if (poderesUsadosEsteTurno.includes(poderKey)) return;

    if (poderKey === "saltar") {
      poderesUsadosEsteTurno = [...poderesUsadosEsteTurno, poderKey];
      await onSaltar();
      // No guardamos en Firestore porque saltar cambia de turno y limpia todo
      return;
    }

    if (poderKey === "pista") {
      if (!cancionActual || revelada) return;
      pistaTexto = generarPista(cancionActual.year, miJugador?.linea || []);
      sonidoPoder();
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) return;
      const jugAct = salaFresca.jugadores.map((j) => ({ ...j }));
      const idx = jugAct.findIndex((j) => j.nombre === miNombre);
      jugAct[idx] = gastarPoder(jugAct[idx], "pista");
      registrarPoderUsado(poderKey, jugAct, idx);
      await actualizarSala(codigoSala, { jugadores: jugAct });
      return;
    }

    if (poderKey === "dobleONada") {
      sonidoPoder();
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) return;
      const jugAct = salaFresca.jugadores.map((j) => ({ ...j }));
      const idx = jugAct.findIndex((j) => j.nombre === miNombre);
      jugAct[idx] = gastarPoder(jugAct[idx], "dobleONada");
      jugAct[idx].dobleONada = true;
      registrarPoderUsado(poderKey, jugAct, idx);
      await actualizarSala(codigoSala, { jugadores: jugAct });
      return;
    }

    if (poderKey === "modoDificil" || poderKey === "intercambio") {
      sonidoPoder();
      poderEnUso = poderKey;
      faseAvanzada = "poder-selector";
      return;
    }

    if (poderKey === "desafio") {
      if (esMiTurno || revelada) return; // Solo otros jugadores pueden desafiar
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) return;
      const jugAct = salaFresca.jugadores.map((j) => ({ ...j }));
      const idx = jugAct.findIndex((j) => j.nombre === miNombre);
      jugAct[idx] = gastarPoder(jugAct[idx], "desafio");
      jugAct[idx].desafioActivo = true;
      await actualizarSala(codigoSala, { jugadores: jugAct });
      return;
    }
  }

  async function onSeleccionarJugador(e) {
    const objetivo = e.detail;
    jugadorObjetivo = objetivo;

    if (poderEnUso === "intercambio") {
      faseAvanzada = "poder-carta";
      return;
    }

    if (poderEnUso === "modoDificil") {
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) {
        faseAvanzada = "";
        return;
      }
      const jugAct = salaFresca.jugadores.map((j) => ({ ...j }));
      const idxMio = jugAct.findIndex((j) => j.nombre === miNombre);
      const idxObj = jugAct.findIndex((j) => j.nombre === objetivo);

      // Verificar si ya tiene modo difícil activo
      if (jugAct[idxObj].modoDificil) {
        faseAvanzada = "";
        poderEnUso = "";
        pistaTexto = "⚠️ " + objetivo + " ya tiene modo difícil activo";
        setTimeout(() => pistaTexto = "", 3000);
        return;
      }

      jugAct[idxMio] = gastarPoder(jugAct[idxMio], "modoDificil");
      jugAct[idxObj].modoDificil = true;
      jugAct[idxObj].modoDificilPor = miNombre;
      registrarPoderUsado("modoDificil", jugAct, idxMio);
      poderesUsadosEsteTurno = [...poderesUsadosEsteTurno, "modoDificil"];
      await actualizarSala(codigoSala, { jugadores: jugAct });
      faseAvanzada = "";
      poderEnUso = "";
    }
  }

  async function onIntercambiar(e) {
    const { cartaPropia, cartaObjetivo } = e.detail;
    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) {
      faseAvanzada = "";
      return;
    }

    const jugAct = salaFresca.jugadores.map((j) => ({
      ...j,
      linea: [...(j.linea || [])],
    }));
    const idxMio = jugAct.findIndex((j) => j.nombre === miNombre);
    const idxObj = jugAct.findIndex((j) => j.nombre === jugadorObjetivo);

    jugAct[idxMio] = gastarPoder(jugAct[idxMio], "intercambio");
    registrarPoderUsado("intercambio", jugAct, idxMio);
    poderesUsadosEsteTurno = [...poderesUsadosEsteTurno, "intercambio"];

    const temp = jugAct[idxMio].linea[cartaPropia];
    jugAct[idxMio].linea[cartaPropia] = jugAct[idxObj].linea[cartaObjetivo];
    jugAct[idxObj].linea[cartaObjetivo] = temp;

    // Reordenar líneas por año
    jugAct[idxMio].linea.sort((a, b) => a.year - b.year);
    jugAct[idxObj].linea.sort((a, b) => a.year - b.year);

    await actualizarSala(codigoSala, { jugadores: jugAct });
    faseAvanzada = "";
    poderEnUso = "";
    jugadorObjetivo = "";
  }

  function onCancelarPoder() {
    faseAvanzada = "";
    poderEnUso = "";
    jugadorObjetivo = "";
  }

  async function onUsarDesafio() {
    if (!esAvanzado || esMiTurno || !puedeUsarPoder(miJugador, "desafio"))
      return;
    sonidoDesafio();
    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;
    const jugAct = salaFresca.jugadores.map((j) => ({ ...j }));
    const idx = jugAct.findIndex((j) => j.nombre === miNombre);
    // Verificar que no haya activado ya
    if (jugAct[idx].desafioActivo) return;
    jugAct[idx] = gastarPoder(jugAct[idx], "desafio");
    jugAct[idx].desafioActivo = true;
    jugAct[idx].desafioTimestamp = Date.now();
    await actualizarSala(codigoSala, { jugadores: jugAct });
  }

  async function registrarPoderUsado(poderKey, jugAct, idx) {
    const usados = jugAct[idx].poderesUsadosTurno || [];
    jugAct[idx].poderesUsadosTurno = [...usados, poderKey];
    poderesUsadosEsteTurno = jugAct[idx].poderesUsadosTurno;
  }

  // === MODO ORIGINAL ===
  async function onGritarHitster() {
    if (!esOriginal || esMiTurno || revelada) return;
    if ((miJugador?.fichas || 0) < 1) return;
    // Verificar que no haya gritado ya
    if (miJugador?.hitsterActivo) return;

    sonidoDesafio();
    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;
    const jugAct = salaFresca.jugadores.map(j => ({ ...j }));
    const idx = jugAct.findIndex(j => j.nombre === miNombre);
    jugAct[idx].fichas -= 1;
    jugAct[idx].hitsterActivo = true;
    jugAct[idx].hitsterTimestamp = Date.now();
    await actualizarSala(codigoSala, { jugadores: jugAct });
  }

  async function onSaltarOriginal() {
    if (!esOriginal || !esMiTurno || procesando) return;
    if ((miJugador?.fichas || 0) < 1) return;

    procesando = true;
    try {
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) { procesando = false; return; }

      const jugAct = salaFresca.jugadores.map(j => ({ ...j, linea: [...(j.linea || [])] }));
      const idx = jugAct.findIndex(j => j.nombre === miNombre);
      jugAct[idx].fichas -= 1;

      sonidoSaltar();
      audio.pause();
      isPlaying = false;

      const nuevoMazo = [...salaFresca.mazo];
      const nuevaCancion = nuevoMazo.pop() || null;

      if (!nuevaCancion) {
        await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
        procesando = false;
        await eliminarSalaYFin(jugAct);
        return;
      }

      await actualizarSala(codigoSala, {
        jugadores: jugAct,
        cancionActual: nuevaCancion,
        mazo: nuevoMazo,
        revelada: false,
        indiceSeleccionado: null,
        resultado: null,
      });
    } catch (e) { console.error('Error saltar original:', e); }
    procesando = false;
  }

  async function onCanjearFichas() {
    if (!esOriginal || procesando) return;
    if ((miJugador?.fichas || 0) < 3) return;

    procesando = true;
    try {
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) { procesando = false; return; }

      const jugAct = salaFresca.jugadores.map(j => ({ ...j, linea: [...(j.linea || [])] }));
      const idx = jugAct.findIndex(j => j.nombre === miNombre);
      jugAct[idx].fichas -= 3;

      const nuevoMazo = [...salaFresca.mazo];
      const cartaCanjeada = nuevoMazo.pop();
      if (cartaCanjeada) {
        jugAct[idx].linea.push(cartaCanjeada);
        jugAct[idx].linea.sort((a, b) => a.year - b.year);
        jugAct[idx].puntos += 1;
      }

      sonidoAcierto();

      // Verificar victoria
      if (jugAct[idx].puntos >= PUNTOS_PARA_GANAR) {
        await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct, mazo: nuevoMazo });
        procesando = false;
        await eliminarSalaYFin(jugAct);
        return;
      }

      // Notificar a todos
      await actualizarSala(codigoSala, {
        jugadores: jugAct,
        mazo: nuevoMazo,
        notificacionCanje: miNombre,
      });

      // Limpiar notificación después de 4s
      setTimeout(async () => {
        try { await actualizarSala(codigoSala, { notificacionCanje: null }); } catch(e) {}
      }, 4000);
    } catch (e) { console.error('Error canjear fichas:', e); }
    procesando = false;
  }

  async function onValidarOriginal(e) {
    if (!esMiTurno || !esOriginal) return;
    const { acertoArtista, acertoCancion } = e.detail;

    const miLinea = miJugador.linea;
    const correcto = validarPosicion(miLinea, sala.indiceSeleccionado, cancionActual.year);
    const res = correcto ? "correcto" : "incorrecto";

    if (correcto) sonidoAcierto();
    else { sonidoFallo(); audio.pause(); isPlaying = false; }

    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;
    const jugAct = salaFresca.jugadores.map(j => ({ ...j, linea: [...(j.linea || [])] }));
    const idx = jugAct.findIndex(j => j.nombre === miNombre);

    // Si acertó posición Y artista+canción, ganar ficha (max 5)
    if (correcto && acertoArtista && acertoCancion && (jugAct[idx].fichas || 0) < 5) {
      jugAct[idx].fichas += 1;
      sonidoGanarPoder();
    }

    const hitsters = jugAct
      .filter(j => j.hitsterActivo && j.nombre !== miNombre)
      .sort((a, b) => (a.hitsterTimestamp || 0) - (b.hitsterTimestamp || 0));

    if (!correcto && hitsters.length > 0) {
      const colaHitster = hitsters.map(j => j.nombre);
      await actualizarSala(codigoSala, {
        faseOriginal: "hitster",
        hitsterNombre: colaHitster[0],
        colaHitster: colaHitster,
        resultado: res,
        jugadores: jugAct,
      });
    } else {
      jugAct.forEach(j => { j.hitsterActivo = false; });
      await actualizarSala(codigoSala, {
        revelada: true,
        resultado: res,
        jugadores: jugAct,
      });
    }
  }

  async function onValidarBonusOriginal() {
    // Jugador activo intenta adivinar artista+título para ganar ficha
    if (!esMiTurno || !esOriginal) return;
    const acertoArtista = validarTexto(inputArtistaOriginal, cancionActual.artista);
    const acertoCancion = validarTexto(inputCancionOriginal, cancionActual.titulo);

    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;
    const jugAct = salaFresca.jugadores.map(j => ({ ...j, linea: [...(j.linea || [])] }));
    const idx = jugAct.findIndex(j => j.nombre === miNombre);

    if (acertoArtista && acertoCancion && (jugAct[idx].fichas || 0) < 5) {
      jugAct[idx].fichas += 1;
      sonidoGanarPoder();
    }

    mostrarValidacionOriginal = false;
    inputArtistaOriginal = '';
    inputCancionOriginal = '';

    // Avanzar turno
    const nuevoTurno = (salaFresca.turnoActual + 1) % jugAct.length;
    const nuevoMazo = [...salaFresca.mazo];
    const nuevaCancion = nuevoMazo.pop() || null;

    if (!nuevaCancion) {
      await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
      await eliminarSalaYFin(jugAct);
      return;
    }

    await actualizarSala(codigoSala, {
      jugadores: jugAct,
      turnoActual: nuevoTurno,
      cancionActual: nuevaCancion,
      mazo: nuevoMazo,
      revelada: false,
      indiceSeleccionado: null,
      resultado: null,
      faseOriginal: "",
      hitsterNombre: null,
      hitsterGanador: null,
      resultadoHitster: null,
      colaHitster: [],
    });
  }

  function onHitsterRespuestaPopup(e) {
    // PopupDesafio dispatches { inputArtista, inputCancion, indiceSeleccionado }
    // HITSTER only needs indiceSeleccionado
    onHitsterRespuesta({ detail: { indiceSeleccionado: e.detail.indiceSeleccionado } });
  }

  async function onHitsterRespuesta(e) {
    // Un jugador que gritó HITSTER elige posición en la línea del jugador activo
    const { indiceSeleccionado: idxPos } = e.detail;

    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;

    const jugAct = salaFresca.jugadores.map(j => ({ ...j, linea: [...(j.linea || [])] }));
    const idxActivo = jugAct.findIndex(j => j.nombre === jugadorActivo?.nombre);
    const lineaActivo = jugAct[idxActivo].linea;
    const acerto = validarPosicion(lineaActivo, idxPos, cancionActual.year);

    const idxHitster = jugAct.findIndex(j => j.nombre === miNombre);

    if (acerto) {
      // Se roba la carta para su propia línea
      const cancionConDatos = { ...salaFresca.cancionActual };
      jugAct[idxHitster].linea.push(cancionConDatos);
      jugAct[idxHitster].linea.sort((a, b) => a.year - b.year);
      jugAct[idxHitster].puntos += 1;
      sonidoAcierto();

      // Verificar victoria
      if (jugAct[idxHitster].puntos >= PUNTOS_PARA_GANAR) {
        jugAct.forEach(j => { j.hitsterActivo = false; });
        await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
        await eliminarSalaYFin(jugAct);
        return;
      }
    } else {
      sonidoFallo();
      jugAct[idxHitster].hitsterFallo = true;
    }

    jugAct[idxHitster].hitsterActivo = false;

    // Verificar si hay más en la cola
    const cola = salaFresca.colaHitster || [];
    const colaRestante = cola.filter(n => n !== miNombre);

    if (!acerto && colaRestante.length > 0) {
      await actualizarSala(codigoSala, {
        hitsterNombre: colaRestante[0],
        colaHitster: colaRestante,
        jugadores: jugAct,
      });
    } else {
      jugAct.forEach(j => { j.hitsterActivo = false; });
      await actualizarSala(codigoSala, {
        revelada: true,
        faseOriginal: "",
        jugadores: jugAct,
        hitsterNombre: acerto ? miNombre : null,
        hitsterGanador: acerto ? miNombre : null,
        resultadoHitster: acerto ? "acierto" : "fallo",
        colaHitster: [],
      });
    }
  }

  async function onContinuarOriginal() {
    if (!esMiTurno || procesando) return;
    procesando = true;

    try {
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) { procesando = false; return; }

      const jugAct = salaFresca.jugadores.map(j => ({ ...j, linea: [...(j.linea || [])] }));
      const idx = jugAct.findIndex(j => j.nombre === miNombre);

      if (salaFresca.resultado === "correcto") {
        const cancionConDatos = { ...salaFresca.cancionActual, portada: portadaLocal, audio: audioSrcLocal };
        jugAct[idx].linea = insertarEnLinea(jugAct[idx].linea, salaFresca.indiceSeleccionado, cancionConDatos);
        jugAct[idx].puntos += 1;

        if (jugAct[idx].puntos >= PUNTOS_PARA_GANAR) {
          await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
          procesando = false;
          await eliminarSalaYFin(jugAct);
          return;
        }
      }

      const nuevoTurno = (salaFresca.turnoActual + 1) % jugAct.length;
      const nuevoMazo = [...salaFresca.mazo];
      const nuevaCancion = nuevoMazo.pop() || null;

      if (!nuevaCancion) {
        await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
        procesando = false;
        await eliminarSalaYFin(jugAct);
        return;
      }

      await actualizarSala(codigoSala, {
        jugadores: jugAct,
        turnoActual: nuevoTurno,
        cancionActual: nuevaCancion,
        mazo: nuevoMazo,
        revelada: false,
        indiceSeleccionado: null,
        resultado: null,
        faseOriginal: "",
        hitsterNombre: null,
        hitsterGanador: null,
        resultadoHitster: null,
        colaHitster: [],
      });
    } catch (e) { console.error('Error continuar original:', e); }
    procesando = false;
  }

  async function cerrarTutorial() {
    mostrarTutorial = false;
    // Marcar como listo en Firestore
    if (sala && sala.estado === 'tutorial') {
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) return;
      const jugAct = salaFresca.jugadores.map(j => ({ ...j }));
      const idx = jugAct.findIndex(j => j.nombre === miNombre);
      if (idx !== -1) jugAct[idx].tutorialListo = true;

      // Si todos están listos, iniciar el juego
      const todosListos = jugAct.every(j => j.tutorialListo);
      if (todosListos) {
        await actualizarSala(codigoSala, { estado: 'jugando', jugadores: jugAct });
      } else {
        await actualizarSala(codigoSala, { jugadores: jugAct });
      }
    }
  }

  function abrirTutorialManual() {
    tutorialManual = true;
    mostrarTutorial = true;
  }

  function cerrarTutorialManual() {
    mostrarTutorial = false;
    tutorialManual = false;
  }

  async function cerrarTutorialOriginal() {
    mostrarTutorialOriginal = false;
    if (sala && sala.estado === 'tutorial') {
      const salaFresca = await obtenerSala(codigoSala);
      if (!salaFresca) return;
      const jugAct = salaFresca.jugadores.map(j => ({ ...j }));
      const idx = jugAct.findIndex(j => j.nombre === miNombre);
      if (idx !== -1) jugAct[idx].tutorialListo = true;

      const todosListos = jugAct.every(j => j.tutorialListo);
      if (todosListos) {
        await actualizarSala(codigoSala, { estado: 'jugando', jugadores: jugAct });
      } else {
        await actualizarSala(codigoSala, { jugadores: jugAct });
      }
    }
  }

  function abrirTutorialOriginalManual() {
    tutorialOriginalManual = true;
    mostrarTutorialOriginal = true;
  }

  function cerrarTutorialOriginalManual() {
    mostrarTutorialOriginal = false;
    tutorialOriginalManual = false;
  }
</script>

<div
  class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-2 py-2 bg-slate-900 border-b border-white/15 gap-1"
>
  <!-- Desktop -->
  <span class="text-white font-black text-base desktop-only"
    >🌐 Sala <span class="text-indigo-400 tracking-widest text-lg">{codigoSala}</span></span
  >
  <!-- Móvil -->
  <span class="text-indigo-400 font-black text-sm tracking-widest mobile-only">{codigoSala}</span>

  <span class="text-slate-300 text-xs font-bold truncate max-w-[80px] mobile-only">👤 {miNombre}</span>
  <span class="text-slate-300 text-sm font-bold desktop-only">👤 {miNombre}</span>

  <div class="flex items-center gap-1">
    {#if esAvanzado}
      <button
        on:click={abrirTutorialManual}
        class="bg-indigo-600 text-white text-xs font-black w-7 h-7 rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
      >
        ❓
      </button>
    {/if}
    {#if esOriginal}
      <button
        on:click={abrirTutorialOriginalManual}
        class="bg-indigo-600 text-white text-xs font-black w-7 h-7 rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
      >
        ❓
      </button>
    {/if}
    <button
      on:click={pedirSalir}
      class="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all active:scale-95 mobile-only"
    >
      Salir
    </button>
    <button
      on:click={pedirSalir}
      class="bg-red-500 text-white text-sm font-black px-5 py-2 rounded-xl hover:bg-red-600 transition-all active:scale-95 desktop-only"
    >
      🚪 Salir
    </button>
  </div>
</div>

<div class="w-full max-w-6xl pt-14">
  <audio
    bind:this={audioPlayer}
    on:ended={() => (isPlaying = false)}
    crossorigin="anonymous"
  ></audio>

  {#if sala?.estado === 'tutorial'}
    <div class="glass p-8 rounded-3xl text-center mb-6">
      <h2 class="text-white font-black text-xl mb-4">
        {#if esOriginal}🎯 Preparando partida original{:else}⚡ Preparando partida avanzada{/if}
      </h2>
      <div class="flex flex-wrap justify-center gap-2 mb-4">
        {#each jugadores as j}
          <div class="px-4 py-2 rounded-2xl text-center {j.tutorialListo ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'}">
            <p class="font-black text-sm">{j.nombre}</p>
            <p class="text-xs">{j.tutorialListo ? '✅ Listo' : '⏳ Leyendo...'}</p>
          </div>
        {/each}
      </div>
      {#if jugadores.find(j => j.nombre === miNombre)?.tutorialListo}
        <p class="text-slate-400 text-sm">Esperando a los demás jugadores...</p>
      {/if}
    </div>
  {:else}

  <Marcador
    {jugadores}
    {turnoActual}
    clickable={true}
    {esAvanzado}
    {esOriginal}
    on:verJugador={onVerJugador}
  />

  {#if esAvanzado && esMiTurno && !revelada}
    <div class="mb-4">
      <PanelPoderes
        jugador={miJugador}
        {esMiTurno}
        fase="colocar"
        poderesUsados={poderesUsadosEsteTurno}
        on:poder={onUsarPoder}
      />
    </div>
  {/if}

  {#if esOriginal && esMiTurno}
    <div class="flex justify-center gap-2 mb-4 flex-wrap">
      {#if !revelada && (miJugador?.fichas || 0) >= 1}
        <button
          on:click={onSaltarOriginal}
          class="bg-slate-600 hover:bg-slate-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all active:scale-95"
        >
          ⏭️ Saltar (<img src="/images/casino.png" alt="ficha" class="inline w-4 h-4" style="vertical-align: middle; margin-top: -2px;" />1)
        </button>
      {/if}
      {#if (miJugador?.fichas || 0) >= 3}
        <button
          on:click={onCanjearFichas}
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all active:scale-95"
        >
          🔄 Canjear 3 fichas
        </button>
      {/if}
    </div>
  {/if}

  {#if pistaTexto && esMiTurno}
    <div class="flex justify-center mb-4">
      <div class="glass px-5 py-3 rounded-xl text-center inline-block">
        <p class="text-yellow-400 font-bold text-sm">🔍 {pistaTexto}</p>
      </div>
    </div>
  {/if}

  {#if esAvanzado && miJugador?.dobleONada && esMiTurno}
    <div class="flex justify-center mb-4">
      <div class="glass px-5 py-3 rounded-xl text-center inline-block">
        <p class="text-purple-400 font-bold text-sm">
          🎵 Doble o nada activado — ¡Acierta para ganar 2 puntos!
        </p>
      </div>
    </div>
  {/if}

  {#if esAvanzado && miJugador?.modoDificil && esMiTurno}
    <div class="flex justify-center mb-4">
      <p class="text-red-400 font-bold text-xs">🔥 Modo difícil activo</p>
    </div>
  {/if}

  {#if mostrarConfirmacion}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
      <div class="neon-card neon-card-amber animate-in">
        <!-- Acentos esquina superior izquierda -->
        <div class="neon-card-corner-tl">
          <span></span><span></span><span></span><span></span>
        </div>

        <div class="neon-card-body">
          <div class="neon-icon-amber mb-3 warn-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round"/>
              <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
            </svg>
          </div>
          <h2 class="font-neon neon-card-title neon-card-title-amber">SALIR</h2>
          <p class="text-slate-200/85 text-center font-mono text-sm mb-6">
            ¿Seguro que quieres abandonar la sala?
          </p>
          <div class="flex gap-3 w-full">
            <button
              on:click={cancelarSalir}
              class="flex-1 bg-white/10 text-slate-300 font-bold py-3 rounded-xl text-sm hover:bg-white/20 transition-all"
            >
              Cancelar
            </button>
            <button
              on:click={confirmarSalir}
              class="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 transition-all active:scale-95"
            >
              Sí, salir
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if !esMiTurno}
    <div class="glass p-6 rounded-3xl text-center mb-6">
      <p class="text-white font-black text-lg">
        🎵 Turno de {jugadorActivo?.nombre}
      </p>
      {#if esOriginal}
        <p class="text-amber-400 text-xs font-bold mt-1"><img src="/images/casino.png" alt="ficha" class="inline w-4 h-4" style="vertical-align: middle; margin-top: -2px;" /> Tus fichas: {miJugador?.fichas || 0}</p>
      {/if}
      {#if esAvanzado && sala?.faseAvanzada === "desafio"}
        {#if sala?.desafianteNombre === miNombre}
          <!-- Soy el desafiante actual, popup se muestra abajo -->
        {:else if sala?.desafiantesResueltos?.find(d => d.nombre === miNombre)}
          <!-- Ya respondí el desafío y fallé -->
          <p class="text-red-400 text-sm font-bold mt-2">🎯 Fallaste el desafío</p>
          <p class="text-slate-400 text-xs mt-1">Era "{cancionActual?.titulo}" ({cancionActual?.year}) de {cancionActual?.artista}</p>
          <p class="text-yellow-400 text-xs mt-2 font-bold">🎯 {sala?.desafianteNombre} está intentando...</p>
        {:else}
          <p class="text-yellow-400 text-sm mt-2 font-bold">
            🎯 {sala?.desafianteNombre} está respondiendo el desafío...
          </p>
        {/if}
      {:else if esOriginal && sala?.faseOriginal === "hitster"}
        {#if sala?.hitsterNombre === miNombre}
          <!-- Soy el que gritó HITSTER, popup se muestra abajo -->
        {:else}
          <p class="text-yellow-400 text-sm mt-2 font-bold">
            🎯 {sala?.hitsterNombre} está eligiendo posición en tu línea...
          </p>
        {/if}
      {:else if revelada && resultado}
        <p
          class="font-black text-lg mt-2 {resultado === 'correcto'
            ? 'text-emerald-400'
            : 'text-red-400'}"
        >
          {resultado === "correcto"
            ? "¡Acertó! 🎉"
            : `¡Falló! Era de ${cancionActual?.year} 😬`}
        </p>
        {#if cancionActual}
          <p class="text-white font-bold text-sm mt-1">"{cancionActual.titulo}"</p>
          <p class="text-slate-400 text-xs">{cancionActual.artista} — {cancionActual.year}</p>
        {/if}
        {#if sala?.resultadoDesafio}
          {#if sala?.desafianteNombre === miNombre}
            {#if sala.resultadoDesafio === 'acierto'}
              <p class="text-emerald-400 text-sm font-bold mt-2">🎯 ¡Acertaste el desafío!</p>
              <p class="text-slate-400 text-xs mt-1">"{cancionActual?.titulo}" ({cancionActual?.year}) — {cancionActual?.artista}</p>
            {:else}
              <p class="text-red-400 text-sm font-bold mt-2">🎯 Fallaste el desafío</p>
              <p class="text-slate-400 text-xs mt-1">Era "{cancionActual?.titulo}" ({cancionActual?.year}) de {cancionActual?.artista}</p>
            {/if}
          {:else}
            <p class="text-sm mt-2 font-bold {sala.resultadoDesafio === 'acierto' ? 'text-yellow-400' : 'text-slate-400'}">
              {sala.resultadoDesafio === 'acierto'
                ? `🎯 ¡${sala?.desafianteNombre} acertó el desafío y se quedó la carta!`
                : `🎯 ${sala?.desafianteNombre} también falló el desafío`}
            </p>
          {/if}
        {/if}
        {#if sala?.resultadoHitster}
          {#if sala?.hitsterGanador === miNombre}
            <p class="text-emerald-400 text-sm font-bold mt-2">🎯 ¡Acertaste el HITSTER y te robaste la carta!</p>
            <p class="text-slate-400 text-xs mt-1">"{cancionActual?.titulo}" ({cancionActual?.year}) — {cancionActual?.artista}</p>
          {:else if miJugador?.hitsterFallo}
            <p class="text-red-400 text-sm font-bold mt-2">🎯 Fallaste el HITSTER</p>
            <p class="text-slate-400 text-xs mt-1">Era "{cancionActual?.titulo}" ({cancionActual?.year}) de {cancionActual?.artista}</p>
          {:else if sala?.hitsterGanador}
            <p class="text-yellow-400 text-sm font-bold mt-2">
              🎯 ¡{sala.hitsterGanador} acertó el HITSTER y se robó la carta!
            </p>
          {:else}
            <p class="text-slate-400 text-sm font-bold mt-2">
              🎯 Nadie acertó el HITSTER
            </p>
          {/if}
        {/if}
      {:else}
        {#if esAvanzado && sala?.faseAvanzada === "respondiendo"}
          <p class="text-yellow-400 text-sm mt-2 font-bold">
            ✍️ {jugadorActivo?.nombre} está respondiendo...
          </p>
        {:else}
          <p class="text-slate-400 text-sm mt-1">Esperando su jugada...</p>
        {/if}
        {#if esAvanzado && !revelada}
          {#if miJugador && puedeUsarPoder(miJugador, "desafio") && !miJugador.desafioActivo}
            <button
              on:click={onUsarDesafio}
              class="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all active:scale-95"
            >
              🎯 Desafiar (<span class="drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">⚡</span>1)
            </button>
          {:else if miJugador?.desafioActivo}
            <p class="text-yellow-300 text-xs mt-2 font-bold">
              🎯 Desafío activado — esperando resultado...
            </p>
          {/if}
        {/if}
        {#if esOriginal && !revelada}
          {#if miJugador && (miJugador.fichas || 0) >= 1 && !miJugador.hitsterActivo}
            <button
              on:click={onGritarHitster}
              class="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all active:scale-95"
            >
              🎯 HITSTER (<img src="/images/casino.png" alt="ficha" class="inline w-4 h-4" style="vertical-align: middle; margin-top: -2px;" />1)
            </button>
          {:else if miJugador?.hitsterActivo}
            <p class="text-amber-300 text-xs mt-2 font-bold">
              🎯 HITSTER activado — esperando resultado...
            </p>
          {/if}
          {#if miJugador && (miJugador.fichas || 0) >= 3}
            <button
              on:click={onCanjearFichas}
              class="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all active:scale-95"
            >
              🔄 Canjear 3 fichas
            </button>
          {/if}
        {/if}
      {/if}
    </div>
  {/if}

  <div class="layout-juego">
    {#if esMiTurno}
      <div class="zona-carta">
        {#if esAvanzado || esOriginal}
          <CartaActualAvanzada
            cancionActual={cancionConPortada}
            {revelada}
            {cargandoAudio}
            {isPlaying}
            {resultado}
            indiceSeleccionado={sala?.indiceSeleccionado}
            {audioPlayer}
            nombreJugador={miNombre}
            restantes={mazoRestante}
            modoDificilActivo={esAvanzado ? (miJugador?.modoDificil || false) : false}
            dobleONadaActivo={esAvanzado ? (miJugador?.dobleONada || false) : false}
            desafioEnCurso={esAvanzado ? sala?.faseAvanzada === "desafio" : sala?.faseOriginal === "hitster"}
            motivoFallo={miJugador?.motivoFallo || null}
            resultadoDesafio={esAvanzado ? (sala?.resultadoDesafio || null) : (sala?.resultadoHitster || null)}
            desafianteNombre={esAvanzado ? (sala?.desafianteNombre || '') : (sala?.hitsterGanador || sala?.hitsterNombre || '')}
            {esOriginal}
            fichasJugador={miJugador?.fichas || 0}
            on:toggle={onToggle}
            on:respondiendo={onRespondiendo}
            on:validar={esOriginal ? onValidarOriginal : onValidarAvanzado}
            on:continuar={esOriginal ? onContinuarOriginal : onContinuar}
          />
        {:else}
          <CartaActual
            cancionActual={cancionConPortada}
            {revelada}
            {cargandoAudio}
            {isPlaying}
            {resultado}
            indiceSeleccionado={sala?.indiceSeleccionado}
            {audioPlayer}
            nombreJugador={miNombre}
            esMultijugador={true}
            restantes={mazoRestante}
            saltosRestantes={miJugador?.saltos || 0}
            on:toggle={onToggle}
            on:validar={onValidar}
            on:continuar={onContinuar}
            on:saltar={onSaltar}
          />
        {/if}
      </div>
    {/if}

    {#if miJugador}
      <div class={esMiTurno ? "zona-coleccion" : "w-full"}>
        {#if viendoColeccionDe && jugadorViendo && viendoColeccionDe !== miNombre}
          <div class="mb-2 flex items-center justify-end">
            <button
              on:click={() => (viendoColeccionDe = "")}
              class="text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-300"
            >
              Ver mi colección
            </button>
          </div>
          <Coleccion
            linea={jugadorViendo.linea}
            cancionActual={null}
            revelada={false}
            indiceSeleccionado={null}
            resultado={null}
            nombreJugador={viendoColeccionDe}
            esMultijugador={true}
            compacto={!esMiTurno}
            viendoOtro={true}
            on:seleccionar={() => {}}
          />
        {:else}
          <Coleccion
            linea={miJugador.linea}
            cancionActual={esMiTurno ? cancionConPortada : null}
            revelada={esMiTurno ? revelada : false}
            indiceSeleccionado={esMiTurno ? sala?.indiceSeleccionado : null}
            resultado={esMiTurno ? resultado : null}
            nombreJugador={miNombre}
            esMultijugador={true}
            compacto={!esMiTurno}
            on:seleccionar={onSeleccionar}
          />
        {/if}
      </div>
    {/if}
  </div>

  {/if}
</div>

{#if faseAvanzada === "poder-selector"}
  <SelectorJugador
    {jugadores}
    jugadorActual={miNombre}
    titulo={poderEnUso === "intercambio"
      ? "🔀 ¿Con quién intercambiar?"
      : "🔥 ¿A quién aplicar modo difícil?"}
    on:seleccionar={onSeleccionarJugador}
    on:cancelar={onCancelarPoder}
  />
{/if}

{#if faseAvanzada === "poder-carta"}
  <SelectorCarta
    coleccionPropia={miJugador?.linea || []}
    coleccionObjetivo={jugadores.find((j) => j.nombre === jugadorObjetivo)
      ?.linea || []}
    nombreObjetivo={jugadorObjetivo}
    on:intercambiar={onIntercambiar}
    on:cancelar={onCancelarPoder}
  />
{/if}

{#if esAvanzado && sala?.faseAvanzada === "desafio" && sala?.desafianteNombre === miNombre}
  <PopupDesafio
    desafiante={miNombre}
    nombreJugadorActivo={jugadorActivo?.nombre || ''}
    cancion={cancionActual}
    lineaDesafiante={miJugador?.linea || []}
    on:responder={onDesafioRespuesta}
  />
{/if}

{#if alertaModoDificil}
  <NotificacionAlerta
    visible={true}
    titulo="MODO DIFÍCIL"
    duracion={0}
    on:cerrar={() => alertaModoDificil = false}
  >
    <span class="text-red-400 font-bold">{alertaModoDificilPor}</span> ha saboteado tu turno. Deberás acertar artista o canción además del año para sumar el punto.
  </NotificacionAlerta>
{/if}

<TutorialAvanzado
  visible={mostrarTutorial}
  mostrarNoVolver={!tutorialManual}
  on:cerrar={() => tutorialManual ? cerrarTutorialManual() : cerrarTutorial()}
/>

<TutorialOriginal
  visible={mostrarTutorialOriginal}
  mostrarNoVolver={!tutorialOriginalManual}
  on:cerrar={() => tutorialOriginalManual ? cerrarTutorialOriginalManual() : cerrarTutorialOriginal()}
/>

{#if esOriginal && sala?.faseOriginal === "hitster" && sala?.hitsterNombre === miNombre}
  <PopupDesafio
    desafiante={miNombre}
    nombreJugadorActivo={jugadorActivo?.nombre || ''}
    cancion={cancionActual}
    lineaDesafiante={jugadorActivo?.linea || []}
    esHitster={true}
    on:responder={onHitsterRespuestaPopup}
  />
{/if}

{#if sala?.notificacionCanje && sala.notificacionCanje !== miNombre}
  <div class="fixed bottom-4 right-4 z-[90] animate-in">
    <div class="bg-slate-900 border border-amber-500/40 px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/10">
      <p class="text-amber-400 font-bold text-sm">🔄 {sala.notificacionCanje} canjeó 3 fichas por una carta</p>
    </div>
  </div>
{/if}
