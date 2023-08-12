// message.model.test.js
// test_db.jsの内容を前提にしているので注意
"use strict";

const { User, UserRooms, Room, UserMessages } = require("../../db/models");
const mainModel = require("../../src/models/message.model");

// Modelsをモック
jest.mock("../../db/models");

// テスト毎にモックをリセットする
afterEach(() => {
  User.mockReset();
  Room.mockReset();
  UserRooms.mockReset();
  UserMessages.mockReset();
});

describe("createReceiveMessage", () => {
  it("createReceiveMessageでメッセージ受信時の関数を生成する", async () => {
    const roomId = 0;
    const userId = 0;
    const message = "Software";

    const receiveMessage = mainModel.createReceiveMessage(roomId, userId);
    await receiveMessage(message);

    // UserMessages.createが1回だけ呼ばれていて、
    // その引数の1つ目がexampleMessageと一致するはず
    expect(UserMessages.create.mock.calls).toHaveLength(1);
    expect(UserMessages.create.mock.calls[0][0]).toStrictEqual({
      room_id: roomId,
      user_id: userId,
      message,
    });
  });
});
