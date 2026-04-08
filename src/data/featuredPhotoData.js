const PEXELS_LICENSE_URL = "https://www.pexels.com/license/";

function pexelsImage(photoId) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
}

function pexelsPage(photoId) {
  return `https://www.pexels.com/photo/${photoId}/`;
}

function photo({
  photoId,
  title,
  note,
  alt,
  credit,
  objectPosition = "center center",
}) {
  return {
    title,
    note,
    alt,
    credit,
    licenseLabel: "Pexels License",
    licenseUrl: PEXELS_LICENSE_URL,
    image: pexelsImage(photoId),
    sourceUrl: pexelsPage(photoId),
    objectPosition,
  };
}

export const featuredPhotoByMonth = [
  photo({
    photoId: "6530841",
    title: "Winter Cabin",
    note: "A quiet snow-covered retreat gives January a calmer, warmer opening.",
    alt: "Wooden cabin surrounded by snow-covered trees in winter",
    credit: "Mikhail Nilov",
    objectPosition: "center 52%",
  }),
  photo({
    photoId: "2086620",
    title: "Snow-Capped Ridge",
    note: "Clean alpine light and high-contrast snow for a polished February cover.",
    alt: "Snow-covered mountain peaks beneath a pale winter sky",
    credit: "eberhard grossgasteiger",
    objectPosition: "center 52%",
  }),
  photo({
    photoId: "18305011",
    title: "Spring Valley",
    note: "Wide green hills and open mountain air make March feel fresher and more expansive.",
    alt: "Scenic alpine valley with green hills and mountain views under a bright sky",
    credit: "Adrien Olichon",
    objectPosition: "center 58%",
  }),
  photo({
    photoId: "1144032",
    title: "Cherry Blossom",
    note: "Soft blossom color and bright natural light for a refined April cover.",
    alt: "Cherry blossom branch in soft daylight against a bright background",
    credit: "Valeria Boltneva",
    objectPosition: "center 38%",
  }),
  photo({
    photoId: "17949692",
    title: "Turquoise Valley",
    note: "Bright water and lush mountains give May a more fascinating panoramic feel.",
    alt: "Mountain valley with a turquoise lake surrounded by forests and peaks",
    credit: "Mario Vogt",
    objectPosition: "center 58%",
  }),
  photo({
    photoId: "18452721",
    title: "Waterfall Peaks",
    note: "A dramatic waterfall and high mountain backdrop make June feel bigger and brighter.",
    alt: "Waterfall cascading through alpine rocks beneath tall mountain peaks",
    credit: "Bruno Kraler",
    objectPosition: "center 56%",
  }),
  photo({
    photoId: "15741324",
    title: "Golden Shore",
    note: "Warm sunrise color and clean composition for the height of summer.",
    alt: "Beach shoreline at sunrise with glowing sky and gentle surf",
    credit: "RITESH SINGH",
    objectPosition: "center 48%",
  }),
  photo({
    photoId: "17630207",
    title: "Sunflower Horizon",
    note: "Wide sunflower color gives August a stronger late-summer cover image.",
    alt: "Wide sunflower field blooming under a soft cloudy sky",
    credit: "Антон Злобин",
    objectPosition: "center 48%",
  }),
  photo({
    photoId: "1526713",
    title: "Mountain Lake",
    note: "Still water and strong natural contrast for a polished September reset.",
    alt: "Calm lake with mountains and reflected clouds",
    credit: "Francesco Ungaro",
    objectPosition: "center 58%",
  }),
  photo({
    photoId: "19302869",
    title: "Canyon River",
    note: "Sweeping canyon shapes and earthy color give October a stronger natural drama.",
    alt: "River winding through a wide canyon with layered rocky cliffs",
    credit: "Ambient Vista",
    objectPosition: "center 52%",
  }),
  photo({
    photoId: "31452933",
    title: "Autumn Lake",
    note: "A reflective lake and mountain backdrop give November a broader, richer scenic feel.",
    alt: "Autumn lake surrounded by colorful trees with mountains in the background",
    credit: "Aleksandr Fedorov",
    objectPosition: "center 56%",
  }),
  photo({
    photoId: "3940341",
    title: "Winter Peaks",
    note: "Sharp snow light and a cinematic mountain frame to close the year.",
    alt: "Snow-covered mountain range under a bright sky",
    credit: "Nextvoyage",
    objectPosition: "center 46%",
  }),
];
