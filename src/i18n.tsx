import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'en' | 'th';

type Dict = Record<string, string>;

// Only the DISPLAY is translated. Values stored in Supabase (restaurant, time,
// type, etc.) stay canonical English so reports and the dashboard aggregate
// consistently regardless of the evaluator's language.
const en: Dict = {
  'app.subtitle': 'Internal Quality Check',
  'nav.evaluation': 'Evaluation',
  'nav.dashboard': 'Dashboard',
  'nav.reports': 'Reports',
  'insight.title': 'Recent Insight',
  'insight.subtitle': 'Avg Food Quality this week',
  'insight.nodata': 'No data',

  // Evaluation form
  'eval.detailsTitle': 'Evaluation Details',
  'eval.tasteTitle': 'What did you taste today?',
  'eval.staffTitle': 'Staff Service',
  'eval.commentsTitle': 'Additional Comments',
  'field.name': 'Evaluator Name',
  'field.employeeId': 'Employee ID',
  'field.date': 'Evaluation Date',
  'field.restaurant': 'Restaurant',
  'field.timeOfService': 'Time of Service',
  'field.typeOfService': 'Type of Service',
  'placeholder.name': 'Jane Doe',
  'placeholder.employeeId': 'EMP-1234',
  'placeholder.item': 'e.g. Tom Yum Goong',
  'placeholder.comments': 'Let us know about the flavor profile, presentation, or any needed adjustments...',
  'select.restaurant': 'Select a restaurant...',
  'select.time': 'Select time...',
  'select.type': 'Select type...',
  'time.breakfast': 'Breakfast',
  'time.lunch': 'Lunch',
  'time.dinner': 'Dinner',
  'type.alacarte': 'A la carte',
  'type.buffet': 'Buffet',
  'rating.foodTaste': 'Food Taste',
  'rating.qualityOfIngredients': 'Quality of Ingredients',
  'rating.freshnessOfFood': 'Freshness of Food',
  'rating.foodTemperature': 'Appropriate Food Temperature',
  'rating.foodPresentation': 'Food Presentation',
  'rating.promptness': 'Promptness of Service',
  'rating.attentiveness': 'Attentiveness and Care',
  'rating.cleanliness': 'Cleanliness of the Restaurant',
  'rating.value': 'Value for Money',
  'item.name': 'Item Name {n}',
  'item.add': '+ ADD ANOTHER ITEM',
  'item.remove': 'Remove',
  'comments.label': 'Detailed feedback & suggestions:',
  'eval.motto': '"Your feedback drives our culinary excellence!"',
  'eval.submit': 'SUBMIT EVALUATION',
  'eval.submitting': 'SUBMITTING...',
  'success.title': 'Thank You!',
  'success.body': 'Your evaluation has been logged. We will review this to refine our dishes and elevate our service.',
  'success.another': 'Submit Another',

  // Validation
  'err.details': 'Please fill in your Name, Employee ID, Date, Restaurant, Time, and Type of Service.',
  'err.itemName': 'Please provide a name for all tasted items.',
  'err.itemRatings': 'Please complete all Food Quality ratings for {item}.',
  'err.staff': 'Please complete all Staff Service ratings.',
  'err.submit': 'There was an error submitting your evaluation. Please try again.',

  // Reports
  'reports.title': 'Reports & Exports',
  'reports.subtitle': 'Filter evaluation data by date and download it as a CSV file.',
  'reports.start': 'Start Date',
  'reports.end': 'End Date',
  'reports.download': 'DOWNLOAD CSV',
  'reports.preparing': 'PREPARING DOWNLOAD...',
  'reports.errNoData': 'No evaluations found for the selected date range.',
  'reports.errFetch': 'Error fetching data. Please try again.',

  // Dashboard
  'dash.title': 'Dashboard',
  'dash.subtitle': 'Live insights from submitted evaluations.',
  'range.7': 'Last 7 days',
  'range.30': 'Last 30 days',
  'range.all': 'All time',
  'dash.refresh': 'Refresh',
  'dash.loading': 'Loading insights…',
  'dash.emptyTitle': 'No evaluations yet',
  'dash.emptyBody': 'Once evaluations are submitted for this period, their insights will appear here.',
  'kpi.evaluations': 'Evaluations',
  'kpi.dishes': '{n} dishes tasted',
  'kpi.foodQuality': 'Food Quality',
  'kpi.service': 'Staff Service',
  'kpi.overall': 'Overall Score',
  'kpi.avgOutOf5': 'avg out of 5',
  'dash.byRestaurant': 'Average by Restaurant',
  'dash.recent': 'Recent Evaluations',
  'dash.unspecified': 'Unspecified',
  'dash.anonymous': 'Anonymous',
  'dash.errLoad': 'Could not load dashboard data. Please try again.',

  // Photos & Summary
  'field.photo': 'Photo (optional)',
  'photo.add': 'Add photo',
  'photo.change': 'Change photo',
  'photo.remove': 'Remove photo',
  'photo.uploading': 'Uploading photos…',
  'err.upload': 'Could not upload a photo. Please try again.',
  'nav.summary': 'Summary',
  'summary.title': 'Menu Summary',
  'summary.subtitle': 'Dishes, photos, and comments from submitted evaluations.',
  'summary.noPhoto': 'No photo',
  'summary.comment': 'Comment',
  'summary.noComment': 'No comment',
};

const th: Dict = {
  'app.subtitle': 'ตรวจสอบคุณภาพภายใน',
  'nav.evaluation': 'แบบประเมิน',
  'nav.dashboard': 'แดชบอร์ด',
  'nav.reports': 'รายงาน',
  'insight.title': 'ข้อมูลเชิงลึกล่าสุด',
  'insight.subtitle': 'คุณภาพอาหารเฉลี่ยสัปดาห์นี้',
  'insight.nodata': 'ไม่มีข้อมูล',

  'eval.detailsTitle': 'รายละเอียดการประเมิน',
  'eval.tasteTitle': 'วันนี้คุณได้ชิมอะไรบ้าง?',
  'eval.staffTitle': 'การบริการของพนักงาน',
  'eval.commentsTitle': 'ความคิดเห็นเพิ่มเติม',
  'field.name': 'ชื่อผู้ประเมิน',
  'field.employeeId': 'รหัสพนักงาน',
  'field.date': 'วันที่ประเมิน',
  'field.restaurant': 'ร้านอาหาร',
  'field.timeOfService': 'ช่วงเวลาให้บริการ',
  'field.typeOfService': 'ประเภทการบริการ',
  'placeholder.name': 'เช่น สมชาย ใจดี',
  'placeholder.employeeId': 'EMP-1234',
  'placeholder.item': 'เช่น ต้มยำกุ้ง',
  'placeholder.comments': 'บอกเราเกี่ยวกับรสชาติ การจัดจาน หรือสิ่งที่ควรปรับปรุง...',
  'select.restaurant': 'เลือกร้านอาหาร...',
  'select.time': 'เลือกช่วงเวลา...',
  'select.type': 'เลือกประเภท...',
  'time.breakfast': 'อาหารเช้า',
  'time.lunch': 'อาหารกลางวัน',
  'time.dinner': 'อาหารเย็น',
  'type.alacarte': 'อาลาคาร์ต',
  'type.buffet': 'บุฟเฟต์',
  'rating.foodTaste': 'รสชาติอาหาร',
  'rating.qualityOfIngredients': 'คุณภาพของวัตถุดิบ',
  'rating.freshnessOfFood': 'ความสดของอาหาร',
  'rating.foodTemperature': 'อุณหภูมิอาหารที่เหมาะสม',
  'rating.foodPresentation': 'การจัดจานอาหาร',
  'rating.promptness': 'ความรวดเร็วในการบริการ',
  'rating.attentiveness': 'ความเอาใจใส่ในการดูแล',
  'rating.cleanliness': 'ความสะอาดของร้าน',
  'rating.value': 'ความคุ้มค่าเงิน',
  'item.name': 'ชื่อรายการที่ {n}',
  'item.add': '+ เพิ่มรายการ',
  'item.remove': 'ลบ',
  'comments.label': 'ความคิดเห็นและข้อเสนอแนะโดยละเอียด:',
  'eval.motto': '"ความคิดเห็นของคุณช่วยพัฒนาคุณภาพอาหารของเรา!"',
  'eval.submit': 'ส่งแบบประเมิน',
  'eval.submitting': 'กำลังส่ง...',
  'success.title': 'ขอบคุณ!',
  'success.body': 'บันทึกการประเมินของคุณเรียบร้อยแล้ว เราจะนำไปปรับปรุงอาหารและยกระดับการบริการของเรา',
  'success.another': 'ส่งแบบประเมินอีกครั้ง',

  'err.details': 'กรุณากรอกชื่อ รหัสพนักงาน วันที่ ร้านอาหาร ช่วงเวลา และประเภทการบริการ',
  'err.itemName': 'กรุณาระบุชื่อของทุกรายการที่ชิม',
  'err.itemRatings': 'กรุณาให้คะแนนคุณภาพอาหารให้ครบสำหรับ {item}',
  'err.staff': 'กรุณาให้คะแนนการบริการของพนักงานให้ครบทุกข้อ',
  'err.submit': 'เกิดข้อผิดพลาดในการส่งแบบประเมิน กรุณาลองใหม่อีกครั้ง',

  'reports.title': 'รายงานและการส่งออก',
  'reports.subtitle': 'กรองข้อมูลการประเมินตามวันที่และดาวน์โหลดเป็นไฟล์ CSV',
  'reports.start': 'วันที่เริ่มต้น',
  'reports.end': 'วันที่สิ้นสุด',
  'reports.download': 'ดาวน์โหลด CSV',
  'reports.preparing': 'กำลังเตรียมดาวน์โหลด...',
  'reports.errNoData': 'ไม่พบการประเมินในช่วงวันที่ที่เลือก',
  'reports.errFetch': 'เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง',

  'dash.title': 'แดชบอร์ด',
  'dash.subtitle': 'ข้อมูลเชิงลึกแบบเรียลไทม์จากการประเมิน',
  'range.7': '7 วันล่าสุด',
  'range.30': '30 วันล่าสุด',
  'range.all': 'ทั้งหมด',
  'dash.refresh': 'รีเฟรช',
  'dash.loading': 'กำลังโหลดข้อมูล…',
  'dash.emptyTitle': 'ยังไม่มีการประเมิน',
  'dash.emptyBody': 'เมื่อมีการส่งแบบประเมินในช่วงเวลานี้ ข้อมูลเชิงลึกจะปรากฏที่นี่',
  'kpi.evaluations': 'การประเมิน',
  'kpi.dishes': 'ชิมอาหาร {n} รายการ',
  'kpi.foodQuality': 'คุณภาพอาหาร',
  'kpi.service': 'การบริการ',
  'kpi.overall': 'คะแนนรวม',
  'kpi.avgOutOf5': 'เฉลี่ยจาก 5',
  'dash.byRestaurant': 'ค่าเฉลี่ยตามร้านอาหาร',
  'dash.recent': 'การประเมินล่าสุด',
  'dash.unspecified': 'ไม่ระบุ',
  'dash.anonymous': 'ไม่ระบุชื่อ',
  'dash.errLoad': 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง',

  // Photos & Summary
  'field.photo': 'รูปภาพ (ไม่บังคับ)',
  'photo.add': 'เพิ่มรูปภาพ',
  'photo.change': 'เปลี่ยนรูปภาพ',
  'photo.remove': 'ลบรูปภาพ',
  'photo.uploading': 'กำลังอัปโหลดรูปภาพ…',
  'err.upload': 'ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง',
  'nav.summary': 'สรุป',
  'summary.title': 'สรุปเมนู',
  'summary.subtitle': 'เมนู รูปภาพ และความคิดเห็นจากการประเมินที่ส่งเข้ามา',
  'summary.noPhoto': 'ไม่มีรูปภาพ',
  'summary.comment': 'ความคิดเห็น',
  'summary.noComment': 'ไม่มีความคิดเห็น',
};

const DICTS: Record<Lang, Dict> = { en, th };

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = 'dinecheck.lang';

function initialLang(): Lang {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'th') return saved;
    if (window.navigator.language?.toLowerCase().startsWith('th')) return 'th';
  }
  return 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore storage errors (private mode) */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback<TFunc>(
    (key, vars) => {
      let str = DICTS[lang][key] ?? DICTS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
