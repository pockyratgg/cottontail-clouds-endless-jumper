import Phaser from '../lib/phaser.js'

export default class GameOver extends Phaser.Scene
{
    constructor() 
    {
        super('game-over')
    }
    create() 
    {
        const width = this.scale.width
        const height = this.scale.height
        
        //adding in sprinkle background from game
        this.add.image(240, 320, 'background')

        this.add.text(width * 0.5, height * 0.5, 'Game Over', {
            fontSize: 48
        })
        .setOrigin(0.5)

        this.add.text(width * 0.5, height * 0.6, 'Press Space to Play Again!', {
            fontSize: 30
        })
        .setOrigin(0.5)

        //adding in space for the play again screen
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('game')
        })

    } //end of create
}


