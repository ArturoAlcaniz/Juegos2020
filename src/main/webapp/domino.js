var url = "ws://localhost:8600/juegos";
var ws = new WebSocket(url);

function getFichaSelected(){
    var e = document.getElementById("fichas").value;
    var fichaN1 = e.substring(0, 1)
    var fichaN2 = e.substring(4, 5)
    return [fichaN1, fichaN2]
}

function deleteFichaPuesta(ficha){
    var ops = document.getElementById("fichas");
    for(var i = 0; i < ops.length; i++){
        if(ops.options[i].value == ficha){
            ops.remove(i);
        }
    }
}

function ViewModel() {
    var self = this;
    self.usuarios = {};
    var idMatch = sessionStorage.idMatch;
    var started = JSON.parse(sessionStorage.started);
    self.mensaje = ko.observable("Esperando oponente para la partida " + idMatch);
    self.tablero = ko.observableArray([ko.observableArray([])]);
    self.fichas = ko.observableArray([]);
    self.contAfter = 35; // Centro
    self.contBefore = 35;
  
    
    var finished = false;

    buildTablero();

    self.doPlay = function(posicion, $data, event){

        var fichaN1 = getFichaSelected()[0]
        var fichaN2 = getFichaSelected()[1]


        if(fichaN1 === "" || fichaN2 === ""){
            alert("Accion no permitida "+fichaN1 + " " + fichaN2)
        }else{
            var msg = {
                type: "doPlayDO",
                idMatch: sessionStorage.idMatch,
                posicion: posicion, // true -> izquierda, false -> derecha
                number_1: fichaN1,
                number_2: fichaN2
            };
            if(!finished){
                ws.send(JSON.stringify(msg));
            }
        }
    }


    function buildTablero() {
        var n1 = 5;
        var n2 = 11;

        for(var i = 0; i<n1; i++){

            var row =  ko.observableArray([]);

            for(var j = 0; j<n2; j++){
                row.push("");
            }

            self.tablero.push(row);
        }
    }

    ws.onopen = function (event) {
        var msg = {
            type: "ready",
            idMatch: sessionStorage.idMatch
        };
        ws.send(JSON.stringify(msg));
    };

    ws.onmessage = function (event) {
        var data = event.data;
        data = JSON.parse(data);

        if (data.type == "matchStarted") {

            self.mensaje("La partida ha empezado");
            var fichas = data.startData.data;
            for (var i = 0; i < fichas.length; i++)
                self.fichas.push(fichas[i]);
        }

        if(data.type == "matchChangeTurn") {
            self.mensaje("Turno de " + data.turn);
        }

        if(data.type == "matchIlegalPlay"){
            alert(data.result);
        }

        if(data.type == "matchFinished"){
            self.mensaje(data.result);
            finished = true;
        }

        if(data.type == "matchPlay"){

            if (data.posicion) {
                var posicionString = self.contBefore.toString()
                var fila = posicionString.substring(0, 1)
                self.contBefore++
            }else{
                var posicionString = self.contAfter.toString()
                var fila = posicionString.substring(0, 1)
                self.contAfter++
            }

            if (!(parseInt(fila)%2)) {
                var aux = data.fichaN1
                data.fichaN1 = data.fichaN2
                data.fichaN2 = aux
            }
            document.getElementById("box" + posicionString).innerHTML = data.fichaN1 + ' | ' + data.fichaN2
            deleteFichaPuesta(document.getElementById("box" + posicionString).innerHTML)
        }
    }
}

var vm = new ViewModel();
ko.applyBindings(vm);