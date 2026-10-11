import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import auth from './locales/en/auth.json';
import common from './locales/en/common.json';
import cv from './locales/en/cv.json';
import job from './locales/en/job.json';
import pipeline from './locales/en/pipeline.json';
import profile from './locales/en/profile.json';

export const SUPPORTED_LANGUAGES = ['en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const defaultNS = 'common';

export const resources = {
  en: { auth, common, cv, job, pipeline, profile },
} as const;

void i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS,
    ns: ['auth', defaultNS, 'cv', 'job', 'pipeline', 'profile'],
    resources,
    interpolation: { escapeValue: false },
    returnNull: false,
});

export { i18n };
