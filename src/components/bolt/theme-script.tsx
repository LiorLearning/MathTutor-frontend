'use client';

import React from 'react';
import { stripIndents } from '@/components/bolt/utils/stripIndent';

import './styles/index.scss';
import '@xterm/xterm/css/xterm.css';
import 'react-toastify/dist/ReactToastify.css';


export function ThemeScript() {
  // The code you want to run before React hydrates:
  const inlineThemeCode = stripIndents`
    setTutorialKitTheme();

    function setTutorialKitTheme() {
      let theme = localStorage.getItem('bolt_theme');

      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      document.querySelector('html')?.setAttribute('data-theme', theme);
    }
  `;

  // The dangerouslySetInnerHTML script
  return (
    <script
      dangerouslySetInnerHTML={{ __html: inlineThemeCode }}
    />
  );
}
