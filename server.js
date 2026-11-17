"use strict";

const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

const apiHandlers = {
  kundli: require("./api/kundli"),
  consultation: require("./api/consultation"),
  gochar: require("./api/gochar"),
  panchang: require("./api/panchang")
};

app.all("/api/:name", async (req, res) => {
  const handler = apiHandlers[req.params.name];
  if (!handler) {
    return res.status(501).json({
      success: false,
      message: "यह सर्वर सुविधा अभी कॉन्फ़िगर नहीं हुई है।"
    });
  }
  try {
    await handler(req, res);
  } catch (error) {
    console.error("API error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success:false, message:"सर्वर में समस्या आई।" });
    }
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log("Astro Bhagya Vidhata running on http://localhost:" + port);
});