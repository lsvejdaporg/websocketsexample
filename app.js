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

let hraciWs = new Array(); //pole WS klientu hracu podle uid

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

//WebSockets, posun hracu,...
let baba = null; //hrac, ktery ma babu
let imunita = 0; //cas, do kdy plati imunita pro predani baby

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server: srv });
wss.on('connection', ws => {
    ws.on('message', message => { //prijem zprav
        // console.log(`Přijatá zpráva: ${message}`);
        let posunHrace = JSON.parse(message);
        hraciWs[posunHrace.uid] = ws;
        let hrac = najdiHrace(posunHrace.uid);
        if (posunHrace.up) hrac.y -= 2;
        if (posunHrace.down) hrac.y += 2;
        if (posunHrace.left) hrac.x -= 2;
        if (posunHrace.right) hrac.x += 2;
        //kontrola doteku s hranou
        if (hrac.x < hrac.r) { //levy okraj
            hrac.x = hrac.r;
        }
        if (hrac.x > 800-hrac.r) { //pravy okraj (800 je sirka platna - lepsi by byla konstanta nebo parametr hry)
            hrac.x = 800-hrac.r;
        }
        if (hrac.y < hrac.r) { //horni okraj
            hrac.y = hrac.r;
        }
        if (hrac.y > 600-hrac.r) { //dolni okraj (800 je vyska platna - lepsi by byla konstanta nebo parametr hry)
            hrac.y = 600-hrac.r;
        }
        //kontrola doteku s jinymi hraci
        let tm = new Date().getTime();
        if (tm > imunita) {
            for (let uid of uidVsechHracu()) { //projdu vsechny uid hracu
                if (uid === posunHrace.uid) continue; //pokud je to stejny hrac, kterym se posunulo, tak pokracuju na dalsiho hrace
                let h = najdiHrace(uid);
                let dx = hrac.x - h.x; //vodorovna vzdalenost stredu
                let dy = hrac.y - h.y; //svisla vzdalenost stredu
                let l = Math.sqrt(dx*dx + dy*dy); //prima vzdalenost stredu
                if (l <= hrac.r + h.r) {
                    if (hrac.baba || h.baba) { //pokud ma jeden z hracu babu, tak si ji vymeni
                        hrac.baba = !hrac.baba;
                        h.baba = !h.baba;
                        //nastavi se nove promenna baba
                        if (hrac.baba) {
                            baba = hrac;
                        } else {
                            baba = h;
                        }
                        imunita = tm + 2000; //a nastavi se cas, kdy babu neni mozne predat
                    }
                }
            }
        }
    });
});

let broadcasting = false;
function broadcast() {
    if (broadcasting) return; //pokud nedobehl predchozi brodcast
    broadcasting = true;
    let json = JSON.stringify(vsichniHraci());
    //odeslani zpravy vsem pripojenym klientum
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json);
        }
    });
    let cnt = 0;
    for (let uid of uidVsechHracu()) { //projdu vsechny uid hracu
        if (hraciWs[uid]) {
            hraciWs[uid].send("#test");
        }
        cnt++;
        if (cnt == 2) break; //posilam "#test" jen prvnim dvema - viz console v prohlizeci
    }
    broadcasting = false;
}
setInterval(broadcast, 10);

function babaTimer() {
    if (baba) { //pokud je nastavena promenna baba, zvysim cas
        baba.bCas++;
    } else { //pokud neni (coz je na zacatku hry), tak hrace s babou najdu a nastavim promennou baba
        for (let uid of uidVsechHracu()) { //projdu vsechny uid hracu
            let h = najdiHrace(uid);
            if (h.baba) {
                baba = h;
                break;
            }
        }
    }
}
setInterval(babaTimer, 1000);

