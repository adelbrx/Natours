/* eslint-disable */
import axios from 'axios';
const stripe = Stripe(
  'pk_test_51Ol6tBHzWQqdrT01h5GpwOmhrkabM9HuOOFptiZoyMGBvoDDUzE9xud2mmhydGebzXijCgXJqpcvTWBawqbUBChI00zCq8IbJ3'
);

export const bookTour = async (tourID) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/booking/checkout-session/${tourID}`
    );
    console.log(session.data.session.id);
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (error) {
    console.log(error);
  }
};
