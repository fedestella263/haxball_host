var room = HBInit({
    roomName: "IOGAME.IO - BIG",
    maxPlayers: 12,
    noPlayer: true,
    public: false,
    token: "thr1.AAAAAF1fVDZP5pUZt52cDw.kq_0vQidYXs"
});

var leaders = ["🅒⓿🅝🅓⓿🅡"]

room.setDefaultStadium("Big");
room.setScoreLimit(3);
room.setTimeLimit(3);
room.setTeamsLock(true);

function isLeaderPlayer(player) {
    return leaders.includes(player.name);
}

function removeAdmins() {
    for(const player of room.getPlayerList().find((player) => !isLeaderPlayer(player)))
        room.setPlayerAdmin(player.id, false);
}

function updateAdmins() { 
    var players = room.getPlayerList();

    if(players.length == 0)
        return;

    if(players.find((player) => player.admin) != null) {
        player = players.find((player) => isLeaderPlayer(player));

        if(player != null) {
            removeAdmins();
            room.setPlayerAdmin(player.id, true);
            room.sendAnnouncement(`Bienvenido ${player.name} nuestro lider supremo!`)
        }
        
        return;
    }

    room.setPlayerAdmin(players[0].id, true);
}

room.onPlayerJoin = function(player) {
    room.sendAnnouncement(`Bienvenido ${player.name}!`)
    updateAdmins();
}

room.onPlayerLeave = function(player) {
    updateAdmins();
}

room.onTeamGoal = function(team_id) {
    if(team_id == 1)
        room.sendAnnouncement("Gggooooooooollll del equipo Rojo!!!");
    else if(team_id == 2)
        room.sendAnnouncement("Gggooooooooollll del equipo Azul!!!");
}

room.onTeamVictory = function(scores) {
    if(scores.red > scores.blue)
        room.sendAnnouncement(`Gana el equipo Rojo! Resultado: ${scores.red}-${scores.blue}`);
    else if(scores.red < scores.blue)
        room.sendAnnouncement(`Gana el equipo Azul! Resultado: ${scores.red}-${scores.blue}`);

    console.log(scores);
}

room.onRoomLink = function(url) {
    console.log(`Abriendo: ${url}`);
    window.open(url);
}

setInterval(function() {
    room.clearBans();
}, 1000*60*60);

console.clear();