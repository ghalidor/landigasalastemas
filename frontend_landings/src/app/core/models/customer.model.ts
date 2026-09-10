export interface Customer {
  id: number;
  docType: string;
  docNumber: string;
  firstName: string;
  lastNameFather: string;
  lastNameMother?: string;
  gender: string;
  nationality: string;
  phoneCode: string;
  phoneNumber: string;
  originName: string;
  registrationDate: string;
  authWhatsApp: boolean;
  authSMS: boolean;
  authEmail: boolean;
  noAutorizo: boolean;
}

export interface RegisterPayload {
  venueId: number;
  originId: string;
  docType: string;
  docNumber: string;
  firstName: string;
  lastNameFather: string;
  lastNameMother: string;
  birthDate: string;
  gender: string;
  nationality: string;
  phoneCode: string;
  phoneNumber: string;
  hasAuthorized: boolean;
  authChannels: string[];
}
