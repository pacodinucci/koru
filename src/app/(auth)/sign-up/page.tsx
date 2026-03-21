import { SignUpView } from "@/modules/auth/views/sign-up-view";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  return <SignUpView searchParams={searchParams} />;
}
