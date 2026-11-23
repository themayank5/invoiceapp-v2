/* Guide page: language, install button and the "Don't show this page again" choice. */
(function () {
  var LANG_KEY = 'gst_invoice_lang_v1';          // the same key the app uses, so the language chosen here carries into the app
  var SKIP_KEY = 'invoicegen_skip_guide_v1';
  var params = new URLSearchParams(location.search);

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
  }

  // The installed app, or someone who ticked "don't show again", goes straight to the app. "?guide=1" always shows this page.
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if ((standalone || read(SKIP_KEY) === '1') && !params.has('guide')) {
    location.replace('app.html');
    return;
  }

  var TEXT = {
    en: {
      tagline: 'Offline GST invoice app',
      heroTitle: 'GST invoices that work offline',
      heroText: 'Make GST invoices, quotations and receipts on your own computer. Your customers, items and invoices are saved in a folder you choose, never on a server. It keeps working without internet.',
      btnInstall: 'Install app',
      btnOpen: 'Open app in browser',
      needs: 'Needs Chrome or Edge on a laptop or desktop computer.',
      waysTitle: 'Two ways to use it',
      recommended: 'Recommended',
      installTitle: 'Install it on your computer',
      installText: 'You get a desktop icon and the app opens in its own window. It also starts without internet, and new versions arrive by themselves.',
      browserTitle: 'Or just use it in the browser',
      browserText: 'Nothing to install. Press “Open app in browser” and do everything from here. You get the same features.',
      stepsTitle: 'Get started in 4 steps',
      s1Title: 'Install the app (optional)',
      s1Text: 'Press “Install app” above and confirm when the browser asks. If you do not want to install it, go to the next step and open the app in the browser.',
      s2Title: 'Create your data folder',
      s2Text: 'On your computer, create a new empty folder anywhere, for example <b>Documents\\InvoiceGen-data</b>. All your customers, items and invoices will be saved in this folder.',
      s3Title: 'Connect the folder to the app',
      s3Text: 'Open the app and press <b>Connect Database</b>. Choose your folder and allow access when the browser asks. An empty folder is fine: the app creates its own files in it.',
      s4Title: 'Add your business details',
      s4Text: 'Open <b>Business &amp; Invoice Setup</b> and fill in Seller Info, Bank &amp; UPI and Terms. Then add your customers and items and create your first invoice.',
      goodTitle: 'Good to know',
      g1: 'Your data stays on your computer. Nothing is uploaded to the internet.',
      g2: 'After the first visit the app works without internet. A new version arrives by itself when you are online.',
      g3: 'It works only in Chrome or Edge, because they can read and write a folder on your computer. It does not work on phones.',
      g4: 'Your folder is the only copy of your data. Back it up regularly. The app also has Backup &amp; Restore.',
      g5: 'If the browser asks for permission again, press Connect Database and choose the same folder. Your data is safe.',
      g6: 'The installed app and the browser version can use the same folder. To use it on another computer, install the app there and copy your folder across.',
      skip: 'Don’t show this page again (go straight to the app)',
      installed: 'Installed! Open InvoiceGen from your desktop or the Start menu. Then connect your data folder (step 3).',
      installHint: 'The install option is not available right now. The app may already be installed, or this browser does not offer it. Look for the install icon in the address bar of Chrome or Edge, or press “Open app in browser” and use it from here.'
    },
    hi: {
      tagline: 'बिना इंटरनेट चलने वाला GST इनवॉइस ऐप',
      heroTitle: 'बिना इंटरनेट चलने वाले GST इनवॉइस',
      heroText: 'अपने कंप्यूटर पर GST इनवॉइस, कोटेशन और रसीदें बनाइए। आपके ग्राहक, आइटम और इनवॉइस आपके चुने हुए फ़ोल्डर में सेव होते हैं, किसी सर्वर पर नहीं। इंटरनेट के बिना भी चलता रहता है।',
      btnInstall: 'ऐप इंस्टॉल करें',
      btnOpen: 'ब्राउज़र में ऐप खोलें',
      needs: 'लैपटॉप या डेस्कटॉप कंप्यूटर पर Chrome या Edge चाहिए।',
      waysTitle: 'इसे इस्तेमाल करने के दो तरीके',
      recommended: 'सुझाया गया',
      installTitle: 'इसे अपने कंप्यूटर पर इंस्टॉल करें',
      installText: 'डेस्कटॉप पर आइकन मिलता है और ऐप अपनी अलग विंडो में खुलता है। यह इंटरनेट के बिना भी चालू हो जाता है, और नए वर्ज़न अपने-आप आ जाते हैं।',
      browserTitle: 'या सीधे ब्राउज़र में इस्तेमाल करें',
      browserText: 'कुछ इंस्टॉल करने की ज़रूरत नहीं। “ब्राउज़र में ऐप खोलें” दबाइए और सारे काम यहीं कीजिए। सुविधाएँ वही मिलती हैं।',
      stepsTitle: 'शुरू करने के 4 आसान कदम',
      s1Title: 'ऐप इंस्टॉल करें (वैकल्पिक)',
      s1Text: 'ऊपर “ऐप इंस्टॉल करें” दबाइए और ब्राउज़र के पूछने पर पुष्टि कीजिए। इंस्टॉल नहीं करना चाहते तो अगले कदम पर जाइए और ऐप को ब्राउज़र में खोलिए।',
      s2Title: 'अपना डेटा फ़ोल्डर बनाइए',
      s2Text: 'अपने कंप्यूटर में कहीं भी एक नया खाली फ़ोल्डर बनाइए, जैसे <b>Documents\\InvoiceGen-data</b>। आपके सारे ग्राहक, आइटम और इनवॉइस इसी फ़ोल्डर में सेव होंगे।',
      s3Title: 'फ़ोल्डर को ऐप से जोड़िए',
      s3Text: 'ऐप खोलिए और <b>Connect Database</b> (डेटाबेस जोड़ें) दबाइए। अपना फ़ोल्डर चुनिए और ब्राउज़र के पूछने पर अनुमति दीजिए। खाली फ़ोल्डर भी चलेगा: ऐप उसमें अपनी फ़ाइलें खुद बना लेता है।',
      s4Title: 'अपने व्यवसाय की जानकारी भरिए',
      s4Text: '<b>Business &amp; Invoice Setup</b> खोलिए और Seller Info, Bank &amp; UPI और Terms भरिए। फिर अपने ग्राहक और आइटम जोड़िए और पहला इनवॉइस बनाइए।',
      goodTitle: 'ज़रूरी बातें',
      g1: 'आपका डेटा आपके कंप्यूटर पर ही रहता है। इंटरनेट पर कुछ भी अपलोड नहीं होता।',
      g2: 'पहली बार खोलने के बाद ऐप इंटरनेट के बिना चलता है। इंटरनेट मिलने पर नया वर्ज़न अपने-आप आ जाता है।',
      g3: 'यह सिर्फ़ Chrome या Edge में चलता है, क्योंकि कंप्यूटर का फ़ोल्डर पढ़ने-लिखने की सुविधा इन्हीं में है। फ़ोन पर यह नहीं चलता।',
      g4: 'आपका फ़ोल्डर ही आपके डेटा की एकमात्र कॉपी है। उसका नियमित बैकअप रखिए। ऐप में Backup &amp; Restore भी है।',
      g5: 'अगर ब्राउज़र दोबारा अनुमति माँगे, तो Connect Database दबाकर वही फ़ोल्डर फिर चुन लीजिए। आपका डेटा सुरक्षित रहता है।',
      g6: 'इंस्टॉल किया हुआ ऐप और ब्राउज़र वाला ऐप एक ही फ़ोल्डर इस्तेमाल कर सकते हैं। दूसरे कंप्यूटर पर चलाने के लिए वहाँ ऐप इंस्टॉल कीजिए और अपना फ़ोल्डर कॉपी कर लीजिए।',
      skip: 'यह पेज दोबारा न दिखाएँ (सीधे ऐप खोलें)',
      installed: 'इंस्टॉल हो गया! InvoiceGen को डेस्कटॉप या Start मेनू से खोलिए। फिर अपना डेटा फ़ोल्डर जोड़िए (कदम 3)।',
      installHint: 'इंस्टॉल का विकल्प अभी उपलब्ध नहीं है। हो सकता है ऐप पहले से इंस्टॉल हो, या यह ब्राउज़र इसे न देता हो। Chrome या Edge के एड्रेस बार में इंस्टॉल आइकन देखिए, या “ब्राउज़र में ऐप खोलें” दबाकर यहीं से इस्तेमाल कीजिए।'
    }
  };

  var lang = read(LANG_KEY) === 'hi' ? 'hi' : 'en';
  var deferredInstall = null;

  function showStatus(key) {
    var box = document.getElementById('installStatus');
    if (!box) return;
    box.dataset.key = key;
    box.innerHTML = TEXT[lang][key];
    box.hidden = false;
  }

  function applyLanguage(code) {
    lang = code === 'hi' ? 'hi' : 'en';
    write(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (element) {
      var value = TEXT[lang][element.dataset.t];
      if (value !== undefined) element.innerHTML = value;
    });
    document.querySelectorAll('[data-lang]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.lang === lang);
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
    var status = document.getElementById('installStatus');
    if (status && !status.hidden && status.dataset.key) status.innerHTML = TEXT[lang][status.dataset.key];
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstall = event;
  });
  window.addEventListener('appinstalled', function () {
    deferredInstall = null;
    showStatus('installed');
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline start is optional */ });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyLanguage(lang);
    document.querySelectorAll('[data-lang]').forEach(function (button) {
      button.addEventListener('click', function () { applyLanguage(button.dataset.lang); });
    });

    var skip = document.getElementById('skipGuide');
    skip.checked = read(SKIP_KEY) === '1';
    skip.addEventListener('change', function () { write(SKIP_KEY, skip.checked ? '1' : null); });

    document.getElementById('btnInstall').addEventListener('click', function () {
      if (!deferredInstall) { showStatus('installHint'); return; }
      deferredInstall.prompt();
      deferredInstall.userChoice.then(function (choice) {
        deferredInstall = null;
        if (choice && choice.outcome === 'accepted') showStatus('installed');
      }).catch(function () { /* closed without choosing */ });
    });
  });
})();
