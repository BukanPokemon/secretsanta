export const en = {
  language: {
    flag: "🇺🇸",
    name: "English",
    id: "Indonesian",
  },
  errors: {
    needMoreParticipants: "Need at least 2 participants!",
    invalidPairs: "Couldn't generate valid pairs with the current rules. Please check the rules and try again.",
    multipleMustRules: "{{name}} has more than one MUST rule — only one is allowed",
    conflictingRules: "{{name}} must be paired with {{target}}, but also excludes {{target}} — remove one of the two rules",
    duplicateMustTarget: "{{giverA}} and {{giverB}} both have a MUST rule pointing at {{target}} — only one giver can be paired with them",
    noValidReceiverFor: "{{name}} has no one left to give to, once the current rules are applied",
    noValidGiverFor: "No one is allowed to give to {{name}} under the current rules",
    emptyName: "Empty name",
    duplicateName: "Duplicate name: {{name}}",
    invalidRuleFormat: "Invalid rule format: {{rule}}",
    unknownParticipant: "Unknown participant in rule: {{name}}",
    noValidReceivers: "No valid receivers left for this participant",
    line: "Line {{number}}"
  },
  home: {
    vanity: 'Credits: <a href="https://github.com/arcanis/secretsanta" target="_blank" class="underline hover:text-gray-600">Github</a>',
    vanityUrl: "https://github.com/arcanis/secretsanta",
    sponsor: "Support me on GitHub",
    title: "Secret Santa Planner",
    explanation: [
      "Welcome! This tool will help you arrange your holiday gift exchanges easily.",
      "Add participants manually or upload a CSV with all participant details (Name, Address, Phone, Gift Hint, Notes).",
      "Set pairing rules for participants (force a pairing or prevent a pairing).",
      "Generate Secret Santa pairings automatically.",
      "Each participant will receive a unique link showing who they should gift, along with Gift Hint, Address, Phone, Notes, and optional instructions.",
      "No accounts, emails, or backend required — everything runs in your browser and is hosted on GitHub Pages.",
      "Enjoy a fun and stress-free Secret Santa experience! 🎄",
      "You will receive a unique link for each participant, which you must share yourself (via email, Slack, etc). [Example link]"
    ]
  },
  pairing: {
    title: "Your Secret Santa Assignment",
    explainer: "This link is just for you. No one else can see who you're giving a gift to, and nothing about you was collected to show you this — everything happens right here in your browser.",
    greeting: "Hi, <name/>!",
    tapToOpen: "Tap to open your gift",
    assignment: "Welcome, <name/>! You have been picked to get a gift for:",
    error: "Couldn't load this link. It might be broken or got cut off when it was shared — ask your organizer to resend it.",
    startYourOwn: "Start a Secret Santa yourself!",
    address: "Address",
    phone: "Phone",
    notes: "Notes",
    wishlistLink: "View wishlist",
    eventInfoTitle: "Event Info",
    rulesReminder: "{{instructions}}" // custom instructions
  },
  participants: {
    title: "Participants",
    generationWarning: "Important: Any change made to the participant list or settings will require creating new pairings. Existing links won't be updated.",
    addPerson: "Add Person",
    tryExample: "Try an Example",
    uploadSpreadsheet: "Upload CSV or Excel",
    downloadCsvTemplate: "Download CSV template",
    downloadXlsxTemplate: "Download Excel template",
    generatePairs: "Generate Pairings",
    enterName: "Enter participant name",
    editRules: "Edit rules",
    removeParticipant: "Remove participant",
    rulesCount_one: "{{count}} rule",
    rulesCount_other: "{{count}} rules",
    switchToFormView: "Switch to form view",
    switchToTextView: "Switch to text view"
  },
  rules: {
    title: "Rules for {{name}}",
    hintLabel: "Gift Hint",
    hintPlaceholder: "Enter a gift hint (optional)",
    addressLabel: "Address",
    addressPlaceholder: "Enter address (optional)",
    phoneLabel: "Phone",
    phonePlaceholder: "Enter phone (optional)",
    notesLabel: "Notes",
    notesPlaceholder: "Enter additional notes (optional)",
    wishlistLabel: "Wishlist Link",
    wishlistPlaceholder: "Enter a wishlist URL (optional)",
    groupLabel: "Group",
    groupPlaceholder: 'e.g. "Smith Family" — members never draw each other',
    addMustRule: "Force a Pairing",
    addMustNotRule: "Prevent a Pairing",
    mustBePairedWith: "Must be paired with",
    mustNotBePairedWith: "Must not be paired with",
    selectParticipant: "Select another participant",
    removeRule: "Remove rule",
    cancel: "Cancel",
    saveRules: "Save Rules"
  },
  links: {
    title: "Links to Share",
    warningParticipantsChanged: "Warning: Participants or rules have changed since these links were generated.",
    resetAssignments: "Regenerate Pairings",
    shareInstructions: "Only share these links with the corresponding gift giver",
    selfSpoilWarning: "Don't open your own link — clicking it reveals who you're giving a gift to. Copy each link and send it without opening it yourself.",
    exportCSV: "Export as CSV",
    copySecretLink: "Copy Secret Link",
    linkCopied: "Added to clipboard!",
    for: "for",
    whatsappMessage: "Hi {{name}}! Here's your Secret Santa link 🎁\n{{link}}",
    sendWhatsApp: "Send via WhatsApp",
    copyAll: "Copy All Messages",
    copyAllCopied: "All messages copied!",
    printSlips: "Print Slips",
    showQr: "QR Code",
    qrModalTitle: "QR Code for {{name}}",
    close: "Close",
    markSent: "Mark as sent",
    sentLabel: "Sent",
    printSlipInstructions: "Scan this QR code or visit the link to see your Secret Santa match",
    printSlipFallback: "Can't scan? Visit:"
  },
  settings: {
    title: "Settings",
    eventName: "Event Name",
    eventNamePlaceholder: "e.g., Office Christmas Party",
    eventDate: "Event Date",
    exchangeDeadline: "Exchange Deadline",
    budgetRange: "Budget Range",
    budgetMinPlaceholder: "Min",
    budgetMaxPlaceholder: "Max",
    instructions: "Additional Instructions",
    instructionsPlaceholder: "e.g., budget, date, location...",
    instructionsHelp: "They will be shown to all participants on their assignment page. Keep it short to avoid long links.",
    backupTitle: "Backup & Restore",
    backupHelp: "Your event only lives in this browser. Export a backup so you can re-send links if you clear your browser data.",
    exportEvent: "Export Event",
    importEvent: "Import Event",
    importConfirm: "This will replace your current participants, pairings, and settings. Continue?",
    importError: "Couldn't read that file — it doesn't look like a Tukar Kado event backup."
  },
  import: {
    title: "Import Participants",
    loading: "Reading file...",
    errorReadingFile: "Couldn't read this file. Make sure it's a valid CSV or Excel (.xlsx) file.",
    errorEmptyFile: "This file doesn't have any rows.",
    mappingTitle: "Match your columns",
    blankHeader: "(blank)",
    fieldIgnore: "Don't import",
    fieldName: "Name",
    fieldAddress: "Address",
    fieldPhone: "Phone",
    fieldHint: "Gift Hint",
    fieldNotes: "Notes",
    fieldWishlistUrl: "Wishlist URL",
    fieldGroupId: "Group",
    previewTitle: "Preview",
    rowNumber: "Row {{number}}",
    morePreviewRows: "and {{count}} more row(s) not shown here — they'll still be imported",
    largeFileWarning: "That's {{count}} rows — generating pairings for a group this size may take a moment.",
    summary: "{{valid}} ready to import, {{errors}} with errors (skipped), {{blank}} blank rows skipped",
    confirmButton: "Import {{count}} Participants",
    errorMissingName: "Missing name",
    errorDuplicateName: "Duplicate name",
    warningNumericPhone: "This phone number was stored as a number in the spreadsheet — double check a leading zero wasn't lost"
  },
  seo: {
    homeTitle: "Tukar Kado — Free Secret Santa Generator, No Signup, No Email",
    homeDescription: "Organize a Secret Santa gift exchange online in minutes. No signup, no email, no account required — your participant list stays private in your own browser. Free and easy to use.",
    guideTitle: "How to Organize a Secret Santa Online — Step-by-Step Guide | Tukar Kado",
    guideDescription: "A step-by-step guide to running a Secret Santa gift exchange online: add participants, set pairing rules, generate matches, and share private links via WhatsApp. Free, no signup required."
  },
  guide: {
    backToHome: "Back to Home",
    title: "How to Organize a Secret Santa Online",
    intro: "Tukar Kado is a free tool for running a Secret Santa (or any gift exchange) online — no signup, no email, and no account required. Everyone's name-to-name assignment stays private: it's encrypted right in the link you send them, and the whole thing runs in your browser with nothing sent to a server. Here's how to set one up in a few minutes.",
    steps: [
      {
        title: "1. Add your participants",
        body: "Go to the home page and type in each person's name. Press Enter after each one to add the next. If you already have a list in a spreadsheet, use \"Upload CSV or Excel\" instead — it works with a plain list of names or a full sheet with addresses, phone numbers, and gift hints. Don't have a list handy? Click \"Try an Example\" to see the whole flow with sample data first."
      },
      {
        title: "2. Set any pairing rules (optional)",
        body: "Click the gear icon next to a name to add a gift hint, address, phone number, or wishlist link, or to set pairing rules: force a specific pairing, or prevent one. Living with your spouse or siblings in the same draw? Give them the same \"Group\" name and they'll never be paired with each other automatically — no need to click through every exclusion by hand."
      },
      {
        title: "3. Generate the pairings",
        body: "Click \"Generate Pairings.\" Tukar Kado works out a valid set of matches that respects every rule you set, instantly. If your rules make a valid match impossible — for example, two people both required to give to the same person — you'll get a specific explanation of which rule is the problem, not just a generic error."
      },
      {
        title: "4. Share each link — privately",
        body: "Every participant gets their own secret link. If you added phone numbers, tap \"Send via WhatsApp\" to message each person directly with one tap. Otherwise, copy each link and send it however you like — chat, email, printed slips with a QR code to scan. Each link only reveals that one person's assignment; nobody else can see it, and you shouldn't open your own link if you don't want to spoil your own surprise."
      },
      {
        title: "5. Reveal day",
        body: "When a participant opens their link, they see a short explanation of what it is and a tap-to-open reveal — the gift recipient's name isn't shown until they choose to look. If you set a budget, date, or extra instructions, those show up there too."
      }
    ],
    faqTitle: "Frequently Asked Questions",
    faq: [
      {
        question: "Do I need to create an account or sign up?",
        answer: "No. There's no signup, no login, and no account of any kind. Open the page and start adding participants."
      },
      {
        question: "Do you collect participants' email addresses?",
        answer: "No email addresses are collected or required anywhere in the process. Links are shared directly by you, however you choose — WhatsApp, chat, or in person."
      },
      {
        question: "Where is the participant list stored?",
        answer: "Only in your own browser's local storage, on your own device. It's never sent to a server — there isn't one. If you clear your browser data, use the Export Event feature beforehand to save a backup file."
      },
      {
        question: "Can someone else see who I'm assigned to give a gift to?",
        answer: "No. Each participant's assignment is encrypted individually and only readable from their own unique link. Even the organizer can't tell who has whom just by looking at the list of links."
      },
      {
        question: "Is it really free?",
        answer: "Yes, completely free, with no limits on the number of participants or exchanges."
      }
    ],
    ctaText: "Ready to set up your own gift exchange?",
    ctaButton: "Create Your Secret Santa"
  }
};
