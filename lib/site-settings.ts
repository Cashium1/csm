import { getDatabase } from "@/lib/db";

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  customerEmail: string;
  customerServiceHours: string;
  companyName: string;
  representativeName: string;
  businessNumber: string;
  ecommerceRegistrationNumber: string;
  businessAddress: string;
  phoneNumber: string;
  footerCopyright: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;
  faviconUrl: string;
  termsUrl: string;
  privacyUrl: string;
  refundPolicyUrl: string;
  updatedAt: string;
};

type Row = {
  site_name: string;
  site_description: string;
  customer_email: string;
  customer_service_hours: string;
  company_name: string;
  representative_name: string;
  business_number: string;
  ecommerce_registration_number: string;
  business_address: string;
  phone_number: string;
  footer_copyright: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url: string;
  favicon_url: string;
  terms_url: string;
  privacy_url: string;
  refund_policy_url: string;
  updated_at: string;
};

function rowToSettings(row: Row): SiteSettings {
  return {
    siteName: row.site_name,
    siteDescription: row.site_description,
    customerEmail: row.customer_email,
    customerServiceHours: row.customer_service_hours,
    companyName: row.company_name,
    representativeName: row.representative_name,
    businessNumber: row.business_number,
    ecommerceRegistrationNumber: row.ecommerce_registration_number,
    businessAddress: row.business_address,
    phoneNumber: row.phone_number,
    footerCopyright: row.footer_copyright,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    ogImageUrl: row.og_image_url,
    faviconUrl: row.favicon_url,
    termsUrl: row.terms_url,
    privacyUrl: row.privacy_url,
    refundPolicyUrl: row.refund_policy_url,
    updatedAt: row.updated_at,
  };
}

export function getSiteSettings(): SiteSettings {
  const row = getDatabase()
    .prepare(`SELECT * FROM site_settings WHERE id = 1`)
    .get() as Row | undefined;
  if (row) return rowToSettings(row);
  return {
    siteName: "캐쉬움",
    siteDescription: "",
    customerEmail: "",
    customerServiceHours: "",
    companyName: "",
    representativeName: "",
    businessNumber: "",
    ecommerceRegistrationNumber: "",
    businessAddress: "",
    phoneNumber: "",
    footerCopyright: "© 2026 캐쉬움",
    metaTitle: "캐쉬움",
    metaDescription: "",
    metaKeywords: "",
    ogImageUrl: "",
    faviconUrl: "",
    termsUrl: "/terms",
    privacyUrl: "/privacy",
    refundPolicyUrl: "/refund-policy",
    updatedAt: new Date().toISOString(),
  };
}

export type SiteSettingsInput = Omit<SiteSettings, "updatedAt">;

export function updateSiteSettings(input: SiteSettingsInput) {
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `UPDATE site_settings SET
        site_name = ?, site_description = ?, customer_email = ?, customer_service_hours = ?,
        company_name = ?, representative_name = ?, business_number = ?,
        ecommerce_registration_number = ?, business_address = ?, phone_number = ?,
        footer_copyright = ?, meta_title = ?, meta_description = ?, meta_keywords = ?,
        og_image_url = ?, favicon_url = ?,
        terms_url = ?, privacy_url = ?, refund_policy_url = ?,
        updated_at = ?
       WHERE id = 1`,
    )
    .run(
      input.siteName,
      input.siteDescription,
      input.customerEmail,
      input.customerServiceHours,
      input.companyName,
      input.representativeName,
      input.businessNumber,
      input.ecommerceRegistrationNumber,
      input.businessAddress,
      input.phoneNumber,
      input.footerCopyright,
      input.metaTitle,
      input.metaDescription,
      input.metaKeywords,
      input.ogImageUrl,
      input.faviconUrl,
      input.termsUrl,
      input.privacyUrl,
      input.refundPolicyUrl,
      now,
    );
  return { ok: true as const };
}
