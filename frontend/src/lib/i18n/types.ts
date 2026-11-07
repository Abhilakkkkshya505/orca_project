export interface TranslationSchema {
  nav: {
    explore: string;
    ports: string;
    risk: string;
    methodology: string;
    about: string;
    status: string;
    dashboard: string;
    locations: string;
    alerts: string;
    advisories: string;
    settings: string;
    signIn: string;
    getStarted: string;
    signOut: string;
    live: string;
    game: string;
  };
  common: {
    save: string;
    saving: string;
    cancel: string;
    close: string;
    search: string;
    filter: string;
    loading: string;
    retry: string;
    delete: string;
    confirm: string;
    back: string;
    next: string;
    language: string;
    selectLanguage: string;
    searchLanguage: string;
    allLanguages: string;
    rtl: string;
    offline: string;
    online: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    signInBtn: string;
    createAccount: string;
    noAccount: string;
    haveAccount: string;
    signupTitle: string;
    signupSubtitle: string;
    displayName: string;
    vesselType: string;
    registerBtn: string;
    resetPasswordTitle: string;
    verifyEmailTitle: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    activeAdvisories: string;
    monitoredPorts: string;
    safetyStatus: string;
    telemetryFreshness: string;
    recentAlerts: string;
    quickActions: string;
    exploreMap: string;
    manageAlerts: string;
    addPort: string;
  };
  settings: {
    title: string;
    subtitle: string;
    profileTab: string;
    languageSection: string;
    languageDescription: string;
    currentLanguage: string;
    vesselClass: string;
    units: string;
    metric: string;
    nautical: string;
    imperial: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    dangerZone: string;
    deleteAccount: string;
    deleteWarning: string;
  };
  alerts: {
    title: string;
    subtitle: string;
    createRule: string;
    noRules: string;
    waveHeight: string;
    windSpeed: string;
    triggerNotice: string;
  };
  advisories: {
    title: string;
    subtitle: string;
    bulletin: string;
    severity: string;
    source: string;
    validUntil: string;
  };
  locations: {
    title: string;
    subtitle: string;
    addLocation: string;
    coordinates: string;
  };
  explore: {
    title: string;
    subtitle: string;
    layers: string;
    weather: string;
    bathymetry: string;
    hazards: string;
  };
  ports: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    safetyIndex: string;
  };
  compare: {
    title: string;
    subtitle: string;
    selectVessel: string;
    calculate: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    dataSource: string;
    physics: string;
  };
  about: {
    title: string;
    subtitle: string;
    mission: string;
    partners: string;
  };
  legal: {
    privacyTitle: string;
    termsTitle: string;
    cookieTitle: string;
    accessibilityTitle: string;
    disclaimer: string;
  };
  footer: {
    tagline: string;
    allRightsReserved: string;
    switchLanguage: string;
    privacy: string;
    terms: string;
    cookies: string;
    accessibility: string;
    status: string;
  };
  notifications: {
    languageChanged: string;
    rtlEnabled: string;
    ltrEnabled: string;
    cookieConsent: string;
    acceptCookies: string;
    cookieSettings: string;
  };
}
