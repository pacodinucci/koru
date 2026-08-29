import { SignInView } from "@/modules/auth/views/sign-in-view";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  return <SignInView searchParams={searchParams} />;
}
