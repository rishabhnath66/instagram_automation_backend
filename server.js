const express = require('express')
const middleware=require('./src/middleware/middleware')
const indexRoute=require('./src/routes/index')
const userRoute=require('./src/routes/userRoute')
const socialRoute=require('./src/routes/socialRoute')
const connectdb=require('./src/services/dbconnection')
require('dotenv').config();
const app = express();
connectdb()
app.use(express.json({limit : '5mb'}));
app.use(express.urlencoded({ extended: false }));
app.use("/auth",indexRoute)
app.use("/user",middleware.checkAuth,userRoute)
app.use("/social",middleware.checkAuth,socialRoute)

app.listen(process.env.PORT,()=>{
    console.log("start server")
})