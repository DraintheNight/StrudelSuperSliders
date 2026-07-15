let isMixerMode = false;
let lastSliderUpdate = 0;
const ThrottleMS = 30;
let activeSliderIndex = null;
console.log("SSS Loaded!");
//Slider im Array sammeln:
/** @returns {HTMLInputElement[]} */
function getSliders(){
    return Array.from(document.querySelectorAll('input[type="range"]'));
}
function isEditable(el){
    if(el.isContentEditable) return true;
    if(el.tagName === 'TEXTAREA') return true;
    if(el.tagName === 'INPUT'){
    const textTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];
        return textTypes.includes(el.type);
    }

}
function pasteContent(event){
if(event.altKey){
    const key = event.key;
    const selection = window.getSelection();

    switch(key) {

    case 'l':
    case 'L':
        if (selection && selection.rangeCount > 0) {
          selection.collapseToEnd(); 
        }
        event.preventDefault();
        event.stopPropagation();
        document.execCommand('insertText', false, ".lpf(slider(5000, 50, 5000, 25)).lpq(2.5)");
        
        
        break;
    case 'h':
    case 'H':
    case 'g':
    case 'G':
        if (selection && selection.rangeCount > 0) {
          selection.collapseToEnd(); 
        }
        event.preventDefault();
        event.stopPropagation();
        document.execCommand('insertText', false, ".postgain(slider(1, 0, 1, 0.0git     8))");
        break;
     default:
        break; 
      
  }
  return;
}
  
}
function getDeepActiveElement(root = document) {
  let activeEl = root.activeElement;
  while (activeEl && activeEl.shadowRoot && activeEl.shadowRoot.activeElement) {
    activeEl = activeEl.shadowRoot.activeElement;
  }
  return activeEl;
}
//Slider selecten:
function selectSliders(index){
    const sliders = getSliders();
    console.log("Out of Bounds", index, sliders.length);
    if(index >= sliders.length)
        return;
    sliders.forEach(s => {
        s.style.outline = "none";
        s.style.boxShadow = "none";
    });
    activeSliderIndex = index; 
    const targetSlider = sliders[index];
    targetSlider.style.boxShadow = "0 0 12px #ccc929";
    targetSlider.style.outline = "3px solid #a0c9b0";
    targetSlider.focus();
    console.log("ActiveSlider =", activeSliderIndex);
}
function muteSlider(){
    if(activeSliderIndex === null)
        return; 
     const now = Date.now();
        if(now - lastSliderUpdate < ThrottleMS)
                return;
    lastSliderUpdate = now;
    const sliders = getSliders();
    const slider = sliders[activeSliderIndex];
    if(!slider)
        return;
    const min = Number(slider.min) || 0;
    slider.value = min;
     slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));

}
function maxSlider(){
    if(activeSliderIndex === null)
        return; 
     const now = Date.now();
        if(now - lastSliderUpdate < ThrottleMS)
                return;
    lastSliderUpdate = now;
    const sliders = getSliders();
    const slider = sliders[activeSliderIndex];
    if(!slider)
        return;
    const max = Number(slider.max) || 0;
    slider.value = max;
     slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));

}
function updateSliderBadges() {
  const sliders = getSliders();

  sliders.forEach((slider, index) => {
    // 1. DUPLIKAT-SCHUTZ (Idempotenz-Check):
    // Wir prüfen, ob direkt VOR dem Slider schon ein Badge von uns sitzt!
    let badge = slider.previousElementSibling;

    // Wenn davor kein Element sitzt ODER das Element nicht unsere Klasse hat,
    // müssen wir ein neues Kästchen erstellen:
    if (!badge || !badge.classList.contains('slider-hotkey-badge')) {
      badge = document.createElement('span');
      badge.className = 'slider-hotkey-badge';
      
      // 2. DAS STYLING (Neongrüner Retro-Controller-Look):
      badge.style.cssText = `
        display: inline-block;
        background-color: #111;
        color: #ffffff;
        border: 1px solid #00FF66;
        border-radius: 4px;
        padding: 1px 5px;
        margin-right: 6px;
        font-size: 11px;
        font-weight: bold;
        font-family: monospace;
        vertical-align: middle;
        box-shadow: 0 0 4px rgba(0, 255, 102, 0.4);
        /* ABSOLUT KRITISCH: Klicke gehen durch die Box hindurch! */
        pointer-events: none; 
      `;

      // 3. DER DOM-INJEKTIONS-TRICK:
      // Schiebt unser Kästchen im HTML-Baum exakt VOR das Slider-Element!
      // (Alternativ: slider.after(badge) schiebt es dahinter)
      slider.before(badge);
    }

    // 4. DEN TEXT AKTUALISIEREN:
    // Da deine Hotkeys bei Taste '1' beginnen, rechnen wir index + 1
    badge.innerText = `[${index + 1}]`;
  });
}
function disableSliderBadges() {
    // 1. Alle Elemente mit unserer Badge-Klasse im gesamten Dokument suchen
    const badges = document.querySelectorAll('.slider-hotkey-badge');
    
    // 2. Jedes gefundene Element direkt aus dem DOM-Baum löschen
    badges.forEach(badge => badge.remove());
}


function changeSlider(direction){
    if(activeSliderIndex === null)
         return;
    
    const now = Date.now();
        if(now - lastSliderUpdate < ThrottleMS)
                return;
    lastSliderUpdate = now;
    const sliders = getSliders();
    const slider = sliders[activeSliderIndex];
    if(!slider)
        return;
    const step = Number(slider.step) || 1;
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;


    let currentVal = Number(slider.value);
    let newVal = currentVal + (step * direction);
    newVal = Math.max(min, Math.min(max, newVal));

    if(newVal === currentVal)
        return;
    slider.value = newVal;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
}

window.addEventListener('keydown', (event)=> {
    console.log("Taste: ", event.key, "code", event.code);
      // Hotkey = M (oder m)
      const isToggleHotkey = event.altKey && (event.key === 'm' || event.key === 'M' || event.code === 'KeyM');
      const isRangeSlider = event.target.tagName === 'INPUT' && event.target.type === 'range';
      const ActiveElement = getDeepActiveElement();
      
 

 if (isToggleHotkey) {
        ActiveElement.blur();
        event.preventDefault(); // Blockiert das Einfügen von Sonderzeichen (wie "µ") im Editor!
        isMixerMode = !isMixerMode;
     
        console.log("Mixer active?:", isMixerMode);
        
        // Badges ein- oder ausblenden:
        if (isMixerMode) {
            updateSliderBadges();
        } else {
            disableSliderBadges();
            
            // Optional: Fokus vom Slider nehmen, wenn wir den Modus beenden
            if (activeSliderIndex !== null) {
                const sliders = getSliders();
                if (sliders[activeSliderIndex]) {
                    sliders[activeSliderIndex].style.outline = "none";
                    sliders[activeSliderIndex].style.boxShadow = "none";
                }
                activeSliderIndex = null;
            }
        }
        return;
    }

    if(isEditable(ActiveElement)){
    pasteContent(event);
   
    return;
 }   

    if(!isMixerMode){
        return;
    }
    if(event.key >= '1' && event.key <= '9'){
        event.preventDefault();
        const index = Number(event.key)-1;
        selectSliders(index);
        return;
    }

    if(event.key === 'ArrowUp' || event.key === 'ArrowRight'){
        event.preventDefault();
        changeSlider(1);
        return;
    }
    if(event.key === 'ArrowDown' || event.key === 'ArrowLeft'){
        event.preventDefault();
        changeSlider(-1);
        return;
    }
     if(event.key === 'M' || event.key === 'm'){
        event.preventDefault();
        muteSlider();
        return;
    }
     if(event.key === 'N' || event.key === 'n'){
        event.preventDefault();
        maxSlider();
        return;
    }
});
