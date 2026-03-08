#!/bin/bash

echo "=========================================="
echo "  Solaris CET - Script de Reparație"
echo "=========================================="
echo ""

# Verifică dacă suntem în directorul corect
if [ ! -f "app/package.json" ]; then
    echo "❌ Eroare: Nu s-a găsit app/package.json"
    echo "   Rulează acest script din directorul rădăcină al proiectului"
    exit 1
fi

echo "✅ Directorul proiectului validat"
echo ""

# 1. Repară vite.config.ts
echo "🔧 Repară vite.config.ts..."
sed -i "/import { inspectAttr } from 'kimi-plugin-inspect-react'/d" app/vite.config.ts
sed -i 's/plugins: \[inspectAttr(), react()\]/plugins: [react()]/' app/vite.config.ts
echo "   ✅ vite.config.ts reparat"

# 2. Repară package.json
echo "🔧 Elimină kimi-plugin-inspect-react din package.json..."
sed -i '/"kimi-plugin-inspect-react": "\^1.0.3",/d' app/package.json
echo "   ✅ package.json reparat"

# 3. Repară HeroSection.tsx
echo "🔧 Repară HeroSection.tsx..."
sed -i 's/useRef<HTMLImageElement>/useRef<HTMLDivElement>/' app/src/sections/HeroSection.tsx
sed -i 's/ref={coinRef as React.RefObject<HTMLDivElement>}/ref={coinRef}/' app/src/sections/HeroSection.tsx
echo "   ✅ HeroSection.tsx reparat"

# 4. Elimină gsap.registerPlugin din toate secțiunile
echo "🔧 Elimină gsap.registerPlugin din secțiuni..."
for file in app/src/sections/*.tsx; do
    sed -i '/gsap.registerPlugin(ScrollTrigger);/d' "$file"
    filename=$(basename "$file")
    echo "   ✅ $filename"
done

echo ""
echo "=========================================="
echo "  ✅ Toate reparațiile au fost aplicate!"
echo "=========================================="
echo ""
echo "Pași următori:"
echo "  1. cd app"
echo "  2. rm -rf node_modules package-lock.json"
echo "  3. npm install"
echo "  4. npm run build"
echo "  5. npm run dev"
echo ""
