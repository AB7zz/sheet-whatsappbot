import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'

const app = express();

app.use(cors({origin: '*',credentials: true}))

app.use(express.json({extended: true}))

app.use('/api', routes);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});