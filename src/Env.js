/* Env.js
   Single source of truth for the Firefox check, so it isn't re-implemented
   ad hoc in every component that needs it (BottomBar, Root, popups...).

   Firefox is measurably slower than Chromium at a specific set of CSS
   operations this site leans on for its transitions — animating `filter`
   (especially blur) and animating `border-radius` alongside box-shadow are
   the two biggest offenders. Components that hit those paths check this
   flag and take a cheaper code path on Firefox, trading a small cosmetic
   detail for real frame-rate.
*/
export const isFirefox = () =>
  typeof navigator !== 'undefined' &&
  navigator.userAgent.toLowerCase().indexOf('firefox') > -1;