/* App screens: show credits (or a Log in button) in the header, from what the website pages reported. */
(function () {
  var slot = document.querySelector('.hdr-right');
  if (!slot) return;
  var acc = { loggedIn: '', credits: '' };
  try { if (window.DSNative && DSNative.getAccount) acc = JSON.parse(DSNative.getAccount()); } catch (e) { }
  var a = document.createElement('a');
  if (acc.loggedIn === '1' && acc.credits) {
    a.className = 'cr-chip'; a.href = 'https://designstager.com/pricing/';
    a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z"/></svg>' + acc.credits + ' cr';
  } else if (acc.loggedIn !== '1') {
    a.className = 'cr-chip login'; a.href = 'https://designstager.com/login'; a.textContent = 'Log in';
  } else return;
  slot.insertBefore(a, slot.firstChild);
})();
