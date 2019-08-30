var room = HBInit({
    roomName: "BIG 3v3",
    maxPlayers: 20,
    noPlayer: true,
    public: true,
    token: 'thr1.AAAAAF1ogB_hSBZSuZ4OzA.dt698FroZHM'
});

var ignore_players = [];
var last_players_activity = {}

const leaders = ["🅒⓿🅝🅓⓿🅡"];
const seconds_to_remove_afk_admins = 60*10;
const time_to_clear_bans = 1000*60*60;

room.setDefaultStadium("Big");
room.setScoreLimit(3);
room.setTimeLimit(3);
room.setTeamsLock(true);

function isLeaderPlayer(player) {
    return leaders.includes(player.name);
}

function removeAdmins() {
    for(const player of room.getPlayerList()) {
        if(player.admin && !isLeaderPlayer(player))
            room.setPlayerAdmin(player.id, false);
    }
}

function updateAdmins() { 
    var players = room.getPlayerList();

    console.log(players)

    if(players.length == 0)
        return;
    
    // Esta el leader y no es administrador.
    var leader_player = players.find((player) => isLeaderPlayer(player) && !player.admin && !ignore_players.includes(player.id));
    if(leader_player != null) {
        removeAdmins();
        room.setPlayerAdmin(leader_player.id, true);
        return;
    }

    // Si ya hay un administrador que no esta ignorado sale.
    if(players.find((player) => player.admin && !ignore_players.includes(player.id)) != null)
        return;

    // Asigna el primer jugador que no este en la lista de ignorar.
    for(const player of room.getPlayerList()) {
        if(!ignore_players.includes(player.id)) {
            room.setPlayerAdmin(player.id, true);
            break;
        }
    }
}

room.onPlayerJoin = function(player) {
    room.onPlayerActivity(player);

    if(isLeaderPlayer(player))
        room.sendAnnouncement(`Bienvenido ${player.name} nuestro lider supremo!`);
    else
        room.sendAnnouncement(`Bienvenido ${player.name}!`);

    updateAdmins();
}

room.onPlayerLeave = function(player) {
    delete last_players_activity[player.id];
    updateAdmins();
}

room.onTeamGoal = function(team_id) {}

room.onTeamVictory = function(scores) {
    if(scores.red > scores.blue)
        room.sendAnnouncement(`Gana el equipo Rojo! Resultado: ${scores.red}-${scores.blue}`);
    else if(scores.red < scores.blue)
        room.sendAnnouncement(`Gana el equipo Azul! Resultado: ${scores.red}-${scores.blue}`);
}


room.onPlayerChat = function(player) {
    room.onPlayerActivity(player);
}

room.onPlayerActivity = function(player) {
    last_players_activity[player.id] = Date.now();
    ignore_players = ignore_players.filter((id) => player.id == id);
}

room.onRoomLink = function(url) {
    console.log(`Abriendo: ${url}`);
    window.open(url);
}

room.onPlayerKicked = function(player, reason, ban, by_player) {
    // Baneo a un lider.
    if(isLeaderPlayer(player) && by_player != null) {
        room.clearBan(player.id);
        room.kickPlayer(by_player.id, 'Pelotudo no podes banear al dueño del host', true);        
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

        if(!player.admin)
            continue;
        
        if(diff > seconds_to_remove_afk_admins) {
            room.setPlayerAdmin(player.id, false);
            ignore_players.push(player.id);
            room.sendAnnouncement(`${player.name} se te removio el admin por pasar mucho tiempo afk`);
            updateAdmins();
        }
    }
}, 1000*1);

console.clear();