const createSpaServer = require("spaserver").createSpaServer;
const apiDenVTydnu = require('./api-denvtydnu').apiDenVTydnu;
const apiCas = require('./api-cas').apiCas;
const apiHraci = require('./api-hraci').apiHraci;

const najdiHrace = require('./api-hraci').hrac;
const vsichniHraci = require('./api-hraci').hraci;
const uidVsechHracu = require('./api-hraci').uids;

const PORT = 8080; //aplikace na Rosti.cz musi bezet na portu 8080
const API_HEAD = {
    "Content-type": "application/json"
};
const API_STATUS_OK = 0;
const API_STATUS_NOT_FOUND = -1;

function processApi(req, res) {
    console.log(req.pathname);
    res.writeHead(200, API_HEAD);
    let obj = {};
    obj.status = API_STATUS_OK;

    if (req.pathname === "/denvtydnu") {
        apiDenVTydnu(req, res, obj);
    } else if (req.pathname === "/cas") {
        apiCas(req, res, obj);
    } else if (req.pathname.startsWith("/hraci")) {
        apiHraci(req, res, obj);
    } else {
        obj.status = API_STATUS_NOT_FOUND;
        obj.error = "API not found";
    }
    res.end(JSON.stringify(obj));
}

let srv = createSpaServer(PORT, processApi);

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server: srv });
wss.on('connection', ws => {
    ws.on('message', message => { //prijem zprav
        console.log(`Přijatá zpráva: ${message}`);
        let posunHrace = JSON.parse(message);
        let hrac = najdiHrace(posunHrace.uid);
        if (posunHrace.up) hrac.y -= 2;
        if (posunHrace.down) hrac.y += 2;
        if (posunHrace.left) hrac.x -= 2;
        if (posunHrace.right) hrac.x += 2;
        //kontrola doteku s hranou
        //TODO levy okraj, pravy okraj, horni okraj, dolni okraj
        //kontrola doteku s jinymi hraci
        for (let uid of uidVsechHracu()) { //projdu vsechny uid hracu
            if (uid === posunHrace.uid) continue; //pokud je to stejny hrac, kterym se posunulo, tak pokracuju na dalsiho hrace
            let h = najdiHrace(uid);
            //TODO kdyz vzdalenost stredu hracu je mensi nez soucet jejich polomeru, tak doslo k doteku
        }
    });
});
function broadcast() {
    let json = JSON.stringify(vsichniHraci());
    //odeslani zpravy vsem pripojenym klientum
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json);
        }
    });
}
setInterval(broadcast, 10);

