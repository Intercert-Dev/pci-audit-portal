import { Component, ViewChild, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Define interfaces for better typing
interface Country {
  country: string;
  iso2?: string;
  iso3?: string;
}

interface State {
  name: string;
  state_code?: string;
}

interface CountryCode {
  name: string;
  code: string;
  flag: string;
  iso2: string;
}

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-client.html',
  styleUrls: ['./add-client.css']
})
export class AddClient implements OnInit {
  @ViewChild('clientForm') clientForm!: NgForm;

  activeTab: string = 'client-profile';
  showErrors = false;

  constructor(private http: HttpClient) { }

  tabs = [
    'client-profile',
    'primary-contacts'
  ];

  clientData: any = {
    legalEntityName: '',
    brandName: '',
    country: '',
    state: '',
    city: '',
    street: '',
    zipCode: '',
    natureOfBusiness: '',
    website: '',
    typeOfBusiness: '',

    primaryName: '',
    primaryDesignation: '',
    primaryEmail: '',
    primaryPhone: '',
    phoneCountryCode: '+1',
    technicalContact: '',
    informationSecurityOfficer: '',
    clientSignoff: '',
    clientStatus: ''
  };

  // Data for dropdowns
  allCountries: Country[] = [];
  filteredCountries: Country[] = [];
  allStates: State[] = [];
  filteredStates: State[] = [];
  allCities: string[] = [];
  filteredCities: string[] = [];

  // Country codes data
  allCountryCodes: CountryCode[] = [];
  filteredCountryCodes: CountryCode[] = [];
  showCountryCodeDropdown: boolean = false;
  countryCodeSearch: string = '';

  // Search terms
  countrySearch: string = '';
  stateSearch: string = '';
  citySearch: string = '';

  // Dropdown visibility
  showCountryDropdown: boolean = false;
  showStateDropdown: boolean = false;
  showCityDropdown: boolean = false;

  toggleCountryDropdown() {
    this.showCountryDropdown = !this.showCountryDropdown;
  }

  closeCountryDropdown() {
    this.showCountryDropdown = false;
  }
  closeStateDropdown() {
    this.showStateDropdown = false;
  }
  closeCityDropdown() {
    this.showCityDropdown = false;
  }

  tabRequiredFields: { [key: string]: string[] } = {
    "client-profile": ["legalEntityName", "country", "state", "city", "street", "zipCode", "typeOfBusiness"],
    "primary-contacts": ["primaryName", "primaryDesignation", "primaryEmail", "primaryPhone", "clientSignoff"]
  };

  ngOnInit() {
    this.loadCountries();
    this.loadCountryCodes();
  }

  // Handle clicks outside dropdowns
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.country-dropdown')) {
      this.showCountryDropdown = false;
    }
    if (!target.closest('.state-dropdown')) {
      this.showStateDropdown = false;
    }
    if (!target.closest('.city-dropdown')) {
      this.showCityDropdown = false;
    }
    if (!target.closest('.country-code-dropdown')) {
      this.showCountryCodeDropdown = false;
    }
  }

  // Load all countries from API
  loadCountries() {
    this.http.get<{ data: Country[] }>('https://countriesnow.space/api/v0.1/countries')
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error loading countries:', error);
          return of([]);
        })
      )
      .subscribe(data => {
        this.allCountries = data.sort((a: Country, b: Country) => a.country.localeCompare(b.country));
        this.filteredCountries = [...this.allCountries];
      });
  }

  // Load country codes from API
  loadCountryCodes() {
    // Using REST Countries API for country codes and flags
    this.http.get<any[]>('https://restcountries.com/v3.1/all?fields=name,flags,idd,cca2')
      .pipe(
        map(countries => {
          return countries
            .filter(country => country.idd?.root && country.idd?.suffixes)
            .map(country => {
              const code = country.idd.root + (country.idd.suffixes[0] || '');
              return {
                name: country.name.common,
                code: code,
                flag: this.getFlagEmoji(country.cca2),
                iso2: country.cca2
              };
            })
            .sort((a: CountryCode, b: CountryCode) => a.name.localeCompare(b.name));
        }),
        catchError(error => {
          console.error('Error loading country codes:', error);
          // Fallback to common country codes if API fails
          return of(this.getFallbackCountryCodes());
        })
      )
      .subscribe(data => {
        this.allCountryCodes = data;
        this.filteredCountryCodes = [...data];
      });
  }

  // Helper method to get flag emoji from country code
  private getFlagEmoji(countryCode: string): string {
    if (!countryCode) return '🏳️';

    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
  }

  // Fallback country codes if API fails
  private getFallbackCountryCodes(): CountryCode[] {
    return [
      { name: 'United States', code: '+1', flag: '🇺🇸', iso2: 'US' },
      { name: 'United Kingdom', code: '+44', flag: '🇬🇧', iso2: 'GB' },
      { name: 'Canada', code: '+1', flag: '🇨🇦', iso2: 'CA' },
      { name: 'Australia', code: '+61', flag: '🇦🇺', iso2: 'AU' },
      { name: 'India', code: '+91', flag: '🇮🇳', iso2: 'IN' },
      { name: 'Germany', code: '+49', flag: '🇩🇪', iso2: 'DE' },
      { name: 'France', code: '+33', flag: '🇫🇷', iso2: 'FR' },
      { name: 'China', code: '+86', flag: '🇨🇳', iso2: 'CN' },
      { name: 'Japan', code: '+81', flag: '🇯🇵', iso2: 'JP' },
      { name: 'Brazil', code: '+55', flag: '🇧🇷', iso2: 'BR' },
      { name: 'Russia', code: '+7', flag: '🇷🇺', iso2: 'RU' },
      { name: 'Mexico', code: '+52', flag: '🇲🇽', iso2: 'MX' },
      { name: 'Italy', code: '+39', flag: '🇮🇹', iso2: 'IT' },
      { name: 'Spain', code: '+34', flag: '🇪🇸', iso2: 'ES' }
    ];
  }

  // Open country code dropdown
  openCountryCodeDropdown(event: Event) {
    event.stopPropagation();
    this.showCountryCodeDropdown = true;
    this.countryCodeSearch = '';
    this.filterCountryCodes();
  }

  // Filter country codes based on search
  filterCountryCodes() {
    if (!this.countryCodeSearch) {
      this.filteredCountryCodes = [...this.allCountryCodes];
    } else {
      this.filteredCountryCodes = this.allCountryCodes.filter(country =>
        country.name.toLowerCase().includes(this.countryCodeSearch.toLowerCase()) ||
        country.code.toLowerCase().includes(this.countryCodeSearch.toLowerCase())
      );
    }
  }

  // Select a country code
  selectCountryCode(countryCode: CountryCode) {
    this.clientData.phoneCountryCode = countryCode.code;
    this.showCountryCodeDropdown = false;
  }
  getSelectedCountryCodeFlag(): string {
    if (!this.clientData.phoneCountryCode || this.allCountryCodes.length === 0) {
      return '🇺🇸'; // Default flag
    }
    const selectedCode = this.allCountryCodes.find(
      code => code.code === this.clientData.phoneCountryCode
    );

    return selectedCode?.flag || '🇺🇸';
  }


  // Open country dropdown
  openCountryDropdown(event: Event) {
    event.stopPropagation();
    this.showCountryDropdown = true;
    this.showStateDropdown = false;
    this.showCityDropdown = false;
    this.countrySearch = '';
    this.filterCountries();
  }

  // Filter countries based on search
  filterCountries() {
    if (!this.countrySearch) {
      this.filteredCountries = [...this.allCountries];
    } else {
      this.filteredCountries = this.allCountries.filter(country =>
        country.country.toLowerCase().includes(this.countrySearch.toLowerCase())
      );
    }
  }

  // Select a country
  selectCountry(country: Country) {
    this.clientData.country = country.country;
    this.showCountryDropdown = false;

    // Reset dependent fields
    this.allStates = [];
    this.filteredStates = [];
    this.allCities = [];
    this.filteredCities = [];
    this.clientData.state = '';
    this.clientData.city = '';
    this.stateSearch = '';
    this.citySearch = '';

    // Load states for selected country
    this.loadStates(country.country);
  }

  // Load states for selected country
  loadStates(countryName: string) {
    if (!countryName) return;

    this.http.post<{ data: { states: State[] } }>(
      'https://countriesnow.space/api/v0.1/countries/states',
      { country: countryName }
    )
      .pipe(
        map(response => {
          const states = response.data?.states || [];
          return states.sort((a: State, b: State) => a.name.localeCompare(b.name));
        }),
        catchError(error => {
          console.error('Error loading states:', error);
          return of([]);
        })
      )
      .subscribe(data => {
        this.allStates = data;
        this.filteredStates = [...data];
      });
  }

  // Open state dropdown
  openStateDropdown(event: Event) {
    event.stopPropagation();
    if (this.clientData.country) {
      this.showStateDropdown = true;
      this.showCountryDropdown = false;
      this.showCityDropdown = false;
      this.stateSearch = '';
      this.filterStates();
    }
  }

  // Filter states based on search
  filterStates() {
    if (!this.stateSearch) {
      this.filteredStates = [...this.allStates];
    } else {
      this.filteredStates = this.allStates.filter(state =>
        state.name.toLowerCase().includes(this.stateSearch.toLowerCase())
      );
    }
  }

  // Select a state
  selectState(state: State) {
    this.clientData.state = state.name;
    this.showStateDropdown = false;

    // Reset cities
    this.allCities = [];
    this.filteredCities = [];
    this.clientData.city = '';
    this.citySearch = '';

    // Load cities for selected state
    this.loadCities(this.clientData.country, state.name);
  }

  // Load cities for selected country and state
  loadCities(countryName: string, stateName: string) {
    if (!countryName || !stateName) return;

    this.http.post<{ data: string[] }>(
      'https://countriesnow.space/api/v0.1/countries/state/cities',
      {
        country: countryName,
        state: stateName
      }
    )
      .pipe(
        map(response => {
          const cities = response.data || [];
          return cities.sort((a: string, b: string) => a.localeCompare(b));
        }),
        catchError(error => {
          console.error('Error loading cities:', error);
          return of([]);
        })
      )
      .subscribe(data => {
        this.allCities = data;
        this.filteredCities = [...data];
      });
  }

  // Open city dropdown
  openCityDropdown(event: Event) {
    event.stopPropagation();
    if (this.clientData.state) {
      this.showCityDropdown = true;
      this.showCountryDropdown = false;
      this.showStateDropdown = false;
      this.citySearch = '';
      this.filterCities();
    }
  }

  // Filter cities based on search
  filterCities() {
    if (!this.citySearch) {
      this.filteredCities = [...this.allCities];
    } else {
      this.filteredCities = this.allCities.filter(city =>
        city.toLowerCase().includes(this.citySearch.toLowerCase())
      );
    }
  }

  // Select a city
  selectCity(city: string) {
    this.clientData.city = city;
    this.showCityDropdown = false;
  }

  // ... rest of your existing methods remain exactly the same ...
  // (formatDate, buildPayload, sendClientDataToAPI, etc.)

  // ... rest of your existing methods remain exactly the same ...
  formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }

  private buildPayload(): { [key: string]: any } {
    return {
      legal_entity_name: this.clientData.legalEntityName,
      trading_name: this.clientData.brandName,
      county_name: this.clientData.country,
      state_name: this.clientData.state,
      city_name: this.clientData.city,
      street_name: this.clientData.street,
      zip_name: this.clientData.zipCode,
      nature_of_business: this.clientData.natureOfBusiness,
      website_domain_url: this.clientData.website,
      type_of_business: this.clientData.typeOfBusiness,

      contact_name: this.clientData.primaryName,
      designation: this.clientData.primaryDesignation,
      contact_email: this.clientData.primaryEmail,
      phone: this.clientData.phoneCountryCode + ' ' + this.clientData.primaryPhone, // Combine country code and phone
      technical_contacts: this.clientData.technicalContact,
      information_security_officer: this.clientData.informationSecurityOfficer,
      client_signoff_authority: this.clientData.clientSignoff,
      client_status: this.clientData.clientStatus
    };
  }

  private sendClientDataToAPI(formData: FormData) {
    const url = 'http://pci.accric.com/api/auth/create-client';
    const token = localStorage.getItem("jwt");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    this.http.post(url, formData, { headers }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        alert('Client created successfully!');
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('Failed to create client. Check console for details.');
      }
    });
  }

  validateCurrentTab(form: NgForm): boolean {
    const requiredFields: string[] = this.tabRequiredFields[this.activeTab] || [];

    requiredFields.forEach((fieldName: string) => {
      const control = form.controls[fieldName];
      if (control) {
        control.markAsTouched();
      }
    });

    return requiredFields.every((fieldName: string) => {
      const control = form.controls[fieldName];
      return control && control.valid;
    });
  }

  saveAndContinue(form: NgForm) {
    if (!this.validateCurrentTab(form)) {
      this.showErrors = true;
      return;
    }

    this.showErrors = false;
    const currentIndex = this.tabs.indexOf(this.activeTab);

    if (currentIndex < this.tabs.length - 1) {
      this.activeTab = this.tabs[currentIndex + 1];
    } else {
      this.onSubmit(form);
    }
  }

  switchTab(tabName: string) {
    if (tabName !== this.activeTab) {
      const currentIndex = this.tabs.indexOf(this.activeTab);
      const targetIndex = this.tabs.indexOf(tabName);

      if (targetIndex > currentIndex) {
        if (this.clientForm && !this.validateCurrentTab(this.clientForm)) {
          this.showErrors = true;
          return;
        }
      }

      this.showErrors = false;
      this.activeTab = tabName;
    }
  }

  goBack() {
    const currentIndex = this.tabs.indexOf(this.activeTab);
    if (currentIndex > 0) {
      this.activeTab = this.tabs[currentIndex - 1];
      this.showErrors = false;
    }
  }

  onSubmit(form: NgForm) {
    let allTabsValid = true;

    for (const tab of this.tabs) {
      this.activeTab = tab;
      if (!this.validateCurrentTab(form)) {
        allTabsValid = false;
      }
    }

    if (!allTabsValid) {
      this.activeTab = this.tabs[this.tabs.length - 1];
      this.showErrors = true;
      return;
    }

    this.showErrors = false;

    const payload: { [key: string]: any } = this.buildPayload();
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    this.sendClientDataToAPI(formData);
  }
}