const mongoose = require('mongoose');

const connectdb=()=>{
  mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log('Connected!')
  },(error)=>{
    setTimeout(() => {
      connectdb()
    }, 1000);
  });
}

module.exports=connectdb