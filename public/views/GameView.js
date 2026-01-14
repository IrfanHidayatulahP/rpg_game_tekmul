class GameView {
    renderPlayer(player) {
        fill(0, 200, 255);
        ellipse(player.body.position.x, player.body.position.y, 40);
    }
}
