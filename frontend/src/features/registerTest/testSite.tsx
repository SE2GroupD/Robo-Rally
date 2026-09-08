import { ProgramRegister } from '../../shared/components/program-register/ProgramRegister';

export function ProgramRegisterSite() {
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Program Register</h1>
        <ProgramRegister />
      </div>
    </main>
  );
}
