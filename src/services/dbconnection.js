const mongoose = require('mongoose');

const connectdb=()=>{
  return new Promise((res,rej)=>{
    
    mongoose.connect(process.env.DB_URL)
    .then(() => {
      console.log('Connected!')
      res()
    },(error)=>{
      console.log({error})
      setTimeout(() => {
        console.log('connecting ')
        res(connectdb())
      }, 5000);
    });
  })

}

module.exports=connectdb