const createSpaServer = require("spaserver").createSpaServer;
const apiDenVTydnu = require('./api-denvtydnu').apiDenVTydnu;
const apiCas = require('./api-cas').apiCas;

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
    });
});
let counter = 0;
function broadcast() {
    counter++;
    //odeslani zpravy vsem pripojenym klientum
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(counter);
        }
    });
}
setInterval(broadcast, 1000);

