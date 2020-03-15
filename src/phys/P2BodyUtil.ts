namespace bottle {
	export class P2BodyUtil {
		private static yAxis: Array<number> = p2.vec2.fromValues(0, 1);
		private static transPos: egret.Point;

		/**地板创建工厂 */
		public static createGroundFactory(world: p2.World, display: egret.DisplayObject, id: number, vx: number): p2.Body {
			if (!display) {
				return null;
			}

			let x: number = display.x;
			let y: number = display.y;
			let globalPos: egret.Point = display.parent.localToGlobal(x, y, P2BodyUtil.transPos);

			let width: number = display.width;
			let height: number = display.height;

			let p2body: p2.Body = new p2.Body({
				mass: 1,
				fixedRotation: true,
				position: [globalPos.x + width / 2, globalPos.y + height / 2],
				type: vx == 0 ? p2.Body.STATIC : p2.Body.KINEMATIC,
				velocity: [vx, 0],
				applySpringForces: false
			});
			p2body.id = id;
			world.addBody(p2body);

			let shape: p2.Box = new p2.Box({ width: width, height: height });
			// shape.material = new p2.Material(id);
			p2body.addShape(shape);

			display.anchorOffsetX = display.width / 2;
			display.anchorOffsetY = display.height / 2;

			display.x = p2body.position[0];
			display.y = p2body.position[1];

			p2body.displays = [display];

			return p2body;
		}

		/**玩家创建工厂 */
		public static createPlayerFactory(world: p2.World, container: egret.DisplayObjectContainer, id: number, img: string, xLanding: number, yLanding: number): p2.Body {
			let p2body: p2.Body = new p2.Body({
				mass: 1,
				type: p2.Body.DYNAMIC,
				allowSleep: false
				// applySpringForces: false
			});
			p2body.id = id;
			world.addBody(p2body);

			// 依照纹理尺寸
			let texture: egret.Texture = RES.getRes(img);
			let display: egret.DisplayObject = new egret.Bitmap(texture);

			// 对应p2形状的宽高要根据玩家计算
			let shape: p2.Box = new p2.Box({ width: display.width, height: display.height });
			// shape.material = new p2.Material(id);
			p2body.addShape(shape);

			p2body.position = [xLanding, yLanding - display.height / 2];

			display.anchorOffsetX = display.width / 2;
			display.anchorOffsetY = display.height / 2;
			p2body.displays = [display];

			container.addChild(display);

			// console.log(shape.vertices, p2body.angle);
			// shape.vertices = [[0, 10], [10, 10], [10, 10], [0, 0]];

			return p2body;
		}

		/**
		 * 同步显示对象
		 * @param 刚体
		 */
		public static syncDisplay(body: p2.Body): void {
			if (!body) {
				return;
			}

			if (!body.displays || body.displays.length < 1) {
				return;
			}

			let display: egret.DisplayObject = body.displays[0];
			let localPos: egret.Point = display.parent.globalToLocal(body.position[0], body.position[1], P2BodyUtil.transPos);

			display.x = localPos.x;
			display.y = localPos.y;
			display.rotation = body.angle * 180 / Math.PI;
		}

		/**
		 * 同步p2世界中的刚体
		 * @param 刚体
		 */
		public static syncP2Body(body: p2.Body): void {
			if (!body) {
				return;
			}

			if (!body.displays || body.displays.length < 1) {
				return;
			}

			let display: egret.DisplayObject = body.displays[0];
			let globalPos: egret.Point = display.parent.localToGlobal(display.x, display.y, P2BodyUtil.transPos);

			body.position[0] = globalPos.x;
			body.position[1] = globalPos.y;
			body.angle = display.rotation * Math.PI / 180;
		}

		/**
		 * 判断指定的刚体在p2世界中是否满足起跳条件
		 * @param world     p2世界
		 * @param body      指定的刚体
		 * @returns {boolean}   是否满足起跳条件
		 */
		public static checkIsCanJump(world: p2.World, body: p2.Body): boolean {
			for (let i: number = 0; i < world.narrowphase.contactEquations.length; i++) {
				let equation: p2.ContactEquation = world.narrowphase.contactEquations[i];

				if (equation.bodyA === body || equation.bodyB === body) {
					// let dot: number = p2.vec2.dot(equation.normalA, P2BodyUtil.yAxis);

					// if (equation.bodyA === body) {
					// 	dot *= -1;
					// }
					// if (dot < -0.5) {
					return true;
					// }
				}
			}
			return false;
		}

		/**
		 * 判断指定的刚体在p2世界中是否发生碰撞
		 * @param world     p2世界
		 * @param body      指定的刚体
		 * @returns {p2.Body}   返回碰撞刚体
		 */
		public static checkCollision(world: p2.World, body: p2.Body): p2.Body {
			for (let i: number = 0; i < world.narrowphase.contactEquations.length; i++) {
				let equation: p2.ContactEquation = world.narrowphase.contactEquations[i];

				if (equation.bodyA === body || equation.bodyB === body) {
					// body.angularVelocity = 0;
					// body.velocity = [0, 0];
					// console.log("当前发生碰撞");
					return equation.bodyA.id != body.id ? equation.bodyA : equation.bodyB;
				}
			}
			return null;
		}

		/**
		 * 获取指定的刚体在p2世界中发生碰撞的刚体
		 * @param world     p2世界
		 * @param body      指定的刚体
		 * @returns {boolean}   是否碰撞
		 */
		public static getCollisionBody(world: p2.World, body: p2.Body): p2.Body {
			for (let i: number = 0; i < world.narrowphase.contactEquations.length; i++) {
				let equation: p2.ContactEquation = world.narrowphase.contactEquations[i];

				if (equation.bodyA === body || equation.bodyB === body) {
					return equation.bodyA != body ? equation.bodyA : equation.bodyB;
				}
			}
			return null;
		}

	}
}