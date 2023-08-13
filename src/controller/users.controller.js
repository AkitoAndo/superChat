// users.controller.js
"use strict";
const express = require("express");
const router = express.Router();

const users = require("../models/users.model");

// ログインページを表示
router.get("/login", users.displayLogin);

// ログイン時の処理
router.post("/login", users.login);

// アカウント作成ページを表示
router.get("/register", users.displayRegister);

// アカウント登録時の処理
router.post("/register", users.register);

// ログアウトの処理
router.post("/logout", users.logout);

module.exports = router;
