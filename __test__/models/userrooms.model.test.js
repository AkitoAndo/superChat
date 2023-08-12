// test_db.jsの内容を前提にしているので注意
"use strict";

const { User, UserRooms, Room, UserMessages } = require("../../db/models");
const mainModel = require("../../src/models/userrooms.model");

const testDb = require("../test_db");

// Modelsをモック
jest.mock("../../db/models");

// テスト毎にモックをリセットする
afterEach(() => {
  User.mockReset();
  Room.mockReset();
  UserRooms.mockReset();
  UserMessages.mockReset();
});

describe("displayRoom", () => {
  it("displayRoomでグループを取得", async () => {
    User.findAll.mockResolvedValue(testDb.users);

    const userRooms = testDb.userRooms.filter((ur) => ur.user_id === 0);

    UserRooms.findAll.mockResolvedValue(userRooms);

    const user_id = 0;

    const req = {
      session: { user_id },
    };

    const resMock = {
      render: jest.fn(),
    };

    await mainModel.displayRoom(req, resMock);

    // resMock.renderが1回だけ呼ばれていて、
    // その引数が("pages/toppage", { groups })になっているはず
    expect(resMock.render.mock.calls).toHaveLength(1);
    expect(resMock.render.mock.calls[0]).toHaveLength(2);
    expect(resMock.render.mock.calls[0][0]).toBe("pages/toppage");
    expect(resMock.render.mock.calls[0][1]).toHaveProperty("groups");

    // groupsはuserRoomsと等しいはず
    const groups = resMock.render.mock.calls[0][1].groups;
    for (let i = 0; i < groups.length; i++) {
      expect(groups[i]).toStrictEqual(userRooms[i]);
    }
  });
});

describe("displayDeleteRoom", () => {
  it("displayDeleteRoomでグループ削除画面を表示", async () => {
    const req = {
      params: { room_id: 0 },
      session: { user_id: 0 },
    };

    const resMock = {
      render: jest.fn(),
    };

    await mainModel.displayDeleteRoom(req, resMock);

    // resMock.renderが1回だけ呼ばれていて、
    // その引数が("pages/room_delete_page", { roomId: 0 })になっているはず
    expect(resMock.render.mock.calls).toHaveLength(1);
    expect(resMock.render.mock.calls[0]).toHaveLength(2);
    expect(resMock.render.mock.calls[0][0]).toBe("pages/room_delete_page");
    expect(resMock.render.mock.calls[0][1]).toStrictEqual({ roomId: 0 });
  });
});

describe("deleteRoom", () => {
  it("deleteRoomでルームを削除", async () => {
    const roomId = 0;

    // Roomを削除するリクエストを作成
    const req = {
      params: { room_id: roomId },
      session: { user_id: 0 },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await mainModel.deleteRoom(req, resMock);

    // UserRooms.destroyが1回だけ呼ばれていて、その引数の1つ目のオブジェクトの
    // whereプロパティに{ room_id: roomId }を含むオブジェクトが入っていれば成功
    expect(UserRooms.destroy.mock.calls).toHaveLength(1);
    expect(UserRooms.destroy.mock.calls[0].length).toBeGreaterThan(0);
    expect(UserRooms.destroy.mock.calls[0][0]).toHaveProperty("where");
    expect(UserRooms.destroy.mock.calls[0][0].where).toMatchObject({
      room_id: roomId,
    });

    // 以下同様
    expect(UserMessages.destroy.mock.calls).toHaveLength(1);
    expect(UserMessages.destroy.mock.calls[0].length).toBeGreaterThan(0);
    expect(UserMessages.destroy.mock.calls[0][0]).toHaveProperty("where");
    expect(UserMessages.destroy.mock.calls[0][0].where).toMatchObject({
      room_id: roomId,
    });

    expect(Room.destroy.mock.calls).toHaveLength(1);
    expect(Room.destroy.mock.calls[0].length).toBeGreaterThan(0);
    expect(Room.destroy.mock.calls[0][0]).toHaveProperty("where");
    expect(Room.destroy.mock.calls[0][0].where).toMatchObject({
      id: roomId,
    });

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/index");
  });
});
