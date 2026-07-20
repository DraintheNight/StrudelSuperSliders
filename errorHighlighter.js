console.log("errorHighlighter Loaded!");

const STRICT_ERROR_REGEX = /Error:.*\((\d+):(\d+)\)/;
let lastHandledErrorText = "";

/**
 * Holt die interne CodeMirror 6 EditorView Instanz aus dem Strudel-DOM
 */
function getStrudelEditorView() {
    const contentEl = document.querySelector('.cm-content');
    const editorEl = document.querySelector('.cm-editor');

    if (contentEl && contentEl.cmView) return contentEl.cmView.view || contentEl.cmView;
    if (editorEl && editorEl.cmView) return editorEl.cmView.view || editorEl.cmView;

    let current = contentEl || editorEl;
    while (current) {
        if (current.cmView) return current.cmView.view || current.cmView;
        current = current.parentElement;
    }
    return null;
}

/**
 * Zeichnet eine rote Wellenlinie unter das fehlerhafte Zeichen.
 */
function drawErrorUnderline(view, targetPos) {
    const oldLine = document.getElementById('strudel-syntax-error-line');
    if (oldLine) oldLine.remove();

    const startCoords = view.coordsAtPos(targetPos);
    const endCoords = view.coordsAtPos(Math.min(targetPos + 1, view.state.doc.length)) || startCoords;

    if (!startCoords) {
        console.warn("[StrudelSuperSliders] Abbruch: Konnte Pixel-Koordinaten für die Wellenlinie nicht berechnen.");
        return;
    }

    const width = endCoords ? Math.max(endCoords.right - startCoords.left, 10) : 10;

    const underline = document.createElement('div');
    underline.id = 'strudel-syntax-error-line';
    
    // Exakte Positionierung im IDE-Look
    underline.style.cssText = `
        position: fixed;
        left: ${startCoords.left}px;
        top: ${startCoords.bottom - 3}px;
        width: ${width}px;
        height: 4px;
        border-bottom: 2.5px wavy #ff0044;
        pointer-events: none;
        z-index: 9999999;
        filter: drop-shadow(0 0 3px rgba(255, 0, 68, 0.8));
    `;

    document.body.appendChild(underline);
    console.log("[StrudelSuperSliders] Rote Wellenlinie erfolgreich gezeichnet!");

    // Lösch-Sensor: Entfernt die Linie nur beim Tippen oder Kicken (NICHT beim Scrollen!)
    const removeUnderline = () => {
        const lineEl = document.getElementById('strudel-syntax-error-line');
        if (lineEl) lineEl.remove();
    };

    view.dom.addEventListener('input', removeUnderline, { once: true });
    view.dom.addEventListener('mousedown', removeUnderline, { once: true });
}

/**
 * Parst eine Fehlermeldung, springt dorthin und bindet die rote Linie an das Zeichen
 */
function highlightErrorInEditor(errorText) {
    const view = getStrudelEditorView();
    if (!view) {
        console.warn("[StrudelSuperSliders] EditorView nicht gefunden!");
        return;
    }

    const match = errorText.match(STRICT_ERROR_REGEX);
    if (!match) return; 

    const lineNum = parseInt(match[1], 10);
    const colNum = parseInt(match[2], 10);

    try {
        const doc = view.state.doc;
        if (lineNum > doc.lines) return;

        const line = doc.line(lineNum);
        const targetPos = Math.min(line.from + Math.max(0, colNum - 1), line.to);

        // 1. Im Editor zur Stelle springen und auswählen
        view.dispatch({
            selection: { 
                anchor: targetPos, 
                head: Math.min(targetPos + 1, line.to)
            },
            scrollIntoView: true
        });
        
        view.focus();
        console.log(`[StrudelSuperSliders] Sprung ausgeführt zu Zeile ${lineNum}, Zeichen ${colNum}`);
        
        // 2. WICHTIG: 150ms warten, damit das Scrollen von scrollIntoView zu 100% beendet ist!
        setTimeout(() => {
            drawErrorUnderline(view, targetPos);
        }, 150);
        
    } catch (e) {
        console.error("Fehler beim Highlighting im Editor:", e);
    }
}

/**
 * Der neue, zuverlässige Scanner: Prüft bei JEDER Änderung auf der Webseite,
 * ob aktuell eine Error-Box da ist und ob es ein neuer Fehler ist!
 */
const checkForStrudelErrors = () => {
    const errorBox = document.querySelector('.text-background.bg-foreground');
    
    if (!errorBox || !errorBox.textContent) {
        // Wenn keine Error-Box da ist (z.B. weil der Code jetzt fehlerfrei lief),
        // resetten wir unseren Speicher, damit der nächste Fehler wieder erkannt wird!
        if (lastHandledErrorText !== "") {
            lastHandledErrorText = "";
            const oldLine = document.getElementById('strudel-syntax-error-line');
            if (oldLine) oldLine.remove();
        }
        return;
    }

    const currentText = errorBox.textContent.trim();

    // Prüfen, ob es ein NEUER Fehler ist, den wir nicht gerade schon verarbeitet haben
    if (currentText !== lastHandledErrorText && currentText.includes("Error:") && STRICT_ERROR_REGEX.test(currentText)) {
        lastHandledErrorText = currentText;
        console.log("[StrudelSuperSliders] Syntax-Fehler erkannt:", currentText);
        highlightErrorInEditor(currentText);
    }
};

const errorObserver = new MutationObserver(() => {
    checkForStrudelErrors();
});

// Überwachung starten
errorObserver.observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true 
});