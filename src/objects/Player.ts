namespace bottle {
	export class Player extends p2.Body {
		private static readonly PLAYER_VX: number = 370;                // 玩家横向移动速度
		private static readonly PLAYER_VY: number = 1800;               // 玩家纵向移动速度
		private static readonly PLAYER_ANGULAR_V: number = 7;           // 玩家角速度
		private static readonly PLAYER_ROTATION_V: number = 360;        // 玩家旋转速度 

		private isFlip: boolean = false;            // 是否正在翻滚
		private isFirstCollision: boolean = false;  // 是否第一次碰撞
		private beforeBodyId: number = -1;         	// 上一个的跳板的id

		private isCanJump: boolean = true;         // 记录当前是否可以跳跃
		private jumpTimeKey: number;               // 记录跳跃计时器标识

		public constructor() {
			super();
		}

		public onDestroy(): void {
			this.stopFlipAnimation();
		}

		/**玩家初始化 */
		public init(world: p2.World, container: egret.DisplayObjectContainer, id: number, img: string, xLanding: number, yLanding: number): void {
			this.mass = 1;
			this.type = p2.Body.DYNAMIC;
			this.allowSleep = false;
			// this.applySpringForces = false;

			this.id = id;
			world.addBody(this);

			// 依照纹理尺寸
			let texture: egret.Texture = RES.getRes(img);
			let display: egret.DisplayObject = new egret.Bitmap(texture);

			// 对应p2形状的宽高要根据玩家计算
			let shape: p2.Box = new p2.Box({ width: display.width, height: display.height });
			// shape.material = new p2.Material(id);
			this.addShape(shape);

			this.position = [xLanding, yLanding - display.height / 2];

			display.anchorOffsetX = display.width / 2;
			display.anchorOffsetY = display.height / 2;
			this.displays = [display];

			container.addChild(display);

			// console.log(shape.vertices, p2body.angle);
			// shape.vertices = [[0, 10], [10, 10], [10, 10], [0, 0]];
		}

		/**重置玩家状态 */
		public resetPlayer(initPos: { x: number, y: number }): void {
			this.isFlip = false;
			this.isFirstCollision = false;
			this.beforeBodyId = BottleConfigData.GAME_DATA.firstBoardId;

			this.isCanJump = true;

			this.angularVelocity = 0;
			this.velocity = [0, 0];

			let display: egret.DisplayObject = this.displays[0];
			egret.Tween.removeTweens(display);

			display.x = initPos.x;
			display.y = initPos.y - display.height / 2;
			display.rotation = 0;

			P2BodyUtil.syncP2Body(this);
		}

		/**玩家跳跃 */
		public onJump(): void {
			this.isFirstCollision = true;

			this.velocity[0] = Player.PLAYER_VX;
			this.velocity[1] = -Player.PLAYER_VY;
			// this.player.angularVelocity = Player.PLAYER_ANGULAR_V;

			this.playFlipAnimation();

			this.isCanJump = false;
			egret.clearTimeout(this.jumpTimeKey);
			this.jumpTimeKey = egret.setTimeout(() => {
				this.isCanJump = true;
			}, this, 500);
		}

		/**监听玩家碰撞 */
		public onCollision(collision: p2.Body): void {
			if (!this.isFirstCollision || !collision || collision.id == this.beforeBodyId) {
				return;
			}
			this.isFirstCollision = false;

			this.stopFlipAnimation();

			this.angularVelocity = 0;
			this.velocity[0] = 0;

			let display: egret.DisplayObject = this.displays[0];
			if (Math.abs(display.rotation) < 30) {      // 修正细微偏差
				display.rotation = collision.displays[0].rotation;
				P2BodyUtil.syncP2Body(this);
			}
		}

		/**播放翻滚动画 */
		private playFlipAnimation(): void {
			let display: egret.DisplayObject = this.displays[0];
			egret.Tween.removeTweens(display);

			this.isFlip = true;
			egret.Tween.get(display).wait(1000).call(() => {
				this.isFlip = false;
				this.angularVelocity = 0;
				// this.velocity = [0, 0];
			}, this);
		}

		/**停止翻滚动画 */
		public stopFlipAnimation(): void {
			egret.clearTimeout(this.jumpTimeKey);

			let display: egret.DisplayObject = this.displays[0];
			egret.Tween.removeTweens(display);

			this.isFlip = false;
		}

		/**计算玩家翻滚角度 */
		public calculatePlayerFlip(dt: number): void {
			if (!this.isFlip) {
				return;
			}
			let display: egret.DisplayObject = this.displays[0];
			display.rotation += dt / 1000 * Player.PLAYER_ROTATION_V;
			P2BodyUtil.syncP2Body(this);
		}

		/**设置上一个刚体碰撞id */
		public setBeforeBodyId(id: number): void {
			this.beforeBodyId = id;
		}

		/**获取玩家是否可跳跃 */
		public getIsCanJump(): boolean {
			return this.isCanJump;
		}
	}
}