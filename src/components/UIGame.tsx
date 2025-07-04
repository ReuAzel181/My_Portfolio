'use client';

import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UIGameProps {
  isVisible: boolean;
  onClose: () => void;
}

const FONT_OPTIONS = [
  { 
    name: 'Bebas Neue',
    family: 'var(--font-bebas)',
    displayText: 'BOLD & CONDENSED',
    options: ['Bebas Neue', 'Oswald', 'Impact', 'Arial Black'],
    category: 'Display Sans-serif'
  },
  { 
    name: 'DM Serif Display',
    family: 'var(--font-dm-serif)',
    displayText: 'Elegant & Refined',
    options: ['DM Serif Display', 'Playfair Display', 'Didot', 'Times New Roman'],
    category: 'Modern Serif'
  },
  { 
    name: 'Space Grotesk',
    family: 'var(--font-space-grotesk)',
    displayText: 'Modern & Technical',
    options: ['Space Grotesk', 'Roboto', 'Inter', 'Arial'],
    category: 'Modern Sans-serif'
  },
  { 
    name: 'Playfair Display',
    family: 'var(--font-playfair)',
    displayText: 'Classic & Sophisticated',
    options: ['Playfair Display', 'DM Serif Display', 'Georgia', 'Times New Roman'],
    category: 'Traditional Serif'
  },
  { 
    name: 'Comfortaa',
    family: 'var(--font-comfortaa)',
    displayText: 'Friendly & Rounded',
    options: ['Comfortaa', 'Quicksand', 'Varela Round', 'Comic Sans'],
    category: 'Rounded Sans-serif'
  },
  { 
    name: 'Quicksand',
    family: 'var(--font-quicksand)',
    displayText: 'Smooth & Modern',
    options: ['Quicksand', 'Comfortaa', 'Varela Round', 'Nunito'],
    category: 'Rounded Sans-serif'
  },
  { 
    name: 'Oswald',
    family: 'var(--font-oswald)',
    displayText: 'STRONG & NARROW',
    options: ['Oswald', 'Bebas Neue', 'Impact', 'Arial Narrow'],
    category: 'Condensed Sans-serif'
  }
];

const FONT_PAIRS = [
  {
    id: 1,
    heading: { font: 'var(--font-dm-serif)', name: 'DM Serif Display' },
    body: { font: 'var(--font-quicksand)', name: 'Quicksand' },
    correctPair: true,
    explanation: 'A classic pairing of an elegant serif with a modern sans-serif',
  },
  {
    id: 2,
    heading: { font: 'var(--font-space-grotesk)', name: 'Space Grotesk' },
    body: { font: 'var(--font-dm-serif)', name: 'DM Serif Display' },
    correctPair: false,
    explanation: 'Avoid pairing two fonts with similar weights and characteristics',
  },
  {
    id: 3,
    heading: { font: 'var(--font-bebas)', name: 'Bebas Neue' },
    body: { font: 'var(--font-space-grotesk)', name: 'Space Grotesk' },
    correctPair: true,
    explanation: 'A strong display font paired with a modern geometric sans-serif',
  },
  {
    id: 4,
    heading: { font: 'var(--font-playfair)', name: 'Playfair Display' },
    body: { font: 'var(--font-comfortaa)', name: 'Comfortaa' },
    correctPair: false,
    explanation: 'The rounded style clashes with the traditional serif',
  },
  {
    id: 5,
    heading: { font: 'var(--font-space-grotesk)', name: 'Space Grotesk' },
    body: { font: 'var(--font-quicksand)', name: 'Quicksand' },
    correctPair: true,
    explanation: 'Both fonts share modern characteristics while maintaining contrast',
  },
  {
    id: 6,
    heading: { font: 'var(--font-oswald)', name: 'Oswald' },
    body: { font: 'var(--font-quicksand)', name: 'Quicksand' },
    correctPair: true,
    explanation: 'Strong condensed heading with friendly body text creates nice contrast',
  },
  {
    id: 7,
    heading: { font: 'var(--font-comfortaa)', name: 'Comfortaa' },
    body: { font: 'var(--font-bebas)', name: 'Bebas Neue' },
    correctPair: false,
    explanation: 'Avoid using display fonts for body text, it reduces readability',
  }
];

const TYPOGRAPHY_PRINCIPLES = [
  {
    id: 1,
    principle: 'Hierarchy',
    question: 'Which text arrangement shows the clearest visual hierarchy?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="space-y-2 text-left">
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-space-grotesk)' }}>Main Heading</h1>
            <h2 style={{ fontSize: '18px', fontWeight: 'semibold', fontFamily: 'var(--font-space-grotesk)' }}>Subheading</h2>
            <p style={{ fontSize: '14px', fontFamily: 'var(--font-quicksand)' }}>Body text content goes here with proper spacing.</p>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="space-y-2 text-left">
            <p style={{ fontSize: '16px', fontFamily: 'var(--font-quicksand)' }}>Main Heading</p>
            <p style={{ fontSize: '16px', fontFamily: 'var(--font-quicksand)' }}>Subheading</p>
            <p style={{ fontSize: '16px', fontFamily: 'var(--font-quicksand)' }}>Body text content goes here.</p>
          </div>
        )
      }
    ]
  },
  {
    id: 2,
    principle: 'Line Height',
    question: 'Which paragraph has better readability with proper line height?',
    options: [
      {
        id: 'a',
        isCorrect: false,
        preview: (
          <p style={{ fontSize: '14px', lineHeight: '1.2', fontFamily: 'var(--font-quicksand)' }} className="text-left">
            This paragraph has tight line height which makes it harder to read when there are multiple lines of text content in a block.
          </p>
        )
      },
      {
        id: 'b',
        isCorrect: true,
        preview: (
          <p style={{ fontSize: '14px', lineHeight: '1.6', fontFamily: 'var(--font-quicksand)' }} className="text-left">
            This paragraph has comfortable line height which makes it easier to read when there are multiple lines of text content in a block.
          </p>
        )
      }
    ]
  },
  {
    id: 3,
    principle: 'Contrast',
    question: 'Which heading style has better contrast with the body text?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="space-y-2 text-left">
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-dm-serif)' }}>Display Heading</h1>
            <p style={{ fontSize: '14px', fontFamily: 'var(--font-quicksand)' }}>Body text with good contrast using different fonts.</p>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="space-y-2 text-left">
            <h1 style={{ fontSize: '18px', fontFamily: 'var(--font-quicksand)' }}>Display Heading</h1>
            <p style={{ fontSize: '14px', fontFamily: 'var(--font-quicksand)' }}>Body text with poor contrast using same font.</p>
          </div>
        )
      }
    ]
  },
  {
    id: 4,
    principle: 'Text Alignment',
    question: 'Which text alignment is more appropriate for longer content?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="space-y-2 text-left">
            <p style={{ fontSize: '14px', lineHeight: '1.6', fontFamily: 'var(--font-quicksand)' }}>
              Left-aligned text is easier to read because it provides a consistent starting point for each line. This helps readers track from line to line more efficiently.
            </p>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="space-y-2 text-center">
            <p style={{ fontSize: '14px', lineHeight: '1.6', fontFamily: 'var(--font-quicksand)' }}>
              Center-aligned text can be harder to read in longer paragraphs because the eye has to search for the start of each new line, which can cause fatigue.
            </p>
          </div>
        )
      }
    ]
  },
  {
    id: 5,
    principle: 'Font Scale',
    question: 'Which heading scale shows better visual hierarchy?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="space-y-4 text-left">
            <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-dm-serif)' }}>Main Heading</h1>
            <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-dm-serif)' }}>Subheading</h2>
            <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-dm-serif)' }}>Section Title</h3>
            <p style={{ fontSize: '16px', fontFamily: 'var(--font-quicksand)' }}>Body text</p>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="space-y-4 text-left">
            <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-dm-serif)' }}>Main Heading</h1>
            <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-dm-serif)' }}>Subheading</h2>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-dm-serif)' }}>Section Title</h3>
            <p style={{ fontSize: '16px', fontFamily: 'var(--font-quicksand)' }}>Body text</p>
          </div>
        )
      }
    ]
  }
];

const UI_TYPOGRAPHY_EXAMPLES = [
  {
    id: 1,
    category: 'Button Design',
    question: 'Which button design follows better typography practices?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="space-y-4">
            <button className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              <span className="text-base font-medium tracking-wide">Get Started</span>
            </button>
            <p className="text-sm text-left text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
              ✓ Clear font weight<br/>
              ✓ Proper letter spacing<br/>
              ✓ Comfortable padding
            </p>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="space-y-4">
            <button className="w-full px-2 py-2 bg-blue-500 text-white rounded-lg" style={{ fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.05em' }}>
              <span className="text-base font-light uppercase">get started</span>
            </button>
            <p className="text-sm text-left text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
              ✗ Thin font weight<br/>
              ✗ Tight letter spacing<br/>
              ✗ Insufficient padding
            </p>
          </div>
        )
      }
    ],
    explanation: 'Good button typography ensures readability and clear call-to-action'
  },
  {
    id: 2,
    category: 'Form Design',
    question: 'Which form layout has better typography hierarchy?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Email Address</label>
              <input 
                type="text" 
                placeholder="you@example.com"
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                style={{ fontFamily: 'var(--font-quicksand)' }}
              />
              <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-quicksand)' }}>We'll never share your email.</p>
            </div>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="block text-xs uppercase" style={{ fontFamily: 'var(--font-quicksand)' }}>EMAIL ADDRESS:</label>
              <input 
                type="text" 
                placeholder="YOU@EXAMPLE.COM"
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 uppercase"
                style={{ fontFamily: 'var(--font-quicksand)' }}
              />
              <p className="text-xs text-gray-500 uppercase" style={{ fontFamily: 'var(--font-quicksand)' }}>WE'LL NEVER SHARE YOUR EMAIL.</p>
            </div>
          </div>
        )
      }
    ],
    explanation: 'Clear hierarchy and appropriate text styles improve form usability'
  },
  {
    id: 3,
    category: 'Card Design',
    question: 'Which card layout demonstrates better content hierarchy?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl text-left">
            <span className="text-sm text-blue-500 block mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Featured Article</span>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-dm-serif)' }}>Typography in UI Design</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>Learn how typography enhances user experience...</p>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl text-left">
            <h3 className="text-base mb-2" style={{ fontFamily: 'var(--font-quicksand)' }}>Typography in UI Design</h3>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-2" style={{ fontFamily: 'var(--font-quicksand)' }}>Learn how typography enhances user experience...</p>
            <span className="text-base text-blue-500 block" style={{ fontFamily: 'var(--font-quicksand)' }}>Featured Article</span>
          </div>
        )
      }
    ],
    explanation: 'Proper hierarchy guides users through content naturally'
  },
  {
    id: 4,
    category: 'Navigation Design',
    question: 'Which navigation menu has better typography for usability?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="flex gap-6 p-4 bg-white dark:bg-gray-800 rounded-xl">
            <span className="font-medium hover:text-blue-500 transition-colors" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Home</span>
            <span className="font-medium hover:text-blue-500 transition-colors" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Products</span>
            <span className="font-medium hover:text-blue-500 transition-colors" style={{ fontFamily: 'var(--font-space-grotesk)' }}>About</span>
            <span className="font-medium hover:text-blue-500 transition-colors" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Contact</span>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="flex gap-6 p-4 bg-white dark:bg-gray-800 rounded-xl">
            <span className="uppercase text-xs tracking-widest" style={{ fontFamily: 'var(--font-quicksand)' }}>Home</span>
            <span className="uppercase text-xs tracking-widest" style={{ fontFamily: 'var(--font-quicksand)' }}>Products</span>
            <span className="uppercase text-xs tracking-widest" style={{ fontFamily: 'var(--font-quicksand)' }}>About</span>
            <span className="uppercase text-xs tracking-widest" style={{ fontFamily: 'var(--font-quicksand)' }}>Contact</span>
          </div>
        )
      }
    ],
    explanation: 'Navigation should be clear and easily scannable'
  },
  {
    id: 5,
    category: 'Alert Design',
    question: 'Which alert design has better readability?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Unable to Save Changes
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                  Please check your internet connection and try again.
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <svg className="w-5 h-5 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-xs uppercase tracking-wider text-red-800 dark:text-red-300" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              ERROR: UNABLE TO SAVE CHANGES
            </h4>
            <p className="mt-1 text-xs text-red-700 dark:text-red-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
              CHECK CONNECTION AND TRY AGAIN
            </p>
          </div>
        )
      }
    ],
    explanation: 'Left-aligned text with clear hierarchy improves alert readability'
  },
  {
    id: 6,
    category: 'Table Design',
    question: 'Which table typography is more readable?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-200" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Product</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-200" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Price</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>Basic Plan</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>$29/mo</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>Pro Plan</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>$59/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-center">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-900 dark:text-gray-200" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Product</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-900 dark:text-gray-200" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Price</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 text-xs uppercase text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>Basic Plan</td>
                  <td className="px-4 py-3 text-xs uppercase text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>$29/mo</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 text-xs uppercase text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>Pro Plan</td>
                  <td className="px-4 py-3 text-xs uppercase text-gray-700 dark:text-gray-300" style={{ fontFamily: 'var(--font-quicksand)' }}>$59/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      }
    ],
    explanation: 'Left-aligned, properly sized text makes table content easier to scan'
  },
  {
    id: 7,
    category: 'Modal Design',
    question: 'Which modal dialog has better typography hierarchy?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl text-left max-w-sm mx-auto">
            <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-dm-serif)' }}>Delete Account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4" style={{ fontFamily: 'var(--font-quicksand)' }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Delete Account
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Cancel
              </button>
            </div>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl text-center max-w-sm mx-auto">
            <h2 className="text-sm uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Delete Account</h2>
            <p className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-4" style={{ fontFamily: 'var(--font-quicksand)' }}>
              ARE YOU SURE YOU WANT TO DELETE YOUR ACCOUNT? THIS ACTION CANNOT BE UNDONE.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Delete Account
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Cancel
              </button>
            </div>
          </div>
        )
      }
    ],
    explanation: 'Clear hierarchy and mixed case text improves readability in modals'
  },
  {
    id: 8,
    category: 'Tooltip Design',
    question: 'Which tooltip design is more readable?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="inline-block relative">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Hover me
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg w-48">
              <p style={{ fontFamily: 'var(--font-quicksand)' }}>This is a helpful tooltip with important information</p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        )
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="inline-block relative">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg uppercase text-xs tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Hover me
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs uppercase tracking-wider rounded-lg w-48">
              <p style={{ fontFamily: 'var(--font-quicksand)' }}>THIS IS A HELPFUL TOOLTIP WITH IMPORTANT INFORMATION</p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        )
      }
    ],
    explanation: 'Regular case text with proper size makes tooltips more readable'
  }
];

const COLOR_IDENTIFICATION = [
  {
    id: 1,
    color: '#FF0000',
    name: 'Red',
    options: ['Red', 'Orange', 'Pink', 'Maroon'],
    explanation: 'This is a pure red color (#FF0000), one of the primary colors'
  },
  {
    id: 2,
    color: '#4169E1',
    name: 'Royal Blue',
    options: ['Navy Blue', 'Royal Blue', 'Cobalt', 'Azure'],
    explanation: 'Royal Blue (#4169E1) is a vibrant, deep blue commonly used in UI design'
  },
  {
    id: 3,
    color: '#FFD700',
    name: 'Gold',
    options: ['Yellow', 'Gold', 'Amber', 'Khaki'],
    explanation: 'Gold (#FFD700) is a warm, metallic yellow color'
  },
  {
    id: 4,
    color: '#32CD32',
    name: 'Lime Green',
    options: ['Lime Green', 'Forest Green', 'Mint', 'Sage'],
    explanation: 'Lime Green (#32CD32) is a bright, energetic green'
  }
];

const COLOR_PALETTES = [
  {
    id: 1,
    name: 'Monochromatic',
    baseColor: '#2563EB',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="flex gap-2">
            {['#BFDBFE', '#60A5FA', '#2563EB', '#1D4ED8', '#1E40AF'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'Monochromatic palette uses different shades and tints of the same blue hue'
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="flex gap-2">
            {['#2563EB', '#60A5FA', '#EF4444', '#F87171', '#FCA5A5'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'This palette mixes blue with red, which is not monochromatic'
      }
    ]
  },
  {
    id: 2,
    name: 'Complementary',
    baseColor: '#EF4444',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="flex gap-2">
            {['#FCA5A5', '#EF4444', '#B91C1C', '#93C5FD', '#2563EB'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'Red and blue are complementary colors, creating high contrast'
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="flex gap-2">
            {['#FCA5A5', '#EF4444', '#B91C1C', '#F59E0B', '#D97706'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'Red and orange are adjacent colors, not complementary'
      }
    ]
  }
];

const COLOR_HARMONIES = [
  {
    id: 1,
    type: 'Analogous',
    question: 'Which color combination shows analogous harmony?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="flex gap-2">
            {['#3B82F6', '#60A5FA', '#93C5FD', '#7DD3FC', '#38BDF8'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'These blues and blue-greens are adjacent on the color wheel'
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="flex gap-2">
            {['#3B82F6', '#EF4444', '#F59E0B', '#22C55E', '#8B5CF6'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'These colors are spread across the color wheel, not adjacent'
      }
    ]
  },
  {
    id: 2,
    type: 'Triadic',
    question: 'Which combination represents triadic harmony?',
    options: [
      {
        id: 'a',
        isCorrect: true,
        preview: (
          <div className="flex gap-2">
            {['#EF4444', '#22C55E', '#6366F1'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'Red, blue, and green form a triangle on the color wheel'
      },
      {
        id: 'b',
        isCorrect: false,
        preview: (
          <div className="flex gap-2">
            {['#EF4444', '#F59E0B', '#FCD34D'].map((color) => (
              <div key={color} className="w-12 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        ),
        explanation: 'These are analogous colors, not triadic'
      }
    ]
  }
];

const UIGame: React.FC<UIGameProps> = ({ isVisible, onClose }) => {
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [currentUIIndex, setCurrentUIIndex] = useState(0);
  const [colorIdentificationIndex, setColorIdentificationIndex] = useState(0);
  const [colorPaletteIndex, setColorPaletteIndex] = useState(0);
  const [colorHarmonyIndex, setColorHarmonyIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const handleUIGuess = (answer: string) => {
    let correct = false;
    let explanation = '';

    switch (selectedGame) {
      case 'font-pairing':
        const isPairCorrect = answer === 'good';
        correct = FONT_PAIRS[currentUIIndex].correctPair === isPairCorrect;
        explanation = FONT_PAIRS[currentUIIndex].explanation;
        break;
      case 'color-identification':
        correct = answer === COLOR_IDENTIFICATION[colorIdentificationIndex].name;
        explanation = COLOR_IDENTIFICATION[colorIdentificationIndex].explanation;
        break;
      case 'color-palettes':
        const correctPaletteOption = COLOR_PALETTES[colorPaletteIndex].options.find(opt => opt.id === answer);
        correct = correctPaletteOption?.isCorrect || false;
        explanation = correctPaletteOption?.explanation || '';
        break;
      case 'color-harmonies':
        const correctHarmonyOption = COLOR_HARMONIES[colorHarmonyIndex].options.find(opt => opt.id === answer);
        correct = correctHarmonyOption?.isCorrect || false;
        explanation = correctHarmonyOption?.explanation || '';
        break;
      default:
        // Handle other game types
        break;
    }

    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    setFeedbackMessage(explanation);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      switch (selectedGame) {
        case 'font-pairing':
          if (currentUIIndex < FONT_PAIRS.length - 1) {
            setCurrentUIIndex(currentUIIndex + 1);
          }
          break;
        case 'color-identification':
          if (colorIdentificationIndex < COLOR_IDENTIFICATION.length - 1) {
            setColorIdentificationIndex(colorIdentificationIndex + 1);
          }
          break;
        case 'color-palettes':
          if (colorPaletteIndex < COLOR_PALETTES.length - 1) {
            setColorPaletteIndex(colorPaletteIndex + 1);
          }
          break;
        case 'color-harmonies':
          if (colorHarmonyIndex < COLOR_HARMONIES.length - 1) {
            setColorHarmonyIndex(colorHarmonyIndex + 1);
          }
          break;
        default:
          // Handle other game types
          break;
      }
    }, 2000);
  };

  const resetGame = () => {
    setSelectedGame('');
    setCurrentUIIndex(0);
    setColorIdentificationIndex(0);
    setColorPaletteIndex(0);
    setColorHarmonyIndex(0);
    setScore(0);
    setShowFeedback(false);
    setFeedbackMessage('');
    setIsCorrect(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 flex items-center gap-4">
            {selectedGame && (
              <button
                onClick={resetGame}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span style={{ fontFamily: 'var(--font-quicksand)' }}>Back</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {!selectedGame ? (
                <>
                  <div className="text-center mb-8">
                    <h2 
                      className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent" 
                      style={{ fontFamily: 'var(--font-dm-serif)' }}
                    >
                      Typography & Color Games
                    </h2>
                    <p 
                      className="text-lg text-gray-600 dark:text-gray-400" 
                      style={{ fontFamily: 'var(--font-quicksand)' }}
                    >
                      Test your typography and color knowledge with these fun challenges
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGame('identify')}
                      className="group relative aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 text-left overflow-hidden border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          Font Identification
                        </h3>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          Test your ability to identify different fonts and their characteristics
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGame('pair')}
                      className="group relative aspect-video bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 text-left overflow-hidden border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                    >
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          Font Pairing
                        </h3>
                        <p className="text-sm text-purple-600/80 dark:text-purple-400/80" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          Learn to create harmonious font combinations for better design
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGame('principles')}
                      className="group relative aspect-video bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 text-left overflow-hidden border-2 border-transparent hover:border-green-500 dark:hover:border-green-400 transition-colors"
                    >
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          Typography Principles
                        </h3>
                        <p className="text-sm text-green-600/80 dark:text-green-400/80" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          Master the fundamental principles of typography and hierarchy
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGame('ui')}
                      className="group relative aspect-video bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 text-left overflow-hidden border-2 border-transparent hover:border-amber-500 dark:hover:border-amber-400 transition-colors"
                    >
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          UI Typography
                        </h3>
                        <p className="text-sm text-amber-600/80 dark:text-amber-400/80" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          Learn best practices for typography in UI design
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGame('color-identification')}
                      className="group relative aspect-video bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-2xl p-6 text-left overflow-hidden border-2 border-transparent hover:border-pink-500 dark:hover:border-pink-400 transition-colors"
                    >
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400 mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          Color Identification
                        </h3>
                        <p className="text-sm text-pink-600/80 dark:text-pink-400/80" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          Test your ability to identify different colors and their characteristics
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-pink-500/5 to-transparent" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGame('color-palettes')}
                      className="group relative aspect-video bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-900/20 dark:to-fuchsia-800/20 rounded-2xl p-6 text-left overflow-hidden border-2 border-transparent hover:border-fuchsia-500 dark:hover:border-fuchsia-400 transition-colors"
                    >
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-400 mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          Color Palettes
                        </h3>
                        <p className="text-sm text-fuchsia-600/80 dark:text-fuchsia-400/80" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          Learn to create harmonious color combinations for better design
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-500/5 to-transparent" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedGame('color-harmonies')}
                      className="group relative aspect-video bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-900/20 dark:to-lime-800/20 rounded-2xl p-6 text-left overflow-hidden border-2 border-transparent hover:border-lime-500 dark:hover:border-lime-400 transition-colors"
                    >
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          Color Harmonies
                        </h3>
                        <p className="text-sm text-lime-600/80 dark:text-lime-400/80" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          Learn to create harmonious color combinations for better design
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-lime-500/5 to-transparent" />
                    </motion.button>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Click any game to start • Your progress will be saved
                    </p>
                  </div>
                </>
              ) : selectedGame === 'identify' ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-blue-500 dark:text-blue-400 text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Font Identification
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Question {currentUIIndex + 1} of {FONT_OPTIONS.length}
                    </span>
                  </div>

                  <div className="min-h-[400px] flex flex-col">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-2 mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-inner">
                        <div className="mb-4 inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 text-sm" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          {FONT_OPTIONS[currentUIIndex].category}
                        </div>
                        <div 
                          className="text-4xl leading-relaxed max-w-2xl mx-auto"
                          style={{ fontFamily: FONT_OPTIONS[currentUIIndex].family }}
                        >
                          {FONT_OPTIONS[currentUIIndex].displayText}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                      {FONT_OPTIONS[currentUIIndex].options.map((option) => (
                        <motion.button
                          key={option}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUIGuess(option)}
                          className={`p-4 rounded-xl transition-all duration-300 ${
                            showFeedback 
                              ? option === FONT_OPTIONS[currentUIIndex].name
                                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                                : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent opacity-50'
                              : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400'
                          }`}
                          style={{ fontFamily: 'var(--font-quicksand)' }}
                          disabled={showFeedback}
                        >
                          <span className="text-lg font-medium">
                            {option}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    <div className="h-[60px] flex items-center justify-center">
                      {showFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className={`inline-block px-6 py-3 rounded-full text-lg ${
                            score > currentUIIndex 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}
                          style={{ fontFamily: 'var(--font-quicksand)' }}>
                            {score > currentUIIndex ? '🎉 Correct!' : '❌ Incorrect!'} 
                            <span className="font-medium ml-1">
                              This is {FONT_OPTIONS[currentUIIndex].name}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-auto">
                      <div className="h-1 w-20 rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <div 
                          className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                          style={{ width: `${((currentUIIndex + 1) / FONT_OPTIONS.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-blue-500 dark:text-blue-400 font-medium" style={{ fontFamily: 'var(--font-quicksand)' }}>
                        {score} / {FONT_OPTIONS.length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'pair' ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-purple-500 dark:text-purple-400 text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Font Pairing
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Question {currentUIIndex + 1} of {FONT_PAIRS.length}
                    </span>
                  </div>

                  <div className="min-h-[400px] flex flex-col">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-2 mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-inner">
                        <h3 
                          className="text-3xl mb-4"
                          style={{ fontFamily: FONT_PAIRS[currentUIIndex].heading.font }}
                        >
                          Typography Design
                        </h3>
                        <p
                          className="text-lg max-w-2xl mx-auto"
                          style={{ fontFamily: FONT_PAIRS[currentUIIndex].body.font }}
                        >
                          This is an example of how these two fonts work together in a real design context. Pay attention to the contrast and harmony between the heading and body text.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUIGuess('good')}
                        className={`p-4 rounded-xl transition-all duration-300 ${
                          showFeedback 
                            ? FONT_PAIRS[currentUIIndex].correctPair
                              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                              : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent opacity-50'
                            : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400'
                        }`}
                        style={{ fontFamily: 'var(--font-quicksand)' }}
                        disabled={showFeedback}
                      >
                        <span className="text-lg font-medium">Good Pair</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUIGuess('poor')}
                        className={`p-4 rounded-xl transition-all duration-300 ${
                          showFeedback 
                            ? !FONT_PAIRS[currentUIIndex].correctPair
                              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                              : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent opacity-50'
                            : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400'
                        }`}
                        style={{ fontFamily: 'var(--font-quicksand)' }}
                        disabled={showFeedback}
                      >
                        <span className="text-lg font-medium">Poor Pair</span>
                      </motion.button>
                    </div>

                    <div className="h-[60px] flex items-center justify-center">
                      {showFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className={`inline-block px-6 py-3 rounded-full text-lg ${
                            score > currentUIIndex 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}
                          style={{ fontFamily: 'var(--font-quicksand)' }}>
                            {score > currentUIIndex ? '🎉 Correct!' : '❌ Incorrect!'} 
                            <span className="font-medium ml-1">
                              {FONT_PAIRS[currentUIIndex].explanation}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-auto">
                      <div className="h-1 w-20 rounded-full bg-purple-100 dark:bg-purple-900/20">
                        <div 
                          className="h-full rounded-full bg-purple-500 dark:bg-purple-400 transition-all duration-500"
                          style={{ width: `${((currentUIIndex + 1) / FONT_PAIRS.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-purple-500 dark:text-purple-400 font-medium" style={{ fontFamily: 'var(--font-quicksand)' }}>
                        {score} / {FONT_PAIRS.length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'principles' ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-green-500 dark:text-green-400 text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Typography Principles
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Question {currentUIIndex + 1} of {TYPOGRAPHY_PRINCIPLES.length}
                    </span>
                  </div>

                  <div className="min-h-[400px] flex flex-col">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-2 mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-inner">
                        <div className="mb-4 inline-block px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 text-sm" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          {TYPOGRAPHY_PRINCIPLES[currentUIIndex].principle}
                        </div>
                        <div className="text-xl mb-6" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          {TYPOGRAPHY_PRINCIPLES[currentUIIndex].question}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                      {TYPOGRAPHY_PRINCIPLES[currentUIIndex].options.map((option) => (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUIGuess(option.id)}
                          className={`p-4 rounded-xl transition-all duration-300 ${
                            showFeedback 
                              ? option.isCorrect
                                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                                : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent opacity-50'
                              : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400'
                          }`}
                          disabled={showFeedback}
                        >
                          {option.preview}
                        </motion.button>
                      ))}
                    </div>

                    <div className="h-[60px] flex items-center justify-center">
                      {showFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className={`inline-block px-6 py-3 rounded-full text-lg ${
                            score > currentUIIndex 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}
                          style={{ fontFamily: 'var(--font-quicksand)' }}>
                            {score > currentUIIndex ? '🎉 Correct!' : '❌ Incorrect!'} 
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-auto">
                      <div className="h-1 w-20 rounded-full bg-green-100 dark:bg-green-900/20">
                        <div 
                          className="h-full rounded-full bg-green-500 dark:bg-green-400 transition-all duration-500"
                          style={{ width: `${((currentUIIndex + 1) / TYPOGRAPHY_PRINCIPLES.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-green-500 dark:text-green-400 font-medium" style={{ fontFamily: 'var(--font-quicksand)' }}>
                        {score} / {TYPOGRAPHY_PRINCIPLES.length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'ui' ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-amber-500 dark:text-amber-400 text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      UI Typography
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Question {currentUIIndex + 1} of {UI_TYPOGRAPHY_EXAMPLES.length}
                    </span>
                  </div>

                  <div className="min-h-[400px] flex flex-col">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-2 mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-inner">
                        <div className="mb-4 inline-block px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-600 dark:text-amber-400 text-sm" style={{ fontFamily: 'var(--font-quicksand)' }}>
                          {UI_TYPOGRAPHY_EXAMPLES[currentUIIndex].category}
                        </div>
                        <div className="text-xl mb-6" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          {UI_TYPOGRAPHY_EXAMPLES[currentUIIndex].question}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                      {UI_TYPOGRAPHY_EXAMPLES[currentUIIndex].options.map((option) => (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUIGuess(option.id)}
                          className={`p-4 rounded-xl transition-all duration-300 ${
                            showFeedback 
                              ? option.isCorrect
                                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                                : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent opacity-50'
                              : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-400'
                          }`}
                          disabled={showFeedback}
                        >
                          {option.preview}
                        </motion.button>
                      ))}
                    </div>

                    <div className="h-[60px] flex items-center justify-center">
                      {showFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className={`inline-block px-6 py-3 rounded-full text-lg ${
                            score > currentUIIndex 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}
                          style={{ fontFamily: 'var(--font-quicksand)' }}>
                            {score > currentUIIndex ? '🎉 Correct!' : '❌ Incorrect!'} 
                            <span className="font-medium ml-1">
                              {UI_TYPOGRAPHY_EXAMPLES[currentUIIndex].explanation}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-auto">
                      <div className="h-1 w-20 rounded-full bg-amber-100 dark:bg-amber-900/20">
                        <div 
                          className="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-all duration-500"
                          style={{ width: `${((currentUIIndex + 1) / UI_TYPOGRAPHY_EXAMPLES.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-amber-500 dark:text-amber-400 font-medium" style={{ fontFamily: 'var(--font-quicksand)' }}>
                        {score} / {UI_TYPOGRAPHY_EXAMPLES.length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'color-identification' ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-pink-500 dark:text-pink-400 text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Color Identification
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Question {colorIdentificationIndex + 1} of {COLOR_IDENTIFICATION.length}
                    </span>
                  </div>

                  <div className="min-h-[400px] flex flex-col">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-2 mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-inner">
                        <div className="w-24 h-24 rounded-lg mb-4" style={{ backgroundColor: COLOR_IDENTIFICATION[colorIdentificationIndex].color }}></div>
                        <div className="grid grid-cols-2 gap-2">
                          {COLOR_IDENTIFICATION[colorIdentificationIndex].options.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleUIGuess(option)}
                              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {showFeedback && (
                          <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
                            <p className="text-sm">{isCorrect ? 'Correct! ' : 'Incorrect. '}{feedbackMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'color-palettes' ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-fuchsia-500 dark:text-fuchsia-400 text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Color Palettes
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Question {colorPaletteIndex + 1} of {COLOR_PALETTES.length}
                    </span>
                  </div>

                  <div className="min-h-[400px] flex flex-col">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-2 mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-inner">
                        <h3 className="text-lg font-medium mb-4">Select the correct {COLOR_PALETTES[colorPaletteIndex].name} palette:</h3>
                        <div className="space-y-4">
                          {COLOR_PALETTES[colorPaletteIndex].options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleUIGuess(option.id)}
                              className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              {option.preview}
                            </button>
                          ))}
                        </div>
                        {showFeedback && (
                          <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
                            <p className="text-sm">{isCorrect ? 'Correct! ' : 'Incorrect. '}{feedbackMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedGame === 'color-harmonies' ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-lime-500 dark:text-lime-400 text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Color Harmonies
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-quicksand)' }}>
                      Question {colorHarmonyIndex + 1} of {COLOR_HARMONIES.length}
                    </span>
                  </div>

                  <div className="min-h-[400px] flex flex-col">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-2 mb-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-inner">
                        <h3 className="text-lg font-medium mb-4">{COLOR_HARMONIES[colorHarmonyIndex].type} Colors</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{COLOR_HARMONIES[colorHarmonyIndex].question}</p>
                        <div className="space-y-4">
                          {COLOR_HARMONIES[colorHarmonyIndex].options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleUIGuess(option.id)}
                              className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              {option.preview}
                            </button>
                          ))}
                        </div>
                        {showFeedback && (
                          <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
                            <p className="text-sm">{isCorrect ? 'Correct! ' : 'Incorrect. '}{feedbackMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UIGame; 