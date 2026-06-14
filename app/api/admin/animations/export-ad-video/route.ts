import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { animation, format, ctaText } = body;

    // Validare parametri
    if (!animation || typeof animation !== 'string') {
      return NextResponse.json(
        { error: 'Parametrul "animation" este obligatoriu și trebuie să fie un string.' },
        { status: 400 }
      );
    }

    const validFormats = ['1080x1920', '1920x1080'];
    const selectedFormat = format && validFormats.includes(format) ? format : '1080x1920';
    const [width, height] = selectedFormat.split('x').map(Number);

    const defaultCta = 'Cere ofertă gratuită → solaris-cet.com';
    const finalCta = ctaText && typeof ctaText === 'string' ? ctaText : defaultCta;

    // Simulare generare video (în producție s-ar folosi Puppeteer + ffmpeg)
    const videoUrl = `/api/admin/animations/export-ad-video/preview?animation=${encodeURIComponent(animation)}&format=${selectedFormat}&cta=${encodeURIComponent(finalCta)}`;

    return NextResponse.json({
      success: true,
      videoUrl,
      metadata: {
        animation,
        format: selectedFormat,
        width,
        height,
        durationSeconds: 15,
        ctaText: finalCta,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating ad video:', error);
    return NextResponse.json(
      { error: 'Eroare internă la generarea videoului.' },
      { status: 500 }
    );
  }
}
