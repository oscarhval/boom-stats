export interface PriceRange {
  type: string;
  currency?: string;
  min?: number;
  max?: number;
}

export interface Concert {
  id: string;
  artist: string;
  date: Date;
  venue: string;
  location: string;
  image: string;
  ticketUrl: string;
  priceRanges: PriceRange[];
}
