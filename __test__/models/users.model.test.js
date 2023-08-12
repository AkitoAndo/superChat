"use strict";

const { User, UserRooms, Room, UserMessages } = require("../../db/models");
const usersModel = require("../../src/models/users.model");
const testDb = require("../test_db");

jest.mock("../../db/models");

// テスト毎にモックをリセットする
afterEach(() => {
  User.mockReset();
  Room.mockReset();
  UserRooms.mockReset();
  UserMessages.mockReset();
});

describe("addUser", () => {
  it("addUserでユーザを追加", async () => {
    // 追加するデータ
    const user = {
      name: "foo",
      password: "bar",
      email: "bazz@example.com",
      employee_id: "ee385017",
    };

    const req = {
      body: user,
      session: {
        user_id: 0,
      },
    };

    const resMock = { redirect: jest.fn() };

    await usersModel.register(req, resMock);

    // User.createが1回だけ呼ばれていて、その引数の1つ目がuserと一致するはず
    expect(User.create.mock.calls).toHaveLength(1);
    expect(User.create.mock.calls[0][0]).toStrictEqual(user);

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/users/login"になっているはず
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/users/login");
  });

  it("制約条件に則っていないデータの追加を試みる", async () => {
    // await User.createが呼ばれたらエラーを投げる
    User.create.mockRejectedValue();

    // 追加するデータ
    const user = {
      name: "hoge",
      password: "fuga",
      email: "piyo@example.com",
      employee_id: "hogefuga",
    };

    const req = {
      body: user,
      session: {
        user_id: 0,
      },
    };

    const resMock = { redirect: jest.fn() };

    await usersModel.register(req, resMock);

    // User.createが1回だけ呼ばれていて、その引数の1つ目がuserと一致するはず
    expect(User.create.mock.calls).toHaveLength(1);
    expect(User.create.mock.calls[0][0]).toStrictEqual(user);

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/users/register"になっているはず
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/users/register");
  });

  describe("displayUsers", () => {
    it("displayUsersでユーザ一覧を表示", async () => {
      // await User.findAllが呼ばれたらtestDb.usersを返す
      User.findAll.mockResolvedValue(testDb.users);

      const req = {
        session: {
          user_id: 0,
        },
      };

      const resMock = { render: jest.fn() };

      await usersModel.displayUsers(req, resMock);

      // resMock.renderが1回だけ呼ばれていて、
      // その引数が("pages/users_list", { users, isAdmin })になっているはず
      expect(resMock.render.mock.calls).toHaveLength(1);
      expect(resMock.render.mock.calls[0]).toHaveLength(2);
      expect(resMock.render.mock.calls[0][0]).toBe("pages/users_list");
      expect(resMock.render.mock.calls[0][1]).toHaveProperty("user");
      expect(resMock.render.mock.calls[0][1]).toHaveProperty("isAdmin");

      // usersはtestDb.usersと一致しているはず
      const users = resMock.render.mock.calls[0][1].user;
      expect(users.length).toBe(testDb.users.length);
      for (let i = 0; i < users.length; i++) {
        expect(users[i]).toMatchObject(testDb.users[i]);
      }

      // isAdminはtrueになっているはず
      expect(resMock.render.mock.calls[0][1].isAdmin).toBe(true);
    });
  });
});

describe("isAdmin", () => {
  it("employee_statusが3", async () => {
    expect(await usersModel.isAdmin(0)).toBe(true);
  });

  it("employee_statusが2", async () => {
    expect(await usersModel.isAdmin(1)).toBe(true);
  });

  it("employee_statusが1", async () => {
    expect(await usersModel.isAdmin(2)).toBe(false);
  });

  it("employee_statusが0", async () => {
    expect(await usersModel.isAdmin(3)).toBe(false);
  });

  it("userIdが不正な値", async () => {
    expect(await usersModel.isAdmin(null)).toBe(false);
  });
});

describe("deleteUser", () => {
  it("deleteUserでユーザを削除", async () => {
    const userId = 66;

    // Userを削除するリクエストを作成
    const req = {
      params: { user_id: userId },
      session: { user_id: 0 },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.deleteUser(req, resMock);

    // UserRooms.destroyが1回だけ呼ばれていて、その引数の1つ目のオブジェクトの
    // whereプロパティに{ user_id: userId }を含むオブジェクトが入っていれば成功
    expect(UserRooms.destroy.mock.calls).toHaveLength(1);
    expect(UserRooms.destroy.mock.calls[0].length).toBeGreaterThan(0);
    expect(UserRooms.destroy.mock.calls[0][0]).toHaveProperty("where");
    expect(UserRooms.destroy.mock.calls[0][0].where).toMatchObject({
      user_id: userId,
    });

    // 上と同様のテスト User版
    expect(User.destroy.mock.calls).toHaveLength(1);
    expect(User.destroy.mock.calls[0].length).toBeGreaterThan(0);
    expect(User.destroy.mock.calls[0][0]).toHaveProperty("where");
    expect(User.destroy.mock.calls[0][0].where).toMatchObject({
      id: userId,
    });

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/index/read_users");
  });
});
