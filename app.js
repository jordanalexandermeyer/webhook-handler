const express = require("express")
const app = express()
const port = process.env.PORT || 3001

app.use(express.json())

app.get("/", (req, res) => {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == "verify_token"
  ) {
    res.send(req.query["hub.challenge"])
  } else {
    res.sendStatus(400)
  }
})

app.post("/", function (req, res) {
  console.log("Request body:", req.body)

  const body = req.body

  // call stack API with body
  // send to WhatsApp
  res.sendStatus(200)
})

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
)

server.keepAliveTimeout = 120 * 1000
server.headersTimeout = 120 * 1000
