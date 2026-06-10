function img(prompt: string, image_size: string) {
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${encodeURIComponent(image_size)}`;
}

export const productCardImages: Record<string, { src: string; alt: string; width: number; height: number }> = {
  'pv-res': {
    src: img(
      'realistic professional photo of a modern Romanian house roof with black monocrystalline solar panels installed, clean mounting rails, golden hour light, high detail, no people, no other logos, no text',
      'landscape_4_3',
    ),
    alt: 'Panouri fotovoltaice montate pe acoperiș rezidențial',
    width: 1024,
    height: 768,
  },
  'pv-hybrid': {
    src: img(
      'realistic professional photo of a home solar battery storage cabinet and inverter system installed neatly on an interior wall, tidy cabling, modern look, high detail, no people, no other logos, no text',
      'portrait_4_3',
    ),
    alt: 'Sistem hibrid cu baterie și invertor, montaj curat',
    width: 768,
    height: 1024,
  },
  tpo: {
    src: img(
      'realistic professional photo of a white TPO membrane flat roof installation on an industrial building, clean seams and parapet details, high detail, no people, no other logos, no text',
      'landscape_4_3',
    ),
    alt: 'Acoperiș industrial cu membrană TPO, detalii curate',
    width: 1024,
    height: 768,
  },
  roof: {
    src: img(
      'realistic professional close-up photo of a standing seam metal roof (tabla click) on a modern house, clean lines, premium finish, high detail, no people, no other logos, no text',
      'landscape_4_3',
    ),
    alt: 'Acoperiș din tablă click cu îmbinări standing seam',
    width: 1024,
    height: 768,
  },
  service: {
    src: img(
      'realistic professional photo of technician hands checking rooftop solar panel connections and electrical protections, clean tools, high detail, no face, no other logos, no text',
      'landscape_4_3',
    ),
    alt: 'Verificare mentenanță sistem fotovoltaic',
    width: 1024,
    height: 768,
  },
  'pv-industrial': {
    src: img(
      'realistic professional wide photo of large scale solar panels installation on industrial rooftops, clean arrangement, high detail, no people, no other logos, no text',
      'landscape_16_9',
    ),
    alt: 'Sistem fotovoltaic industrial pe acoperișuri mari',
    width: 1536,
    height: 864,
  },
};
