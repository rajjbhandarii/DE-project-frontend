import { Injectable } from '@angular/core';

/**
 * @interface DisplayService
 * A new, combined interface to hold both provider and service details together.
 * This makes it much easier for the HTML template to display all the needed info.
 */
export interface DisplayService {
  providerId: any;
  providerName: string;
  serviceId: any;
  serviceName: string;
  price: number;
  category: string;
  description: string;
  rating: number;
  location: string;
}

/**
 * @interface ApiProvider
 * Represents the structure of a single provider object coming from the API.
 */
export interface ApiProvider {
  _id: string;
  serviceProviderName: string;
  services: {
    serviceId: string;
    serviceName: string;
    price: number;
    category: string;
    description: string;
    rating: number;
    location: string;
  }[]; // Note: services is an array of objects
}
@Injectable({
  providedIn: "root"
})
export class ProcessesService {
  categories: string[] = ['Towing Service', 'Fuel Delivery', 'Battery Assistance'];
  constructor() { }

  convertApiProviderToDisplayService(providers?: ApiProvider[]): DisplayService[] {
    if (!providers) {
      return [];
    }
    return providers.flatMap(provider =>
      (provider.services ?? []).map(service => ({
        providerId: provider._id,
        providerName: provider.serviceProviderName,
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        price: service.price,
        category: service.category,
        description: service.description,
        rating: service.rating,
        location: service.location
      }))
    );
  }

  /**
   *  @function assignServicesByCategory
  *  Transforms and categorizes services from multiple providers into a map grouped by service category.
  *  Prioritizes services based on the user's location.
  *  @param providers An array of ApiProvider or DisplayService objects.
  *  @param userLocation The user's current location to prioritize services.
  *  @returns A Map where keys are service categories and values are arrays of DisplayService objects.
  */
  assignServicesByCategory(providers: ApiProvider[] | DisplayService[], userLocation: string): Map<string, DisplayService[]> {

    const servicesByCategory = new Map<string, DisplayService[]>();
    try {
      if (!providers || providers.length === 0) {
        console.warn('No providers to categorize');
        return servicesByCategory;
      }

      // Check if providers array contains DisplayService objects
      const isDisplayServiceArray = 'providerName' in providers[0];

      let displayServices: DisplayService[];

      if (isDisplayServiceArray) {
        displayServices = providers as DisplayService[];
      } else {
        // Transform ApiProvider to DisplayService
        const apiProviders = providers as ApiProvider[];
        displayServices = this.convertApiProviderToDisplayService(apiProviders);
      }

      // this.servicesByCategory.clear();

      // Collect all unique categories from the services
      const allCategories = new Set<string>(displayServices.map(service => service.category));

      // Add any new categories to the categories array
      allCategories.forEach(category => {
        if (!this.categories.includes(category)) {
          this.categories.push(category);
        }
      });

      // Categorize services
      for (const category of this.categories) {
        const servicesInCategory = displayServices.filter(service => service.category === category);
        // Prioritize services based on user location
        servicesInCategory.sort((a, b) => {
          const aLocationPriority = (a.location && userLocation && a.location.toLowerCase() === userLocation.toLowerCase()) ? 0 : 1;
          const bLocationPriority = (b.location && userLocation && b.location.toLowerCase() === userLocation.toLowerCase()) ? 0 : 1;
          return aLocationPriority - bLocationPriority;
        });

        servicesByCategory.set(category, servicesInCategory);
      }
    } catch (error) {
      console.error('Error in assignServicesByCategory:', error);
    }

    return servicesByCategory;
  }

}