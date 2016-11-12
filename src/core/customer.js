import stripe from 'stripe'
import moment from 'moment'
import { round } from 'lodash/math'
import plans from '../plans'

const getCurrentTime = () => moment().utcOffset('+09:00')



export const trialEndTimestamp = (currentTime = getCurrentTime()) => (
  currentTime.utcOffset('+09:00')
    .add(1, 'month')
    .set('date', 1)
    .set('hour', 11)
    .set('minute', 0)
    .set('second', 0)
    .unix()
)

export default class Customer {
  constructor(stripeSecretKey, token) {
    this.stripe = stripe(stripeSecretKey)
    this.token = token
  }
  create({ email, uid }) {
    return new Promise((resolve, reject) => {
      this.stripe.customers.create({
        source: this.token,
        email,
        metadata: {
          uid,
        },
      }, (err, customer) => {
        if (err) { reject(err); return }
        resolve(customer)
      })
    })
  }


  subscribe(customer, planId) {
    return new Promise((resolve, reject) => {
      this.stripe.subscriptions.create({
        customer: customer.id,
        plan: planId,
        trial_end: trialEndTimestamp(),
      }, (err, subscription) => {
        if (err) { reject(err); return }
        resolve(subscription)
      })
    })
  }
}
