import type { LanguageCode, Verdict } from '../../../shared/types';

export interface TranslationBundle {
  brandName: string;
  brandShort: string;
  brandTagline: string;
  nav: {
    home: string;
    check: string;
    assisted: string;
    dashboard: string;
    reviewer: string;
    status: string;
    checkNow: string;
  };
  landing: {
    kicker: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    assistedCta: string;
    problemTitle: string;
    problemBody: string;
    howItWorksTitle: string;
    steps: { title: string; body: string }[];
    privacyPromiseTitle: string;
    privacyPromiseItems: string[];
    disclaimerTitle: string;
    disclaimerBody: string;
    offlineGuideTitle: string;
    offlineGoldenRules: string[];
  };
  checker: {
    title: string;
    subtitle: string;
    inputTypeLabel: string;
    types: {
      sms: string;
      whatsapp: string;
      url: string;
      upi_request: string;
    };
    messageLabel: string;
    placeholder: string;
    samplePromptLabel: string;
    voiceInput: string;
    stopListening: string;
    voiceUnsupported: string;
    maskingPreviewTitle: string;
    maskingEmptyNote: string;
    maskingRedactedNote: string;
    consentTitle: string;
    consentSubtitle: string;
    consentExternalAiLabel: string;
    consentExternalAiHelp: string;
    consentStorageLabel: string;
    consentStorageHelp: string;
    consentHumanReviewLabel: string;
    consentHumanReviewHelp: string;
    analyzeButton: string;
    analyzingButton: string;
    queueOfflineButton: string;
    emptyError: string;
    offlineNotice: string;
  };
  result: {
    title: string;
    riskScoreLabel: string;
    confidenceLabel: string;
    scoreNote: string;
    sourceHybrid: string;
    sourceRuleFallback: string;
    sourceOffline: string;
    privacyModeNote: string;
    warningSignsTitle: string;
    noWarningsText: string;
    explanationTitle: string;
    actionsTitle: string;
    maskedTextTitle: string;
    urlCheckTitle: string;
    urlSafeNote: string;
    readAloud: string;
    stopReading: string;
    preparingAudio: string;
    translating: string;
    humanHelpTitle: string;
    humanHelpBody: string;
    requestReviewBtn: string;
    reviewRequestedSuccess: string;
    reviewConsentCheckbox: string;
    reportTitle: string;
    reportHelpline: string;
    reportPortal: string;
    reportNote: string;
    checkAnother: string;
    backToDashboard: string;
    notFoundTitle: string;
    notFoundBody: string;
    verdicts: Record<Verdict, { label: string; summary: string }>;
  };
  dashboard: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsScam: string;
    statsSuspicious: string;
    statsSafe: string;
    historyTitle: string;
    emptyHistory: string;
    deleteHistoryBtn: string;
    confirmDeleteMsg: string;
    privacyTitle: string;
    consentRecordsTitle: string;
    noConsentRecords: string;
    offlineQueueTitle: string;
    offlineQueueEmpty: string;
    offlineQueueWarning: string;
    renewConsentLabel: string;
    submitQueuedBtn: string;
    removeQueuedBtn: string;
    syncAccountHint: string;
    signInGoogle: string;
    signOut: string;
  };
  assisted: {
    title: string;
    subtitle: string;
    privacyBannerTitle: string;
    privacyBannerBody: string;
    readNoticeAloud: string;
    verbalConsentLabel: string;
    step1Title: string;
    step2Title: string;
    checkButton: string;
    resetButton: string;
    verbalConsentRequired: string;
  };
  reviewer: {
    title: string;
    subtitle: string;
    accessRestrictedTitle: string;
    accessRestrictedBody: string;
    signInPrompt: string;
    queueTitle: string;
    emptyQueue: string;
    consentedOnlyBadge: string;
    caseStatusLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    saveDecisionBtn: string;
    savedToast: string;
    auditTitle: string;
    noAuditLogs: string;
    noUnauthorizedNotice: string;
  };
  status: {
    title: string;
    subtitle: string;
    limitationsTitle: string;
    limitationsItems: string[];
  };
  common: {
    offlineBanner: string;
    installApp: string;
    languageLabel: string;
    cancel: string;
    confirm: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: {
    brandName: 'Parakh',
    brandShort: 'Parakh',
    brandTagline: 'Check before you pay',
    nav: {
      home: 'Home',
      check: 'Check',
      assisted: 'Assisted Mode',
      dashboard: 'Dashboard',
      reviewer: 'Reviewer',
      status: 'Status',
      checkNow: 'Check Message',
    },
    landing: {
      kicker: 'Digital Payment Safety for India',
      headline: 'Parakh — Check before you pay.',
      subheadline:
        'Verify suspicious UPI requests, SMS, WhatsApp messages, and links before sending money — with automatic privacy masking and offline protection in English, Hindi, and Bengali.',
      primaryCta: 'Check a Suspicious Message',
      assistedCta: 'Open Assisted Mode (For Helpers)',
      problemTitle: 'Why this matters for everyday digital payments',
      problemBody:
        'Fraudsters target first-time UPI users, senior citizens, and small shopkeepers with urgent KYC expiry SMS messages, fake cashback scratch cards, and collect requests that look like incoming money. Checking a message for 15 seconds before tapping Approve can prevent irreversible loss.',
      howItWorksTitle: 'How it works in three simple steps',
      steps: [
        {
          title: '01. Paste or speak the message',
          body: 'Share a suspicious SMS, WhatsApp forward, web link, or UPI payment request. Phone numbers, UPI IDs, and OTPs are masked automatically.',
        },
        {
          title: '02. Hybrid safety inspection',
          body: 'Our deterministic Indian scam rules and static URL checker run immediately. With your explicit consent, masked text can also be analyzed by AI.',
        },
        {
          title: '03. Clear verdict and next steps',
          body: 'Receive a plain-language verdict, read-aloud audio guidance, safety actions, and official 1930 cybercrime reporting steps if needed.',
        },
      ],
      privacyPromiseTitle: 'Built with strict privacy and consent by default',
      privacyPromiseItems: [
        'Raw messages are never stored by default — storage requires your explicit consent.',
        'Phone numbers, UPI IDs, account numbers, and OTPs are automatically masked before any AI check.',
        'Suspicious links are inspected safely as text without ever opening or visiting them.',
        'No automatic reporting, blocking, or money transfers are ever performed on your behalf.',
      ],
      disclaimerTitle: 'Important safety disclaimer',
      disclaimerBody:
        'Automated scam checks are advisory only and cannot guarantee that any message is 100% safe or fraudulent. Always verify payment requests directly inside your official bank or UPI app.',
      offlineGuideTitle: 'Offline UPI Golden Rules (Available Anytime)',
      offlineGoldenRules: [
        'You NEVER need to enter your UPI PIN or scan a QR code to receive money.',
        'Banks never ask for OTP, CVV, PIN, or KYC updates via WhatsApp or shortened links.',
        'Never install screen-sharing apps like AnyDesk or QuickSupport for customer support.',
        'If money is lost to cyber fraud, call 1930 immediately or visit cybercrime.gov.in.',
      ],
    },
    checker: {
      title: 'Check a suspicious message or UPI request',
      subtitle: 'Paste the SMS, WhatsApp message, link, or payment request below. Personal details are masked automatically.',
      inputTypeLabel: 'What are you checking?',
      types: {
        sms: 'SMS Message',
        whatsapp: 'WhatsApp Message',
        url: 'Web Link / URL',
        upi_request: 'UPI Payment Request',
      },
      messageLabel: 'Suspicious message or link',
      placeholder: 'Example: Dear customer, your bank KYC expires in 2 hours. Click http://sbi-kyc.xyz or share OTP...',
      samplePromptLabel: 'Try a synthetic test case:',
      voiceInput: 'Speak Message',
      stopListening: 'Stop Listening',
      voiceUnsupported: 'Voice input is not supported in this browser.',
      maskingPreviewTitle: 'Automatic privacy masking preview',
      maskingEmptyNote: 'Type or paste a message to see how phone numbers, UPI IDs, and OTPs are masked.',
      maskingRedactedNote: 'sensitive identifier(s) automatically hidden before processing.',
      consentTitle: 'Your privacy and consent choices',
      consentSubtitle: 'Nothing is saved or sent to external AI unless you explicitly allow it below.',
      consentExternalAiLabel: 'Allow external AI analysis of the masked text above',
      consentExternalAiHelp: 'Only masked text is sent. Leave unchecked to use local rule-based detection only.',
      consentStorageLabel: 'Save this masked result to my verdict history',
      consentStorageHelp: 'Raw messages are never saved. You can delete your history anytime.',
      consentHumanReviewLabel: 'Share this masked case for optional human reviewer check',
      consentHumanReviewHelp: 'Requires storage consent. Reviewers only see explicitly consented masked cases.',
      analyzeButton: 'Check for Scam',
      analyzingButton: 'Checking message...',
      queueOfflineButton: 'Save to Offline Queue for Later',
      emptyError: 'Please paste or speak a message, link, or UPI request before checking.',
      offlineNotice: 'You are currently offline. Running instant local rule-based safety check.',
    },
    result: {
      title: 'Safety Analysis Result',
      riskScoreLabel: 'Risk indicator',
      confidenceLabel: 'Signal confidence',
      scoreNote: 'Heuristic risk indicator (0–100), not a statistically calibrated probability.',
      sourceHybrid: 'Hybrid AI + Safety Rules',
      sourceRuleFallback: 'Rule-Based Assessment (Fallback / Privacy Mode)',
      sourceOffline: 'Offline Local Safety Rules',
      privacyModeNote: 'External AI skipped because you chose privacy-only local rule analysis.',
      warningSignsTitle: 'Detected warning signs',
      noWarningsText: 'No common scam warning signs were triggered in this text.',
      explanationTitle: 'Why this verdict was given',
      actionsTitle: 'Recommended safety actions',
      maskedTextTitle: 'Masked message analyzed (personal details hidden)',
      urlCheckTitle: 'Static link inspection (links were NOT opened)',
      urlSafeNote: 'Recognized official domain',
      readAloud: 'Read Aloud',
      stopReading: 'Stop Reading',
      preparingAudio: 'Preparing audio...',
      translating: 'Translating...',
      humanHelpTitle: 'Need a second pair of eyes?',
      humanHelpBody:
        'If this message involves money or still feels unclear, show it to a trusted family member, contact your bank branch, or request a consented human review.',
      requestReviewBtn: 'Submit Masked Case for Human Review',
      reviewRequestedSuccess: 'Submitted to the consented human review queue.',
      reviewConsentCheckbox: 'I explicitly consent to share this masked excerpt with an authorized safety reviewer.',
      reportTitle: 'Official India Cybercrime Reporting Guidance',
      reportHelpline: 'National Cybercrime Helpline: 1930',
      reportPortal: 'Official Portal: cybercrime.gov.in',
      reportNote: 'This app does not file automatic complaints or block accounts. If you have lost money, call 1930 immediately for the best chance of freezing fraudulent transfers.',
      checkAnother: 'Check Another Message',
      backToDashboard: 'View History Dashboard',
      notFoundTitle: 'Analysis result not found',
      notFoundBody: 'This result was not saved (default privacy mode) or has been deleted. Run a new check anytime.',
      verdicts: {
        SCAM: {
          label: 'SCAM — High Danger',
          summary: 'Strong signs of financial fraud. Do not pay, click links, or share any PIN or OTP.',
        },
        SUSPICIOUS: {
          label: 'SUSPICIOUS — Be Careful',
          summary: 'Contains warning signs often used in scams. Verify directly with your bank first.',
        },
        UNCERTAIN: {
          label: 'UNCERTAIN — Needs Verification',
          summary: 'Not enough clear evidence to judge safely. Confirm with the sender via a trusted number.',
        },
        SAFE: {
          label: 'SAFE — Lower Risk (Advisory)',
          summary: 'No common scam patterns found, though automated checks cannot guarantee safety.',
        },
      },
    },
    dashboard: {
      title: 'Your Safety Dashboard & Privacy Controls',
      subtitle: 'Review your consented masked verdict history, manage queued offline checks, and control your data.',
      statsTotal: 'Saved checks',
      statsScam: 'Scam alerts',
      statsSuspicious: 'Suspicious / Uncertain',
      statsSafe: 'Lower-risk checks',
      historyTitle: 'Recent Consented Verdict History',
      emptyHistory: 'No saved analyses yet. By default, messages are not stored unless you opt in on the Scam Checker.',
      deleteHistoryBtn: 'Delete All History',
      confirmDeleteMsg: 'This will permanently erase all saved masked history and consent logs from this account and browser. Continue?',
      privacyTitle: 'Privacy Settings & Consent Records',
      consentRecordsTitle: 'Recent Consent Ledger',
      noConsentRecords: 'No consent records saved yet.',
      offlineQueueTitle: 'Offline Request Queue',
      offlineQueueEmpty: 'No messages waiting in the offline queue.',
      offlineQueueWarning: 'Queued messages are never submitted automatically when internet returns. Renew consent per item below to run an online check.',
      renewConsentLabel: 'I renew my consent to analyze this masked message online',
      submitQueuedBtn: 'Run Online Check',
      removeQueuedBtn: 'Discard',
      syncAccountHint: 'Sign in with Google to sync consented history across devices and access authorized reviewer tools.',
      signInGoogle: 'Sign in with Google',
      signOut: 'Sign Out',
    },
    assisted: {
      title: 'Assisted Mode — Helping Another Person',
      subtitle: 'Designed with large text, clear buttons, and read-aloud guidance for family members and local shop helpers.',
      privacyBannerTitle: 'Read this privacy notice to the person you are helping',
      privacyBannerBody:
        'Before checking their message, tell them: Phone numbers, UPI IDs, and OTPs will be hidden automatically. Nothing will be saved unless they agree, and this tool only gives advice — never ask them for their UPI PIN.',
      readNoticeAloud: 'Read Privacy Notice Aloud',
      verbalConsentLabel: 'I have explained this privacy notice and the person agrees to check this message',
      step1Title: 'Step 1: Paste or speak the message they received',
      step2Title: 'Step 2: Tap the big button to check safety',
      checkButton: 'Check This Message Now',
      resetButton: 'Check Next Message',
      verbalConsentRequired: 'Please confirm that the person agreed to check this message first.',
    },
    reviewer: {
      title: 'Human Oversight & Reviewer Console',
      subtitle: 'Audit consented escalations, record reviewer guidance, and inspect PII-free operational audit events.',
      accessRestrictedTitle: 'Authorized Reviewer Sign-In Required',
      accessRestrictedBody:
        'To protect citizen privacy, only authorized reviewers signed in with a verified account can inspect the consented review queue and update case status.',
      signInPrompt: 'Sign in with Authorized Google Account',
      queueTitle: 'Consented Human Review Queue',
      emptyQueue: 'No consented review cases in this filter right now.',
      consentedOnlyBadge: 'Consented Masked Cases Only',
      caseStatusLabel: 'Review Status',
      notesLabel: 'Reviewer Guidance Notes',
      notesPlaceholder: 'Record verification notes or plain-language guidance (never enter personal PII)...',
      saveDecisionBtn: 'Save Review Update',
      savedToast: 'Review case updated and logged to audit trail.',
      auditTitle: 'Operational Audit Log (Zero Raw PII)',
      noAuditLogs: 'No audit events recorded yet.',
      noUnauthorizedNotice: 'Privacy guard active: Private checks without explicit human-review consent are cryptographically excluded by database rules.',
    },
    status: {
      title: 'System Status, Testing & Limitations',
      subtitle: 'Transparent operational status, synthetic benchmark coverage, and known boundaries of automated scam detection.',
      limitationsTitle: 'Known limitations and false-positive transparency',
      limitationsItems: [
        'Automated rules and AI models can miss novel social-engineering tactics (false negatives) or flag legitimate urgent messages (false positives).',
        'Risk scores (0–100) and confidence labels (LOW/MEDIUM/HIGH) are heuristic decision aids, never statistically calibrated probabilities.',
        'Static URL inspection checks link structure and known spoof patterns without visiting pages, so newly registered neutral-looking phishing domains may appear uncertain.',
        'Voice input and text-to-speech depend on browser Web Speech API support and installed Hindi/Bengali voices.',
      ],
    },
    common: {
      offlineBanner: 'Offline Mode — Instant local safety rules and offline guide are active.',
      installApp: 'Install App',
      languageLabel: 'Language',
      cancel: 'Cancel',
      confirm: 'Confirm Delete',
    },
  },

  hi: {
    brandName: 'परख',
    brandShort: 'परख',
    brandTagline: 'भुगतान से पहले जाँचें',
    nav: {
      home: 'होम',
      check: 'जांचें',
      assisted: 'सहायक मोड',
      dashboard: 'डैशबोर्ड',
      reviewer: 'समीक्षक',
      status: 'स्थिति',
      checkNow: 'संदेश जांचें',
    },
    landing: {
      kicker: 'भारत के लिए डिजिटल भुगतान सुरक्षा',
      headline: 'परख — भुगतान से पहले जाँचें।',
      subheadline:
        'पैसे भेजने से पहले संदिग्ध UPI रिक्वेस्ट, SMS, WhatsApp संदेश और लिंक तुरंत जांचें — अंग्रेज़ी, हिन्दी और बांग्ला में स्वचालित गोपनीयता मास्किंग और ऑफ़लाइन सुरक्षा के साथ।',
      primaryCta: 'संदिग्ध संदेश जांचें',
      assistedCta: 'सहायक मोड खोलें (परिवार व दुकानदार हेतु)',
      problemTitle: 'रोज़मर्रा के डिजिटल भुगतान में यह क्यों ज़रूरी है',
      problemBody:
        'ठग पहली बार UPI इस्तेमाल करने वालों, वरिष्ठ नागरिकों और छोटे दुकानदारों को नकली KYC समाप्ति SMS, झूठे कैशबैक और पैसे भेजने की रिक्वेस्ट से निशाना बनाते हैं। "Approve" दबाने से पहले 15 सेकंड की जांच बड़ा नुकसान बचा सकती है।',
      howItWorksTitle: 'तीन आसान चरणों में काम करता है',
      steps: [
        {
          title: '01. संदेश पेस्ट करें या बोलें',
          body: 'संदिग्ध SMS, WhatsApp संदेश, लिंक या UPI रिक्वेस्ट डालें। फ़ोन नंबर, UPI ID और OTP अपने आप छिपा दिए जाते हैं।',
        },
        {
          title: '02. हाइब्रिड सुरक्षा जांच',
          body: 'हमारे भारतीय स्कैम नियम और सुरक्षित लिंक जांच तुरंत चलती है। आपकी स्पष्ट अनुमति पर छिपे हुए संदेश की AI जांच भी की जा सकती है।',
        },
        {
          title: '03. सरल निर्णय और सुरक्षा कदम',
          body: 'आसान भाषा में परिणाम, सुनने की सुविधा, सुरक्षा सलाह और ज़रूरत होने पर 1930 साइबर क्राइम रिपोर्टिंग की जानकारी पाएं।',
        },
      ],
      privacyPromiseTitle: 'डिफ़ॉल्ट रूप से सख्त गोपनीयता और सहमति',
      privacyPromiseItems: [
        'आपका मूल संदेश बिना स्पष्ट अनुमति के कभी सेव नहीं किया जाता।',
        'किसी भी AI जांच से पहले फ़ोन नंबर, UPI ID, खाता संख्या और OTP अपने आप छिपाए जाते हैं।',
        'संदिग्ध लिंक को कभी खोले बिना केवल टेक्स्ट के रूप में सुरक्षित जांचा जाता है।',
        'यह ऐप आपकी ओर से कोई स्वतः शिकायत, ब्लॉक या पैसों का लेन-देन नहीं करता।',
      ],
      disclaimerTitle: 'महत्वपूर्ण सुरक्षा सूचना',
      disclaimerBody:
        'स्वचालित जांच केवल सलाह के लिए है और किसी संदेश के 100% सुरक्षित या धोखाधड़ी होने की गारंटी नहीं दे सकती। हमेशा सीधे अपने आधिकारिक बैंक या UPI ऐप में पुष्टि करें।',
      offlineGuideTitle: 'ऑफ़लाइन UPI सुनहरे नियम (हमेशा उपलब्ध)',
      offlineGoldenRules: [
        'पैसे प्राप्त करने के लिए कभी भी UPI पिन डालने या QR कोड स्कैन करने की ज़रूरत नहीं होती।',
        'बैंक कभी भी WhatsApp या छोटे लिंक पर OTP, CVV, पिन या KYC अपडेट नहीं मांगते।',
        'कस्टमर केयर के नाम पर कभी AnyDesk या QuickSupport जैसे स्क्रीन-शेयरिंग ऐप इंस्टॉल न करें।',
        'धोखाधड़ी में पैसे कटने पर तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर शिकायत करें।',
      ],
    },
    checker: {
      title: 'संदिग्ध संदेश या UPI रिक्वेस्ट जांचें',
      subtitle: 'नीचे SMS, WhatsApp संदेश, लिंक या भुगतान अनुरोध पेस्ट करें। निजी जानकारी अपने आप छिप जाएगी।',
      inputTypeLabel: 'आप क्या जांच रहे हैं?',
      types: {
        sms: 'SMS संदेश',
        whatsapp: 'WhatsApp संदेश',
        url: 'वेब लिंक / URL',
        upi_request: 'UPI भुगतान रिक्वेस्ट',
      },
      messageLabel: 'संदिग्ध संदेश या लिंक',
      placeholder: 'उदाहरण: प्रिय ग्राहक, आपका बैंक KYC 2 घंटे में बंद हो जाएगा। इस लिंक पर क्लिक करें या OTP बताएं...',
      samplePromptLabel: 'परीक्षण उदाहरण चुनें:',
      voiceInput: 'बोलकर लिखें',
      stopListening: 'सुनना बंद करें',
      voiceUnsupported: 'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।',
      maskingPreviewTitle: 'स्वचालित गोपनीयता मास्किंग पूर्वावलोकन',
      maskingEmptyNote: 'फ़ोन नंबर, UPI ID और OTP कैसे छिपाए जाते हैं यह देखने के लिए संदेश लिखें।',
      maskingRedactedNote: 'संवेदनशील विवरण जांच से पहले अपने आप छिपाए गए।',
      consentTitle: 'आपकी गोपनीयता और सहमति विकल्प',
      consentSubtitle: 'जब तक आप नीचे स्पष्ट अनुमति नहीं देते, कुछ भी सेव या बाहरी AI को नहीं भेजा जाता।',
      consentExternalAiLabel: 'ऊपर दिखाए गए मास्क संदेश की बाहरी AI जांच की अनुमति दें',
      consentExternalAiHelp: 'केवल मास्क किया गया टेक्स्ट भेजा जाएगा। केवल स्थानीय नियमों से जांचने के लिए इसे खाली छोड़ें।',
      consentStorageLabel: 'इस मास्क किए गए परिणाम को मेरे इतिहास में सहेजें',
      consentStorageHelp: 'मूल संदेश कभी सहेजा नहीं जाता। आप कभी भी इतिहास मिटा सकते हैं।',
      consentHumanReviewLabel: 'वैकल्पिक मानव समीक्षा के लिए यह मास्क केस साझा करें',
      consentHumanReviewHelp: 'सहेजने की अनुमति ज़रूरी है। समीक्षक केवल सहमति वाले मास्क केस ही देख सकते हैं।',
      analyzeButton: 'स्कैम की जांच करें',
      analyzingButton: 'संदेश जांचा जा रहा है...',
      queueOfflineButton: 'बाद में ऑनलाइन जांच के लिए कतार में रखें',
      emptyError: 'कृपया जांच करने से पहले संदेश, लिंक या UPI रिक्वेस्ट दर्ज करें।',
      offlineNotice: 'आप अभी ऑफ़लाइन हैं। स्थानीय सुरक्षा नियमों से तुरंत जांच की जा रही है।',
    },
    result: {
      title: 'सुरक्षा जांच परिणाम',
      riskScoreLabel: 'जोखिम संकेतक',
      confidenceLabel: 'संकेत विश्वास स्तर',
      scoreNote: 'यह केवल मार्गदर्शन के लिए जोखिम स्कोर (0–100) है, सटीक गणितीय संभावना नहीं।',
      sourceHybrid: 'हाइब्रिड AI + सुरक्षा नियम',
      sourceRuleFallback: 'नियम-आधारित जांच (फ़ॉलबैक / प्राइवेसी मोड)',
      sourceOffline: 'ऑफ़लाइन स्थानीय सुरक्षा नियम',
      privacyModeNote: 'बाहरी AI का उपयोग नहीं किया गया क्योंकि आपने गोपनीयता-आधारित स्थानीय नियम जांच चुनी है।',
      warningSignsTitle: 'मिले हुए चेतावनी संकेत',
      noWarningsText: 'इस टेक्स्ट में धोखाधड़ी के सामान्य चेतावनी संकेत नहीं मिले।',
      explanationTitle: 'यह निर्णय क्यों दिया गया',
      actionsTitle: 'सुझाए गए सुरक्षा कदम',
      maskedTextTitle: 'जांचा गया मास्क संदेश (निजी विवरण छिपे हैं)',
      urlCheckTitle: 'सुरक्षित लिंक जांच (लिंक खोले नहीं गए)',
      urlSafeNote: 'मान्यता प्राप्त आधिकारिक डोमेन',
      readAloud: 'सुनें (Read Aloud)',
      stopReading: 'पढ़ना रोकें',
      preparingAudio: 'ऑडियो तैयार हो रहा है...',
      translating: 'अनुवाद हो रहा है...',
      humanHelpTitle: 'क्या आप किसी व्यक्ति की मदद चाहते हैं?',
      humanHelpBody:
        'यदि इसमें पैसों की बात है या संदेह है, तो परिवार के सदस्य से पूछें, अपनी बैंक शाखा से संपर्क करें या मानव समीक्षा का अनुरोध करें।',
      requestReviewBtn: 'मानव समीक्षा के लिए मास्क केस भेजें',
      reviewRequestedSuccess: 'सहमति वाली मानव समीक्षा कतार में भेज दिया गया।',
      reviewConsentCheckbox: 'मैं इस मास्क किए गए अंश को अधिकृत सुरक्षा समीक्षक के साथ साझा करने की स्पष्ट सहमति देता/देती हूँ।',
      reportTitle: 'आधिकारिक भारतीय साइबर क्राइम रिपोर्टिंग मार्गदर्शन',
      reportHelpline: 'राष्ट्रीय साइबर क्राइम हेल्पलाइन: 1930',
      reportPortal: 'आधिकारिक पोर्टल: cybercrime.gov.in',
      reportNote: 'यह ऐप अपने आप शिकायत दर्ज या खाता ब्लॉक नहीं करता। यदि पैसे कट गए हैं, तो तुरंत 1930 पर कॉल करें।',
      checkAnother: 'अन्य संदेश जांचें',
      backToDashboard: 'इतिहास डैशबोर्ड देखें',
      notFoundTitle: 'जांच परिणाम नहीं मिला',
      notFoundBody: 'यह परिणाम सहेजा नहीं गया था या मिटा दिया गया है। आप नई जांच कर सकते हैं।',
      verdicts: {
        SCAM: {
          label: 'SCAM — उच्च खतरा',
          summary: 'धोखाधड़ी के गंभीर संकेत। भुगतान न करें, लिंक न खोलें और PIN/OTP न बताएं।',
        },
        SUSPICIOUS: {
          label: 'SUSPICIOUS — सावधान रहें',
          summary: 'धोखाधड़ी जैसे संदिग्ध संकेत मिले हैं। पहले सीधे अपने बैंक से पुष्टि करें।',
        },
        UNCERTAIN: {
          label: 'UNCERTAIN — पुष्टि आवश्यक',
          summary: 'स्पष्ट निर्णय के लिए पर्याप्त संकेत नहीं हैं। विश्वसनीय नंबर पर कॉल करके पुष्टि करें।',
        },
        SAFE: {
          label: 'SAFE — कम जोखिम (सलाह)',
          summary: 'सामान्य स्कैम पैटर्न नहीं मिले, लेकिन स्वचालित जांच पूरी सुरक्षा की गारंटी नहीं देती।',
        },
      },
    },
    dashboard: {
      title: 'आपका सुरक्षा डैशबोर्ड और गोपनीयता नियंत्रण',
      subtitle: 'अपना सहेजा गया मास्क इतिहास देखें, ऑफ़लाइन कतार प्रबंधित करें और अपना डेटा नियंत्रित करें।',
      statsTotal: 'सहेजी गई जांचें',
      statsScam: 'स्कैम चेतावनी',
      statsSuspicious: 'संदिग्ध / अनिश्चित',
      statsSafe: 'कम जोखिम जांच',
      historyTitle: 'हालिया सहमति वाला निर्णय इतिहास',
      emptyHistory: 'अभी कोई सहेजी गई जांच नहीं है। डिफ़ॉल्ट रूप से संदेश सहेजे नहीं जाते।',
      deleteHistoryBtn: 'सारा इतिहास मिटाएं',
      confirmDeleteMsg: 'क्या आप वाकई सभी सहेजे गए मास्क इतिहास और सहमति रिकॉर्ड स्थायी रूप से मिटाना चाहते हैं?',
      privacyTitle: 'गोपनीयता सेटिंग्स और सहमति रिकॉर्ड',
      consentRecordsTitle: 'सहमति विवरण',
      noConsentRecords: 'अभी कोई सहमति रिकॉर्ड नहीं है।',
      offlineQueueTitle: 'ऑफ़लाइन अनुरोध कतार',
      offlineQueueEmpty: 'ऑफ़लाइन कतार में कोई संदेश नहीं है।',
      offlineQueueWarning: 'इंटरनेट लौटने पर कतार के संदेश अपने आप नहीं भेजे जाते। ऑनलाइन जांच के लिए नीचे नई सहमति दें।',
      renewConsentLabel: 'मैं इस मास्क संदेश को ऑनलाइन जांचने की नई सहमति देता/देती हूँ',
      submitQueuedBtn: 'ऑनलाइन जांचें',
      removeQueuedBtn: 'हटाएं',
      syncAccountHint: 'अन्य डिवाइस पर सहेजा गया इतिहास देखने के लिए Google से साइन इन करें।',
      signInGoogle: 'Google से साइन इन करें',
      signOut: 'साइन आउट',
    },
    assisted: {
      title: 'सहायक मोड — किसी अन्य व्यक्ति की मदद के लिए',
      subtitle: 'परिवार के सदस्यों और स्थानीय दुकानदारों के लिए बड़े अक्षर, बड़े बटन और बोलकर सुनाने की सुविधा।',
      privacyBannerTitle: 'जिसकी आप मदद कर रहे हैं उन्हें यह गोपनीयता सूचना सुनाएं',
      privacyBannerBody:
        'जांच से पहले बताएं: फ़ोन नंबर, UPI ID और OTP अपने आप छिप जाएंगे। उनकी सहमति बिना कुछ सेव नहीं होगा और कभी भी उनका UPI पिन न पूछें।',
      readNoticeAloud: 'गोपनीयता सूचना सुनें',
      verbalConsentLabel: 'मैंने यह सूचना समझा दी है और व्यक्ति इस संदेश की जांच के लिए सहमत है',
      step1Title: 'चरण 1: उन्हें मिला संदेश पेस्ट करें या बोलें',
      step2Title: 'चरण 2: सुरक्षा जांचने के लिए बड़ा बटन दबाएं',
      checkButton: 'अभी संदेश जांचें',
      resetButton: 'अगला संदेश जांचें',
      verbalConsentRequired: 'कृपया पहले पुष्टि करें कि व्यक्ति ने जांच के लिए सहमति दी है।',
    },
    reviewer: {
      title: 'मानव निरीक्षण और समीक्षक कंसोल',
      subtitle: 'केवल सहमति वाले मामलों की समीक्षा करें, मार्गदर्शन नोट्स लिखें और ऑडिट लॉग देखें।',
      accessRestrictedTitle: 'अधिकृत समीक्षक साइन-इन आवश्यक',
      accessRestrictedBody:
        'नागरिक गोपनीयता की रक्षा के लिए, केवल सत्यापित अधिकृत समीक्षक ही सहमति वाली समीक्षा कतार देख सकते हैं।',
      signInPrompt: 'अधिकृत Google खाते से साइन इन करें',
      queueTitle: 'सहमति वाली मानव समीक्षा कतार',
      emptyQueue: 'इस फ़िल्टर में कोई समीक्षा केस नहीं है।',
      consentedOnlyBadge: 'केवल सहमति वाले मास्क केस',
      caseStatusLabel: 'समीक्षा स्थिति',
      notesLabel: 'समीक्षक नोट्स',
      notesPlaceholder: 'सत्यापन या सरल सुरक्षा मार्गदर्शन लिखें...',
      saveDecisionBtn: 'समीक्षा सहेजें',
      savedToast: 'समीक्षा अपडेट की गई और ऑडिट लॉग में दर्ज हुई।',
      auditTitle: 'ऑपरेशनल ऑडिट लॉग (बिना निजी जानकारी)',
      noAuditLogs: 'अभी कोई ऑडिट इवेंट दर्ज नहीं हुआ।',
      noUnauthorizedNotice: 'गोपनीयता सुरक्षा सक्रिय: बिना स्पष्ट सहमति वाले निजी संदेश डेटाबेस नियमों द्वारा पूर्णतः प्रतिबंधित हैं।',
    },
    status: {
      title: 'सिस्टम स्थिति, परीक्षण और सीमाएं',
      subtitle: 'पारदर्शी सिस्टम स्वास्थ्य, परीक्षण केस और स्वचालित स्कैम पहचान की ज्ञात सीमाएं।',
      limitationsTitle: 'ज्ञात सीमाएं और पारदर्शिता',
      limitationsItems: [
        'स्वचालित नियम और AI नए प्रकार की ठगी को चूक सकते हैं या कभी-कभी वास्तविक जरूरी संदेश को संदिग्ध बता सकते हैं।',
        'जोखिम स्कोर (0–100) केवल सहायक संकेतक है, सटीक सांख्यिकीय संभावना नहीं।',
        'लिंक जांच वेबसाइट खोले बिना की जाती है, इसलिए नए सामान्य दिखने वाले फ़िशिंग डोमेन अनिश्चित दिख सकते हैं।',
        'वॉइस इनपुट और रीड-अलाउड ब्राउज़र और डिवाइस पर उपलब्ध भाषा आवाज़ों पर निर्भर करते हैं।',
      ],
    },
    common: {
      offlineBanner: 'ऑफ़लाइन मोड — स्थानीय सुरक्षा नियम और ऑफ़लाइन गाइड सक्रिय हैं।',
      installApp: 'ऐप इंस्टॉल करें',
      languageLabel: 'भाषा',
      cancel: 'रद्द करें',
      confirm: 'हटाने की पुष्टि करें',
    },
  },

  bn: {
    brandName: 'পরখ',
    brandShort: 'পরখ',
    brandTagline: 'টাকা পাঠানোর আগে যাচাই করুন',
    nav: {
      home: 'হোম',
      check: 'যাচাই',
      assisted: 'সহায়ক মোড',
      dashboard: 'ড্যাশবোর্ড',
      reviewer: 'পর্যালোচক',
      status: 'স্ট্যাটাস',
      checkNow: 'বার্তা যাচাই করুন',
    },
    landing: {
      kicker: 'ভারতের জন্য ডিজিটাল পেমেন্ট সুরক্ষা',
      headline: 'পরখ — টাকা পাঠানোর আগে যাচাই করুন।',
      subheadline:
        'টাকা পাঠানোর আগে সন্দেহজনক UPI রিকোয়েস্ট, SMS, WhatsApp বার্তা এবং লিংক মুহূর্তেই যাচাই করুন — ইংরেজি, হিন্দি ও বাংলায় স্বয়ংক্রিয় গোপনীয়তা সুরক্ষা ও অফলাইন সহায়তাসহ।',
      primaryCta: 'সন্দেহজনক বার্তা যাচাই করুন',
      assistedCta: 'সহায়ক মোড খুলুন (পরিবার ও দোকানদারদের জন্য)',
      problemTitle: 'প্রতিদিনের ডিজিটাল পেমেন্টে এটি কেন জরুরি',
      problemBody:
        'প্রতারকরা নতুন UPI ব্যবহারকারী, প্রবীণ নাগরিক এবং ছোট ব্যবসায়ীদের জরুরি KYC বন্ধের SMS, ভুয়া ক্যাশব্যাক এবং টাকা পাওয়ার নামে কালেক্ট রিকোয়েস্ট দিয়ে ফাঁদে ফেলে। Approve চাপার আগে ১৫ সেকেন্ড যাচাই করলে বড় ক্ষতি এড়ানো যায়।',
      howItWorksTitle: 'তিনটি সহজ ধাপে কাজ করে',
      steps: [
        {
          title: '০১. বার্তা পেস্ট করুন বা বলুন',
          body: 'সন্দেহজনক SMS, WhatsApp বার্তা, ওয়েব লিংক বা UPI রিকোয়েস্ট দিন। ফোন নম্বর, UPI ID এবং OTP স্বয়ংক্রিয়ভাবে ঢেকে দেওয়া হয়।',
        },
        {
          title: '০২. হাইব্রিড নিরাপত্তা পরীক্ষা',
          body: 'আমাদের ভারতীয় স্ক্যাম নিয়ম ও নিরাপদ লিংক বিশ্লেষক তাৎক্ষণিক কাজ করে। আপনার স্পষ্ট সম্মতিতে মাস্ক করা টেক্সট AI দিয়েও যাচাই করা যায়।',
        },
        {
          title: '০৩. সহজ ফলাফল ও করণীয়',
          body: 'সহজ ভাষায় ফলাফল, শুনে বোঝার সুবিধা, নিরাপদ পদক্ষেপ এবং প্রয়োজনে 1930 সাইবার ক্রাইম রিপোর্টিং নির্দেশিকা পান।',
        },
      ],
      privacyPromiseTitle: 'ডিফল্টভাবে কঠোর গোপনীয়তা ও সম্মতি',
      privacyPromiseItems: [
        'আপনার স্পষ্ট সম্মতি ছাড়া মূল বার্তা কখনো সংরক্ষণ করা হয় না।',
        'কোনো AI যাচাইয়ের আগে ফোন নম্বর, UPI ID, অ্যাকাউন্ট নম্বর ও OTP স্বয়ংক্রিয়ভাবে মাস্ক করা হয়।',
        'সন্দেহজনক লিংক কখনো না খুলেই কেবল টেক্সট হিসেবে নিরাপদে পরীক্ষা করা হয়।',
        'এই অ্যাপ স্বয়ংক্রিয়ভাবে কোনো অভিযোগ, ব্লক বা অর্থ লেনদেন করে না।',
      ],
      disclaimerTitle: 'গুরুত্বপূর্ণ নিরাপত্তা বিজ্ঞপ্তি',
      disclaimerBody:
        'স্বয়ংক্রিয় যাচাই কেবল পরামর্শমূলক এবং কোনো বার্তা শতভাগ নিরাপদ বা প্রতারণামূলক হওয়ার নিশ্চয়তা দিতে পারে না। সবসময় সরাসরি আপনার অফিসিয়াল ব্যাংক বা UPI অ্যাপে যাচাই করুন।',
      offlineGuideTitle: 'অফলাইন UPI সুবর্ণ নিয়ম (সর্বদা উপলব্ধ)',
      offlineGoldenRules: [
        'টাকা পাওয়ার জন্য কখনোই আপনার UPI পিন দিতে বা QR কোড স্ক্যান করতে হয় না।',
        'ব্যাংক কখনো WhatsApp বা সংক্ষিপ্ত লিংকের মাধ্যমে OTP, CVV, পিন বা KYC আপডেট চায় না।',
        'কাস্টমার কেয়ারের নামে কখনো AnyDesk বা QuickSupport-এর মতো স্ক্রিন-শেয়ারিং অ্যাপ ইনস্টল করবেন না।',
        'প্রতারণায় টাকা হারালে অবিলম্বে 1930 নম্বরে কল করুন অথবা cybercrime.gov.in-এ অভিযোগ জানান।',
      ],
    },
    checker: {
      title: 'সন্দেহজনক বার্তা বা UPI রিকোয়েস্ট যাচাই করুন',
      subtitle: 'নিচে SMS, WhatsApp বার্তা, লিংক বা পেমেন্ট রিকোয়েস্ট পেস্ট করুন। ব্যক্তিগত তথ্য স্বয়ংক্রিয়ভাবে ঢেকে যাবে।',
      inputTypeLabel: 'আপনি কী যাচাই করছেন?',
      types: {
        sms: 'SMS বার্তা',
        whatsapp: 'WhatsApp বার্তা',
        url: 'ওয়েব লিংক / URL',
        upi_request: 'UPI পেমেন্ট রিকোয়েস্ট',
      },
      messageLabel: 'সন্দেহজনক বার্তা বা লিংক',
      placeholder: 'উদাহরণ: প্রিয় গ্রাহক, আপনার ব্যাংক KYC ২ ঘণ্টার মধ্যে বন্ধ হয়ে যাবে। এই লিংকে ক্লিক করুন বা OTP দিন...',
      samplePromptLabel: 'নমুনা পরীক্ষামূলক বার্তা বেছে নিন:',
      voiceInput: 'বলে লিখুন',
      stopListening: 'শোনা বন্ধ করুন',
      voiceUnsupported: 'এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়।',
      maskingPreviewTitle: 'স্বয়ংক্রিয় গোপনীয়তা মাস্কিং প্রিভিউ',
      maskingEmptyNote: 'ফোন নম্বর, UPI ID এবং OTP কীভাবে ঢাকা হয় তা দেখতে বার্তা লিখুন।',
      maskingRedactedNote: 'সংবেদনশীল তথ্য যাচাইয়ের আগে স্বয়ংক্রিয়ভাবে ঢেকে দেওয়া হয়েছে।',
      consentTitle: 'আপনার গোপনীয়তা ও সম্মতি পছন্দ',
      consentSubtitle: 'আপনি নিচে স্পষ্ট সম্মতি না দেওয়া পর্যন্ত কোনো তথ্য সংরক্ষণ বা বাইরের AI-তে পাঠানো হয় না।',
      consentExternalAiLabel: 'উপরের মাস্ক করা টেক্সট বাইরের AI দিয়ে যাচাই করার সম্মতি দিন',
      consentExternalAiHelp: 'কেবল মাস্ক করা টেক্সট পাঠানো হবে। কেবল স্থানীয় নিয়মে যাচাই করতে এটি খালি রাখুন।',
      consentStorageLabel: 'এই মাস্ক করা ফলাফল আমার ইতিহাসে সংরক্ষণ করুন',
      consentStorageHelp: 'আসল বার্তা কখনো সংরক্ষিত হয় না। আপনি যেকোনো সময় ইতিহাস মুছতে পারেন।',
      consentHumanReviewLabel: 'ঐচ্ছিক মানব পর্যালোচনার জন্য এই মাস্ক করা কেসটি শেয়ার করুন',
      consentHumanReviewHelp: 'সংরক্ষণের সম্মতি প্রয়োজন। পর্যালোচকরা কেবল সম্মতিপ্রাপ্ত মাস্ক করা কেস দেখতে পান।',
      analyzeButton: 'স্ক্যাম যাচাই করুন',
      analyzingButton: 'বার্তা যাচাই হচ্ছে...',
      queueOfflineButton: 'পরে অনলাইন যাচাইয়ের জন্য কিউতে রাখুন',
      emptyError: 'যাচাই করার আগে অনুগ্রহ করে একটি বার্তা, লিংক বা UPI রিকোয়েস্ট লিখুন।',
      offlineNotice: 'আপনি এখন অফলাইনে আছেন। স্থানীয় নিরাপত্তা নিয়মে তাৎক্ষণিক যাচাই চলছে।',
    },
    result: {
      title: 'নিরাপত্তা যাচাই ফলাফল',
      riskScoreLabel: 'ঝুঁকির সূচক',
      confidenceLabel: 'সংকেতের নির্ভরতা',
      scoreNote: 'এটি কেবল সহায়তার জন্য ঝুঁকির স্কোর (০–১০০), পরিসংখ্যানগত সম্ভাবনা নয়।',
      sourceHybrid: 'হাইব্রিড AI + নিরাপত্তা নিয়ম',
      sourceRuleFallback: 'নিয়ম-ভিত্তিক যাচাই (ফলব্যাক / প্রাইভেসি মোড)',
      sourceOffline: 'অফলাইন স্থানীয় নিরাপত্তা নিয়ম',
      privacyModeNote: 'আপনি গোপনীয়তা-ভিত্তিক স্থানীয় নিয়ম যাচাই বেছে নেওয়ায় বাইরের AI ব্যবহার করা হয়নি।',
      warningSignsTitle: 'শনাক্তকৃত সতর্কতা সংকেত',
      noWarningsText: 'এই টেক্সটে প্রতারণার সাধারণ কোনো লক্ষণ পাওয়া যায়নি।',
      explanationTitle: 'কেন এই ফলাফল দেওয়া হয়েছে',
      actionsTitle: 'প্রস্তাবিত নিরাপদ পদক্ষেপ',
      maskedTextTitle: 'যাচাইকৃত মাস্ক বার্তা (ব্যক্তিগত তথ্য ঢাকা আছে)',
      urlCheckTitle: 'নিরাপদ লিংক পরীক্ষা (কোনো লিংক খোলা হয়নি)',
      urlSafeNote: 'স্বীকৃত অফিসিয়াল ডোমেইন',
      readAloud: 'পড়ে শোনান',
      stopReading: 'পড়া বন্ধ করুন',
      preparingAudio: 'অডিও তৈরি হচ্ছে...',
      translating: 'অনুবাদ হচ্ছে...',
      humanHelpTitle: 'আরো নিশ্চিত হতে চান?',
      humanHelpBody:
        'এতে টাকা লেনদেনের বিষয় থাকলে বা সন্দেহ থাকলে পরিবারের বিশ্বস্ত কারো সাথে কথা বলুন, ব্যাংকে যোগাযোগ করুন বা মানব পর্যালোচনার অনুরোধ করুন।',
      requestReviewBtn: 'মানব পর্যালোচনার জন্য মাস্ক কেস পাঠান',
      reviewRequestedSuccess: 'সম্মতিপ্রাপ্ত মানব পর্যালোচনা তালিকায় পাঠানো হয়েছে।',
      reviewConsentCheckbox: 'আমি এই মাস্ক করা অংশটি অনুমোদিত নিরাপত্তা পর্যালোচকের সাথে শেয়ার করার স্পষ্ট সম্মতি দিচ্ছি।',
      reportTitle: 'অফিসিয়াল ভারতীয় সাইবার ক্রাইম রিপোর্টিং নির্দেশিকা',
      reportHelpline: 'জাতীয় সাইবার ক্রাইম হেল্পলাইন: 1930',
      reportPortal: 'অফিসিয়াল পোর্টাল: cybercrime.gov.in',
      reportNote: 'এই অ্যাপ স্বয়ংক্রিয়ভাবে অভিযোগ দায়ের বা অ্যাকাউন্ট ব্লক করে না। টাকা কেটে নেওয়া হলে দ্রুত 1930-এ কল করুন।',
      checkAnother: 'অন্য বার্তা যাচাই করুন',
      backToDashboard: 'ইতিহাস ড্যাশবোর্ড দেখুন',
      notFoundTitle: 'ফলাফল পাওয়া যায়নি',
      notFoundBody: 'এই ফলাফলটি সংরক্ষণ করা হয়নি বা মুছে ফেলা হয়েছে। আপনি নতুন করে যাচাই করতে পারেন।',
      verdicts: {
        SCAM: {
          label: 'SCAM — উচ্চ ঝুঁকি',
          summary: 'প্রতারণার স্পষ্ট লক্ষণ। টাকা পাঠাবেন না, লিংকে ক্লিক করবেন না এবং PIN/OTP দেবেন না।',
        },
        SUSPICIOUS: {
          label: 'SUSPICIOUS — সতর্ক থাকুন',
          summary: 'প্রতারণার মতো সন্দেহজনক লক্ষণ রয়েছে। আগে সরাসরি আপনার ব্যাংকের সাথে যাচাই করুন।',
        },
        UNCERTAIN: {
          label: 'UNCERTAIN — যাচাই প্রয়োজন',
          summary: 'স্পষ্ট সিদ্ধান্তের জন্য পর্যাপ্ত তথ্য নেই। পরিচিত বিশ্বস্ত নম্বরে কল করে নিশ্চিত হন।',
        },
        SAFE: {
          label: 'SAFE — কম ঝুঁকি (পরামর্শমূলক)',
          summary: 'সাধারণ স্ক্যাম লক্ষণ মেলেনি, তবে স্বয়ংক্রিয় যাচাই শতভাগ নিরাপত্তার নিশ্চয়তা দেয় না।',
        },
      },
    },
    dashboard: {
      title: 'আপনার সুরক্ষা ড্যাশবোর্ড ও গোপনীয়তা নিয়ন্ত্রণ',
      subtitle: 'সংরক্ষিত মাস্ক করা ফলাফল দেখুন, অফলাইন কিউ পরিচালনা করুন এবং নিজের ডেটা নিয়ন্ত্রণ করুন।',
      statsTotal: 'সংরক্ষিত যাচাই',
      statsScam: 'স্ক্যাম সতর্কতা',
      statsSuspicious: 'সন্দেহজনক / অনিশ্চিত',
      statsSafe: 'কম ঝুঁকির যাচাই',
      historyTitle: 'সাম্প্রতিক সম্মতিপ্রাপ্ত ফলাফলের ইতিহাস',
      emptyHistory: 'এখনো কোনো যাচাই সংরক্ষিত নেই। ডিফল্টভাবে কোনো বার্তা সংরক্ষণ করা হয় না।',
      deleteHistoryBtn: 'সব ইতিহাস মুছুন',
      confirmDeleteMsg: 'আপনি কি নিশ্চিতভাবে সমস্ত সংরক্ষিত মাস্ক ইতিহাস ও সম্মতি রেকর্ড স্থায়ীভাবে মুছতে চান?',
      privacyTitle: 'গोपনীয়তা সেটিংস ও সম্মতি রেকর্ড',
      consentRecordsTitle: 'সম্মতি তালিকা',
      noConsentRecords: 'এখনো কোনো সম্মতি রেকর্ড নেই।',
      offlineQueueTitle: 'অফলাইন অনুরোধ তালিকা',
      offlineQueueEmpty: 'অফলাইন তালিকায় কোনো বার্তা অপেক্ষমাণ নেই।',
      offlineQueueWarning: 'ইন্টারনেট ফিরে এলে তালিকার বার্তা স্বয়ংক্রিয়ভাবে পাঠানো হয় না। অনলাইন যাচাইয়ের জন্য নিচে পুনরায় সম্মতি দিন।',
      renewConsentLabel: 'আমি এই মাস্ক করা বার্তাটি অনলাইনে যাচাইয়ের পুনরায় সম্মতি দিচ্ছি',
      submitQueuedBtn: 'অনলাইন যাচাই করুন',
      removeQueuedBtn: 'বাদ দিন',
      syncAccountHint: 'অন্যান্য ডিভাইসে সংরক্ষিত ইতিহাস সিঙ্ক করতে Google দিয়ে সাইন ইন করুন।',
      signInGoogle: 'Google দিয়ে সাইন ইন করুন',
      signOut: 'সাইন আউট',
    },
    assisted: {
      title: 'সহায়ক মোড — অন্য একজনকে সাহায্য করার জন্য',
      subtitle: 'পরিবারের সদস্য ও স্থানীয় দোকানদারদের জন্য বড় লেখা, বড় বাটন এবং পড়ে শোনানোর সুবিধা।',
      privacyBannerTitle: 'যাঁকে সাহায্য করছেন তাঁকে এই গোপনীয়তা বার্তাটি পড়ে শোনান',
      privacyBannerBody:
        'যাচাইয়ের আগে তাঁকে জানান: ফোন নম্বর, UPI ID এবং OTP স্বয়ংক্রিয়ভাবে ঢাকা থাকবে। তাঁর সম্মতি ছাড়া কিছু সংরক্ষিত হবে না এবং কখনো তাঁর UPI পিন জানতে চাইবেন না।',
      readNoticeAloud: 'গোপনীয়তা বার্তা পড়ে শোনান',
      verbalConsentLabel: 'আমি এই গোপনীয়তা বার্তাটি বুঝিয়ে দিয়েছি এবং তিনি বার্তাটি যাচাই করতে সম্মত হয়েছেন',
      step1Title: 'ধাপ ১: তাঁর পাওয়া বার্তাটি পেস্ট করুন বা বলুন',
      step2Title: 'ধাপ ২: নিরাপত্তা যাচাই করতে বড় বাটনে চাপ দিন',
      checkButton: 'এখনই বার্তা যাচাই করুন',
      resetButton: 'পরবর্তী বার্তা যাচাই করুন',
      verbalConsentRequired: 'অনুগ্রহ করে প্রথমে নিশ্চিত করুন যে ব্যক্তি বার্তাটি যাচাই করতে সম্মত হয়েছেন।',
    },
    reviewer: {
      title: 'মানব তদারকি ও পর্যালোচক কনসোল',
      subtitle: 'সম্মতিপ্রাপ্ত কেস পর্যালোচনা করুন, নোট লিখুন এবং ব্যক্তিগত তথ্যমুক্ত অডিট লগ দেখুন।',
      accessRestrictedTitle: 'অনুমোদিত পর্যালোচক সাইন-ইন প্রয়োজন',
      accessRestrictedBody:
        'নাগরিকদের গোপনীয়তা রক্ষায় কেবল যাচাইকৃত অনুমোদিত পর্যালোচকরাই সম্মতিপ্রাপ্ত তালিকা দেখতে ও আপডেট করতে পারেন।',
      signInPrompt: 'অনুমোদিত Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন',
      queueTitle: 'সম্মতিপ্রাপ্ত মানব পর্যালোচনা তালিকা',
      emptyQueue: 'এই ফিল্টারে কোনো পর্যালোচনা কেস নেই।',
      consentedOnlyBadge: 'কেবল সম্মতিপ্রাপ্ত মাস্ক কেস',
      caseStatusLabel: 'পর্যালোচনার অবস্থা',
      notesLabel: 'পর্যালোচকের নোট',
      notesPlaceholder: 'যাচাই নোট বা সহজ নিরাপত্তা নির্দেশনা লিখুন...',
      saveDecisionBtn: 'আপডেট সংরক্ষণ করুন',
      savedToast: 'কেস আপডেট করা হয়েছে এবং অডিট লগে যুক্ত হয়েছে।',
      auditTitle: 'অপারেশনাল অডিট লগ (কোনো ব্যক্তিগত তথ্য নেই)',
      noAuditLogs: 'এখনো কোনো অডিট ইভেন্ট নেই।',
      noUnauthorizedNotice: 'গোপনীয়তা সুরক্ষা সক্রিয়: স্পষ্ট সম্মতি ছাড়া ব্যক্তিগত বার্তাগুলো ডেটাবেস নিয়মে সম্পূর্ণ সুরক্ষিত।',
    },
    status: {
      title: 'সিস্টেম স্ট্যাটাস, পরীক্ষা ও সীমাবদ্ধতা',
      subtitle: 'স্বচ্ছ সিস্টেম স্বাস্থ্য, সিন্থেটিক পরীক্ষা এবং স্বয়ংক্রিয় স্ক্যাম শনাক্তকরণের সীমাবদ্ধতা।',
      limitationsTitle: 'জানা সীমাবদ্ধতা ও স্বচ্ছতা',
      limitationsItems: [
        'স্বয়ংক্রিয় নিয়ম ও AI নতুন কৌশলের প্রতারণা মিস করতে পারে অথবা কখনো বৈধ জরুরি বার্তাকে সন্দেহজনক বলতে পারে।',
        'ঝুঁকির স্কোর (০–১০০) কেবল সহায়তার সূচক, পরিসংখ্যানগত সম্ভাবনা নয়।',
        'লিংক পরীক্ষা পেজ না খুলেই করা হয়, তাই নতুন সাধারণ দেখতে ফিশিং ডোমেইন অনিশ্চিত দেখাতে পারে।',
        'ভয়েস ইনপুট ও পড়ে শোনানো ব্রাউজার এবং ডিভাইসে থাকা বাংলা/হিন্দি ভয়েসের উপর নির্ভর করে।',
      ],
    },
    common: {
      offlineBanner: 'অফলাইন মোড — স্থানীয় নিরাপত্তা নিয়ম ও অফলাইন নির্দেশিকা সক্রিয় আছে।',
      installApp: 'অ্যাপ ইনস্টল করুন',
      languageLabel: 'ভাষা',
      cancel: 'বাতিল',
      confirm: 'মুছুন নিশ্চিত করুন',
    },
  },
};
