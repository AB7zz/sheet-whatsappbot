import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express();

app.use(cors({origin: '*',credentials: true}))

app.use(express.json({extended: true}))

app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});