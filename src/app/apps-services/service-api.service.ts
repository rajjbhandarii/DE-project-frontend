import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ApiProvider } from './processes.service';

// Interfaces for service request data
export interface ActiveRequest {
  requestServiceId: string;
  userName: string;
  userLocation: string;
  category: string;
  createdAt: number;
}

export interface Service {
  serviceId: any;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  location: string;
}

export interface ServiceRequestPayload {
  _id: string;
  userName: string;
  userLocation: string;
  category: string;
  requestServiceId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceApiService {

  constructor(private http: HttpClient) { }

  // ─── User-facing: Browse & Request Services ───

  /** Fetch all service providers and their services */
  fetchServiceProviders(): Observable<ApiProvider[]> {
    return this.http.get<ApiProvider[]>(environment.fetchServicesProvider);
  }

  /** Send a service request to a provider */
  requestService(payload: ServiceRequestPayload): Observable<any> {
    return this.http.post(environment.requestServices, payload);
  }

  // ─── Service Provider: Dashboard ───

  /** Fetch all service requests for a provider */
  fetchServiceRequests(serviceProviderEmail: string): Observable<ActiveRequest[]> {
    return this.http.post<ActiveRequest[]>(environment.fetchServicesRequests, { serviceProviderEmail });
  }

  /** Delete a service request from the SP dashboard */
  deleteServiceRequest(serviceProviderEmail: string, requestServiceId: string): Observable<any> {
    return this.http.delete(environment.deleteServiceRequest, {
      body: { serviceProviderEmail, requestServiceId }
    });
  }

  // ─── Service Provider: Service Management ───

  /** Add a new service for a provider */
  addService(newService: Partial<Service>, serviceProviderEmail: string): Observable<any> {
    return this.http.post(environment.addNewServices, { newService, serviceProviderEmail });
  }

  /** Get all services for a provider */
  getServicesByProvider(serviceProviderEmail: string): Observable<Service[]> {
    return this.http.get<Service[]>(environment.getServicesCategory, {
      params: { serviceProviderEmail }
    });
  }

  /** Delete a service by ID */
  deleteService(serviceId: string, serviceProviderEmail: string): Observable<any> {
    return this.http.delete(environment.deleteService, {
      body: { serviceId, serviceProviderEmail }
    });
  }
}
