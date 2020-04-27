const uniqid = require("uniqid");

const PLAYER_COLOR = ["red","green","blue","orange","pink","magenta","white"];

let hraci = new Array(); //pole hracu
let hraciArrayIndex = new Array(); //pole indexu hracu v poli 'hraci' (pro )

exports.apiHraci = function (req, res, obj) {
    if (req.pathname.endsWith("/pripojit")) { //prida noveho hrace do hry
        obj.uid = uniqid(); //vygeneruje se unikatni id, podle ktereho se pak bude hrac identifikovat
        console.log("###" + obj.uid);
        let hrac = {}; //prazdny objekt
        hrac.jmeno = req.parameters.jmeno; //jmeno z parametru
        hrac.x = 100; //pozice x
        hrac.y = 100; //pozice y
        hrac.r = 10; //polomer
        hrac.c = PLAYER_COLOR[hraci.length % PLAYER_COLOR.length]; //barva hrace se automaticky strida
        hrac.baba = (hraci.length == 0);
        hrac.bCas = 0;
        hraciArrayIndex[obj.uid] = hraci.push(hrac) - 1; //push vraci pocet polozek po vlozeni, takze index nove polozky je o 1 mensi
    } else if (req.pathname.endsWith("/reset")) {
        hraci.length = 0;
        hraciArrayIndex.length = 0;
    }
}

/**
 * vraci hrace podle jeho unikatniho id
 * @param uid
 * @returns {any}
 */
exports.hrac = function (uid) {
    return hraci[hraciArrayIndex[uid]];
}

/**
 * vraci seznam vsech hracu
 * @returns {any[]}
 */
exports.hraci = function () {
    return hraci;
}

/**
 * vraci seznam uid vsech hracu
 * @returns {any[]}
 */
exports.uids = function () {
    return Object.keys(hraciArrayIndex);
}
