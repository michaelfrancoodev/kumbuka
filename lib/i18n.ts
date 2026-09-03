"use client";

import { useCallback, useEffect, useState } from "react";
import type { Language } from "./types";

/**
 * Interface language.
 *
 * Switching language re-labels the interface only. Records are never
 * translated — the sentence a person spoke is stored and displayed exactly
 * as they said it, in every language mode.
 */

type Dict = Record<string, string>;

const en: Dict = {
  "nav.today": "Today",
  "nav.records": "Records",
  "nav.people": "People",
  "nav.ask": "Ask",
  "lang.label": "Language",

  "today.moneyOut": "Money out",
  "today.moneyIn": "Money in",
  "today.records": "Records",
  "today.needsDetail": "Needs one more detail",

  "capture.placeholder": "Say what happened...",
  "capture.hint": "Type or tap the microphone. One sentence, any language.",
  "capture.processing": "Reading that...",
  "capture.speak": "Speak",
  "capture.listening": "Listening",
  "capture.stillListening": "Still listening...",
  "capture.stop": "Stop",
  "capture.tryOne": "Try one of these",

  "records.title": "Records",
  "records.empty": "No records yet",
  "records.emptyHint": "Say what happened, in any language, to record it.",
  "records.search": "Search records",
  "records.count": "{n} records",
  "records.awaiting": "Awaiting a detail",
  "records.confirmed": "Confirmed",
  "records.recordedByVoice": "Recorded by voice",
  "records.recordedByTyping": "Recorded by typing",
  "records.noMatch": "Nothing found",
  "records.noMatchHint": "Try a different word, or clear the filter.",

  "filter.all": "All",

  "kind.payment": "Payment",
  "kind.payment.withPerson": "Payment to {name}",
  "kind.purchase": "Purchase",
  "kind.purchase.withPerson": "Purchase from {name}",
  "kind.sale": "Sale",
  "kind.sale.withPerson": "Sale to {name}",
  "kind.activity": "Work",
  "kind.activity.withPerson": "Work by {name}",
  "kind.production": "Production",
  "kind.production.withPerson": "Production by {name}",

  "field.person": "Person",
  "field.amount": "Amount",
  "field.quantity": "Quantity",
  "field.purpose": "Purpose",
  "field.date": "Date",
  "field.unknown": "Not given",

  "confirm.heading": "Confirm this record",
  "confirm.save": "Save",
  "confirm.edit": "Edit",
  "confirm.discard": "Discard",
  "confirm.note": "Nothing is stored until you tap Save.",

  "clarify.missing": "One detail is missing",
  "clarify.unclear": "Not sure what this means",
  "clarify.answer": "Answer",
  "clarify.askAmount": "How much did you give {name}?",
  "clarify.askPerson": "Who was this for?",
  "clarify.kind.person": "A person",
  "clarify.kind.place": "A place",
  "clarify.kind.activity": "An activity",
  "clarify.kind.unit": "A unit of measure",
  "clarify.kind.item": "An item",

  "people.title": "People",
  "people.empty": "No one recorded yet",
  "people.emptyHint": "People appear here once you record something involving them.",
  "people.totalPaid": "Total paid",
  "people.totalReceived": "Total received",
  "people.lastActivity": "Last activity",

  "ask.title": "Ask",
  "ask.you": "You",
  "ask.placeholder": "Ask about your records...",
  "ask.emptyTitle": "Ask about your records",
  "ask.emptyHint": "Answers come from what you have saved, with the records shown.",
  "ask.toolsUsed": "Tools used",
  "ask.basedOn": "Based on {n} records",
  "ask.viewEvidence": "View evidence",
  "ask.evidence": "Evidence",
  "ask.total": "Total",
  "ask.close": "Close",

  "state.loading": "Loading...",
  "state.parseFailed": "Could not read that. Check your connection and try again.",
  "state.retry": "Could not save. Try again.",
  "state.micDenied": "Microphone access was denied. You can still type.",
};

const sw: Dict = {
  "nav.today": "Leo",
  "nav.records": "Kumbukumbu",
  "nav.people": "Watu",
  "nav.ask": "Uliza",
  "lang.label": "Lugha",

  "today.moneyOut": "Fedha zilizotoka",
  "today.moneyIn": "Fedha zilizoingia",
  "today.records": "Kumbukumbu",
  "today.needsDetail": "Zinahitaji taarifa moja zaidi",

  "capture.placeholder": "Sema kilichotokea...",
  "capture.hint": "Andika au bonyeza kipaza sauti. Sentensi moja, lugha yoyote.",
  "capture.processing": "Ninasoma...",
  "capture.speak": "Sema",
  "capture.listening": "Ninasikiliza",
  "capture.stillListening": "Bado ninasikiliza...",
  "capture.stop": "Simamisha",
  "capture.tryOne": "Jaribu moja ya haya",

  "records.title": "Kumbukumbu",
  "records.empty": "Hakuna kumbukumbu bado",
  "records.emptyHint": "Sema kilichotokea, kwa lugha yoyote, ili kukirekodi.",
  "records.search": "Tafuta kumbukumbu",
  "records.count": "Kumbukumbu {n}",
  "records.awaiting": "Inasubiri taarifa",
  "records.confirmed": "Imethibitishwa",
  "records.recordedByVoice": "Imerekodiwa kwa sauti",
  "records.recordedByTyping": "Imerekodiwa kwa kuandika",
  "records.noMatch": "Hakuna kilichopatikana",
  "records.noMatchHint": "Jaribu neno lingine, au ondoa kichujio.",

  "filter.all": "Zote",

  "kind.payment": "Malipo",
  "kind.payment.withPerson": "Malipo kwa {name}",
  "kind.purchase": "Manunuzi",
  "kind.purchase.withPerson": "Manunuzi kutoka {name}",
  "kind.sale": "Mauzo",
  "kind.sale.withPerson": "Mauzo kwa {name}",
  "kind.activity": "Kazi",
  "kind.activity.withPerson": "Kazi ya {name}",
  "kind.production": "Uzalishaji",
  "kind.production.withPerson": "Uzalishaji wa {name}",

  "field.person": "Mtu",
  "field.amount": "Kiasi",
  "field.quantity": "Kiwango",
  "field.purpose": "Kusudi",
  "field.date": "Tarehe",
  "field.unknown": "Haijatolewa",

  "confirm.heading": "Thibitisha kumbukumbu hii",
  "confirm.save": "Hifadhi",
  "confirm.edit": "Hariri",
  "confirm.discard": "Ondoa",
  "confirm.note": "Hakuna kinachohifadhiwa mpaka ubonyeze Hifadhi.",

  "clarify.missing": "Taarifa moja inakosekana",
  "clarify.unclear": "Sijaelewa hii inamaanisha nini",
  "clarify.answer": "Jibu",
  "clarify.askAmount": "Ulimpa {name} kiasi gani?",
  "clarify.askPerson": "Ilikuwa kwa ajili ya nani?",
  "clarify.kind.person": "Mtu",
  "clarify.kind.place": "Mahali",
  "clarify.kind.activity": "Shughuli",
  "clarify.kind.unit": "Kipimo",
  "clarify.kind.item": "Kitu",

  "people.title": "Watu",
  "people.empty": "Hakuna aliyerekodiwa bado",
  "people.emptyHint": "Watu wataonekana hapa ukishaandika kitu kinachowahusu.",
  "people.totalPaid": "Jumla iliyolipwa",
  "people.totalReceived": "Jumla iliyopokelewa",
  "people.lastActivity": "Shughuli ya mwisho",

  "ask.title": "Uliza",
  "ask.you": "Wewe",
  "ask.placeholder": "Uliza kuhusu kumbukumbu zako...",
  "ask.emptyTitle": "Uliza kuhusu kumbukumbu zako",
  "ask.emptyHint": "Majibu yanatoka kwenye ulichohifadhi, pamoja na rekodi zenyewe.",
  "ask.toolsUsed": "Zana zilizotumika",
  "ask.basedOn": "Kutokana na kumbukumbu {n}",
  "ask.viewEvidence": "Ona ushahidi",
  "ask.evidence": "Ushahidi",
  "ask.total": "Jumla",
  "ask.close": "Funga",

  "state.loading": "Inapakia...",
  "state.parseFailed": "Imeshindwa kusoma hilo. Angalia mtandao wako na ujaribu tena.",
  "state.retry": "Imeshindwa kuhifadhi. Jaribu tena.",
  "state.micDenied": "Ruhusa ya kipaza sauti imekataliwa. Bado unaweza kuandika.",
};

const dictionaries: Record<Language, Dict> = { en, sw };

const STORAGE_KEY = "kumbuka.language";

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("sw");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "sw") setLanguageState(stored);
    setReady(true);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[language];
      let value = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replace(`{${name}}`, String(replacement));
        }
      }
      return value;
    },
    [language]
  );

  return { t, language, setLanguage, ready };
}
