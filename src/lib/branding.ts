import { cache } from "react";
import { apiClient } from "./api/client";

export const getBrandingSettings = cache(async function getBrandingSettings() {
  try {
    const branding = await apiClient.settings.getBranding();
    return {
      foundationName: branding?.foundationName || "Foundation ERP",
      shortName: branding?.shortName || "ERP",
      logo: branding?.logo || null,
      favicon: branding?.favicon || null,
      loginLogo: branding?.loginLogo || null,
      sidebarLogo: branding?.sidebarLogo || null,
      headerLogo: branding?.headerLogo || null,
      timezone: branding?.timezone || "Asia/Dhaka",
      dateFormat: branding?.dateFormat || "DD MMM YYYY",
    };
  } catch (e) {
    return {
      foundationName: "Foundation ERP",
      shortName: "ERP",
      logo: null,
      favicon: null,
      loginLogo: null,
      sidebarLogo: null,
      headerLogo: null,
      timezone: "Asia/Dhaka",
      dateFormat: "DD MMM YYYY",
    };
  }
});
