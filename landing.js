/* Guide page: language, install button and the "Don't show this page again" choice. */
(function () {
  var LANG_KEY = 'gst_invoice_lang_v1';          // the same key the app uses, so the language chosen here carries into the app
  var SKIP_KEY = 'invoicegen_skip_guide_v1';
  var params = new URLSearchParams(location.search);

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
  }

  // The address always shows this guide. Only the installed app window goes straight to the app ("?guide=1" still shows the guide there).
  write(SKIP_KEY, null);   // forget the old "don't show again" choice, so nobody stays stuck on the app
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone && !params.has('guide')) {
    location.replace('app.html');
    return;
  }

  var TEXT = {
    en: {
      st1: 'Bytes of your data sent to a server',
      st2: 'Invoice layouts',
      st3: 'Paper sizes, A4 to 58 mm receipt',
      st4: 'Languages: English and Hindi',
      heroBadge: 'Free · Works offline',
      chip1: 'No sign-up',
      chip2: 'Data stays on your computer',
      chip3: 'Works without internet',
      featTitle: 'Everything you need to bill your customers',
      f1Title: 'GST-ready invoices',
      f1Text: 'CGST, SGST and IGST worked out for you, HSN/SAC codes, a UPI QR code and the amount in words.',
      f2Title: 'Customers, items and stock',
      f2Text: 'Keep your customers and items, track stock, set wholesale prices and see what sells best.',
      f3Title: 'Print, PDF and receipts',
      f3Text: 'A4, A5, half page, or 58 and 80 mm thermal receipts. Save as PDF or share on WhatsApp.',
      f4Title: 'English and Hindi',
      f4Text: 'Use the app and print your invoices in English or in Hindi.',
      noInstall: 'No installation',
      stepsSub: 'It takes about two minutes. You only do this once.',
      q1: 'Where is my data stored?',
      q2: 'Does it work without internet?',
      q3: 'Which browsers and devices work?',
      q4: 'How do I back up my data?',
      q5: 'The browser asks for permission again',
      q6: 'Can I use it on another computer?',
      ctaTitle: 'Ready to start?',
      ctaText: 'Install the app or open it in your browser. It takes about two minutes to set up.',
      foot: 'InvoiceGen · Your data never leaves your computer.',
      tagline: 'Offline GST invoicing',
      navFeatures: 'Features',
      navSteps: 'How to start',
      navSample: "Sample data",
      sampleBadge: "Try it first",
      sampleTitle: "Not sure what to add? Try our sample data",
      sampleSub: "Download a ready-made data folder with example customers, items, sellers and bank details. Connect it to the app and see how everything works. All the data is made up.",
      sampleBoxTitle: "What is inside",
      sampleIn1: "5 sample customers",
      sampleIn2: "15 sample items",
      sampleIn3: "5 sample sellers",
      sampleIn4: "2 bank and UPI entries",
      sampleBtn: "Download sample data folder",
      sampleNote: "A small .zip file (about 4 KB).",
      sampleHowTitle: "How to use it",
      sampleH1: "Download the file and <b>unzip it</b>. You get a folder called <b>InvoiceGen-sample-data</b>.",
      sampleH2: "Open the app and press <b>Connect Database</b>. Choose that unzipped folder.",
      sampleH3: "Look through <b>Business &amp; Invoice Setup</b>, <b>Customer Details</b> and <b>Item Details</b> to see how the entries look.",
      sampleH4: "Go to <b>Generate Invoice</b>, pick a sample customer, add a few items and save an invoice.",
      sampleH5: "When you are ready, create a <b>new empty folder</b> and connect that. Your real data starts clean.",
      sampleWarn: "Do not use the sample folder for your real business. The invoices you try out would stay in it.",
      navFaq: 'FAQ',
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
      installed: 'Installed! Open InvoiceGen from your desktop or the Start menu. Then connect your data folder (step 3).',
      installHint: 'The install option is not available right now. The app may already be installed, or this browser does not offer it. Look for the install icon in the address bar of Chrome or Edge, or press “Open app in browser” and use it from here.'
    },
    hi: {
      st1: 'आपके डेटा के बाइट जो किसी सर्वर पर जाते हैं',
      st2: 'इनवॉइस लेआउट',
      st3: 'पेपर साइज़, A4 से 58 mm रसीद तक',
      st4: 'भाषाएँ: अंग्रेज़ी और हिन्दी',
      heroBadge: 'मुफ़्त · बिना इंटरनेट चलता है',
      chip1: 'साइन-अप की ज़रूरत नहीं',
      chip2: 'डेटा आपके कंप्यूटर पर',
      chip3: 'इंटरनेट के बिना भी चलता है',
      featTitle: 'ग्राहकों को बिल देने के लिए सब कुछ',
      f1Title: 'GST के लिए तैयार इनवॉइस',
      f1Text: 'CGST, SGST और IGST अपने-आप, HSN/SAC कोड, UPI QR कोड और राशि शब्दों में।',
      f2Title: 'ग्राहक, आइटम और स्टॉक',
      f2Text: 'ग्राहक और आइटम सँभालिए, स्टॉक देखिए, थोक भाव रखिए और जानिए क्या सबसे ज़्यादा बिकता है।',
      f3Title: 'प्रिंट, PDF और रसीद',
      f3Text: 'A4, A5, आधा पेज या 58 और 80 mm थर्मल रसीद। PDF सेव कीजिए या WhatsApp पर भेजिए।',
      f4Title: 'अंग्रेज़ी और हिन्दी',
      f4Text: 'ऐप चलाइए और अपने इनवॉइस अंग्रेज़ी या हिन्दी में छापिए।',
      noInstall: 'इंस्टॉल की ज़रूरत नहीं',
      stepsSub: 'लगभग दो मिनट लगते हैं। यह सिर्फ़ एक बार करना होता है।',
      q1: 'मेरा डेटा कहाँ सेव होता है?',
      q2: 'क्या यह इंटरनेट के बिना चलता है?',
      q3: 'कौन-से ब्राउज़र और डिवाइस चलते हैं?',
      q4: 'अपने डेटा का बैकअप कैसे लूँ?',
      q5: 'ब्राउज़र दोबारा अनुमति माँगे तो क्या करें?',
      q6: 'क्या मैं इसे दूसरे कंप्यूटर पर चला सकता हूँ?',
      ctaTitle: 'शुरू करने के लिए तैयार?',
      ctaText: 'ऐप इंस्टॉल कीजिए या ब्राउज़र में खोलिए। सेटअप में लगभग दो मिनट लगते हैं।',
      foot: 'InvoiceGen · आपका डेटा आपके कंप्यूटर से बाहर नहीं जाता।',
      tagline: 'बिना इंटरनेट GST इनवॉइस',
      navFeatures: 'सुविधाएँ',
      navSteps: 'शुरू कैसे करें',
      navSample: "नमूना डेटा",
      sampleBadge: "पहले आज़माएँ",
      sampleTitle: "समझ नहीं आ रहा क्या भरें? हमारा नमूना डेटा आज़माएँ",
      sampleSub: "उदाहरण वाले ग्राहक, आइटम, विक्रेता और बैंक विवरण वाला तैयार डेटा फ़ोल्डर डाउनलोड करें। इसे ऐप से जोड़ें और देखें कि सब कैसे चलता है। सारा डेटा काल्पनिक है।",
      sampleBoxTitle: "इसमें क्या है",
      sampleIn1: "5 नमूना ग्राहक",
      sampleIn2: "15 नमूना आइटम",
      sampleIn3: "5 नमूना विक्रेता",
      sampleIn4: "2 बैंक और UPI एंट्री",
      sampleBtn: "नमूना डेटा फ़ोल्डर डाउनलोड करें",
      sampleNote: "एक छोटी .zip फ़ाइल (लगभग 4 KB)।",
      sampleHowTitle: "इसे कैसे इस्तेमाल करें",
      sampleH1: "फ़ाइल डाउनलोड करें और उसे <b>unzip करें</b>। आपको <b>InvoiceGen-sample-data</b> नाम का फ़ोल्डर मिलेगा।",
      sampleH2: "ऐप खोलें और <b>Connect Database</b> दबाएँ। वही unzip किया हुआ फ़ोल्डर चुनें।",
      sampleH3: "<b>Business &amp; Invoice Setup</b>, <b>Customer Details</b> और <b>Item Details</b> देखें कि एंट्री कैसी दिखती हैं।",
      sampleH4: "<b>Generate Invoice</b> में जाएँ, एक नमूना ग्राहक चुनें, कुछ आइटम जोड़ें और इनवॉइस सेव करें।",
      sampleH5: "तैयार होने पर एक <b>नया खाली फ़ोल्डर</b> बनाएँ और उसे जोड़ें। आपका असली डेटा साफ़ शुरू होगा।",
      sampleWarn: "नमूना फ़ोल्डर को अपने असली व्यापार के लिए इस्तेमाल न करें। आज़माए हुए इनवॉइस उसी में रह जाएँगे।",
      navFaq: 'सवाल-जवाब',
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
      button.classList.toggle('btn-primary', button.dataset.lang === lang);
      button.classList.toggle('btn-ghost', button.dataset.lang !== lang);
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
    // Chrome can move this very page into the new app window. Then it must go to the app, not stay on the guide.
    setTimeout(goToAppIfInstalledWindow, 600);
    setTimeout(goToAppIfInstalledWindow, 2000);
  });

  // The guide opened in a normal tab and was then turned into the installed app window: switch to the app.
  function goToAppIfInstalledWindow() {
    var isApp = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    if (isApp && !params.has('guide')) location.replace('app.html');
  }
  if (window.matchMedia) {
    var displayQuery = matchMedia('(display-mode: standalone)');
    if (displayQuery.addEventListener) displayQuery.addEventListener('change', goToAppIfInstalledWindow);
  }

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

    document.querySelectorAll('[data-install]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!deferredInstall) { showStatus('installHint'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        deferredInstall.prompt();
        deferredInstall.userChoice.then(function (choice) {
          deferredInstall = null;
          if (choice && choice.outcome === 'accepted') { showStatus('installed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        }).catch(function () { /* closed without choosing */ });
      });
    });
  });
})();
