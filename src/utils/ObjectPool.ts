namespace bottle {

    /**可池化对象 */
    export interface Poolable {
        /**在创建时调用*/
        onCreate();
        /**在回收时调用*/
        onRecycle();
        /**在获得时调用*/
        onObtain();
        /**在销毁时调用*/
        onDestroy();
    }

    /**对象池 */
    export class ObjectPool<T extends Poolable>{
        private objectFactory: () => T;
        private objs: Array<T>;
        private threshold: number;
        /** 
         * objectFactory 创建对象方法
         * threshold 池子阈值
         * initCount 池子初始化数量
        */
        constructor(objectFactory: () => T, threshold: number, initCount?: number) {
            this.objs = [];
            this.objectFactory = objectFactory;
            this.threshold = threshold;
            if (initCount) {
                for (let i = 0; i < initCount; i++) {
                    this.objs.push(this.objectFactory());
                }
            }
        }

        /**获取一个对象 */
        public obtain(): T {
            let obj: T = null;
            if (this.objs.length > 0) {
                obj = this.objs.pop();
            } else {
                obj = this.objectFactory();
            }
            obj.onObtain();
            return obj;
        }

        /**回收一个对象 */
        public recycle(obj: T) {
            if (obj) {
                obj.onRecycle();
                if (this.objs && this.objs.length < this.threshold) {
                    this.objs.push(obj);
                } else {
                    //池子满了销毁对象
                    obj.onDestroy();
                }
            }
        }

        /**销毁整个对象池 */
        public destroyPool() {
            if (this.objs && this.objs.length > 0) {
                this.objs.forEach((obj: T) => {
                    obj.onDestroy();
                });
            }
            this.objs = null;
        }
    }
}