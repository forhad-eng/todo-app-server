const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sacor.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

async function run() {
    try {
        await client.connect()
        const taskCollection = client.db('todoDb').collection('tasks')
        const userCollection = client.db('todoDb').collection('users')

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: user
            }
            const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            if (result) {
                res.send({ success: true, accessToken })
            }
        })
    } finally {
    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Todo App server is running!')
})

app.listen(port, () => {
    console.log('Listening to port', port)
})
