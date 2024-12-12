require('dotenv').config();
const express = require('express')
const cors = require('cors')
const middleware = require('./src/middleware/middleware')
const indexRoute = require('./src/routes/index')
const userRoute = require('./src/routes/userRoute')
const postRoute = require('./src/routes/postRoute')
const connectdb = require('./src/services/dbconnection');
const OPEN_AI = require('./src/helper/openai');
require('./src/jobs/cron')

const app = express();
connectdb()
OPEN_AI.connectapikey()
app.use(cors())
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));
app.use("/auth", indexRoute)
app.use("/user", middleware.checkAuth, userRoute)
app.use("/post", middleware.checkAuth, postRoute)
app.listen(process.env.PORT, () => {
    console.log("start server")
})