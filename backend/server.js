const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "https://room-escape-two.vercel.app",
  "https://bangtalmap.site",
  "https://www.bangtalmap.site"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS blocked:", origin);
        callback(new Error("CORS blocked"));
      }
    }
  })
);

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase 환경변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

  res.json(data || []);
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

  const parsedThemes = (data || []).map((theme) => {
    return {
      ...theme,
      storeId: theme.store_id,
      people: String(theme.people || "")
        .split(",")
        .map((person) => Number(person.trim()))
        .filter((person) => !Number.isNaN(person))
    };
  });

  res.json(parsedThemes);
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
  console.log(`서버 실행 중: ${PORT}`);
});