/* Contact.js
   Keeps the email address out of the source/built JS as a literal string,
   so basic scrapers that grep source or rendered HTML for an "@...com"
   pattern won't find it. This is NOT real security — anyone who actually
   runs this JS can decode it in two seconds — but it stops the dumb,
   high-volume regex harvesters that make up most spam scraping, without
   changing anything a real visitor sees or does.

   To update the email later: change the string in `toCodes`, run it once
   (e.g. in a browser console), and paste the resulting array back in here.
*/

// toCodes("akrammunirawel@gmail.com") -> the array below
const EMAIL_CODES = [
  97, 107, 114, 97, 109, 109, 117, 110, 105, 114, 97, 119, 101, 108,
  64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
];

export const getEmail = () => String.fromCharCode(...EMAIL_CODES);

export const getMailtoHref = (subject) => {
  const email = getEmail();
  return subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
};