/* Example customers, items, sellers (with a logo), bank entries, terms, a signature image and a plan of sample invoices.
   All made up. Loaded by Backup & Restore > Load sample data and by "Try it with sample data" in the welcome pop-up. */
window.SAMPLE_DATA = {
 "customers": "\"name\",\"address\",\"phone\",\"email\",\"gstin\",\"active\",\"price_list\",\"contacts\",\"shipping_addresses\"\n\"Sharma General Store\",\"12 Gandhi Road, Karol Bagh, New Delhi 110005\",\"9000000001\",\"customer1@example.com\",\"07AAAAA0000A1Z5\",\"yes\",\"retail\",\"[{\"\"name\"\":\"\"Rajesh Sharma\"\",\"\"role\"\":\"\"Accounts\"\",\"\"phone\"\":\"\"9000000101\"\",\"\"email\"\":\"\"rajesh@example.com\"\"}]\",\"\"\n\"Gupta Traders\",\"45 Station Road, Andheri East, Mumbai 400069\",\"9000000002\",\"customer2@example.com\",\"27AAAAA0000A1Z5\",\"yes\",\"wholesale\",\"[{\"\"name\"\":\"\"Anita Gupta\"\",\"\"role\"\":\"\"Purchase\"\",\"\"phone\"\":\"\"9000000102\"\",\"\"email\"\":\"\"anita@example.com\"\"}]\",\"[{\"\"label\"\":\"\"Warehouse\"\",\"\"address\"\":\"\"Plot 2, Industrial Area Phase 2, Mumbai 400093\"\",\"\"phone\"\":\"\"\"\",\"\"email\"\":\"\"\"\"}]\"\n\"Patel Kirana & Supplies\",\"8 MG Road, Indiranagar, Bengaluru 560038\",\"9000000003\",\"customer3@example.com\",\"29AAAAA0000A1Z5\",\"yes\",\"retail\",\"\",\"\"\n\"Iyer Stationery Mart\",\"21 Anna Salai, T Nagar, Chennai 600017\",\"9000000004\",\"customer4@example.com\",\"33AAAAA0000A1Z5\",\"yes\",\"wholesale\",\"\",\"\"\n\"Khan Electronics\",\"7 Park Street, Salt Lake, Kolkata 700091\",\"9000000005\",\"customer5@example.com\",\"\",\"yes\",\"retail\",\"\",\"\"\n",
 "items": "﻿\"name\",\"hsn/sac\",\"rate\",\"unit\",\"gst\",\"cost\",\"active\",\"price_history\",\"stock\",\"wholesale_rate\"\r\n\"Basmati Rice\",\"1006\",\"95\",\"Kg\",\"5\",\"78\",\"yes\",\"\",\"105\",\"88\"\r\n\"Wheat Flour (Atta)\",\"1101\",\"45\",\"Kg\",\"0\",\"38\",\"yes\",\"\",\"180\",\"42\"\r\n\"Refined Sunflower Oil\",\"1512\",\"140\",\"Litre\",\"5\",\"118\",\"yes\",\"\",\"18\",\"132\"\r\n\"White Sugar\",\"1701\",\"44\",\"Kg\",\"0\",\"38\",\"yes\",\"\",\"90\",\"41\"\r\n\"Tea Leaves\",\"0902\",\"420\",\"Kg\",\"5\",\"350\",\"yes\",\"\",\"16\",\"395\"\r\n\"Turmeric Powder\",\"0910\",\"180\",\"Kg\",\"5\",\"150\",\"yes\",\"\",\"28\",\"168\"\r\n\"Toor Dal\",\"0713\",\"130\",\"Kg\",\"0\",\"105\",\"yes\",\"\",\"80\",\"120\"\r\n\"Biscuit Family Pack\",\"1905\",\"60\",\"Box\",\"18\",\"48\",\"yes\",\"\",\"64\",\"55\"\r\n\"Mineral Water 1 L\",\"2201\",\"20\",\"Litre\",\"18\",\"14\",\"yes\",\"\",\"58\",\"18\"\r\n\"Detergent Powder\",\"3402\",\"95\",\"Packet\",\"18\",\"72\",\"yes\",\"\",\"60\",\"88\"\r\n\"Cotton T-Shirt\",\"6109\",\"299\",\"Nos\",\"5\",\"210\",\"yes\",\"\",\"38\",\"275\"\r\n\"Notebook (200 pages)\",\"4820\",\"55\",\"Nos\",\"12\",\"38\",\"yes\",\"\",\"205\",\"50\"\r\n\"Sports Shoes\",\"6404\",\"999\",\"Pair\",\"18\",\"720\",\"yes\",\"\",\"12\",\"930\"\r\n\"LED Bulb 9W\",\"8539\",\"90\",\"Nos\",\"12\",\"62\",\"yes\",\"\",\"114\",\"82\"\r\n\"Delivery Service\",\"9965\",\"500\",\"Nos\",\"18\",\"\",\"yes\",\"\",\"\",\"450\"\r\n",
 "seller": "﻿\"name\",\"gstin\",\"address\",\"mobile\",\"email\",\"state\",\"logo\"\r\n\"Sunrise Traders\",\"07AAAAA0000A1Z5\",\"Shop 12, Market Road, New Delhi 110001\",\"9000001001\",\"sunrise@example.com\",\"07\",\"data:image/png;base64,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\"\r\n\"Ocean Mart\",\"27AAAAA0000A1Z5\",\"14 Harbour Street, Mumbai 400001\",\"9000001002\",\"ocean@example.com\",\"27\",\"\"\r\n\"Green Valley Foods\",\"29AAAAA0000A1Z5\",\"27 Garden Road, Bengaluru 560001\",\"9000001003\",\"green@example.com\",\"29\",\"\"\r\n\"Lotus Enterprises\",\"33AAAAA0000A1Z5\",\"8 Temple Street, Chennai 600001\",\"9000001004\",\"lotus@example.com\",\"33\",\"\"\r\n\"Metro Supplies\",\"19AAAAA0000A1Z5\",\"31 Park Street, Kolkata 700001\",\"9000001005\",\"metro@example.com\",\"19\",\"\"\r\n",
 "bank": "\"bank\",\"account\",\"ifsc\",\"branch\",\"upi\",\"include_invoice_total\"\r\n\"State Demo Bank\",\"000000000001\",\"SAMP0000001\",\"Main Branch, New Delhi\",\"sunrise@demobank\",\"true\"\r\n\"City Demo Bank\",\"000000000002\",\"SAMP0000002\",\"Harbour Branch, Mumbai\",\"oceanmart@citybank\",\"false\"\r\n",
 "terms": "\"set_name\",\"term\"\r\n\"Sample terms\",\"Sample terms: replace these with your own.\"\r\n\"Sample terms\",\"Goods once sold will not be taken back or exchanged.\"\r\n\"Sample terms\",\"Payment is due within 15 days of the invoice date.\"\r\n",
 "plan": [
  {
   "d": 172,
   "kind": "saved",
   "cust": "Sharma General Store",
   "paid": true,
   "lines": [
    [
     "Basmati Rice",
     10
    ],
    [
     "Tea Leaves",
     2
    ]
   ]
  },
  {
   "d": 150,
   "kind": "saved",
   "cust": "Gupta Traders",
   "paid": true,
   "lines": [
    [
     "Basmati Rice",
     50
    ],
    [
     "Wheat Flour (Atta)",
     100
    ]
   ]
  },
  {
   "d": 131,
   "kind": "saved",
   "cust": "Khan Electronics",
   "paid": true,
   "lines": [
    [
     "LED Bulb 9W",
     20
    ],
    [
     "Notebook (200 pages)",
     30
    ]
   ]
  },
  {
   "d": 112,
   "kind": "saved",
   "cust": "Iyer Stationery Mart",
   "paid": true,
   "lines": [
    [
     "Notebook (200 pages)",
     120
    ],
    [
     "Detergent Powder",
     20
    ]
   ]
  },
  {
   "d": 96,
   "kind": "saved",
   "cust": "Patel Kirana & Supplies",
   "paid": false,
   "lines": [
    [
     "Refined Sunflower Oil",
     12
    ],
    [
     "White Sugar",
     25
    ],
    [
     "Toor Dal",
     15
    ]
   ]
  },
  {
   "d": 79,
   "kind": "saved",
   "cust": "Gupta Traders",
   "paid": true,
   "lines": [
    [
     "LED Bulb 9W",
     60
    ],
    [
     "Detergent Powder",
     10
    ]
   ],
   "discount": 5
  },
  {
   "d": 61,
   "kind": "saved",
   "cust": "Sharma General Store",
   "paid": true,
   "lines": [
    [
     "Cotton T-Shirt",
     6
    ],
    [
     "Sports Shoes",
     2
    ]
   ]
  },
  {
   "d": 44,
   "kind": "saved",
   "cust": "Khan Electronics",
   "paid": false,
   "lines": [
    [
     "Sports Shoes",
     3
    ],
    [
     "LED Bulb 9W",
     12
    ]
   ]
  },
  {
   "d": 30,
   "kind": "saved",
   "cust": "Sharma General Store",
   "paid": true,
   "lines": [
    [
     "Wheat Flour (Atta)",
     20
    ],
    [
     "White Sugar",
     30
    ],
    [
     "Delivery Service",
     2
    ]
   ],
   "round": true
  },
  {
   "d": 20,
   "kind": "quote",
   "cust": "Gupta Traders",
   "lines": [
    [
     "Tea Leaves",
     10
    ],
    [
     "Turmeric Powder",
     8
    ],
    [
     "Toor Dal",
     40
    ]
   ],
   "convertedTo": 10
  },
  {
   "d": 18,
   "kind": "saved",
   "cust": "Gupta Traders",
   "paid": false,
   "lines": [
    [
     "Tea Leaves",
     10
    ],
    [
     "Turmeric Powder",
     8
    ],
    [
     "Toor Dal",
     40
    ]
   ]
  },
  {
   "d": 9,
   "kind": "saved",
   "cust": "Patel Kirana & Supplies",
   "paid": true,
   "lines": [
    [
     "Mineral Water 1 L",
     50
    ],
    [
     "Biscuit Family Pack",
     24
    ]
   ]
  },
  {
   "d": 5,
   "kind": "quote",
   "cust": "Patel Kirana & Supplies",
   "lines": [
    [
     "Basmati Rice",
     25
    ],
    [
     "Refined Sunflower Oil",
     10
    ]
   ]
  },
  {
   "d": 3,
   "kind": "saved",
   "cust": "Iyer Stationery Mart",
   "paid": false,
   "lines": [
    [
     "Cotton T-Shirt",
     20
    ],
    [
     "Sports Shoes",
     5
    ]
   ]
  },
  {
   "d": 2,
   "kind": "draft",
   "cust": "Sharma General Store",
   "lines": [
    [
     "Mineral Water 1 L",
     30
    ],
    [
     "Detergent Powder",
     6
    ]
   ]
  },
  {
   "d": 1,
   "kind": "draft",
   "cust": "Khan Electronics",
   "lines": [
    [
     "LED Bulb 9W",
     10
    ]
   ]
  }
 ],
 "signature": "data:image/png;base64,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"
};
