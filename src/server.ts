import express from 'express'
import cors from 'cors';
import bodyParser from 'body-parser';
import connectToMongo from './db/connection';

connectToMongo()
const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(8080,()=>{
  console.log('Server running!!!')
})