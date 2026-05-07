export type Language = 'ja' | 'en' | 'es' | 'zh';

export const supportedLanguages: readonly Language[] = ['ja', 'en', 'es', 'zh'];

export const languageLabel: Record<Language, string> = {
  ja: '日本語',
  en: 'English',
  es: 'Español',
  zh: '中文',
};

export const languageShortLabel: Record<Language, string> = {
  ja: 'JA',
  en: 'EN',
  es: 'ES',
  zh: 'ZH',
};

type Dictionary = {
  app_title: string;
  start_meeting: string;
  end_meeting: string;
  close: string;
  idle_click_top_right: string;
  idle_start: string;
  idle_boredom_detected: string;
  idle_end_to_review: string;
  idle_tip_label: string;
  meeting_tip_source: string;
  armed_eyebrow: string;
  armed_title: string;
  armed_body_template: string;
  armed_action: string;
  pip_tracking: string;
  pip_idle: string;
  pip_volume: string;
  pip_toast: string;
  pip_toast_sub: string;
  pip_not_supported: string;
  notification_title: string;
  notification_body: string;
  audio_error_close: string;
  language_picker_label: string;
};

const ja: Dictionary = {
  app_title: 'Boring Meeting Flyswatter',
  start_meeting: 'ミーティング開始',
  end_meeting: 'ミーティング終了',
  close: '閉じる',
  idle_click_top_right: '右上のボタンから',
  idle_start: 'ミーティング開始',
  idle_boredom_detected: '退屈ポイント検知済み',
  idle_end_to_review: '終了で振り返り',
  idle_tip_label: '生産的な会議のコツ',
  meeting_tip_source: '出典',
  armed_eyebrow: '退屈ポイント検知',
  armed_title: 'ハエ叩き、開始しますか？',
  armed_body_template:
    '会議が 60 秒静まりました。クリックすると {seconds} 秒のハエ叩きが始まります。',
  armed_action: 'ハエ叩きを始める',
  pip_tracking: '観測中',
  pip_idle: '待機',
  pip_volume: '音量',
  pip_toast: '退屈してる？',
  pip_toast_sub: 'クリックで叩きにいく',
  pip_not_supported:
    'このブラウザは PiP 非対応です。会議画面と並べてご利用ください。',
  notification_title: '退屈ポイント検知',
  notification_body: '会議が 60 秒静まりました。クリックで戻ってハエを叩く。',
  audio_error_close: '閉じる',
  language_picker_label: '言語',
};

const en: Dictionary = {
  app_title: 'Boring Meeting Flyswatter',
  start_meeting: 'Start meeting',
  end_meeting: 'End meeting',
  close: 'Close',
  idle_click_top_right: 'Use the button top-right',
  idle_start: 'Start meeting',
  idle_boredom_detected: 'Boredom detected',
  idle_end_to_review: 'End to see the recap',
  idle_tip_label: 'Productive-meeting tip',
  meeting_tip_source: 'Source',
  armed_eyebrow: 'Boredom detected',
  armed_title: 'Start swatting?',
  armed_body_template:
    'The meeting has been silent for 60s. Click to start a {seconds}-second swatting round.',
  armed_action: 'Start swatting',
  pip_tracking: 'Live',
  pip_idle: 'Idle',
  pip_volume: 'Volume',
  pip_toast: 'Bored?',
  pip_toast_sub: 'Click to swat',
  pip_not_supported:
    'This browser does not support Picture-in-Picture. Place this window next to your meeting.',
  notification_title: 'Boredom detected',
  notification_body: 'Silent for 60s. Click to come back and swat flies.',
  audio_error_close: 'Close',
  language_picker_label: 'Language',
};

const es: Dictionary = {
  app_title: 'Boring Meeting Flyswatter',
  start_meeting: 'Iniciar reunión',
  end_meeting: 'Finalizar reunión',
  close: 'Cerrar',
  idle_click_top_right: 'Usa el botón de arriba a la derecha',
  idle_start: 'Iniciar reunión',
  idle_boredom_detected: 'Aburrimiento detectado',
  idle_end_to_review: 'Finaliza para ver el resumen',
  idle_tip_label: 'Consejo para reuniones productivas',
  meeting_tip_source: 'Fuente',
  armed_eyebrow: 'Aburrimiento detectado',
  armed_title: '¿Empezar a aplastar moscas?',
  armed_body_template:
    'La reunión lleva 60 s en silencio. Haz clic para iniciar una ronda de {seconds} segundos.',
  armed_action: 'Empezar',
  pip_tracking: 'En vivo',
  pip_idle: 'En espera',
  pip_volume: 'Volumen',
  pip_toast: '¿Aburrido?',
  pip_toast_sub: 'Haz clic para aplastar',
  pip_not_supported:
    'Este navegador no admite Picture-in-Picture. Coloca esta ventana junto a tu reunión.',
  notification_title: 'Aburrimiento detectado',
  notification_body:
    '60 s de silencio. Haz clic para volver y aplastar moscas.',
  audio_error_close: 'Cerrar',
  language_picker_label: 'Idioma',
};

const zh: Dictionary = {
  app_title: 'Boring Meeting Flyswatter',
  start_meeting: '开始会议',
  end_meeting: '结束会议',
  close: '关闭',
  idle_click_top_right: '点击右上角按钮',
  idle_start: '开始会议',
  idle_boredom_detected: '已检测到无聊',
  idle_end_to_review: '结束后查看回顾',
  idle_tip_label: '高效会议小贴士',
  meeting_tip_source: '出处',
  armed_eyebrow: '已检测到无聊',
  armed_title: '开始拍打苍蝇？',
  armed_body_template: '会议已经沉默 60 秒。点击开始 {seconds} 秒的拍打回合。',
  armed_action: '开始拍打',
  pip_tracking: '监测中',
  pip_idle: '待机',
  pip_volume: '音量',
  pip_toast: '感到无聊？',
  pip_toast_sub: '点击去拍打',
  pip_not_supported: '此浏览器不支持画中画。请将此窗口与会议窗口并排放置。',
  notification_title: '已检测到无聊',
  notification_body: '沉默 60 秒。点击返回去拍打苍蝇。',
  audio_error_close: '关闭',
  language_picker_label: '语言',
};

const dictionaries: Record<Language, Dictionary> = { ja, en, es, zh };

export type TranslationKey = keyof Dictionary;

export const translate = (
  language: Language,
  key: TranslationKey,
  params?: Record<string, string | number>
): string => {
  const dict = dictionaries[language] ?? dictionaries.ja;
  const template = dict[key];
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, paramKey) => {
    const value = params[paramKey];
    return value === undefined ? match : String(value);
  });
};

const isLanguage = (value: string): value is Language =>
  (supportedLanguages as readonly string[]).includes(value);

export const detectInitialLanguage = (
  navigatorLanguage: string | undefined,
  persistedLanguage: string | null
): Language => {
  if (persistedLanguage && isLanguage(persistedLanguage)) {
    return persistedLanguage;
  }
  if (!navigatorLanguage) {
    return 'ja';
  }
  const lower = navigatorLanguage.toLowerCase();
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return 'ja';
};

export const cycleLanguage = (current: Language): Language => {
  const index = supportedLanguages.indexOf(current);
  const next = supportedLanguages[(index + 1) % supportedLanguages.length];
  return next ?? 'ja';
};
