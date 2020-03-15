namespace bottle {
	export class Player extends p2.Body {

		public constructor() {
			super();
		}

		public onDestroy(): void {

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


	}
}