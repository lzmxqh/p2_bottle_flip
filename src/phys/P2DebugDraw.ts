class p2DebugDraw {
    private sprite: egret.Sprite;
    private world: p2.World;
    private COLOR_D_SLEEP: number = 0x999999;
    private COLOR_D_WAKE: number = 0xe5b2b2;
    private COLOR_K: number = 0xff0000;
    private COLOR_S: number = 0x000000;

    public constructor(world: p2.World) {
        this.world = world;
    }
    public setSprite(sprite: egret.Sprite) {
        this.sprite = sprite;
    }
    public drawDebug(): void {
        this.sprite.graphics.clear();

        let len: number = this.world.bodies.length;
        for (let i: number = 0; i < len; i++) {
            let body: p2.Body = this.world.bodies[i];

            // if (body.displays && body.displays.length > 0 && i != len - 1) {
            //     continue;
            // }

            if (body.displays && body.displays.length > 0) {
                continue;
            }

            for (let j: number = 0; j < body.shapes.length; j++) {
                let shape: p2.Shape = body.shapes[j];

                if (shape instanceof p2.Convex) {
                    this.drawConvex(<p2.Convex>shape, body);
                } else if (shape instanceof p2.Circle) {
                    this.drawCircle(<p2.Circle>shape, body);
                } else if (shape instanceof p2.Line) {
                    this.drawLine(<p2.Line>shape, body);
                } else if (shape instanceof p2.Particle) {
                    this.drawParticle(<p2.Particle>shape, body);
                } else if (shape instanceof p2.Plane) {
                    this.drawPlane(<p2.Plane>shape, body);
                } else if (shape instanceof p2.Capsule) {
                    this.drawCapsule(<p2.Capsule>shape, body);
                }
            }
        }
    }
    private drawCircle(shape: p2.Circle, b: p2.Body): void {
        let color: number = this.getColor(b);

        let g: egret.Graphics = this.sprite.graphics;
        g.lineStyle(1, color);
        g.beginFill(color, 0.5);
        g.drawCircle(b.position[0], b.position[1], shape.radius);

        let edge: number[] = new Array();
        b.toWorldFrame(edge, [shape.radius, 0]);
        g.moveTo(b.position[0], b.position[1]);
        g.lineTo(edge[0], edge[1]);

        g.endFill();
    }

    private drawCapsule(shape: p2.Capsule, b: p2.Body): void {
        let color: number = this.getColor(b);

        let len: number = shape.length;
        let radius: number = shape.radius;

        let p1: number[] = new Array(), p2: number[] = new Array(), p3: number[] = new Array(), p4: number[] = new Array();
        let a1: number[] = new Array(), a2: number[] = new Array();

        b.toWorldFrame(p1, [-len / 2, -radius]);
        b.toWorldFrame(p2, [len / 2, -radius]);
        b.toWorldFrame(p3, [len / 2, radius]);
        b.toWorldFrame(p4, [-len / 2, radius]);
        b.toWorldFrame(a1, [len / 2, 0]);
        b.toWorldFrame(a2, [-len / 2, 0]);

        let g: egret.Graphics = this.sprite.graphics;
        g.lineStyle(1, color);
        g.beginFill(color, 0.5);
        g.drawCircle(a1[0], a1[1], radius);
        g.endFill();
        g.lineStyle(1, color);
        g.beginFill(color, 0.5);
        g.drawCircle(a2[0], a2[1], radius);
        g.endFill();

        g.lineStyle(1, color);
        g.beginFill(color, 0.5);
        g.moveTo(p1[0], p1[1]);
        g.lineTo(p2[0], p2[1]);
        g.lineTo(p3[0], p3[1]);
        g.lineTo(p4[0], p4[1]);

        g.endFill();
    }

    private drawLine(shape: p2.Line, b: p2.Body): void {
        let color: number = this.getColor(b);

        let len: number = shape.length;

        let p1: number[] = new Array(), p2: number[] = new Array();

        b.toWorldFrame(p1, [-len / 2, 0]);
        b.toWorldFrame(p2, [len / 2, 0]);

        let g: egret.Graphics = this.sprite.graphics;

        g.lineStyle(1, color);
        g.moveTo(p1[0], p1[1]);
        g.lineTo(p2[0], p2[1]);

        g.endFill();
    }

    private drawParticle(shape: p2.Particle, b: p2.Body): void {
        let color: number = this.getColor(b);

        let g: egret.Graphics = this.sprite.graphics;
        g.lineStyle(1, color);
        g.beginFill(color, 0.5);
        g.drawCircle(b.position[0], b.position[1], 1);
        g.endFill();

        g.lineStyle(1, color);
        g.drawCircle(b.position[0], b.position[1], 5);
        g.endFill();
    }

    private drawConvex(shape: p2.Convex, b: p2.Body): void {
        let color: number = this.getColor(b);

        let l: number = shape.vertices.length;
        let g: egret.Graphics = this.sprite.graphics;
        g.lineStyle(1, color);
        g.beginFill(color, 0.5);

        let worldPoint: number[] = new Array();
        b.toWorldFrame(worldPoint, shape.vertices[0]);
        //g.moveTo(worldPoint[0], worldPoint[1]);
        g.moveTo(b.position[0], b.position[1]);
        g.lineTo(worldPoint[0], worldPoint[1]);
        for (let i: number = 1; i <= l; i++) {
            b.toWorldFrame(worldPoint, shape.vertices[i % l]);
            g.lineTo(worldPoint[0], worldPoint[1]);
        }


        g.endFill();
    }

    private drawPlane(shape: p2.Plane, b: p2.Body): void {
        let color: number = this.COLOR_D_SLEEP;
        let g: egret.Graphics = this.sprite.graphics;
        g.lineStyle(1, color);
        g.beginFill(color, 1);

        let start: number[] = new Array();
        let end: number[] = new Array();
        b.toWorldFrame(start, [-1000, 0]);
        g.moveTo(start[0], start[1]);

        b.toWorldFrame(end, [1000, 0]);
        g.lineTo(end[0], end[1]);

        b.toWorldFrame(end, [1000, -1000]);
        g.lineTo(end[0], end[1]);

        b.toWorldFrame(end, [-1000, -1000]);
        g.lineTo(end[0], end[1]);

        b.toWorldFrame(end, [-1000, -0]);
        g.lineTo(end[0], end[1]);

        g.endFill();

    }

    private getColor(b: p2.Body): number {
        let color: number = this.COLOR_D_SLEEP;
        if (b.type == p2.Body.KINEMATIC) {
            color = this.COLOR_K;
        } else if (b.type == p2.Body.STATIC) {
            color = this.COLOR_S;
        } else if (b.sleepState == p2.Body.AWAKE) {
            color = this.COLOR_D_WAKE;
        }

        return color;
    }
}
