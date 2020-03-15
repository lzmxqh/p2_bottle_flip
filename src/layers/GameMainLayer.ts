namespace bottle {
    export class GameMainLayer extends eui.UILayer {
        private static readonly WORLD_GRAVITY_X: number = 0;           // p2物理世界横向重力
        private static readonly WORLD_GRAVITY_Y: number = 3000;        // p2物理世界垂直重力

        private mapLayer: MapLayer = new MapLayer();
        private player: Player;

        private debugDraw: p2DebugDraw;
        private world: p2.World;
        private materialOptions: p2.ContactMaterialOptions;

        private curTime: number;
        private gameOverTimeKey: number;            // 游戏结束计时器标识
        private disableBodys: Array<p2.Body> = [];    // 记录禁用碰撞的刚体

        public constructor() {
            super();
            this.top = 0;
            this.bottom = 0;
            this.left = 0;
            this.right = 0;
            this.once(egret.Event.ADDED_TO_STAGE, this.init, this);
        }

        public onDestroy(): void {
            if (this.player) {
                this.player.onDestroy();
            }

            egret.clearTimeout(this.gameOverTimeKey);
            this.removeEventListener(egret.Event.ENTER_FRAME, this.loop, this);
            this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
        }

        private init(): void {
            this.createWorld();

            this.addChild(this.mapLayer);
            this.once(egret.Event.ENTER_FRAME, () => {
                this.mapLayer.init(this.world);

                this.createPlayer();
                this.createDebug();

                // this.mapLayer.addContactMaterial(this.materialOptions, this.player);

                console.log("Game Start");
                this.curTime = this.getCTime();

                this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
                this.addEventListener(egret.Event.ENTER_FRAME, this.loop, this);
            }, this);
        }

        /**获取当前时间 */
        private getCTime(): number {
            return new Date().getTime();
        }

        private createWorld(): void {
            let world: p2.World = new p2.World();
            world.sleepMode = p2.World.BODY_SLEEPING;
            world.gravity = [GameMainLayer.WORLD_GRAVITY_X, GameMainLayer.WORLD_GRAVITY_Y];

            // let defaultMaterial: p2.ContactMaterial = world.defaultContactMaterial;
            // this.materialOptions = {
            //     friction: 1,
            //     restitution: 1,
            //     stiffness: 1,
            //     relaxation: defaultMaterial.relaxation,
            //     frictionStiffness: defaultMaterial.frictionStuffness,
            //     frictionRelaxation: defaultMaterial.frictionRelaxation,
            //     surfaceVelocity: defaultMaterial.surfaceVelocity
            // };
            this.world = world;
        }

        /**创建玩家 */
        private createPlayer(): void {
            let initPos: { x: number, y: number } = this.mapLayer.getPlayerInitPos();
            let gameData: GameData = BottleConfigData.GAME_DATA;

            let player: Player = new Player();
            player.init(this.world, this, gameData.playerId, "bottle_png", initPos.x, initPos.y);
            player.setBeforeBodyId(gameData.firstBoardId);

            this.player = player;
        }

        /**创建debug调试 */
        private createDebug(): void {
            //创建调试视图
            this.debugDraw = new p2DebugDraw(this.world);
            let sprite: egret.Sprite = new egret.Sprite();
            this.addChild(sprite);
            this.debugDraw.setSprite(sprite);
        }

        /**游戏循环 */
        private loop(): void {
            let curTime: number = this.getCTime();
            let dt: number = curTime - this.curTime;
            this.curTime = curTime;

            this.world.step(dt / 1000);
            P2BodyUtil.syncDisplay(this.player);
            this.player.calculatePlayerFlip(dt);

            this.mapLayer.followPlayer(this.player);

            P2BodyUtil.syncP2Body(this.player);
            this.mapLayer.syncP2Bodys();

            let isGameOver: boolean = this.checkGameOver();
            this.debugDraw.drawDebug();

            if (!isGameOver) {
                return;
            }
            this.handleGameOver();
        }

        /**检测游戏是否结束 */
        private checkGameOver(): boolean {
            let gameData: GameData = BottleConfigData.GAME_DATA

            let collision: p2.Body = P2BodyUtil.checkCollision(this.world, this.player);
            if (collision && collision.id == gameData.groundId) {
                return true;
            }
            this.player.onCollision(collision);

            return false;
        }

        /**处理游戏结束 */
        private handleGameOver(): void {
            console.log("Game Over");

            this.removeEventListener(egret.Event.ENTER_FRAME, this.loop, this);
            this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);

            this.player.stopFlipAnimation();

            // this.resetGame();

            egret.clearTimeout(this.gameOverTimeKey);
            this.gameOverTimeKey = egret.setTimeout(() => {
                console.log("Game Start");

                // this.curTime = this.getCTime();
                this.resetGame();
                this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
                this.addEventListener(egret.Event.ENTER_FRAME, this.loop, this);
            }, this, 500);
        }

        /**重置游戏状态 */
        private resetGame(): void {
            this.curTime = this.getCTime();

            this.mapLayer.resetMap(this.player);
            this.resetPlayer();

            this.debugDraw.drawDebug();
        }

        /**重置玩家状态 */
        private resetPlayer(): void {
            let initPos: { x: number, y: number } = this.mapLayer.getPlayerInitPos();
            this.player.resetPlayer(initPos);
        }

        private onTouchBegin(e: egret.TouchEvent): void {

            if (e.stageY > this.height || !this.player.getIsCanJump()) {
                return;
            }
            if (!this.checkIsCanJump(this.world, this.player)) {
                return;
            }
            this.player.onJump();
            this.handleCollision();
        }

        private checkIsCanJump(world: p2.World, player: p2.Body): boolean {
            return P2BodyUtil.checkIsCanJump(world, player);
        }

        /**处理刚体碰撞 */
        private handleCollision(): void {
            let collision: p2.Body = P2BodyUtil.getCollisionBody(this.world, this.player);
            this.player.setBeforeBodyId(collision.id);

            let gameData: GameData = BottleConfigData.GAME_DATA
            if (collision.id != gameData.groundId) {
                this.world.disableBodyCollision(this.player, collision);
            }

            /**解除之前碰撞的刚体的禁制 */
            this.disableBodys.forEach((body: p2.Body) => {
                this.world.enableBodyCollision(this.player, body);
            });

            this.disableBodys = [collision];
        }

    }
}