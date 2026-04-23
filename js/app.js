function loadView(name){
  fetch(`views/${name}.html`)
    .then(res => res.text())
    .then(html => {
      document.getElementById('app').innerHTML = html;
      if(window.initModule) window.initModule(name);
    });
}
