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
    User.create.mockResolvedValue({
      id: 99,
      name: "foo",
      password: "bar",
      email: "bazz@example.com",
      employee_id: "ee385017",
      employee_status: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

describe("updateUser", () => {
  it("nameを更新する", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいname
    const newName = "someone";
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_name: newName,
        update_button: "update_name",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateが1回だけ呼ばれていて
    // その引数の1つ目が { name: newName }で、
    // 2つ目のオブジェクトのwhereプロパティに{ id: userId }を含むオブジェクトが入っていれば成功
    expect(User.update.mock.calls).toHaveLength(1);
    expect(User.update.mock.calls[0].length).toBeGreaterThan(1);
    expect(User.update.mock.calls[0][0]).toStrictEqual({ name: newName });
    expect(User.update.mock.calls[0][1]).toHaveProperty("where");
    expect(User.update.mock.calls[0][1].where).toMatchObject({
      user_id: userId,
    });

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/index/read_users");
  });

  it("新しいnameが空白のみ", async () => {
    // 情報を更新したいユーザのID
    const userId = 2024;
    // 新しいname
    const newName = "    ";
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_name: newName,
        update_button: "update_name",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateは呼ばれないはず
    expect(User.update.mock.calls).toHaveLength(0);

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe(
      `/index/read_users/update_user/${userId}`
    );
  });

  it("passwordを更新する", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newPass1 = "new-pass";
    // 確認用
    const newPass2 = newPass1;
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_pass1: newPass1,
        new_pass2: newPass2,
        update_button: "update_password",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateが1回だけ呼ばれていて
    // その引数の1つ目が { password: newPass1 }で、
    // 2つ目のオブジェクトのwhereプロパティに{ id: userId }を含むオブジェクトが入っていれば成功
    expect(User.update.mock.calls).toHaveLength(1);
    expect(User.update.mock.calls[0].length).toBeGreaterThan(1);
    expect(User.update.mock.calls[0][0]).toStrictEqual({ password: newPass1 });
    expect(User.update.mock.calls[0][1]).toHaveProperty("where");
    expect(User.update.mock.calls[0][1].where).toMatchObject({
      user_id: userId,
    });

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/index/read_users");
  });

  it("新しいpasswordが空白のみ", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newPass1 = "    ";
    // 確認用
    const newPass2 = newPass1;
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_pass1: newPass1,
        new_pass2: newPass2,
        update_button: "update_password",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateは呼ばれないはず
    expect(User.update.mock.calls).toHaveLength(0);

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe(
      `/index/read_users/update_user/${userId}`
    );
  });

  it("新しいpasswordと確認用が不一致", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newPass1 = "new-pass";
    // 確認用
    const newPass2 = "old-pass";
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_pass1: newPass1,
        new_pass2: newPass2,
        update_button: "update_password",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateは呼ばれないはず
    expect(User.update.mock.calls).toHaveLength(0);

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe(
      `/index/read_users/update_user/${userId}`
    );
  });

  it("statusを0に更新する", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newStatusString = "0";
    const newStatus = parseInt(newStatusString, 10);
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_status: newStatusString,
        update_button: "update_status",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateが1回だけ呼ばれていて
    // その引数の1つ目が { employee_status: newStatus }で、
    // 2つ目のオブジェクトのwhereプロパティに{ id: userId }を含むオブジェクトが入っていれば成功
    expect(User.update.mock.calls).toHaveLength(1);
    expect(User.update.mock.calls[0].length).toBeGreaterThan(1);
    expect(User.update.mock.calls[0][0]).toStrictEqual({
      employee_status: newStatus,
    });
    expect(User.update.mock.calls[0][1]).toHaveProperty("where");
    expect(User.update.mock.calls[0][1].where).toMatchObject({
      user_id: userId,
    });

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/index/read_users");
  });

  it("statusを1に更新する", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newStatusString = "1";
    const newStatus = parseInt(newStatusString, 10);
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_status: newStatusString,
        update_button: "update_status",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateが1回だけ呼ばれていて
    // その引数の1つ目が { employee_status: newStatus }で、
    // 2つ目のオブジェクトのwhereプロパティに{ id: userId }を含むオブジェクトが入っていれば成功
    expect(User.update.mock.calls).toHaveLength(1);
    expect(User.update.mock.calls[0].length).toBeGreaterThan(1);
    expect(User.update.mock.calls[0][0]).toStrictEqual({
      employee_status: newStatus,
    });
    expect(User.update.mock.calls[0][1]).toHaveProperty("where");
    expect(User.update.mock.calls[0][1].where).toMatchObject({
      user_id: userId,
    });

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/index/read_users");
  });

  it("statusを2に更新する", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newStatusString = "2";
    const newStatus = parseInt(newStatusString, 10);
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_status: newStatusString,
        update_button: "update_status",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateが1回だけ呼ばれていて
    // その引数の1つ目が { employee_status: newStatus }で、
    // 2つ目のオブジェクトのwhereプロパティに{ id: userId }を含むオブジェクトが入っていれば成功
    expect(User.update.mock.calls).toHaveLength(1);
    expect(User.update.mock.calls[0].length).toBeGreaterThan(1);
    expect(User.update.mock.calls[0][0]).toStrictEqual({
      employee_status: newStatus,
    });
    expect(User.update.mock.calls[0][1]).toHaveProperty("where");
    expect(User.update.mock.calls[0][1].where).toMatchObject({
      user_id: userId,
    });

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe("/index/read_users");
  });

  it("誤ったstatus(3)に更新させようとする", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newStatusString = "3";
    const newStatus = parseInt(newStatusString, 10);
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_status: newStatusString,
        update_button: "update_status",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateは呼ばれないはず
    expect(User.update.mock.calls).toHaveLength(0);

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe(
      `/index/read_users/update_user/${userId}`
    );
  });

  it("誤ったstatus(nan)に更新させようとする", async () => {
    // 情報を更新したいユーザのID
    const userId = 2023;
    // 新しいpassword
    const newStatusString = "not-a-number";
    const newStatus = parseInt(newStatusString, 10);
    // 更新するリクエストを作成
    const req = {
      params: {
        user_id: userId,
      },
      body: {
        new_status: newStatusString,
        update_button: "update_status",
      },
    };

    const resMock = {
      redirect: jest.fn(),
    };

    await usersModel.updateUser(req, resMock);

    // User.updateは呼ばれないはず
    expect(User.update.mock.calls).toHaveLength(0);

    // resMock.redirectが1回だけ呼ばれていて、
    // その引数が"/index/read_users"になっていれば成功
    expect(resMock.redirect.mock.calls).toHaveLength(1);
    expect(resMock.redirect.mock.calls[0][0]).toBe(
      `/index/read_users/update_user/${userId}`
    );
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
