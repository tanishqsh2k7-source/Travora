# IMAGES_NEEDED.md — Travora Asset Checklist

> To maintain an authentic, high-end editorial travel brand, **Travora does not use AI-generated images, scraped media, or hot-linked stock photos**.
> The application uses responsive `<Photo>` components with built-in branded fallbacks so the site functions smoothly before images are supplied.
> Please supply original high-resolution photos for each destination according to the specifications below.

---

## Technical Specifications

| Photo Type | Placement | Aspect Ratio & Orientation | Minimum Resolution | Max File Size | Target Subject |
|---|---|---|---|---|---|
| **hero.jpg** | Full-bleed hero banner & slideshow | **3:2 Landscape** | **2400 × 1600 px** | Raw JPG / WebP | Sweeping establishing view, architecture/landscape, golden hour / twilight, **no close-up faces** |
| **card.jpg** | Destination showcase card | **4:5 Portrait** | **1200 × 1500 px** | Raw JPG / WebP | Architectural detail, iconic streetscape, cultural texture, **no close-up faces** |

**Storage Location:** Store source files in `apps/client/public/images/destinations/<slug>/`
- Hero: `apps/client/public/images/destinations/<slug>/hero.jpg`
- Card: `apps/client/public/images/destinations/<slug>/card.jpg`

---

## Destination Photo Requirements

### 1. Lisbon (`lisbon`)
- **Hero (`apps/client/public/images/destinations/lisbon/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* Panoramic view over terracotta rooftops of Alfama or Baixa toward the Tagus River at golden hour, or Miradouro de Santa Luzia pergola overlooking the water.
- **Card (`apps/client/public/images/destinations/lisbon/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Classic yellow Tram 28 climbing a narrow cobblestone street framed by tiled azulejo facades.
- *Credit details required:* Photographer Name, Source (e.g. Unsplash / Personal), Licence.

### 2. Tokyo (`tokyo`)
- **Hero (`apps/client/public/images/destinations/tokyo/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* Twilight cityscape overlooking Tokyo Tower or Shinjuku skyline with Mount Fuji silhouette in distance, or Senso-ji temple grounds illuminated at dusk.
- **Card (`apps/client/public/images/destinations/tokyo/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Traditional red lantern corridor at Asakusa or a quiet lantern-lit Yanaka street corner.
- *Credit details required:* Photographer Name, Source, Licence.

### 3. Paris (`paris`)
- **Hero (`apps/client/public/images/destinations/paris/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* Sweeping view of the River Seine with Pont Alexandre III and Parisian zinc roofs in soft afternoon light.
- **Card (`apps/client/public/images/destinations/paris/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Classic Montmartre stone steps or Haussmannian boulevard corner with wrought-iron balconies.
- *Credit details required:* Photographer Name, Source, Licence.

### 4. Udaipur (`udaipur`)
- **Hero (`apps/client/public/images/destinations/udaipur/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* Majestic City Palace complex bathed in warm sunset glow reflecting across the waters of Lake Pichola.
- **Card (`apps/client/public/images/destinations/udaipur/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Intricate stone jharokha (ornate palace balcony) overlooking the ghats and calm lake water.
- *Credit details required:* Photographer Name, Source, Licence.

### 5. Jodhpur (`jodhpur`)
- **Hero (`apps/client/public/images/destinations/jodhpur/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* Panoramic vista from the high battlements of Mehrangarh Fort overlooking the indigo-blue rooftops of the Old City.
- **Card (`apps/client/public/images/destinations/jodhpur/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Narrow alleyway between vibrant blue-painted Brahmin houses with morning shadow patterns.
- *Credit details required:* Photographer Name, Source, Licence.

### 6. Kyoto (`destination-6` / to be renamed)
- **Hero (`apps/client/public/images/destinations/destination-6/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* Arashiyama bamboo path with morning mist, or Kiyomizu-dera wooden veranda nestled in forested hills.
- **Card (`apps/client/public/images/destinations/destination-6/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Stone path through Fushimi Inari vermillion torii gates or Gion wooden machiya facade.
- *Credit details required:* Photographer Name, Source, Licence.

### 7. Rome (`destination-7` / to be renamed)
- **Hero (`apps/client/public/images/destinations/destination-7/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* View over Roman Forum ruins and umbrella pines toward the Colosseum at twilight.
- **Card (`apps/client/public/images/destinations/destination-7/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Cobblestone alleyway in Trastevere with ivy-draped ochre walls and outdoor cafe chairs.
- *Credit details required:* Photographer Name, Source, Licence.

### 8. Edinburgh (`destination-8` / to be renamed)
- **Hero (`apps/client/public/images/destinations/destination-8/hero.jpg`):**
  - *Spec:* 3:2 Landscape, min 2400 × 1600 px.
  - *Subject:* Edinburgh Castle dominating Castle Rock seen from Princes Street Gardens or Calton Hill at dusk.
- **Card (`apps/client/public/images/destinations/destination-8/card.jpg`):**
  - *Spec:* 4:5 Portrait, min 1200 × 1500 px.
  - *Subject:* Curving cobblestones and colorful storefronts of Victoria Street in the Old Town.
- *Credit details required:* Photographer Name, Source, Licence.

---

## Verification Commands

Once you have placed the files in their respective folders:
1. Generate multi-resolution WebP and AVIF variants (640, 1024, 1600, 2400 px):
   ```bash
   npm run images:optimize
   ```
2. Validate all resolutions, file sizes, and metadata compliance:
   ```bash
   npm run images:check
   ```
