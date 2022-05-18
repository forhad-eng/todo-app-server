const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded
        next()
    })
}

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

        app.get('/task', verifyJWT, async (req, res) => {
            const email = req.decoded.email
            const result = await taskCollection.find({ email }).toArray()
            res.send({ success: true, result })
        })

        app.post('/task', verifyJWT, async (req, res) => {
            const task = req.body
            const result = await taskCollection.insertOne(task)
            if (result.insertedId) {
                res.send({ success: true, message: `${task.taskName} is added successfully` })
            }
        })

        app.patch('/task/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    complete: true
                }
            }
            const result = await taskCollection.updateOne(filter, updatedDoc)
            if (result.modifiedCount) {
                res.send({ success: true, message: 'Congrats for completing!' })
            }
        })

        app.delete('/task/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await taskCollection.deleteOne(filter)
            if (result.deletedCount) {
                res.send({ success: true, message: 'Deleted successfully!' })
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
