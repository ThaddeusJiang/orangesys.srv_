import Customer from '../core/customer'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

export const create = (req, res) => {
  const { body } = req
  if (!body) {
    res.writeHead(400)
    res.end('body is empty.')
    return
  }
  const { token, planId, uid, email } = body
  if (!token || !planId || !uid || !email) {
    res.writeHead(400)
    res.end('params are missing (token, planId, uid, email).')
    return
  }
  const customer = new Customer(STRIPE_SECRET_KEY, token)
  let customerData = null
  customer
    .create({ email, uid })
    .then((result) => {
      customerData = result
      return customer.subscribe(customerData, planId)
    })
    .then(subscription => (
      res.end(JSON.stringify({
        customerId: customer.id,
        subscriptionId: subscription.id,
      }))
    ))
    .catch((err) => {
      res.writeHead(400, { 'Content-Type': 'text/json' })
      const errorData = err.raw
      console.error('error:', errorData, 'body:', body) // eslint-disable-line no-console
      res.end(JSON.stringify(errorData))
    })
}
