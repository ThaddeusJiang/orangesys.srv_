import Express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { customer, webhook } from './handlers'

const PORT = process.env.PORT || 5001
const API_PREFIX = '/stripe'

const app = new Express()
app.use(cors())
app.use(bodyParser.json())
app.get('/', (req, res) => res.send('ok'))
app.post(`${API_PREFIX}/customers`, customer.create)
app.post(`${API_PREFIX}/webhooks`, webhook.handle)

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}!`) // eslint-disable-line no-console
})
