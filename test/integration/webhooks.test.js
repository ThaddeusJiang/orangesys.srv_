import stripe from 'stripe'
import axios from 'axios'
import assert from 'power-assert'
import { merge } from 'lodash/object'
import { trialEndTimestamp } from '../../src/core/customer'
import testData from './event_data/invoice.created'

const STRIPE_TEST_CUSTOMER_ID = process.env.STRIPE_TEST_CUSTOMER_ID || 'cus_9XvY3G2GRXjJ4c'
const STRIPE_TEST_WEBHOOK_URL = process.env.STRIPE_TEST_WEBHOOK_URL
  || 'https://127.0.0.1:5001/webhooks'
const STRIPE_TEST_PLAN_ID = process.env.STRIPE_TEST_PLAN_ID || 'test-plan1'

console.log('STRIPE_TEST_CUSTOMER_ID:', STRIPE_TEST_CUSTOMER_ID)
console.log('STRIPE_TEST_WEBHOOK_URL:', STRIPE_TEST_WEBHOOK_URL)
console.log('STRIPE_TEST_PLAN_ID:', STRIPE_TEST_PLAN_ID)

const stripeApi = stripe(process.env.STRIPE_TEST_SECRET_KEY)

describe('webhook: invoice.created', () => {
  let customer = null
  let subscription = null
  let invoice = null
  let invoiceItem = null
  before((done) => {
    const retriveCustomer = () => (
      new Promise((resolve, reject) => {
        stripeApi.customers.retrieve(STRIPE_TEST_CUSTOMER_ID, (e, existingCustomer) => {
          if (e) { reject(e); return }
          customer = existingCustomer;
          resolve(customer);
        })
      })
    )
    const subscribe = () => (
      new Promise((resolve, reject) => {
        stripeApi.subscriptions.create({
          customer: customer.id,
          plan: STRIPE_TEST_PLAN_ID,
          tax_percent: 8,
          trial_end: trialEndTimestamp(),
        }, (err, result) => {
          if (err) { reject(err); return }
          subscription = result
          console.log(`new subscription. ${subscription.id}`)
          resolve(subscription)
        })
      })
    )
    const addInvoiceItem = () => (
      new Promise((resolve, reject) => {
        stripeApi.invoiceItems.create({
          customer: customer.id,
          subscription: subscription.id,
          currency: 'jpy',
          amount: 50000,
        }, (err, result) => {
          if (err) { reject(err); return }
          invoiceItem = result
          console.log(`new invoiceItem. ${invoiceItem.id}`)
          resolve(invoiceItem)
        })
      })
    )
    const createInvoice = () => (
      new Promise((resolve, reject) => {
        stripeApi.invoices.create({
          customer: customer.id,
          // subscription: subscription.id,
          // date: trialEndTimestamp(),
        }, (err, result) => {
          if (err) { reject(err); return }
          invoice = result
          console.log(`new invoice. ${invoice.id}`)
          resolve(invoice)
        })
      })
    )
    retriveCustomer()
      .then(subscribe)
      .then(addInvoiceItem)
      .then(createInvoice)
      .then(() => done())
      .catch(err => done(err))
  })

  it('works', (done) => {
    const eventData = merge(testData, {
      data: {
        object: {
          id: invoice.id,
          date: trialEndTimestamp(),
          customer: customer.id,
          subscription: subscription.id,
        },
      },
    })
    eventData.data.object.lines.data[0].id = invoiceItem.id
    eventData.data.object.lines.data[0].plan.id = STRIPE_TEST_PLAN_ID
    axios.post(STRIPE_TEST_WEBHOOK_URL, eventData)
      .then((res) => {
        assert(res.status === 200)
        done()
      })
      .catch(err => done(err))
  })

  after((done) => {
    const removeSubscription = () => (
      new Promise((resolve, reject) => {
        stripeApi.subscriptions.del(subscription.id, (err) => {
          if (err) { reject(err); return; }
          console.log('cancel subscription:', subscription.id)
          resolve()
        })
      })
    )
    const closeInvoice = () => (
      new Promise((resolve, reject) => {
        stripeApi.invoices.update(invoice.id, { closed: true }, (err) => {
          if (err) { reject(err); return; }
          console.log('close invoice:', invoice.id)
          resolve()
        })
      })
    )
    closeInvoice()
      .then(removeSubscription)
      .then(() => done())
      .catch(err => done(err))
  })
})
