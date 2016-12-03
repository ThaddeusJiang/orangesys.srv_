import Express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { customer, webhook } from './handlers'
import https from 'https'
import pem from 'pem'

const PORT = process.env.PORT || 5001

const app = new Express()
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello'))
app.post('/customers', customer.create)
app.post('/webhooks', webhook.handle)

pem.createCertificate({days:365, selfSigned:true}, function(err, keys){
  https.createServer({key: keys.serviceKey, cert: keys.certificate}, app).listen(PORT, () => {
    console.log(`app listening on port ${PORT}!`) // eslint-disable-line no-console
  })
})
