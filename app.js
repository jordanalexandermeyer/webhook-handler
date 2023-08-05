const express = require("express")
const app = express()
const port = process.env.PORT || 3001

app.use(express.json())

app.get("/", (req, res) => {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == process.env.VERIFY_TOKEN
  ) {
    res.send(req.query["hub.challenge"])
  } else {
    res.sendStatus(400)
  }
})

app.post("/", async function (req, res) {
  console.log("Request body:", req.body)

  const message = req.body.entry[0].changes[0].value.messages[0].text.body
  const from = req.body.entry[0].changes[0].value.messages[0].from

  // call stack API with body
  const response = await query({
    "in-0": `${message}`,
  })
  // send to WhatsApp
  await sendMessage(from, response)

  res.sendStatus(200)
})

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
)

server.keepAliveTimeout = 120 * 1000
server.headersTimeout = 120 * 1000

async function query(data) {
  const response = await fetch(
    "https://www.stack-inference.com/run_deployed_flow?flow_id=64cebfa6b70f18a5120529ee&org=8c70046d-ca37-4ea1-a615-f4e81a0099c6",
    {
      headers: {
        Authorization: `Bearer ${process.env.STACK_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    }
  )

  const result = await response.json()
  console.log("Stack Result: ", result)
  return result
}

async function sendMessage(to, message) {
  const response = await fetch(
    "https://graph.facebook.com/v17.0/116747901506573/messages",
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          // the text object
          preview_url: false,
          body: message,
        },
      }),
    }
  )
  const result = await response.json()
  console.log("WhatsApp Result: ", result)
  return result
}
