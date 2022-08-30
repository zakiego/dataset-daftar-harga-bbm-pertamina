export interface Fuel {
  fuelType: string;
  prices: Price[];
}

export interface Price {
  prov: string;
  price: string;
}
