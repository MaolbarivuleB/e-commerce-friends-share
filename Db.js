const  mongoose = require("mongoose")

const MONGODB_URL = process.env.MONGODB_URL

mongoose.connect(MONGODB_URL)
.then(() =>  {
  console.log ("MongoDB connected......")
})

  app .listen (PORT, ()=> {

    console.log(`server is runnning  on port $(PORT)`)
  })




 