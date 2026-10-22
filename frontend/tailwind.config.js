/** @type {import('tailwindcss').Config} */
export default {
  darkMode:'class', content:['./index.html','./src/**/*.{ts,tsx}'],
  theme:{extend:{colors:{jade:'#7B9669',mist:'#E6E6E6',forest:'#404E3B',slatejade:'#6C8480',sage:'#BAC8B1'},fontFamily:{sans:['Inter','ui-sans-serif','system-ui','sans-serif']},boxShadow:{soft:'0 24px 70px -38px rgba(30,48,35,.35)'}}},plugins:[]
};
