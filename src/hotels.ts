// Hotels and their outlets. Names are canonical (stored as-is, not translated).
export const HOTELS: { name: string; outlets: string[] }[] = [
  {
    name: 'The Sands Khao Lak',
    outlets: [
      'Floating Market Restaurant',
      'Talay Restaurant',
      'Manta Ray Bistro',
      'CocoVan',
      'Room Service',
      'Banquet & Function',
    ],
  },
  {
    name: 'The Little Shore Khao Lak',
    outlets: ['The Kati Restaurant', 'Param Para'],
  },
  {
    name: 'The Waters Khao Lak',
    outlets: ['Amici Italian Bistro', 'Bubble Bar'],
  },
  {
    name: 'The Leaf Oceanside',
    outlets: ['Orchidee Restaurant'],
  },
  {
    name: 'The Leaf on The Sands',
    outlets: ['Al Dente Italian Bistro'],
  },
];

export const outletsForHotel = (hotel: string): string[] =>
  HOTELS.find((h) => h.name === hotel)?.outlets ?? [];
