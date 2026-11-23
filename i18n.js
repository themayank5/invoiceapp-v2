/* ============================================================
   Languages (English is the default; Hindi is the first extra language)

   - One language setting drives two things:
       1. the app screens (menus, buttons, tables, messages), and
       2. the printed invoice / quotation (its labels, amount in words, dates, state names).
   - The language used for a document is saved inside it (invoice.lang), so an invoice made in Hindi
     always prints in Hindi, whatever the app is set to later.
   - App screens are translated by looking up the English text in the dictionary below. Anything that is
     not in the dictionary (for example your own customer names) is left exactly as typed.
   - To add another language later: add an entry to LANGUAGES and a dictionary like HI.
   ============================================================ */
const LANGUAGES = [['en', 'English'], ['hi', 'हिन्दी']];
const LANG_KEY = 'gst_invoice_lang_v1';

function loadUiLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGUAGES.some(([code]) => code === saved)) return saved;
  } catch { /* storage blocked: stay with English */ }
  return 'en';
}
let uiLang = loadUiLang();
document.documentElement.lang = uiLang;

/* ---------- Hindi dictionary (English text -> Hindi) ---------- */
const HI = {
  /* ----- invoice / quotation document ----- */
  'TAX INVOICE': 'कर चालान',
  'QUOTATION': 'कोटेशन',
  'ORIGINAL FOR RECIPIENT': 'प्राप्तकर्ता के लिए मूल प्रति',
  'DUPLICATE FOR TRANSPORTER': 'परिवहनकर्ता के लिए दूसरी प्रति',
  'TRIPLICATE FOR SUPPLIER': 'आपूर्तिकर्ता के लिए तीसरी प्रति',
  'Invoice No': 'चालान संख्या',
  'Invoice Date': 'चालान दिनांक',
  'Quotation No': 'कोटेशन संख्या',
  'Quotation Date': 'कोटेशन दिनांक',
  'Valid Until': 'मान्य तिथि तक',
  'Place of Supply': 'आपूर्ति का स्थान',
  'Due Date': 'देय तिथि',
  'Customer Details:': 'ग्राहक विवरण:',
  'Address:': 'पता:',
  'Phone:': 'फ़ोन:',
  'Ph:': 'फ़ोन:',
  'Mobile:': 'मोबाइल:',
  'Email:': 'ईमेल:',
  'GSTIN:': 'GSTIN:',
  'Shipping address:': 'डिलीवरी का पता:',
  'Bank Details:': 'बैंक विवरण:',
  'Bank:': 'बैंक:',
  'Account #:': 'खाता संख्या:',
  'IFSC:': 'IFSC:',
  'Branch:': 'शाखा:',
  'Pay using UPI:': 'UPI से भुगतान करें:',
  'Authorized Signatory': 'अधिकृत हस्ताक्षरकर्ता',
  'For': 'के लिए',
  'Terms and Conditions:': 'नियम एवं शर्तें:',
  'Item': 'वस्तु',
  'HSN/SAC': 'HSN/SAC',
  'Rate': 'दर',
  'Qty': 'मात्रा',
  'Value': 'मूल्य',
  'Tax Amount': 'कर राशि',
  'Total Amount': 'कुल राशि',
  'Taxable Amount': 'कर योग्य राशि',
  'Total': 'कुल',
  'Round off': 'राउंड ऑफ',
  'Total amount (in words):': 'कुल राशि (शब्दों में):',
  'Page': 'पृष्ठ',
  'This is a digitally signed document.': 'यह डिजिटल रूप से हस्ताक्षरित दस्तावेज़ है।',
  'This is a quotation, not a tax invoice.': 'यह कोटेशन है, कर चालान नहीं।',
  'IGST': 'IGST',
  'CGST': 'CGST',
  'SGST': 'SGST',

  /* ----- sidebar and page titles ----- */
  'Invoice Generator': 'चालान जनरेटर',
  'Get Free GST Invoice': 'मुफ़्त GST चालान बनाएँ',
  'Workspace': 'कार्यक्षेत्र',
  'Generate Invoice': 'चालान बनाएँ',
  'View All Invoices': 'सभी चालान देखें',
  'Customer Management': 'ग्राहक प्रबंधन',
  'Customer Details': 'ग्राहक विवरण',
  'Item Management': 'वस्तु प्रबंधन',
  'Item Details': 'वस्तु विवरण',
  'Settings': 'सेटिंग्स',
  'Business & Invoice Setup': 'व्यवसाय एवं चालान सेटअप',
  'Seller Info': 'विक्रेता की जानकारी',
  'Invoice Details': 'चालान विवरण',
  'Bank & UPI': 'बैंक एवं UPI',
  'Terms & Conditions': 'नियम एवं शर्तें',
  'Signature': 'हस्ताक्षर',
  'Invoice Templates': 'चालान टेम्पलेट',
  'Backup & Restore': 'बैकअप एवं रीस्टोर',
  'Business Setup': 'व्यवसाय सेटअप',
  'Database': 'डेटाबेस',
  'Not connected': 'जुड़ा नहीं है',
  'Connect Database': 'डेटाबेस जोड़ें',
  'Connected': 'जुड़ा हुआ',
  'Disconnect Database': 'डेटाबेस हटाएँ',
  'Reset Invoice': 'चालान रीसेट करें',
  'Tax Invoice Preview': 'कर चालान पूर्वावलोकन',
  'Quotation Preview': 'कोटेशन पूर्वावलोकन',
  'Create and preview your GST invoice.': 'अपना GST चालान बनाएँ और देखें।',
  'Create and preview your quotation.': 'अपना कोटेशन बनाएँ और देखें।',
  'Workspace pages': 'कार्यक्षेत्र के पृष्ठ',
  'Open menu': 'मेनू खोलें',

  /* ----- invoice page toolbar ----- */
  'Price Mode': 'मूल्य मोड',
  'Price mode': 'मूल्य मोड',
  'GST added on top of rate': 'दर के ऊपर GST जोड़ें',
  'GST includes in rate': 'दर में GST शामिल है',
  'Copies to Print': 'छापने की प्रतियाँ',
  'Copies to print': 'छापने की प्रतियाँ',
  'Quotation': 'कोटेशन',
  'Language': 'भाषा',
  'New Invoice': 'नया चालान',
  'Preview': 'पूर्वावलोकन',
  'Invoice Actions': 'चालान क्रियाएँ',
  'Print Invoice': 'चालान प्रिंट करें',
  'Save & Print': 'सहेजें और प्रिंट करें',
  'Save & Share': 'सहेजें और शेयर करें',
  'Save as Draft': 'ड्राफ़्ट के रूप में सहेजें',
  'Back up now': 'अभी बैकअप लें',
  'Remind me tomorrow': 'कल याद दिलाएँ',
  'Add Row': 'पंक्ति जोड़ें',
  'Round off total': 'कुल राउंड ऑफ करें',
  'Search item…': 'वस्तु खोजें…',
  'Search or select customer…': 'ग्राहक खोजें या चुनें…',
  'Custom Item': 'अन्य वस्तु',
  'Custom…': 'अन्य…',
  'Quantity': 'मात्रा',
  'Unit': 'इकाई',
  'GST': 'GST',
  'GST %': 'GST %',
  'Select GST %': 'GST % चुनें',
  'Auto': 'स्वतः',
  'Edit': 'बदलें',
  'Clear': 'हटाएँ',
  'Add Customer': 'ग्राहक जोड़ें',
  'Delete': 'हटाएँ',
  'Copy': 'कॉपी',
  'Enter quantity': 'मात्रा लिखें',

  /* ----- customer / item / generic forms ----- */
  'Customer details': 'ग्राहक विवरण',
  'Changes apply to this invoice only. The customer CSV will not be changed.': 'बदलाव केवल इसी चालान पर लागू होंगे। ग्राहक CSV नहीं बदलेगी।',
  'Customer name': 'ग्राहक का नाम',
  'GSTIN': 'GSTIN',
  'Billing phone': 'बिलिंग फ़ोन',
  'Billing email': 'बिलिंग ईमेल',
  'Billing address': 'बिलिंग पता',
  'Shipping address is same as billing': 'डिलीवरी का पता बिलिंग पते जैसा ही है',
  'Shipping address': 'डिलीवरी का पता',
  'Shipping phone': 'डिलीवरी फ़ोन',
  'Shipping email': 'डिलीवरी ईमेल',
  'Cancel': 'रद्द करें',
  'Save to invoice': 'चालान में सहेजें',
  'Edit details': 'विवरण बदलें',
  'Changes will be saved to the connected CSV file.': 'बदलाव जुड़ी हुई CSV फ़ाइल में सहेजे जाएँगे।',
  'Save changes': 'बदलाव सहेजें',
  'Edit customer': 'ग्राहक बदलें',
  'Edit customer details': 'ग्राहक का विवरण बदलें',
  'Edit item': 'वस्तु बदलें',
  'Edit item details': 'वस्तु का विवरण बदलें',
  'New invoice for this customer': 'इस ग्राहक के लिए नया चालान',
  'Enter customer name': 'ग्राहक का नाम लिखें',
  'Enter GSTIN (optional)': 'GSTIN लिखें (वैकल्पिक)',
  'Enter phone number': 'फ़ोन नंबर लिखें',
  'Enter email address': 'ईमेल पता लिखें',
  'Enter billing address': 'बिलिंग पता लिखें',
  'Enter shipping address': 'डिलीवरी का पता लिखें',
  'Enter shipping phone number': 'डिलीवरी फ़ोन नंबर लिखें',
  'Enter shipping email address': 'डिलीवरी ईमेल पता लिखें',
  'Enter business or customer name': 'व्यवसाय या ग्राहक का नाम लिखें',
  'Enter business address': 'व्यवसाय का पता लिखें',
  'Enter mobile number': 'मोबाइल नंबर लिखें',
  'Enter invoice number': 'चालान संख्या लिखें',
  'Enter billing': 'बिलिंग लिखें',
  'Enter bank name': 'बैंक का नाम लिखें',
  'Enter account number': 'खाता संख्या लिखें',
  'Enter IFSC code': 'IFSC कोड लिखें',
  'Enter bank branch': 'बैंक शाखा लिखें',
  'Enter UPI ID': 'UPI ID लिखें',
  'Enter name to show below signature': 'हस्ताक्षर के नीचे दिखने वाला नाम लिखें',
  'Enter one term per line': 'हर पंक्ति में एक शर्त लिखें',
  'Enter a term or condition': 'कोई नियम या शर्त लिखें',
  'Enter item or service name': 'वस्तु या सेवा का नाम लिखें',
  'Enter HSN / SAC code': 'HSN / SAC कोड लिखें',
  'Enter unit rate': 'प्रति इकाई दर लिखें',
  'Enter discount (optional)': 'छूट लिखें (वैकल्पिक)',
  'Type invoice number or customer name': 'चालान संख्या या ग्राहक का नाम लिखें',
  'Format looks wrong. Check it before sending.': 'प्रारूप गलत लगता है। भेजने से पहले जाँच लें।',
  'Select a state': 'राज्य चुनें',
  'Remove image': 'चित्र हटाएँ',
  'Upload a logo or signature image.': 'लोगो या हस्ताक्षर का चित्र अपलोड करें।',
  'Upload a logo image.': 'लोगो का चित्र अपलोड करें।',
  'Current image will be kept unless replaced.': 'बदलने तक मौजूदा चित्र बना रहेगा।',
  'Current image kept unless replaced.': 'बदलने तक मौजूदा चित्र बना रहेगा।',
  'Delete item': 'वस्तु हटाएँ',
  'Add item': 'वस्तु जोड़ें',
  'Add more terms': 'और शर्तें जोड़ें',
  'Delete this term?': 'यह शर्त हटाएँ?',
  'Delete this customer?': 'यह ग्राहक हटाएँ?',
  'Delete this item?': 'यह वस्तु हटाएँ?',
  'Clear the selected customer?': 'चुना हुआ ग्राहक हटाएँ?',
  'Clear Customer': 'ग्राहक हटाएँ',
  'Back': 'वापस',
  'Next': 'आगे',
  'Finish setup': 'सेटअप पूरा करें',
  'Do this later': 'बाद में करें',
  'Previous page': 'पिछला पृष्ठ',
  'Next page': 'अगला पृष्ठ',
  'Close': 'बंद करें',
  'Yes': 'हाँ',
  'No': 'नहीं',
  'Use': 'उपयोग करें',
  'Active': 'सक्रिय',
  'Discard': 'छोड़ें',

  /* ----- templates page and drawer ----- */
  'Template': 'टेम्पलेट',
  'Classic': 'क्लासिक',
  'Modern': 'मॉडर्न',
  'Elegant': 'एलिगेंट',
  'Minimal': 'मिनिमल',
  'Corporate': 'कॉर्पोरेट',
  'Clean and airy: company on the left, invoice details listed on the right, no boxes.': 'साफ़-सुथरा: कंपनी बाईं ओर, चालान विवरण दाईं ओर सूची में, कोई बॉक्स नहीं।',
  'Two-tone header with a coloured company panel and a joined bank, QR and signature strip.': 'दो रंगों वाला हैडर, रंगीन कंपनी पैनल और बैंक, QR व हस्ताक्षर की जुड़ी हुई पट्टी।',
  'Preview and style the Minimal template': 'मिनिमल टेम्पलेट देखें और स्टाइल बदलें',
  'Preview and style the Corporate template': 'कॉर्पोरेट टेम्पलेट देखें और स्टाइल बदलें',
  'Accent colour': 'मुख्य रंग',
  'Compact layout': 'कॉम्पैक्ट लेआउट',
  'Smaller text and tighter spacing, so more items fit on a page.': 'छोटा अक्षर और कम दूरी, ताकि एक पृष्ठ पर अधिक वस्तुएँ आएँ।',
  'Text size': 'अक्षर का आकार',
  'Small': 'छोटा',
  'Normal': 'सामान्य',
  'Large': 'बड़ा',
  'Logo position': 'लोगो की स्थिति',
  'Right': 'दाएँ',
  'Left': 'बाएँ',
  'Show on invoice': 'चालान पर दिखाएँ',
  'Company logo': 'कंपनी का लोगो',
  'Bank details': 'बैंक विवरण',
  'UPI QR code': 'UPI QR कोड',
  'Terms & conditions': 'नियम एवं शर्तें',
  'Invoice number, dates, GSTIN, HSN, tax breakup and place of supply always stay on the invoice.': 'चालान संख्या, तिथियाँ, GSTIN, HSN, कर विवरण और आपूर्ति का स्थान हमेशा चालान पर रहते हैं।',
  'Reset styling': 'स्टाइल रीसेट करें',
  'Use this template': 'यह टेम्पलेट चुनें',
  'Active template': 'सक्रिय टेम्पलेट',
  'This is the active template': 'यह सक्रिय टेम्पलेट है',
  'Default': 'डिफ़ॉल्ट',
  'Choose how your invoice looks.': 'चुनें कि आपका चालान कैसा दिखे।',
  'Black': 'काला',
  'Blue': 'नीला',
  'Teal': 'हरा-नीला',
  'Violet': 'बैंगनी',
  'Crimson': 'गहरा लाल',
  'Orange': 'नारंगी',
  'Pick any colour': 'कोई भी रंग चुनें',
  'Custom accent colour': 'मनपसंद मुख्य रंग',
  'Boxed header with the logo beside your company details.': 'बॉक्स वाला हैडर, कंपनी की जानकारी के पास लोगो।',
  'Coloured banner, invoice details as chips and card-style bank and signature.': 'रंगीन बैनर, चालान विवरण चिप्स में और कार्ड जैसे बैंक व हस्ताक्षर।',
  'Centred letterhead with framed details and a one-row bottom.': 'बीच में लेटरहेड, फ़्रेम वाला विवरण और एक पंक्ति का निचला भाग।',
  'Click to preview & style': 'देखने और स्टाइल बदलने के लिए क्लिक करें',

  /* ----- invoice archive, drawers ----- */
  'Invoice preview': 'चालान पूर्वावलोकन',
  'Close invoice preview': 'चालान पूर्वावलोकन बंद करें',
  'Saved invoice details.': 'सहेजे गए चालान का विवरण।',
  'Edit Quotation': 'कोटेशन बदलें',
  'Convert to Invoice': 'चालान में बदलें',
  'Print Quotation': 'कोटेशन प्रिंट करें',
  'Save & Print Invoice': 'चालान सहेजें और प्रिंट करें',
  'Cancel Edit': 'बदलाव रद्द करें',
  'Save Draft': 'ड्राफ़्ट सहेजें',
  'Saved Invoices': 'सहेजे गए चालान',
  'Draft Invoices': 'ड्राफ़्ट चालान',
  'Quotations': 'कोटेशन',
  'Saved invoices': 'सहेजे गए चालान',
  'Draft invoices': 'ड्राफ़्ट चालान',
  'Invoice No.': 'चालान संख्या',
  'Quotation No.': 'कोटेशन संख्या',
  'Customer Name': 'ग्राहक का नाम',
  'Customer': 'ग्राहक',
  'Total Amount ': 'कुल राशि',
  'Invoice Date ': 'चालान दिनांक',
  'Actions': 'क्रियाएँ',
  'Action': 'क्रिया',
  'View': 'देखें',
  'Invoiced': 'चालान बना',
  'Period': 'अवधि',
  'to': 'से',
  'From date': 'आरंभ तिथि',
  'To date': 'अंतिम तिथि',
  'All time': 'सभी समय',
  'This quarter': 'यह तिमाही',
  'Search invoices': 'चालान खोजें',
  'Total Invoiced': 'कुल चालान राशि',
  "This Month's Sales": 'इस माह की बिक्री',
  'Draft Invoices ': 'ड्राफ़्ट चालान',
  'Average Invoice Value': 'औसत चालान मूल्य',
  'Top Customer': 'शीर्ष ग्राहक',
  'No customer data yet': 'अभी ग्राहक का डेटा नहीं है',
  'No sales last month to compare': 'तुलना के लिए पिछले माह की बिक्री नहीं है',
  '▲ New this month': '▲ इस माह नया',
  'Connect Database to load and manage saved invoices.': 'सहेजे गए चालान देखने और संभालने के लिए डेटाबेस जोड़ें।',
  'Draft': 'ड्राफ़्ट',
  'Saved': 'सहेजा गया',
  'Status': 'स्थिति',
  'Invoice': 'चालान',
  'Date': 'दिनांक',
  'Amount': 'राशि',
  'Billing summary': 'बिलिंग सारांश',
  'Invoice history': 'चालान इतिहास',
  'Top items bought': 'सबसे ज़्यादा खरीदी गई वस्तुएँ',
  'No invoices for this customer yet.': 'इस ग्राहक का अभी कोई चालान नहीं है।',
  'No items billed to this customer yet.': 'इस ग्राहक को अभी कोई वस्तु बिल नहीं हुई।',
  'Recent invoices': 'हाल के चालान',
  'Price history': 'मूल्य इतिहास',
  'No rate changes recorded yet. Changes are tracked from now on when you edit the rate.': 'अभी कोई दर परिवर्तन दर्ज नहीं है। दर बदलने पर अब से बदलाव दर्ज होंगे।',
  'This item has not been billed on a saved invoice yet.': 'इस वस्तु का अभी किसी सहेजे गए चालान में बिल नहीं बना है।',
  'Total billed': 'कुल बिल राशि',
  'GST collected': 'वसूला गया GST',
  'Drafts': 'ड्राफ़्ट',

  /* ----- customers ----- */
  'Import customers from another CSV': 'दूसरी CSV से ग्राहक आयात करें',
  'Imported rows are added to the connected database. Required: name and address. Optional: phone, email, gstin. Duplicate customers are skipped.': 'आयात की गई पंक्तियाँ जुड़े हुए डेटाबेस में जुड़ती हैं। आवश्यक: नाम और पता। वैकल्पिक: फ़ोन, ईमेल, gstin। दोहराए गए ग्राहक छोड़ दिए जाते हैं।',
  'Download CSV template': 'CSV टेम्पलेट डाउनलोड करें',
  'Choose a CSV file': 'CSV फ़ाइल चुनें',
  'Add a customer': 'ग्राहक जोड़ें',
  'Address': 'पता',
  'Phone': 'फ़ोन',
  'Email': 'ईमेल',
  'Customer list': 'ग्राहक सूची',
  'selected': 'चुने गए',
  'Share on WhatsApp': 'WhatsApp पर भेजें',
  'WhatsApp': 'WhatsApp',
  'Call': 'कॉल करें',
  'Export CSV': 'CSV निर्यात करें',
  'Mark active': 'सक्रिय करें',
  'Mark inactive': 'निष्क्रिय करें',
  'Clear selection': 'चयन हटाएँ',
  'All customers': 'सभी ग्राहक',
  'Total Customers': 'कुल ग्राहक',
  'Active Customers': 'सक्रिय ग्राहक',
  'Missing': 'अधूरा',
  'Name': 'नाम',
  'Total Billed': 'कुल बिल राशि',
  'No customers match your search or filter.': 'आपकी खोज या फ़िल्टर से कोई ग्राहक मेल नहीं खाता।',
  'No customers added or imported yet.': 'अभी कोई ग्राहक जोड़ा या आयात नहीं किया गया।',
  'Filter customers': 'ग्राहक फ़िल्टर करें',
  'Search customers': 'ग्राहक खोजें',
  'View customer details': 'ग्राहक का विवरण देखें',
  'Customer saved to customers.csv.': 'ग्राहक customers.csv में सहेजा गया।',
  'Message': 'संदेश',

  /* ----- items ----- */
  'Import items from another CSV': 'दूसरी CSV से वस्तुएँ आयात करें',
  'Choose an item CSV file': 'वस्तु की CSV फ़ाइल चुनें',
  'Add an item': 'वस्तु जोड़ें',
  'Item name': 'वस्तु का नाम',
  'Purchase price': 'खरीद मूल्य',
  'Add Item': 'वस्तु जोड़ें',
  'Item list': 'वस्तु सूची',
  'Set GST %': 'GST % तय करें',
  'Duplicate?': 'दोहराव?',
  'Old': 'पुराना',
  'First rate': 'पहली दर',
  'No change': 'कोई बदलाव नहीं',
  'Sales': 'बिक्री',
  'Change': 'बदलाव',
  'All items': 'सभी वस्तुएँ',
  'Sold': 'बिकी',
  'Not sold (90 days)': 'बिकी नहीं (90 दिन)',
  'Not Sold (90 days)': 'बिकी नहीं (90 दिन)',
  'Possible duplicates': 'संभावित दोहराव',
  'Old GST rate (12% / 28%)': 'पुरानी GST दर (12% / 28%)',
  'Total Items': 'कुल वस्तुएँ',
  'Best Seller': 'सबसे ज़्यादा बिकने वाली',
  'No sales yet': 'अभी कोई बिक्री नहीं',
  'No items match your search or filter.': 'आपकी खोज या फ़िल्टर से कोई वस्तु मेल नहीं खाती।',
  'No items added or imported yet.': 'अभी कोई वस्तु जोड़ी या आयात नहीं की गई।',
  'Cost': 'लागत',
  'Qty Sold': 'बिकी मात्रा',
  'Last Sold': 'अंतिम बिक्री',
  'Earlier': 'पहले',
  'Filter items': 'वस्तु फ़िल्टर करें',
  'Search items': 'वस्तु खोजें',
  'GST rate to apply': 'लागू करने की GST दर',
  'View item details': 'वस्तु का विवरण देखें',
  'Item saved to items.csv.': 'वस्तु items.csv में सहेजी गई।',

  /* ----- settings / profiles ----- */
  'Seller': 'विक्रेता',
  'Seller state': 'विक्रेता का राज्य',
  'Seller profile': 'विक्रेता प्रोफ़ाइल',
  'Seller Profile': 'विक्रेता प्रोफ़ाइल',
  'Business name': 'व्यवसाय का नाम',
  'Mobile': 'मोबाइल',
  'Logo (shows beside the address)': 'लोगो (पते के पास दिखता है)',
  'Logo': 'लोगो',
  'Logo image': 'लोगो चित्र',
  'Invoice #': 'चालान संख्या',
  'Invoice date': 'चालान दिनांक',
  'Due date': 'देय तिथि',
  'Place of supply': 'आपूर्ति का स्थान',
  'Bank': 'बैंक',
  'Account #': 'खाता संख्या',
  'IFSC': 'IFSC',
  'Branch': 'शाखा',
  'UPI ID': 'UPI ID',
  'Include invoice total in QR': 'QR में चालान की कुल राशि शामिल करें',
  'Signature image': 'हस्ताक्षर का चित्र',
  'Name shown below signature': 'हस्ताक्षर के नीचे दिखने वाला नाम',
  'Terms': 'शर्तें',
  'Default terms': 'डिफ़ॉल्ट शर्तें',
  'Profile updated.': 'प्रोफ़ाइल अपडेट हो गई।',
  'Invoice numbering': 'चालान क्रमांक',
  'Auto-number by financial year (April to March)': 'वित्त वर्ष (अप्रैल से मार्च) के अनुसार स्वतः क्रमांक',
  'Prefix': 'उपसर्ग',
  'Next number:': 'अगला क्रमांक:',
  'Use next number for this invoice': 'इस चालान के लिए अगला क्रमांक लें',
  'Reset invoice number (testing)': 'चालान क्रमांक रीसेट करें (परीक्षण)',

  /* ----- backup ----- */
  'Back up your data': 'अपने डेटा का बैकअप लें',
  'Restore from a backup': 'बैकअप से रीस्टोर करें',
  'Backup reminder': 'बैकअप अनुस्मारक',
  'Download backup (ZIP)': 'बैकअप डाउनलोड करें (ZIP)',
  'Choose backup ZIP': 'बैकअप ZIP चुनें',
  'Off': 'बंद',
  'Every 3 days': 'हर 3 दिन',
  'Every 7 days': 'हर 7 दिन',
  'Every 14 days': 'हर 14 दिन',
  'Every 30 days': 'हर 30 दिन',
  'Show a reminder at the top of the app when the last backup is older than:': 'जब पिछला बैकअप इतना पुराना हो जाए तो ऐप में ऊपर अनुस्मारक दिखाएँ:',

  /* ----- dialogs ----- */
  'Choose the app’s CSV folder': 'ऐप का CSV फ़ोल्डर चुनें',
  'Choose data folder': 'डेटा फ़ोल्डर चुनें',
  'How to use': 'उपयोग कैसे करें',
  'Install app': 'ऐप इंस्टॉल करें',
  'Choose CSV file': 'CSV फ़ाइल चुनें',
  'Confirm deletion': 'हटाने की पुष्टि करें',
  'Override saved invoice?': 'सहेजे गए चालान को बदलें?',
  'Yes, Override': 'हाँ, बदलें',
  'Reset invoice?': 'चालान रीसेट करें?',
  'Disconnect database?': 'डेटाबेस हटाएँ?',
  'Show CSV import': 'CSV आयात दिखाएँ',
  'Hide CSV import': 'CSV आयात छिपाएँ',
  'Setup progress': 'सेटअप की प्रगति',
  'Expected location': 'अपेक्षित स्थान',
  'Send': 'भेजें',

  /* ----- units ----- */
  'Nos': 'Nos'
};

/* Patterns for text that contains numbers or names. */
const HI_PATTERNS = [
  [/^(\d+) copies?$/, (m) => `${m[1]} प्रति`],
  [/^(\d{2})-(.+)$/, (m) => (HI_STATES[m[2]] ? `${m[1]}-${HI_STATES[m[2]]}` : null)],
  [/^Quotation (\S+) was saved\.$/, (m) => `कोटेशन ${m[1]} सहेजा गया।`],
  [/^Invoice (\S+) saved to invoices\.csv\.$/, (m) => `चालान ${m[1]} invoices.csv में सहेजा गया।`],
  [/^(\d+) selected$/, (m) => `${m[1]} चुने गए`]
];

/* More screen text (second batch) */
Object.assign(HI, {
  'English': 'English',
  '. Numbers start at 001, grow to 4 digits after 999, and restart at 001 every April.': '। क्रमांक 001 से शुरू होते हैं, 999 के बाद 4 अंकों के हो जाते हैं और हर अप्रैल में फिर 001 से शुरू होते हैं।',
  'Account': 'खाता',
  'Active only': 'केवल सक्रिय',
  'Inactive only': 'केवल निष्क्रिय',
  'Active – shown in the invoice customer list': 'सक्रिय – चालान की ग्राहक सूची में दिखता है',
  'Active – shown in the invoice item list': 'सक्रिय – चालान की वस्तु सूची में दिखती है',
  'Add Bank Profile': 'बैंक प्रोफ़ाइल जोड़ें',
  'Add Seller Profile': 'विक्रेता प्रोफ़ाइल जोड़ें',
  'Add Set': 'सेट जोड़ें',
  'Add a bank profile': 'बैंक प्रोफ़ाइल जोड़ें',
  'Add a seller profile': 'विक्रेता प्रोफ़ाइल जोड़ें',
  'Add a terms set': 'शर्तों का सेट जोड़ें',
  'Add custom customer': 'नया ग्राहक जोड़ें',
  'Bank name': 'बैंक का नाम',
  'Bank profile table pages': 'बैंक प्रोफ़ाइल तालिका के पृष्ठ',
  'Billed in last 90 days': 'पिछले 90 दिनों में बिल बना',
  'Calculated from rate and quantity': 'दर और मात्रा से गणना की गई',
  'Choose a CSV file to import': 'आयात के लिए CSV फ़ाइल चुनें',
  'Choose a ZIP made by this app. It replaces the data in the connected CSV files. Your current data is saved as a safety ZIP first, and the backup is checked before anything is written.': 'इस ऐप से बनी ZIP चुनें। यह जुड़ी हुई CSV फ़ाइलों का डेटा बदल देती है। पहले आपके मौजूदा डेटा की सुरक्षा ZIP सहेजी जाती है, और कुछ भी लिखने से पहले बैकअप की जाँच होती है।',
  'Choose a customer CSV file to import': 'आयात के लिए ग्राहक की CSV फ़ाइल चुनें',
  'Choose a signature image and the name shown below it.': 'हस्ताक्षर का चित्र और उसके नीचे दिखने वाला नाम चुनें।',
  'Choose an image file': 'चित्र की फ़ाइल चुनें',
  'Choose an item CSV file to import': 'आयात के लिए वस्तु की CSV फ़ाइल चुनें',
  'Clear selected customer': 'चुना हुआ ग्राहक हटाएँ',
  'Connect the database first (Database, bottom of the left menu). Backup and restore work on the connected CSV files.': 'पहले डेटाबेस जोड़ें (बाएँ मेनू में सबसे नीचे डेटाबेस)। बैकअप और रीस्टोर जुड़ी हुई CSV फ़ाइलों पर काम करते हैं।',
  'Custom range': 'अपनी अवधि',
  'Customer table pages': 'ग्राहक तालिका के पृष्ठ',
  'Download a ZIP of all your CSV files, restore from one, and set a backup reminder.': 'अपनी सभी CSV फ़ाइलों की ZIP डाउनलोड करें, ZIP से रीस्टोर करें और बैकअप अनुस्मारक तय करें।',
  'Each template changes the layout of the top (company, invoice details, customer) and the bottom (bank, QR, signature, terms). The items table is the same in every template. The default template is used for every new invoice.': 'हर टेम्पलेट ऊपरी भाग (कंपनी, चालान विवरण, ग्राहक) और निचले भाग (बैंक, QR, हस्ताक्षर, शर्तें) का लेआउट बदलता है। वस्तुओं की तालिका हर टेम्पलेट में एक जैसी रहती है। डिफ़ॉल्ट टेम्पलेट हर नए चालान में इस्तेमाल होता है।',
  'Enter HSN/SAC code': 'HSN/SAC कोड लिखें',
  'Enter a name for this set': 'इस सेट का नाम लिखें',
  'Enter business name': 'व्यवसाय का नाम लिखें',
  'Enter one term or condition per line': 'हर पंक्ति में एक नियम या शर्त लिखें',
  'Enter product or service name': 'वस्तु या सेवा का नाम लिखें',
  'Fetched from Item Details': 'वस्तु विवरण से लिया गया',
  'First invoice this month': 'इस माह का पहला चालान',
  'Import bank profiles from another CSV': 'दूसरी CSV से बैंक प्रोफ़ाइल आयात करें',
  'Import seller profiles from another CSV': 'दूसरी CSV से विक्रेता प्रोफ़ाइल आयात करें',
  'Import terms sets from another CSV': 'दूसरी CSV से शर्तों के सेट आयात करें',
  'Import, add, edit, and manage customers saved in your local directory.': 'अपनी स्थानीय सूची में सहेजे ग्राहकों को आयात करें, जोड़ें, बदलें और संभालें।',
  'Import, add, edit, and manage products and services in your local catalog.': 'अपने स्थानीय कैटलॉग की वस्तुओं और सेवाओं को आयात करें, जोड़ें, बदलें और संभालें।',
  'In the folder picker, find the folder where you saved this invoice app. It is the folder that contains': 'फ़ोल्डर चुनने की विंडो में वह फ़ोल्डर खोजें जिसमें आपने यह चालान ऐप रखा है। यह वह फ़ोल्डर है जिसमें',
  'Inactive Customers': 'निष्क्रिय ग्राहक',
  'Invoice details': 'चालान विवरण',
  'Invoice table pages': 'चालान तालिका के पृष्ठ',
  'Invoice type': 'चालान का प्रकार',
  'Invoices': 'चालान',
  'Item details': 'वस्तु विवरण',
  'Item table pages': 'वस्तु तालिका के पृष्ठ',
  'Last Invoice': 'अंतिम चालान',
  'Last month': 'पिछला माह',
  'Manage bank transfer and UPI payment details printed on invoices.': 'चालान पर छपने वाले बैंक ट्रांसफ़र और UPI भुगतान विवरण संभालें।',
  'Manage the terms and conditions shown on invoices.': 'चालान पर दिखने वाले नियम एवं शर्तें संभालें।',
  'Manage your business identity and contact details shown on invoices.': 'चालान पर दिखने वाली अपने व्यवसाय की पहचान और संपर्क जानकारी संभालें।',
  'Margin': 'मार्जिन',
  'Missing / invalid HSN or rate': 'HSN या दर नहीं है / गलत है',
  'Missing / invalid HSN or ₹0 rate': 'HSN नहीं है / गलत है या दर ₹0 है',
  'Missing Details': 'अधूरी जानकारी',
  'Missing phone / GSTIN': 'फ़ोन / GSTIN नहीं है',
  'New This Month': 'इस माह नए',
  'New this month': 'इस माह नए',
  'No GSTIN – billed as an unregistered customer': 'GSTIN नहीं – अपंजीकृत ग्राहक के रूप में बिल',
  'No backup has been made from this browser yet.': 'इस ब्राउज़र से अभी तक कोई बैकअप नहीं लिया गया।',
  'No invoice in 90+ days or never': '90 से ज़्यादा दिनों से या कभी चालान नहीं',
  'No sale in 90 days or never': '90 दिनों में या कभी बिक्री नहीं',
  'Not billed in 90+ days': '90 से ज़्यादा दिनों से बिल नहीं',
  'Open its': 'इसका',
  'Optional cost': 'वैकल्पिक लागत',
  'Per saved invoice': 'प्रति सहेजा गया चालान',
  'Pick the invoice layout and style used for new invoices.': 'नए चालानों के लिए लेआउट और स्टाइल चुनें।',
  'Preview and style the Classic template': 'क्लासिक टेम्पलेट देखें और स्टाइल बदलें',
  'Preview and style the Elegant template': 'एलिगेंट टेम्पलेट देखें और स्टाइल बदलें',
  'Preview and style the Modern template': 'मॉडर्न टेम्पलेट देखें और स्टाइल बदलें',
  'QR total': 'QR में कुल राशि',
  'Required column: bank. Account, IFSC, branch, UPI, and QR option are optional. The bank name identifies each profile.': 'आवश्यक कॉलम: bank। खाता, IFSC, शाखा, UPI और QR विकल्प वैकल्पिक हैं। बैंक का नाम हर प्रोफ़ाइल की पहचान है।',
  'Required columns: name and address. Optional: GSTIN, mobile, email, state, logo.': 'आवश्यक कॉलम: name और address। वैकल्पिक: GSTIN, mobile, email, state, logo।',
  'Required columns: name, hsn/sac, rate. Optional: unit (defaults to Nos), gst (0, 5, 18 or 40; defaults to 18 – old 12 and 28 values are still accepted but flagged). Duplicate items are skipped.': 'आवश्यक कॉलम: name, hsn/sac, rate। वैकल्पिक: unit (डिफ़ॉल्ट Nos), gst (0, 5, 18 या 40; डिफ़ॉल्ट 18 – पुरानी 12 और 28 दरें स्वीकार हैं पर चिह्नित होती हैं)। दोहराई गई वस्तुएँ छोड़ दी जाती हैं।',
  'Required columns: set_name, term (one row per term).': 'आवश्यक कॉलम: set_name, term (हर शर्त की एक पंक्ति)।',
  'Revenue': 'आय',
  'Rows per page': 'प्रति पृष्ठ पंक्तियाँ',
  'Saved bank profiles': 'सहेजे गए बैंक प्रोफ़ाइल',
  'Saved seller profiles': 'सहेजे गए विक्रेता प्रोफ़ाइल',
  'Saved terms sets': 'सहेजे गए शर्तों के सेट',
  'Search by invoice number (for example INV/25-26/0001) or customer name.': 'चालान संख्या (जैसे INV/25-26/0001) या ग्राहक के नाम से खोजें।',
  'Search by quotation number (for example QTN/25-26/001) or customer name.': 'कोटेशन संख्या (जैसे QTN/25-26/001) या ग्राहक के नाम से खोजें।',
  'Search customers…': 'ग्राहक खोजें…',
  'Search items…': 'वस्तु खोजें…',
  'Search, preview, and manage saved invoice records.': 'सहेजे गए चालान खोजें, देखें और संभालें।',
  'Select all customers on this page': 'इस पृष्ठ के सभी ग्राहक चुनें',
  'Select all items on this page': 'इस पृष्ठ की सभी वस्तुएँ चुनें',
  'Select due date': 'देय तिथि चुनें',
  'Select invoice date': 'चालान दिनांक चुनें',
  'Select quotation date': 'कोटेशन दिनांक चुनें',
  'Select valid until': 'मान्य तिथि चुनें',
  'Select the': 'चुनें',
  'Seller profile table pages': 'विक्रेता प्रोफ़ाइल तालिका के पृष्ठ',
  'Set': 'सेट',
  'Set name': 'सेट का नाम',
  'Set the invoice number, dates, and place of supply.': 'चालान संख्या, तिथियाँ और आपूर्ति का स्थान तय करें।',
  'State': 'राज्य',
  'Status: Active': 'स्थिति: सक्रिय',
  'Status: Inactive': 'स्थिति: निष्क्रिय',
  'Terms (one per line)': 'शर्तें (हर पंक्ति में एक)',
  'Terms table pages': 'शर्तों की तालिका के पृष्ठ',
  'This disconnects the app from the CSV files. Your invoice and saved details will remain unchanged, and the CSV files will not be modified.': 'इससे ऐप CSV फ़ाइलों से अलग हो जाता है। आपका चालान और सहेजी गई जानकारी वैसी ही रहेगी, और CSV फ़ाइलें नहीं बदलेंगी।',
  'This financial year': 'यह वित्त वर्ष',
  'This month': 'यह माह',
  'To save changes, connect the CSV file stored with this app.': 'बदलाव सहेजने के लिए इस ऐप के साथ रखी CSV फ़ाइल जोड़ें।',
  'Top Revenue Item': 'सबसे अधिक आय वाली वस्तु',
  'WhatsApp opens one chat at a time, so press': 'WhatsApp एक बार में एक चैट खोलता है, इसलिए दबाएँ',
  'Your CSV files are your only database. One backup is a single ZIP that holds all six CSV files (customers, items, seller, bank, terms, invoices) plus your template and numbering settings.': 'आपकी CSV फ़ाइलें ही आपका एकमात्र डेटाबेस हैं। एक बैकअप एक ही ZIP होती है जिसमें सभी छह CSV फ़ाइलें (ग्राहक, वस्तुएँ, विक्रेता, बैंक, शर्तें, चालान) और आपके टेम्पलेट व क्रमांक की सेटिंग होती हैं।',
  'Your current invoice details will be replaced with the demo example.': 'आपके मौजूदा चालान का विवरण डेमो उदाहरण से बदल दिया जाएगा।',
  'folder containing index.html > csv >': 'index.html वाला फ़ोल्डर > csv >',
  'folder. The app will automatically connect': 'फ़ोल्डर। ऐप अपने आप जोड़ लेगा',
  "for the customer's name and": 'ग्राहक के नाम के लिए और',
  'for your business name.': 'आपके व्यवसाय के नाम के लिए।',
  'next to each customer.': 'हर ग्राहक के आगे।',
  'subfolder.': 'सबफ़ोल्डर खोलें।',
  'Litre': 'लीटर', 'Metre': 'मीटर', 'Sq. metre': 'वर्ग मीटर', 'Box': 'बॉक्स', 'Packet': 'पैकेट', 'Pair': 'जोड़ी', 'Dozen': 'दर्जन',
  'Account number': 'खाता संख्या',
  'Connect your database to continue': 'जारी रखने के लिए अपना डेटाबेस जोड़ें',
  'The database is not connected.': 'डेटाबेस जुड़ा हुआ नहीं है।',
  'Your invoices, customers, items and settings are kept in CSV files on this computer. Until they are connected, nothing can be saved, so the app is locked.': ' आपके चालान, ग्राहक, वस्तुएँ और सेटिंग इस कंप्यूटर की CSV फ़ाइलों में रखी जाती हैं। जब तक वे जुड़ती नहीं, कुछ भी सहेजा नहीं जा सकता, इसलिए ऐप बंद है।',
  'Click Connect Database.': 'डेटाबेस जोड़ें पर क्लिक करें।',
  'In the folder window, choose your data folder. A new, empty folder is fine: the app creates its data files there.': 'फ़ोल्डर वाली विंडो में अपना डेटा फ़ोल्डर चुनें। नया खाली फ़ोल्डर भी चलेगा, ऐप वहाँ अपनी डेटा फ़ाइलें खुद बना लेता है।',
  'Allow the browser to edit the files when it asks.': 'ब्राउज़र पूछे तो फ़ाइलें बदलने की अनुमति दें।',
  'Connecting…': 'जोड़ा जा रहा है…',
  'This browser cannot open the CSV folder. Open the app in the latest Chrome or Edge.': 'यह ब्राउज़र CSV फ़ोल्डर नहीं खोल सकता। ऐप को नवीनतम Chrome या Edge में खोलें।',
  'Share': 'शेयर करें',
  'Share invoice': 'चालान शेयर करें',
  'Copy as image': 'चित्र के रूप में कॉपी करें',
  'Copied ✓': 'कॉपी हो गया ✓',
  'Copy the invoice as a picture, then paste it into the WhatsApp chat (or any app) with Ctrl+V.': 'चालान को चित्र के रूप में कॉपी करें, फिर WhatsApp चैट (या किसी भी ऐप) में Ctrl+V से पेस्ट करें।',
  'Preparing the invoice picture…': 'चालान का चित्र तैयार हो रहा है…',
  'Picture copied. Open the WhatsApp chat (or any app) and press Ctrl+V to paste it.': 'चित्र कॉपी हो गया। WhatsApp चैट (या कोई भी ऐप) खोलकर Ctrl+V दबाएँ।',
  'Invoice picture copied. Paste it into the chat with Ctrl+V.': 'चालान का चित्र कॉपी हो गया। चैट में Ctrl+V से पेस्ट करें।',
  'The browser did not allow copying. Right-click the picture above and choose "Copy image", or save it and attach it.': 'ब्राउज़र ने कॉपी की अनुमति नहीं दी। ऊपर के चित्र पर राइट-क्लिक करके "चित्र कॉपी करें" चुनें, या उसे सहेजकर संलग्न करें।',
  'Print': 'प्रिंट करें',
  'Your settings were read from the database folder.': 'आपकी सेटिंग डेटाबेस फ़ोल्डर से पढ़ी गईं।',
  'Also restore my template settings (default template, colours)': 'मेरी टेम्पलेट सेटिंग (डिफ़ॉल्ट टेम्पलेट, रंग) भी रीस्टोर करें',
  'Invoice numbering is never taken from a backup. The next numbers follow the highest number already used, so a number is never given twice.': 'चालान क्रमांक बैकअप से नहीं लिए जाते। अगले क्रमांक अब तक इस्तेमाल हुए सबसे ऊँचे क्रमांक के आगे से चलते हैं, इसलिए कोई क्रमांक दो बार नहीं दिया जाता।',
  'Choose a ZIP made by this app. It replaces the data in the connected CSV files. Your current data is saved as a safety ZIP first, the backup is checked before anything is written, and if a file cannot be written your current files are put back.': 'इस ऐप से बनी ZIP चुनें। यह जुड़ी हुई CSV फ़ाइलों का डेटा बदल देती है। पहले आपके मौजूदा डेटा की सुरक्षा ZIP सहेजी जाती है, कुछ भी लिखने से पहले बैकअप की जाँच होती है, और कोई फ़ाइल न लिखी जा सके तो आपकी मौजूदा फ़ाइलें वापस रख दी जाती हैं।',
  'Discount (before GST)': 'छूट (GST से पहले)',
  'Before GST': 'GST से पहले',
  'On final amount': 'अंतिम राशि पर',
  'Discount applies to': 'छूट किस पर लगेगी',
  'Taken off the amount before GST. The GST is worked out on what is left.': 'GST से पहले की राशि से घटती है। GST बची हुई राशि पर लगता है।',
  'The customer pays this much less on the final bill, GST included.': 'ग्राहक को अंतिम बिल (GST सहित) में इतना कम देना पड़ता है।',
  'Save & Print Quotation': 'कोटेशन सहेजें और प्रिंट करें',
  'Draft invoice': 'ड्राफ़्ट चालान',
  'Draft quotation': 'ड्राफ़्ट कोटेशन',
  'Enter item name': 'वस्तु का नाम लिखें',
  'Choose item from list': 'सूची से वस्तु चुनें',
  'Type the HSN/SAC code': 'HSN/SAC कोड लिखें',
  'Type the taxable value, or fill the rate and quantity': 'कर योग्य मूल्य लिखें, या दर और मात्रा भरें',
  'Discount': 'छूट',
  'Discount in percent': 'प्रतिशत में छूट',
  'Discount in rupees': 'रुपयों में छूट',
  'Clear discount': 'छूट हटाएँ',
  'Quick discount': 'झटपट छूट',
  'Amount before discount': 'छूट से पहले की राशि',
  'Invoice discount': 'चालान पर छूट',
  'Discount type': 'छूट का प्रकार',
  'The invoice discount is more than the amount, so it was limited to the amount.': 'चालान की छूट राशि से अधिक है, इसलिए उसे राशि तक सीमित कर दिया गया।',
  'Your work could not be kept in this browser.': 'आपका काम इस ब्राउज़र में सहेजा नहीं जा सका।',
  'Browser storage is full (a very large logo or signature is the usual cause), so what you see on screen will be lost if you refresh. Save the invoice to the database now, or use a smaller logo or signature.': 'ब्राउज़र की जगह भर गई है (आमतौर पर बहुत बड़ा लोगो या हस्ताक्षर इसका कारण होता है), इसलिए रिफ़्रेश करने पर स्क्रीन का काम खो जाएगा। चालान को अभी डेटाबेस में सहेजें, या छोटा लोगो/हस्ताक्षर इस्तेमाल करें।',
  'Please choose an image file (PNG, JPG, WebP or GIF).': 'कृपया चित्र की फ़ाइल चुनें (PNG, JPG, WebP या GIF)।',
  'That image is larger than 10 MB. Please choose a smaller one.': 'वह चित्र 10 MB से बड़ा है। कृपया छोटा चित्र चुनें।',
  'No invoices yet': 'अभी कोई चालान नहीं',
  'First invoice this month ': 'इस माह का पहला चालान',
  'Invoice number': 'चालान संख्या'
});

/* Text that has numbers or names in it */
HI_PATTERNS.push(
  [/^(\d+) cop(?:y|ies)$/, m => `${m[1]} प्रति`],
  [/^Showing (\d+)–(\d+) of (\d+)$/, m => `${m[3]} में से ${m[1]}–${m[2]} दिखाए जा रहे हैं`],
  [/^(\d+) with invoices$/, m => `${m[1]} के चालान बने हैं`],
  [/^(\d+)% of customers · last 90 days$/, m => `${m[1]}% ग्राहक · पिछले 90 दिन`],
  [/^(\d+) sold · (\d+) inactive$/, m => `${m[1]} बिकी · ${m[2]} निष्क्रिय`],
  [/^(\d+) without phone · (\d+) without GSTIN$/, m => `${m[1]} बिना फ़ोन · ${m[2]} बिना GSTIN`],
  [/^(₹[\d,.]+) pending · view drafts$/, m => `${m[1]} लंबित · ड्राफ़्ट देखें`],
  [/^(₹[\d,.]+) · (\d+) invoices?$/, m => `${m[1]} · ${m[2]} चालान`],
  [/^(\d+) saved invoices? · (.+)$/, m => `${m[1]} सहेजे गए चालान · ${hiLookup(m[2]) ?? m[2]}`],
  [/^Quantity and unit for item (\d+)$/, m => `वस्तु ${m[1]} की मात्रा और इकाई`],
  [/^Custom quantity for item (\d+)$/, m => `वस्तु ${m[1]} की अपनी मात्रा`],
  [/^Rate for item (\d+)$/, m => `वस्तु ${m[1]} की दर`],
  [/^HSN\/SAC for item (\d+)$/, m => `वस्तु ${m[1]} का HSN/SAC`],
  [/^Taxable value for item (\d+)$/, m => `वस्तु ${m[1]} का कर योग्य मूल्य`],
  [/^Quotation for (.+)\.$/, m => `${m[1]} के लिए कोटेशन।`],
  [/^Saved invoice for (.+)\.$/, m => `${m[1]} के लिए सहेजा गया चालान।`],
  [/^Draft invoice for (.+)\.$/, m => `${m[1]} के लिए ड्राफ़्ट चालान।`],
  [/^Quotation (QTN\S+)$/, m => `कोटेशन ${m[1]}`],
  [/^Invoice (INV\S+)$/, m => `चालान ${m[1]}`],
  [/^Edit (.+)$/, m => `${m[1]} बदलें`],
  [/^Delete (.+)$/, m => `${m[1]} हटाएँ`],
  [/^Select (.+)$/, m => `${m[1]} चुनें`],
  [/^Active: (.+)$/, m => `सक्रिय: ${m[1]}`],
  [/^Qty (.+)$/, m => `मात्रा ${m[1]}`],
  [/^Share (invoice|quotation) (.+)$/, m => `${m[1] === 'quotation' ? 'कोटेशन' : 'चालान'} ${m[2]} शेयर करें`],
  [/^Pictures in your saved invoices are now stored once, not in every invoice\. invoices\.csv and seller\.csv went from (.+) to (.+)\.$/, m => `आपके सहेजे गए चालानों के चित्र अब हर चालान में नहीं, एक ही बार रखे जाते हैं। invoices.csv और seller.csv ${m[1]} से घटकर ${m[2]} हो गईं।`],
  [/^= (−₹[\d,.]+) before GST$/, m => `= ${m[1]} GST से पहले`],
  [/^Draft (invoice|quotation) saved\. It gets its (?:invoice|quotation) number when you save and print it\.$/, m => `ड्राफ़्ट ${m[1] === 'quotation' ? 'कोटेशन' : 'चालान'} सहेजा गया। सहेजकर प्रिंट करने पर इसे ${m[1] === 'quotation' ? 'कोटेशन' : 'चालान'} संख्या मिलेगी।`],
  [/^Draft (invoice|quotation) for (.+)\. It gets its number when you save and print it\.$/, m => `${m[2]} के लिए ड्राफ़्ट ${m[1] === 'quotation' ? 'कोटेशन' : 'चालान'}। सहेजकर प्रिंट करने पर इसे संख्या मिलेगी।`],
  [/^Discount on item (\d+) is more than its amount, so it was limited to the amount\.$/, m => `वस्तु ${m[1]} की छूट उसकी राशि से अधिक है, इसलिए उसे राशि तक सीमित कर दिया गया।`]
);

/* ---------- Hindi parts of the printed document ---------- */
const HI_MON = ['जन॰', 'फ़र॰', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल॰', 'अग॰', 'सित॰', 'अक्टू॰', 'नव॰', 'दिस॰'];
const HI_STATES = {
  'Jammu & Kashmir': 'जम्मू और कश्मीर', 'Himachal Pradesh': 'हिमाचल प्रदेश', 'Punjab': 'पंजाब', 'Chandigarh': 'चंडीगढ़',
  'Uttarakhand': 'उत्तराखंड', 'Haryana': 'हरियाणा', 'Delhi': 'दिल्ली', 'Rajasthan': 'राजस्थान', 'Uttar Pradesh': 'उत्तर प्रदेश',
  'Bihar': 'बिहार', 'Sikkim': 'सिक्किम', 'Arunachal Pradesh': 'अरुणाचल प्रदेश', 'Nagaland': 'नागालैंड', 'Manipur': 'मणिपुर',
  'Mizoram': 'मिज़ोरम', 'Tripura': 'त्रिपुरा', 'Meghalaya': 'मेघालय', 'Assam': 'असम', 'West Bengal': 'पश्चिम बंगाल',
  'Jharkhand': 'झारखंड', 'Odisha': 'ओडिशा', 'Chhattisgarh': 'छत्तीसगढ़', 'Madhya Pradesh': 'मध्य प्रदेश', 'Gujarat': 'गुजरात',
  'Dadra & Nagar Haveli and Daman & Diu': 'दादरा और नगर हवेली तथा दमन और दीव', 'Maharashtra': 'महाराष्ट्र', 'Karnataka': 'कर्नाटक',
  'Goa': 'गोवा', 'Lakshadweep': 'लक्षद्वीप', 'Kerala': 'केरल', 'Tamil Nadu': 'तमिलनाडु', 'Puducherry': 'पुदुच्चेरी',
  'Andaman & Nicobar': 'अंडमान और निकोबार', 'Telangana': 'तेलंगाना', 'Andhra Pradesh': 'आंध्र प्रदेश', 'Ladakh': 'लद्दाख'
};

const HI_NUM = ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
  'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
  'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
  'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चौवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
  'पचास', 'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
  'साठ', 'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर',
  'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
  'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'];

function hiWordsBelowThousand(n) {
  const hundreds = Math.floor(n / 100), rest = n % 100;
  return [hundreds ? `${HI_NUM[hundreds]} सौ` : '', rest ? HI_NUM[rest] : ''].filter(Boolean).join(' ');
}
function hiWords(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (!n) return HI_NUM[0];
  const parts = [], crore = Math.floor(n / 1e7), lakh = Math.floor(n % 1e7 / 1e5), thousand = Math.floor(n % 1e5 / 1e3), rest = n % 1e3;
  if (crore) parts.push(`${hiWords(crore)} करोड़`);
  if (lakh) parts.push(`${HI_NUM[lakh]} लाख`);
  if (thousand) parts.push(`${HI_NUM[thousand]} हज़ार`);
  if (rest) parts.push(hiWordsBelowThousand(rest));
  return parts.join(' ');
}
// e.g. 947.50 -> "नौ सौ सैंतालीस रुपये और पचास पैसे केवल।"
function totalWordsHi(total) {
  total = Math.round(Math.abs(Number(total) || 0) * 100) / 100;
  const rupees = Math.floor(total), paise = Math.round((total - rupees) * 100);
  return `${hiWords(rupees)} रुपये${paise ? ` और ${HI_NUM[paise]} पैसे` : ''} केवल।`;
}

/* ---------- looking text up ---------- */
const docLang = () => (typeof S !== 'undefined' && S && S.lang === 'hi' ? 'hi' : 'en');

function hiLookup(text) {
  if (Object.prototype.hasOwnProperty.call(HI, text)) return HI[text];
  for (const [pattern, build] of HI_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const result = build(match);
      if (result) return result;
    }
  }
  return null;
}

// Label on the printed document, in the language of that document.
function L(text) {
  return docLang() === 'hi' ? (hiLookup(text) ?? text) : text;
}

/* ---------- translating the app screens in place ---------- */
const I18N_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'KBD', 'NOSCRIPT']);
const I18N_ATTRS = ['placeholder', 'title', 'aria-label'];
const i18nOriginalText = new WeakMap();
const i18nOriginalAttrs = new WeakMap();
let i18nApplying = false;

// Printed parts of an invoice keep the document's own language, so only the on-screen controls inside it are translated.
function i18nInsideDocument(node) {
  const element = node.nodeType === 1 ? node : node.parentElement;
  const sheet = element?.closest?.('.sheet');
  return Boolean(sheet) && !element.closest('.no-print');
}

function i18nTranslateText(node) {
  const parent = node.parentElement;
  if (!parent || I18N_SKIP_TAGS.has(parent.tagName) || i18nInsideDocument(node)) return;
  const raw = node.nodeValue;
  const trimmed = raw.trim();
  if (!trimmed) return;
  const known = i18nOriginalText.get(node);
  const alreadyTranslated = Boolean(known) && raw === known.hindi;
  const english = alreadyTranslated ? known.english : trimmed;
  const hindi = hiLookup(english);
  if (hindi === null) return;
  // The spaces around the text come from the English original, never from text that was already translated (they would grow on every pass).
  const lead = alreadyTranslated ? known.lead : raw.match(/^\s*/)[0];
  const tail = alreadyTranslated ? known.tail : raw.match(/\s*$/)[0];
  const translated = lead + hindi.trim() + tail;
  if (node.nodeValue !== translated) node.nodeValue = translated;   // only touch the page when something changes, so the observer settles
  i18nOriginalText.set(node, { english, hindi: translated, lead, tail });
}

function i18nTranslateAttrs(element) {
  if (element.nodeType !== 1 || ['SCRIPT', 'STYLE'].includes(element.tagName)) return;
  for (const attr of I18N_ATTRS) {
    if (!element.hasAttribute(attr) || i18nInsideDocument(element)) continue;
    const saved = i18nOriginalAttrs.get(element) || {};
    const current = element.getAttribute(attr);
    const english = saved[attr] && current === saved[attr].hindi ? saved[attr].english : current;
    const hindi = hiLookup(english.trim());
    if (hindi === null) continue;
    if (element.getAttribute(attr) !== hindi) element.setAttribute(attr, hindi);
    saved[attr] = { english, hindi };
    i18nOriginalAttrs.set(element, saved);
  }
}

function i18nTranslateTree(root) {
  if (!root) return;
  i18nApplying = true;
  try {
    if (root.nodeType === 3) { i18nTranslateText(root); return; }
    if (root.nodeType !== 1) return;
    i18nTranslateAttrs(root);
    root.querySelectorAll('[placeholder], [title], [aria-label]').forEach(i18nTranslateAttrs);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(i18nTranslateText);
  } finally {
    i18nApplying = false;
  }
}

// Back to English: put every translated piece of text back.
function i18nRestoreTree(root) {
  i18nApplying = true;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, saved = i18nOriginalText.get(node);
      if (saved && node.nodeValue === saved.hindi) {
        const lead = saved.lead ?? node.nodeValue.match(/^\s*/)[0], tail = saved.tail ?? node.nodeValue.match(/\s*$/)[0];
        node.nodeValue = lead + saved.english + tail;
      }
    }
    root.querySelectorAll('[placeholder], [title], [aria-label]').forEach(element => {
      const saved = i18nOriginalAttrs.get(element);
      if (!saved) return;
      for (const attr of I18N_ATTRS) {
        if (saved[attr] && element.getAttribute(attr) === saved[attr].hindi) element.setAttribute(attr, saved[attr].english);
      }
    });
  } finally {
    i18nApplying = false;
  }
}

const i18nObserver = new MutationObserver(mutations => {
  if (i18nApplying || uiLang === 'en') return;
  const pending = new Set();
  mutations.forEach(mutation => {
    if (mutation.type === 'characterData') pending.add(mutation.target);
    else if (mutation.type === 'attributes') pending.add(mutation.target);
    else mutation.addedNodes.forEach(node => pending.add(node));
  });
  pending.forEach(node => {
    if (node.isConnected) i18nTranslateTree(node);
  });
});
i18nObserver.observe(document.documentElement, {
  childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS
});

// Switch the whole app (screens and the current document) to another language.
function applyUiLanguage(code) {
  if (!LANGUAGES.some(([value]) => value === code)) return;
  uiLang = code;
  try { localStorage.setItem(LANG_KEY, code); } catch { /* ignore */ }
  if (typeof touchSettings === 'function') touchSettings();   // the language is one of the settings kept in the database folder
  document.documentElement.lang = code;
  if (code === 'en') i18nRestoreTree(document.body);
  else i18nTranslateTree(document.body);
  const select = document.getElementById('langSelect');
  if (select) select.value = code;
}

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('langSelect');
  if (select) select.value = uiLang;
  if (uiLang !== 'en') i18nTranslateTree(document.body);
});
