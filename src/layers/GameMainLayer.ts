namespace bottle {
    export class GameMainLayer extends eui.UILayer {
        private static readonly WORLD_GRAVITY_X: number = 0;           // p2物理世界横向重力
        private static readonly WORLD_GRAVITY_Y: number = 3000;        // p2物理世界垂直重力
        private static readonly PLAYER_VX: number = 370;                // 玩家横向移动速度
        private static readonly PLAYER_VY: number = 1800;               // 玩家纵向移动速度
        private static readonly PLAYER_ANGULAR_V: number = 7;           // 玩家角速度
        private static readonly PLAYER_ROTATION_V: number = 360;        // 玩家旋转速度 

        private mapLayer: MapLayer = new MapLayer();

        private debugDraw: p2DebugDraw;
        private world: p2.World;
        private materialOptions: p2.ContactMaterialOptions;

        private curTime: number;
        private player: p2.Body;

        private jumpTimeKey: number;                        // 记录跳跃计时器标识
        private curIsCanJump: boolean = true;         // 记录当前是否可以跳跃
        private beforeBodyId: number = -1;             // 上一个的跳板的id
        private isRotation: boolean = false;            // 是否可旋转

        private gameOverTimeKey: number;            // 游戏结束计时器标识
        private isFirstCollision: boolean = false;  // 是否第一次碰撞

        public constructor() {
            super();
            this.top = 0;
            this.bottom = 0;
            this.left = 0;
            this.right = 0;
            this.once(egret.Event.ADDED_TO_STAGE, this.init, this);
        }

        private onDestroy(): void {
            egret.clearTimeout(this.jumpTimeKey);
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

                console.log("开始游戏");
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
            let player: p2.Body = P2BodyUtil.createPlayerFactory(this.world, this, 101, "bottle_png", initPos.x, initPos.y);
            this.player = player;
            this.beforeBodyId = 2;
        }

        private createDebug(): void {
            //创建调试试图
            this.debugDraw = new p2DebugDraw(this.world);
            let sprite: egret.Sprite = new egret.Sprite();
            this.addChild(sprite);
            this.debugDraw.setSprite(sprite);
        }

        private loop(): void {
            let curTime: number = this.getCTime();
            let dt: number = curTime - this.curTime;
            this.curTime = curTime;

            this.world.step(dt / 1000);
            P2BodyUtil.syncDisplay(this.player);

            this.mapLayer.followPlayer(this.player);

            P2BodyUtil.syncP2Body(this.player);
            this.mapLayer.syncP2Bodys();

            this.calculatePlayer(dt);
            let isGameOver: boolean = this.checkGameOver();
            this.debugDraw.drawDebug();

            if (!isGameOver) {
                return;
            }
            this.handleGameOver();
        }

        private calculatePlayer(dt: number): void {
            if (!this.isRotation) {
                return;
            }
            let display: egret.DisplayObject = this.player.displays[0];
            display.rotation += dt / 1000 * GameMainLayer.PLAYER_ROTATION_V;
            P2BodyUtil.syncP2Body(this.player);
        }

        private checkGameOver(): boolean {
            let display: egret.DisplayObject = this.player.displays[0];

            let collision: p2.Body = P2BodyUtil.checkCollision(this.world, this.player);
            if (collision && collision.id == 1) {
                return true;
            }

            if (collision && collision.id != this.beforeBodyId && this.isFirstCollision) {
                this.isFirstCollision = false;

                egret.Tween.removeTweens(display);
                this.isRotation = false;

                this.player.angularVelocity = 0;
                this.player.velocity[0] = 0;

                if (Math.abs(display.rotation) < 30) {      // 修正细微偏差
                    display.rotation = collision.displays[0].rotation;
                    P2BodyUtil.syncP2Body(this.player);
                }
            }
            return false;
        }

        private handleGameOver(): void {
            this.removeEventListener(egret.Event.ENTER_FRAME, this.loop, this);
            this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
            egret.clearTimeout(this.jumpTimeKey);

            let display: egret.DisplayObject = this.player.displays[0];
            egret.Tween.removeTweens(display);

            // this.resetGame();

            egret.clearTimeout(this.gameOverTimeKey);
            this.gameOverTimeKey = egret.setTimeout(() => {
                console.log("开始游戏");
                // this.curTime = this.getCTime();
                this.resetGame();
                this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
                this.addEventListener(egret.Event.ENTER_FRAME, this.loop, this);
            }, this, 500);
        }

        private resetGame(): void {
            this.curIsCanJump = true;
            this.isRotation = false;
            this.beforeBodyId = 2;
            this.curTime = this.getCTime();
            this.isFirstCollision = false;

            this.mapLayer.resetMap(this.player);
            this.resetPlayer();

            P2BodyUtil.syncP2Body(this.player);
            this.mapLayer.syncP2Bodys();

            this.debugDraw.drawDebug();
        }

        private resetPlayer(): void {
            let initPos: { x: number, y: number } = this.mapLayer.getPlayerInitPos();
            this.player.angularVelocity = 0;
            this.player.velocity = [0, 0];

            let display: egret.DisplayObject = this.player.displays[0];
            egret.Tween.removeTweens(display);

            display.x = initPos.x;
            display.y = initPos.y - display.height / 2;
            display.rotation = 0;
        }

        private onTouchBegin(e: egret.TouchEvent): void {
            if (e.stageY > this.height || !this.curIsCanJump) {
                return;
            }
            if (!this.checkIsCanJump(this.world, this.player)) {
                return;
            }
            this.player.velocity[0] = GameMainLayer.PLAYER_VX;
            this.player.velocity[1] = -GameMainLayer.PLAYER_VY;
            // this.player.angularVelocity = GameMainLayer.PLAYER_ANGULAR_V;

            let collision: p2.Body = P2BodyUtil.getCollisionBody(this.world, this.player);
            this.beforeBodyId = collision.id;
            if (collision.id != 1) {
                this.world.disableBodyCollision(this.player, collision);
            }

            this.isFirstCollision = true;

            this.curIsCanJump = false;
            egret.clearTimeout(this.jumpTimeKey);
            this.jumpTimeKey = egret.setTimeout(() => {
                this.curIsCanJump = true;
                this.world.enableBodyCollision(this.player, collision);
            }, this, 500);

            this.startBottleRotation();
        }

        /**开始旋转瓶子 */
        private startBottleRotation(): void {
            let display: egret.DisplayObject = this.player.displays[0];
            egret.Tween.removeTweens(display);
            this.isRotation = true;
            egret.Tween.get(display).wait(1000).call(() => {
                this.isRotation = false;
                this.player.angularVelocity = 0;
                // this.player.velocity = [0, 0];
            }, this);
        }

        private checkIsCanJump(world: p2.World, player: p2.Body): boolean {
            return P2BodyUtil.checkIsCanJump(world, player);
        }

    }
}