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

/* Screen text added with Reports, Trash, sample data, the welcome window, the customer and item panels and the phone
   layout (third batch). Only words that are not in the dictionary yet are added, so earlier wording is never changed. */
(() => {
  const MORE = {
    /* sample data */
    'Sample data': 'नमूना डेटा',
    'Load sample data': 'नमूना डेटा जोड़ें',
    'Remove sample data': 'नमूना डेटा हटाएँ',
    'Not sure what to enter? Add example customers, items, a sample business (with logo and signature), invoices, quotations and drafts to see how every feature works, reports included. They are made up.': 'समझ नहीं आ रहा क्या भरें? उदाहरण ग्राहक, वस्तुएँ, एक नमूना व्यापार (लोगो और हस्ताक्षर सहित), चालान, कोटेशन और ड्राफ़्ट जोड़ें और देखें कि रिपोर्ट सहित हर सुविधा कैसे काम करती है। ये सब काल्पनिक हैं।',
    'Removing takes out the example records that are still unchanged, and puts the invoice numbers and stock back. Your own customers, items and invoices are kept.': 'हटाने पर वे उदाहरण रिकॉर्ड निकल जाते हैं जो बदले नहीं गए हैं, और चालान संख्या व स्टॉक पहले जैसे हो जाते हैं। आपके अपने ग्राहक, वस्तुएँ और चालान बने रहते हैं।',
    'You are using sample data.': 'आप नमूना डेटा इस्तेमाल कर रहे हैं।',
    'The customers, items, invoices and business details are made-up examples.': 'ग्राहक, वस्तुएँ, चालान और व्यापार विवरण काल्पनिक उदाहरण हैं।',
    'Set up my business': 'अपना व्यापार सेट करें',
    'You have not backed up yet. Your CSV files are your only copy of your data.': 'आपने अभी तक बैकअप नहीं लिया है। आपकी CSV फ़ाइलें ही आपके डेटा की एकमात्र प्रति हैं।',
    /* customer panel and edit form */
    'Last invoice': 'आख़िरी चालान',
    'Contact & tax details': 'संपर्क और कर विवरण',
    'GSTIN check': 'GSTIN जाँच',
    '⚠ The check character does not match, so a character may be mistyped. Compare it with the GST portal.': '⚠ जाँच अक्षर मेल नहीं खाता, शायद कोई अक्षर ग़लत लिखा गया है। GST पोर्टल से मिलाएँ।',
    'The check character does not match, so a character may be mistyped. Compare it with the GST portal.': 'जाँच अक्षर मेल नहीं खाता, शायद कोई अक्षर ग़लत लिखा गया है। GST पोर्टल से मिलाएँ।',
    'Verify on GST portal ↗': 'GST पोर्टल पर जाँचें ↗',
    'Copies the GSTIN and opens the official GST portal search page': 'GSTIN कॉपी करता है और आधिकारिक GST पोर्टल का खोज पृष्ठ खोलता है',
    'Registered as': 'पंजीकरण का प्रकार',
    'Association of persons': 'व्यक्तियों का संघ',
    'Body of individuals': 'व्यक्तियों का निकाय',
    'Company': 'कंपनी',
    'Firm / LLP': 'फ़र्म / LLP',
    'Government': 'सरकार',
    'Hindu undivided family': 'हिंदू अविभाजित परिवार',
    'Artificial juridical person': 'कृत्रिम न्यायिक व्यक्ति',
    'Local authority': 'स्थानीय प्राधिकरण',
    'Individual / proprietor': 'व्यक्ति / स्वामी',
    'Trust': 'ट्रस्ट',
    'Tax on invoices': 'चालानों पर कर',
    'CGST + SGST (same state)': 'CGST + SGST (एक ही राज्य)',
    'IGST (other state)': 'IGST (दूसरा राज्य)',
    'Other contacts': 'अन्य संपर्क',
    'Shipping addresses': 'शिपिंग पते',
    'No saved shipping addresses. Add them with Edit.': 'कोई सहेजा शिपिंग पता नहीं। “बदलें” से जोड़ें।',
    'Average invoice': 'औसत चालान',
    'Customer since': 'ग्राहक कब से',
    'Not counted in totals': 'कुल में नहीं गिना गया',
    'Price list': 'मूल्य सूची',
    'Changes will be saved to customers.csv.': 'बदलाव customers.csv में सहेजे जाएँगे।',
    'People to reach besides the main phone and email above.': 'ऊपर दिए मुख्य फ़ोन और ईमेल के अलावा जिनसे संपर्क करें।',
    'Remove': 'हटाएँ',
    '+ Add contact': '+ संपर्क जोड़ें',
    'Pick one of these as “Ship to” while creating an invoice.': 'चालान बनाते समय इनमें से एक को “यहाँ भेजें” पते के रूप में चुनें।',
    '+ Add shipping address': '+ शिपिंग पता जोड़ें',
    'Contact role': 'संपर्क की भूमिका',
    'Contact phone': 'संपर्क फ़ोन',
    'Contact email': 'संपर्क ईमेल',
    'Contact name': 'संपर्क का नाम',
    'Role (e.g. Accounts)': 'भूमिका (जैसे लेखा)',
    'Check': 'जाँचें',
    'Wholesale': 'थोक',
    'Phone number': 'फ़ोन नंबर',
    'Email address': 'ईमेल पता',
    'GSTIN (optional)': 'GSTIN (वैकल्पिक)',
    'Optional – if different from billing': 'वैकल्पिक – अगर बिलिंग पते से अलग हो',
    'Billed at wholesale rates': 'थोक दरों पर बिल',
    /* sidebar, invoice page */
    'InvoiceGen': 'InvoiceGen',
    'Reports': 'रिपोर्ट',
    'Trash': 'ट्रैश',
    'Retail price': 'खुदरा मूल्य',
    'Wholesale price': 'थोक मूल्य',
    'Watermark': 'वॉटरमार्क',
    '⚙ Invoice settings': '⚙ चालान सेटिंग',
    'Details': 'विवरण',
    'Invoice details': 'चालान विवरण',
    'Shipping address': 'शिपिंग पता',
    'Tax breakdown': 'कर का ब्योरा',
    'Bank, signature & terms': 'बैंक, हस्ताक्षर और शर्तें',
    'Price list for this invoice': 'इस चालान की मूल्य सूची',
    'Invoice watermark': 'चालान वॉटरमार्क',
    'Open the guide: how to install the app and connect your data folder': 'गाइड खोलें: ऐप इंस्टॉल करने और डेटा फ़ोल्डर जोड़ने का तरीका',
    'Install InvoiceGen as an app with a desktop icon. It also opens without internet.': 'InvoiceGen को डेस्कटॉप आइकन वाले ऐप की तरह इंस्टॉल करें। यह बिना इंटरनेट के भी खुलता है।',
    'Price list: decides which rate is used when you pick items': 'मूल्य सूची: वस्तु चुनने पर कौन-सी दर लगेगी, यह तय करती है',
    'Stamp across the invoice. Click the selected one again to remove it.': 'चालान पर लगने वाली मुहर। हटाने के लिए चुनी हुई पर फिर से क्लिक करें।',
    'New invoices start with whatever you last chose here': 'नए चालान वही चुनाव लेकर शुरू होते हैं जो आपने यहाँ आख़िरी बार चुना था',
    'Paper': 'काग़ज़',
    'A4 (full page)': 'A4 (पूरा पेज)',
    'A4 half page': 'A4 आधा पेज',
    'Thermal 80 mm': 'थर्मल 80 mm',
    'Thermal 58 mm': 'थर्मल 58 mm',
    'Paper size used when printing or saving this invoice as PDF': 'इस चालान को प्रिंट करने या PDF बनाने में इस्तेमाल होने वाला काग़ज़ का आकार',
    'GST on top': 'GST ऊपर से',
    'GST included': 'GST शामिल',
    'Paid': 'भुगतान हो गया',
    'Not paid': 'भुगतान बाकी',
    /* units (shown on screen; the invoice keeps the unit as saved) */
    'Nos': 'नग', 'Kg': 'किग्रा', 'Gm': 'ग्राम', 'Litre': 'लीटर', 'Metre': 'मीटर', 'Sq. metre': 'वर्ग मीटर',
    'Box': 'डिब्बा', 'Packet': 'पैकेट', 'Pair': 'जोड़ी', 'Dozen': 'दर्जन',
    /* items */
    'Selling rate': 'बिक्री दर',
    'Quantity sold': 'बिकी मात्रा',
    'Last sold': 'आख़िरी बिक्री',
    'Changes will be saved to items.csv.': 'बदलाव items.csv में सहेजे जाएँगे।',
    'Wholesale rate (optional)': 'थोक दर (वैकल्पिक)',
    'Purchase price (optional)': 'ख़रीद मूल्य (वैकल्पिक)',
    'Stock on hand (blank = not tracked)': 'मौजूदा स्टॉक (ख़ाली = ट्रैक नहीं)',
    'Leave blank to use the retail rate': 'खुदरा दर इस्तेमाल करने के लिए ख़ाली छोड़ें',
    'Enter purchase price (optional)': 'ख़रीद मूल्य लिखें (वैकल्पिक)',
    'Leave blank to not track stock': 'स्टॉक ट्रैक न करना हो तो ख़ाली छोड़ें',
    'Leave blank to not track stock for this item': 'इस वस्तु का स्टॉक ट्रैक न करना हो तो ख़ाली छोड़ें',
    'Low Stock': 'कम स्टॉक',
    'Under 10 in stock (red under 5)': 'स्टॉक 10 से कम (5 से कम पर लाल)',
    'Wholesale rate': 'थोक दर',
    'Opening stock': 'शुरुआती स्टॉक',
    'Low stock (under 10)': 'कम स्टॉक (10 से कम)',
    'HSN/': 'HSN/', 'SAC': 'SAC', 'PAN': 'PAN', 'INV': 'INV', 'CSV': 'CSV', 'Excel': 'Excel', 'PDF': 'PDF',
    'Retail': 'खुदरा', 'Stock': 'स्टॉक', 'Last': 'आख़िरी', 'Low': 'कम', 'Very low': 'बहुत कम',
    'Product or service name': 'वस्तु या सेवा का नाम',
    'HSN/SAC code': 'HSN/SAC कोड',
    'Unit rate': 'इकाई दर',
    'Optional': 'वैकल्पिक',
    'Used for customers on the Wholesale price list': 'थोक मूल्य सूची वाले ग्राहकों के लिए',
    'Stock cannot be negative. Enter 0 or more, or leave it blank to not track stock.': 'स्टॉक शून्य से कम नहीं हो सकता। 0 या उससे ज़्यादा लिखें, या स्टॉक ट्रैक न करना हो तो ख़ाली छोड़ें।',
    /* reports */
    'See your sales by customer, item and month, your best customers and items, and a revenue chart.': 'ग्राहक, वस्तु और महीने के अनुसार अपनी बिक्री, सबसे अच्छे ग्राहक और वस्तुएँ, और आय का चार्ट देखें।',
    'Sales': 'बिक्री', 'Day book': 'रोज़नामचा', 'Party-wise': 'पार्टी के अनुसार', 'Profit': 'मुनाफ़ा',
    'Total Sales': 'कुल बिक्री', 'Taxable Value': 'कर योग्य मूल्य', 'Sales before GST': 'GST से पहले की बिक्री',
    'GST Collected': 'वसूला गया GST', 'CGST + SGST + IGST': 'CGST + SGST + IGST', 'Average Invoice': 'औसत चालान',
    'Monthly': 'मासिक', 'Financial year': 'वित्त वर्ष', 'Revenue': 'आय',
    'Totals of saved invoices. The table below has the exact figures.': 'सहेजे गए चालानों का कुल। सटीक आँकड़े नीचे की तालिका में हैं।',
    'No saved invoices in this period yet.': 'इस अवधि में अभी कोई सहेजा गया चालान नहीं है।',
    'Top 5 customers': 'शीर्ष 5 ग्राहक', 'Top 5 items': 'शीर्ष 5 वस्तुएँ', 'No sales yet.': 'अभी कोई बिक्री नहीं।',
    'Sales by customer': 'ग्राहक के अनुसार बिक्री', 'Sales by item': 'वस्तु के अनुसार बिक्री', 'Sales by month': 'महीने के अनुसार बिक्री',
    'Saved invoices only. Drafts and quotations are not counted.': 'केवल सहेजे गए चालान। ड्राफ़्ट और कोटेशन नहीं गिने जाते।',
    'The invoice count is the number of invoices the item appears on.': 'चालान संख्या = कितने चालानों में यह वस्तु है।',
    'By customer': 'ग्राहक के अनुसार', 'By item': 'वस्तु के अनुसार', 'By month': 'महीने के अनुसार',
    'Taxable': 'कर योग्य', 'Share %': 'हिस्सा %', 'Report': 'रिपोर्ट', 'Chart period': 'चार्ट की अवधि',
    'Revenue by month': 'महीने के अनुसार आय', 'Revenue by financial year': 'वित्त वर्ष के अनुसार आय',
    'Download this report': 'यह रिपोर्ट डाउनलोड करें', 'Group sales by': 'बिक्री को इसके अनुसार बाँटें',
    'Every saved invoice in date order. The last column is the Paid / Not paid mark you set on the invoice.': 'हर सहेजा गया चालान तारीख़ के क्रम में। आख़िरी कॉलम वह “भुगतान हो गया / बाकी” निशान है जो आपने चालान पर लगाया।',
    'Day book ': 'रोज़नामचा', 'Invoice no.': 'चालान संख्या',
    'CGST + SGST': 'CGST + SGST', 'Sales within your state': 'आपके राज्य के अंदर बिक्री', 'Sales to other states': 'दूसरे राज्यों को बिक्री',
    'Total GST': 'कुल GST', 'GST collected by rate': 'दर के अनुसार वसूला गया GST',
    'CGST and SGST are for sales within your state, IGST for sales to other states. Saved invoices only.': 'CGST और SGST आपके राज्य के अंदर की बिक्री पर, IGST दूसरे राज्यों की बिक्री पर। केवल सहेजे गए चालान।',
    'GST rate': 'GST दर', 'Taxable value': 'कर योग्य मूल्य',
    'Party-wise sales': 'पार्टी के अनुसार बिक्री',
    'Click a customer to see their invoices. “Paid” and “Not paid” follow the mark you set on each invoice. Unmarked invoices are in the total only.': 'किसी ग्राहक पर क्लिक करके उसके चालान देखें। “भुगतान हो गया” और “भुगतान बाकी” हर चालान पर लगाए आपके निशान से तय होते हैं। बिना निशान वाले चालान सिर्फ़ कुल में गिने जाते हैं।',
    'Marked paid': 'भुगतान हो गया', 'Marked not paid': 'भुगतान बाकी', 'Total billed': 'कुल बिल', '← All parties': '← सभी पार्टियाँ',
    'Sales (before GST)': 'बिक्री (GST से पहले)', 'Items with a purchase price': 'जिन वस्तुओं का ख़रीद मूल्य दर्ज है',
    'Qty sold': 'बिकी मात्रा', 'Qty sold × purchase price': 'बिकी मात्रा × ख़रीद मूल्य', 'Sales minus cost': 'बिक्री में से लागत घटाकर',
    'A loss in this period': 'इस अवधि में घाटा', 'All items have a cost': 'सभी वस्तुओं की लागत दर्ज है',
    'Profit by item': 'वस्तु के अनुसार मुनाफ़ा', 'Margin %': 'मार्जिन %', 'Margin': 'मार्जिन', 'Cost': 'लागत',
    'Total (items with a cost)': 'कुल (लागत वाली वस्तुएँ)', 'Add a purchase price in Item Details': 'वस्तु विवरण में ख़रीद मूल्य जोड़ें',
    'Creating the PDF…': 'PDF बन रहा है…', 'PDF saved to your Downloads folder.': 'PDF आपके Downloads फ़ोल्डर में सहेजा गया।',
    'Could not create that file. Try CSV or Excel instead.': 'यह फ़ाइल नहीं बन सकी। CSV या Excel आज़माएँ।',
    /* profiles */
    '✓ Active': '✓ सक्रिय',
    /* trash */
    'Deleted invoices, customers and items. Restore them or delete them for good.': 'हटाए गए चालान, ग्राहक और वस्तुएँ। इन्हें वापस लाएँ या हमेशा के लिए हटाएँ।',
    'Deleted things stay here for 30 days. This list is kept in this browser. Restoring puts the item back in your data folder.': 'हटाई गई चीज़ें यहाँ 30 दिन रहती हैं। यह सूची इसी ब्राउज़र में रखी जाती है। वापस लाने पर चीज़ आपके डेटा फ़ोल्डर में लौट आती है।',
    'Restore all trash': 'सब वापस लाएँ', 'Empty all trash': 'ट्रैश पूरा ख़ाली करें',
    'Customers': 'ग्राहक', 'Items': 'वस्तुएँ', 'Deleted': 'हटाया गया', 'Kept for': 'और कितने दिन',
    'Restore': 'वापस लाएँ', 'Delete forever': 'हमेशा के लिए हटाएँ', 'Deleted items': 'हटाई गई चीज़ें',
    'Nothing here. Deleted invoices, customers and items stay in the trash for 30 days so you can bring them back.': 'यहाँ कुछ नहीं है। हटाए गए चालान, ग्राहक और वस्तुएँ 30 दिन तक यहाँ रहते हैं ताकि आप उन्हें वापस ला सकें।',
    'Undo': 'वापस करें',
    /* welcome window */
    'Welcome to InvoiceGen': 'InvoiceGen में आपका स्वागत है',
    'How would you like to start?': 'आप कैसे शुरू करना चाहेंगे?',
    'Add your business name and address. It takes about two minutes. Then you can create invoices.': 'अपने व्यापार का नाम और पता जोड़ें। लगभग दो मिनट लगेंगे। फिर आप चालान बना सकेंगे।',
    'Recommended': 'सुझाया गया',
    'Try it with sample data': 'नमूना डेटा के साथ आज़माएँ',
    'See how the app works with example customers, items, a sample business with logo and signature, and invoices, quotations and reports. You can remove it any time.': 'उदाहरण ग्राहकों, वस्तुओं, लोगो और हस्ताक्षर वाले नमूना व्यापार, और चालानों, कोटेशनों और रिपोर्टों के साथ देखें कि ऐप कैसे काम करता है। इसे कभी भी हटा सकते हैं।',
    'Skip for now': 'अभी छोड़ें',
    'Set up your business': 'अपना व्यापार सेट करें',
    'This appears at the top of every invoice. Fields marked * are needed.': 'यह हर चालान के ऊपर दिखता है। * वाले खाने ज़रूरी हैं।',
    'Your business': 'आपका व्यापार', 'Payment details': 'भुगतान विवरण', 'All set': 'सब तैयार',
    '(optional)': '(वैकल्पिक)', 'Remove logo': 'लोगो हटाएँ',
    'For example: Sharma General Store': 'जैसे: शर्मा जनरल स्टोर',
    'Shop number, street, city, PIN code': 'दुकान नंबर, गली, शहर, पिन कोड',
    'Mobile number': 'मोबाइल नंबर', 'Business name': 'व्यापार का नाम', 'Logo': 'लोगो',
    'Your business is ready.': 'आपका व्यापार तैयार है।', 'You are all set': 'सब तैयार है',
    'Create my first invoice': 'मेरा पहला चालान बनाएँ',
    'Press “Create my first invoice”. On the invoice page, click the customer box to add your first customer and the item box to add your first item. You can change any of this later in Business & Invoice Setup.': '“मेरा पहला चालान बनाएँ” दबाएँ। चालान पेज पर ग्राहक वाले खाने पर क्लिक करके पहला ग्राहक और वस्तु वाले खाने पर क्लिक करके पहली वस्तु जोड़ें। यह सब बाद में “व्यापार और चालान सेटअप” में बदल सकते हैं।',
    'So customers know how to pay you. You can skip this and add it later.': 'ताकि ग्राहक जानें कि भुगतान कैसे करें। इसे अभी छोड़कर बाद में जोड़ सकते हैं।',
    'IFSC code': 'IFSC कोड', '(optional, one per line)': '(वैकल्पिक, हर पंक्ति में एक)',
    'For example: State Bank': 'जैसे: स्टेट बैंक', 'For example: SBIN0001234': 'जैसे: SBIN0001234', 'Branch name': 'शाखा का नाम',
    'For example: Goods once sold will not be taken back.': 'जैसे: बेचा गया माल वापस नहीं लिया जाएगा।',
    'Account number': 'खाता संख्या', 'UPI ID': 'UPI ID',
    /* checks added after the test report */
    'Tap to see which and why': 'कौन-से और क्यों, देखने के लिए टैप करें',
    'These were saved before the app checked for these mistakes. Nothing has been changed. To correct one, create it again on Generate Invoice with the same invoice number and save it: the app asks before it replaces the saved one. For an invoice already sent to a customer, ask your accountant whether a credit note is needed.': 'ये चालान तब सहेजे गए थे जब ऐप इन ग़लतियों की जाँच नहीं करता था। कुछ भी बदला नहीं गया है। सुधारने के लिए “चालान बनाएँ” पर वही चालान संख्या डालकर इसे फिर से बनाएँ और सहेजें: सहेजा हुआ चालान बदलने से पहले ऐप पूछता है। जो चालान ग्राहक को भेजा जा चुका है, उसके लिए अपने अकाउंटेंट से पूछें कि क्रेडिट नोट चाहिए या नहीं।',
    'No place of supply, so IGST was charged.': 'आपूर्ति का स्थान नहीं है, इसलिए IGST लगा।',
    'No invoice date, so it is left out of date-based reports.': 'चालान की तारीख़ नहीं है, इसलिए यह तारीख़ वाली रिपोर्टों में नहीं गिना जाता।',
    'No items, or a total of ₹0.': 'कोई वस्तु नहीं, या कुल ₹0।',
    'An item has no quantity.': 'किसी वस्तु की मात्रा नहीं है।',
    'The due date is before the invoice date.': 'देय तिथि चालान की तारीख़ से पहले है।',
    'No customer': 'कोई ग्राहक नहीं', 'No number': 'कोई संख्या नहीं',
    'Enter an invoice number before saving this invoice.': 'इस चालान को सहेजने से पहले चालान संख्या लिखें।',
    'Enter a quotation number before saving this quotation.': 'इस कोटेशन को सहेजने से पहले कोटेशन संख्या लिखें।',
    'Connect the database, including invoices.csv, before saving an invoice.': 'चालान सहेजने से पहले डेटाबेस (invoices.csv सहित) जोड़ें।',
    'Connect the database, including invoices.csv, before saving a quotation.': 'कोटेशन सहेजने से पहले डेटाबेस (invoices.csv सहित) जोड़ें।',
    'The phone number can only have digits, spaces, + and -.': 'फ़ोन नंबर में सिर्फ़ अंक, खाली जगह, + और - हो सकते हैं।',
    'Enter a full phone number (10 digits, or with the country code).': 'पूरा फ़ोन नंबर लिखें (10 अंक, या देश कोड के साथ)।',
    'Enter a valid email address, for example name@example.com.': 'सही ईमेल पता लिखें, जैसे name@example.com।',
    'The account number should be 9 to 18 digits, with no letters.': 'खाता संख्या 9 से 18 अंकों की होनी चाहिए, अक्षरों के बिना।',
    'Enter a valid UPI ID, for example name@okhdfcbank.': 'सही UPI ID लिखें, जैसे name@okhdfcbank।',
    'Choose the Place of Supply before saving. It decides between CGST + SGST and IGST.': 'सहेजने से पहले आपूर्ति का स्थान चुनें। इसी से CGST + SGST या IGST तय होता है।'
  };
  for (const [english, hindi] of Object.entries(MORE)) if (!Object.prototype.hasOwnProperty.call(HI, english)) HI[english] = hindi;

  const doc = word => (word === 'quotation' ? 'कोटेशन' : 'चालान');
  const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  HI_PATTERNS.push(
    [/^Invoices of (.+)$/, m => `${m[1]} के चालान`],
    [/^(₹[\d,.]+) billed$/, m => `${m[1]} का बिल`],
    [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2})$/, m => `${HI_MON[MONTHS[m[1]]]} ${m[2]}`],
    [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}): (₹[\d,.]+)$/, m => `${HI_MON[MONTHS[m[1]]]} ${m[2]}: ${m[3]}`],
    [/^FY (\d{2}-\d{2})$/, m => `वि.व. ${m[1]}`],
    [/^Financial year (\d{4}-\d{2}): (₹[\d,.]+)$/, m => `वित्त वर्ष ${m[1]}: ${m[2]}`],
    [/^([▲▼]) ([\d.]+)% vs last month$/, m => `${m[1]} पिछले महीने से ${m[2]}%`],
    [/^HSN\/SAC (\S+) · (.+)$/, m => `HSN/SAC ${m[1]} · ${hiLookup(m[2]) ?? m[2]}`],
    [/^(.+) \((\d{2})\)$/, m => (HI_STATES[m[1]] ? `${HI_STATES[m[1]]} (${m[2]})` : null)],
    [/^(\d+) items?$/, m => `${m[1]} वस्तुएँ`],
    [/^(\d+) days?$/, m => `${m[1]} दिन`],
    [/^(\d+) saved invoices?$/, m => `${m[1]} सहेजे गए चालान`],
    [/^(\d+) items? without a cost$/, m => `${m[1]} वस्तुओं की लागत दर्ज नहीं`],
    [/^Profit = sales before GST minus quantity sold × the purchase price in Item Details\.(?: (\d+) items? (?:has|have) no purchase price, so (?:it is|they are) shown as “—” and left out of the totals\.)?$/,
      m => `मुनाफ़ा = GST से पहले की बिक्री में से बिकी मात्रा × वस्तु विवरण में दर्ज ख़रीद मूल्य घटाकर।${m[1] ? ` ${m[1]} वस्तुओं का ख़रीद मूल्य दर्ज नहीं है, इसलिए वे “—” दिखती हैं और कुल में नहीं गिनी जातीं।` : ''}`],
    [/^Add at least one item to the (invoice|quotation)\. The (?:invoice|quotation) was not saved\.$/, m => `${doc(m[1])} में कम से कम एक वस्तु जोड़ें। ${doc(m[1])} सहेजा नहीं गया।`],
    [/^Choose the (invoice|quotation) date\. The (?:invoice|quotation) was not saved\.$/, m => `${doc(m[1])} की तारीख़ चुनें। ${doc(m[1])} सहेजा नहीं गया।`],
    [/^Item (\d+) \((.+)\) has no quantity\. Enter a quantity above zero, or delete the row\. The (invoice|quotation) was not saved\.$/, m => `वस्तु ${m[1]} (${m[2]}) की मात्रा नहीं है। शून्य से ज़्यादा मात्रा लिखें या पंक्ति हटाएँ। ${doc(m[3])} सहेजा नहीं गया।`],
    [/^The due date \((.+)\) is before the (invoice|quotation) date \((.+)\)\. Choose a due date on or after it, or clear it\. The (?:invoice|quotation) was not saved\.$/, m => `देय तिथि (${m[1]}) ${doc(m[2])} की तारीख़ (${m[3]}) से पहले है। उसी दिन या बाद की तारीख़ चुनें, या इसे ख़ाली करें। ${doc(m[2])} सहेजा नहीं गया।`],
    [/^Choose the Place of Supply under Invoice details \(or add your state in Seller Info\) before saving this (invoice|quotation)\. It decides between CGST \+ SGST and IGST\.$/, m => `यह ${doc(m[1])} सहेजने से पहले “चालान विवरण” में आपूर्ति का स्थान चुनें (या “विक्रेता जानकारी” में अपना राज्य जोड़ें)। इसी से CGST + SGST या IGST तय होता है।`],
    [/^⚠ (\d+) saved invoices? needs? a look$/, m => `⚠ ${m[1]} सहेजे गए चालान जाँचने लायक हैं`],
    [/^Wrong tax type: charged (CGST \+ SGST|IGST), but the customer's GSTIN is from (.+), so (CGST \+ SGST|IGST) was due\.$/, m => `ग़लत कर प्रकार: ${m[1]} लगा, पर ग्राहक का GSTIN ${HI_STATES[m[2]] ?? m[2]} का है, इसलिए ${m[3]} लगना था।`],
    [/^The GSTIN starts with (\d{2}) \((.+)\), but the state chosen is (\d{2}) \((.+)\)\. Check the GSTIN or the state\.$/, m => `GSTIN ${m[1]} (${HI_STATES[m[2]] ?? m[2]}) से शुरू होता है, पर चुना गया राज्य ${m[3]} (${HI_STATES[m[4]] ?? m[4]}) है। GSTIN या राज्य जाँचें।`]
  );
})();

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
  if (typeof updateInvoiceSettingsSummary === 'function') updateInvoiceSettingsSummary();   // built from parts, so rebuilt in the new language
}

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('langSelect');
  if (select) select.value = uiLang;
  if (uiLang !== 'en') i18nTranslateTree(document.body);
});
