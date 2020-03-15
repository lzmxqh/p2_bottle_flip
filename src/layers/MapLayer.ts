namespace bottle {
	export class MapLayer extends eui.Component {
		private skipGroundGroup: eui.Group;
		private ground: eui.Rect;

		private world: p2.World;
		private fixedGroundArray: Array<p2.Body> = [];

		public constructor() {
			super();
			this.skinName = "bottle.MapLayerSkin";
		}

		public init(world: p2.World): void {
			this.world = world;
			this.createGroud(world);
		}

		/**创建地板, 跳板刚体 */
		private createGroud(world: p2.World): void {
			let gameData: GameData = BottleConfigData.GAME_DATA;
			let groundId: number = gameData.groundId;
			let firstBoardId: number = gameData.firstBoardId;

			// 创建地面
			let ground: p2.Body = P2BodyUtil.createGroundFactory(world, this.ground, groundId, 0);
			this.fixedGroundArray.push(ground);

			// 创建跳板
			for (let i = 0; i < this.skipGroundGroup.numChildren; i++) {
				let skipGround: p2.Body = P2BodyUtil.createGroundFactory(world, this.skipGroundGroup.getChildAt(i), i + firstBoardId, 0);
				if (skipGround) {
					this.fixedGroundArray.push(skipGround);
				}
			}
		}

		/**给玩家添加刚体碰撞材质 */
		public addContactMaterial(options: p2.ContactMaterialOptions, player: p2.Body): void {
			this.fixedGroundArray.forEach((body) => {
				let contactMateial: p2.ContactMaterial = new p2.ContactMaterial(new p2.Material(player.id), new p2.Material(body.id), options);
				this.world.addContactMaterial(contactMateial);
			}, this);
		}

		/**获取玩家初始位置 */
		public getPlayerInitPos(): { x: number, y: number } {
			let firstSkipGround: egret.DisplayObject = this.skipGroundGroup.getChildAt(0);
			return { x: firstSkipGround.x, y: firstSkipGround.y - firstSkipGround.height / 2 };
		}

		/**跟随玩家位置 */
		public followPlayer(player: p2.Body): void {
			if (!player.displays || player.displays.length < 1) {
				return;
			}

			let playerDisplay: egret.DisplayObject = player.displays[0];

			// console.log("follow", playerDisplay.x);
			if (playerDisplay.x <= this.width / 2) {
				// console.log("follow_end");
				return;
			}
			let distance: number = playerDisplay.x - this.width / 2;
			playerDisplay.x -= distance;

			this.skipGroundGroup.x -= distance;
		}

		/**同步p2世界地图刚体 */
		public syncP2Bodys(): void {
			this.fixedGroundArray.forEach((body: p2.Body) => {
				P2BodyUtil.syncP2Body(body);
			});
		}

		/**重置地图 */
		public resetMap(player: p2.Body): void {
			this.skipGroundGroup.x = 0;
			this.resetCollision(player);
		}

		/**重置碰撞 */
		public resetCollision(player: p2.Body): void {
			this.fixedGroundArray.forEach((body: p2.Body) => {
				this.world.enableBodyCollision(player, body);
			});
		}
	}
}