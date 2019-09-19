var room = HBInit({
    roomName: "BIG 3v3",
    maxPlayers: 20,
    noPlayer: true,
    public: true,
    token: 'thr1.AAAAAF1ogB_hSBZSuZ4OzA.dt698FroZHM'
});

var inactive_players = [];
var last_players_activity = {}

const admins = [];
const seconds_to_remove_afk_admins = 60*10;
const time_to_clear_bans = 1000*60*60;
const admin_password = "nomelean";

room.setDefaultStadium("Big");
room.setScoreLimit(3);
room.setTimeLimit(3);
room.setTeamsLock(true);


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}  

function setDefaultColors() {
    room.setTeamColors(1, 0, 0, [0xE56E56]);
    room.setTeamColors(2, 0, 0, [0x5689E5]);
}

function setGoalTeamColor(team_id) {
    room.setTeamColors(team_id, 0, 0xFFFFFF, [0xFFFFFF]);
}

function isAdminLoggedIn(player_id) {
    return admins.includes(player_id);
}

function removeAdmins() {
    for(const player of room.getPlayerList()) {
        if(player.admin && !isAdminLoggedIn(player.id))
            room.setPlayerAdmin(player.id, false);
    }
}

function updateAdmins() { 
    var players = room.getPlayerList();

    if(players.length == 0)
        return;

    // Si ya hay un administrador que no esta inactivo sale.
    if(players.find((player) => player.admin && !inactive_players.includes(player.id)) != null)
        return;

    // Asigna el primer jugador que no este en la lista de ignorar.
    for(const player of room.getPlayerList()) {
        if(!inactive_players.includes(player.id)) {
            room.setPlayerAdmin(player.id, true);
            break;
        }
    }
}

room.onPlayerJoin = function(player) {
    room.onPlayerActivity(player);
    room.sendAnnouncement(`Bienvenido ${player.name}!`);
    updateAdmins();
}

room.onPlayerLeave = function(player) {
    delete last_players_activity[player.id];
    updateAdmins();
}

room.onTeamGoal = async function(team_id) {
    setGoalTeamColor(team_id);
    await sleep(500);
    setDefaultColors(team_id);
}

room.onTeamVictory = function(scores) {
    if(scores.red > scores.blue)
        room.sendAnnouncement(`Gana el equipo Rojo! Resultado: ${scores.red}-${scores.blue}`);
    else if(scores.red < scores.blue)
        room.sendAnnouncement(`Gana el equipo Azul! Resultado: ${scores.red}-${scores.blue}`);
}

room.onPlayerChat = function(player, message) {
    room.onPlayerActivity(player);

    // Manejo de comandos.
    if(message.startsWith("!")) {
        var result = message.match(/^\!(\w+?)(?:$|\s+(.*?)\s*$)/i);

        if(result != null) {
            var command = result[1];

            if(command == "login") {
                var password = result[2];

                if(password == admin_password)
                    room.setPlayerAdmin(player.id, true);
                else
                    room.sendAnnouncement("Contraseña incorrecta", player.id, null, "small-italic");
            } else if(command == "resetcolors") {
                setDefaultColors();
                room.sendAnnouncement("Colores reseteados", player.id, null, "small-italic");
            }
        } else {
            room.sendAnnouncement("Comando desconocido", player.id, null, "small-italic");
        }        

        return false;
    }
}

room.onPlayerActivity = function(player) {
    last_players_activity[player.id] = Date.now();
    inactive_players = inactive_players.filter((id) => player.id == id);
}

room.onRoomLink = function(url) {
    console.log(`Abriendo: ${url}`);
    window.open(url);
}

room.onPlayerKicked = function(player, reason, ban, by_player) {
    // Baneo a un administrador logeado.
    if(isAdminLoggedIn(player.id) && by_player != null) {
        room.clearBan(player.id);
        room.kickPlayer(by_player.id, 'Pelotudo no podes banear a un administrador logueado', true);        
    }
}

// Borra los bans cada una hora.
setInterval(function() {
    console.log('Eliminando Bans');
    room.clearBans();
}, time_to_clear_bans);

// Quita el admin a los administradores inactivos mas de 10 minutos.
setInterval(function() {
    current_time = Date.now();
    for(const player of room.getPlayerList()) {
        var diff = (current_time-last_players_activity[player.id])/1000;

        if(!player.admin || isAdminLoggedIn(player.id))
            continue;
        
        if(diff > seconds_to_remove_afk_admins) {
            room.setPlayerAdmin(player.id, false);
            inactive_players.push(player.id);
            room.sendAnnouncement(`${player.name} se te removio el admin por pasar mucho tiempo afk`);
            updateAdmins();
        }
    }
}, 1000*1);

console.clear();