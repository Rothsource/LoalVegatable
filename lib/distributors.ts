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
  return stringValue(value).toLowerCase() === "inactive" ? "Inactive" : "Active";
}

export function mapDistributorRow(row: DistributorRow): Distributor {
  return {
    id: stringValue(row.id),
    merchantId: stringValue(row.merchant_id),
    name: stringValue(row.full_name),
    email: stringValue(row.email),
    phone: stringValue(row.phone),
    deliveryArea: stringValue(row.delivery_area),
    status: normalizeDistributorStatus(row.status),
    createdAt: stringValue(row.created_at),
  };
}

export function sanitizeDistributorForm(
  values: Partial<DistributorFormValues>
): DistributorFormValues {
  return {
    name: stringValue(values.name),
    email: stringValue(values.email).toLowerCase(),
    phone: stringValue(values.phone),
    deliveryArea: stringValue(values.deliveryArea),
    password: stringValue(values.password),
    status: normalizeDistributorStatus(values.status),
  };
}

export function validateDistributorForm(
  values: Partial<DistributorFormValues>,
  options: { requirePassword?: boolean } = {}
) {
  const input = sanitizeDistributorForm(values);

  if (!input.name) return "Distributor name is required.";
  if (!input.email) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Enter a valid email address.";
  }
  if (options.requirePassword && !input.password) {
    return "A temporary password is required.";
  }
  if (input.password && input.password.length < 8) {
    return "Temporary password must be at least 8 characters.";
  }

  return null;
}

export function distributorMatchesSearch(distributor: Distributor, query: string) {
  const search = query.trim().toLowerCase();
  if (!search) return true;

  return [
    distributor.name,
    distributor.email,
    distributor.phone,
    distributor.deliveryArea,
  ].some((value) => value.toLowerCase().includes(search));
}
