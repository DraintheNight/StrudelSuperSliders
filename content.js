const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
  this.remove(); // Aufräumen, nachdem das Skript geladen wurde
};
(document.head || document.documentElement).appendChild(script);