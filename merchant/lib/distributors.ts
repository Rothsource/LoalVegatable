// lib/distributors.ts
import type {
  Distributor,
  DistributorFormValues,
  DistributorRow,
  DistributorStatus,
} from "@/types/distributor";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeDistributorStatus(value: unknown): DistributorStatus {
  const v = stringValue(value).toLowerCase();
  if (v === "active") return "Active";
  if (v === "inactive") return "Inactive";
  return "Pending";
}

export function mapDistributorRow(row: DistributorRow): Distributor {
  const lat = typeof row.latitude === "number" ? row.latitude : row.latitude ? Number(row.latitude) : null;
  const lng = typeof row.longitude === "number" ? row.longitude : row.longitude ? Number(row.longitude) : null;

  return {
    id: stringValue(row.id),
    merchantId: stringValue(row.merchant_id),
    name: stringValue(row.full_name),
    email: stringValue(row.email),
    status: normalizeDistributorStatus(row.status),
    createdAt: stringValue(row.created_at),
    address: typeof row.address === "string" ? row.address : null,
    latitude: lat !== null && !isNaN(lat) ? lat : null,
    longitude: lng !== null && !isNaN(lng) ? lng : null,
  };
}

export function sanitizeDistributorForm(
  values: Partial<DistributorFormValues>
): DistributorFormValues {
  return {
    name: stringValue(values.name),
    email: stringValue(values.email).toLowerCase(),
  };
}

export function validateDistributorForm(values: Partial<DistributorFormValues>) {
  const input = sanitizeDistributorForm(values);

  if (!input.name) return "Distributor name is required.";
  if (!input.email) return "Email address is required.";
  if (!/^[^\s@]+@gmail\.com$/i.test(input.email)) {
    return "Distributor email must be a Gmail address.";
  }

  return null;
}

export function distributorMatchesSearch(distributor: Distributor, query: string) {
  const search = query.trim().toLowerCase();
  if (!search) return true;

  return [distributor.name, distributor.email].some((value) =>
    value.toLowerCase().includes(search)
  );
}