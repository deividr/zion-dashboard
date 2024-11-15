import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <SignIn signUpUrl="/sign-up" />
    </div>
  );
}
