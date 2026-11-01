import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import { Program } from '../../types';
import { BackgroundSettings, getBackgroundSettings } from '../../services/backgroundService';
import {
  CertificateData,
  PickedTemplate,
  addA4Page,
  computeFontEmbedCSS,
  createA4Pdf,
  downloadDataUrl,
  ensureFonts,
  fontsForConfig,
  getTemplateSize,
  loadImage,
  nextFrame,
  pickTemplate,
  renderNodeToJpeg,
  safeFileName,
  toDataUrl,
  toPosterWinners,
  waitForImages,
} from '../../services/exportService';
import { getProgramWinners } from '../../utils/resultsUtils';
import { loadCustomFonts } from '../../services/customFontService';
import { CertificateTemplate } from './CertificateTemplate';
import { PosterTemplate } from './PosterTemplate';

// Renders the same template components the editor previews, at native size, into a detached
// offscreen React root, then snapshots them with the shared exportService settings.

export const renderOffscreen = async (element: React.ReactElement, size: { width: number; height: number }) => {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${size.width}px;height:${size.height}px;pointer-events:none;z-index:-1;overflow:hidden;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(element));
  const node = host.firstElementChild as HTMLElement | null;
  const dispose = () => { root.unmount(); host.remove(); };
  if (!node) { dispose(); throw new Error('Template failed to render.'); }
  try {
    await waitForImages(node);
    await nextFrame();
  } catch (e) {
    dispose();
    throw e;
  }
  return { node, dispose };
};

/** Picks the export template and inlines its background as a decoded data URL. */
export const prepareTemplate = async (
  type: 'certificateBgs' | 'posterBgs',
  festId: string,
  backgrounds?: BackgroundSettings | null
): Promise<PickedTemplate> => {
  // Uploaded fonts must be registered before the template renders and fonts are awaited.
  const [bgs] = await Promise.all([backgrounds ?? getBackgroundSettings(festId), loadCustomFonts(festId)]);
  const picked = pickTemplate(bgs, type);
  if (!picked.url) return picked;
  const dataUrl = await toDataUrl(picked.url);
  await loadImage(dataUrl);
  return { ...picked, url: dataUrl };
};

const certificateElement = (data: CertificateData, template: PickedTemplate) => (
  <CertificateTemplate backgroundUrl={template.url} {...data} config={template.config} />
);

/** Renders one certificate to a JPEG data URL. Pass the same fontCSS holder across a batch. */
export const renderCertificateJpeg = async (
  data: CertificateData,
  template: PickedTemplate,
  fontCSS: { value?: string }
): Promise<string> => {
  const size = getTemplateSize('certificateBgs');
  const { node, dispose } = await renderOffscreen(certificateElement(data, template), size);
  try {
    if (fontCSS.value === undefined) fontCSS.value = await computeFontEmbedCSS(node);
    return await renderNodeToJpeg(node, size, fontCSS.value);
  } finally {
    dispose();
  }
};

/**
 * One A4 PDF with a page per certificate. The single-participant and bulk exports both go
 * through this loop. Throws on failure (callers show appDialog).
 */
export const exportCertificatesPdf = async (opts: {
  festId: string;
  items: CertificateData[];
  fileName: string;
  backgrounds?: BackgroundSettings | null;
  onProgress?: (current: number, total: number) => void;
}): Promise<void> => {
  const { festId, items, fileName, onProgress } = opts;
  if (items.length === 0) throw new Error('No participants to export.');
  const template = await prepareTemplate('certificateBgs', festId, opts.backgrounds);
  await ensureFonts(fontsForConfig(template.config, 'certificateBgs'));
  const fontCSS: { value?: string } = {};
  let pdf: jsPDF | null = null;
  for (let i = 0; i < items.length; i++) {
    onProgress?.(i + 1, items.length);
    const jpeg = await renderCertificateJpeg(items[i], template, fontCSS);
    if (!pdf) pdf = createA4Pdf();
    addA4Page(pdf, jpeg, i);
  }
  pdf!.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};

/** Renders and downloads the winner poster for a program. Throws on failure. */
export const exportPosterJpeg = async (opts: {
  festId: string;
  program: Program;
  backgrounds?: BackgroundSettings | null;
}): Promise<void> => {
  const { festId, program } = opts;
  const winners = toPosterWinners(getProgramWinners(program), !!program.isGroup);
  if (winners.length === 0) throw new Error('This program has no ranked winners yet.');
  const template = await prepareTemplate('posterBgs', festId, opts.backgrounds);
  if (!template.url) throw new Error('Upload a poster background in Publishing first.');
  const size = getTemplateSize('posterBgs', template.config);
  await ensureFonts(fontsForConfig(template.config, 'posterBgs'));
  const { node, dispose } = await renderOffscreen(
    <PosterTemplate backgroundUrl={template.url} eventName={program.name} category={program.category} winners={winners} config={template.config} />,
    size
  );
  try {
    const fontCSS = await computeFontEmbedCSS(node);
    const jpeg = await renderNodeToJpeg(node, size, fontCSS);
    downloadDataUrl(jpeg, `${safeFileName(program.name)}_Winner_Poster.jpg`);
  } finally {
    dispose();
  }
};
