const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get("/", (req, res) => {
  res.send("방탈출 지도 백엔드 서버 실행 중");
});

app.get("/stores", async (req, res) => {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({
      message: error.message
    });
  }

  res.json(data);
});

app.get("/themes", async (req, res) => {
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({
      message: error.message
    });
  }

  const parsedThemes = data.map((theme) => {
    return {
      ...theme,
      storeId: theme.store_id,
      people: String(theme.people)
        .split(",")
        .map((person) => Number(person.trim()))
        .filter((person) => !Number.isNaN(person))
    };
  });

  res.json(parsedThemes);
});

app.get("/stores/:id", async (req, res) => {
  const storeId = Number(req.params.id);

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .single();

  if (storeError) {
    return res.status(404).json({
      message: "매장을 찾을 수 없습니다."
    });
  }

  const { data: themes, error: themeError } = await supabase
    .from("themes")
    .select("*")
    .eq("store_id", storeId)
    .order("id", { ascending: true });

  if (themeError) {
    return res.status(500).json({
      message: themeError.message
    });
  }

  const parsedThemes = themes.map((theme) => {
    return {
      ...theme,
      storeId: theme.store_id,
      people: String(theme.people)
        .split(",")
        .map((person) => Number(person.trim()))
        .filter((person) => !Number.isNaN(person))
    };
  });

  res.json({
    ...store,
    themes: parsedThemes
  });
});

app.post("/requests", async (req, res) => {
  const { type, store_name, theme_name, content } = req.body;

  if (!type || !content) {
    return res.status(400).json({
      message: "요청 종류와 내용은 필수입니다."
    });
  }

  const { data, error } = await supabase
    .from("requests")
    .insert([
      {
        type,
        store_name,
        theme_name,
        content,
        status: "대기"
      }
    ])
    .select();

  if (error) {
    return res.status(500).json({
      message: error.message
    });
  }

  res.status(201).json(data[0]);
});

app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
app.get("/stores", async (req, res) => {
  console.log("GET /stores 요청 들어옴");

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("id", { ascending: true });

  console.log("stores data:", data);
  console.log("stores error:", error);

  if (error) {
    return res.status(500).json({
      message: error.message
    });
  }

  res.json(data);
});