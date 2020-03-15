namespace bottle {
	export interface GameData {
		playerId: number,		// 玩家id
		groundId: number,		// 地板id
		firstBoardId: number	// 第一个跳板id
	}

	export class BottleConfigData {
		public static GAME_DATA: GameData;

		public static init(): void {
			BottleConfigData.GAME_DATA = RES.getRes("game_data_json");
			console.log('游戏数据=', BottleConfigData.GAME_DATA);
		}

	}
}