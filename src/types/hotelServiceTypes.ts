export interface GuestlistingSearchResults {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  distance: string;
  location: string;
  price: number;
  verified: boolean;
  featured?: boolean;
}

export interface GuestlistingFullResults extends GuestlistingSearchResults {
  images: string[];
  fullLocation: string;
  overview: string;
  facilities: string[];
  cancellationRules: {
    freeCancellationBefore: string;
    refundPercentage: string;
    nonRefundableAfter: string;
  };
  nearbyLandmarks: {
    name: string;
    distance: string;
  }[];
  mapCoordinates: {
    latitude: number;
    longitude: number;
  };
  importantRules: {
    checkIn: string;
    checkOut: string;
    cleaningRule: string;
  };
  rawHostUuid: string;
  host: {
    name: string;
    photo: string;
    joinedYears: number;
    responseRate: string;
    verified: boolean;
    rating: number;
    reviews: number;
  };
  ratingBreakdown: RatingBreakdown;
  userReviews: Review[];
}

export interface LocationSummary {
  id: string;
  state: string;
  district: string;
  lowerDivisionName: string;
}

export interface Review {
  id: string;
  userName: string;
  userPhoto: string;
  rating: number;
  date: string;
  comment: string;
}

export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface SearchFilters {
  state?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  ratings?: number[];
  numAdults?: number;
  numChildren?: number;
  totalGuests?: number;
  numRooms?: number;
  amenities?: string[];
  roomTypes?: string[];
  startDate?: string;
  endDate?: string;
}

