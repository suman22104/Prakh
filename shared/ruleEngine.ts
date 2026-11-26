import { analyzeInteropIdentifiers } from './interopCheck';
import { maskSensitiveData } from './masking';
import { analyzeUrlsInText } from './urlAnalyzer';
import type {
  AssessmentSource,
  ConfidenceLevel,
  ConsentOptions,
  InputType,
  LanguageCode,
  ScamAnalysisResult,
  Verdict,
} from './types';

interface RuleSignal {
  id: string;
  weight: number;
  patterns: RegExp[];
  label: Record<LanguageCode, string>;
}

const RULE_SIGNALS: RuleSignal[] = [
  {
    id: 'otp_pin_theft',
    weight: 42,
    patterns: [
      /\b(share|send|enter|tell|provide|confirm|submit)\b.{0,30}\b(otp|upi\s*pin|mpin|atm\s*pin|cvv|card\s*pin|passcode)\b/i,
      /\b(otp|upi\s*pin|mpin|cvv)\b.{0,30}\b(required|urgent|verify|receive|refund|cashback|immediately|share)\b/i,
      /(otp|pin|upi\s*pin|ओटीपी|पिन|यूपीआई\s*पिन).{0,25}(बताएं|भेजें|डालें|शेयर|दें)/i,
      /(otp|pin|upi\s*pin|ওটিপি|পিন|ইউপিআই\s*পিন).{0,25}(দিন|পাঠান|শেয়ার|বলেন)/i,
    ],
    label: {
      en: 'Asks for your OTP, UPI PIN, or card security code',
      hi: 'आपका OTP, UPI पिन या कार्ड का गुप्त कोड मांगा जा रहा है',
      bn: 'আপনার OTP, UPI পিন বা কার্ডের গোপন কোড চাওয়া হচ্ছে',
    },
  },
  {
    id: 'upi_receive_pin_trap',
    weight: 40,
    patterns: [
      /\b(accept|approve|click|scan|pay)\b.{0,35}\b(receive|get|claim|credit|refund|cashback)\b/i,
      /\b(enter|type)\s+(?:your\s+)?(?:upi\s*)?pin\b.{0,30}\b(receive|credit|refund|cashback|prize)\b/i,
      /\bcollect\s*request\b.{0,35}\b(receive|refund|cashback|prize)\b/i,
      /\bscan\s*(?:this\s*)?qr\b.{0,30}\b(receive|get|credit|refund|cashback)\b/i,
      /(पैसे\s*पाने|रिफंड|कैशबैक).{0,25}(पिन|pin|क्यूआर|qr|स्कैन|अप्रूव)/i,
      /(টাকা\s*পেতে|রিফান্ড|ক্যাশব্যাক).{0,25}(পিন|pin|কিউআর|qr|স্ক্যান|অ্যাপ্রুভ)/i,
    ],
    label: {
      en: 'Claims you must approve a request, scan a QR, or enter PIN to receive money (you never need a PIN to receive money)',
      hi: 'पैसे पाने के लिए रिक्वेस्ट अप्रूव करने, QR स्कैन करने या PIN डालने को कहा गया है (पैसे लेने के लिए कभी PIN नहीं लगता)',
      bn: 'টাকা পাওয়ার জন্য রিকোয়েস্ট অ্যাপ্রুভ, QR স্ক্যান বা PIN দিতে বলা হয়েছে (টাকা পেতে কখনো PIN লাগে না)',
    },
  },
  {
    id: 'kyc_pan_scam',
    weight: 30,
    patterns: [
      /\b(kyc|e-kyc|re-kyc|pan\s*card|aadhaar|aadhar)\b.{0,35}\b(expired|pending|update|suspended|blocked|deactivate|verify|incomplete|mandatory)\b/i,
      /\b(update|verify|complete)\s+(?:your\s+)?(?:bank\s+)?(kyc|pan|aadhaar)\b/i,
      /(kyc|pan|केवाईसी|पैन\s*कार्ड|आधार).{0,25}(अपडेट|बंद|ब्लॉक|समाप्त|वेरिफाई)/i,
      /(kyc|pan|কেওয়াইসি|প্যান\s*কার্ড|আধার).{0,25}(আপডেট|বন্ধ|ব্লক|ভেরিফাই)/i,
    ],
    label: {
      en: 'Urgent KYC, PAN, or Aadhaar update warning',
      hi: 'तुरंत KYC, PAN या आधार अपडेट करने की चेतावनी',
      bn: 'জরুরি KYC, PAN বা আধার আপডেট করার সতর্কবার্তা',
    },
  },
  {
    id: 'account_block_threat',
    weight: 28,
    patterns: [
      /\b(account|a\/c|card|upi|wallet|sim|electricity|power|gas|netbanking)\b.{0,35}\b(blocked|suspended|deactivated|frozen|disconnected|closed|hold|terminated)\b/i,
      /\b(will\s+be\s+(?:blocked|suspended|disconnected|frozen|closed))\b/i,
      /(खाता|अकाउंट|बिजली|कार्ड).{0,25}(बंद|ब्लॉक|निलंबित|काट\s*दी)/i,
      /(অ্যাকাউন্ট|কার্ড|বিদ্যুৎ).{0,25}(বন্ধ|ব্লক|বিচ্ছিন্ন)/i,
    ],
    label: {
      en: 'Threatens bank account, card, or utility disconnection to create panic',
      hi: 'घबराहट पैदा करने के लिए खाता, कार्ड या बिजली बंद करने की धमकी',
      bn: 'আতঙ্ক তৈরি করতে ব্যাংক অ্যাকাউন্ট, কার্ড বা সংযোগ বন্ধের হুমকি',
    },
  },
  {
    id: 'cashback_lottery_bait',
    weight: 32,
    patterns: [
      /\b(won|winner|congratulations|lucky\s*draw|lottery|jackpot|kbc|bumper\s*prize|scratch\s*card)\b/i,
      /\b(claim|redeem|unlock)\b.{0,30}\b(cashback|reward|prize|bonus|voucher|lakh|crore|rs\.?\s*[\d,]{3,}|₹\s*[\d,]{3,})\b/i,
      /\b(cashback|reward|refund)\s+(?:of\s+)?(?:rs\.?|inr|₹)\s*[\d,]{3,}\b.{0,35}\b(click|link|claim|accept|approve|tap)\b/i,
      /(लॉटरी|इनाम|कैशबैक|जीत\s*गए|बधाई|लकी\s*ड्रॉ)/i,
      /(লটারি|পুরস্কার|ক্যাশব্যাক|জিতেছেন|অভিনন্দন)/i,
    ],
    label: {
      en: 'Promises unexpected cashback, prize money, or lottery winnings',
      hi: 'अचानक कैशबैक, इनाम या लॉटरी जीतने का लालच',
      bn: 'অপ্রত্যাশিত ক্যাশব্যাক, পুরস্কার বা লটারি জেতার প্রলোভন',
    },
  },
  {
    id: 'urgency_pressure',
    weight: 18,
    patterns: [
      /\b(within\s+\d+\s*(?:min|mins|minutes|hr|hrs|hours)|immediately|urgent(?:ly)?|today\s*only|last\s*warning|final\s*notice|act\s*now|right\s*now|before\s*midnight|expires\s*today)\b/i,
      /(तुरंत|अभी|आज\s*ही|अंतिम\s*चेतावनी|24\s*घंटे|2\s*घंटे)/i,
      /(জরুরি|এখনই|আজই|শেষ\s*সতর্কতা|২৪\s*ঘণ্টা)/i,
    ],
    label: {
      en: 'Creates artificial time pressure so you act without checking',
      hi: 'बिना सोचे कदम उठाने के लिए समय की जल्दबाज़ी बनाई जा रही है',
      bn: 'যাচাই না করেই পদক্ষেপ নিতে সময়ের চাপ সৃষ্টি করা হচ্ছে',
    },
  },
  {
    id: 'impersonation_authority',
    weight: 22,
    patterns: [
      /\b(rbi|reserve\s*bank|income\s*tax|customs|cbi|cyber\s*police|trai|digital\s*arrest|sbi\s*support|hdfc\s*care|icici\s*desk|customer\s*care\s*executive|govt\s*subsidy|pm\s*kisan)\b/i,
      /\b(call\s+(?:this\s+)?(?:helpline|customer\s*care|officer|manager)\s*(?:number)?)\b/i,
      /(ग्राहक\s*सेवा|कस्टमर\s*केयर|बैंक\s*मैनेजर|आरबीआई|पुलिस)/i,
      /(কাস্টমার\s*কেয়ার|ব্যাংক\s*ম্যানেজার|আরবিআই|পুলিশ)/i,
    ],
    label: {
      en: 'Claims to be from a bank, government office, or customer support',
      hi: 'बैंक, सरकारी विभाग या कस्टमर केयर अधिकारी होने का दावा',
      bn: 'ব্যাংক, সরকারি দপ্তর বা কাস্টমার কেয়ারের পরিচয় দেওয়া হচ্ছে',
    },
  },
  {
    id: 'remote_access_app',
    weight: 45,
    patterns: [
      /\b(anydesk|teamviewer|quicksupport|rustdesk|screen\s*share|download\s*apk|install\s*app)\b/i,
    ],
    label: {
      en: 'Asks to install a screen-sharing app or unknown APK (used to steal bank logins)',
      hi: 'स्क्रीन-शेयरिंग ऐप या अनजान APK इंस्टॉल करने को कहा गया है',
      bn: 'স্ক্রিন-শেয়ারিং অ্যাপ বা অজানা APK ইনস্টল করতে বলা হয়েছে',
    },
  },
  {
    id: 'urgent_money_transfer',
    weight: 24,
    patterns: [
      /\b(send|transfer|pay)\s+(?:me\s+)?(?:rs\.?|inr|₹)?\s*[\d,]{3,}\b.{0,30}\b(urgent(?:ly)?|emergency|hospital|immediately|now|fast|asap|processing\s*fee|registration\s*fee)\b/i,
      /\b(processing\s*fee|verification\s*fee|release\s*fee|customs\s*fee|tax\s*charge)\b/i,
    ],
    label: {
      en: 'Demands an urgent transfer or upfront processing/verification fee',
      hi: 'तुरंत पैसे भेजने या प्रोसेसिंग/वेरिफिकेशन फीस की मांग',
      bn: 'জরুরি টাকা পাঠানো বা প্রসেসিং/ভেরিফিকেশন ফি দাবি করা হচ্ছে',
    },
  },
];

const URL_FLAG_LABELS: Record<string, Record<LanguageCode, string>> = {
  shortened_url_hides_destination: {
    en: 'Contains a shortened web link that hides the real website address',
    hi: 'इसमें छोटा किया गया लिंक है जो असली वेबसाइट का पता छुपाता है',
    bn: 'এতে সংক্ষিপ্ত লিংক রয়েছে যা আসল ওয়েবসাইটের ঠিকানা লুকিয়ে রাখে',
  },
  unofficial_bank_or_kyc_lookalike: {
    en: 'Uses a lookalike website name pretending to be a bank, UPI, or KYC portal',
    hi: 'बैंक, UPI या KYC जैसी दिखने वाली नकली वेबसाइट का उपयोग किया गया है',
    bn: 'ব্যাংক, UPI বা KYC-র মতো দেখতে নকল ওয়েবসাইটের নাম ব্যবহার করা হয়েছে',
  },
  raw_ip_address_link: {
    en: 'Link points to a raw numeric IP address instead of a real bank website',
    hi: 'लिंक किसी असली बैंक वेबसाइट के बजाय सीधे संख्यात्मक IP पते पर जाता है',
    bn: 'লিংকটি আসল ব্যাংক ওয়েবসাইটের বদলে সরাসরি IP ঠিকানায় নিয়ে যায়',
  },
  insecure_http_link: {
    en: 'Uses an unencrypted http:// link instead of secure https://',
    hi: 'सुरक्षित https:// के बजाय असुरक्षित http:// लिंक का उपयोग',
    bn: 'নিরাপদ https://-এর বদলে অনিরাপদ http:// লিংক ব্যবহার করা হয়েছে',
  },
  high_risk_domain_extension: {
    en: 'Website uses a low-trust domain extension frequently abused in scams',
    hi: 'वेबसाइट ऐसे डोमेन एक्सटेंशन का उपयोग करती है जो अक्सर धोखाधड़ी में दिखता है',
    bn: 'ওয়েবসাইটটি এমন ডোমেইন এক্সটেনশন ব্যবহার করছে যা প্রায়ই প্রতারণায় ব্যবহৃত হয়',
  },
  punycode_lookalike_domain: {
    en: 'Website address uses disguised lookalike characters (punycode)',
    hi: 'वेबसाइट के पते में भ्रमित करने वाले अक्षरों का उपयोग है',
    bn: 'ওয়েবসাইটের ঠিকানায় বিভ্রান্তিকর অক্ষর ব্যবহার করা হয়েছে',
  },
  upi_payment_deep_link: {
    en: 'Contains a direct UPI payment link that could trigger an outgoing payment',
    hi: 'इसमें सीधा UPI भुगतान लिंक है जिससे आपके खाते से पैसे कट सकते हैं',
    bn: 'এতে সরাসরি UPI পেমেন্ট লিংক রয়েছে যা আপনার অ্যাকাউন্ট থেকে টাকা কাটার ঝুঁকি তৈরি করে',
  },
  upi_prefilled_amount: {
    en: 'UPI link pre-fills a payment amount automatically',
    hi: 'UPI लिंक में भुगतान की राशि पहले से भरी हुई है',
    bn: 'UPI লিংকটিতে আগে থেকেই টাকার পরিমাণ বসানো আছে',
  },
  url_credential_trick: {
    en: 'Link uses a deceptive "@" address trick to hide the actual destination',
    hi: 'लिंक असली वेबसाइट छुपाने के लिए "@" चाल का उपयोग करता है',
    bn: 'আসল ঠিকানা লুকাতে লিংকটিতে "@" কৌশল ব্যবহার করা হয়েছে',
  },
  suspicious_domain_structure: {
    en: 'Website address has an unusual multi-hyphen or nested subdomain structure',
    hi: 'वेबसाइट के पते की बनावट संदिग्ध है',
    bn: 'ওয়েবসাইটের ঠিকানার গঠন সন্দেহজনক',
  },
  unverified_external_link: {
    en: 'Includes an unverified external link — verify the domain carefully before opening',
    hi: 'इसमें एक असत्यापित बाहरी लिंक है — खोलने से पहले ध्यान से जांचें',
    bn: 'এতে একটি অযাচাইকৃত বাইরের লিংক আছে — খোলার আগে ভালোভাবে যাচাই করুন',
  },
};

const ADVISORY_DISCLAIMERS: Record<LanguageCode, string> = {
  en: 'Advisory Notice: Automated checks cannot guarantee that a message is safe or fraudulent. Scores are heuristic risk indicators, not calibrated probabilities. When in doubt, verify directly with your bank.',
  hi: 'सलाह सूचना: स्वचालित जांच किसी संदेश के पूरी तरह सुरक्षित या धोखाधड़ी होने की गारंटी नहीं दे सकती। जोखिम स्कोर केवल मार्गदर्शन के लिए है। संदेह होने पर सीधे अपने बैंक से पुष्टि करें।',
  bn: 'পরামর্শমূলক বিজ্ঞপ্তি: স্বয়ংক্রিয় যাচাই কোনো বার্তা নিরাপদ বা প্রতারণামূলক হওয়ার শতভাগ নিশ্চয়তা দিতে পারে না। ঝুঁকির স্কোর কেবল সহায়তার জন্য। সন্দেহ হলে সরাসরি আপনার ব্যাংকের সাথে যোগাযোগ করুন।',
};

const RECOMMENDED_ACTIONS: Record<Verdict, Record<LanguageCode, string[]>> = {
  SCAM: {
    en: [
      'Do not click any link, scan any QR code, or approve any UPI collect request',
      'Never share your OTP, UPI PIN, CVV, or bank password with anyone',
      'Block the sender and verify independently via your bank’s official app or number on the back of your debit card',
      'If money was already debited, call the National Cybercrime Helpline 1930 immediately and report at cybercrime.gov.in',
    ],
    hi: [
      'किसी भी लिंक पर क्लिक न करें, QR कोड स्कैन न करें और UPI रिक्वेस्ट अप्रूव न करें',
      'अपना OTP, UPI पिन, CVV या बैंक पासवर्ड किसी के साथ साझा न करें',
      'भेजने वाले को ब्लॉक करें और केवल अपने बैंक के आधिकारिक ऐप या डेबिट कार्ड के पीछे दिए नंबर से जांच करें',
      'यदि पैसे कट गए हैं, तो तुरंत राष्ट्रीय साइबर क्राइम हेल्पलाइन 1930 पर कॉल करें और cybercrime.gov.in पर शिकायत दर्ज करें',
    ],
    bn: [
      'কোনো লিংকে ক্লিক করবেন না, QR কোড স্ক্যান করবেন না এবং কোনো UPI রিকোয়েস্ট অ্যাপ্রুভ করবেন না',
      'আপনার OTP, UPI পিন, CVV বা ব্যাংক পাসওয়ার্ড কখনো কারো সাথে শেয়ার করবেন না',
      'প্রেরককে ব্লক করুন এবং আপনার ব্যাংকের অফিসিয়াল অ্যাপ বা ডেবিট কার্ডের পেছনের নম্বরে যোগাযোগ করে যাচাই করুন',
      'টাকা কেটে নেওয়া হলে অবিলম্বে জাতীয় সাইবার ক্রাইম হেল্পলাইন 1930-এ কল করুন এবং cybercrime.gov.in-এ অভিযোগ জানান',
    ],
  },
  SUSPICIOUS: {
    en: [
      'Pause before acting — do not tap links or approve payment requests until verified',
      'Check directly inside your official bank or UPI app instead of replying to this message',
      'Remember: receiving money on UPI never requires entering your UPI PIN',
      'Ask a trusted family member or request a human review if you are unsure',
    ],
    hi: [
      'रुकें और पहले जांच करें — पुष्टि किए बिना किसी लिंक या भुगतान रिक्वेस्ट पर टैप न करें',
      'इस संदेश का जवाब देने के बजाय सीधे अपने आधिकारिक बैंक या UPI ऐप में जांचें',
      'याद रखें: UPI पर पैसे प्राप्त करने के लिए कभी UPI पिन डालने की जरूरत नहीं होती',
      'यदि आप अनिश्चित हैं, तो परिवार के किसी विश्वसनीय सदस्य से पूछें या मानव समीक्षा का अनुरोध करें',
    ],
    bn: [
      'থামুন এবং যাচাই করুন — নিশ্চিত না হয়ে কোনো লিংকে ক্লিক বা পেমেন্ট রিকোয়েস্ট অ্যাপ্রুভ করবেন না',
      'এই বার্তার উত্তর না দিয়ে সরাসরি আপনার অফিসিয়াল ব্যাংক বা UPI অ্যাপে চেক করুন',
      'মনে রাখবেন: UPI-এ টাকা পাওয়ার জন্য কখনো আপনার UPI পিন দিতে হয় না',
      'সন্দেহ থাকলে পরিবারের বিশ্বস্ত কারো সাথে কথা বলুন বা মানব পর্যালোচনার অনুরোধ করুন',
    ],
  },
  UNCERTAIN: {
    en: [
      'Treat this message cautiously until you confirm who sent it',
      'Call the person or organization using a known phone number you already trust — not a number inside this message',
      'Never share an OTP or UPI PIN even if the sender seems familiar',
      'Consider requesting human review if this involves a money transfer',
    ],
    hi: [
      'जब तक भेजने वाले की पहचान पक्की न हो, इस संदेश के प्रति सावधान रहें',
      'संदेश में दिए गए नंबर के बजाय अपने पहले से जाने-पहचाने नंबर पर कॉल करके पुष्टि करें',
      'भेजने वाला परिचित लगे तब भी कभी OTP या UPI पिन साझा न करें',
      'यदि इसमें पैसे के लेन-देन की बात है, तो मानव समीक्षा का विकल्प चुनें',
    ],
    bn: [
      'প্রেরকের পরিচয় নিশ্চিত না হওয়া পর্যন্ত এই বার্তাটি নিয়ে সতর্ক থাকুন',
      'বার্তায় দেওয়া নম্বরের বদলে আপনার আগে থেকে জানা বিশ্বস্ত নম্বরে কল করে নিশ্চিত হন',
      'প্রেরক পরিচিত মনে হলেও কখনো OTP বা UPI পিন শেয়ার করবেন না',
      'এতে টাকা লেনদেনের বিষয় থাকলে মানব পর্যালোচনার অনুরোধ করতে পারেন',
    ],
  },
  SAFE: {
    en: [
      'No common scam warning signs were detected, but automated checks cannot guarantee safety',
      'Still avoid sharing OTPs, UPI PINs, or card details over SMS, WhatsApp, or phone calls',
      'If this is a bank alert about a transaction you did not make, contact your bank using the official number on your card',
    ],
    hi: [
      'धोखाधड़ी के सामान्य संकेत नहीं मिले, लेकिन स्वचालित जांच पूरी सुरक्षा की गारंटी नहीं देती',
      'फिर भी SMS, WhatsApp या कॉल पर कभी OTP, UPI पिन या कार्ड विवरण साझा न करें',
      'यदि यह किसी ऐसे लेन-देन का बैंक अलर्ट है जो आपने नहीं किया, तो कार्ड पर दिए आधिकारिक बैंक नंबर पर संपर्क करें',
    ],
    bn: [
      'সাধারণ প্রতারণার কোনো লক্ষণ পাওয়া যায়নি, তবে স্বয়ংক্রিয় যাচাই শতভাগ নিরাপত্তার নিশ্চয়তা দেয় না',
      'তবুও SMS, WhatsApp বা ফোনে কখনো OTP, UPI পিন বা কার্ডের তথ্য শেয়ার করবেন না',
      'আপনি করেননি এমন কোনো লেনদেনের ব্যাংক বার্তা হলে কার্ডে থাকা অফিসিয়াল নম্বরে যোগাযোগ করুন',
    ],
  },
};

function buildExplanation(
  verdict: Verdict,
  language: LanguageCode,
  warningCount: number,
  isFallback: boolean
): string {
  const modeNote: Record<LanguageCode, string> = {
    en: isFallback ? ' (assessed using local safety rules)' : '',
    hi: isFallback ? ' (स्थानीय सुरक्षा नियमों द्वारा जांचा गया)' : '',
    bn: isFallback ? ' (স্থানীয় নিরাপত্তা নিয়মে যাচাই করা হয়েছে)' : '',
  };

  if (verdict === 'SCAM') {
    const map: Record<LanguageCode, string> = {
      en: `This message shows ${warningCount} strong fraud indicators commonly seen in Indian UPI and banking scams${modeNote.en}. Do not follow its instructions or share any PIN/OTP.`,
      hi: `इस संदेश में भारतीय UPI और बैंकिंग धोखाधड़ी के ${warningCount} गंभीर संकेत मिले हैं${modeNote.hi}। इसके निर्देश न मानें और कोई PIN/OTP साझा न करें।`,
      bn: `এই বার্তাটিতে ভারতীয় UPI এবং ব্যাংকিং প্রতারণার ${warningCount}টি গুরুতর লক্ষণ পাওয়া গেছে${modeNote.bn}। এর নির্দেশ মানবেন না এবং কোনো PIN/OTP শেয়ার করবেন না।`,
    };
    return map[language];
  }

  if (verdict === 'SUSPICIOUS') {
    const map: Record<LanguageCode, string> = {
      en: `This message contains ${warningCount} suspicious warning sign${warningCount === 1 ? '' : 's'} that resemble phishing or payment fraud${modeNote.en}. Verify independently before taking action.`,
      hi: `इस संदेश में ${warningCount} संदिग्ध संकेत हैं जो फ़िशिंग या भुगतान धोखाधड़ी जैसे लगते हैं${modeNote.hi}। कोई भी कदम उठाने से पहले स्वतंत्र रूप से पुष्टि करें।`,
      bn: `এই বার্তাটিতে ${warningCount}টি সন্দেহজনক লক্ষণ রয়েছে যা ফিশিং বা পেমেন্ট প্রতারণার মতো${modeNote.bn}। কোনো পদক্ষেপ নেওয়ার আগে নিজে যাচাই করুন।`,
    };
    return map[language];
  }

  if (verdict === 'UNCERTAIN') {
    const map: Record<LanguageCode, string> = {
      en: `The message mentions payment or account details without enough context to judge clearly${modeNote.en}. Please verify directly with the sender or your bank before proceeding.`,
      hi: `संदेश में भुगतान या खाते का उल्लेख है, लेकिन स्पष्ट निर्णय के लिए पर्याप्त जानकारी नहीं है${modeNote.hi}। आगे बढ़ने से पहले सीधे भेजने वाले या बैंक से पुष्टि करें।`,
      bn: `বার্তাটিতে পেমেন্ট বা অ্যাকাউন্টের উল্লেখ আছে, তবে স্পষ্ট সিদ্ধান্ত নেওয়ার মতো যথেষ্ট তথ্য নেই${modeNote.bn}। এগিয়ে যাওয়ার আগে সরাসরি প্রেরক বা ব্যাংকের সাথে যাচাই করুন।`,
    };
    return map[language];
  }

  const safeMap: Record<LanguageCode, string> = {
    en: `No common UPI scam patterns or risky links were detected in this text${modeNote.en}. Because automated checks are advisory, always stay cautious with money requests.`,
    hi: `इस संदेश में UPI धोखाधड़ी के सामान्य संकेत या खतरनाक लिंक नहीं मिले${modeNote.hi}। चूंकि यह जांच केवल सलाह है, पैसों के लेन-देन में हमेशा सतर्क रहें।`,
    bn: `এই বার্তাটিতে UPI প্রতারণার সাধারণ লক্ষণ বা ঝুঁকিপূর্ণ লিংক পাওয়া যায়নি${modeNote.bn}। যেহেতু এটি পরামর্শমূলক যাচাই, তাই টাকা লেনদেনে সবসময় সতর্ক থাকুন।`,
  };
  return safeMap[language];
}

export function getAdvisoryDisclaimer(language: LanguageCode): string {
  return ADVISORY_DISCLAIMERS[language] ?? ADVISORY_DISCLAIMERS.en;
}

export function getDefaultActions(verdict: Verdict, language: LanguageCode): string[] {
  return RECOMMENDED_ACTIONS[verdict][language] ?? RECOMMENDED_ACTIONS[verdict].en;
}

/**
 * Pure deterministic rule-based scam assessment engine.
 * Shared across server fallback and browser offline PWA screening.
 */
export function runRuleBasedAnalysis(params: {
  message: string;
  inputType: InputType;
  language: LanguageCode;
  consent: ConsentOptions;
  assessmentSource: AssessmentSource;
  fallbackReason?: string;
}): ScamAnalysisResult {
  const { message, inputType, language, consent, assessmentSource, fallbackReason } = params;
  const trimmed = message.trim();
  const masking = maskSensitiveData(trimmed);
  const urlAnalysis = analyzeUrlsInText(trimmed);
  const interopAnalysis = analyzeInteropIdentifiers(trimmed, language);

  const warningSigns: string[] = [];
  let riskScore = 0;

  // Evaluate pattern rules on original text (never stored/returned raw!)
  for (const rule of RULE_SIGNALS) {
    if (rule.patterns.some((p) => p.test(trimmed))) {
      riskScore += rule.weight;
      warningSigns.push(rule.label[language] ?? rule.label.en);
    }
  }

  // Evaluate URL findings
  riskScore += urlAnalysis.totalUrlRiskPoints;
  for (const finding of urlAnalysis.findings) {
    for (const flag of finding.flags) {
      const label = URL_FLAG_LABELS[flag]?.[language] ?? URL_FLAG_LABELS[flag]?.en;
      if (label && !warningSigns.includes(label)) {
        warningSigns.push(label);
      }
    }
  }

  // Evaluate UPI bank handle / IFSC interoperability findings (synthetic offline bank directory)
  riskScore += interopAnalysis.totalInteropRiskPoints;
  for (const finding of interopAnalysis.findings) {
    if (finding.status === 'unrecognized' && !warningSigns.includes(finding.summaryLabel)) {
      warningSigns.push(finding.summaryLabel);
    }
  }

  // Contextual check for UPI collect requests
  if (inputType === 'upi_request' && /\b(request|collect|pay|approve|₹|rs\.?)\b/i.test(trimmed)) {
    if (riskScore === 0) {
      riskScore += 22;
      const msg: Record<LanguageCode, string> = {
        en: 'Payment request requires extra caution — confirm the receiver name and reason before entering UPI PIN',
        hi: 'भुगतान रिक्वेस्ट में अतिरिक्त सावधानी रखें — UPI पिन डालने से पहले प्राप्तकर्ता का नाम और कारण जांचें',
        bn: 'পেমেন্ট রিকোয়েস্টে বাড়তি সতর্কতা নিন — UPI পিন দেওয়ার আগে প্রাপকের নাম ও কারণ নিশ্চিত করুন',
      };
      warningSigns.push(msg[language]);
    }
  }

  // Check legitimate informational bank debit/credit alert pattern (no links, no OTP ask, no urgency, no fake bank handles)
  const looksLikeStandardBankAlert =
    /\b(debited|credited|avl\s*bal|available\s*balance|txn|upi\s*ref)\b/i.test(trimmed) &&
    !/\b(click|link|kyc|otp|pin|suspended|blocked|claim|won|lottery|cashback|approve)\b/i.test(trimmed) &&
    urlAnalysis.totalUrlRiskPoints === 0 &&
    !interopAnalysis.hasUnrecognizedHandle;

  if (looksLikeStandardBankAlert) {
    riskScore = Math.max(4, riskScore - 20);
  }

  // Check ambiguous payment/account context with low concrete evidence
  const hasFinancialMention =
    /\b(payment|transfer|invoice|account|upi|bank|refund|amount|rupees|rs\.?|₹|order|confirm|details|भुगतान|खाता|টাকা|পেমেন্ট)\b/i.test(
      trimmed
    );

  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

  let verdict: Verdict;
  let confidence: ConfidenceLevel;
  let humanReviewRecommended: boolean;

  if (riskScore >= 65) {
    verdict = 'SCAM';
    confidence = riskScore >= 80 ? 'HIGH' : 'MEDIUM';
    humanReviewRecommended = true;
  } else if (riskScore >= 32) {
    verdict = 'SUSPICIOUS';
    confidence = riskScore >= 50 ? 'HIGH' : 'MEDIUM';
    humanReviewRecommended = true;
  } else if (hasFinancialMention && !looksLikeStandardBankAlert && warningSigns.length <= 1) {
    verdict = 'UNCERTAIN';
    riskScore = Math.max(riskScore, 24);
    confidence = 'LOW';
    humanReviewRecommended = true;
    if (warningSigns.length === 0) {
      const uncertainNote: Record<LanguageCode, string> = {
        en: 'Mentions a financial or payment action without verifiable sender details',
        hi: 'बिना सत्यापित विवरण के वित्तीय या भुगतान कार्रवाई का उल्लेख है',
        bn: 'যাচাইযোগ্য তথ্য ছাড়াই আর্থিক বা পেমেন্ট সংক্রান্ত কাজের উল্লেখ আছে',
      };
      warningSigns.push(uncertainNote[language]);
    }
  } else {
    verdict = 'SAFE';
    confidence = looksLikeStandardBankAlert ? 'MEDIUM' : 'LOW';
    humanReviewRecommended = false;
  }

  const id = `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    verdict,
    riskScore,
    confidence,
    warningSigns: warningSigns.slice(0, 12),
    explanation: buildExplanation(verdict, language, warningSigns.length, assessmentSource !== 'hybrid_ai'),
    recommendedActions: getDefaultActions(verdict, language),
    humanReviewRecommended,
    assessmentSource,
    fallbackReason,
    maskedText: masking.maskedText,
    redactions: masking.redactions,
    inputType,
    language,
    urlAnalysis,
    interopAnalysis,
    consentSnapshot: consent,
    advisoryDisclaimer: getAdvisoryDisclaimer(language),
    createdAt: new Date().toISOString(),
  };
}
