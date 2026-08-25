interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

interface Branding<BrandT> {
  readonly __brand: BrandT;
}
export type Brand<T, BrandT> = T & Branding<BrandT>;
