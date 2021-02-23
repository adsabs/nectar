import { Thing } from "components";

export default function Home() {
  return (
    <div>
      env: {process.env.NEXT_PUBLIC_TEST}
      <Thing />
    </div>
  );
}
