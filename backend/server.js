const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "db.json");

function readDB() {
  const data = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.send("방탈출 지도 백엔드 서버 실행 중");
});

app.get("/stores", (req, res) => {
  const db = readDB();
  res.json(db.stores);
});

app.get("/themes", (req, res) => {
  const db = readDB();
  res.json(db.themes);
});

app.get("/stores/:id", (req, res) => {
  const db = readDB();
  const storeId = Number(req.params.id);

  const store = db.stores.find((store) => store.id === storeId);

  if (!store) {
    return res.status(404).json({
      message: "매장을 찾을 수 없습니다."
    });
  }

  const storeThemes = db.themes.filter(
    (theme) => theme.storeId === storeId
  );

  res.json({
    ...store,
    themes: storeThemes
  });
});

app.post("/stores", (req, res) => {
  const db = readDB();

  const newStore = {
    id: Date.now(),
    ...req.body
  };

  db.stores.push(newStore);
  writeDB(db);

  res.status(201).json(newStore);
});

app.post("/themes", (req, res) => {
  const db = readDB();

  const newTheme = {
    id: Date.now(),
    ...req.body
  };

  db.themes.push(newTheme);
  writeDB(db);

  res.status(201).json(newTheme);
});

app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});