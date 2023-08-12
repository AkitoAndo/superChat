// `npm run test`で実行する
// データベースのスキーマが設計通りになっているか確認する
"use strict";

const { User, Room, UserMessages, UserRooms } = require("../../db/models");

let user;
let room;
let userMessage;
let userRooms;

beforeAll(async () => {
  await User.sync();
  await Room.sync();
  await UserMessages.sync();
  await UserRooms.sync();
});

describe("User", () => {
  it("createでデータ生成", async () => {
    // データを生成
    user = await User.create({
      name: "foo",
      password: "bar",
      email: "bazz@example.com",
      employee_id: "ee111111",
    });

    // エラーが発生しなければ成功
  });

  it("emailがメールアドレスになっていないデータの追加を試みる", async () => {
    const actual = () =>
      User.create({
        name: "hoge",
        password: "fuga",
        email: "piyo",
        employee_id: "ee222222",
      });

    // エラーが発生すれば成功
    await expect(actual).rejects.toThrow();
  });

  it("社員IDが条件に沿っていないデータの追加を試みる", async () => {
    const actual = () =>
      User.create({
        name: "foo",
        password: "bar",
        email: "bazz@example.com",
        employee_id: "hogehoge",
      });

    // エラーが発生すれば成功
    await expect(actual).rejects.toThrow();
  });

  it("allowNullがfalseのプロパティを指定せずにデータの生成を試みる", async () => {
    // データを生成
    const actual = () =>
      User.create({
        name: "foo",
        email: "bazz@example.com",
        employee_id: "ee111111",
      });

    // エラーが発生すれば成功
    await expect(actual).rejects.toThrow();
  });
});

describe("Room", () => {
  it("createでデータ生成", async () => {
    room = await Room.create({
      name: "hoge",
      leader_name: "fuga",
    });

    // エラーが発生しなければ成功
  });
});

describe("UserMessages", () => {
  it("createでデータ生成", async () => {
    // UsersとRoomsのデータを1つ取り出す
    const user = await User.findOne();
    const room = await Room.findOne();

    userMessage = await UserMessages.create({
      room_id: room.id,
      message: "foo",
      user_id: user.id,
    });

    // エラーが発生しなければ成功
  });
});

describe("UserRooms", () => {
  it("createでデータ生成", async () => {
    // UsersとRoomsのデータを1つ取り出す
    const user = await User.findOne();
    const room = await Room.findOne();

    userRooms = await UserRooms.create({
      room_id: user.id,
      user_id: room.id,
    });

    // エラーが発生しなければ成功
  });
});

afterAll(async () => {
  // 追加したデータを全て削除する
  await userMessage.destroy();
  await userRooms.destroy();
  await user.destroy();
  await room.destroy();
});
