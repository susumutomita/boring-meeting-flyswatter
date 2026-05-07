import { describe, expect, it } from 'bun:test';
import {
  cycleLanguage,
  detectInitialLanguage,
  supportedLanguages,
  translate,
} from './i18n';

describe('多言語対応の翻訳ユーティリティ', () => {
  it('対応言語は ja / en / es / zh の 4 言語であるべき', () => {
    expect([...supportedLanguages]).toEqual(['ja', 'en', 'es', 'zh']);
  });

  it('translate はキーに対応する言語の文字列を返すべき', () => {
    expect(translate('ja', 'start_meeting')).toBe('ミーティング開始');
    expect(translate('en', 'start_meeting')).toBe('Start meeting');
    expect(translate('es', 'start_meeting')).toBe('Iniciar reunión');
    expect(translate('zh', 'start_meeting')).toBe('开始会议');
  });

  it('translate の {param} はパラメータで置換されるべき', () => {
    const ja = translate('ja', 'armed_body_template', { seconds: 15 });
    const en = translate('en', 'armed_body_template', { seconds: 15 });
    expect(ja).toContain('15');
    expect(en).toContain('15');
  });

  it('detectInitialLanguage は永続化値が最優先であるべき', () => {
    expect(detectInitialLanguage('ja-JP', 'en')).toBe('en');
    expect(detectInitialLanguage('en-US', 'zh')).toBe('zh');
  });

  it('永続化値が無いときは navigator.language を見るべき', () => {
    expect(detectInitialLanguage('ja-JP', null)).toBe('ja');
    expect(detectInitialLanguage('en-US', null)).toBe('en');
    expect(detectInitialLanguage('es-ES', null)).toBe('es');
    expect(detectInitialLanguage('zh-CN', null)).toBe('zh');
    expect(detectInitialLanguage('fr-FR', null)).toBe('ja');
  });

  it('cycleLanguage は ja → en → es → zh → ja の順で循環すべき', () => {
    expect(cycleLanguage('ja')).toBe('en');
    expect(cycleLanguage('en')).toBe('es');
    expect(cycleLanguage('es')).toBe('zh');
    expect(cycleLanguage('zh')).toBe('ja');
  });
});
