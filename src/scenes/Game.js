import Phaser from '../lib/phaser.js'

//importing the Carrot class (from other .js doc called carrot.js)
import Carrot from '../game/carrot.js'
import GameOver from './GameOver.js'

export default class Game extends Phaser.Scene
{
    carrotsCollected = 0
    
    /**@param {Phaser.GameObjects.Sprite} sprite */

    /** {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    constructor()
    {
        super('game')
    }

    //resets the carrots value to zero after gameover 
    init()
    {
        this.carrotsCollected = 0
    }

    preload()
    {
        //preloading background image for game but not calling yet
        this.load.image('background', 'assets/sprinkle_sky.jpg')
        
        //loading the platform image
        this.load.image('platform', 'assets/ground_cake.png')

        //loading bunny player
        this.load.image('bunny-stand', 'assets/bunny2_stand.png')

        //loading carrot sprite
        this.load.image('carrot', 'assets/carrotcake.png')

        //loading bunny jump sprite
        this.load.image('bunny-jump', 'assets/bunny2_jump.png')

        //adding in keyboard input here. this can be addded into preload or create its a matter of style or specific implementation requirements. style choice here.
        this.cursors = this.input.keyboard.createCursorKeys()

        //preloading jump sound
        this.load.audio('jump', 'assets/sfx/phaseJump1.ogg')

        //preloading game over sound
        this.load.audio('gameover', 'assets/sfx/highDown.ogg')

        //preloading carrot crunch sound
        this.load.audio('carrotcrunch', 'assets/sfx/carrotcrunch.wav')


    } //end of preload
    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    create()
    {
        //calling the background image in create
        this.add.image(240, 320, 'background')
            .setScrollFactor(1,0) //keeps the background from scrolling away from view

        //create the platform group
        this.platforms = this.physics.add.staticGroup()

        //creating the bunny player with physics
        this.player = this.physics.add.sprite(240, 320, 'bunny-stand')
        .setScale(0.5)

        //adding collision to bunny and platforms
        this.physics.add.collider(this.platforms, this.player)

        //for loop to create 5 platforms
        for (let i = 0; i < 5; ++i)
        {
            const x = Phaser.Math.Between(80, 400)
            const y = 150 * i
            /** {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform')
            platform.scale = 0.5
            
            /** {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()
        }

        //removing collision for moving upwards for the bunny so he doesn't hit his head on the platforms

        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        //having the camera follow the bunny as he jumps on more platforms
        this.cameras.main.startFollow(this.player)

        //adding in a camera dead zone
        this.cameras.main.startFollow(this.player)

        //setting the horizontal dead zone to 1.5x the game width
        this.cameras.main.setDeadzone(this.scale.width * 1.5)

        //creating the carrot here
        this.carrots = this.physics.add.group({
            classType: Carrot
        })

        this.physics.add.collider(this.platforms, this.carrots)

        //adding logic to carrots
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot, //called on overlap
            undefined,
            this
        )

        //creating carrot counter text
        const style = { color: '#000', fontSize: 24 }
        this.carrotsCollectedText = this.add.text(240, 10, 'Carrot Cakes Collected: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0)

    } //end of create

            //handling game over when the player jumps off and falls infinitely, adding detection in
            findBottomMostPlatform() 
            {
                const platforms = this.platforms.getChildren()
                let bottomPlatform = platforms[0]
    
                for (let i = 1; i < platforms.length; ++i)
                {
                    const platform = platforms[i]
    
                    //discard any platforms that are above the current
                    if (platform.y < bottomPlatform.y)
                    {
                        continue
                    }
    
                    bottomPlatform = platform
                }
    
                return bottomPlatform
    
            } //end of bottom mostplatform method

    update()
    {
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child

            const scrollY = this.cameras.main.scrollY
            if (platform.y >= scrollY + 700)
            {
                platform.y = scrollY - Phaser.Math.Between(50, 100)
                platform.body.updateFromGameObject()

                //creates a carrot above the platform being used again
                this.addCarrotAbove(platform)
            }
        })
        const touchingDown = this.player.body.touching.down

        if (touchingDown)
        {
            this.player.setVelocityY(-300)

            //switching to jump texture
            this.player.setTexture('bunny-jump')

            //play jump sound
            this.sound.play('jump')
        }

        //making the bunny go back into position after a jump so it doesn't look like silly flying splits
        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny-stand')
        {
            //switch back to jump when falling
            this.player.setTexture('bunny-stand')
        }

        //adding in the actual keyboard movements
        if (this.cursors.left.isDown && !touchingDown)
        {
            this.player.setVelocityX(-200)
        }
        else if (this.cursors.right.isDown && !touchingDown)
        {
            this.player.setVelocityX(200)
        }
        else
        {
            //stop movement if not left or right
            this.player.setVelocityX(0)
        }
        //actually calling the horizontalWrap method on the sprite even though its defined below
        this.horizontalWrap(this.player)

        //game over logic for platforms
        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200)
        {
            //console.log('game over')
            this.scene.start('game-over')

            //playing gameover sound here?
            this.sound.play('gameover')
        }

    } //end of update

    /** @param {Phaser.GameObjects.Sprite} sprite */
    //adding in a horizontal wrap so player doesn't go off screen. they will wrap to the other side when moving left or right
    horizontalWrap(sprite)
    {
        const halfWidth = sprite.displayWidth * 0.5
        const gameWidth = this.scale.width
        if (sprite.x < -halfWidth)
        {
            sprite.x = gameWidth + halfWidth
        }
        else if (sprite.x > gameWidth + halfWidth)
        {
            sprite.x = -halfWidth
        }
    }

    addCarrotAbove(sprite)
    {
        const y = sprite.y - sprite.displayHeight

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        //set active and visible
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        //update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        //making sure body is enabled in the physics world
        this.physics.world.enable(carrot)

        return carrot
    }
    /** @param {Phaser,Physics.Arcade.Sprite} player */
    /** @param {Carrot} carrot */

    handleCollectCarrot(player, carrot)
    {
        //hide from display
        this.carrots.killAndHide(carrot)

        //disable from physics world
        this.physics.world.disableBody(carrot.body)

        //adding carrotcrunch sound here
        this.sound.play('carrotcrunch')

        this.carrotsCollected++

        //using string interpolation to update carrots as the player collects them
        const value = `Carrot Cakes Collected: ${this.carrotsCollected}` 
        this.carrotsCollectedText.text = value
    }


} //end of extension of Phaser.Scene