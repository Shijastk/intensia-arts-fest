import { describe, it, expect } from 'vitest';
import { applyTextCase, resolveTextRoles, fontsForConfig } from '../exportService';
import { familyFromFileName, isValidCustomFont, validateFontFile } from '../customFontService';

describe('applyTextCase', () => {
  it('UPPERCASE / lowercase / as typed', () => {
    expect(applyTextCase('john doe', 'upper')).toBe('JOHN DOE');
    expect(applyTextCase('JOHN Doe', 'lower')).toBe('john doe');
    expect(applyTextCase('jOhN', 'none')).toBe('jOhN');
  });
  it('Capitalize Each Word, including hyphenated and Malayalam text', () => {
    expect(applyTextCase('MUHAMMED rasheed', 'title')).toBe('Muhammed Rasheed');
    expect(applyTextCase('anna-maria  de silva', 'title')).toBe('Anna-Maria  De Silva');
    expect(applyTextCase('ആയിഷ k', 'title')).toBe('ആയിഷ K'); // scripts without case are left as they are
  });
  it('handles empty values', () => {
    expect(applyTextCase(undefined, 'upper')).toBe('');
  });
});

describe('resolveTextRoles defaults keep the existing look', () => {
  it('poster: title in heading font, name/team in body font, all uppercase', () => {
    const r = resolveTextRoles('posterBgs', { fontFamily: 'Lora', bodyFontFamily: 'Inter' });
    expect(r.title).toEqual({ font: 'Lora', textCase: 'upper' });
    expect(r.name).toEqual({ font: 'Inter', textCase: 'upper' });
    expect(r.team).toEqual({ font: 'Inter', textCase: 'upper' });
  });
  it('certificate: name in heading font uppercase, team as typed', () => {
    const r = resolveTextRoles('certificateBgs', { fontFamily: 'Lora', bodyFontFamily: 'Inter' });
    expect(r.name).toEqual({ font: 'Lora', textCase: 'upper' });
    expect(r.team).toEqual({ font: 'Inter', textCase: 'none' });
  });
  it('each role can be chosen separately', () => {
    const r = resolveTextRoles('posterBgs', { titleFontFamily: 'Great Vibes', nameFontFamily: 'Poppins', teamFontFamily: 'My Font', titleCase: 'title', nameCase: 'lower', teamCase: 'none' });
    expect(r).toEqual({
      title: { font: 'Great Vibes', textCase: 'title' },
      name: { font: 'Poppins', textCase: 'lower' },
      team: { font: 'My Font', textCase: 'none' },
    });
  });
  it('the export waits for every chosen font', () => {
    const families = fontsForConfig({ titleFontFamily: 'Great Vibes', teamFontFamily: 'My Font' }, 'posterBgs').map(f => f.family);
    expect(families).toContain('Great Vibes');
    expect(families).toContain('My Font');
  });
});

describe('custom font upload checks', () => {
  it('accepts font files up to 1 MB only', () => {
    expect(validateFontFile({ name: 'Anek.woff2', size: 200_000 })).toBeNull();
    expect(validateFontFile({ name: 'Anek.TTF', size: 900_000 })).toBeNull();
    expect(validateFontFile({ name: 'logo.png', size: 10 })).toMatch(/font file/);
    expect(validateFontFile({ name: 'Big.ttf', size: 3 * 1024 * 1024 })).toMatch(/maximum is 1 MB/);
  });
  it('derives a safe family name from the file name', () => {
    expect(familyFromFileName('Anek Malayalam-Bold.ttf')).toBe('Anek Malayalam-Bold');
    expect(familyFromFileName('we"ird;name.woff2')).toBe('we ird name');
  });
  it('rejects names or data that could break out of the CSS rule', () => {
    expect(isValidCustomFont({ id: 'a', family: 'Ok Font', dataUrl: 'data:font/woff2;base64,AAAA' })).toBe(true);
    expect(isValidCustomFont({ id: 'a', family: 'Bad"}', dataUrl: 'data:font/woff2;base64,AAAA' })).toBe(false);
    expect(isValidCustomFont({ id: 'a', family: 'Ok', dataUrl: 'data:font/woff2;base64,AA");}body{' })).toBe(false);
  });
});
