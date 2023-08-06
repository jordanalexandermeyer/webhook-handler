const express = require("express")
const app = express()
const port = process.env.PORT || 3001

app.use(express.json())

// GET endpoint for subscription verification
app.get("/", (req, res) => {
  const { "hub.mode": mode, "hub.verify_token": verifyToken } = req.query

  // Verify the subscription using the verify token from the environment
  if (mode === "subscribe" && verifyToken === process.env.VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"])
  } else {
    res.sendStatus(403) // Return 403 Forbidden for invalid subscription verification
  }
})

// POST endpoint to process incoming messages
app.post("/", async function (req, res) {
  try {
    const body = req.body
    console.log("Request body:", body)

    const messages = extractTextMessagesFromBody(body)

    for (const message of messages) {
      const text = message.text.body
      const sender = message.from

      const response = await queryStackFlow({ "in-0": text })
      // Send the response from the Stack Flow to WhatsApp
      await sendWhatsAppMessage(sender, response)
    }

    res.sendStatus(200) // Return 200 OK for successful processing
  } catch (error) {
    console.error("Error:", error)
    res.sendStatus(500) // Return 500 Internal Server Error for any processing errors
  }
})

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
)

server.keepAliveTimeout = 120 * 1000
server.headersTimeout = 120 * 1000

async function queryStackFlow(data) {
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
  console.log("Stack Result:", result)
  return result["out-0"]
}

async function sendWhatsAppMessage(recipient, message) {
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
        to: recipient,
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
  console.log("WhatsApp Result:", result)
  return result
}

function extractTextMessagesFromBody(payload) {
  const valueObject = payload.entry[0]?.changes[0]?.value

  if (!valueObject || !valueObject.messages) {
    return [] // Return an empty array if there are no messages in the payload
  }

  const messagesArray = valueObject.messages
  const textMessages = []

  messagesArray.forEach((message) => {
    if (message.type === "text") {
      textMessages.push(message)
    }
  })

  return textMessages
}
