import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const initialError = params.error === "distributor-access"
    ? "This distributor account is inactive or is no longer linked to a merchant. Contact your merchant for access."
    : "";
  return <LoginForm initialError={initialError} />;
}
